import { APP_TIMEZONE, BakeryLedgerEntry, BakeryState, DomainError, newId } from "../domain";
import { ownedLevel } from "./bakeryBusiness";

export const PROOFING_SCHEDULE_UPGRADE_ID = "proofing-schedule";
export const PROOFING_SCHEDULE_MAX_LEVEL = 6;

export interface SydneyWallClockPosition {
  localDate: string;
  millisecondsIntoDay: number;
}

export interface ProofingWindow {
  scheduleLevel: number;
  windowCount: number;
  index: number;
  startMs: number;
  endMs: number;
  rewardKey: string;
}

export type ProofingSegmentState =
  | "claimed"
  | "current-available"
  | "current-claimed"
  | "expired-unclaimed"
  | "future";

export interface ProofingDaySegment extends ProofingWindow {
  state: ProofingSegmentState;
}

export function sydneyWallClockPosition(at = new Date()): SydneyWallClockPosition {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
    hourCycle: "h23",
  }).formatToParts(at);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const hour = Number(values.hour ?? 0);
  const minute = Number(values.minute ?? 0);
  const second = Number(values.second ?? 0);
  const millisecond = Number(values.fractionalSecond ?? 0);
  return {
    localDate: `${values.year}-${values.month}-${values.day}`,
    millisecondsIntoDay: (((hour * 60 + minute) * 60 + second) * 1000) + millisecond,
  };
}

export function nextSydneyLocalDate(at = new Date()): string {
  const parts = sydneyWallClockPosition(at);
  const utcNoon = new Date(`${parts.localDate}T12:00:00.000Z`);
  utcNoon.setUTCDate(utcNoon.getUTCDate() + 1);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(utcNoon);
}

export function activeProofingScheduleLevel(bakery: BakeryState, at = new Date()): number {
  return activeProofingScheduleLevelForDate(bakery, sydneyWallClockPosition(at).localDate);
}

export function activeProofingScheduleLevelForDate(bakery: BakeryState, localDate: string): number {
  const paidLevel = bakery.purchasedUpgrades
    .filter((upgrade) => upgrade.upgradeId === PROOFING_SCHEDULE_UPGRADE_ID)
    .filter((upgrade) => (upgrade.effectiveLocalDate ?? "") <= localDate)
    .reduce((level, upgrade) => Math.max(level, upgrade.level), 0);
  return Math.max(1, Math.min(PROOFING_SCHEDULE_MAX_LEVEL, paidLevel + 1));
}

export function purchasedProofingScheduleLevel(bakery: BakeryState): number {
  return Math.max(1, Math.min(PROOFING_SCHEDULE_MAX_LEVEL, ownedLevel(bakery.purchasedUpgrades, PROOFING_SCHEDULE_UPGRADE_ID) + 1));
}

export function pendingProofingActivationDate(bakery: BakeryState, at = new Date()): string | null {
  const today = sydneyWallClockPosition(at).localDate;
  return bakery.purchasedUpgrades
    .filter((upgrade) => upgrade.upgradeId === PROOFING_SCHEDULE_UPGRADE_ID)
    .map((upgrade) => upgrade.effectiveLocalDate)
    .filter((date): date is string => Boolean(date && date > today))
    .sort()[0] ?? null;
}

export function proofingWindowForTimestamp(bakery: BakeryState, at = new Date()): ProofingWindow {
  const position = sydneyWallClockPosition(at);
  const level = activeProofingScheduleLevelForDate(bakery, position.localDate);
  return proofingWindowAt(position.localDate, position.millisecondsIntoDay, level);
}

export function proofingWindowAt(localDate: string, millisecondsIntoDay: number, level: number): ProofingWindow {
  const windowCount = Math.max(1, Math.min(PROOFING_SCHEDULE_MAX_LEVEL, Math.floor(level)));
  const length = 86_400_000 / windowCount;
  const index = Math.min(windowCount - 1, Math.max(0, Math.floor(millisecondsIntoDay / length)));
  const startMs = Math.round(index * length);
  const endMs = Math.round((index + 1) * length) - 1;
  return {
    scheduleLevel: windowCount,
    windowCount,
    index,
    startMs,
    endMs,
    rewardKey: proofingWindowRewardKey(localDate, windowCount, index),
  };
}

export function proofingWindowRewardKey(localDate: string, windowCount: number, index: number): string {
  return `daily-dough:${localDate}:schedule-${windowCount}:window-${index}`;
}

export function proofingWindowsForDate(localDate: string, level: number): ProofingWindow[] {
  const count = Math.max(1, Math.min(PROOFING_SCHEDULE_MAX_LEVEL, Math.floor(level)));
  return Array.from({ length: count }, (_, index) => proofingWindowAt(localDate, index * (86_400_000 / count), count));
}

export function isProofingRewardReversed(bakery: BakeryState, reward: BakeryLedgerEntry): boolean {
  return bakery.rewardLedger.some((entry) => entry.type === "reward-reversal" && entry.source === reward.id);
}

export function proofingWindowClaimed(bakery: BakeryState, window: ProofingWindow, localDate: string): boolean {
  const keys = [window.rewardKey];
  if (window.windowCount === 1) keys.push(`daily-dough:${localDate}`);
  return bakery.rewardLedger.some((entry) =>
    entry.type === "productivity-reward"
    && entry.itemId === "dough"
    && keys.includes(entry.idempotencyKey ?? "")
    && !isProofingRewardReversed(bakery, entry)
  );
}

export function proofingDaySegments(bakery: BakeryState, at = new Date()): ProofingDaySegment[] {
  const position = sydneyWallClockPosition(at);
  const level = activeProofingScheduleLevelForDate(bakery, position.localDate);
  return proofingWindowsForDate(position.localDate, level).map((window) => {
    const claimed = proofingWindowClaimed(bakery, window, position.localDate);
    const current = position.millisecondsIntoDay >= window.startMs && position.millisecondsIntoDay <= window.endMs;
    const expired = position.millisecondsIntoDay > window.endMs;
    const state: ProofingSegmentState = claimed
      ? current ? "current-claimed" : "claimed"
      : current ? "current-available" : expired ? "expired-unclaimed" : "future";
    return { ...window, state };
  });
}

export function nextProofingBoundary(bakery: BakeryState, at = new Date()): number | null {
  const current = proofingWindowForTimestamp(bakery, at);
  return current.index < current.windowCount - 1 ? current.endMs + 1 : null;
}

export function formatProofingTime(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function formatProofingWindow(window: ProofingWindow): string {
  return `${formatProofingTime(window.startMs)}-${formatProofingTime(window.endMs)}`;
}

export function formatProofingWindowLength(level: number): string {
  const minutes = 1440 / level;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!remainder) return `${hours}-hour windows`;
  return `${hours}-hour ${remainder}-minute windows`;
}

export function applyDoughWindowClaim(bakery: BakeryState, sourceTaskId: string, operationId: string, now = new Date()): { bakery: BakeryState; reward: BakeryLedgerEntry | null; window: ProofingWindow } {
  const position = sydneyWallClockPosition(now);
  const window = proofingWindowForTimestamp(bakery, now);
  if (proofingWindowClaimed(bakery, window, position.localDate)) return { bakery, reward: null, window };
  const reward: BakeryLedgerEntry = {
    id: newId("bakery_tx"),
    operationId,
    type: "productivity-reward",
    itemId: "dough",
    amount: 1,
    source: `task:${sourceTaskId}`,
    timestamp: now.toISOString(),
    idempotencyKey: window.rewardKey,
  };
  return {
    bakery: {
      ...bakery,
      balances: { ...bakery.balances, dough: (bakery.balances.dough ?? 0) + 1 },
    },
    reward,
    window,
  };
}

export function reverseDoughWindowClaimsSafely(bakery: BakeryState, rewards: readonly BakeryLedgerEntry[], operationId: string, now = new Date()): { bakery: BakeryState; reversals: BakeryLedgerEntry[] } {
  const doughRewards = rewards.filter((reward) => reward.itemId === "dough" && reward.amount > 0 && !isProofingRewardReversed(bakery, reward));
  const total = doughRewards.reduce((sum, reward) => sum + reward.amount, 0);
  if (total > (bakery.balances.dough ?? 0)) throw new DomainError("The earned Bakery resources have already been used.");
  const reversals = doughRewards.map((reward) => ({
    id: newId("bakery_tx"),
    operationId,
    type: "reward-reversal",
    itemId: reward.itemId,
    amount: -reward.amount,
    source: reward.id,
    timestamp: now.toISOString(),
    idempotencyKey: `reverse:${reward.id}`,
  }));
  return {
    bakery: {
      ...bakery,
      balances: { ...bakery.balances, dough: (bakery.balances.dough ?? 0) - total },
    },
    reversals,
  };
}

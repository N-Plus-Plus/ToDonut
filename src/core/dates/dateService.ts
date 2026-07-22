import { APP_TIMEZONE } from "../../domain";

export function localDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function parseAustralianDate(value: string): { valid: true; date: string } | { valid: false; message: string } {
  const trimmed = value.trim();
  if (!trimmed) return { valid: false, message: "Enter a date or leave it blank." };
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(trimmed);
  if (!match) return { valid: false, message: "Use D/M/YY or DD/MM/YYYY." };
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = match[3].length === 2 ? 2000 + Number(match[3]) : Number(match[3]);
  if (day < 1 || month < 1 || month > 12) return { valid: false, message: "Use a real calendar date." };
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day > daysInMonth) return { valid: false, message: "Use a real calendar date." };
  return { valid: true, date: `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}` };
}

export function formatAustralianDate(date: string | null): string {
  if (!date) return "";
  const [year, month, day] = date.split("-");
  return `${Number(day)}/${Number(month)}/${year}`;
}

export function addDateDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function mondayOfWeek(date: string): string {
  const value = new Date(`${date}T00:00:00Z`);
  const day = value.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  return addDateDays(date, offset);
}

export interface NineWeekDateCell {
  date: string;
  day: number;
  middleMonth: boolean;
  today: boolean;
  selected: boolean;
}

export function nineWeekDateGrid(today = localDateString(), selected: string | null = null, windowStart = mondayOfWeek(today)): NineWeekDateCell[] {
  const dates = Array.from({ length: 63 }, (_, index) => addDateDays(windowStart, index));
  const middle = dates[31].slice(0, 7);
  return dates.map((date) => ({ date, day: Number(date.slice(8, 10)), middleMonth: date.startsWith(middle), today: date === today, selected: date === selected }));
}

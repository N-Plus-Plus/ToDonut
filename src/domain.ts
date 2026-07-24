import { BAKERY_MARKET_SCHEMA_VERSION, ProductMarketState, createProductMarket, marketConfigFor } from "./domain/bakeryMarket";
import { ALL_RESOURCE_IDS, BAKERY_CATALOGUE_SCHEMA_VERSION, discoverableRecipeIds } from "./domain/bakeryCatalogue";
import { normaliseLucideIconName } from "./core/icons/lucideIconTokens";

export const SCHEMA_VERSION = 10;
export const EXPORT_FORMAT_ID = "todonut.full-fidelity";
export const EXPORT_FORMAT_VERSION = 1;
export const APP_TIMEZONE = "Australia/Sydney";

export type EntityKind = "area" | "project" | "task" | "referenceList" | "referenceListEntry" | "recurrenceRule" | "recurrenceGeneration" | "viewPreference" | "appSettings" | "tag" | "tagGroup" | "status" | "priority" | "quantifierDefinition";
export type TaskLocation = { type: "inbox" } | { type: "someday" } | { type: "area"; areaId: string } | { type: "project"; projectId: string };
export type TagScope = "task" | "project" | "referenceList";
export type ReferenceListLocation = { type: "loose" } | { type: "area"; areaId: string } | { type: "project"; projectId: string };

export interface RecordMeta { id: string; createdAt: string; updatedAt: string; version: number; deletedAt: string | null }
export interface Area extends RecordMeta { kind: "area"; title: string; description: string; color: string; icon: string; order: number; archivedAt: string | null }
export type QuantifierSelections = Record<string, string>;
export interface QuantifierOption { id: string; name: string; iconNames: string[]; color: string | null; order: number }
export interface QuantifierDefinition extends RecordMeta { kind: "quantifierDefinition"; name: string; icon: "zap" | "component"; order: number; options: QuantifierOption[] }
export interface Project extends RecordMeta { kind: "project"; title: string; description: string; color: string; icon: string; areaId: string | null; statusId: string; order: number; completedAt: string | null; cancelledAt: string | null; archivedAt: string | null; taskPresentation: "compact" | "detailed"; tagIds: string[]; quantifierSelections: QuantifierSelections }
export interface ReferenceList extends RecordMeta { kind: "referenceList"; title: string; location: ReferenceListLocation; areaId: string | null; projectId: string | null; order: number; archivedAt: string | null; content: ReferenceListContent; tagIds: string[]; quantifierSelections: QuantifierSelections; color: string | null; icon: string }
export interface ReferenceListContent { type: "plainItems"; items: Array<{ id: string; text: string; order: number }> }
export interface ReferenceListEntry extends RecordMeta { kind: "referenceListEntry"; referenceListId: string; text: string; link: string | null; orderKey: string; tagIds: string[] }
export interface Status extends RecordMeta { kind: "status"; name: string; color: string; icon: string; category: "active" | "completed" | "cancelled"; order: number }
export const STATUS_ICON_OPTIONS = ["circle-x", "circle-plus", "circle-user-round", "circle-play", "circle-stop", "circle-alert", "circle-minus", "circle-pause", "circle-power", "circle-dot", "circle-star", "circle-slash", "circle-dashed", "circle-small"] as const;
export interface Priority extends RecordMeta { kind: "priority"; name: string; color: string; icon: string; rank: 1 | 2 | 3 | 4 | 5 }
export interface Tag extends RecordMeta { kind: "tag"; name: string; description: string; color: string; allowedScopes: TagScope[]; tagGroupId: string | null; order: number }
export interface TagGroup extends RecordMeta { kind: "tagGroup"; name: string; description: string; color: string | null; mutuallyExclusive: boolean; inherited: Record<string, boolean>; order: number }
export interface ChecklistItem { id: string; text: string; checked: boolean; order: number; createdAt: string; updatedAt: string }
export interface GeneratedTaskProvenance { ruleId: string; occurrenceKey: string; occurrenceDate: string; generationOperationId: string; scheduleLabel: string; collapsedCount?: number; firstMissedDate?: string; lastMissedDate?: string }
export interface Task extends RecordMeta { kind: "task"; title: string; description: string; statusId: string; priorityId: string; scheduledDate: string | null; revealDate: string | null; location: TaskLocation; parentTaskId: string | null; childTaskIds: string[]; order: number; tagIds: string[]; quantifierSelections: QuantifierSelections; mustDoToday: boolean; aggregate: boolean; completedAt: string | null; cancelledAt: string | null; checklist: ChecklistItem[]; recurrence?: GeneratedTaskProvenance | null }
export interface ActivityEvent { id: string; entityKind: EntityKind; entityId: string; type: "created" | "titleChanged" | "descriptionChanged" | "moved" | "scheduledDateChanged" | "revealDateChanged" | "priorityChanged" | "statusChanged" | "tagsChanged" | "quantifiersChanged" | "completed" | "cancelled" | "restored" | "softDeleted" | "archived" | "unarchived" | "detached" | "fallbackApplied" | "aggregateCompleted" | "aggregateConverted" | "aggregateClosed" | "aggregateReopened" | "checklistItemAdded" | "checklistItemEdited" | "checklistItemChecked" | "checklistItemReordered" | "checklistItemDeleted" | "referenceEntriesAdded" | "referenceEntriesReordered" | "recurrenceGenerated" | "recurrenceCollapsed" | "recurrencePaused" | "recurrenceResumed" | "recurrenceAttention" | "undo" | "colorChanged" | "iconChanged" | "orderChanged" | "semanticChanged" | "defaultChanged" | "statusMigration" | "scopeChanged" | "groupChanged" | "conflictRepaired"; at: string; summary: string; oldValue?: unknown; newValue?: unknown }
export interface AppSettings { upcomingDays: number; timezone: string; backendProvider: "local-development" | "supabase"; defaultPriorityId: string }
export type StandardViewId = "today" | "upcoming" | "inbox" | "projects" | "lists" | "all" | "tasks" | "project-detail" | "area-detail" | "overdue" | "someday" | "trash" | "recurrence" | "settings" | "diagnostics" | "bakery";
export type TaskSortField = "default" | "scheduledDate" | "priority" | "manual" | "title";
export type TaskGroupingField = "none" | "area" | "project" | "status" | "priority" | "scheduledDate" | "tag";
export interface ViewPreference extends RecordMeta { kind: "viewPreference"; viewId: StandardViewId; sort: TaskSortField; grouping: TaskGroupingField; presentation: "compact" | "detailed"; showClosed: boolean; collapsedKeys: string[] }
export type RecurrenceFrequency = "daily" | "weekly" | "monthly";
export interface RecurrenceTaskTemplate { title: string; description: string; statusId: string; priorityId: string; location: TaskLocation; revealDate: string | null; tagIds: string[]; quantifierSelections?: QuantifierSelections; mustDoToday: boolean; dueOnOccurrence?: boolean; checklist?: ChecklistItem[] }
export type RecurrenceAttentionReason = "missingDestination" | "deletedDestination" | "archivedProject" | "completedProject" | "invalidConfiguration";
export interface RecurrenceRule extends RecordMeta { kind: "recurrenceRule"; label: string; active: boolean; frequency: RecurrenceFrequency; interval: number; weekdays: number[]; dayOfMonth: number | null; firstScheduledDate: string; endDate: string | null; lastGeneratedDate: string | null; nextBoundaryDate: string; template: RecurrenceTaskTemplate; pausedAt?: string | null; lastProcessedOccurrenceKey?: string | null; lastSuccessfulProcessingAt?: string | null; attention?: { reason: RecurrenceAttentionReason; message: string; since: string } | null }
export interface RecurrenceGeneration extends RecordMeta { kind: "recurrenceGeneration"; ruleId: string; occurrenceDate: string; taskId: string; occurrenceKey?: string; collapsedCount?: number; firstMissedDate?: string; lastMissedDate?: string; operationId?: string }
export interface BakeryLedgerEntry { id: string; operationId: string; type: string; itemId: string; amount: number; source: string; timestamp: string; idempotencyKey?: string }
export interface SaleContract { id:string; productId:string; askingPrice:number; marketPrice:number; demandAtListing?:number; listedAt:string; durationMs:number; completesAt:string; completionIdempotencyKey:string; state:"active"; slotId?:string }
export interface PurchasedUpgrade { upgradeId:string; level:number; purchasedAt:string; operationId:string; effectiveLocalDate?: string }
export interface DisplaySlotState { id:string; unlocked:boolean; stack:null|{productId:string;reservedQuantity:number;strategy:"quick"|"market"|"premium"} }
export interface DisplayQueueEntry { id:string; productId:string; strategy:"quick"|"market"|"premium"; queuedAt:string; order:number }
export interface ActiveCampaignEffect { id:string; campaignId:string; targetProductId:string|null; startsAt:string; endsAt:string; operationId:string }
export interface ProductSpotlightEffect { id:string; productId:string; purchasedAt:string; operationId:string }
export interface MarketPriceObservation { id:string; productId:string; observedAt:string; roundedMarketPrice:number; reason:"ledger-start"|"market-change"|"daily-observation"|"contract-created"|"sale-completed"|"campaign"|"upgrade" }
export interface ProductSalesStatistics { lifetimeUnitsBaked:number; lifetimeUnitsSold:number; lifetimeCoinRevenue:number; completedSalePriceTotal:number; marketPriceAtListingTotal:number; completedSaleDurationTotalMs:number; highestCompletedSalePrice:number|null; fastestCompletedNonImmediateSaleMs:number|null; longestCompletedSaleMs:number|null; lastSaleAt:string|null; belowMarketSales:number; atMarketSales:number; aboveMarketSales:number }
export interface MilestoneCompletion { milestoneId:string; completedAt:string; idempotencyKey:string; rewardTransactionId:string; compatibilityAward:boolean }
export interface BakeryStatistics { lifetimeSugarEarned:number; lifetimeCoinEarned: number; lifetimeCoinSpent:number; totalDonutsCrafted: number; totalDonutsSold: number; removedContracts: number; completedContracts:number; returnedProducts:number; campaignsPurchased:number; upgradeLevelsPurchased:number; bakedByProduct: Record<string, number>; soldByProduct: Record<string, number>; coinByProduct: Record<string, number>; productSales:Record<string,ProductSalesStatistics>; ingredientsPurchasedByType: Record<string, number>; coinSpentOnSuppliers: number; coinSpentOnIngredients: number; coinSpentOnRecipes: number; coinSpentOnAdvertising:number; coinSpentOnUpgrades:number; recipesRevealed: number; recipesUnlocked: number; suppliersUnlocked: number; highestCompletedAskingPrice: number; lastCompletedSaleAt: string | null; lastSaleResolutionAt: string | null }
export interface BakeryState { schemaVersion:number; catalogueSchemaVersion:number; marketConfigVersion:number; balanceDataVersion:number; productMarkets:ProductMarketState[]; marketPriceObservations:MarketPriceObservation[]; balances:Record<string,number>; finishedProducts:Record<string,number>; unlockedSupplierIds:string[]; unlockedRecipeIds:string[]; revealedRecipeIds:string[]; purchasedIngredientIds:string[]; activeContracts:SaleContract[]; rewardLedger:BakeryLedgerEntry[]; resourceTransactions:BakeryLedgerEntry[]; completedSaleIds:string[]; completedMilestones:MilestoneCompletion[]; statistics:BakeryStatistics; purchasedUpgrades:PurchasedUpgrade[]; displaySlots:DisplaySlotState[]; displayQueue:DisplayQueueEntry[]; activeCampaigns:ActiveCampaignEffect[]; productSpotlights:ProductSpotlightEffect[]; foundationCapabilities:string[]; savedPriceStrategies:Record<string,"quick"|"market"|"premium">; favouriteRecipeIds:string[] }
export interface AppData { areas: Area[]; projects: Project[]; tasks: Task[]; referenceLists: ReferenceList[]; referenceListEntries: ReferenceListEntry[]; statuses: Status[]; priorities: Priority[]; tags: Tag[]; tagGroups: TagGroup[]; quantifierDefinitions: QuantifierDefinition[]; recurrenceRules: RecurrenceRule[]; recurrenceGenerations: RecurrenceGeneration[]; viewPreferences: ViewPreference[]; activity: ActivityEvent[]; settings: AppSettings; bakery: BakeryState }
export interface ExportBuildMetadata { buildId: string | null; buildTimestamp: string | null; sourceCommit: string | null }
export interface ExportEnvelope { format: typeof EXPORT_FORMAT_ID; formatVersion: typeof EXPORT_FORMAT_VERSION; applicationVersion: string; schemaVersion: number; exportedAt: string; timezone: string; build: ExportBuildMetadata; domain: AppData; providerMetadata: { provider: AppSettings["backendProvider"]; trustedSessionMetadata: "excluded"; snapshotConfirmedSynchronised: boolean; canonicalRevision: number | null } }
export type MutableRecord = Area | Project | Task | ReferenceList | ReferenceListEntry | Status | Priority | Tag | TagGroup | QuantifierDefinition | RecurrenceRule | RecurrenceGeneration | ViewPreference;
export type CollectionName = Exclude<keyof AppData, "activity" | "settings" | "bakery">;

export class DomainError extends Error { constructor(message: string) { super(message); this.name = "DomainError"; } }
export const nowIso = () => new Date().toISOString();
export function localDate(date = new Date()): string { const parts = new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date); const values = Object.fromEntries(parts.map((part) => [part.type, part.value])); return `${values.year}-${values.month}-${values.day}`; }
export function newId(prefix: string): string { if (globalThis.crypto?.randomUUID) return `${prefix}_${globalThis.crypto.randomUUID()}`; return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`; }
export function createMeta(prefix: string): RecordMeta { const at = nowIso(); return { id: newId(prefix), createdAt: at, updatedAt: at, version: 1, deletedAt: null }; }
export const QUANTIFIER_IDS = { energy: "quantifier_energy", context: "quantifier_context" } as const;
export function createDefaultQuantifierDefinitions(): QuantifierDefinition[] {
  const at = "2026-07-22T00:00:00.000Z";
  const meta = (id: string): RecordMeta => ({ id, createdAt: at, updatedAt: at, version: 1, deletedAt: null });
  return [
    { ...meta(QUANTIFIER_IDS.energy), kind: "quantifierDefinition", name: "Energy", icon: "zap", order: 1, options: ["Relaxed", "Low Energy", "Medium Energy", "High Energy", "It's a Whole Thing"].map((name, index) => ({ id: `energy_${index + 1}`, name, iconNames: [], color: null, order: index + 1 })) },
    { ...meta(QUANTIFIER_IDS.context), kind: "quantifierDefinition", name: "Context", icon: "component", order: 2, options: ["Home", "Work", "Outing", "Mental", "Digital", "Relationship"].map((name, index) => ({ id: `context_${index + 1}`, name, iconNames: [], color: null, order: index + 1 })) },
  ];
}
export function orderedQuantifierDefinitions(data: AppData): QuantifierDefinition[] { return data.quantifierDefinitions.filter((definition) => !definition.deletedAt).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)); }
export function normaliseQuantifierSelections(definitions: QuantifierDefinition[], selections?: QuantifierSelections): QuantifierSelections {
  if (!selections) return {};
  return Object.fromEntries(definitions.filter((definition) => !definition.deletedAt).flatMap((definition) => definition.options.some((option) => option.id === selections[definition.id]) ? [[definition.id, selections[definition.id]]] : []));
}
export interface QuantifierDefinitionInput { name: string; options: Array<{ id?: string; name: string; iconNames?: string[]; color?: string | null }> }
export function updateQuantifierDefinitionCommand(data: AppData, definitionId: string, input: QuantifierDefinitionInput): AppData {
  const definition = data.quantifierDefinitions.find((candidate) => candidate.id === definitionId && !candidate.deletedAt);
  if (!definition) throw new DomainError("Quantifier not found.");
  const name = input.name.trim();
  if (!name) throw new DomainError("Quantifier name is required.");
  if (data.quantifierDefinitions.some((candidate) => candidate.id !== definitionId && !candidate.deletedAt && candidate.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase())) throw new DomainError("Quantifier names must be unique.");
  const optionNames = input.options.map((option) => option.name.trim());
  if (optionNames.some((optionName) => !optionName)) throw new DomainError("Quantifier option names cannot be blank.");
  if (new Set(optionNames.map((optionName) => optionName.toLocaleLowerCase())).size !== optionNames.length) throw new DomainError("Quantifier option names must be unique.");
  const existingIds = new Set(definition.options.map((option) => option.id));
  const usedIds = new Set<string>();
  const options = input.options.map((option, index): QuantifierOption => {
    const requestedId = option.id && existingIds.has(option.id) && !usedIds.has(option.id) ? option.id : newId("quantifier-option");
    usedIds.add(requestedId);
    const existingOption = definition.options.find((candidate) => candidate.id === requestedId);
    const iconNames = (option.iconNames ?? existingOption?.iconNames ?? []).map(normaliseLucideIconName).filter(Boolean);
    const malformedIconNames = iconNames.filter((iconName) => !/^[a-z0-9-]+$/.test(iconName));
    if (malformedIconNames.length) throw new DomainError(`Invalid Lucide icon reference${malformedIconNames.length === 1 ? "" : "s"}: ${[...new Set(malformedIconNames)].join(", ")}.`);
    return { id: requestedId, name: optionNames[index], iconNames, color: option.color === undefined ? existingOption?.color ?? null : option.color, order: index + 1 };
  });
  const updated: QuantifierDefinition = { ...definition, name, options, updatedAt: nowIso(), version: definition.version + 1 };
  const definitions = data.quantifierDefinitions.map((candidate) => candidate.id === definitionId ? updated : candidate);
  const cleanSelections = (selections: QuantifierSelections) => normaliseQuantifierSelections(definitions, selections);
  const cleanRecord = <T extends Task | Project | ReferenceList>(record: T): T => {
    const quantifierSelections = cleanSelections(record.quantifierSelections);
    return JSON.stringify(quantifierSelections) === JSON.stringify(record.quantifierSelections) ? record : { ...record, quantifierSelections, updatedAt: nowIso(), version: record.version + 1 };
  };
  return {
    ...data,
    quantifierDefinitions: definitions,
    tasks: data.tasks.map(cleanRecord),
    projects: data.projects.map(cleanRecord),
    referenceLists: data.referenceLists.map(cleanRecord),
    recurrenceRules: data.recurrenceRules.map((rule) => {
      const quantifierSelections = cleanSelections(rule.template.quantifierSelections ?? {});
      return JSON.stringify(quantifierSelections) === JSON.stringify(rule.template.quantifierSelections ?? {}) ? rule : { ...rule, template: { ...rule.template, quantifierSelections }, updatedAt: nowIso(), version: rule.version + 1 };
    }),
    activity: [...data.activity, createActivity("quantifierDefinition", definition.id, "semanticChanged", `${name} configuration changed`, definition, updated)],
  };
}
export function statusCategory(data: AppData, statusId: string): Status["category"] { return data.statuses.find((status) => status.id === statusId)?.category ?? "active"; }
export function isTaskActionable(data: AppData, task: Task): boolean { return !task.deletedAt && !task.aggregate && statusCategory(data, task.statusId) === "active"; }
export function isTaskClosed(data: AppData, task: Task): boolean { return statusCategory(data, task.statusId) !== "active"; }
export function isTaskRevealed(task: Task, today = localDate()): boolean { return !task.revealDate || task.revealDate <= today; }
export function isTaskDeferred(task: Task, today = localDate()): boolean { return Boolean(task.revealDate && task.revealDate > today); }
export function isTaskVisibleInActiveViews(data: AppData, task: Task, today = localDate()): boolean { return isTaskActionable(data, task) && isTaskRevealed(task, today); }
export function createActivity(entityKind: EntityKind, entityId: string, type: ActivityEvent["type"], summary: string, oldValue?: unknown, newValue?: unknown): ActivityEvent { return { id: newId("evt"), entityKind, entityId, type, at: nowIso(), summary, oldValue, newValue }; }
export function childTasks(data: AppData, taskId: string): Task[] { return data.tasks.filter((task) => task.parentTaskId === taskId && !task.deletedAt).sort((a, b) => a.order - b.order); }
export function descendants(data: AppData, taskId: string): Task[] { const direct = childTasks(data, taskId); return direct.flatMap((task) => [task, ...descendants(data, task.id)]); }
export function actionableDescendants(data: AppData, taskId: string): Task[] { return descendants(data, taskId).filter((task) => !task.deletedAt && !task.aggregate); }
export function aggregateProgress(data: AppData, taskId: string) { const actionable = actionableDescendants(data, taskId); const completed = actionable.filter((task) => statusCategory(data, task.statusId) === "completed").length; const cancelled = actionable.filter((task) => statusCategory(data, task.statusId) === "cancelled").length; const total = actionable.length; const open = total - completed - cancelled; return { total, open, completed, cancelled, closed: completed + cancelled, percent: total ? Math.round(((completed + cancelled) / total) * 100) : 0 }; }

export function updateTaskRecord(data: AppData, taskId: string, patch: Partial<Task>, eventType: ActivityEvent["type"], summary: string): AppData { const task = data.tasks.find((candidate) => candidate.id === taskId); if (!task) throw new DomainError("Task not found."); const updated = { ...task, ...patch, updatedAt: nowIso(), version: task.version + 1 }; return { ...data, tasks: data.tasks.map((candidate) => candidate.id === taskId ? updated : candidate), activity: [...data.activity, createActivity("task", taskId, eventType, summary, task, updated)] }; }
export function hasMeaningfulLeafContent(data: AppData, task: Task): boolean { return Boolean(task.description.trim() || statusCategory(data, task.statusId) !== "active" || task.priorityId !== defaultPriorityId(data) || task.scheduledDate || task.revealDate || task.mustDoToday || task.tagIds.length || Object.keys(task.quantifierSelections).length || task.checklist.length); }
export function convertToAggregate(data: AppData, parentId: string, triggeringChildId: string | null = null): AppData { const parent = data.tasks.find((task) => task.id === parentId); if (!parent) throw new DomainError("Parent task not found."); if (parent.aggregate) return data; const inactiveFields = { description: parent.description, scheduledDate: parent.scheduledDate, revealDate: parent.revealDate, tagIds: parent.tagIds, quantifierSelections: parent.quantifierSelections, mustDoToday: parent.mustDoToday, checklist: parent.checklist, priorityId: parent.priorityId, statusId: parent.statusId }; const updated = { ...parent, aggregate: true, description: "", scheduledDate: null, revealDate: null, tagIds: [], quantifierSelections: {}, mustDoToday: false, checklist: [], updatedAt: nowIso(), version: parent.version + 1 }; return { ...data, tasks: data.tasks.map((task) => task.id === parentId ? updated : task), activity: [...data.activity, createActivity("task", parentId, "aggregateConverted", "Converted to aggregate task", { inactiveFields }, { taskId: parentId, triggeringChildId, inactiveFieldNames: Object.keys(inactiveFields) })] }; }
export interface TaskDraftInput { id?: string; title: string; description: string; statusId: string; priorityId: string; scheduledDate: string | null; revealDate: string | null; mustDoToday?: boolean; location: TaskLocation; parentTaskId: string | null; tagIds: string[]; quantifierSelections?: QuantifierSelections; checklist: ChecklistItem[] }
export type TaskMoveDestination = { type: "parent"; parentTaskId: string } | { type: "root"; location: TaskLocation };
export interface AggregateCascadeImpact { actionableLeafCount: number; openActionableCount: number; completedActionableCount: number; cancelledActionableCount: number; nestedAggregateCount: number; ancestorAggregateCount: number; totalTaskCount: number }
export function orderedActivePriorities(data: AppData): Priority[] { return data.priorities.filter((priority) => !priority.deletedAt).sort((a, b) => a.rank - b.rank || a.id.localeCompare(b.id)); }
export function defaultStatusId(data: AppData): string { return data.statuses.filter((status) => !status.deletedAt && status.category === "active").sort((a, b) => a.order - b.order)[0]?.id ?? "status_open"; }
export function defaultPriorityId(data: AppData): string { const active = orderedActivePriorities(data); const configured = active.find((priority) => priority.id === data.settings.defaultPriorityId); return configured?.id ?? active.find((priority) => priority.rank === 3)?.id ?? active[0]?.id ?? "priority_normal"; }
export function validateTaskLocation(data: AppData, location: TaskLocation): void {
  if (location.type === "inbox" || location.type === "someday") return;
  if (location.type === "area") {
    if (!data.areas.some((area) => area.id === location.areaId && !area.deletedAt)) throw new DomainError("Choose an available Area.");
    return;
  }
  const project = data.projects.find((candidate) => candidate.id === location.projectId && !candidate.deletedAt);
  if (!project) throw new DomainError("Choose an available Project.");
  if (project.archivedAt) throw new DomainError("Archived Projects are read-only.");
  if (statusCategory(data, project.statusId) !== "active") throw new DomainError("Reopen the Project before moving Tasks into it.");
}
export function validateTaskParent(data: AppData, taskId: string | null, parentTaskId: string | null, location: TaskLocation): void {
  validateTaskLocation(data, location);
  if (!parentTaskId) return;
  const parent = data.tasks.find((task) => task.id === parentTaskId && !task.deletedAt);
  if (!parent) throw new DomainError("Choose an available parent task.");
  if (taskId && parentTaskId === taskId) throw new DomainError("A task cannot be its own parent.");
  if (taskId && descendants(data, taskId).some((task) => task.id === parentTaskId)) throw new DomainError("A task cannot be moved under its own descendant.");
  if (isTaskClosed(data, parent)) throw new DomainError("Choose an active parent task.");
  if (JSON.stringify(parent.location) !== JSON.stringify(location)) throw new DomainError("Parent and project location must match.");
}
function taskSubtree(data: AppData, taskId: string): Task[] { const root = data.tasks.find((task) => task.id === taskId && !task.deletedAt); if (!root) throw new DomainError("Task not found."); return [root, ...descendants(data, taskId).filter((task) => !task.deletedAt)]; }
function ancestorTasks(data: AppData, taskId: string): Task[] { const result: Task[] = []; let current = data.tasks.find((task) => task.id === taskId); while (current?.parentTaskId) { const parent = data.tasks.find((task) => task.id === current?.parentTaskId && !task.deletedAt); if (!parent) break; result.push(parent); current = parent; } return result; }
export function aggregateCompletionImpact(data: AppData, taskId: string): AggregateCascadeImpact {
  const subtree = taskSubtree(data, taskId);
  const actionable = subtree.filter((task) => !task.aggregate);
  return { actionableLeafCount: actionable.length, openActionableCount: actionable.filter((task) => !isTaskClosed(data, task)).length, completedActionableCount: actionable.filter((task) => statusCategory(data, task.statusId) === "completed").length, cancelledActionableCount: actionable.filter((task) => statusCategory(data, task.statusId) === "cancelled").length, nestedAggregateCount: subtree.filter((task) => task.aggregate && task.id !== taskId).length, ancestorAggregateCount: ancestorTasks(data, taskId).filter((task) => task.aggregate).length, totalTaskCount: subtree.length };
}
export function moveTaskSubtreeCommand(data: AppData, taskId: string, destination: TaskMoveDestination): AppData {
  const root = data.tasks.find((task) => task.id === taskId && !task.deletedAt);
  if (!root) throw new DomainError("Task not found.");
  const subtree = taskSubtree(data, taskId);
  const subtreeIds = new Set(subtree.map((task) => task.id));
  const parent = destination.type === "parent" ? data.tasks.find((task) => task.id === destination.parentTaskId && !task.deletedAt) : null;
  const nextParentTaskId = destination.type === "parent" ? destination.parentTaskId : null;
  const nextLocation = destination.type === "parent" ? parent?.location : destination.location;
  if (!nextLocation) throw new DomainError("Choose an available parent task.");
  validateTaskParent(data, taskId, nextParentTaskId, nextLocation);
  let next = destination.type === "parent" && parent && !parent.aggregate ? convertToAggregate(data, parent.id, taskId) : data;
  const siblingCount = next.tasks.filter((task) => !subtreeIds.has(task.id) && task.parentTaskId === nextParentTaskId && JSON.stringify(task.location) === JSON.stringify(nextLocation) && !task.deletedAt).length;
  const at = nowIso();
  const changed = new Map<string, Task>();
  for (const task of subtree) {
    const updated: Task = { ...task, location: nextLocation, parentTaskId: task.id === taskId ? nextParentTaskId : task.parentTaskId, order: task.id === taskId ? siblingCount + 1 : task.order, updatedAt: at, version: task.version + 1 };
    changed.set(task.id, updated);
  }
  const eventOld = { parentTaskId: root.parentTaskId, location: root.location };
  const eventNew = { parentTaskId: nextParentTaskId, location: nextLocation, taskIds: [...subtreeIds], taskCount: subtreeIds.size };
  next = { ...next, tasks: next.tasks.map((task) => changed.get(task.id) ?? task), activity: [...next.activity, createActivity("task", taskId, "moved", subtree.length === 1 ? "Task moved" : "Task subtree moved", eventOld, eventNew)] };
  const completedStatusId = next.statuses.find((status) => status.category === "completed")?.id ?? "status_completed";
  const cancelledStatusId = next.statuses.find((status) => status.category === "cancelled")?.id ?? completedStatusId;
  const activeStatusId = defaultStatusId(next);
  next = closeSatisfiedAggregates(next, completedStatusId, cancelledStatusId);
  if (subtree.some((task) => !isTaskClosed(data, task))) next = reopenClosedAncestors(next, taskId, activeStatusId);
  return next;
}
export function reorderTaskSiblingCommand(data: AppData, taskId: string, direction: -1 | 1): AppData {
  const task = data.tasks.find((candidate) => candidate.id === taskId && !candidate.deletedAt);
  if (!task) throw new DomainError("Task not found.");
  const siblings = data.tasks.filter((candidate) => !candidate.deletedAt && candidate.parentTaskId === task.parentTaskId && JSON.stringify(candidate.location) === JSON.stringify(task.location)).sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  const index = siblings.findIndex((candidate) => candidate.id === taskId);
  const swap = index + direction;
  if (index < 0 || swap < 0 || swap >= siblings.length) return data;
  const at = nowIso();
  const first = siblings[index];
  const second = siblings[swap];
  const updates = new Map([[first.id, { ...first, order: second.order, updatedAt: at, version: first.version + 1 }], [second.id, { ...second, order: first.order, updatedAt: at, version: second.version + 1 }]]);
  return { ...data, tasks: data.tasks.map((candidate) => updates.get(candidate.id) ?? candidate), activity: [...data.activity, createActivity("task", taskId, "orderChanged", "Task sibling order changed", { order: first.order }, { order: second.order })] };
}
export function reorderTaskSiblingBeforeCommand(data: AppData, taskId: string, targetTaskId: string): AppData {
  const task = data.tasks.find((candidate) => candidate.id === taskId && !candidate.deletedAt);
  const target = data.tasks.find((candidate) => candidate.id === targetTaskId && !candidate.deletedAt);
  if (!task || !target) throw new DomainError("Task not found.");
  if (task.id === target.id) return data;
  if (task.parentTaskId !== target.parentTaskId || JSON.stringify(task.location) !== JSON.stringify(target.location)) throw new DomainError("Tasks can only be reordered within the same sibling group.");
  const siblings = data.tasks.filter((candidate) => !candidate.deletedAt && candidate.parentTaskId === task.parentTaskId && JSON.stringify(candidate.location) === JSON.stringify(task.location)).sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  const ids = siblings.map((candidate) => candidate.id);
  const from = ids.indexOf(taskId);
  const to = ids.indexOf(targetTaskId);
  if (from < 0 || to < 0) throw new DomainError("Task sibling group is unavailable.");
  const insertAt = from < to ? to - 1 : to;
  ids.splice(insertAt, 0, ids.splice(from, 1)[0]);
  const at = nowIso();
  const orderById = new Map(ids.map((id, index) => [id, index + 1]));
  const changedIds = ids.filter((id) => data.tasks.find((candidate) => candidate.id === id)?.order !== orderById.get(id));
  if (!changedIds.length) return data;
  return {
    ...data,
    tasks: data.tasks.map((candidate) => orderById.has(candidate.id) && candidate.order !== orderById.get(candidate.id) ? { ...candidate, order: orderById.get(candidate.id)!, updatedAt: at, version: candidate.version + 1 } : candidate),
    activity: [...data.activity, createActivity("task", taskId, "orderChanged", "Task sibling order changed", { siblingIds: siblings.map((candidate) => candidate.id) }, { siblingIds: ids })],
  };
}
export function createTaskCommand(data: AppData, input: TaskDraftInput): AppData {
  const title = input.title.trim();
  if (!title) throw new DomainError("Task title is required.");
  validateTaskParent(data, null, input.parentTaskId, input.location);
  const task: Task = { ...createMeta("task"), kind: "task", title, description: input.description.trim(), statusId: input.statusId, priorityId: input.priorityId, scheduledDate: input.scheduledDate, revealDate: input.revealDate, location: input.location, parentTaskId: input.parentTaskId, childTaskIds: [], order: data.tasks.filter((candidate) => JSON.stringify(candidate.location) === JSON.stringify(input.location) && candidate.parentTaskId === input.parentTaskId).length + 1, tagIds: [...input.tagIds], quantifierSelections: normaliseQuantifierSelections(data.quantifierDefinitions, input.quantifierSelections), mustDoToday: false, aggregate: false, completedAt: null, cancelledAt: null, checklist: input.checklist.map((item, index) => ({ ...item, order: index + 1 })) };
  const next = input.parentTaskId ? convertToAggregate(data, input.parentTaskId, task.id) : data;
  return { ...next, tasks: [...next.tasks, task], activity: [...next.activity, createActivity("task", task.id, "created", `Created "${task.title}"`)] };
}
export function saveTaskCommand(data: AppData, taskId: string, input: TaskDraftInput): AppData {
  const existing = data.tasks.find((task) => task.id === taskId);
  if (!existing) throw new DomainError("Task not found.");
  const title = input.title.trim();
  if (!title) throw new DomainError("Task title is required.");
  let next = JSON.stringify(existing.location) !== JSON.stringify(input.location) || existing.parentTaskId !== input.parentTaskId ? moveTaskSubtreeCommand(data, taskId, input.parentTaskId ? { type: "parent", parentTaskId: input.parentTaskId } : { type: "root", location: input.location }) : data;
  const patch: Partial<Task> = existing.aggregate ? { title, location: input.location, parentTaskId: input.parentTaskId } : { title, description: input.description.trim(), statusId: input.statusId, priorityId: input.priorityId, scheduledDate: input.scheduledDate, revealDate: input.revealDate, mustDoToday: false, location: input.location, parentTaskId: input.parentTaskId, tagIds: [...input.tagIds], quantifierSelections: normaliseQuantifierSelections(data.quantifierDefinitions, input.quantifierSelections ?? existing.quantifierSelections), checklist: input.checklist.map((item, index) => ({ ...item, order: index + 1 })) };
  const movedExisting = next.tasks.find((task) => task.id === taskId) ?? existing;
  const updated = { ...movedExisting, ...patch, updatedAt: nowIso(), version: movedExisting.version + 1 };
  const events: ActivityEvent[] = [];
  const add = (type: ActivityEvent["type"], summary: string, oldValue: unknown, newValue: unknown) => events.push(createActivity("task", taskId, type, summary, oldValue, newValue));
  if (existing.title !== updated.title) add("titleChanged", "Task title changed", existing.title, updated.title);
  if (!existing.aggregate) {
    if (existing.description !== updated.description) add("descriptionChanged", "Task description changed", existing.description, updated.description);
    if (existing.statusId !== updated.statusId) add("statusChanged", "Task status changed", existing.statusId, updated.statusId);
    if (existing.priorityId !== updated.priorityId) add("priorityChanged", "Task priority changed", existing.priorityId, updated.priorityId);
    if (JSON.stringify(existing.tagIds) !== JSON.stringify(updated.tagIds)) add("tagsChanged", "Task tags changed", existing.tagIds, updated.tagIds);
    if (JSON.stringify(existing.quantifierSelections) !== JSON.stringify(updated.quantifierSelections)) add("quantifiersChanged", "Task quantifiers changed", existing.quantifierSelections, updated.quantifierSelections);
    if (existing.scheduledDate !== updated.scheduledDate) add("scheduledDateChanged", "Due Date changed", existing.scheduledDate, updated.scheduledDate);
    if (existing.revealDate !== updated.revealDate) add("revealDateChanged", "Reveal On changed", existing.revealDate, updated.revealDate);
    const before = [...(existing.checklist ?? [])].sort((a, b) => a.order - b.order);
    const after = [...(updated.checklist ?? [])].sort((a, b) => a.order - b.order);
    const beforeById = new Map(before.map((item) => [item.id, item]));
    const afterById = new Map(after.map((item) => [item.id, item]));
    for (const item of after) if (!beforeById.has(item.id)) add("checklistItemAdded", "Checklist item added", null, { id: item.id, text: item.text, checked: item.checked, order: item.order });
    for (const item of before) if (!afterById.has(item.id)) add("checklistItemDeleted", "Checklist item removed", { id: item.id, text: item.text, checked: item.checked, order: item.order }, null);
    for (const item of after) {
      const old = beforeById.get(item.id);
      if (!old) continue;
      if (old.text !== item.text) add("checklistItemEdited", "Checklist item text changed", { id: item.id, text: old.text }, { id: item.id, text: item.text });
      if (old.checked !== item.checked) add("checklistItemChecked", item.checked ? "Checklist item checked" : "Checklist item unchecked", { id: item.id, checked: old.checked }, { id: item.id, checked: item.checked });
    }
    if (JSON.stringify(before.map((item) => item.id)) !== JSON.stringify(after.map((item) => item.id))) add("checklistItemReordered", "Checklist item reordered", { itemIds: before.map((item) => item.id) }, { itemIds: after.map((item) => item.id) });
  }
  return { ...next, tasks: next.tasks.map((task) => task.id === taskId ? updated : task), activity: [...next.activity, ...events] };
}
export function completeAggregate(data: AppData, taskId: string, completedStatusId: string): AppData { const task = data.tasks.find((candidate) => candidate.id === taskId && candidate.aggregate); if (!task) throw new DomainError("Aggregate task not found."); const at = nowIso(); const affected = actionableDescendants(data, taskId).filter((candidate) => statusCategory(data, candidate.statusId) === "active"); const ids = new Set(affected.map((candidate) => candidate.id)); const next = { ...data, tasks: data.tasks.map((candidate) => ids.has(candidate.id) ? { ...candidate, statusId: completedStatusId, completedAt: at, cancelledAt: null, updatedAt: at, version: candidate.version + 1 } : candidate), activity: [...data.activity, createActivity("task", taskId, "aggregateCompleted", `Completed ${affected.length} open actionable task${affected.length === 1 ? "" : "s"} in aggregate`, null, { completedIds: [...ids] })] }; return closeSatisfiedAggregates(next, completedStatusId, data.statuses.find((status) => status.category === "cancelled")?.id ?? completedStatusId); }
export function closeSatisfiedAggregates(data: AppData, completedStatusId: string, cancelledStatusId: string): AppData { let next = data; let changed = true; while (changed) { changed = false; for (const task of [...next.tasks].filter((candidate) => candidate.aggregate && !candidate.deletedAt)) { const current = next.tasks.find((candidate) => candidate.id === task.id); if (!current || isTaskClosed(next, current)) continue; const progress = aggregateProgress(next, current.id); if (!progress.total || progress.open > 0) continue; const statusId = progress.cancelled > 0 ? cancelledStatusId : completedStatusId; next = updateTaskRecord(next, current.id, { statusId, completedAt: statusId === completedStatusId ? nowIso() : current.completedAt, cancelledAt: statusId === cancelledStatusId ? nowIso() : null }, "aggregateClosed", "Aggregate closed after every actionable descendant closed"); changed = true; } } return next; }
export function reopenClosedAncestors(data: AppData, taskId: string, activeStatusId: string): AppData { let next = data; let cursor = next.tasks.find((task) => task.id === taskId); while (cursor?.parentTaskId) { const parent = next.tasks.find((task) => task.id === cursor?.parentTaskId); if (!parent) break; if (isTaskClosed(next, parent)) next = updateTaskRecord(next, parent.id, { statusId: activeStatusId, completedAt: null, cancelledAt: null }, "aggregateReopened", "Reopened aggregate ancestor for active child"); cursor = parent; } return next; }
function assertTaskProjectEditable(data: AppData, task: Task): void {
  const location = task.location;
  if (location.type !== "project") return;
  const project = data.projects.find((candidate) => candidate.id === location.projectId);
  if (project?.archivedAt) throw new DomainError("Archived Projects are read-only.");
  if (project?.completedAt) throw new DomainError("Reopen the Project before reopening Tasks in it.");
}
export function reopenTaskCommand(data: AppData, taskId: string, activeStatusId = defaultStatusId(data)): AppData {
  const task = data.tasks.find((candidate) => candidate.id === taskId && !candidate.deletedAt);
  if (!task) throw new DomainError("Task not found.");
  assertTaskProjectEditable(data, task);
  if (task.aggregate) return reopenAggregateTree(data, taskId, activeStatusId);
  let next = isTaskClosed(data, task) ? updateTaskRecord(data, taskId, { statusId: activeStatusId, completedAt: null, cancelledAt: null }, "aggregateReopened", "Task reopened") : data;
  return reopenClosedAncestors(next, taskId, activeStatusId);
}
export function reopenAggregateTree(data: AppData, taskId: string, activeStatusId: string): AppData {
  const root = data.tasks.find((candidate) => candidate.id === taskId && candidate.aggregate && !candidate.deletedAt);
  if (!root) throw new DomainError("Aggregate task not found.");
  assertTaskProjectEditable(data, root);
  let next = updateTaskRecord(data, taskId, { statusId: activeStatusId, completedAt: null, cancelledAt: null }, "aggregateReopened", "Reopened aggregate tree");
  for (const child of descendants(next, taskId).filter((candidate) => !candidate.deletedAt && isTaskClosed(next, candidate))) next = updateTaskRecord(next, child.id, { statusId: activeStatusId, completedAt: null, cancelledAt: null }, "aggregateReopened", child.aggregate ? "Reopened nested aggregate" : "Reopened by aggregate parent");
  return reopenClosedAncestors(next, taskId, activeStatusId);
}
export function activeTagsForScope(data: AppData, scope: TagScope): Tag[] { return data.tags.filter((tag) => !tag.deletedAt && tag.allowedScopes.includes(scope)).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)); }
export function orderedActiveTagGroups(data: AppData): TagGroup[] { return data.tagGroups.filter((group) => !group.deletedAt).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)); }
export function getEffectiveTagRules(tag: Tag, tagGroups: TagGroup[]) { const group = tag.tagGroupId ? tagGroups.find((candidate) => candidate.id === tag.tagGroupId && !candidate.deletedAt) ?? null : null; return { groupId: group?.id ?? null, mutuallyExclusive: Boolean(group?.mutuallyExclusive), inherited: group?.inherited ?? {} }; }
export function groupedTagsForPicker(data: AppData, scope: TagScope) { const groups = orderedActiveTagGroups(data); const tags = activeTagsForScope(data, scope); return [...groups.map((group) => ({ group, tags: tags.filter((tag) => tag.tagGroupId === group.id).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)) })).filter((entry) => entry.tags.length), { group: null, tags: tags.filter((tag) => !tag.tagGroupId || !groups.some((group) => group.id === tag.tagGroupId)).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)) }].filter((entry) => entry.tags.length); }
export function applyMutuallyExclusiveTags(data: AppData, currentTagIds: string[], nextTagId: string, scope: TagScope): string[] { const next = data.tags.find((tag) => tag.id === nextTagId); if (!next || next.deletedAt || !next.allowedScopes.includes(scope)) return currentTagIds; const rules = getEffectiveTagRules(next, data.tagGroups); const withoutSiblings = rules.mutuallyExclusive && rules.groupId ? currentTagIds.filter((tagId) => data.tags.find((tag) => tag.id === tagId)?.tagGroupId !== rules.groupId) : currentTagIds; return withoutSiblings.includes(nextTagId) ? withoutSiblings : [...withoutSiblings, nextTagId]; }

export interface ReferenceListDraftInput { title: string; location: ReferenceListLocation; tagIds: string[]; quantifierSelections?: QuantifierSelections; color?: string | null; icon?: string }
export function listLocationMeta(location: ReferenceListLocation): Pick<ReferenceList, "areaId" | "projectId"> {
  if (location.type === "area") return { areaId: location.areaId, projectId: null };
  if (location.type === "project") return { areaId: null, projectId: location.projectId };
  return { areaId: null, projectId: null };
}
export function validateReferenceListLocation(data: AppData, location: ReferenceListLocation): void {
  if (location.type === "loose") return;
  if (location.type === "area") {
    if (!location.areaId) throw new DomainError("Choose an Area.");
    if (!data.areas.some((area) => area.id === location.areaId && !area.deletedAt)) throw new DomainError("Choose an available Area.");
    return;
  }
  if (!location.projectId) throw new DomainError("Choose a Project.");
  if (!data.projects.some((project) => project.id === location.projectId && !project.deletedAt && !project.archivedAt)) throw new DomainError("Choose an active Project.");
}
export function validateReferenceListRecord(data: AppData, list: ReferenceList): void {
  const expected = listLocationMeta(list.location);
  if (list.areaId !== expected.areaId || list.projectId !== expected.projectId) throw new DomainError("List location is contradictory.");
  validateReferenceListLocation(data, list.location);
}
function normaliseReferenceListTags(data: AppData, tagIds: string[]): string[] {
  return tagIds.reduce<string[]>((ids, tagId) => applyMutuallyExclusiveTags(data, ids, tagId, "referenceList"), []);
}
function validateReferenceListDraft(data: AppData, input: ReferenceListDraftInput): string {
  const title = input.title.trim();
  if (!title) throw new DomainError("List title is required.");
  validateReferenceListLocation(data, input.location);
  if (input.tagIds.some((tagId) => !data.tags.some((tag) => tag.id === tagId && !tag.deletedAt && tag.allowedScopes.includes("referenceList")))) throw new DomainError("Choose List tags only.");
  return title;
}
function validateReferenceListDraftForUpdate(data: AppData, existing: ReferenceList, input: ReferenceListDraftInput): string {
  const title = input.title.trim();
  if (!title) throw new DomainError("List title is required.");
  let unchangedArchivedProject = false;
  if (existing.location.type === "project" && input.location.type === "project" && existing.location.projectId === input.location.projectId) {
    const projectId = input.location.projectId;
    unchangedArchivedProject = data.projects.some((project) => project.id === projectId && !project.deletedAt && project.archivedAt);
  }
  if (!unchangedArchivedProject) validateReferenceListLocation(data, input.location);
  if (input.tagIds.some((tagId) => !data.tags.some((tag) => tag.id === tagId && !tag.deletedAt && tag.allowedScopes.includes("referenceList")))) throw new DomainError("Choose List tags only.");
  return title;
}
function referenceListLocationLabel(data: AppData, location: ReferenceListLocation): string {
  if (location.type === "area") return data.areas.find((area) => area.id === location.areaId)?.title ?? "Unknown Area";
  if (location.type === "project") return data.projects.find((project) => project.id === location.projectId)?.title ?? "Unknown Project";
  return "Loose";
}
export function createReferenceListCommand(data: AppData, input: ReferenceListDraftInput): AppData {
  const title = validateReferenceListDraft(data, input);
  const list: ReferenceList = { ...createMeta("ref"), kind: "referenceList", title, location: input.location, ...listLocationMeta(input.location), order: data.referenceLists.length + 1, archivedAt: null, content: { type: "plainItems", items: [] }, tagIds: normaliseReferenceListTags(data, input.tagIds), quantifierSelections: normaliseQuantifierSelections(data.quantifierDefinitions, input.quantifierSelections), color: input.color ?? null, icon: input.icon ?? "list-ordered" };
  return { ...data, referenceLists: [...data.referenceLists, list], activity: [...data.activity, createActivity("referenceList", list.id, "created", `List created: ${list.title}`)] };
}
export function updateReferenceListCommand(data: AppData, listId: string, input: ReferenceListDraftInput): AppData {
  const existing = data.referenceLists.find((list) => list.id === listId);
  if (!existing) throw new DomainError("List not found.");
  if (existing.deletedAt) throw new DomainError("Deleted Lists cannot be edited.");
  if (existing.archivedAt) throw new DomainError("Archived Lists cannot be edited.");
  const title = validateReferenceListDraftForUpdate(data, existing, input);
  const tagIds = normaliseReferenceListTags(data, input.tagIds);
  const updated: ReferenceList = { ...existing, title, location: input.location, ...listLocationMeta(input.location), tagIds, quantifierSelections: normaliseQuantifierSelections(data.quantifierDefinitions, input.quantifierSelections ?? existing.quantifierSelections), color: input.color === undefined ? existing.color : input.color, icon: input.icon ?? existing.icon, updatedAt: nowIso(), version: existing.version + 1 };
  let unchangedArchivedProject = false;
  if (existing.location.type === "project" && updated.location.type === "project" && existing.location.projectId === updated.location.projectId) {
    const projectId = updated.location.projectId;
    unchangedArchivedProject = data.projects.some((project) => project.id === projectId && !project.deletedAt && project.archivedAt);
  }
  if (!unchangedArchivedProject) validateReferenceListRecord(data, updated);
  const events: ActivityEvent[] = [];
  if (existing.title !== updated.title) events.push(createActivity("referenceList", listId, "titleChanged", "List title changed", existing.title, updated.title));
  if (JSON.stringify(existing.location) !== JSON.stringify(updated.location)) events.push(createActivity("referenceList", listId, "moved", `List moved from ${referenceListLocationLabel(data, existing.location)} to ${referenceListLocationLabel(data, updated.location)}`, { location: existing.location, containerName: referenceListLocationLabel(data, existing.location) }, { location: updated.location, containerName: referenceListLocationLabel(data, updated.location) }));
  const addedTagIds = updated.tagIds.filter((tagId) => !existing.tagIds.includes(tagId));
  const removedTagIds = existing.tagIds.filter((tagId) => !updated.tagIds.includes(tagId));
  if (addedTagIds.length) events.push(createActivity("referenceList", listId, "tagsChanged", "List Tags added", null, addedTagIds));
  if (removedTagIds.length) events.push(createActivity("referenceList", listId, "tagsChanged", "List Tags removed", removedTagIds, null));
  if (JSON.stringify(existing.quantifierSelections) !== JSON.stringify(updated.quantifierSelections)) events.push(createActivity("referenceList", listId, "quantifiersChanged", "List quantifiers changed", existing.quantifierSelections, updated.quantifierSelections));
  if (existing.color !== updated.color) events.push(createActivity("referenceList", listId, "colorChanged", "List colour changed", existing.color, updated.color));
  if (existing.icon !== updated.icon) events.push(createActivity("referenceList", listId, "iconChanged", "List icon changed", existing.icon, updated.icon));
  return { ...data, referenceLists: data.referenceLists.map((list) => list.id === listId ? updated : list), activity: [...data.activity, ...events] };
}
export function relocateReferenceListCommand(data: AppData, listId: string, location: ReferenceListLocation): AppData {
  const list = data.referenceLists.find((candidate) => candidate.id === listId);
  if (!list) throw new DomainError("List not found.");
  return updateReferenceListCommand(data, listId, { title: list.title, location, tagIds: list.tagIds, quantifierSelections: list.quantifierSelections, color: list.color, icon: list.icon });
}
export function setReferenceListTagsCommand(data: AppData, listId: string, tagIds: string[]): AppData {
  const list = data.referenceLists.find((candidate) => candidate.id === listId);
  if (!list) throw new DomainError("List not found.");
  return updateReferenceListCommand(data, listId, { title: list.title, location: list.location, tagIds, quantifierSelections: list.quantifierSelections, color: list.color, icon: list.icon });
}
export function reorderReferenceListCommand(data: AppData, listId: string, direction: -1 | 1, visibleIds?: string[]): AppData {
  const visibleSet = visibleIds ? new Set(visibleIds) : null;
  const ordered = data.referenceLists
    .filter((list) => !list.deletedAt && !list.archivedAt && (!visibleSet || visibleSet.has(list.id)))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  const index = ordered.findIndex((list) => list.id === listId);
  const swap = index + direction;
  if (index < 0 || swap < 0 || swap >= ordered.length) return data;
  const other = ordered[swap];
  const current = ordered[index];
  const at = nowIso();
  return {
    ...data,
    referenceLists: data.referenceLists.map((list) =>
      list.id === current.id ? { ...list, order: other.order, updatedAt: at, version: list.version + 1 }
      : list.id === other.id ? { ...list, order: current.order, updatedAt: at, version: list.version + 1 }
      : list,
    ),
    activity: [...data.activity, createActivity("referenceList", listId, "orderChanged", "List order changed", ordered.map((list) => list.id), ordered.map((list) => list.id).map((id, currentIndex, ids) => currentIndex === index ? ids[swap] : currentIndex === swap ? ids[index] : id))],
  };
}
export function reorderReferenceListBeforeCommand(data: AppData, listId: string, targetListId: string, visibleIds?: string[]): AppData {
  if (listId === targetListId) return data;
  const visibleSet = visibleIds ? new Set(visibleIds) : null;
  const ordered = data.referenceLists
    .filter((list) => !list.deletedAt && !list.archivedAt && (!visibleSet || visibleSet.has(list.id)))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  const ids = ordered.map((list) => list.id);
  const from = ids.indexOf(listId);
  const to = ids.indexOf(targetListId);
  if (from < 0 || to < 0) return data;
  const insertAt = from < to ? to - 1 : to;
  ids.splice(insertAt, 0, ids.splice(from, 1)[0]);
  const at = nowIso();
  const orderById = new Map(ids.map((id, index) => [id, index + 1]));
  const changedIds = ids.filter((id) => data.referenceLists.find((list) => list.id === id)?.order !== orderById.get(id));
  if (!changedIds.length) return data;
  return {
    ...data,
    referenceLists: data.referenceLists.map((list) => orderById.has(list.id) && list.order !== orderById.get(list.id) ? { ...list, order: orderById.get(list.id)!, updatedAt: at, version: list.version + 1 } : list),
    activity: [...data.activity, createActivity("referenceList", listId, "orderChanged", "List order changed", ordered.map((list) => list.id), ids)],
  };
}

export interface StatusDraftInput { id?: string; name: string; color: string; icon: string; category: Status["category"]; makeDefault?: boolean }
export function activeStatuses(data: AppData): Status[] { return data.statuses.filter((status) => !status.deletedAt).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)); }
export function affectedTasksForStatus(data: AppData, statusId: string): Task[] { return data.tasks.filter((task) => task.statusId === statusId); }
export function validateStatusSemantics(statuses: Status[]): void {
  if (!statuses.length) throw new DomainError("At least one Status is required.");
  if (!statuses.some((status) => status.category === "active")) throw new DomainError("At least one open Status is required.");
  if (!statuses.some((status) => status.category === "completed")) throw new DomainError("A Completed Status is required.");
  if (!statuses.some((status) => status.category === "cancelled")) throw new DomainError("A Cancelled Status is required.");
}
function validateStatusDraft(data: AppData, input: StatusDraftInput, editingId: string | null): string {
  const name = input.name.trim();
  if (!name) throw new DomainError("Status name is required.");
  if (data.statuses.some((status) => !status.deletedAt && status.id !== editingId && status.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase())) throw new DomainError("Status names must be unique.");
  if (!input.color.trim()) throw new DomainError("Choose a Status colour.");
  if (!input.icon.trim()) throw new DomainError("Choose a Status icon.");
  if (!(STATUS_ICON_OPTIONS as readonly string[]).includes(input.icon)) throw new DomainError("Choose an available Status icon.");
  if (data.statuses.some((status) => !status.deletedAt && status.id !== editingId && status.color === input.color)) throw new DomainError("That Status colour is already in use.");
  if (data.statuses.some((status) => !status.deletedAt && status.id !== editingId && status.icon === input.icon)) throw new DomainError("That Status icon is already in use.");
  return name;
}
function statusOrderWithDefault(statuses: Status[], defaultId: string): Status[] {
  const ordered = [...statuses].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  const picked = ordered.find((status) => status.id === defaultId && status.category === "active" && !status.deletedAt);
  const rest = picked ? ordered.filter((status) => status.id !== picked.id) : ordered;
  return (picked ? [picked, ...rest] : rest).map((status, index) => ({ ...status, order: index + 1 }));
}
export function createStatusCommand(data: AppData, input: StatusDraftInput): AppData {
  const name = validateStatusDraft(data, input, null);
  const status: Status = { ...createMeta("status"), kind: "status", name, color: input.color, icon: input.icon, category: input.category, order: activeStatuses(data).length + 1 };
  const statuses = input.makeDefault && status.category === "active" ? statusOrderWithDefault([...data.statuses, status], status.id) : [...data.statuses, status];
  validateStatusSemantics(statuses.filter((candidate) => !candidate.deletedAt));
  return { ...data, statuses, activity: [...data.activity, createActivity("status", status.id, "created", `Status created: ${status.name}`), ...(input.makeDefault && status.category === "active" ? [createActivity("status", status.id, "defaultChanged", `Default Status changed to ${status.name}`)] : [])] };
}
export function updateStatusCommand(data: AppData, statusId: string, input: StatusDraftInput): AppData {
  const existing = data.statuses.find((status) => status.id === statusId && !status.deletedAt);
  if (!existing) throw new DomainError("Status not found.");
  const name = validateStatusDraft(data, input, statusId);
  const updated: Status = { ...existing, name, color: input.color, icon: input.icon, category: input.category, updatedAt: nowIso(), version: existing.version + 1 };
  let statuses = data.statuses.map((status) => status.id === statusId ? updated : status);
  if (input.makeDefault && updated.category === "active") statuses = statusOrderWithDefault(statuses, updated.id);
  validateStatusSemantics(statuses.filter((candidate) => !candidate.deletedAt));
  const events: ActivityEvent[] = [];
  if (existing.name !== updated.name) events.push(createActivity("status", statusId, "titleChanged", "Status renamed", existing.name, updated.name));
  if (existing.color !== updated.color) events.push(createActivity("status", statusId, "colorChanged", "Status colour changed", existing.color, updated.color));
  if (existing.icon !== updated.icon) events.push(createActivity("status", statusId, "iconChanged", "Status icon changed", existing.icon, updated.icon));
  if (existing.category !== updated.category) events.push(createActivity("status", statusId, "semanticChanged", "Status semantic classification changed", existing.category, updated.category));
  if (input.makeDefault && updated.category === "active" && defaultStatusId(data) !== statusId) events.push(createActivity("status", statusId, "defaultChanged", `Default Status changed to ${updated.name}`));
  const categoryChangedAt = nowIso();
  const projects = existing.category === updated.category ? data.projects : data.projects.map((project) => project.statusId === statusId ? { ...project, completedAt: updated.category === "completed" ? project.completedAt ?? categoryChangedAt : null, cancelledAt: updated.category === "cancelled" ? project.cancelledAt ?? categoryChangedAt : null, updatedAt: categoryChangedAt, version: project.version + 1 } : project);
  return { ...data, projects, statuses, activity: [...data.activity, ...events] };
}
export function reorderStatusCommand(data: AppData, statusId: string, direction: -1 | 1): AppData {
  const ordered = activeStatuses(data);
  const index = ordered.findIndex((status) => status.id === statusId);
  const swap = index + direction;
  if (index < 0 || swap < 0 || swap >= ordered.length) return data;
  const ids = ordered.map((status) => status.id);
  [ids[index], ids[swap]] = [ids[swap], ids[index]];
  const at = nowIso();
  return { ...data, statuses: data.statuses.map((status) => ids.includes(status.id) ? { ...status, order: ids.indexOf(status.id) + 1, updatedAt: at, version: status.version + 1 } : status), activity: [...data.activity, createActivity("status", statusId, "orderChanged", "Status order changed", ordered.map((status) => status.id), ids)] };
}
export function reorderStatusRelativeCommand(data: AppData, statusId: string, targetStatusId: string, placement: "before" | "after"): AppData {
  if (statusId === targetStatusId) return data;
  const ordered = activeStatuses(data);
  if (!ordered.some((status) => status.id === statusId) || !ordered.some((status) => status.id === targetStatusId)) return data;
  const previousIds = ordered.map((status) => status.id);
  const ids = previousIds.filter((id) => id !== statusId);
  const targetIndex = ids.indexOf(targetStatusId);
  if (targetIndex < 0) return data;
  ids.splice(targetIndex + (placement === "after" ? 1 : 0), 0, statusId);
  if (ids.every((id, index) => id === previousIds[index])) return data;
  const at = nowIso();
  return { ...data, statuses: data.statuses.map((status) => ids.includes(status.id) ? { ...status, order: ids.indexOf(status.id) + 1, updatedAt: at, version: status.version + 1 } : status), activity: [...data.activity, createActivity("status", statusId, "orderChanged", "Status order changed", previousIds, ids)] };
}
export function deleteStatusCommand(data: AppData, statusId: string, replacementStatusId?: string): AppData {
  const status = data.statuses.find((candidate) => candidate.id === statusId && !candidate.deletedAt);
  if (!status) throw new DomainError("Status not found.");
  const current = activeStatuses(data);
  if (current.length <= 1) throw new DomainError("The final remaining Status cannot be deleted.");
  const affected = affectedTasksForStatus(data, statusId);
  const affectedProjects = data.projects.filter((project) => project.statusId === statusId);
  const replacement = replacementStatusId ? data.statuses.find((candidate) => candidate.id === replacementStatusId && !candidate.deletedAt && candidate.id !== statusId) : null;
  if ((affected.length > 0 || affectedProjects.length > 0) && !replacement) throw new DomainError("Choose a replacement Status for affected Tasks and Projects.");
  if (defaultStatusId(data) === statusId && !replacement) throw new DomainError("Choose a new default Status before deleting this Status.");
  const at = nowIso();
  const migratedTasks = replacement ? data.tasks.map((task) => task.statusId === statusId ? { ...task, statusId: replacement.id, updatedAt: at, version: task.version + 1 } : task) : data.tasks;
  const migratedProjects = replacement ? data.projects.map((project) => project.statusId === statusId ? { ...project, statusId: replacement.id, completedAt: replacement.category === "completed" ? at : null, cancelledAt: replacement.category === "cancelled" ? at : null, updatedAt: at, version: project.version + 1 } : project) : data.projects;
  let statuses = data.statuses.map((candidate) => candidate.id === statusId ? { ...candidate, deletedAt: at, updatedAt: at, version: candidate.version + 1 } : candidate);
  if (replacement && defaultStatusId(data) === statusId && replacement.category === "active") statuses = statusOrderWithDefault(statuses, replacement.id);
  validateStatusSemantics(statuses.filter((candidate) => !candidate.deletedAt));
  const events: ActivityEvent[] = [];
  if (affected.length && replacement) {
    events.push(createActivity("status", statusId, "statusMigration", `Migrated ${affected.length} task${affected.length === 1 ? "" : "s"} from ${status.name} to ${replacement.name}`, { statusId, name: status.name }, { statusId: replacement.id, name: replacement.name, taskIds: affected.map((task) => task.id) }));
    for (const task of affected) events.push(createActivity("task", task.id, "statusChanged", "Task status changed by Status deletion", statusId, replacement.id));
  }
  if (replacement && defaultStatusId(data) === statusId && replacement.category === "active") events.push(createActivity("status", replacement.id, "defaultChanged", `Default Status changed to ${replacement.name}`));
  events.push(createActivity("status", statusId, "softDeleted", `Status moved to Trash: ${status.name}`));
  if (affectedProjects.length && replacement) {
    for (const project of affectedProjects) events.push(createActivity("project", project.id, "statusChanged", "Project status changed by Status deletion", statusId, replacement.id));
  }
  return { ...data, tasks: migratedTasks, projects: migratedProjects, statuses, activity: [...data.activity, ...events] };
}
export function restoreStatusCommand(data: AppData, statusId: string): AppData {
  const status = data.statuses.find((candidate) => candidate.id === statusId && candidate.deletedAt);
  if (!status) throw new DomainError("Deleted Status not found.");
  if (data.statuses.some((candidate) => !candidate.deletedAt && candidate.id !== statusId && candidate.name.trim().toLocaleLowerCase() === status.name.trim().toLocaleLowerCase())) throw new DomainError("A current Status already uses this name.");
  if (data.statuses.some((candidate) => !candidate.deletedAt && candidate.id !== statusId && candidate.color === status.color)) throw new DomainError("A current Status already uses this colour.");
  if (data.statuses.some((candidate) => !candidate.deletedAt && candidate.id !== statusId && candidate.icon === status.icon)) throw new DomainError("A current Status already uses this icon.");
  const at = nowIso();
  const statuses = data.statuses.map((candidate) => candidate.id === statusId ? { ...candidate, deletedAt: null, updatedAt: at, version: candidate.version + 1 } : candidate);
  validateStatusSemantics(statuses.filter((candidate) => !candidate.deletedAt));
  return { ...data, statuses, activity: [...data.activity, createActivity("status", statusId, "restored", `Status restored: ${status.name}`)] };
}

export interface PriorityDraftInput { name: string; color: string; icon: string; makeDefault?: boolean }
function validateFivePriorities(data: AppData): Priority[] { const active = orderedActivePriorities(data); if (active.length !== 5) throw new DomainError("Exactly five active Priorities are required."); return active; }
export function updatePriorityCommand(data: AppData, priorityId: string, input: PriorityDraftInput): AppData {
  validateFivePriorities(data);
  const existing = data.priorities.find((priority) => priority.id === priorityId && !priority.deletedAt);
  if (!existing) throw new DomainError("Priority not found.");
  const name = input.name.trim();
  if (!name) throw new DomainError("Priority name is required.");
  const updated = { ...existing, name, color: input.color, icon: input.icon, updatedAt: nowIso(), version: existing.version + 1 };
  const events: ActivityEvent[] = [];
  if (existing.name !== updated.name) events.push(createActivity("priority", priorityId, "titleChanged", "Priority renamed", existing.name, updated.name));
  if (existing.color !== updated.color) events.push(createActivity("priority", priorityId, "colorChanged", "Priority colour changed", existing.color, updated.color));
  if (existing.icon !== updated.icon) events.push(createActivity("priority", priorityId, "iconChanged", "Priority icon changed", existing.icon, updated.icon));
  const settings = input.makeDefault && data.settings.defaultPriorityId !== priorityId ? { ...data.settings, defaultPriorityId: priorityId } : data.settings;
  if (settings !== data.settings) events.push(createActivity("priority", priorityId, "defaultChanged", `Default Priority changed to ${updated.name}`));
  return { ...data, settings, priorities: data.priorities.map((priority) => priority.id === priorityId ? updated : priority), activity: [...data.activity, ...events] };
}
export function reorderPriorityCommand(data: AppData, priorityId: string, direction: -1 | 1): AppData {
  const ordered = validateFivePriorities(data);
  const index = ordered.findIndex((priority) => priority.id === priorityId);
  const swap = index + direction;
  if (index < 0 || swap < 0 || swap >= ordered.length) return data;
  const ids = ordered.map((priority) => priority.id);
  [ids[index], ids[swap]] = [ids[swap], ids[index]];
  const at = nowIso();
  return { ...data, priorities: data.priorities.map((priority) => ids.includes(priority.id) ? { ...priority, rank: (ids.indexOf(priority.id) + 1) as Priority["rank"], updatedAt: at, version: priority.version + 1 } : priority), activity: [...data.activity, createActivity("priority", priorityId, "orderChanged", "Priority order changed", ordered.map((priority) => priority.id), ids)] };
}

export interface TagDraftInput { name: string; description: string; color: string; allowedScopes: TagScope[]; tagGroupId: string | null }
export interface TagGroupDraftInput { name: string; description: string; color?: string | null; mutuallyExclusive: boolean; inherited?: Record<string, boolean> }
export function assignmentCountsForTag(data: AppData, tagId: string) { return { tasks: data.tasks.filter((task) => task.tagIds.includes(tagId)).length, projects: data.projects.filter((project) => project.tagIds.includes(tagId)).length, referenceLists: data.referenceLists.filter((list) => list.tagIds.includes(tagId)).length }; }
function entityScopeForCollection(collection: "tasks" | "projects" | "referenceLists"): TagScope { return collection === "tasks" ? "task" : collection === "projects" ? "project" : "referenceList"; }
function validateTagDraft(data: AppData, input: TagDraftInput, tagId: string | null): string {
  const name = input.name.trim();
  if (!name) throw new DomainError("Tag name is required.");
  if (!input.allowedScopes.length) throw new DomainError("Choose at least one Tag scope.");
  if (input.allowedScopes.some((scope) => !["task", "project", "referenceList"].includes(scope))) throw new DomainError("Choose a supported Tag scope.");
  if (data.tags.some((tag) => !tag.deletedAt && tag.id !== tagId && tag.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase())) throw new DomainError("A current Tag already uses this name.");
  if (input.tagGroupId && !data.tagGroups.some((group) => group.id === input.tagGroupId && !group.deletedAt)) throw new DomainError("Choose an available Tag Group.");
  return name;
}
function repairExclusiveTagConflicts(data: AppData, groupId: string, preserveTagId?: string) {
  const members = data.tags.filter((tag) => !tag.deletedAt && tag.tagGroupId === groupId).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  const memberIds = new Set(members.map((tag) => tag.id));
  const repairIds = (ids: string[]) => {
    const selected = ids.filter((id) => memberIds.has(id));
    if (selected.length <= 1) return ids;
    const keep = preserveTagId && selected.includes(preserveTagId) ? preserveTagId : members.find((tag) => selected.includes(tag.id))!.id;
    return ids.filter((id) => !memberIds.has(id) || id === keep);
  };
  const at = nowIso();
  const events: ActivityEvent[] = [];
  const tasks = data.tasks.map((task) => { const nextIds = repairIds(task.tagIds); if (nextIds === task.tagIds || JSON.stringify(nextIds) === JSON.stringify(task.tagIds)) return task; events.push(createActivity("task", task.id, "tagsChanged", "Tag conflict repaired", task.tagIds, nextIds)); return { ...task, tagIds: nextIds, updatedAt: at, version: task.version + 1 }; });
  const projects = data.projects.map((project) => { const nextIds = repairIds(project.tagIds); if (nextIds === project.tagIds || JSON.stringify(nextIds) === JSON.stringify(project.tagIds)) return project; events.push(createActivity("project", project.id, "tagsChanged", "Tag conflict repaired", project.tagIds, nextIds)); return { ...project, tagIds: nextIds, updatedAt: at, version: project.version + 1 }; });
  const referenceLists = data.referenceLists.map((list) => { const nextIds = repairIds(list.tagIds); if (nextIds === list.tagIds || JSON.stringify(nextIds) === JSON.stringify(list.tagIds)) return list; events.push(createActivity("referenceList", list.id, "tagsChanged", "Tag conflict repaired", list.tagIds, nextIds)); return { ...list, tagIds: nextIds, updatedAt: at, version: list.version + 1 }; });
  return { data: { ...data, tasks, projects, referenceLists }, events };
}
function detachTagFromUnsupportedScopes(data: AppData, tagId: string, scopes: TagScope[]) {
  const allowed = new Set(scopes);
  const at = nowIso();
  const events: ActivityEvent[] = [];
  const detach = <T extends Task | Project | ReferenceList>(record: T, scope: TagScope): T => {
    if (allowed.has(scope) || !record.tagIds.includes(tagId)) return record;
    const nextIds = record.tagIds.filter((id) => id !== tagId);
    events.push(createActivity(record.kind, record.id, "tagsChanged", "Tag detached after scope change", record.tagIds, nextIds));
    return { ...record, tagIds: nextIds, updatedAt: at, version: record.version + 1 };
  };
  return { data: { ...data, tasks: data.tasks.map((task) => detach(task, "task")), projects: data.projects.map((project) => detach(project, "project")), referenceLists: data.referenceLists.map((list) => detach(list, "referenceList")) }, events };
}
export function createTagCommand(data: AppData, input: TagDraftInput): AppData {
  const name = validateTagDraft(data, input, null);
  const groupColor = input.tagGroupId ? data.tagGroups.find((group) => group.id === input.tagGroupId && !group.deletedAt)?.color : null;
  const tag: Tag = { ...createMeta("tag"), kind: "tag", name, description: input.description.trim(), color: groupColor || input.color, allowedScopes: [...new Set(input.allowedScopes)], tagGroupId: input.tagGroupId, order: data.tags.filter((candidate) => !candidate.deletedAt).length + 1 };
  const withTag = { ...data, tags: [...data.tags, tag] };
  const repaired = tag.tagGroupId && data.tagGroups.find((group) => group.id === tag.tagGroupId)?.mutuallyExclusive ? repairExclusiveTagConflicts(withTag, tag.tagGroupId, tag.id) : { data: withTag, events: [] };
  return { ...repaired.data, activity: [...repaired.data.activity, createActivity("tag", tag.id, "created", `Tag created: ${tag.name}`), ...repaired.events] };
}
export function updateTagCommand(data: AppData, tagId: string, input: TagDraftInput): AppData {
  const existing = data.tags.find((tag) => tag.id === tagId && !tag.deletedAt);
  if (!existing) throw new DomainError("Tag not found.");
  const name = validateTagDraft(data, input, tagId);
  const detached = detachTagFromUnsupportedScopes(data, tagId, input.allowedScopes);
  const at = nowIso();
  const groupColor = input.tagGroupId ? data.tagGroups.find((group) => group.id === input.tagGroupId && !group.deletedAt)?.color : null;
  const updated: Tag = { ...existing, name, description: input.description.trim(), color: groupColor || input.color, allowedScopes: [...new Set(input.allowedScopes)], tagGroupId: input.tagGroupId, updatedAt: at, version: existing.version + 1 };
  let next: AppData = { ...detached.data, tags: detached.data.tags.map((tag) => tag.id === tagId ? updated : tag) };
  const repaired = updated.tagGroupId && data.tagGroups.find((group) => group.id === updated.tagGroupId)?.mutuallyExclusive ? repairExclusiveTagConflicts(next, updated.tagGroupId, tagId) : { data: next, events: [] };
  next = repaired.data;
  const events: ActivityEvent[] = [...detached.events, ...repaired.events];
  if (existing.name !== updated.name) events.push(createActivity("tag", tagId, "titleChanged", "Tag renamed", existing.name, updated.name));
  if (existing.description !== updated.description) events.push(createActivity("tag", tagId, "descriptionChanged", "Tag description changed", existing.description, updated.description));
  if (existing.color !== updated.color) events.push(createActivity("tag", tagId, "colorChanged", "Colour changed", existing.color, updated.color));
  if (JSON.stringify(existing.allowedScopes) !== JSON.stringify(updated.allowedScopes)) events.push(createActivity("tag", tagId, "scopeChanged", "Tag scopes changed", existing.allowedScopes, updated.allowedScopes));
  if (existing.tagGroupId !== updated.tagGroupId) events.push(createActivity("tag", tagId, "groupChanged", "Tag Group changed", existing.tagGroupId, updated.tagGroupId));
  return { ...next, activity: [...next.activity, ...events] };
}
export function reorderTagCommand(data: AppData, tagId: string, direction: -1 | 1): AppData {
  const current = data.tags.find((tag) => tag.id === tagId && !tag.deletedAt);
  if (!current) return data;
  const activeGroupIds = new Set(data.tagGroups.filter((group) => !group.deletedAt).map((group) => group.id));
  const currentGroupId = current.tagGroupId && activeGroupIds.has(current.tagGroupId) ? current.tagGroupId : null;
  const ordered = data.tags
    .filter((tag) => !tag.deletedAt && (tag.tagGroupId && activeGroupIds.has(tag.tagGroupId) ? tag.tagGroupId : null) === currentGroupId)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  const index = ordered.findIndex((tag) => tag.id === tagId), swap = index + direction;
  if (index < 0 || swap < 0 || swap >= ordered.length) return data;
  const ids = ordered.map((tag) => tag.id); [ids[index], ids[swap]] = [ids[swap], ids[index]];
  const at = nowIso();
  return { ...data, tags: data.tags.map((tag) => ids.includes(tag.id) ? { ...tag, order: ids.indexOf(tag.id) + 1, updatedAt: at, version: tag.version + 1 } : tag), activity: [...data.activity, createActivity("tag", tagId, "orderChanged", "Tag order changed", ordered.map((tag) => tag.id), ids)] };
}
export function reorderTagRelativeCommand(data: AppData, tagId: string, targetTagId: string, placement: "before" | "after"): AppData {
  const current = data.tags.find((tag) => tag.id === tagId && !tag.deletedAt);
  const target = data.tags.find((tag) => tag.id === targetTagId && !tag.deletedAt);
  if (!current || !target || current.id === target.id) return data;
  const activeGroupIds = new Set(data.tagGroups.filter((group) => !group.deletedAt).map((group) => group.id));
  const effectiveGroupId = (tag: Tag) => tag.tagGroupId && activeGroupIds.has(tag.tagGroupId) ? tag.tagGroupId : null;
  if (effectiveGroupId(current) !== effectiveGroupId(target)) return data;
  const ordered = data.tags
    .filter((tag) => !tag.deletedAt && effectiveGroupId(tag) === effectiveGroupId(current))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  const previousIds = ordered.map((tag) => tag.id);
  const ids = previousIds.filter((id) => id !== tagId);
  const targetIndex = ids.indexOf(targetTagId);
  if (targetIndex < 0) return data;
  ids.splice(targetIndex + (placement === "after" ? 1 : 0), 0, tagId);
  if (ids.every((id, index) => id === previousIds[index])) return data;
  const at = nowIso();
  return { ...data, tags: data.tags.map((tag) => ids.includes(tag.id) ? { ...tag, order: ids.indexOf(tag.id) + 1, updatedAt: at, version: tag.version + 1 } : tag), activity: [...data.activity, createActivity("tag", tagId, "orderChanged", "Tag order changed", previousIds, ids)] };
}
export function deleteTagCommand(data: AppData, tagId: string): AppData {
  const tag = data.tags.find((candidate) => candidate.id === tagId && !candidate.deletedAt);
  if (!tag) throw new DomainError("Tag not found.");
  const at = nowIso();
  const events: ActivityEvent[] = [createActivity("tag", tagId, "softDeleted", `Tag moved to Trash: ${tag.name}`)];
  const remove = <T extends Task | Project | ReferenceList>(record: T): T => {
    if (!record.tagIds.includes(tagId)) return record;
    const nextIds = record.tagIds.filter((id) => id !== tagId);
    events.push(createActivity(record.kind, record.id, "tagsChanged", "Tag removed by Tag deletion", record.tagIds, nextIds));
    return { ...record, tagIds: nextIds, updatedAt: at, version: record.version + 1 };
  };
  return { ...data, tasks: data.tasks.map(remove), projects: data.projects.map(remove), referenceLists: data.referenceLists.map(remove), tags: data.tags.map((candidate) => candidate.id === tagId ? { ...candidate, deletedAt: at, updatedAt: at, version: candidate.version + 1 } : candidate), activity: [...data.activity, ...events] };
}
export function createTagGroupCommand(data: AppData, input: TagGroupDraftInput): AppData {
  const name = input.name.trim();
  if (!name) throw new DomainError("Tag Group name is required.");
  const group: TagGroup = { ...createMeta("group"), kind: "tagGroup", name, description: input.description.trim(), color: input.color ?? "var(--palette-aqua-light)", mutuallyExclusive: input.mutuallyExclusive, inherited: input.inherited ?? {}, order: data.tagGroups.filter((candidate) => !candidate.deletedAt).length + 1 };
  return { ...data, tagGroups: [...data.tagGroups, group], activity: [...data.activity, createActivity("tagGroup", group.id, "created", `Tag Group created: ${group.name}`)] };
}
export function updateTagGroupCommand(data: AppData, groupId: string, input: TagGroupDraftInput): AppData {
  const existing = data.tagGroups.find((group) => group.id === groupId && !group.deletedAt);
  if (!existing) throw new DomainError("Tag Group not found.");
  const name = input.name.trim();
  if (!name) throw new DomainError("Tag Group name is required.");
  const updated = { ...existing, name, description: input.description.trim(), color: input.color ?? existing.color ?? "var(--palette-aqua-light)", mutuallyExclusive: input.mutuallyExclusive, inherited: input.inherited ?? existing.inherited, updatedAt: nowIso(), version: existing.version + 1 };
  let next: AppData = { ...data, tagGroups: data.tagGroups.map((group) => group.id === groupId ? updated : group) };
  const repaired = !existing.mutuallyExclusive && updated.mutuallyExclusive ? repairExclusiveTagConflicts(next, groupId) : { data: next, events: [] };
  next = repaired.data;
  const events = [...repaired.events];
  if (existing.name !== updated.name) events.push(createActivity("tagGroup", groupId, "titleChanged", "Tag Group renamed", existing.name, updated.name));
  if (existing.description !== updated.description) events.push(createActivity("tagGroup", groupId, "descriptionChanged", "Tag Group description changed", existing.description, updated.description));
  if (existing.mutuallyExclusive !== updated.mutuallyExclusive || JSON.stringify(existing.inherited) !== JSON.stringify(updated.inherited)) events.push(createActivity("tagGroup", groupId, "semanticChanged", "Tag Group inherited property changed", existing, updated));
  if (repaired.events.length) events.push(createActivity("tagGroup", groupId, "conflictRepaired", "Mutually exclusive Tag conflicts repaired"));
  return { ...next, activity: [...next.activity, ...events] };
}
export function reorderTagGroupCommand(data: AppData, groupId: string, direction: -1 | 1): AppData {
  const ordered = orderedActiveTagGroups(data);
  const index = ordered.findIndex((group) => group.id === groupId), swap = index + direction;
  if (index < 0 || swap < 0 || swap >= ordered.length) return data;
  const ids = ordered.map((group) => group.id); [ids[index], ids[swap]] = [ids[swap], ids[index]];
  const at = nowIso();
  return { ...data, tagGroups: data.tagGroups.map((group) => ids.includes(group.id) ? { ...group, order: ids.indexOf(group.id) + 1, updatedAt: at, version: group.version + 1 } : group), activity: [...data.activity, createActivity("tagGroup", groupId, "orderChanged", "Tag Group order changed", ordered.map((group) => group.id), ids)] };
}
export function deleteTagGroupCommand(data: AppData, groupId: string): AppData {
  const group = data.tagGroups.find((candidate) => candidate.id === groupId && !candidate.deletedAt);
  if (!group) throw new DomainError("Tag Group not found.");
  const at = nowIso();
  const memberIds = data.tags.filter((tag) => tag.tagGroupId === groupId && !tag.deletedAt).map((tag) => tag.id);
  return { ...data, tags: data.tags.map((tag) => tag.tagGroupId === groupId ? { ...tag, tagGroupId: null, updatedAt: at, version: tag.version + 1 } : tag), tagGroups: data.tagGroups.map((candidate) => candidate.id === groupId ? { ...candidate, deletedAt: at, updatedAt: at, version: candidate.version + 1 } : candidate), activity: [...data.activity, createActivity("tagGroup", groupId, "softDeleted", `Tag Group moved to Trash: ${group.name}`), ...(memberIds.length ? [createActivity("tagGroup", groupId, "detached", `Made ${memberIds.length} Tag${memberIds.length === 1 ? "" : "s"} Loose`, null, { tagIds: memberIds })] : [])] };
}

export function isValidReferenceLink(link: string): boolean { try { const url = new URL(link); return url.protocol === "https:" || url.protocol === "http:"; } catch { return false; } }
export function normaliseReferenceLink(link: string): string | null { const value = link.trim(); return value && isValidReferenceLink(value) ? value : null; }
function parseReferenceEntryLine(line: string): { text: string; link: string | null } {
  const text = line.trim();
  const linkStart = text.lastIndexOf("(");
  if (linkStart > 0 && text.endsWith(")")) {
    const name = text.slice(0, linkStart).trim();
    const link = normaliseReferenceLink(text.slice(linkStart + 1, -1));
    if (name && link) return { text: name, link };
  }
  return { text, link: normaliseReferenceLink(text) };
}
export function addReferenceEntries(data: AppData, listId: string, pastedText: string, tagIds: string[] = []): AppData {
  const list = data.referenceLists.find((candidate) => candidate.id === listId && !candidate.deletedAt);
  if (!list || list.archivedAt) throw new DomainError("This List is read-only.");
  const lines = pastedText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) throw new DomainError("Enter at least one List Item.");
  const active = data.referenceListEntries.filter((entry) => entry.referenceListId === listId && !entry.deletedAt).sort((a, b) => a.orderKey.localeCompare(b.orderKey));
  const start = active.length;
  const entries = lines.map((line, index): ReferenceListEntry => {
    const parsed = parseReferenceEntryLine(line);
    return { ...createMeta("refentry"), kind: "referenceListEntry", referenceListId: listId, text: parsed.text, link: parsed.link, orderKey: makeOrderKey(start + index + 1), tagIds: tagIds.filter((tagId) => data.tags.find((tag) => tag.id === tagId)?.allowedScopes.includes("referenceList")) };
  });
  return { ...data, referenceListEntries: [...data.referenceListEntries, ...entries], activity: [...data.activity, createActivity("referenceList", listId, "referenceEntriesAdded", `Added ${entries.length} List Items`, null, { entryIds: entries.map((entry) => entry.id), itemCount: entries.length })] };
}
export function createReferenceEntry(data: AppData, listId: string, text: string, link = ""): AppData { const cleanText = text.trim(); if (!cleanText) return data; const cleanLink = link.trim(); if (cleanLink && !isValidReferenceLink(cleanLink)) throw new DomainError("Use a full http:// or https:// link, or leave the link empty."); const start = data.referenceListEntries.filter((entry) => entry.referenceListId === listId).length; const entry: ReferenceListEntry = { ...createMeta("refentry"), kind: "referenceListEntry", referenceListId: listId, text: cleanText, link: cleanLink || null, orderKey: makeOrderKey(start + 1), tagIds: [] }; return { ...data, referenceListEntries: [...data.referenceListEntries, entry], activity: [...data.activity, createActivity("referenceList", listId, "referenceEntriesAdded", "Added List item", null, { entryIds: [entry.id] })] }; }
export function updateReferenceEntry(data: AppData, entryId: string, text: string, link = ""): AppData { const entry = data.referenceListEntries.find((candidate) => candidate.id === entryId); if (!entry) throw new DomainError("List item not found."); const cleanText = text.trim(); if (!cleanText) throw new DomainError("Text is required."); const cleanLink = link.trim(); if (cleanLink && !isValidReferenceLink(cleanLink)) throw new DomainError("Use a full http:// or https:// link, or leave the link empty."); const updated = { ...entry, text: cleanText, link: cleanLink || null, updatedAt: nowIso(), version: entry.version + 1 }; return { ...data, referenceListEntries: data.referenceListEntries.map((candidate) => candidate.id === entryId ? updated : candidate), activity: [...data.activity, createActivity("referenceListEntry", entryId, "titleChanged", "List item updated", entry, updated)] }; }
export function reorderReferenceEntries(data: AppData, listId: string, orderedIds: string[]): AppData { const at = nowIso(); const order = new Map(orderedIds.map((id, index) => [id, makeOrderKey(index + 1)])); return { ...data, referenceListEntries: data.referenceListEntries.map((entry) => entry.referenceListId === listId && order.has(entry.id) ? { ...entry, orderKey: order.get(entry.id)!, updatedAt: at, version: entry.version + 1 } : entry), activity: [...data.activity, createActivity("referenceList", listId, "referenceEntriesReordered", "List item order changed")] }; }
export function reorderReferenceEntry(data: AppData, entryId: string, direction: -1 | 1): AppData { const entry = data.referenceListEntries.find((candidate) => candidate.id === entryId); if (!entry) return data; const siblings = data.referenceListEntries.filter((candidate) => candidate.referenceListId === entry.referenceListId && !candidate.deletedAt).sort((a, b) => a.orderKey.localeCompare(b.orderKey)); const index = siblings.findIndex((candidate) => candidate.id === entryId); const swapWith = index + direction; if (index < 0 || swapWith < 0 || swapWith >= siblings.length) return data; const other = siblings[swapWith]; const at = nowIso(); return { ...data, referenceListEntries: data.referenceListEntries.map((candidate) => candidate.id === entry.id ? { ...candidate, orderKey: other.orderKey, updatedAt: at, version: candidate.version + 1 } : candidate.id === other.id ? { ...candidate, orderKey: entry.orderKey, updatedAt: at, version: candidate.version + 1 } : candidate), activity: [...data.activity, createActivity("referenceList", entry.referenceListId, "referenceEntriesReordered", "List item order changed")] }; }
export function entryPartsWithUrls(text: string): Array<{ type: "text" | "url"; value: string }> { const pattern = /https?:\/\/[^\s<>"']+/g; const parts: Array<{ type: "text" | "url"; value: string }> = []; let last = 0; for (const match of text.matchAll(pattern)) { if (match.index === undefined) continue; if (match.index > last) parts.push({ type: "text", value: text.slice(last, match.index) }); parts.push({ type: "url", value: match[0] }); last = match.index + match[0].length; } if (last < text.length) parts.push({ type: "text", value: text.slice(last) }); return parts.length ? parts : [{ type: "text", value: text }]; }

export function softDeleteEntity(data: AppData, entityKind: EntityKind, entityId: string): AppData { const at = nowIso(); const apply = <T extends MutableRecord>(record: T): T => ({ ...record, deletedAt: at, updatedAt: at, version: record.version + 1 }); if (entityKind === "task") return softDeleteTaskSubtree(data, entityId); return { ...data, areas: entityKind === "area" ? data.areas.map((item) => item.id === entityId ? apply(item) : item) : data.areas, projects: entityKind === "project" ? data.projects.map((item) => item.id === entityId ? apply(item) : item) : data.projects, tasks: data.tasks, referenceLists: entityKind === "referenceList" ? data.referenceLists.map((item) => item.id === entityId ? apply(item) : item) : data.referenceLists, referenceListEntries: entityKind === "referenceListEntry" ? data.referenceListEntries.map((item) => item.id === entityId ? apply(item) : item) : data.referenceListEntries, tags: entityKind === "tag" ? data.tags.map((item) => item.id === entityId ? apply(item) : item) : data.tags, tagGroups: entityKind === "tagGroup" ? data.tagGroups.map((item) => item.id === entityId ? apply(item) : item) : data.tagGroups, statuses: entityKind === "status" ? data.statuses.map((item) => item.id === entityId ? apply(item) : item) : data.statuses, priorities: entityKind === "priority" ? data.priorities.map((item) => item.id === entityId ? apply(item) : item) : data.priorities, activity: [...data.activity, createActivity(entityKind, entityId, "softDeleted", "Moved to Trash")] }; }
export function restoreEntity(data: AppData, entityKind: EntityKind, entityId: string): AppData { const at = nowIso(); const apply = <T extends MutableRecord>(record: T): T => ({ ...record, deletedAt: null, updatedAt: at, version: record.version + 1 }); if (entityKind === "task") return restoreTaskSubtree(data, entityId); return { ...data, areas: entityKind === "area" ? data.areas.map((item) => item.id === entityId ? apply(item) : item) : data.areas, projects: entityKind === "project" ? data.projects.map((item) => item.id === entityId ? apply(item) : item) : data.projects, tasks: data.tasks, referenceLists: entityKind === "referenceList" ? data.referenceLists.map((item) => item.id === entityId ? apply(item) : item) : data.referenceLists, referenceListEntries: entityKind === "referenceListEntry" ? data.referenceListEntries.map((item) => item.id === entityId ? apply(item) : item) : data.referenceListEntries, tags: entityKind === "tag" ? data.tags.map((item) => item.id === entityId ? apply(item) : item) : data.tags, tagGroups: entityKind === "tagGroup" ? data.tagGroups.map((item) => item.id === entityId ? apply(item) : item) : data.tagGroups, statuses: entityKind === "status" ? data.statuses.map((item) => item.id === entityId ? apply(item) : item) : data.statuses, priorities: entityKind === "priority" ? data.priorities.map((item) => item.id === entityId ? apply(item) : item) : data.priorities, activity: [...data.activity, createActivity(entityKind, entityId, "restored", "Restored from Trash")] }; }
export function softDeleteTaskSubtree(data: AppData, taskId: string): AppData { const root = data.tasks.find((task) => task.id === taskId && !task.deletedAt); if (!root) throw new DomainError("Task not found."); const at = nowIso(); const subtree = [root, ...descendants(data, taskId)]; const ids = new Set(subtree.map((task) => task.id)); return { ...data, tasks: data.tasks.map((task) => ids.has(task.id) ? { ...task, deletedAt: at, updatedAt: at, version: task.version + 1 } : task), activity: [...data.activity, createActivity("task", taskId, "softDeleted", subtree.length === 1 ? "Task moved to Trash" : "Task subtree moved to Trash", null, { taskIds: [...ids], taskCount: subtree.length, actionableLeafCount: subtree.filter((task) => !task.aggregate).length, aggregateCount: subtree.filter((task) => task.aggregate).length })] }; }
export function restoreTaskSubtree(data: AppData, taskId: string): AppData { const root = data.tasks.find((task) => task.id === taskId && task.deletedAt); if (!root) throw new DomainError("Deleted Task not found."); const at = nowIso(); const collect = (id: string): Task[] => data.tasks.filter((task) => task.parentTaskId === id).flatMap((task) => [task, ...collect(task.id)]); const subtree = [root, ...collect(taskId)]; const ids = new Set(subtree.map((task) => task.id)); return { ...data, tasks: data.tasks.map((task) => ids.has(task.id) ? { ...task, deletedAt: null, updatedAt: at, version: task.version + 1 } : task), activity: [...data.activity, createActivity("task", taskId, "restored", ids.size === 1 ? "Task restored from Trash" : "Task subtree restored from Trash", null, { taskIds: [...ids], taskCount: ids.size })] }; }

export interface RecurrenceRuleInput { label: string; frequency: RecurrenceFrequency; interval: number; weekdays: number[]; dayOfMonth: number | null; firstScheduledDate: string; endDate: string | null; template: RecurrenceTaskTemplate }
export interface RecurrenceProcessingResult { data: AppData; generatedCount: number; collapsedCount: number; processedRuleIds: string[]; blockedRuleIds: string[] }
export function recurrenceOccurrenceKey(ruleId: string, occurrenceDate: string): string { return `${ruleId}:${occurrenceDate}`; }
export function ruleSummary(rule: RecurrenceRule): string {
  const interval = Math.max(1, rule.interval);
  if (rule.frequency === "daily") return interval === 1 ? "Daily" : `Every ${interval} days`;
  if (rule.frequency === "weekly") {
    const names = [...rule.weekdays].sort((a, b) => a - b).map((day) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day]).join(", ");
    return `${interval === 1 ? "Weekly" : `Every ${interval} weeks`}${names ? ` on ${names}` : ""}`;
  }
  return `${interval === 1 ? "Monthly" : `Every ${interval} months`} on day ${rule.dayOfMonth ?? Number(rule.firstScheduledDate.slice(8, 10))}`;
}
export function validateRecurrenceRuleInput(data: AppData, input: RecurrenceRuleInput): void {
  if (!input.label.trim() && !input.template.title.trim()) throw new DomainError("Schedule name or Task title is required.");
  if (!input.template.title.trim()) throw new DomainError("Task title is required.");
  if (!["daily", "weekly", "monthly"].includes(input.frequency)) throw new DomainError("Choose a supported recurrence type.");
  if (!Number.isInteger(input.interval) || input.interval < 1) throw new DomainError("Interval must be at least 1.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.firstScheduledDate)) throw new DomainError("Start date is required.");
  if (input.endDate && input.endDate < input.firstScheduledDate) throw new DomainError("End date cannot be before the start date.");
  if (input.frequency === "weekly" && input.weekdays.length === 0) throw new DomainError("Choose at least one weekday.");
  if (input.frequency === "monthly" && (!input.dayOfMonth || input.dayOfMonth < 1 || input.dayOfMonth > 31)) throw new DomainError("Choose a monthly day from 1 to 31.");
  validateRecurrenceDestination(data, input.template.location);
  if (!data.priorities.some((priority) => priority.id === input.template.priorityId && !priority.deletedAt)) throw new DomainError("Choose an available Priority.");
  if (input.template.tagIds.some((tagId) => !data.tags.some((tag) => tag.id === tagId && !tag.deletedAt && tag.allowedScopes.includes("task")))) throw new DomainError("Choose Task tags only.");
}
export function createRecurrenceRuleCommand(data: AppData, input: RecurrenceRuleInput, effectiveDate = localDate()): AppData {
  validateRecurrenceRuleInput(data, input);
  const first = firstOccurrenceOnOrAfter(input, input.firstScheduledDate > effectiveDate ? input.firstScheduledDate : effectiveDate);
  const rule: RecurrenceRule = { ...createMeta("recur"), kind: "recurrenceRule", label: input.label.trim() || input.template.title.trim(), active: true, frequency: input.frequency, interval: input.interval, weekdays: [...input.weekdays].sort((a, b) => a - b), dayOfMonth: input.dayOfMonth, firstScheduledDate: input.firstScheduledDate, endDate: input.endDate, lastGeneratedDate: null, nextBoundaryDate: first, template: normaliseRecurrenceTemplate(data, input.template), pausedAt: null, lastProcessedOccurrenceKey: null, lastSuccessfulProcessingAt: null, attention: null };
  return { ...data, recurrenceRules: [...data.recurrenceRules, rule], activity: [...data.activity, createActivity("recurrenceRule", rule.id, "created", "Schedule created", null, { rule: ruleSummary(rule), start: rule.firstScheduledDate, destination: rule.template.location })] };
}
export function updateRecurrenceRuleCommand(data: AppData, ruleId: string, input: RecurrenceRuleInput, effectiveDate = localDate()): AppData {
  const existing = data.recurrenceRules.find((rule) => rule.id === ruleId && !rule.deletedAt);
  if (!existing) throw new DomainError("Schedule not found.");
  validateRecurrenceRuleInput(data, input);
  const candidate = { ...existing, label: input.label.trim() || input.template.title.trim(), frequency: input.frequency, interval: input.interval, weekdays: [...input.weekdays].sort((a, b) => a - b), dayOfMonth: input.dayOfMonth, firstScheduledDate: input.firstScheduledDate, endDate: input.endDate, template: normaliseRecurrenceTemplate(data, input.template) };
  const nextBoundaryDate = existing.active && !existing.pausedAt ? firstOccurrenceOnOrAfter(candidate, effectiveDate) : existing.nextBoundaryDate;
  const updated: RecurrenceRule = { ...candidate, nextBoundaryDate, attention: null, updatedAt: nowIso(), version: existing.version + 1 };
  return { ...data, recurrenceRules: data.recurrenceRules.map((rule) => rule.id === ruleId ? updated : rule), activity: [...data.activity, createActivity("recurrenceRule", ruleId, "recurrenceGenerated", "Schedule edited", { rule: ruleSummary(existing), template: existing.template, destination: existing.template.location }, { rule: ruleSummary(updated), template: updated.template, destination: updated.template.location, nextBoundaryDate })] };
}
export function pauseRecurrenceRuleCommand(data: AppData, ruleId: string): AppData {
  const existing = data.recurrenceRules.find((rule) => rule.id === ruleId && !rule.deletedAt);
  if (!existing) throw new DomainError("Schedule not found.");
  if (!existing.active || existing.pausedAt) return data;
  const updated = { ...existing, active: false, pausedAt: nowIso(), updatedAt: nowIso(), version: existing.version + 1 };
  return { ...data, recurrenceRules: data.recurrenceRules.map((rule) => rule.id === ruleId ? updated : rule), activity: [...data.activity, createActivity("recurrenceRule", ruleId, "recurrencePaused", "Schedule paused", { active: true, pausedAt: null }, { active: false, pausedAt: updated.pausedAt })] };
}
export function resumeRecurrenceRuleCommand(data: AppData, ruleId: string, resumeDate = localDate()): AppData {
  const existing = data.recurrenceRules.find((rule) => rule.id === ruleId && !rule.deletedAt);
  if (!existing) throw new DomainError("Schedule not found.");
  validateRecurrenceDestination(data, existing.template.location);
  const updated = { ...existing, active: true, pausedAt: null, attention: null, nextBoundaryDate: firstOccurrenceOnOrAfter(existing, resumeDate), updatedAt: nowIso(), version: existing.version + 1 };
  return { ...data, recurrenceRules: data.recurrenceRules.map((rule) => rule.id === ruleId ? updated : rule), activity: [...data.activity, createActivity("recurrenceRule", ruleId, "recurrenceResumed", "Schedule resumed", { active: existing.active, pausedAt: existing.pausedAt, nextBoundaryDate: existing.nextBoundaryDate }, { active: true, pausedAt: null, nextBoundaryDate: updated.nextBoundaryDate })] };
}
export function softDeleteRecurrenceRuleCommand(data: AppData, ruleId: string): AppData {
  const existing = data.recurrenceRules.find((rule) => rule.id === ruleId && !rule.deletedAt);
  if (!existing) throw new DomainError("Schedule not found.");
  const updated = { ...existing, active: false, deletedAt: nowIso(), updatedAt: nowIso(), version: existing.version + 1 };
  return { ...data, recurrenceRules: data.recurrenceRules.map((rule) => rule.id === ruleId ? updated : rule), activity: [...data.activity, createActivity("recurrenceRule", ruleId, "softDeleted", "Schedule moved to Trash", { deletedAt: null }, { deletedAt: updated.deletedAt })] };
}
export function processDueRecurrenceSchedules(data: AppData, today = localDate()): RecurrenceProcessingResult {
  let next = data;
  let generatedCount = 0;
  let collapsedCount = 0;
  const processedRuleIds: string[] = [];
  const blockedRuleIds: string[] = [];
  for (const rule of data.recurrenceRules.filter((candidate) => candidate.active && !candidate.pausedAt && !candidate.deletedAt)) {
    const destinationProblem = recurrenceDestinationProblem(next, rule.template.location);
    if (destinationProblem) {
      const marked = markRecurrenceAttention(next, rule.id, destinationProblem.reason, destinationProblem.message);
      if (marked !== next) { next = marked; blockedRuleIds.push(rule.id); }
      continue;
    }
    const due = dueOccurrenceDates(rule, today);
    if (due.length === 0) continue;
    const latest = due.at(-1)!;
    const key = recurrenceOccurrenceKey(rule.id, latest);
    let updatedRule = next.recurrenceRules.find((candidate) => candidate.id === rule.id)!;
    if (!occurrenceConsumed(next, rule.id, latest)) {
      const operationId = `recurrence:${key}:${nowIso()}`;
      const task: Task = { ...createMeta("task"), kind: "task", title: updatedRule.template.title, description: updatedRule.template.description, statusId: defaultStatusId(next), priorityId: updatedRule.template.priorityId, scheduledDate: updatedRule.template.dueOnOccurrence === false ? null : latest, revealDate: updatedRule.template.revealDate, location: updatedRule.template.location, parentTaskId: null, childTaskIds: [], order: next.tasks.length + 1, tagIds: [...updatedRule.template.tagIds], quantifierSelections: normaliseQuantifierSelections(next.quantifierDefinitions, updatedRule.template.quantifierSelections), mustDoToday: false, aggregate: false, completedAt: null, cancelledAt: null, checklist: (updatedRule.template.checklist ?? []).map((item, index) => ({ ...item, id: newId("check"), checked: false, order: index + 1, createdAt: nowIso(), updatedAt: nowIso() })), recurrence: { ruleId: rule.id, occurrenceKey: key, occurrenceDate: latest, generationOperationId: operationId, scheduleLabel: updatedRule.label, collapsedCount: due.length > 1 ? due.length : undefined, firstMissedDate: due.length > 1 ? due[0] : undefined, lastMissedDate: due.length > 1 ? latest : undefined } };
      const generation: RecurrenceGeneration = { ...createMeta("recurgen"), kind: "recurrenceGeneration", ruleId: rule.id, occurrenceDate: latest, taskId: task.id, occurrenceKey: key, collapsedCount: due.length, firstMissedDate: due[0], lastMissedDate: latest, operationId };
      next = { ...next, tasks: [...next.tasks, task], recurrenceGenerations: [...next.recurrenceGenerations, generation], activity: [...next.activity, createActivity("task", task.id, "recurrenceGenerated", "Generated from Schedule", null, task.recurrence), createActivity("recurrenceRule", rule.id, due.length > 1 ? "recurrenceCollapsed" : "recurrenceGenerated", due.length > 1 ? `Collapsed ${due.length} missed occurrences into ${latest}` : `Generated occurrence for ${latest}`, null, { taskId: task.id, occurrenceKey: key, occurrenceDate: latest, collapsedCount: due.length, firstMissedDate: due[0], lastMissedDate: latest })] };
      generatedCount += 1;
      if (due.length > 1) collapsedCount += due.length - 1;
    }
    const nextBoundaryDate = firstFutureOccurrenceAfter(updatedRule, today);
    updatedRule = { ...updatedRule, lastGeneratedDate: latest, lastProcessedOccurrenceKey: key, lastSuccessfulProcessingAt: nowIso(), nextBoundaryDate, attention: null, updatedAt: nowIso(), version: updatedRule.version + 1 };
    next = { ...next, recurrenceRules: next.recurrenceRules.map((candidate) => candidate.id === rule.id ? updatedRule : candidate) };
    processedRuleIds.push(rule.id);
  }
  return { data: next, generatedCount, collapsedCount, processedRuleIds, blockedRuleIds };
}
export function generateDueRecurrences(data: AppData, today = localDate()): AppData { return processDueRecurrenceSchedules(data, today).data; }
export function nextRecurrenceDate(rule: RecurrenceRule, fromDate: string): string { if (rule.frequency === "daily") return addDays(fromDate, Math.max(1, rule.interval)); if (rule.frequency === "weekly") { const selected = rule.weekdays.length ? [...rule.weekdays].sort((a, b) => a - b) : [weekdayIndex(fromDate)]; for (let offset = 1; offset <= 7 * Math.max(1, rule.interval); offset++) { const candidate = addDays(fromDate, offset); if (selected.includes(weekdayIndex(candidate))) return candidate; } } return addMonthsPinned(fromDate, Math.max(1, rule.interval), rule.dayOfMonth ?? Number(fromDate.slice(8, 10))); }
export function missedOccurrenceGroups(data: AppData, today = localDate()) { return data.recurrenceRules.map((rule) => { const taskIds = new Set(data.recurrenceGenerations.filter((generation) => generation.ruleId === rule.id && generation.occurrenceDate < today).map((generation) => generation.taskId)); const openTasks = data.tasks.filter((task) => taskIds.has(task.id) && !task.deletedAt && !isTaskClosed(data, task)); return { ruleId: rule.id, count: openTasks.length, taskIds: openTasks.map((task) => task.id) }; }).filter((group) => group.count > 1); }
function normaliseRecurrenceTemplate(data: AppData, template: RecurrenceTaskTemplate): RecurrenceTaskTemplate {
  return { title: template.title.trim(), description: template.description.trim(), statusId: defaultStatusId(data), priorityId: template.priorityId, location: template.location, revealDate: template.revealDate, tagIds: [...template.tagIds], quantifierSelections: normaliseQuantifierSelections(data.quantifierDefinitions, template.quantifierSelections), mustDoToday: false, dueOnOccurrence: template.dueOnOccurrence !== false, checklist: [] };
}
export function recurrenceDestinationProblem(data: AppData, location: TaskLocation): { reason: RecurrenceAttentionReason; message: string } | null {
  if (location.type === "inbox" || location.type === "someday") return null;
  if (location.type === "area") {
    const area = data.areas.find((candidate) => candidate.id === location.areaId);
    if (!area) return { reason: "missingDestination", message: "Area destination is missing." };
    if (area.deletedAt) return { reason: "deletedDestination", message: "Area destination is deleted." };
    return null;
  }
  const project = data.projects.find((candidate) => candidate.id === location.projectId);
  if (!project) return { reason: "missingDestination", message: "Project destination is missing." };
  if (project.deletedAt) return { reason: "deletedDestination", message: "Project destination is deleted." };
  if (project.archivedAt) return { reason: "archivedProject", message: "Project destination is archived." };
  if (statusCategory(data, project.statusId) !== "active") return { reason: "completedProject", message: "Project destination is closed." };
  return null;
}
function validateRecurrenceDestination(data: AppData, location: TaskLocation): void {
  const problem = recurrenceDestinationProblem(data, location);
  if (problem) throw new DomainError(problem.message);
}
function markRecurrenceAttention(data: AppData, ruleId: string, reason: RecurrenceAttentionReason, message: string): AppData {
  const existing = data.recurrenceRules.find((rule) => rule.id === ruleId);
  if (!existing) return data;
  if (existing.attention?.reason === reason) return data;
  const updated = { ...existing, attention: { reason, message, since: nowIso() }, updatedAt: nowIso(), version: existing.version + 1 };
  return { ...data, recurrenceRules: data.recurrenceRules.map((rule) => rule.id === ruleId ? updated : rule), activity: [...data.activity, createActivity("recurrenceRule", ruleId, "recurrenceAttention", "Schedule needs attention", existing.attention, updated.attention)] };
}
function dueOccurrenceDates(rule: RecurrenceRule, today: string): string[] {
  const dates: string[] = [];
  let cursor = rule.nextBoundaryDate || firstOccurrenceOnOrAfter(rule, rule.firstScheduledDate);
  let guard = 0;
  while (cursor <= today && (!rule.endDate || cursor <= rule.endDate) && guard < 800) {
    dates.push(cursor);
    cursor = nextRecurrenceDate(rule, cursor);
    guard += 1;
  }
  return dates;
}
function occurrenceConsumed(data: AppData, ruleId: string, date: string): boolean {
  const key = recurrenceOccurrenceKey(ruleId, date);
  return data.recurrenceGenerations.some((generation) => !generation.deletedAt && (generation.occurrenceKey === key || (generation.ruleId === ruleId && generation.occurrenceDate === date)))
    || data.tasks.some((task) => task.recurrence?.occurrenceKey === key || (task.recurrence?.ruleId === ruleId && task.recurrence?.occurrenceDate === date));
}
function firstFutureOccurrenceAfter(rule: RecurrenceRule, today: string): string {
  let cursor = rule.nextBoundaryDate || firstOccurrenceOnOrAfter(rule, rule.firstScheduledDate);
  let guard = 0;
  while (cursor <= today && guard < 800) {
    cursor = nextRecurrenceDate(rule, cursor);
    guard += 1;
  }
  return cursor;
}
function firstOccurrenceOnOrAfter(rule: Pick<RecurrenceRule, "frequency" | "interval" | "weekdays" | "dayOfMonth" | "firstScheduledDate" | "endDate">, date: string): string {
  let cursor = rule.firstScheduledDate;
  let guard = 0;
  while (cursor < date && guard < 800) {
    cursor = nextRecurrenceDate(rule as RecurrenceRule, cursor);
    guard += 1;
  }
  return cursor;
}
export function createExportEnvelope(data: AppData, metadata: { applicationVersion: string; buildId?: string | null; buildTimestamp?: string | null; sourceCommit?: string | null; snapshotConfirmedSynchronised?: boolean; canonicalRevision?: number | null }): ExportEnvelope {
  return {
    format: EXPORT_FORMAT_ID,
    formatVersion: EXPORT_FORMAT_VERSION,
    applicationVersion: metadata.applicationVersion,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: nowIso(),
    timezone: APP_TIMEZONE,
    build: {
      buildId: metadata.buildId ?? null,
      buildTimestamp: metadata.buildTimestamp ?? null,
      sourceCommit: metadata.sourceCommit ?? null,
    },
    domain: data,
    providerMetadata: {
      provider: data.settings.backendProvider,
      trustedSessionMetadata: "excluded",
      snapshotConfirmedSynchronised: metadata.snapshotConfirmedSynchronised ?? false,
      canonicalRevision: metadata.canonicalRevision ?? null,
    },
  };
}
export function createInitialBakeryState(at = new Date()): BakeryState { return { schemaVersion:6,catalogueSchemaVersion:BAKERY_CATALOGUE_SCHEMA_VERSION,marketConfigVersion:BAKERY_MARKET_SCHEMA_VERSION,balanceDataVersion:2,productMarkets:[createProductMarket("sugar-donut",at)],marketPriceObservations:[],balances:Object.fromEntries(ALL_RESOURCE_IDS.map((id)=>[id,0])),finishedProducts:{},unlockedSupplierIds:[],unlockedRecipeIds:["sugar-donut"],revealedRecipeIds:["sugar-donut","glazed-donut"],purchasedIngredientIds:[],activeContracts:[],rewardLedger:[],resourceTransactions:[],completedSaleIds:[],completedMilestones:[],purchasedUpgrades:[],displaySlots:[1,2,3,4].map(n=>({id:`display-${n}`,unlocked:n===1,stack:null})),displayQueue:[],activeCampaigns:[],productSpotlights:[],foundationCapabilities:["multi-craft","recipe-categories"],savedPriceStrategies:{},favouriteRecipeIds:[],statistics:{lifetimeSugarEarned:0,lifetimeCoinEarned:0,lifetimeCoinSpent:0,totalDonutsCrafted:0,totalDonutsSold:0,removedContracts:0,completedContracts:0,returnedProducts:0,campaignsPurchased:0,upgradeLevelsPurchased:0,bakedByProduct:{},soldByProduct:{},coinByProduct:{},productSales:{},ingredientsPurchasedByType:{},coinSpentOnSuppliers:0,coinSpentOnIngredients:0,coinSpentOnRecipes:0,coinSpentOnAdvertising:0,coinSpentOnUpgrades:0,recipesRevealed:2,recipesUnlocked:1,suppliersUnlocked:0,highestCompletedAskingPrice:0,lastCompletedSaleAt:null,lastSaleResolutionAt:null}}; }
export function normaliseBakeryState(value?:Partial<BakeryState>,at=new Date()):BakeryState { const initial=createInitialBakeryState(at),unlockedSupplierIds=[...new Set(value?.unlockedSupplierIds??[])],unlockedRecipeIds=[...new Set([...(value?.unlockedRecipeIds??initial.unlockedRecipeIds),"sugar-donut"])],purchasedIngredientIds=[...new Set(value?.purchasedIngredientIds??[])],revealedRecipeIds=[...new Set([...(value?.revealedRecipeIds??initial.revealedRecipeIds),"sugar-donut","glazed-donut",...discoverableRecipeIds(purchasedIngredientIds,unlockedSupplierIds,unlockedRecipeIds)])],existing=new Map((value?.productMarkets??[]).map(m=>[m.productId,m])),productMarkets=unlockedRecipeIds.filter(id=>marketConfigFor(id)).map(id=>{const m=existing.get(id),c=marketConfigFor(id)!;return m?{...m,demand:Math.max(c.minimumDemand,Math.min(c.maximumDemand,m.demand))}:createProductMarket(id,at)}),slots=(value?.displaySlots?.length?value.displaySlots:initial.displaySlots).map((slot,i)=>({...slot,id:`display-${i+1}`,unlocked:i===0||slot.unlocked,stack:slot.stack??null})),activeContracts=(value?.activeContracts??[]).map((contract,i)=>({...contract,slotId:contract.slotId??slots[i]?.id??"display-1"})); const legacySprinkles=value?.balanceDataVersion===undefined||(value?.balanceDataVersion??0)<2?(value?.balances?.sprinkles??0):0,conversionOperation=`bakery-economy-v2`,conversionEntries=legacySprinkles>0?[{id:`bakery_tx_legacy-sprinkles-removed`,operationId:conversionOperation,type:"legacy-resource-converted",itemId:"sprinkles",amount:-legacySprinkles,source:"reward-economy-v1",timestamp:at.toISOString(),idempotencyKey:"bakery-economy-v2:sprinkles-removed"},{id:`bakery_tx_legacy-sugar-added`,operationId:conversionOperation,type:"legacy-resource-converted",itemId:"sugar",amount:legacySprinkles,source:"reward-economy-v1",timestamp:at.toISOString(),idempotencyKey:"bakery-economy-v2:sugar-added"}]:[]; return {...initial,...value,schemaVersion:6,balanceDataVersion:2,catalogueSchemaVersion:BAKERY_CATALOGUE_SCHEMA_VERSION,marketConfigVersion:BAKERY_MARKET_SCHEMA_VERSION,productMarkets,marketPriceObservations:value?.marketPriceObservations??[],balances:{...initial.balances,...(value?.balances??{}),sprinkles:legacySprinkles>0?0:(value?.balances?.sprinkles??0),sugar:(value?.balances?.sugar??0)+legacySprinkles},finishedProducts:{...(value?.finishedProducts??{})},unlockedSupplierIds,unlockedRecipeIds,revealedRecipeIds,purchasedIngredientIds,activeContracts,rewardLedger:value?.rewardLedger??[],resourceTransactions:[...(value?.resourceTransactions??[]),...conversionEntries],completedSaleIds:value?.completedSaleIds??[],completedMilestones:value?.completedMilestones??[],purchasedUpgrades:(value?.purchasedUpgrades??[]).map((upgrade)=>({...upgrade})),displaySlots:slots,displayQueue:value?.displayQueue??[],activeCampaigns:value?.activeCampaigns??[],productSpotlights:value?.productSpotlights??[],foundationCapabilities:[...new Set([...(value?.foundationCapabilities??[]),"multi-craft","recipe-categories"])],savedPriceStrategies:value?.savedPriceStrategies??{},favouriteRecipeIds:value?.favouriteRecipeIds??[],statistics:{...initial.statistics,...(value?.statistics??{}),lifetimeSugarEarned:(value?.statistics?.lifetimeSugarEarned??0)+legacySprinkles,recipesRevealed:Math.max(value?.statistics?.recipesRevealed??0,revealedRecipeIds.length),recipesUnlocked:Math.max(value?.statistics?.recipesUnlocked??0,unlockedRecipeIds.length),bakedByProduct:{...(value?.statistics?.bakedByProduct??{})},soldByProduct:{...(value?.statistics?.soldByProduct??{})},coinByProduct:{...(value?.statistics?.coinByProduct??{})},productSales:{...(value?.statistics?.productSales??{})},ingredientsPurchasedByType:{...(value?.statistics?.ingredientsPurchasedByType??{})}}}; }
function normaliseReferenceListsForMigration(lists: ReferenceList[]): ReferenceList[] { return lists.map((list) => { const { description: _description, tagline: _tagline, ...cleanList } = list as ReferenceList & { description?: string; tagline?: string }; return { ...cleanList, location: cleanList.location ?? (cleanList.projectId ? { type: "project", projectId: cleanList.projectId } : cleanList.areaId ? { type: "area", areaId: cleanList.areaId } : { type: "loose" }), content: cleanList.content ?? { type: "plainItems", items: [] }, tagIds: cleanList.tagIds ?? [], quantifierSelections: cleanList.quantifierSelections ?? {}, color: cleanList.color ?? null, icon: cleanList.icon ?? "list-ordered" }; }); }
export function migrateAppData(raw: Partial<AppData>, at = new Date()): AppData {
  const data = raw as AppData;
  const migratedEntries = data.referenceListEntries
    ? (data.referenceListEntries as Array<ReferenceListEntry & { link?: string | null }>).map((entry) => ({ ...entry, link: entry.link ?? normaliseReferenceLink(entry.text), tagIds: entry.tagIds ?? [] }))
    : (data.referenceLists ?? []).flatMap((list) => (list.content?.items ?? []).map((item) => ({ ...createMeta("refentry"), id: item.id, kind: "referenceListEntry" as const, referenceListId: list.id, text: item.text, link: normaliseReferenceLink(item.text), orderKey: makeOrderKey(item.order), tagIds: [] })));
  const usedStatusIcons = new Set<string>();
  const statuses = (data.statuses ?? []).map((status) => {
    const requestedIconAvailable = (STATUS_ICON_OPTIONS as readonly string[]).includes(status.icon) && !usedStatusIcons.has(status.icon);
    const icon = requestedIconAvailable ? status.icon : STATUS_ICON_OPTIONS.find((candidate) => !usedStatusIcons.has(candidate)) ?? STATUS_ICON_OPTIONS[0];
    usedStatusIcons.add(icon);
    return { ...status, icon };
  });
  const priorities = (data.priorities ?? []).map((priority, index) => ({ ...priority, rank: (priority.rank ?? index + 1) as Priority["rank"] }));
  const tags = (data.tags ?? []).map((tag, index) => ({ ...tag, allowedScopes: (tag.allowedScopes ?? ["task"]).filter((scope): scope is TagScope => scope === "task" || scope === "project" || scope === "referenceList"), order: tag.order ?? index + 1 }));
  const tagGroups = (data.tagGroups ?? []).map((group, index) => ({ ...group, inherited: group.inherited ?? {}, order: group.order ?? index + 1 }));
  const quantifierDefinitions = (data.quantifierDefinitions ?? createDefaultQuantifierDefinitions()).map((definition, definitionIndex) => ({ ...definition, icon: definition.icon ?? (definitionIndex === 0 ? "zap" : "component"), order: definition.order ?? definitionIndex + 1, options: (definition.options ?? []).map((option, optionIndex) => ({ ...option, iconNames: option.iconNames ?? [], color: option.color ?? null, order: option.order ?? optionIndex + 1 })) }));
  const migrateSelections = (tagIds: string[], existing?: QuantifierSelections): QuantifierSelections => {
    if (existing) return normaliseQuantifierSelections(quantifierDefinitions, existing);
    const selections: QuantifierSelections = {};
    for (const definition of quantifierDefinitions) {
      const legacyGroup = tagGroups.find((group) => !group.deletedAt && group.name.trim().toLocaleLowerCase() === definition.name.trim().toLocaleLowerCase());
      if (!legacyGroup) continue;
      const assignedTag = tags.find((tag) => tagIds.includes(tag.id) && !tag.deletedAt && tag.tagGroupId === legacyGroup.id);
      const option = assignedTag ? definition.options.find((candidate) => candidate.name.trim().toLocaleLowerCase() === assignedTag.name.trim().toLocaleLowerCase()) : null;
      if (option) selections[definition.id] = option.id;
    }
    return selections;
  };
  const viewPreferences = (data.viewPreferences ?? []).map((preference) => ({ ...preference, viewId: preference.viewId === "all" ? "tasks" : preference.viewId, showClosed: preference.showClosed ?? false }));
  const recurrenceRules = (data.recurrenceRules ?? []).map((rule) => ({ ...rule, interval: Math.max(1, rule.interval ?? 1), weekdays: rule.weekdays ?? [], dayOfMonth: rule.dayOfMonth ?? null, pausedAt: rule.pausedAt ?? null, lastProcessedOccurrenceKey: rule.lastProcessedOccurrenceKey ?? (rule.lastGeneratedDate ? recurrenceOccurrenceKey(rule.id, rule.lastGeneratedDate) : null), lastSuccessfulProcessingAt: rule.lastSuccessfulProcessingAt ?? null, attention: rule.attention ?? null, template: { ...rule.template, quantifierSelections: migrateSelections(rule.template.tagIds ?? [], rule.template.quantifierSelections), dueOnOccurrence: rule.template.dueOnOccurrence !== false, checklist: rule.template.checklist ?? [] } }));
  const recurrenceGenerations = (data.recurrenceGenerations ?? []).map((generation) => ({ ...generation, occurrenceKey: generation.occurrenceKey ?? recurrenceOccurrenceKey(generation.ruleId, generation.occurrenceDate), collapsedCount: generation.collapsedCount ?? 1, firstMissedDate: generation.firstMissedDate ?? generation.occurrenceDate, lastMissedDate: generation.lastMissedDate ?? generation.occurrenceDate, operationId: generation.operationId ?? `legacy:${generation.ruleId}:${generation.occurrenceDate}` }));
  const defaultPriorityIdValue = data.settings?.defaultPriorityId && priorities.some((priority) => priority.id === data.settings!.defaultPriorityId && !priority.deletedAt) ? data.settings.defaultPriorityId : priorities.find((priority) => !priority.deletedAt && priority.rank === 3)?.id ?? priorities.find((priority) => !priority.deletedAt)?.id ?? "priority_normal";
  return {
    ...data,
    statuses,
    priorities,
    tags,
    tagGroups,
    quantifierDefinitions,
    areas: (data.areas ?? []).map((area, index) => ({ ...area, icon: area.icon ?? "folder", order: area.order ?? index + 1, archivedAt: area.archivedAt ?? null })),
    tasks: (data.tasks ?? []).map((task) => ({ ...task, checklist: task.checklist ?? [], tagIds: task.tagIds ?? [], quantifierSelections: migrateSelections(task.tagIds ?? [], task.quantifierSelections), recurrence: task.recurrence ?? null })),
    projects: (data.projects ?? []).map((project, index) => {
      const legacy = project as Project & { statusId?: string };
      const mappedStatus = statuses.find((status) => !status.deletedAt && status.id === legacy.statusId)
        ?? statuses.find((status) => !status.deletedAt && status.category === (project.cancelledAt ? "cancelled" : project.completedAt ? "completed" : "active"))
        ?? statuses.find((status) => !status.deletedAt)!;
      return { ...project, statusId: mappedStatus?.id ?? "status_open", completedAt: mappedStatus?.category === "completed" ? project.completedAt ?? project.updatedAt : null, cancelledAt: mappedStatus?.category === "cancelled" ? project.cancelledAt ?? project.updatedAt : null, tagIds: project.tagIds ?? [], quantifierSelections: migrateSelections(project.tagIds ?? [], project.quantifierSelections), order: project.order ?? index + 1 };
    }),
    referenceLists: normaliseReferenceListsForMigration(data.referenceLists ?? []).map((list, index) => ({ ...list, quantifierSelections: migrateSelections(list.tagIds, (data.referenceLists?.[index] as ReferenceList & { quantifierSelections?: QuantifierSelections } | undefined)?.quantifierSelections) })),
    referenceListEntries: migratedEntries,
    recurrenceRules,
    recurrenceGenerations,
    viewPreferences,
    settings: { upcomingDays: data.settings?.upcomingDays ?? 14, timezone: data.settings?.timezone ?? APP_TIMEZONE, backendProvider: data.settings?.backendProvider ?? "local-development", defaultPriorityId: defaultPriorityIdValue },
    bakery: normaliseBakeryState(data.bakery, at),
  };
}

function makeOrderKey(order: number): string { return order.toString().padStart(8, "0"); }
function addDays(date: string, days: number): string { const [year, month, day] = date.split("-").map(Number); const value = new Date(Date.UTC(year, month - 1, day)); value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10); }
function addMonthsPinned(date: string, months: number, dayOfMonth: number): string { const [year, month] = date.split("-").map(Number); const value = new Date(Date.UTC(year, month - 1, 1)); value.setUTCMonth(value.getUTCMonth() + months); const last = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0)).getUTCDate(); value.setUTCDate(Math.min(dayOfMonth, last)); return value.toISOString().slice(0, 10); }
function weekdayIndex(date: string): number { const [year, month, day] = date.split("-").map(Number); return new Date(Date.UTC(year, month - 1, day)).getUTCDay(); }

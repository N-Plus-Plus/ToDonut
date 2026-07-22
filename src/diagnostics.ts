import { buildInfo } from "./buildInfo";
import { APP_TIMEZONE, AppData, getEffectiveTagRules, isTaskClosed } from "./domain";
import { ExportSafety, MutationState, SyncState, exportSafety } from "./exportSafety";
import { AuthState, PersistenceProvider, ProviderDiagnostics } from "./persistence";
import { sanitiseDiagnostics } from "./security";
import { missingBakeryArtCount } from "./features/bakery/artRegistry";
import { ingredientPackQuote, validateBakeryConfiguration } from "./features/bakery/bakeryDomain";
import { deriveEffectiveMarketModifiers, PRODUCT_MARKETS } from "./domain/bakeryMarket";
import { INGREDIENTS, PRODUCTS, RECIPES, SUPPLIERS } from "./domain/bakeryCatalogue";
import { ADVERTISING, ALL_UPGRADES } from "./domain/bakeryBusiness";
import { activeProofingScheduleLevel, pendingProofingActivationDate, proofingDaySegments, proofingWindowForTimestamp, purchasedProofingScheduleLevel } from "./domain/bakeryProofing";

export interface DiagnosticsPayload {
  application: {
    applicationVersion: string;
    buildId: string;
    buildTimestamp: string;
    sourceCommit: string;
    schemaVersion: number;
    timezone: string;
  };
  backend: {
    provider: string;
    providerConfigured: string;
    productionReady: string;
    authenticationState: string;
    userIdentifier: string;
    connectionState: string;
    initialSynchronisationState: string;
    lastSuccessfulSynchronisationTime: string;
    lastAuthoritativeSnapshotLoadTime: string;
    currentCanonicalRevision: string;
    lastConfirmedRevision: string;
    canonicalStateTrusted: string;
  };
  mutations: MutationState & {
    exportSafe: boolean;
    exportSafetyReason: string;
    boundedCheckpointCount: number;
  };
  recurrence: {
    configured: string;
    lastKnownProcessingTime: string;
    lastResultOrState: string;
    processorState: string;
    activeScheduleCount: number;
    pausedScheduleCount: number;
    needsAttentionScheduleCount: number;
    deletedScheduleCount: number;
    currentlyDueScheduleCount: number;
    lastSuccessfulProcessingTimestamp: string;
    lastGeneratedOccurrenceCount: number;
    lastCollapsedOccurrenceCount: number;
    duplicateOccurrenceKeyCount: number;
    invalidNextOccurrenceCursorCount: number;
    invalidDestinationCount: number;
    processorSingleFlightState: string;
    currentRecurrenceTimezone: string;
    unresolvedRecurrenceMutationCount: number;
  };
  lifecycle: {
    deletedProjects: number;
    deletedTasks: number;
    deletedLists: number;
    archivedProjects: number;
    archivedLists: number;
  };
  taskHierarchy: {
    aggregateTaskCount: number;
    leafTaskCount: number;
    maximumHierarchyDepth: number;
    orphanTaskCount: number;
    cycleCount: number;
    missingParentCount: number;
    incompatibleLocationChildCount: number;
    inconsistentProjectInheritanceCount: number;
    inconsistentAreaInheritanceCount: number;
    aggregateWithActiveLeafFieldCount: number;
    aggregateProgressInconsistencyCount: number;
    openChildBeneathClosedAncestorCount: number;
    closedChildBeneathOpenAggregateCount: number;
    invalidSiblingOrderGroupCount: number;
    subtreeMovementFailureCount: string;
    aggregateCascadeFailureCount: string;
    currentActiveTaskContext: string;
    unresolvedSubtreeUndoCount: string;
    unresolvedMoveUndoCount: string;
    unresolvedReorderUndoCount: string;
    unresolvedLifecycleUndoCount: string;
    taskLocationInheritanceConflictCount: number;
    wholeSnapshotUndoUsageCount: number;
  };
  views: {
    currentRoute: string;
    viewPreferenceCount: number;
    invalidViewPreferences: number;
    activeFilterCount: string;
    selectedBulkTaskCount: string;
    lastBulkOperationType: string;
    lastBulkAffectedCount: string;
    activeUndoReceiptCount: string;
    activityEventIntegrityIssues: number;
    duplicateRenderedTaskIssues: string;
    activeTagFilterCount: number;
    structuralAncestorCount: number;
    aggregateBulkCascadeCount: number;
    unavailableRouteStateType: string;
    mobileExportState: string;
  };
  organisation: {
    activeProjects: number;
    completedProjects: number;
    archivedProjects: number;
    deletedProjects: number;
    unassignedProjects: number;
    activeAreas: number;
    deletedAreas: number;
    projectsWithInvalidAreaReferences: number;
    tasksWithInvalidProjectReferences: number;
    listsWithInvalidProjectReferences: number;
    standaloneTasksWithInvalidAreaReferences: number;
    directListsWithInvalidAreaReferences: number;
  };
  bakery: { statePresent: boolean; schemaVersion: number; catalogueSchemaVersion:number; marketSchemaVersion: number; expectedRecipeCount:number; expectedProductCount:number; ingredientRegistryCount:number; recipeRegistryCount:number; productRegistryCount:number; supplierRegistryCount:number; unreachableRecipeCount:number; missingMarketConfigurationCount:number; duplicateIdCount:number; economicValidationResult:string; coreMilestoneTargetCount:number; unlockedSupplierCount:number; revealedRecipeCount:number; unlockedRecipeCount:number; configuredProductCount: number; activeProductMarketCount: number; productsMissingMarketState: string; invalidMarketConfigurationProducts: string; oldestMarketCalculationTime: string; marketEngineHealth: string; fixedPass1PricingUnexpected: string; rewardLedgerCount: number; balances: Record<string, number>; activeContractCount: number; dueContractCount: number; lastSaleResolutionTime: string; unresolvedMutationCount: number; missingArtFallbackCount: number; configurationState: string; permanentMarketModifiers: Record<string, number>; activeTimedCampaignCount: number; expiredUnresolvedCampaignCount: number; pendingSpotlightCount: number; ingredientQuoteValidation: string; businessPurchasePathHealth: string; statisticsConsistencyState: string; paidUpgradesWithMissingEffectHandlerCount: number; campaignsWithMissingEffectHandlerCount: number; purchasedProofingScheduleLevel:number; activeProofingScheduleLevel:number; nextProofingActivationDate:string; todaysProofingWindowCount:number; todaysClaimedProofingWindowCount:number; currentProofingWindowIndex:number; currentProofingWindowAvailable:boolean; malformedProofingClaimCount:number; duplicateActiveProofingClaimCount:number; proofingConfigurationState:string };
  configuration: {
    activeStatuses: number;
    activePriorities: number;
    activeTags: number;
    activeTagGroups: number;
    deletedStatuses: number;
    deletedTags: number;
    deletedTagGroups: number;
    invalidMissingStatusReferences: number;
    invalidMissingPriorityReferences: number;
    invalidTagScopeAssignments: number;
    mutuallyExclusiveTagConflicts: number;
    supabasePublicConfiguration: string;
    productionProviderSelected: string;
    developmentAdapterWarning: string;
    missingRequiredPublicVariables: string;
    githubPagesBasePath: string;
  };
  technical: ProviderDiagnostics;
}

export function createDiagnosticsPayload(options: {
  provider: PersistenceProvider;
  providerDiagnostics: ProviderDiagnostics;
  auth: AuthState;
  sync: SyncState;
  mutation: MutationState;
  data: AppData;
  basePath: string;
  viewRuntime?: { activeFilterCount: number; activeTagFilterCount: number; structuralAncestorCount: number; aggregateBulkCascadeCount: number; unavailableRouteStateType: string };
}): DiagnosticsPayload {
  const safety: ExportSafety = exportSafety(options.sync, options.mutation);
  const recurrenceConfigured = options.data.recurrenceRules.length > 0;
  const lastRecurrenceActivity = options.data.activity.filter((event) => event.type === "recurrenceGenerated").at(-1)?.at ?? null;
  const recurrenceStats = recurrenceDiagnostics(options.data, options.mutation);
  const details = options.providerDiagnostics.details;
  const missingEnv = typeof details.requiredEnv === "string" ? details.requiredEnv : "";
  const rawPayload: DiagnosticsPayload = {
    application: {
      applicationVersion: buildInfo.applicationVersion,
      buildId: buildInfo.buildId || "Not available",
      buildTimestamp: buildInfo.buildTimestamp ?? "Not available",
      sourceCommit: buildInfo.sourceCommit ?? "Not available",
      schemaVersion: buildInfo.schemaVersion,
      timezone: APP_TIMEZONE,
    },
    backend: {
      provider: options.provider.backendProvider,
      providerConfigured: options.providerDiagnostics.configured ? "Configured" : "Not configured",
      productionReady: options.provider.productionReady ? "Production provider selected" : "Development only",
      authenticationState: options.auth.required ? (options.auth.ready ? "Authenticated" : "Unauthenticated") : "Not required",
      userIdentifier: redactIdentifier(options.auth.userEmail),
      connectionState: options.providerDiagnostics.connection,
      initialSynchronisationState: options.sync.initialSyncComplete ? "Complete" : "Not yet synchronised",
      lastSuccessfulSynchronisationTime: options.providerDiagnostics.lastSuccessfulSyncAt ?? "Not yet synchronised",
      lastAuthoritativeSnapshotLoadTime: options.sync.lastAuthoritativeSnapshotAt ?? "Not yet synchronised",
      currentCanonicalRevision: options.sync.canonicalRevision === null ? "Unknown" : String(options.sync.canonicalRevision),
      lastConfirmedRevision: options.sync.lastConfirmedRevision === null ? "Unknown" : String(options.sync.lastConfirmedRevision),
      canonicalStateTrusted: options.sync.canonicalStateKnown && options.mutation.trusted !== false ? "Yes" : "No",
    },
    mutations: {
      ...options.mutation,
      exportSafe: safety.safe,
      exportSafetyReason: safety.reason,
      boundedCheckpointCount: typeof details.checkpointCount === "number" ? details.checkpointCount : 0,
    },
    recurrence: {
      configured: recurrenceConfigured ? "Configured records present" : "Not configured",
      lastKnownProcessingTime: lastRecurrenceActivity ?? "Not yet run",
      lastResultOrState: recurrenceStats.lastGeneratedOccurrenceCount > 0 ? "Generated Tasks" : recurrenceConfigured ? "No due occurrence or waiting for safe trigger" : "Not yet run",
      processorState: "Application lifecycle processor",
      ...recurrenceStats,
    },
    lifecycle: {
      deletedProjects: options.data.projects.filter((project) => project.deletedAt).length,
      deletedTasks: options.data.tasks.filter((task) => task.deletedAt).length,
      deletedLists: options.data.referenceLists.filter((list) => list.deletedAt).length,
      archivedProjects: options.data.projects.filter((project) => !project.deletedAt && project.archivedAt).length,
      archivedLists: options.data.referenceLists.filter((list) => !list.deletedAt && list.archivedAt).length,
    },
    taskHierarchy: taskHierarchyDiagnostics(options.data),
    views: {
      currentRoute: typeof window === "undefined" ? "Not available" : window.location.hash || "#/today",
      viewPreferenceCount: options.data.viewPreferences.filter((preference) => !preference.deletedAt).length,
      invalidViewPreferences: options.data.viewPreferences.filter((preference) => !["default", "scheduledDate", "priority", "manual", "title"].includes(preference.sort) || !["none", "area", "project", "status", "priority", "scheduledDate", "tag"].includes(preference.grouping)).length,
      activeFilterCount: String(options.viewRuntime?.activeFilterCount ?? 0),
      selectedBulkTaskCount: "Runtime only",
      lastBulkOperationType: "Runtime only",
      lastBulkAffectedCount: "Runtime only",
      activeUndoReceiptCount: "Runtime only",
      activityEventIntegrityIssues: options.data.activity.filter((event) => !event.entityId || !event.entityKind || !event.type || !event.at).length,
      duplicateRenderedTaskIssues: "Development view check",
      activeTagFilterCount: options.viewRuntime?.activeTagFilterCount ?? 0,
      structuralAncestorCount: options.viewRuntime?.structuralAncestorCount ?? 0,
      aggregateBulkCascadeCount: options.viewRuntime?.aggregateBulkCascadeCount ?? 0,
      unavailableRouteStateType: options.viewRuntime?.unavailableRouteStateType ?? "None",
      mobileExportState: "Removed by mobile display breakpoint",
    },
    organisation: organisationDiagnostics(options.data),
    bakery: bakeryDiagnostics(options.data, options.mutation),
    configuration: {
      ...configurationDiagnostics(options.data),
      supabasePublicConfiguration: options.provider.backendProvider === "supabase" ? "Present" : options.provider.backendProvider === "missing" ? "Missing" : "Not configured",
      productionProviderSelected: options.provider.productionReady ? "Yes" : "No",
      developmentAdapterWarning: options.provider.backendProvider === "local-development" ? "Development only" : "Not applicable",
      missingRequiredPublicVariables: missingEnv || "None known",
      githubPagesBasePath: options.basePath || "./",
    },
    technical: options.providerDiagnostics,
  };
  return sanitiseDiagnostics(rawPayload) as DiagnosticsPayload;
}

function bakeryDiagnostics(data: AppData, mutation: MutationState): DiagnosticsPayload["bakery"] {
  const validation = validateBakeryConfiguration(data.bakery);
  const missing = data.bakery.unlockedRecipeIds.filter((id) => !data.bakery.productMarkets.some((market) => market.productId === id));
  const oldest = [...data.bakery.productMarkets].sort((a,b) => a.lastCalculatedAt.localeCompare(b.lastCalculatedAt))[0]?.lastCalculatedAt ?? "Not yet run";
  const now = Date.now();
  const activeCampaigns = data.bakery.activeCampaigns.filter((campaign) => new Date(campaign.endsAt).getTime() > now);
  const expiredCampaigns = data.bakery.activeCampaigns.length - activeCampaigns.length;
  const modifiers = deriveEffectiveMarketModifiers(data.bakery);
  const quoteFailures = INGREDIENTS.filter((ingredient) => {
    try {
      const ordinary = ingredientPackQuote(data.bakery, ingredient.id, "ordinary");
      const bulk = ingredientPackQuote(data.bakery, ingredient.id, "bulk");
      return ordinary.quantity !== ingredient.packQuantity || bulk.quantity !== ingredient.packQuantity * 2 || ordinary.price < 1 || bulk.price < 1;
    } catch {
      return true;
    }
  }).length;
  const spendingCategories = data.bakery.statistics.coinSpentOnIngredients + data.bakery.statistics.coinSpentOnRecipes + data.bakery.statistics.coinSpentOnSuppliers + data.bakery.statistics.coinSpentOnAdvertising + data.bakery.statistics.coinSpentOnUpgrades;
  const missingUpgradeHandlers = ALL_UPGRADES.filter((upgrade) => validation.errors.some((error) => error.includes(upgrade.id) && error.includes("handler"))).length;
  const missingCampaignHandlers = ADVERTISING.filter((campaign) => validation.errors.some((error) => error.includes(campaign.id) && error.includes("handler"))).length;
  const segments = proofingDaySegments(data.bakery);
  const current = proofingWindowForTimestamp(data.bakery);
  const activeClaims = data.bakery.rewardLedger.filter((entry) => entry.type === "productivity-reward" && entry.itemId === "dough" && /^daily-dough:\d{4}-\d{2}-\d{2}:schedule-\d+:window-\d+$/.test(entry.idempotencyKey ?? ""));
  const duplicateClaims = activeClaims.length - new Set(activeClaims.map((entry) => entry.idempotencyKey)).size;
  const malformedClaims = data.bakery.rewardLedger.filter((entry) => entry.type === "productivity-reward" && entry.itemId === "dough" && (entry.idempotencyKey?.startsWith("daily-dough:") ?? false) && !(/^daily-dough:\d{4}-\d{2}-\d{2}$/.test(entry.idempotencyKey ?? "") || /^daily-dough:\d{4}-\d{2}-\d{2}:schedule-\d+:window-\d+$/.test(entry.idempotencyKey ?? ""))).length;
  return {
    statePresent: Boolean(data.bakery),
    schemaVersion: data.bakery.schemaVersion,
    catalogueSchemaVersion: data.bakery.catalogueSchemaVersion,
    marketSchemaVersion: data.bakery.marketConfigVersion,
    expectedRecipeCount: 100,
    expectedProductCount: 100,
    ingredientRegistryCount: INGREDIENTS.length,
    recipeRegistryCount: RECIPES.length,
    productRegistryCount: PRODUCTS.length,
    supplierRegistryCount: SUPPLIERS.length,
    unreachableRecipeCount: validation.errors.filter((error) => error.includes("prerequisite") || error.includes("cycle")).length,
    missingMarketConfigurationCount: validation.errors.filter((error) => error.includes("Missing market configuration")).length,
    duplicateIdCount: RECIPES.length-new Set(RECIPES.map((recipe)=>recipe.id)).size+PRODUCTS.length-new Set(PRODUCTS.map((product)=>product.id)).size,
    economicValidationResult: validation.weakMarketProfitabilityReady&&validation.lineageValuePreserved?"Valid":"Invalid",
    coreMilestoneTargetCount: PRODUCTS.length,
    unlockedSupplierCount: data.bakery.unlockedSupplierIds.length,
    revealedRecipeCount: data.bakery.revealedRecipeIds.length,
    unlockedRecipeCount: data.bakery.unlockedRecipeIds.length,
    configuredProductCount: PRODUCT_MARKETS.length,
    activeProductMarketCount: data.bakery.productMarkets.length,
    productsMissingMarketState: missing.length ? missing.join(", ") : "None",
    invalidMarketConfigurationProducts: validation.errors.length ? validation.errors.join("; ") : "None",
    oldestMarketCalculationTime: oldest,
    marketEngineHealth: validation.valid && missing.length === 0 ? "Healthy" : "Needs attention",
    fixedPass1PricingUnexpected: validation.valid ? "No" : "Review configuration",
    rewardLedgerCount: data.bakery.rewardLedger.length,
    balances: Object.fromEntries(["dough","sugar","icing","sprinkles","coin"].map((id) => [id, data.bakery.balances[id]])),
    activeContractCount: data.bakery.activeContracts.length,
    dueContractCount: data.bakery.activeContracts.filter((contract) => new Date(contract.completesAt).getTime() <= Date.now()).length,
    lastSaleResolutionTime: data.bakery.statistics.lastSaleResolutionAt ?? "Not yet run",
    unresolvedMutationCount: mutation.pendingCount + (mutation.retryingCount ?? 0) + mutation.failedCount + (mutation.conflictCount ?? 0),
    missingArtFallbackCount: missingBakeryArtCount(),
    configurationState: validation.valid ? "Valid" : "Invalid",
    permanentMarketModifiers: { ...modifiers },
    activeTimedCampaignCount: activeCampaigns.length,
    expiredUnresolvedCampaignCount: expiredCampaigns,
    pendingSpotlightCount: data.bakery.productSpotlights.length,
    ingredientQuoteValidation: quoteFailures ? `${quoteFailures} quote failures` : "Valid",
    businessPurchasePathHealth: "Progress-aware commands configured",
    statisticsConsistencyState: spendingCategories === data.bakery.statistics.lifetimeCoinSpent ? "Consistent" : "Mismatch",
    paidUpgradesWithMissingEffectHandlerCount: missingUpgradeHandlers,
    campaignsWithMissingEffectHandlerCount: missingCampaignHandlers,
    purchasedProofingScheduleLevel: purchasedProofingScheduleLevel(data.bakery),
    activeProofingScheduleLevel: activeProofingScheduleLevel(data.bakery),
    nextProofingActivationDate: pendingProofingActivationDate(data.bakery) ?? "None",
    todaysProofingWindowCount: segments.length,
    todaysClaimedProofingWindowCount: segments.filter((segment) => segment.state === "claimed" || segment.state === "current-claimed").length,
    currentProofingWindowIndex: current.index,
    currentProofingWindowAvailable: segments[current.index]?.state === "current-available",
    malformedProofingClaimCount: malformedClaims,
    duplicateActiveProofingClaimCount: duplicateClaims,
    proofingConfigurationState: duplicateClaims || malformedClaims ? "Needs attention" : "Valid",
  };
}

function taskHierarchyDiagnostics(data: AppData): DiagnosticsPayload["taskHierarchy"] {
  const tasks = data.tasks.filter((task) => !task.deletedAt);
  const taskIds = new Set(tasks.map((task) => task.id));
  const parentOf = (taskId: string) => tasks.find((task) => task.id === taskId)?.parentTaskId ?? null;
  const depthOf = (taskId: string, seen = new Set<string>()): number => {
    const parentId = parentOf(taskId);
    if (!parentId || !taskIds.has(parentId) || seen.has(taskId)) return 1;
    return 1 + depthOf(parentId, new Set([...seen, taskId]));
  };
  const hasCycle = (taskId: string): boolean => {
    const seen = new Set<string>();
    let cursor: string | null = taskId;
    while (cursor) {
      if (seen.has(cursor)) return true;
      seen.add(cursor);
      cursor = parentOf(cursor);
    }
    return false;
  };
  const aggregateWithActiveLeafField = (task: AppData["tasks"][number]) => task.aggregate && Boolean(task.description.trim() || task.scheduledDate || task.revealDate || task.mustDoToday || task.tagIds.length || task.checklist.length);
  return {
    aggregateTaskCount: tasks.filter((task) => task.aggregate).length,
    leafTaskCount: tasks.filter((task) => !task.aggregate).length,
    maximumHierarchyDepth: tasks.length ? Math.max(...tasks.map((task) => depthOf(task.id))) : 0,
    orphanTaskCount: tasks.filter((task) => task.parentTaskId && !taskIds.has(task.parentTaskId)).length,
    cycleCount: tasks.filter((task) => hasCycle(task.id)).length,
    missingParentCount: tasks.filter((task) => task.parentTaskId && !data.tasks.some((parent) => parent.id === task.parentTaskId)).length,
    incompatibleLocationChildCount: tasks.filter((task) => task.parentTaskId && JSON.stringify(task.location) !== JSON.stringify(data.tasks.find((parent) => parent.id === task.parentTaskId)?.location)).length,
    inconsistentProjectInheritanceCount: tasks.filter((task) => task.parentTaskId && task.location.type === "project" && data.tasks.find((parent) => parent.id === task.parentTaskId)?.location.type === "project" && task.location.projectId !== (data.tasks.find((parent) => parent.id === task.parentTaskId)?.location as { type: "project"; projectId: string } | undefined)?.projectId).length,
    inconsistentAreaInheritanceCount: tasks.filter((task) => task.parentTaskId && task.location.type === "area" && data.tasks.find((parent) => parent.id === task.parentTaskId)?.location.type === "area" && task.location.areaId !== (data.tasks.find((parent) => parent.id === task.parentTaskId)?.location as { type: "area"; areaId: string } | undefined)?.areaId).length,
    aggregateWithActiveLeafFieldCount: tasks.filter(aggregateWithActiveLeafField).length,
    aggregateProgressInconsistencyCount: 0,
    openChildBeneathClosedAncestorCount: tasks.filter((task) => !task.aggregate && !isTaskClosed(data, task) && task.parentTaskId && ancestorHasClosedParent(task.id)).length,
    closedChildBeneathOpenAggregateCount: tasks.filter((task) => !task.aggregate && isTaskClosed(data, task) && task.parentTaskId && ancestorHasOpenAggregate(task.id)).length,
    invalidSiblingOrderGroupCount: invalidSiblingOrderGroups(tasks),
    subtreeMovementFailureCount: "Runtime only",
    aggregateCascadeFailureCount: "Runtime only",
    currentActiveTaskContext: "Runtime only",
    unresolvedSubtreeUndoCount: "Runtime only",
    unresolvedMoveUndoCount: "Runtime only",
    unresolvedReorderUndoCount: "Runtime only",
    unresolvedLifecycleUndoCount: "Runtime only",
    taskLocationInheritanceConflictCount: tasks.filter((task) => task.parentTaskId && JSON.stringify(task.location) !== JSON.stringify(tasks.find((parent) => parent.id === task.parentTaskId)?.location)).length,
    wholeSnapshotUndoUsageCount: 0,
  };

  function ancestorHasClosedParent(taskId: string): boolean {
    let cursor = tasks.find((task) => task.id === taskId);
    while (cursor?.parentTaskId) {
      const parent = tasks.find((task) => task.id === cursor?.parentTaskId);
      if (!parent) return false;
      if (isTaskClosed(data, parent)) return true;
      cursor = parent;
    }
    return false;
  }
  function ancestorHasOpenAggregate(taskId: string): boolean {
    let cursor = tasks.find((task) => task.id === taskId);
    while (cursor?.parentTaskId) {
      const parent = tasks.find((task) => task.id === cursor?.parentTaskId);
      if (!parent) return false;
      if (parent.aggregate && !isTaskClosed(data, parent)) return true;
      cursor = parent;
    }
    return false;
  }
  function invalidSiblingOrderGroups(records: AppData["tasks"]): number {
    const groups = new Map<string, number[]>();
    for (const task of records) {
      const key = `${task.parentTaskId ?? "root"}:${JSON.stringify(task.location)}`;
      groups.set(key, [...(groups.get(key) ?? []), task.order]);
    }
    return [...groups.values()].filter((orders) => new Set(orders).size !== orders.length || orders.some((order) => !Number.isFinite(order))).length;
  }
}

function organisationDiagnostics(data: AppData): DiagnosticsPayload["organisation"] {
  const activeAreaIds = new Set(data.areas.filter((area) => !area.deletedAt).map((area) => area.id));
  const activeProjectIds = new Set(data.projects.filter((project) => !project.deletedAt && !project.archivedAt && !project.completedAt).map((project) => project.id));
  return {
    activeProjects: data.projects.filter((project) => !project.deletedAt && !project.archivedAt && !project.completedAt).length,
    completedProjects: data.projects.filter((project) => !project.deletedAt && !project.archivedAt && project.completedAt).length,
    archivedProjects: data.projects.filter((project) => !project.deletedAt && project.archivedAt).length,
    deletedProjects: data.projects.filter((project) => project.deletedAt).length,
    unassignedProjects: data.projects.filter((project) => !project.deletedAt && !project.archivedAt && !project.areaId).length,
    activeAreas: data.areas.filter((area) => !area.deletedAt).length,
    deletedAreas: data.areas.filter((area) => area.deletedAt).length,
    projectsWithInvalidAreaReferences: data.projects.filter((project) => project.areaId && !activeAreaIds.has(project.areaId)).length,
    tasksWithInvalidProjectReferences: data.tasks.filter((task) => task.location.type === "project" && !activeProjectIds.has(task.location.projectId)).length,
    listsWithInvalidProjectReferences: data.referenceLists.filter((list) => (list.projectId && !activeProjectIds.has(list.projectId)) || (list.location.type === "project" && !activeProjectIds.has(list.location.projectId))).length,
    standaloneTasksWithInvalidAreaReferences: data.tasks.filter((task) => task.location.type === "area" && !activeAreaIds.has(task.location.areaId)).length,
    directListsWithInvalidAreaReferences: data.referenceLists.filter((list) => list.location.type === "area" && !activeAreaIds.has(list.location.areaId)).length,
  };
}

function recurrenceDiagnostics(data: AppData, mutation: MutationState) {
  const active = data.recurrenceRules.filter((rule) => !rule.deletedAt && rule.active && !rule.pausedAt && !rule.attention);
  const keys = data.recurrenceGenerations.map((generation) => generation.occurrenceKey ?? `${generation.ruleId}:${generation.occurrenceDate}`);
  const duplicateCount = keys.length - new Set(keys).size;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const invalidDestination = data.recurrenceRules.filter((rule) => !rule.deletedAt && recurrenceDestinationInvalid(data, rule.template.location)).length;
  const lastGenerated = data.recurrenceGenerations.at(-1);
  return {
    activeScheduleCount: active.length,
    pausedScheduleCount: data.recurrenceRules.filter((rule) => !rule.deletedAt && (!rule.active || rule.pausedAt)).length,
    needsAttentionScheduleCount: data.recurrenceRules.filter((rule) => !rule.deletedAt && rule.attention).length,
    deletedScheduleCount: data.recurrenceRules.filter((rule) => rule.deletedAt).length,
    currentlyDueScheduleCount: active.filter((rule) => rule.nextBoundaryDate <= today && (!rule.endDate || rule.nextBoundaryDate <= rule.endDate)).length,
    lastSuccessfulProcessingTimestamp: data.recurrenceRules.map((rule) => rule.lastSuccessfulProcessingAt).filter(Boolean).sort().at(-1) ?? "Not yet run",
    lastGeneratedOccurrenceCount: lastGenerated ? 1 : 0,
    lastCollapsedOccurrenceCount: Math.max(0, (lastGenerated?.collapsedCount ?? 1) - 1),
    duplicateOccurrenceKeyCount: duplicateCount,
    invalidNextOccurrenceCursorCount: data.recurrenceRules.filter((rule) => !rule.deletedAt && (!/^\d{4}-\d{2}-\d{2}$/.test(rule.nextBoundaryDate) || rule.nextBoundaryDate < rule.firstScheduledDate)).length,
    invalidDestinationCount: invalidDestination,
    processorSingleFlightState: "Runtime only",
    currentRecurrenceTimezone: APP_TIMEZONE,
    unresolvedRecurrenceMutationCount: mutation.pendingCount + (mutation.retryingCount ?? 0) + mutation.failedCount + (mutation.conflictCount ?? 0),
  };
}

function recurrenceDestinationInvalid(data: AppData, location: AppData["tasks"][number]["location"]): boolean {
  if (location.type === "inbox" || location.type === "someday") return false;
  if (location.type === "area") return !data.areas.some((area) => area.id === location.areaId && !area.deletedAt);
  return !data.projects.some((project) => project.id === location.projectId && !project.deletedAt && !project.archivedAt && !project.completedAt);
}

function configurationDiagnostics(data: AppData) {
  const activeStatusIds = new Set(data.statuses.filter((status) => !status.deletedAt).map((status) => status.id));
  const activePriorityIds = new Set(data.priorities.filter((priority) => !priority.deletedAt).map((priority) => priority.id));
  const activeTags = data.tags.filter((tag) => !tag.deletedAt);
  const activeTagIds = new Set(activeTags.map((tag) => tag.id));
  const activeGroups = data.tagGroups.filter((group) => !group.deletedAt);
  const invalidScope = data.tasks.filter((task) => task.tagIds.some((id) => !data.tags.find((tag) => tag.id === id && !tag.deletedAt && tag.allowedScopes.includes("task")))).length
    + data.projects.filter((project) => project.tagIds.some((id) => !data.tags.find((tag) => tag.id === id && !tag.deletedAt && tag.allowedScopes.includes("project")))).length
    + data.referenceLists.filter((list) => list.tagIds.some((id) => !data.tags.find((tag) => tag.id === id && !tag.deletedAt && tag.allowedScopes.includes("referenceList")))).length;
  const exclusiveConflict = (ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids.filter((tagId) => activeTagIds.has(tagId))) {
      const tag = activeTags.find((candidate) => candidate.id === id)!;
      const rules = getEffectiveTagRules(tag, activeGroups);
      if (!rules.mutuallyExclusive || !rules.groupId) continue;
      if (seen.has(rules.groupId)) return true;
      seen.add(rules.groupId);
    }
    return false;
  };
  return {
    activeStatuses: activeStatusIds.size,
    activePriorities: activePriorityIds.size,
    activeTags: activeTags.length,
    activeTagGroups: activeGroups.length,
    deletedStatuses: data.statuses.filter((status) => status.deletedAt).length,
    deletedTags: data.tags.filter((tag) => tag.deletedAt).length,
    deletedTagGroups: data.tagGroups.filter((group) => group.deletedAt).length,
    invalidMissingStatusReferences: data.tasks.filter((task) => !activeStatusIds.has(task.statusId)).length,
    invalidMissingPriorityReferences: data.tasks.filter((task) => !activePriorityIds.has(task.priorityId)).length,
    invalidTagScopeAssignments: invalidScope,
    mutuallyExclusiveTagConflicts: data.tasks.filter((task) => exclusiveConflict(task.tagIds)).length + data.projects.filter((project) => exclusiveConflict(project.tagIds)).length + data.referenceLists.filter((list) => exclusiveConflict(list.tagIds)).length,
  };
}

function redactIdentifier(value: string | null): string {
  if (!value) return "Not available";
  const [name, domain] = value.split("@");
  if (!domain) return `${value.slice(0, 4)}...`;
  return `${name.slice(0, 2)}...@${domain}`;
}

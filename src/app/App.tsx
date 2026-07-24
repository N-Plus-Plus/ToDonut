import {
  Archive,
  ArrowLeft,
  ArrowUpDown,
  Calendar,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Download,
  Eye,
  EyeClosed,
  FileStack,
  Filter,
  Flag,
  FolderKanban,
  GripVertical,
  LandPlot,
  Layers3,
  ListOrdered,
  ListFilter,
  LogOut,
  Menu,
  PanelBottomClose,
  Pencil,
  Plus,
  Rows3,
  Save,
  SlidersHorizontal,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import {
  CSSProperties,
  FormEvent,
  PointerEvent,
  ReactNode,
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AppData,
  Area,
  Priority,
  Project,
  ReferenceList,
  ReferenceListEntry,
  ReferenceListLocation,
  Status,
  STATUS_ICON_OPTIONS,
  Tag,
  TagGroup,
  TagScope,
  Task,
  TaskGroupingField,
  TaskLocation,
  TaskMoveDestination,
  TaskSortField,
  activeStatuses,
  addReferenceEntries,
  affectedTasksForStatus,
  closeSatisfiedAggregates,
  completeAggregate,
  createActivity,
  createReferenceEntry,
  createReferenceListCommand,
  createStatusCommand,
  createTagCommand,
  createTagGroupCommand,
  defaultStatusId,
  deleteStatusCommand,
  deleteTagCommand,
  deleteTagGroupCommand,
  descendants,
  isTaskClosed,
  moveTaskSubtreeCommand,
  nowIso,
  statusCategory,
  processDueRecurrenceSchedules,
  reopenTaskCommand,
  reorderPriorityCommand,
  reorderReferenceEntry,
  reorderReferenceEntries,
  reorderReferenceListBeforeCommand,
  reorderReferenceListCommand,
  reorderStatusCommand,
  reorderStatusRelativeCommand,
  reorderTagCommand,
  reorderTagRelativeCommand,
  reorderTagGroupCommand,
  reorderTaskSiblingBeforeCommand,
  reorderTaskSiblingCommand,
  updatePriorityCommand,
  updateReferenceEntry,
  updateReferenceListCommand,
  updateStatusCommand,
  updateTagCommand,
  updateTagGroupCommand,
  updateTaskRecord,
} from "../domain";
import { MutationState, SyncState } from "../exportSafety";
import {
  AuthState,
  PersistenceProvider,
  createPersistenceProvider,
} from "../persistence";
import { PRIORITY_IDS, STATUS_IDS, createSeedData } from "../seed";
import {
  TaskFilters,
  TaskViewId,
  TaskViewResult,
  ViewId,
  buildTaskView,
  getViewPreference,
  saveViewPreference,
} from "../viewModel";
import { FeedbackHost } from "../core/feedback/FeedbackHost";
import { ActivityHistory } from "../core/activity/ActivityHistory";
import { FeedbackProvider } from "../core/feedback/FeedbackProvider";
import { useFeedback } from "../core/feedback/useFeedback";
import {
  ConfirmationProvider,
  useConfirmation,
} from "../core/dialogs/confirmation";
import { Modal } from "../core/dialogs/Modal";
import {
  MutationCoordinator,
  MutationOperation,
} from "../core/mutations/mutationCoordinator";
import {
  archiveListCommand,
  archiveProjectCommand,
  deleteProjectCommand,
  projectRelationshipCounts,
  restoreCommand,
  softDeleteCommand,
  unarchiveProjectCommand,
  undoProjectDeletionCommand,
} from "../core/lifecycle/lifecycleCommands";
import { UndoService } from "../core/undo/undoService";
import { safeHttpUrl } from "../core/validation/validators";
import { moveIdBefore } from "../core/ordering/ordering";
import { buildSafeExport } from "../core/export/exportBuilder";
import { localDateString } from "../core/dates/dateService";
import {
  NavigationDestination,
  desktopNav,
  mobileDock,
  navigationRegistry,
  runRouteCleanup,
} from "./navigation/navigationRegistry";
import {
  AddActionDefinition,
  AddActionId,
  AddContext,
  defaultAddCapabilities,
  resolveAddActions,
  SettingsSubsection,
} from "../core/add/contextualAdd";
import { AppErrorBoundary } from "./AppErrorBoundary";
import { Button } from "../shared/components/Button";
import { EmptyState } from "../shared/components/EmptyState";
import { ProjectCombobox } from "../shared/components/ProjectCombobox";
import { EntityContextLine, QuantifierTitleIcons, entityContextsForLocation, quantifierMetadataContextsForSelections } from "../shared/components/EntityContextLine";
import { CircleCheckbox } from "../shared/components/CircleCheckbox";
import { QuantifierFields } from "../shared/components/QuantifierFields";
import { StatusIcon } from "../shared/components/StatusIcon";
import { TaskProgressMeta } from "../shared/components/TaskProgressMeta";
import { CurrencyAmount } from "../shared/components/CurrencyAmount";
import { CardActionMenu, CardActionMenuItem } from "../shared/components/CardActionMenu";
export { CardActionMenu } from "../shared/components/CardActionMenu";
import {
  ColourPicker,
  paletteOptions,
  ScopeSelector,
  SharedTagPicker,
} from "../shared/components/ConfigurationControls";
import { AuthGate } from "../features/auth/AuthGate";
import { TaskSection } from "../features/tasks/TaskSection";
import { TASK_COMPLETION_ANIMATION_MS } from "../features/tasks/completionTiming";
import {
  BulkTaskCommand,
  runBulkTaskCommand,
} from "../features/tasks/bulkTaskCommands";
import { TaskEditor } from "../features/tasks/editor/TaskEditor";
import { TaskMoveDialog } from "../features/tasks/TaskMoveDialog";
import { HiddenMode, TrashModeToggle, TrashView } from "../features/trash/TrashView";
import {
  ScheduleEditor,
  SchedulesView,
} from "../features/recurrence/SchedulesView";
import {
  applyTaskCompletionRewards,
  reverseRewards,
} from "../features/bakery/bakeryDomain";
import { resolveBakeryTimeline } from "../features/bakery/bakeryBusinessDomain";
import {
  activeOrderedAreas,
  activeOrderedProjects,
  archiveAreaCommand,
  areaReferenceCounts,
  completedProjects,
  completeProjectCommand,
  createAreaCommand,
  createProjectCommand,
  demoteProjectToTaskCommand,
  deleteAreaCommand,
  directListsByArea,
  listsByProject,
  projectProgress,
  promoteTaskToProjectCommand,
  projectsByArea,
  reopenProjectCommand,
  reorderAreaCommand,
  reorderProjectCommand,
  rootTasksByProject,
  standaloneTasksByArea,
  undoAreaDeletionCommand,
  updateAreaCommand,
  updateProjectCommand,
} from "../features/projects/projectAreaModel";
import brandLogo from "../../fav.png";

const SettingsView = lazy(() => import("../features/settings/SettingsView").then((module) => ({ default: module.SettingsView })));
const BakeryView = lazy(() => import("../features/bakery/BakeryView").then((module) => ({ default: module.BakeryView })));
export const TASK_COMPLETION_EXIT_BUFFER_MS = 250;
export const TASK_COMPLETION_EXIT_MS = TASK_COMPLETION_ANIMATION_MS + TASK_COMPLETION_EXIT_BUFFER_MS;

function reducedMotionPreferred(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export function entityDetailBackTarget(listId: string | null, projectId: string | null, areaId: string | null): { view: "lists" | "projects" | "areas"; label: string } | null {
  if (listId) return { view: "lists", label: "Lists" };
  if (projectId) return { view: "projects", label: "Projects" };
  if (areaId) return { view: "areas", label: "Areas" };
  return null;
}

export function entityDetailBackAction(hasInAppHistory: boolean, fallback: "lists" | "projects" | "areas"): "history" | "lists" | "projects" | "areas" {
  return hasInAppHistory ? "history" : fallback;
}

export function withInAppBack<T extends object>(route: T): T & { todonutInAppBack: true } {
  return { ...route, todonutInAppBack: true };
}

export function settingsSubsectionShowsBack(section: SettingsSubsection): boolean {
  return section !== "home";
}

function OptionalSurfaceFallback() {
  return <div className="empty-state" role="status" aria-live="polite">Loading destination...</div>;
}

type CreationKind = Extract<
  AddActionId,
  | "task"
  | "list"
  | "project"
  | "listItem"
  | "childTask"
  | "status"
  | "tag"
  | "tagGroup"
  | "area"
  | "schedule"
>;
type ModalState =
  | { kind: "list"; list?: ReferenceList }
  | { kind: "project"; project?: Project }
  | { kind: "area"; area?: Area }
  | { kind: "listItem"; entry?: ReferenceListEntry; mode?: "single" | "multiple" }
  | { kind: "status"; status?: Status }
  | { kind: "priority"; priority: Priority }
  | { kind: "tag"; tag?: Tag }
  | { kind: "tagGroup"; tagGroup?: TagGroup }
  | { kind: "deleteStatus"; status: Status }
  | { kind: "deleteTag"; tag: Tag }
  | { kind: "deleteTagGroup"; tagGroup: TagGroup }
  | { kind: "projectTags"; project: Project }
  | null;
type TaskEditorState =
  | {
      type: "create";
      defaults: Partial<
        Pick<Task, "location" | "scheduledDate" | "parentTaskId">
      >;
    }
  | { type: "edit"; taskId: string }
  | null;
type ScheduleEditorState =
  | { type: "create"; sourceTaskId?: string }
  | { type: "edit"; ruleId: string }
  | null;
export const DEFAULT_TAG_SCOPES: TagScope[] = ["task", "project"];
const listColorOptions = [
  { label: "Grapefruit Dark", value: "var(--palette-grapefruit-dark)" },
  { label: "Bittersweet Dark", value: "var(--palette-bittersweet-dark)" },
  { label: "Sunflower Dark", value: "var(--palette-sunflower-dark)" },
  { label: "Grass Dark", value: "var(--palette-grass-dark)" },
  { label: "Mint Dark", value: "var(--palette-mint-dark)" },
  { label: "Aqua Dark", value: "var(--palette-aqua-dark)" },
  { label: "Blue Jeans Dark", value: "var(--palette-blue-jeans-dark)" },
  { label: "Lavender Dark", value: "var(--palette-lavender-dark)" },
  { label: "Pink Rose Dark", value: "var(--palette-pink-rose-dark)" },
  { label: "Light Grey Dark", value: "var(--palette-light-grey-dark)" },
  { label: "Medium Grey Dark", value: "var(--palette-medium-grey-dark)" },
  { label: "Dark Grey Dark", value: "var(--palette-dark-grey-dark)" },
];

export function App() {
  return (
    <AppErrorBoundary>
      <FeedbackProvider>
        <ConfirmationProvider>
          <Application />
        </ConfirmationProvider>
      </FeedbackProvider>
    </AppErrorBoundary>
  );
}

const mutableCollectionKeys = [
  "areas",
  "projects",
  "tasks",
  "referenceLists",
  "referenceListEntries",
  "statuses",
  "priorities",
  "tags",
  "tagGroups",
  "quantifierDefinitions",
  "recurrenceRules",
  "recurrenceGenerations",
  "viewPreferences",
] as const;

type IdentifiedRecord = { id: string };

export function rebaseAppData(base: AppData, next: AppData, target: AppData): AppData {
  let rebased: AppData = { ...target };
  for (const key of mutableCollectionKeys) {
    rebased = { ...rebased, [key]: rebaseRecordCollection(base[key] as IdentifiedRecord[], next[key] as IdentifiedRecord[], target[key] as IdentifiedRecord[]) } as AppData;
  }
  const baseActivityIds = new Set(base.activity.map((event) => event.id));
  const targetActivityIds = new Set(target.activity.map((event) => event.id));
  const addedActivity = next.activity.filter((event) => !baseActivityIds.has(event.id) && !targetActivityIds.has(event.id));
  return {
    ...rebased,
    activity: [...target.activity, ...addedActivity],
    settings: JSON.stringify(base.settings) === JSON.stringify(next.settings) ? target.settings : next.settings,
    bakery: rebasePlainValue(base.bakery, next.bakery, target.bakery) as AppData["bakery"],
  };
}

function rebaseRecordCollection<T extends IdentifiedRecord>(base: T[], next: T[], target: T[]): T[] {
  const baseById = new Map(base.map((record) => [record.id, record]));
  const nextById = new Map(next.map((record) => [record.id, record]));
  const targetById = new Map(target.map((record) => [record.id, record]));
  const changedIds = new Set<string>();
  for (const record of next) {
    const previous = baseById.get(record.id);
    if (!previous || JSON.stringify(previous) !== JSON.stringify(record)) changedIds.add(record.id);
  }
  const removedIds = new Set(base.filter((record) => !nextById.has(record.id)).map((record) => record.id));
  const output = target.filter((record) => !removedIds.has(record.id)).map((record) => changedIds.has(record.id) ? nextById.get(record.id) ?? record : record);
  for (const id of changedIds) {
    if (!targetById.has(id)) {
      const created = nextById.get(id);
      if (created) output.push(created);
    }
  }
  return output;
}

function rebasePlainValue(base: unknown, next: unknown, target: unknown): unknown {
  if (JSON.stringify(base) === JSON.stringify(next)) return target;
  if (typeof base === "number" && typeof next === "number" && typeof target === "number") return target + (next - base);
  if (Array.isArray(base) && Array.isArray(next) && Array.isArray(target)) {
    if (next.every((item) => item && typeof item === "object" && "id" in item)) return rebaseRecordCollection(base as IdentifiedRecord[], next as IdentifiedRecord[], target as IdentifiedRecord[]);
    return next;
  }
  if (base && next && target && typeof base === "object" && typeof next === "object" && typeof target === "object" && !Array.isArray(base) && !Array.isArray(next) && !Array.isArray(target)) {
    const keys = new Set([...Object.keys(base), ...Object.keys(next), ...Object.keys(target)]);
    return [...keys].reduce<Record<string, unknown>>((result, key) => {
      result[key] = rebasePlainValue((base as Record<string, unknown>)[key], (next as Record<string, unknown>)[key], (target as Record<string, unknown>)[key]);
      return result;
    }, {});
  }
  return next;
}

function Application() {
  const [provider] = useState<PersistenceProvider>(() =>
    createPersistenceProvider(),
  );
  const [data, setData] = useState<AppData>(() => createSeedData());
  const [view, setView] = useState<ViewId>(() => parseHashRoute().view);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [settingsSubsection, setSettingsSubsection] =
    useState<SettingsSubsection>("home");
  const [dockPage, setDockPage] = useState(0);
  const [dockDirection, setDockDirection] = useState<"left" | "right">("left");
  const [trashMode, setTrashMode] = useState<HiddenMode>("deleted");
  const [modal, setModal] = useState<ModalState>(null);
  const [taskEditor, setTaskEditor] = useState<TaskEditorState>(null);
  const [scheduleEditor, setScheduleEditor] =
    useState<ScheduleEditorState>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [taskFilters, setTaskFilters] = useState<TaskFilters>({});
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [moveTaskIds, setMoveTaskIds] = useState<string[] | null>(null);
  const [lastBulk, setLastBulk] = useState<{
    type: string;
    affected: number;
    cascade: number;
  } | null>(null);
  const [pending, setPending] = useState<"idle" | "pending" | "failed">("idle");
  const [connection, setConnection] = useState("idle");
  const [syncState, setSyncState] = useState<SyncState>({
    initialSyncComplete: false,
    canonicalStateKnown: false,
    canonicalRevision: null,
    lastConfirmedRevision: null,
    lastAuthoritativeSnapshotAt: null,
    lastSuccessfulSyncAt: null,
  });
  const [mutationState, setMutationState] = useState<MutationState>({
    pendingCount: 0,
    retryingCount: 0,
    failedCount: 0,
    conflictCount: 0,
    currentSummary: "None",
    lastFailureCategory: "None",
    trusted: true,
  });
  const [failedOperation, setFailedOperation] =
    useState<MutationOperation | null>(null);
  const [auth, setAuth] = useState<AuthState>({
    required: Boolean(provider.getAuthState),
    ready: !provider.getAuthState,
    userEmail: null,
    error: null,
  });
  const [authMode, setAuthMode] = useState<"signIn" | "recovery">(() =>
    isPasswordRecoveryRedirect() ? "recovery" : "signIn",
  );
  const today = localDateString();
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const feedback = useFeedback();
  const confirm = useConfirmation();
  const [mutationCoordinator] = useState(() => new MutationCoordinator());
  const [completionUndo] = useState(() => new UndoService());
  const recurrenceFlight = useRef(false);
  const optimisticDataRef = useRef(data);
  const confirmedDataRef = useRef(data);
  const confirmedRevisionRef = useRef<number | null>(null);
  const commitQueueRef = useRef(Promise.resolve());

  useEffect(() => {
    optimisticDataRef.current = data;
  }, [data]);

  useEffect(() => {
    confirmedRevisionRef.current = syncState.canonicalRevision;
  }, [syncState.canonicalRevision]);

  useEffect(() => {
    if (!provider.getAuthState) return;
    provider
      .getAuthState()
      .then(setAuth)
      .catch((error: Error) =>
        setAuth({
          required: true,
          ready: false,
          userEmail: null,
          error: error.message,
        }),
      );
    return provider.onAuthStateChange?.((next) => {
      if (next.recovery) setAuthMode("recovery");
      setAuth(next);
    });
  }, [provider]);
  useEffect(() => {
    if (auth.required && !auth.ready) return;
    provider
      .load()
      .then((loaded) => {
        const at = new Date().toISOString();
        optimisticDataRef.current = loaded.data;
        confirmedDataRef.current = loaded.data;
        confirmedRevisionRef.current = loaded.canonicalRevision;
        setData(loaded.data);
        setSyncState({
          initialSyncComplete: true,
          canonicalStateKnown: true,
          canonicalRevision: loaded.canonicalRevision,
          lastConfirmedRevision: loaded.canonicalRevision,
          lastAuthoritativeSnapshotAt: at,
          lastSuccessfulSyncAt: at,
        });
        setMutationState(mutationCoordinator.diagnostics());
        void runRecurrenceProcessing(
          loaded.data,
          loaded.canonicalRevision,
          "startup",
        );
      })
      .catch((error: Error) => {
        setSyncState((current) => ({ ...current, canonicalStateKnown: false }));
        feedback.error(error.message, { scope: "persistent" });
      });
    return provider.subscribe?.((snapshot) => {
      const at = new Date().toISOString();
      setSyncState((current) => {
        if (
          current.canonicalRevision !== null &&
          snapshot.canonicalRevision <= current.canonicalRevision
        )
          return current;
        if (mutationCoordinator.unresolvedOperations().length > 0) {
          setPending("failed");
          setMutationState(mutationCoordinator.diagnostics());
          feedback.warning(
            "A newer saved version exists. Reload before resolving your unsaved change.",
            { scope: "persistent", dedupeKey: "realtime-conflict" },
          );
          return {
            ...current,
            canonicalStateKnown: false,
            lastAuthoritativeSnapshotAt: at,
            lastSuccessfulSyncAt: at,
          };
        }
        optimisticDataRef.current = snapshot.data;
        confirmedDataRef.current = snapshot.data;
        confirmedRevisionRef.current = snapshot.canonicalRevision;
        setData(snapshot.data);
        return {
          initialSyncComplete: true,
          canonicalStateKnown: true,
          canonicalRevision: snapshot.canonicalRevision,
          lastConfirmedRevision: snapshot.canonicalRevision,
          lastAuthoritativeSnapshotAt: at,
          lastSuccessfulSyncAt: at,
        };
      });
      setMutationState(mutationCoordinator.diagnostics());
    }, setConnection);
  }, [
    provider,
    today,
    auth.required,
    auth.ready,
    feedback,
    mutationCoordinator,
  ]);
  useEffect(() => {
    runRouteCleanup([
      () => setAddOpen(false),
      () => setMobileFiltersOpen(false),
      () => setActiveTaskId(null),
      () => setTaskFilters({}),
      () => {
        setSelectionMode(false);
        setSelectedTaskIds(new Set());
      },
      feedback.clearRouteScoped,
    ]);
  }, [view, selectedListId, selectedProjectId, selectedAreaId]);
  useEffect(() => {
    const route = parseHashRoute();
    setView(route.view);
    setSelectedListId(route.listId);
    setSelectedProjectId(route.projectId);
    setSelectedAreaId(route.areaId);
    setSettingsSubsection(route.settingsSubsection);
    if (!location.hash) history.replaceState(route, "", routeToHash(route));
    const onPop = () => {
      const next = parseHashRoute();
      setView(next.view);
      setSelectedListId(next.listId);
      setSelectedProjectId(next.projectId);
      setSelectedAreaId(next.areaId);
      setSettingsSubsection(next.settingsSubsection);
      setTaskEditor(null);
      setModal(null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    if (!addOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAddOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [addOpen]);
  useEffect(() => {
    const contract = [...data.bakery.activeContracts].sort(
      (a, b) =>
        a.completesAt.localeCompare(b.completesAt) || a.id.localeCompare(b.id),
    )[0];
    if (!contract || syncState.canonicalRevision === null) return;
    const delay = Math.max(
      0,
      Math.min(60000, new Date(contract.completesAt).getTime() - Date.now()),
    );
    const timer = window.setTimeout(() => {
      const next = resolveBakeryTimeline(data);
      if (next !== data)
        void commit(
          next,
          next.bakery.completedSaleIds.filter(
            (id) => !data.bakery.completedSaleIds.includes(id),
          ),
          "Donut sold",
        );
    }, delay);
    return () => window.clearTimeout(timer);
  }, [data.bakery.activeContracts, syncState.canonicalRevision]);
  useEffect(() => {
    if (
      !syncState.canonicalStateKnown ||
      syncState.canonicalRevision === null ||
      pending !== "idle"
    )
      return;
    const run = () => {
      if (document.visibilityState === "visible")
        void runRecurrenceProcessing(
          data,
          syncState.canonicalRevision,
          "foreground",
        );
    };
    const timer = window.setInterval(run, 10 * 60 * 1000);
    window.addEventListener("focus", run);
    document.addEventListener("visibilitychange", run);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", run);
      document.removeEventListener("visibilitychange", run);
    };
  }, [
    data,
    syncState.canonicalStateKnown,
    syncState.canonicalRevision,
    pending,
  ]);

  async function commit(
    next: AppData,
    expectedIds: string[] = [],
    successMessage = "Saved",
    baseData = data,
    expectedRevision = syncState.canonicalRevision,
    confirmed?: (saved: AppData, revision: number) => void,
    showSuccessFeedback = true,
  ): Promise<boolean> {
    const queuedBaseData = baseData;
    const queuedNext = next;
    const optimisticNext =
      optimisticDataRef.current === queuedBaseData
        ? queuedNext
        : rebaseAppData(queuedBaseData, queuedNext, optimisticDataRef.current);
    optimisticDataRef.current = optimisticNext;
    setData(optimisticNext);
    if (expectedRevision === null || confirmedRevisionRef.current === null) {
      feedback.error("Wait for synchronisation to finish before saving.", {
        scope: "persistent",
      });
      return false;
    }
    setPending("pending");
    setFailedOperation(null);
    setMutationState({
      ...mutationCoordinator.diagnostics(),
      pendingCount: 1,
      failedCount: 0,
      conflictCount: 0,
      currentSummary: successMessage,
      lastFailureCategory: "None",
      trusted: false,
    });
    const queuedCommit = commitQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        const networkBase = confirmedDataRef.current;
        const networkRevision = confirmedRevisionRef.current;
        if (networkRevision === null) {
          feedback.error("Wait for synchronisation to finish before saving.", {
            scope: "persistent",
          });
          return false;
        }
        const networkNext =
          networkBase === queuedBaseData
            ? queuedNext
            : rebaseAppData(queuedBaseData, queuedNext, networkBase);
        let savedSuccessfully = false;
        await mutationCoordinator.submit(provider, {
          name: successMessage,
          data: networkNext,
          current: networkBase,
          expectedRevision: networkRevision,
          expectedIds,
          applyOptimistic: () => undefined,
          onConfirmed: (saved, at, confirmedRevision) => {
            confirmedDataRef.current = saved;
            confirmedRevisionRef.current = confirmedRevision;
            const optimisticCaughtUp = JSON.stringify(optimisticDataRef.current) === JSON.stringify(networkNext);
            if (optimisticCaughtUp) {
              optimisticDataRef.current = saved;
              setData(saved);
              setPending("idle");
            } else {
              setPending("pending");
            }
            if (showSuccessFeedback)
              feedback.success(successMessage, {
                scope: "route",
                dedupeKey: successMessage,
              });
            setSyncState({
              initialSyncComplete: true,
              canonicalStateKnown: true,
              canonicalRevision: confirmedRevision,
              lastConfirmedRevision: confirmedRevision,
              lastAuthoritativeSnapshotAt: at,
              lastSuccessfulSyncAt: at,
            });
            setMutationState(mutationCoordinator.diagnostics());
            savedSuccessfully = true;
            confirmed?.(saved, confirmedRevision);
          },
          onFailed: (error, operation) => {
            setPending("failed");
            setFailedOperation(operation);
            setSyncState((current) => ({ ...current, canonicalStateKnown: false }));
            setMutationState(mutationCoordinator.diagnostics());
            const message =
              error.category === "conflict"
                ? "A newer saved version exists. Your attempted change was not saved, and current server data was not overwritten."
                : error.message;
            feedback.error(message, {
              scope: "persistent",
              dedupeKey: `mutation-failed:${successMessage}`,
            });
          },
        });
        return savedSuccessfully;
      });
    commitQueueRef.current = queuedCommit.then(() => undefined, () => undefined);
    return queuedCommit;
  }

  async function retryFailedOperation() {
    if (!failedOperation || !failedOperation.recoveryActions.includes("retry"))
      return;
    setFailedOperation(null);
    optimisticDataRef.current = failedOperation.previous;
    setData(failedOperation.previous);
    await commit(
      failedOperation.next,
      failedOperation.affectedEntities,
      failedOperation.name,
      failedOperation.previous,
      failedOperation.expectedRevision,
    );
  }

  function discardFailedOperation() {
    if (!failedOperation) return;
    const restored = mutationCoordinator.discard(failedOperation.id);
    if (restored) {
      optimisticDataRef.current = restored;
      setData(restored);
    }
    setFailedOperation(null);
    setPending("idle");
    setMutationState(mutationCoordinator.diagnostics());
    setSyncState((current) => ({
      ...current,
      canonicalStateKnown: current.canonicalRevision !== null,
    }));
    feedback.info("Local unsaved change discarded", { scope: "global" });
  }

  async function reloadAuthoritativeState() {
    const loaded = await provider.load();
    const at = new Date().toISOString();
    mutationCoordinator.clearUnresolvedAfterReload();
    optimisticDataRef.current = loaded.data;
    confirmedDataRef.current = loaded.data;
    confirmedRevisionRef.current = loaded.canonicalRevision;
    setData(loaded.data);
    setFailedOperation(null);
    setPending("idle");
    setSyncState({
      initialSyncComplete: true,
      canonicalStateKnown: true,
      canonicalRevision: loaded.canonicalRevision,
      lastConfirmedRevision: loaded.canonicalRevision,
      lastAuthoritativeSnapshotAt: at,
      lastSuccessfulSyncAt: at,
    });
    setMutationState(mutationCoordinator.diagnostics());
    feedback.info("Authoritative state reloaded", { scope: "global" });
    void runRecurrenceProcessing(
      loaded.data,
      loaded.canonicalRevision,
      "reload",
    );
  }

  async function runRecurrenceProcessing(
    baseData = data,
    expectedRevision = syncState.canonicalRevision,
    reason = "foreground",
  ) {
    if (
      recurrenceFlight.current ||
      expectedRevision === null ||
      pending !== "idle" ||
      failedOperation ||
      (!syncState.canonicalStateKnown &&
        reason !== "startup" &&
        reason !== "reload")
    )
      return;
    recurrenceFlight.current = true;
    try {
      const result = processDueRecurrenceSchedules(baseData, localDateString());
      if (
        result.data === baseData ||
        (result.generatedCount === 0 &&
          result.blockedRuleIds.length === 0 &&
          result.processedRuleIds.length === 0)
      )
        return;
      await commit(
        result.data,
        [...result.processedRuleIds, ...result.blockedRuleIds],
        "Recurring Tasks processed",
        baseData,
        expectedRevision,
        () => {
          if (result.generatedCount > 0)
            feedback.info(
              `${result.generatedCount} recurring Task${result.generatedCount === 1 ? "" : "s"} created.`,
              {
                scope: "global",
                dedupeKey: `recurrence:${reason}:${result.generatedCount}`,
              },
            );
        },
      );
    } finally {
      recurrenceFlight.current = false;
    }
  }

  const selectedList = selectedListId
    ? (data.referenceLists.find(
        (list) => list.id === selectedListId && !list.deletedAt,
      ) ?? null)
    : null;
  const selectedProject = selectedProjectId
    ? (data.projects.find(
        (project) => project.id === selectedProjectId && !project.deletedAt,
      ) ?? null)
    : null;
  const selectedArea = selectedAreaId
    ? (data.areas.find(
        (area) => area.id === selectedAreaId && !area.deletedAt && !area.archivedAt,
      ) ?? null)
    : null;
  const title = selectedList
    ? selectedList.title
    : selectedProject
      ? selectedProject.title
      : selectedArea
        ? selectedArea.title
        : (desktopNav.find((item) => item.id === view)?.label ?? "Today");
  const PageTitleIcon = selectedList
    ? ListOrdered
    : selectedProject
      ? FolderKanban
      : selectedArea
        ? LandPlot
        : (navigationRegistry.find((item) => item.id === view)?.icon ?? null);
  const detailBackTarget = entityDetailBackTarget(selectedList?.id ?? null, selectedProject?.id ?? null, selectedArea?.id ?? null);
  const settingsBackVisible = view === "settings" && settingsSubsectionShowsBack(settingsSubsection);
  const taskViewId = toTaskViewId(view);
  const mobileFilterControlsAvailable =
    taskViewId !== null || view === "projects" || view === "areas";
  const detailTaskViewId: TaskViewId | null = selectedProject
    ? "project-detail"
    : selectedArea
      ? "area-detail"
      : null;
  const activePreferenceViewId = taskViewId ?? detailTaskViewId ?? "today";
  const preference = getViewPreference(data, activePreferenceViewId);
  const taskView = useMemo(
    () =>
      taskViewId
        ? buildTaskView(
            data,
            taskViewId,
            { ...preference, filters: taskFilters },
            today,
          )
        : null,
    [
      data,
      taskViewId,
      preference.sort,
      preference.grouping,
      preference.presentation,
      preference.showClosed,
      taskFilters,
      today,
    ],
  );
  const visibleTaskIds = useMemo(
    () =>
      new Set(
        taskView?.sections.flatMap((section) =>
          section.tasks.flatMap((task) => [
            task.id,
            ...descendants(data, task.id)
              .filter(
                (child) =>
                  !child.deletedAt &&
                  (preference.showClosed || !isTaskClosed(data, child)),
              )
              .map((child) => child.id),
          ]),
        ) ?? [],
      ),
    [data, taskView, preference.showClosed],
  );
  useEffect(
    () =>
      setSelectedTaskIds(
        (current) =>
          new Set([...current].filter((id) => visibleTaskIds.has(id))),
      ),
    [visibleTaskIds],
  );

  function navigate(next: ViewId) {
    const destination = next === "diagnostics" ? "settings" : next;
    const route = {
      view: destination,
      listId: null,
      projectId: null,
      areaId: null,
      settingsSubsection:
        next === "diagnostics"
          ? ("diagnostics" as SettingsSubsection)
          : ("home" as SettingsSubsection),
    };
    history.pushState(route, "", routeToHash(route));
    setView(destination);
    setSelectedListId(null);
    if (destination !== "projects") setSelectedProjectId(null);
    if (destination !== "areas") setSelectedAreaId(null);
    setSettingsSubsection(route.settingsSubsection);
  }
  function navigateBackFromDetail() {
    if (!detailBackTarget) return;
    const action = entityDetailBackAction(Boolean(history.state?.todonutInAppBack), detailBackTarget.view);
    if (action === "history") history.back();
    else navigate(action);
  }
  function navigateBackFromSettings() {
    setSettingsSectionRoute("home");
  }
  function setSettingsSectionRoute(section: SettingsSubsection) {
    const route = {
      view: "settings" as ViewId,
      listId: null,
      projectId: null,
      areaId: null,
      settingsSubsection: section,
    };
    history.pushState(route, "", routeToHash(route));
    setView("settings");
    setSelectedListId(null);
    setSelectedProjectId(null);
    setSelectedAreaId(null);
    setSettingsSubsection(section);
  }
  function updateViewPreference(
    patch: Partial<{
      sort: TaskSortField;
      grouping: TaskGroupingField;
      presentation: "compact" | "detailed";
      showClosed: boolean;
    }>,
  ) {
    const next = saveViewPreference(data, activePreferenceViewId, patch);
    void commit(
      next,
      [`view_${activePreferenceViewId}`],
      "View preference saved",
      data,
      syncState.canonicalRevision,
      undefined,
      false,
    );
  }
  function toggleSelectedTask(task: Task) {
    setSelectedTaskIds((current) => {
      const next = new Set(current);
      if (next.has(task.id)) next.delete(task.id);
      else next.add(task.id);
      return next;
    });
  }
  function selectedTasks(): Task[] {
    return data.tasks.filter((task) => selectedTaskIds.has(task.id));
  }
  function clearSelection() {
    setSelectionMode(false);
    setSelectedTaskIds(new Set());
  }
  function applyTaskMove(destination: TaskMoveDestination) {
    if (!moveTaskIds?.length) return;
    try {
      const before = data;
      let next = data;
      for (const id of moveTaskIds)
        next = moveTaskSubtreeCommand(next, id, destination);
      const affectedIds = [
        ...new Set(
          moveTaskIds.flatMap((id) => [
            id,
            ...descendants(data, id).map((task) => task.id),
          ]),
        ),
      ];
      const beforeTasks = before.tasks.filter((task) =>
        affectedIds.includes(task.id),
      );
      void commit(
        next,
        affectedIds,
        "Task move completed",
        data,
        syncState.canonicalRevision,
        (saved, revision) => {
          setMoveTaskIds(null);
          clearSelection();
          const savedTasks = saved.tasks.filter((task) =>
            affectedIds.includes(task.id),
          );
          const receipt = completionUndo.register({
            id: `undo:move:${Date.now()}`,
            label: "Undo Task move",
            expiresAt: Date.now() + 10000,
            run: () => {
              if (
                savedTasks.some(
                  (task) =>
                    saved.tasks.find((current) => current.id === task.id)
                      ?.version !== task.version,
                )
              )
                return;
              const restored = {
                ...saved,
                tasks: saved.tasks.map((task) => {
                  const previous = beforeTasks.find(
                    (candidate) => candidate.id === task.id,
                  );
                  return previous
                    ? {
                        ...previous,
                        updatedAt: nowIso(),
                        version: task.version + 1,
                      }
                    : task;
                }),
                activity: [
                  ...saved.activity,
                  createActivity(
                    "task",
                    moveTaskIds[0],
                    "undo",
                    "Undo Task move",
                    { originalOperation: "move", taskIds: affectedIds },
                    null,
                  ),
                ],
              };
              void commit(
                restored,
                affectedIds,
                "Task move undone",
                saved,
                revision,
              );
            },
          });
          feedback.info("Task move completed", {
            scope: "route",
            action: {
              label: "Undo",
              run: () => void completionUndo.execute(receipt.id),
            },
          });
        },
      );
    } catch (error) {
      feedback.error(
        error instanceof Error ? error.message : "Task move failed.",
        { scope: "route" },
      );
    }
  }
  function reorderTask(
    taskId: string,
    targetId: string | null,
    direction?: -1 | 1,
  ) {
    try {
      const next = targetId
        ? reorderTaskSiblingBeforeCommand(data, taskId, targetId)
        : reorderTaskSiblingCommand(data, taskId, direction ?? 1);
      if (next === data) return;
      const changed = data.tasks.filter(
        (task) =>
          next.tasks.find((candidate) => candidate.id === task.id)?.order !==
          task.order,
      );
      void commit(
        next,
        changed.map((task) => task.id),
        "Task order changed",
        data,
        syncState.canonicalRevision,
        (saved, revision) => {
          const receipt = completionUndo.register({
            id: `undo:reorder:${Date.now()}`,
            label: "Undo Task reorder",
            expiresAt: Date.now() + 10000,
            run: () => {
              const savedChanged = saved.tasks.filter((task) =>
                changed.some((previous) => previous.id === task.id),
              );
              if (
                savedChanged.some(
                  (task) =>
                    saved.tasks.find((current) => current.id === task.id)
                      ?.version !== task.version,
                )
              )
                return;
              const restored = {
                ...saved,
                tasks: saved.tasks.map((task) => {
                  const previous = changed.find(
                    (candidate) => candidate.id === task.id,
                  );
                  return previous
                    ? {
                        ...task,
                        order: previous.order,
                        updatedAt: nowIso(),
                        version: task.version + 1,
                      }
                    : task;
                }),
                activity: [
                  ...saved.activity,
                  createActivity(
                    "task",
                    taskId,
                    "undo",
                    "Undo Task sibling reorder",
                  ),
                ],
              };
              void commit(
                restored,
                changed.map((task) => task.id),
                "Task order restored",
                saved,
                revision,
              );
            },
          });
          feedback.info("Task order changed", {
            scope: "route",
            action: {
              label: "Undo",
              run: () => void completionUndo.execute(receipt.id),
            },
          });
        },
      );
    } catch (error) {
      feedback.error(
        error instanceof Error ? error.message : "Task reorder failed.",
        { scope: "route" },
      );
    }
  }
  function deleteTaskWithUndo(task: Task) {
    const beforeTasks = [task, ...descendants(data, task.id)].filter(
      (candidate) => !candidate.deletedAt,
    );
    const ids = beforeTasks.map((candidate) => candidate.id);
    const next = softDeleteCommand(data, "task", task.id);
    void commit(
      next,
      ids,
      "Moved to Trash",
      data,
      syncState.canonicalRevision,
      (saved, revision) => {
        const deletedTasks = saved.tasks.filter((candidate) =>
          ids.includes(candidate.id),
        );
        const receipt = completionUndo.register({
          id: `undo:trash:${task.id}:${Date.now()}`,
          label: "Undo Move to Trash",
          expiresAt: Date.now() + 10000,
          run: () => {
            if (
              deletedTasks.some(
                (candidate) =>
                  saved.tasks.find((current) => current.id === candidate.id)
                    ?.version !== candidate.version,
              )
            )
              return;
            const restored = {
              ...saved,
              tasks: saved.tasks.map((candidate) => {
                const previous = beforeTasks.find(
                  (item) => item.id === candidate.id,
                );
                return previous
                  ? {
                      ...previous,
                      updatedAt: nowIso(),
                      version: candidate.version + 1,
                    }
                  : candidate;
              }),
              activity: [
                ...saved.activity,
                createActivity(
                  "task",
                  task.id,
                  "undo",
                  "Undo Task move to Trash",
                  { taskIds: ids },
                  null,
                ),
              ],
            };
            void commit(restored, ids, "Task restored", saved, revision);
          },
        });
        feedback.info("Moved to Trash", {
          scope: "route",
          action: {
            label: "Undo",
            run: () => void completionUndo.execute(receipt.id),
          },
        });
      },
    );
  }
  function runBulk(command: BulkTaskCommand) {
    try {
      const result = runBulkTaskCommand(data, [...selectedTaskIds], command);
      const beforeTasks = data.tasks.filter((task) =>
        result.affectedTaskIds.includes(task.id),
      );
      const saveWithUndo = () =>
        void commit(
          result.data,
          result.affectedTaskIds,
          result.summary,
          data,
          syncState.canonicalRevision,
          (confirmedData, revision) => {
            setLastBulk({
              type: command.type,
              affected: result.affectedTaskIds.length,
              cascade: result.cascadeCount,
            });
            clearSelection();
            const receipt = completionUndo.register({
              id: `undo:bulk:${Date.now()}`,
              label: "Undo bulk action",
              expiresAt: Date.now() + 10000,
              run: () => {
                const confirmedTasks = confirmedData.tasks.filter((task) =>
                  result.affectedTaskIds.includes(task.id),
                );
                if (
                  confirmedTasks.some(
                    (task) =>
                      confirmedData.tasks.find(
                        (current) => current.id === task.id,
                      )?.version !== task.version,
                  )
                ) {
                  feedback.warning("Newer Task changes prevent this Undo.", {
                    scope: "route",
                  });
                  return;
                }
                const undoData = {
                  ...confirmedData,
                  tasks: confirmedData.tasks.map((task) => {
                    const previous = beforeTasks.find(
                      (candidate) => candidate.id === task.id,
                    );
                    return previous
                      ? {
                          ...previous,
                          updatedAt: nowIso(),
                          version: task.version + 1,
                        }
                      : task;
                  }),
                  activity: [
                    ...confirmedData.activity,
                    createActivity(
                      "task",
                      result.affectedTaskIds[0] ?? "bulk",
                      "undo",
                      `Undo ${result.summary}`,
                      {
                        operation: command.type,
                        affectedTaskIds: result.affectedTaskIds,
                      },
                      null,
                    ),
                  ],
                };
                void commit(
                  undoData,
                  result.affectedTaskIds,
                  "Bulk action undone",
                  confirmedData,
                  revision,
                );
              },
            });
            feedback.info(result.summary, {
              scope: "route",
              dedupeKey: `bulk:${command.type}:${result.affectedTaskIds.length}`,
              action: {
                label: "Undo",
                run: () => void completionUndo.execute(receipt.id),
              },
            });
          },
        );
      if (
        (command.type === "complete" ||
          command.type === "cancel" ||
          command.type === "trash") &&
        result.affectedTaskIds.length > 3
      ) {
        confirm({
          title: result.summary,
          message: `${result.affectedTaskIds.length} Tasks will be affected${result.cascadeCount ? `, including ${result.cascadeCount} descendants` : ""}.`,
          confirmLabel: command.type === "trash" ? "Move to Trash" : "Apply",
          tone: command.type === "trash" ? "destructive" : "ordinary",
          onConfirm: saveWithUndo,
        });
      } else saveWithUndo();
    } catch (error) {
      feedback.error(
        error instanceof Error ? error.message : "Bulk action failed",
        { scope: "route" },
      );
    }
  }
  function completeWithRewards(task: Task) {
    const baseData = optimisticDataRef.current;
    const currentTask = baseData.tasks.find((candidate) => candidate.id === task.id) ?? task;
    if (isTaskClosed(baseData, currentTask)) {
      try {
        const reopened = reopenTaskCommand(
          baseData,
          currentTask.id,
          defaultStatusId(baseData),
        );
        const affectedIds = changedTaskIds(baseData, reopened);
        void commit(
          reopened,
          affectedIds,
          currentTask.aggregate ? "Task tree reopened" : "Task reopened",
          baseData,
          confirmedRevisionRef.current,
          (saved, revision) => {
            const before = baseData.tasks.filter((candidate) => affectedIds.includes(candidate.id));
            const receipt = completionUndo.register({ id: `undo:reopen:${currentTask.id}:${Date.now()}`, label: "Undo Task tree reopen", expiresAt: Date.now() + 10000, run: () => {
              const restored = restoreTaskSnapshots(saved, before, affectedIds, "Undo Task tree reopen", "reopen-tree");
              void commit(restored, affectedIds, "Reopen undone", saved, revision);
            } });
            feedback.info(currentTask.aggregate ? "Task tree reopened" : "Task reopened", { scope: "route", action: { label: "Undo", run: () => void completionUndo.execute(receipt.id) } });
          },
        );
      } catch (error) {
        feedback.error(
          error instanceof Error
            ? error.message
            : "Task could not be reopened.",
          { scope: "route" },
        );
      }
      return;
    }
    const operationId = `task-complete:${currentTask.id}:${Date.now()}`;
    const completed = completeTaskData(baseData, currentTask);
    const rewarded = applyTaskCompletionRewards(
      baseData,
      completed,
      currentTask,
      operationId,
    );
    const affectedIds = changedTaskIds(baseData, rewarded);
    const beforeTasks = baseData.tasks.filter((candidate) => affectedIds.includes(candidate.id));
    const gains = [
      ["dough", "Dough"],
      ["sprinkles", "Sprinkles"],
      ["icing", "Icing"],
    ]
      .map(([id, label]) => ({
        label,
        amount: rewarded.bakery.balances[id] - baseData.bakery.balances[id],
      }))
      .filter((gain) => gain.amount > 0);
    const doughWindow = rewarded.bakery.rewardLedger.find(
      (entry) => entry.operationId === operationId && entry.itemId === "dough" && entry.type === "productivity-reward",
    )?.idempotencyKey?.match(/schedule-(\d+):window-(\d+)/);
    const message = gains.length
      ? `${gains.map((gain) => `+${gain.amount} ${gain.label}`).join(" · ")}${doughWindow ? ` · Window ${Number(doughWindow[2]) + 1} of ${doughWindow[1]}` : ""}`
      : currentTask.aggregate
        ? "Task tree completed"
        : "Task completed";
    void commit(
      rewarded,
      affectedIds,
      message,
      baseData,
      confirmedRevisionRef.current,
      (saved, revision) => {
        const receipt = completionUndo.register({
          id: `undo:${operationId}`,
          label: "Undo Task completion",
          expiresAt: Date.now() + 10000,
          run: () => {
            const restored = restoreTaskSnapshots(saved, beforeTasks, affectedIds, "Undo Task tree completion", "complete-tree");
            void commit(
              reverseRewards(restored, operationId, `undo:${operationId}`),
              affectedIds,
              "Completion undone",
              saved,
              revision,
            );
          },
        });
        feedback.info(message, {
          scope: "route",
          dedupeKey: `completion:${currentTask.id}`,
          action: {
            label: "Undo",
            run: () => void completionUndo.execute(receipt.id),
          },
        });
      },
    );
  }
  function taskDefaults(): Pick<Task, "location" | "scheduledDate"> {
    if (
      selectedProject &&
      !selectedProject.archivedAt &&
      !selectedProject.completedAt
    )
      return {
        location: { type: "project", projectId: selectedProject.id },
        scheduledDate: null,
      };
    if (selectedArea)
      return {
        location: { type: "area", areaId: selectedArea.id },
        scheduledDate: null,
      };
    if (view === "someday")
      return { location: { type: "someday" }, scheduledDate: null };
    return {
      location: { type: "inbox" },
      scheduledDate: view === "today" ? today : null,
    };
  }
  function listDefaults(): Pick<
    ReferenceList,
    "location" | "areaId" | "projectId"
  > {
    if (
      selectedProject &&
      !selectedProject.archivedAt &&
      !selectedProject.completedAt
    )
      return {
        location: { type: "project", projectId: selectedProject.id },
        areaId: null,
        projectId: selectedProject.id,
      };
    if (selectedArea)
      return {
        location: { type: "area", areaId: selectedArea.id },
        areaId: selectedArea.id,
        projectId: null,
      };
    if (selectedList)
      return {
        location: selectedList.location,
        areaId: selectedList.areaId,
        projectId: selectedList.projectId,
      };
    return { location: { type: "loose" }, areaId: null, projectId: null };
  }
  const addContext: AddContext = {
    destination: view,
    openListId:
      selectedList && !selectedList.archivedAt ? selectedList.id : null,
    openAreaId: selectedArea?.id ?? null,
    openProjectId:
      selectedProject &&
      !selectedProject.archivedAt &&
      !selectedProject.completedAt
        ? selectedProject.id
        : null,
    activeParentTaskId: null,
    settingsSubsection,
    blockingOverlayOpen: Boolean(modal || taskEditor || scheduleEditor),
    capabilities: defaultAddCapabilities,
  };
  const addActions = resolveAddActions(addContext);
  function openCreation(kind: CreationKind, entry?: ReferenceListEntry) {
    setAddOpen(false);
    if (kind === "task")
      setTaskEditor({ type: "create", defaults: taskDefaults() });
    else if (kind === "status") setModal({ kind: "status" });
    else if (kind === "tag") setModal({ kind: "tag" });
    else if (kind === "tagGroup") setModal({ kind: "tagGroup" });
    else if (kind === "schedule") setScheduleEditor({ type: "create" });
    else if (kind === "list") setModal({ kind: "list" });
    else if (kind === "project") setModal({ kind: "project" });
    else if (kind === "area") setModal({ kind: "area" });
    else if (kind === "listItem") setModal({ kind, entry, mode: "single" });
  }
  function confirmDeleteList(list: ReferenceList) {
    const itemCount = data.referenceListEntries.filter(
      (entry) => entry.referenceListId === list.id && !entry.deletedAt,
    ).length;
    confirm({
      title: `Move ${list.title} to Trash`,
      message: itemCount
        ? `This List and its ${itemCount} Item${itemCount === 1 ? "" : "s"} will disappear from active views. Restoring the List later restores its container and non-deleted Items.`
        : "Move this empty List to Trash?",
      confirmLabel: "Move to Trash",
      tone: "destructive",
      onConfirm: () =>
        void commit(
          softDeleteCommand(data, "referenceList", list.id),
          [list.id],
          "Moved to Trash",
        ),
    });
  }
  function confirmPromoteTask(task: Task) {
    const childCount = data.tasks.filter((candidate) => candidate.parentTaskId === task.id && !candidate.deletedAt).length;
    confirm({
      title: `Promote ${task.title} to Project`,
      message: `This will create a Project from the Task, preserve compatible Area, Status, Tag and quantifier data${childCount ? `, and move its ${childCount} direct child Task${childCount === 1 ? "" : "s"} into the new Project` : ""}. The original Task record will then be purged.`,
      confirmLabel: "Promote to Project",
      onConfirm: async () => {
        const conversion = promoteTaskToProjectCommand(data, task.id);
        await commit(conversion.data, [task.id], "Task promoted to Project");
      },
    });
  }
  function confirmDemoteProject(project: Project) {
    const childCount = data.tasks.filter((task) => !task.deletedAt && task.location.type === "project" && task.location.projectId === project.id && !task.parentTaskId).length;
    confirm({
      title: `Demote ${project.title} to Task`,
      message: `This will create a Task from the Project, preserve compatible Area, Status, Tag and quantifier data${childCount ? `, and retain its ${childCount} root Task${childCount === 1 ? "" : "s"} as children` : ""}. The original Project record will then be purged.`,
      confirmLabel: "Demote to Task",
      onConfirm: async () => {
        const conversion = demoteProjectToTaskCommand(data, project.id);
        const saved = await commit(conversion.data, [project.id], "Project demoted to Task");
        if (saved && selectedProjectId === project.id) navigate("all");
      },
    });
  }
  function downloadExport() {
    const result = buildSafeExport(data, syncState, mutationState);
    if (!result.safe) {
      feedback.warning(result.reason, { scope: "global" });
      return;
    }
    const blob = new Blob([JSON.stringify(result.envelope, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `todonut-export-${today}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    feedback.success("Export created", { scope: "global" });
  }

  if (authMode === "recovery" || (auth.required && !auth.ready))
    return <AuthGate provider={provider} auth={auth} setAuth={setAuth} mode={authMode} onRecoveryComplete={() => {
      setAuthMode("signIn");
      history.replaceState(parseHashRoute(), "", routeToHash(parseHashRoute()));
    }} />;

  const primaryDesktopNav = desktopNav.filter((item) => item.id !== "bakery");
  const bakeryDesktopNav = desktopNav.filter((item) => item.id === "bakery");
  const initialDataReady = syncState.initialSyncComplete;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img className="brand-logo" src={brandLogo} alt="" />
          <div>
            <h1>ToDonut</h1>
            <p><span>Productivity</span><span>with sprinkles</span></p>
          </div>
        </div>
        <nav className="nav-list nav-list--primary" aria-label="Primary">
          {primaryDesktopNav.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={view === item.id && !selectedList}
              onClick={() => navigate(item.id)}
            />
          ))}
        </nav>
        {bakeryDesktopNav.length > 0 && (
          <nav className="nav-list nav-list--secondary" aria-label="Bakery">
            {bakeryDesktopNav.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                active={view === item.id && !selectedList}
                onClick={() => navigate(item.id)}
              />
            ))}
          </nav>
        )}
      </aside>
      <section className={`workspace ${mobileFiltersOpen ? "mobile-filters-open" : ""}`}>
        <header className="topbar">
          <div
            className={`topbar-title topbar-title--with-currency${mobileFilterControlsAvailable ? " topbar-title--with-filter" : ""}${view === "trash" ? " topbar-title--trash" : ""}`}
          >
            {pending === "failed" && (
              <p className={`sync-state ${pending}`}>
                Save failed
              </p>
            )}
            <div className="topbar-title-row">
              {detailBackTarget && <button type="button" className="icon-button button ghost entity-back-button" aria-label="Back" title="Back" onClick={navigateBackFromDetail}><ArrowLeft aria-hidden="true" /></button>}
              {settingsBackVisible && <button type="button" className="icon-button button ghost entity-back-button" aria-label="Back to Settings" title="Back to Settings" onClick={navigateBackFromSettings}><ArrowLeft aria-hidden="true" /></button>}
              <h2 style={selectedList?.color ? { color: selectedList.color } : undefined}>
                {PageTitleIcon && <PageTitleIcon className={`mobile-page-title-icon${view === "bakery" ? " bakery-page-title-icon" : ""}`} aria-hidden="true" />}
                <span className="entity-title-text">{title}</span>
                {(selectedList || selectedProject) && (
                  <QuantifierTitleIcons
                    data={data}
                    selections={(selectedList ?? selectedProject)?.quantifierSelections}
                  />
                )}
              </h2>
            </div>
          </div>
          <div className="topbar-actions">
            <CurrencyAmount amount={data.bakery.balances.coin} className="topbar-currency" />
            {view === "trash" && (
              <TrashModeToggle mode={trashMode} setMode={setTrashMode} />
            )}
            {mobileFilterControlsAvailable && (
              <button
                type="button"
                className={`icon-button button ghost mobile-filter-toggle ${mobileFiltersOpen ? "is-open" : ""}`}
                aria-label={mobileFiltersOpen ? "Hide filters" : "Show filters"}
                aria-expanded={mobileFiltersOpen}
                aria-controls="active-view-controls"
                onClick={() => setMobileFiltersOpen((value) => !value)}
              >
                <Filter aria-hidden="true" />
              </button>
            )}
            <ApplicationMenu
              view={view}
              createMultipleListItems={
                selectedList && !selectedList.archivedAt
                  ? () => setModal({ kind: "listItem", mode: "multiple" })
                  : null
              }
              signOut={
                auth.userEmail && provider.signOut
                  ? () => void provider.signOut?.().then(setAuth)
                  : null
              }
              exportData={downloadExport}
            />
          </div>
        </header>
        {pending === "failed" && (
          <MutationRecoveryPanel
            operation={failedOperation}
            reload={() => void reloadAuthoritativeState()}
            discard={discardFailedOperation}
            retry={() => void retryFailedOperation()}
          />
        )}
        {!initialDataReady ? (
          <EmptyState>Loading...</EmptyState>
        ) : taskViewId && taskView ? (
          <TaskViewPanel
            data={data}
            viewId={taskViewId}
            result={taskView}
            preference={preference}
            filters={taskFilters}
            setFilters={setTaskFilters}
            updatePreference={updateViewPreference}
            activeTaskId={activeTaskId}
            selectTask={(task) => setActiveTaskId(task.id)}
            completeTask={completeWithRewards}
            deleteTask={deleteTaskWithUndo}
            editTask={(task) =>
              setTaskEditor({ type: "edit", taskId: task.id })
            }
            moveTask={(task) => setMoveTaskIds([task.id])}
            promoteTask={confirmPromoteTask}
            reorderTask={reorderTask}
            selectionMode={selectionMode}
            setSelectionMode={setSelectionMode}
            selectedTaskIds={selectedTaskIds}
            toggleSelected={toggleSelectedTask}
            clearSelection={clearSelection}
            runBulk={runBulk}
            openBulkMove={() => setMoveTaskIds([...selectedTaskIds])}
            selectedTasks={selectedTasks()}
          />
        ) : null}
        {initialDataReady && view === "lists" &&
          (selectedList ? (
            <ReferenceListDetail
              data={data}
              list={selectedList}
              commit={commit}
              editEntry={(entry) => openCreation("listItem", entry)}
              editList={(list) => setModal({ kind: "list", list })}
              archiveList={(list) =>
                void commit(
                  archiveListCommand(data, list.id),
                  [list.id],
                  "Archived",
                )
              }
              deleteList={confirmDeleteList}
            />
          ) : selectedListId ? (
            <UnavailableEntity title="List unavailable" browserLabel="Back to Lists" back={() => navigate("lists")} />
          ) : (
            <ListBrowser
              data={data}
              openList={(id) => {
                const route = {
                  view: "lists" as ViewId,
                  listId: id,
                  projectId: null,
                  areaId: null,
                  settingsSubsection: "home" as SettingsSubsection,
                };
                history.pushState(withInAppBack(route), "", routeToHash(route));
                setSelectedListId(id);
              }}
              editList={(list) => setModal({ kind: "list", list })}
              reorderList={(list, direction, visibleIds) =>
                void commit(
                  reorderReferenceListCommand(data, list.id, direction, visibleIds),
                  [list.id],
                  "List order changed",
                )
              }
              reorderListBefore={(list, targetList, visibleIds) =>
                void commit(
                  reorderReferenceListBeforeCommand(data, list.id, targetList.id, visibleIds),
                  [list.id, targetList.id],
                  "List order changed",
                )
              }
              archiveList={(list) =>
                void commit(
                  archiveListCommand(data, list.id),
                  [list.id],
                  "Archived",
                )
              }
              deleteList={confirmDeleteList}
            />
          ))}
        {initialDataReady && (view === "projects" || view === "areas") && (
          <ProjectsView
            mode={view}
            data={data}
            selectedProject={selectedProject}
            selectedArea={selectedArea}
            requestedProjectId={selectedProjectId}
            requestedAreaId={selectedAreaId}
            taskPreference={preference}
            taskFilters={taskFilters}
            setTaskFilters={setTaskFilters}
            updateTaskPreference={updateViewPreference}
            activeTaskId={activeTaskId}
            selectTask={(task: Task) => setActiveTaskId(task.id)}
            selectionMode={selectionMode}
            setSelectionMode={setSelectionMode}
            selectedTaskIds={selectedTaskIds}
            toggleSelected={toggleSelectedTask}
            clearSelection={clearSelection}
            runBulk={runBulk}
            openBulkMove={() => setMoveTaskIds([...selectedTaskIds])}
            moveTask={(task: Task) => setMoveTaskIds([task.id])}
            promoteTask={confirmPromoteTask}
            reorderTask={reorderTask}
            selectedTasks={selectedTasks()}
            openProject={(id: string) => {
              const route = {
                view: "projects" as ViewId,
                listId: null,
                projectId: id,
                areaId: null,
                settingsSubsection: "home" as SettingsSubsection,
              };
              history.pushState(withInAppBack(route), "", routeToHash(route));
              setSelectedProjectId(id);
              setSelectedAreaId(null);
            }}
            openArea={(id: string) => {
              const route = {
                view: "areas" as ViewId,
                listId: null,
                projectId: null,
                areaId: id,
                settingsSubsection: "home" as SettingsSubsection,
              };
              history.pushState(withInAppBack(route), "", routeToHash(route));
              setSelectedAreaId(id);
              setSelectedProjectId(null);
            }}
            back={() => {
              const route = {
                view,
                listId: null,
                projectId: null,
                areaId: null,
                settingsSubsection: "home" as SettingsSubsection,
              };
              history.pushState(route, "", routeToHash(route));
              setSelectedProjectId(null);
              setSelectedAreaId(null);
            }}
            editProject={(project: Project) =>
              setModal({ kind: "project", project })
            }
            demoteProject={confirmDemoteProject}
            editArea={(area: Area) => setModal({ kind: "area", area })}
            openList={(id: string) => {
              const route = {
                view: "lists" as ViewId,
                listId: id,
                projectId: null,
                areaId: null,
                settingsSubsection: "home" as SettingsSubsection,
              };
              history.pushState(withInAppBack(route), "", routeToHash(route));
              setView("lists");
              setSelectedListId(id);
            }}
            editList={(list: ReferenceList) => setModal({ kind: "list", list })}
            archiveList={(list: ReferenceList) =>
              void commit(
                archiveListCommand(data, list.id),
                [list.id],
                "Archived",
              )
            }
            deleteList={confirmDeleteList}
            completeProject={(project: Project) => {
              const progress = projectProgress(data, project.id);
              const run = () =>
                void commit(
                  completeProjectCommand(data, project.id).data,
                  [project.id],
                  "Project completed",
                );
              if (progress.open > 0)
                confirm({
                  title: `Complete ${project.title}`,
                  message: `${progress.open} open actionable Task${progress.open === 1 ? "" : "s"} will be marked Completed. Cancelled Tasks will stay Cancelled.`,
                  confirmLabel: "Complete Project",
                  onConfirm: run,
                });
              else run();
            }}
            reopenProject={(project: Project) =>
              void commit(
                reopenProjectCommand(data, project.id),
                [project.id],
                "Project reopened",
              )
            }
            archiveProject={(project: Project) =>
              void commit(
                archiveProjectCommand(data, project.id),
                [project.id],
                "Archived",
              )
            }
            archiveArea={(area: Area) =>
              void commit(
                archiveAreaCommand(data, area.id),
                [area.id],
                "Archived",
              )
            }
            unarchiveProject={(project: Project) =>
              void commit(
                unarchiveProjectCommand(data, project.id),
                [project.id],
                "Unarchived",
              )
            }
            deleteProject={(project: Project) => {
              const counts = projectRelationshipCounts(data, project.id);
              confirm({
                title: `Move ${project.title} to Trash`,
                message:
                  counts.taskCount || counts.listCount
                    ? `Deleting this Project will move ${counts.taskCount} Task${counts.taskCount === 1 ? "" : "s"} and ${counts.listCount} List${counts.listCount === 1 ? "" : "s"} out of it. The Project can be restored later, but these relationships will not be restored automatically.`
                    : "Move this Project to Trash?",
                confirmLabel: "Move to Trash",
                tone: "destructive",
                onConfirm: () => {
                  const deletion = deleteProjectCommand(data, project.id);
                  const affectedIds = [
                    project.id,
                    ...deletion.receipt.tasks.map((item) => item.id),
                    ...deletion.receipt.lists.map((item) => item.id),
                  ];
                  void commit(
                    deletion.data,
                    affectedIds,
                    "Moved to Trash",
                    data,
                    syncState.canonicalRevision,
                    (saved, revision) => {
                      const receipt = completionUndo.register({
                        id: `undo:project-delete:${project.id}:${Date.now()}`,
                        label: "Undo Project deletion",
                        expiresAt: Date.now() + 10000,
                        run: () =>
                          void commit(
                            undoProjectDeletionCommand(saved, deletion.receipt),
                            affectedIds,
                            "Project deletion undone",
                            saved,
                            revision,
                          ),
                      });
                      feedback.info("Project moved to Trash", {
                        scope: "route",
                        action: {
                          label: "Undo",
                          run: () => void completionUndo.execute(receipt.id),
                        },
                      });
                    },
                  );
                },
              });
            }}
            reorderProject={(project: Project, direction: -1 | 1) =>
              void commit(
                reorderProjectCommand(data, project.id, direction),
                [project.id],
                "Project order changed",
              )
            }
            reorderArea={(area: Area, direction: -1 | 1) =>
              void commit(
                reorderAreaCommand(data, area.id, direction),
                [area.id],
                "Area order changed",
              )
            }
            reorderList={(list: ReferenceList, direction: -1 | 1, visibleIds: string[]) =>
              void commit(
                reorderReferenceListCommand(data, list.id, direction, visibleIds),
                [list.id],
                "List order changed",
              )
            }
            reorderListBefore={(list: ReferenceList, targetList: ReferenceList, visibleIds: string[]) =>
              void commit(
                reorderReferenceListBeforeCommand(data, list.id, targetList.id, visibleIds),
                [list.id, targetList.id],
                "List order changed",
              )
            }
            deleteArea={(area: Area) => {
              const counts = areaReferenceCounts(data, area.id);
              confirm({
                title: `Move ${area.title} to Trash`,
                message:
                  counts.projectCount || counts.taskCount || counts.listCount
                    ? `This Area has ${counts.projectCount} Project${counts.projectCount === 1 ? "" : "s"}, ${counts.taskCount} standalone Task${counts.taskCount === 1 ? "" : "s"} and ${counts.listCount} direct List${counts.listCount === 1 ? "" : "s"}. Projects become unassigned, Tasks move to Inbox, and Lists become loose. Later Area restoration will not reclaim those relationships.`
                    : "Move this Area to Trash?",
                confirmLabel: "Move to Trash",
                tone: "destructive",
                onConfirm: () => {
                  const deletion = deleteAreaCommand(data, area.id);
                  const affectedIds = [
                    area.id,
                    ...deletion.receipt.projects.map((item) => item.id),
                    ...deletion.receipt.tasks.map((item) => item.id),
                    ...deletion.receipt.lists.map((item) => item.id),
                  ];
                  void commit(
                    deletion.data,
                    affectedIds,
                    "Area moved to Trash",
                    data,
                    syncState.canonicalRevision,
                    (saved, revision) => {
                      const receipt = completionUndo.register({
                        id: `undo:area-delete:${area.id}:${Date.now()}`,
                        label: "Undo Area deletion",
                        expiresAt: Date.now() + 10000,
                        run: () =>
                          void commit(
                            undoAreaDeletionCommand(saved, deletion.receipt),
                            affectedIds,
                            "Area deletion undone",
                            saved,
                            revision,
                          ),
                      });
                      feedback.info("Area moved to Trash", {
                        scope: "route",
                        action: {
                          label: "Undo",
                          run: () => void completionUndo.execute(receipt.id),
                        },
                      });
                    },
                  );
                },
              });
            }}
            completeTask={completeWithRewards}
            deleteTask={deleteTaskWithUndo}
            editTask={(task: Task) =>
              setTaskEditor({ type: "edit", taskId: task.id })
            }
          />
        )}
        {initialDataReady && view === "trash" && <TrashView data={data} commit={commit} mode={trashMode} setMode={setTrashMode} />}
        {initialDataReady && view === "settings" && (
          <Suspense fallback={<OptionalSurfaceFallback />}><SettingsView
            provider={provider}
            auth={auth}
            data={data}
            sync={syncState}
            mutation={mutationState}
            connection={connection}
            viewRuntime={{ activeFilterCount: Object.values(taskFilters).filter((value) => Array.isArray(value) ? value.length > 0 : value !== undefined && value !== "").length, activeTagFilterCount: taskFilters.tagIds?.length ?? 0, structuralAncestorCount: taskView?.structuralAncestorIds.length ?? 0, aggregateBulkCascadeCount: lastBulk?.cascade ?? 0, unavailableRouteStateType: selectedListId && !selectedList ? "list" : selectedProjectId && !selectedProject ? "project" : selectedAreaId && !selectedArea ? "area" : "None" }}
            section={settingsSubsection}
            setSection={setSettingsSectionRoute}
            editStatus={(status) => setModal({ kind: "status", status })}
            deleteStatus={(status) =>
              setModal({ kind: "deleteStatus", status })
            }
            reorderStatus={(status, direction) =>
              void commit(
                reorderStatusCommand(data, status.id, direction),
                [status.id],
                "Status order changed",
              )
            }
            reorderStatusRelative={(statusId, targetStatusId, placement) => {
              const next = reorderStatusRelativeCommand(data, statusId, targetStatusId, placement);
              if (next === data) return;
              void commit(next, [statusId, targetStatusId], "Status order changed");
            }}
            editPriority={(priority) =>
              setModal({ kind: "priority", priority })
            }
            reorderPriority={(priority, direction) =>
              void commit(
                reorderPriorityCommand(data, priority.id, direction),
                [priority.id],
                "Priority order changed",
              )
            }
            editTag={(tag) => setModal({ kind: "tag", tag })}
            deleteTag={(tag) => setModal({ kind: "deleteTag", tag })}
            reorderTag={(tag, direction) =>
              void commit(
                reorderTagCommand(data, tag.id, direction),
                [tag.id],
                "Tag order changed",
              )
            }
            reorderTagRelative={(tagId, targetTagId, placement) => {
              const next = reorderTagRelativeCommand(data, tagId, targetTagId, placement);
              if (next === data) return;
              void commit(next, [tagId, targetTagId], "Tag order changed");
            }}
            editTagGroup={(tagGroup) =>
              setModal({ kind: "tagGroup", tagGroup })
            }
            deleteTagGroup={(tagGroup) =>
              setModal({ kind: "deleteTagGroup", tagGroup })
            }
            reorderTagGroup={(tagGroup, direction) =>
              void commit(
                reorderTagGroupCommand(data, tagGroup.id, direction),
                [tagGroup.id],
                "Tag Group order changed",
              )
            }
            editSchedule={(mode) => setScheduleEditor(mode)}
            commit={commit}
          /></Suspense>
        )}
        {initialDataReady && view === "bakery" && (
          <Suspense fallback={<OptionalSurfaceFallback />}><BakeryView data={data} commit={commit} confirm={confirm} /></Suspense>
        )}
      </section>
      {initialDataReady && (
        <FloatingAdd
          buttonRef={addButtonRef}
          open={addOpen}
          actions={addActions}
          onToggle={() => setAddOpen((open) => !open)}
          onClose={() => setAddOpen(false)}
          onPick={(id) => openCreation(id as CreationKind)}
        />
      )}
      <MobileDock
        page={dockPage}
        direction={dockDirection}
        view={view}
        setPage={(page, direction) => {
          setDockDirection(direction);
          setDockPage(page);
        }}
        navigate={navigate}
      />
      <FeedbackHost />
      {modal && (
        <CreationModal
          modal={modal}
          data={data}
          selectedList={selectedList}
          listDefaults={listDefaults()}
          projectDefaultAreaId={selectedArea?.id ?? null}
          onClose={() => {
            setModal(null);
            addButtonRef.current?.focus();
          }}
          commit={commit}
          commitMultiline={(next, createdIds, listId) => commit(next, createdIds, `${createdIds.length} List Items added`, data, syncState.canonicalRevision, (confirmedData, revision) => {
            const createdEntries = next.referenceListEntries.filter((entry) => createdIds.includes(entry.id));
            const receipt = completionUndo.register({ id: `undo:list-items:${Date.now()}`, label: "Undo List Item creation", expiresAt: Date.now() + 10000, run: () => {
              const safe = createdEntries.every((created) => { const current = confirmedData.referenceListEntries.find((entry) => entry.id === created.id); return current && current.version === created.version && current.updatedAt === created.updatedAt && !current.deletedAt; });
              if (!safe) { feedback.warning("Newer List Item changes prevent this Undo.", { scope: "route" }); return; }
              const ids = new Set(createdIds);
              const undone = { ...confirmedData, referenceListEntries: confirmedData.referenceListEntries.filter((entry) => !ids.has(entry.id)), activity: [...confirmedData.activity, createActivity("referenceList", listId, "undo", "Undo multiline List Item creation", { originalOperation: "multiline-list-items", entryIds: createdIds }, null)] };
              void commit(undone, createdIds, "List Items removed", confirmedData, revision);
            } });
            feedback.info(`${createdIds.length} List Items added`, { scope: "route", action: { label: "Undo", run: () => void completionUndo.execute(receipt.id) } });
          })}
        />
      )}
      {taskEditor && (
        <TaskEditor
          data={data}
          mode={taskEditor}
          onClose={() => {
            setTaskEditor(null);
            addButtonRef.current?.focus();
          }}
          commit={(next, expectedIds, successMessage) => {
            const beforeSave = data;
            const editedTaskId =
              taskEditor.type === "edit" ? taskEditor.taskId : null;
            return commit(
              next,
              expectedIds,
              successMessage,
              data,
              syncState.canonicalRevision,
              (confirmedData, revision) => {
                if (!editedTaskId) return;
                const beforeTask = beforeSave.tasks.find(
                  (task) => task.id === editedTaskId,
                );
                const savedTask = confirmedData.tasks.find(
                  (task) => task.id === editedTaskId,
                );
                if (!beforeTask || !savedTask) return;
                const receipt = completionUndo.register({
                  id: `undo:task-save:${editedTaskId}:${Date.now()}`,
                  label: "Undo Task save",
                  expiresAt: Date.now() + 10000,
                  run: () => {
                    const currentTask = confirmedData.tasks.find(
                      (task) => task.id === editedTaskId,
                    );
                    if (
                      !currentTask ||
                      currentTask.version !== savedTask.version
                    ) {
                      feedback.warning(
                        "Task changed after that save, so Undo was not applied.",
                        {
                          scope: "route",
                          dedupeKey: `unsafe-undo:${editedTaskId}`,
                        },
                      );
                      return;
                    }
                    const undoData = {
                      ...confirmedData,
                      tasks: confirmedData.tasks.map((task) =>
                        task.id === editedTaskId
                          ? {
                              ...beforeTask,
                              updatedAt: nowIso(),
                              version: currentTask.version + 1,
                            }
                          : task,
                      ),
                      activity: [
                        ...confirmedData.activity,
                        createActivity(
                          "task",
                          editedTaskId,
                          "undo",
                          "Undo Task save",
                          { operation: "task-save", taskId: editedTaskId },
                          null,
                        ),
                      ],
                    };
                    void commit(
                      undoData,
                      [editedTaskId],
                      "Undo applied",
                      confirmedData,
                      revision,
                    );
                  },
                });
                feedback.info("Task save undo available", {
                  scope: "route",
                  dedupeKey: `task-save:${editedTaskId}`,
                  action: {
                    label: "Undo",
                    run: () => void completionUndo.execute(receipt.id),
                  },
                });
              },
            );
          }}
          createScheduleFromTask={(taskId) => {
            setTaskEditor(null);
            setScheduleEditor({ type: "create", sourceTaskId: taskId });
          }}
        />
      )}
      {scheduleEditor && (
        <ScheduleEditor
          data={data}
          mode={scheduleEditor}
          onClose={() => {
            setScheduleEditor(null);
            addButtonRef.current?.focus();
          }}
          commit={commit}
        />
      )}
      {moveTaskIds && (
        <TaskMoveDialog
          data={data}
          taskIds={moveTaskIds}
          onClose={() => setMoveTaskIds(null)}
          onMove={applyTaskMove}
        />
      )}
    </main>
  );
}

function completeTaskData(data: AppData, task: Task) {
  const completedStatusId =
    data.statuses.find((status) => status.category === "completed")?.id ??
    STATUS_IDS.completed;
  const cancelledStatusId =
    data.statuses.find((status) => status.category === "cancelled")?.id ??
    STATUS_IDS.cancelled;
  if (task.aggregate)
    return completeAggregate(data, task.id, completedStatusId);
  return closeSatisfiedAggregates(
    updateTaskRecord(
      data,
      task.id,
      { statusId: completedStatusId, completedAt: new Date().toISOString() },
      "completed",
      "Task completed",
    ),
    completedStatusId,
    cancelledStatusId,
  );
}

function changedTaskIds(before: AppData, after: AppData): string[] {
  return before.tasks.filter((task) => after.tasks.find((candidate) => candidate.id === task.id)?.version !== task.version).map((task) => task.id);
}

function restoreTaskSnapshots(current: AppData, before: Task[], affectedIds: string[], summary: string, originalOperation: string): AppData {
  const expected = new Map(affectedIds.map((id) => [id, current.tasks.find((task) => task.id === id)?.version]));
  if (expected.size !== affectedIds.length || [...expected.values()].some((version) => version === undefined)) throw new Error("Task tree changed after this operation, so Undo was not applied.");
  const prior = new Map(before.map((task) => [task.id, task]));
  const at = nowIso();
  return { ...current, tasks: current.tasks.map((task) => { const snapshot = prior.get(task.id); return snapshot ? { ...snapshot, updatedAt: at, version: task.version + 1 } : task; }), activity: [...current.activity, createActivity("task", affectedIds[0] ?? "tree", "undo", summary, { originalOperation, affectedTaskIds: affectedIds }, null)] };
}

export function TaskViewPanel({
  data,
  viewId,
  result,
  preference,
  filters,
  setFilters,
  updatePreference,
  activeTaskId,
  selectTask,
  completeTask,
  deleteTask,
  editTask,
  moveTask,
  promoteTask = () => undefined,
  reorderTask,
  selectionMode,
  setSelectionMode,
  selectedTaskIds,
  toggleSelected,
  clearSelection,
  runBulk,
  openBulkMove,
  selectedTasks,
}: {
  data: AppData;
  viewId: TaskViewId;
  result: TaskViewResult;
  preference: ReturnType<typeof getViewPreference>;
  filters: TaskFilters;
  setFilters: (filters: TaskFilters) => void;
  updatePreference: (
    patch: Partial<{
      sort: TaskSortField;
      grouping: TaskGroupingField;
      presentation: "compact" | "detailed";
      showClosed: boolean;
    }>,
  ) => void;
  activeTaskId: string | null;
  selectTask: (task: Task) => void;
  completeTask: (task: Task) => void;
  deleteTask: (task: Task) => void;
  editTask: (task: Task) => void;
  moveTask: (task: Task) => void;
  promoteTask?: (task: Task) => void;
  reorderTask: (
    taskId: string,
    targetId: string | null,
    direction?: -1 | 1,
  ) => void;
  selectionMode: boolean;
  setSelectionMode: (value: boolean) => void;
  selectedTaskIds: Set<string>;
  toggleSelected: (task: Task) => void;
  clearSelection: () => void;
  runBulk: (command: BulkTaskCommand) => void;
  openBulkMove: () => void;
  selectedTasks: Task[];
}) {
  const [exitingCompletedTasks, setExitingCompletedTasks] = useState<Record<string, { task: Task; sourceData: AppData; viewId: TaskViewId; sectionKey: string; sectionTitle: string; sectionIndex: number; tone?: "closed" | "deferred" }>>({});
  const completionExitTimers = useRef<Record<string, number>>({});
  const activeFilterCount = Object.values(filters).filter((value) =>
    Array.isArray(value)
      ? value.length > 0
      : value !== undefined && value !== "",
  ).length;
  const completedStatusId =
    data.statuses.find(
      (status) => status.category === "completed" && !status.deletedAt,
    )?.id ?? STATUS_IDS.completed;
  const cancelledStatusId =
    data.statuses.find(
      (status) => status.category === "cancelled" && !status.deletedAt,
    )?.id ?? STATUS_IDS.cancelled;
  const exitingCompletedTasksForView = Object.fromEntries(
    Object.entries(exitingCompletedTasks).filter(([, item]) => item.viewId === viewId),
  );
  const exitingTaskIds = new Set(Object.keys(exitingCompletedTasksForView));
  const clearExitingCompletedTask = (taskId: string) => {
    const timer = completionExitTimers.current[taskId];
    if (timer) window.clearTimeout(timer);
    delete completionExitTimers.current[taskId];
    setExitingCompletedTasks((current) => {
      if (!current[taskId]) return current;
      const next = { ...current };
      delete next[taskId];
      return next;
    });
  };
  useEffect(() => {
    return () => {
      Object.values(completionExitTimers.current).forEach((timer) =>
        window.clearTimeout(timer),
      );
      completionExitTimers.current = {};
    };
  }, []);
  useEffect(() => {
    setExitingCompletedTasks((current) => {
      let changed = false;
      const next = { ...current };
      Object.keys(next).forEach((taskId) => {
        const canonicalTask = data.tasks.find((task) => task.id === taskId);
        const sourceDataStillRendering = data === next[taskId].sourceData;
        if (!canonicalTask || (!sourceDataStillRendering && !isTaskClosed(data, canonicalTask))) {
          const timer = completionExitTimers.current[taskId];
          if (timer) window.clearTimeout(timer);
          delete completionExitTimers.current[taskId];
          delete next[taskId];
          changed = true;
        }
      });
      return changed ? next : current;
    });
  }, [data, preference.showClosed]);
  useEffect(() => {
    Object.values(completionExitTimers.current).forEach((timer) =>
      window.clearTimeout(timer),
    );
    completionExitTimers.current = {};
    setExitingCompletedTasks({});
  }, [viewId]);
  const handleCompleteTask = (task: Task) => {
    const shouldDelayHiddenRemoval =
      !task.aggregate &&
      !isTaskClosed(data, task) &&
      !reducedMotionPreferred() &&
      !exitingCompletedTasks[task.id];
    if (!shouldDelayHiddenRemoval) {
      completeTask(task);
      return;
    }
    const section = result.sections.find((candidate) =>
      candidate.tasks.some((sectionTask) => sectionTask.id === task.id),
    );
    const sectionIndex = section?.tasks.findIndex((sectionTask) => sectionTask.id === task.id) ?? 0;
    setExitingCompletedTasks((current) => ({
      ...current,
      [task.id]: {
        task: { ...task, statusId: completedStatusId },
        sourceData: data,
        viewId,
        sectionKey: section?.key ?? "completed-exit",
        sectionTitle: section?.title ?? "Tasks",
        sectionIndex,
        tone: section?.tone,
      },
    }));
    completionExitTimers.current[task.id] = window.setTimeout(
      () => clearExitingCompletedTask(task.id),
      TASK_COMPLETION_EXIT_MS,
    );
    completeTask(task);
  };
  const sectionsToRender = result.sections.map((section) => {
    const tasks = section.tasks.filter((task) => !exitingTaskIds.has(task.id));
    const exitingItems = Object.values(exitingCompletedTasksForView)
      .filter((item) => item.sectionKey === section.key)
      .sort((a, b) => a.sectionIndex - b.sectionIndex);
    if (!exitingItems.length) return tasks.length === section.tasks.length ? section : { ...section, tasks };
    const nextTasks = [...tasks];
    exitingItems.forEach((item) => {
      nextTasks.splice(Math.min(item.sectionIndex, nextTasks.length), 0, item.task);
    });
    return { ...section, tasks: nextTasks };
  }).filter((section) => section.tasks.length > 0);
  const renderedSectionKeys = new Set(sectionsToRender.map((section) => section.key));
  Object.values(exitingCompletedTasksForView).forEach((item) => {
    if (renderedSectionKeys.has(item.sectionKey)) return;
    sectionsToRender.push({
      key: item.sectionKey,
      title: item.sectionTitle,
      tone: item.tone,
      tasks: [item.task],
    });
    renderedSectionKeys.add(item.sectionKey);
  });
  const hasExitingCompletedTasks = Object.keys(exitingCompletedTasksForView).length > 0;
  const visibleHierarchyIds =
    result.visibleHierarchyIds || hasExitingCompletedTasks
      ? [
          ...new Set([
            ...(result.visibleHierarchyIds ?? []),
            ...Object.keys(exitingCompletedTasksForView),
          ]),
        ]
      : undefined;
  return (
    <section className="task-view">
      <ViewControls
        data={data}
        viewId={viewId}
        preference={preference}
        filters={filters}
        activeFilterCount={activeFilterCount}
        setFilters={setFilters}
        updatePreference={updatePreference}
      />
      {result.baseCount === 0 ? (
        <EmptyState>No Tasks here.</EmptyState>
      ) : result.filteredCount === 0 && !hasExitingCompletedTasks ? (
        <EmptyState>
          {activeFilterCount
            ? "No Tasks match these filters."
            : result.hiddenClosedCount
              ? "Only Closed Tasks match this view."
              : "No visible Tasks."}
          {activeFilterCount ? (
            <Button variant="ghost" onClick={() => setFilters({})}>
              Clear Filters
            </Button>
          ) : null}
        </EmptyState>
      ) : (
        sectionsToRender.map((section: TaskViewResult["sections"][number]) => (
          <TaskSection
            key={section.key}
            title={section.title}
            showHeading={!((viewId === "today" && section.title === "Due Today") || ((viewId === "inbox" || viewId === "tasks" || viewId === "someday") && section.title === "Tasks"))}
            data={data}
            tasks={section.tasks}
            visibleHierarchyIds={visibleHierarchyIds}
            structuralAncestorIds={result.structuralAncestorIds}
            tone={section.tone}
            presentation={preference.presentation}
            activeTaskId={activeTaskId}
            selectTask={selectTask}
            completeTask={handleCompleteTask}
            deleteTask={deleteTask}
            editTask={editTask}
            moveTask={moveTask}
            promoteTask={promoteTask}
            reorderTask={reorderTask}
            canReorder={preference.sort === "manual"}
            selectionMode={selectedTaskIds.size > 0}
            selectedTaskIds={selectedTaskIds}
            toggleSelected={toggleSelected}
            exitingTaskIds={exitingTaskIds}
          />
        ))
      )}
      {selectedTaskIds.size > 0 && (
        <BulkActionBar
          data={data}
          selectedTasks={selectedTasks}
          completedStatusId={completedStatusId}
          cancelledStatusId={cancelledStatusId}
          runBulk={runBulk}
          openBulkMove={openBulkMove}
          clearSelection={clearSelection}
        />
      )}
    </section>
  );
}

function ViewControls({
  data,
  viewId,
  preference,
  filters,
  activeFilterCount,
  setFilters,
  updatePreference,
}: {
  data: AppData;
  viewId: TaskViewId;
  preference: ReturnType<typeof getViewPreference>;
  filters: TaskFilters;
  activeFilterCount: number;
  setFilters: (filters: TaskFilters) => void;
  updatePreference: (
    patch: Partial<{
      sort: TaskSortField;
      grouping: TaskGroupingField;
      presentation: "compact" | "detailed";
      showClosed: boolean;
    }>,
  ) => void;
}) {
  const groupingOptions = groupOptionsForView(viewId);
  const [moreOpen, setMoreOpen] = useState(false);
  return (
    <div className="view-controls" id="active-view-controls">
      <label className="view-control-field" title="Sort">
        <span className="sr-only">Sort</span>
        <ArrowUpDown aria-hidden="true" />
        <select
          className="field"
          aria-label="Sort"
          value={preference.sort}
          onChange={(event) =>
            updatePreference({ sort: event.target.value as TaskSortField })
          }
        >
          <option value="default">Default</option>
          <option value="scheduledDate">Due Date</option>
          <option value="priority">Priority</option>
          <option value="manual">Manual</option>
          <option value="title">Title</option>
        </select>
      </label>
      <label className="view-control-field" title="Group">
        <span className="sr-only">Group</span>
        <Layers3 aria-hidden="true" />
        <select
          className="field"
          aria-label="Group"
          value={preference.grouping}
          onChange={(event) =>
            updatePreference({
              grouping: event.target.value as TaskGroupingField,
            })
          }
        >
          {groupingOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {activeFilterCount > 0 && (
        <Button variant="primary" className="view-clear-filters" onClick={() => setFilters({})}>
          <ListFilter aria-hidden="true" />
          Clear Filters ({activeFilterCount})
        </Button>
      )}
      <div className="view-controls__actions">
        <ShowClosedIconToggle
          checked={preference.showClosed}
          setChecked={(checked) => updatePreference({ showClosed: checked })}
          showLabel="Show Closed Tasks"
          hideLabel="Hide Closed Tasks"
        />
        <button
          type="button"
          className="button ghost view-more-toggle"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen((value) => !value)}
          title="More view controls"
        >
          <SlidersHorizontal aria-hidden="true" />
          <span>More</span>
          {moreOpen ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
        </button>
      </div>
      {moreOpen && (
        <div className="view-controls__more">
          <label className="view-control-field" title="Rows">
            <span className="sr-only">Rows</span>
            <Rows3 aria-hidden="true" />
            <select
              className="field"
              aria-label="Rows"
              value={preference.presentation}
              onChange={(event) =>
                updatePreference({
                  presentation: event.target.value as "compact" | "detailed",
                })
              }
            >
              <option value="compact">Compact</option>
              <option value="detailed">Detailed</option>
            </select>
          </label>
          <label className="view-control-field" title="Status">
            <span className="sr-only">Status</span>
            <CircleDot aria-hidden="true" />
            <select
              className="field"
              aria-label="Status"
              value={filters.statusId ?? ""}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  statusId: event.target.value || undefined,
                })
              }
            >
              <option value="">Any</option>
              {data.statuses
                .filter((status) => !status.deletedAt)
                .map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="view-control-field" title="Priority">
            <span className="sr-only">Priority</span>
            <Flag aria-hidden="true" />
            <select
              className="field"
              aria-label="Priority"
              value={filters.priorityId ?? ""}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  priorityId: event.target.value || undefined,
                })
              }
            >
              <option value="">Any</option>
              {data.priorities
                .filter((priority) => !priority.deletedAt)
                .sort((a, b) => b.rank - a.rank)
                .map((priority) => (
                  <option key={priority.id} value={priority.id}>
                    {priority.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="view-control-field" title="Due">
            <span className="sr-only">Due</span>
            <Calendar aria-hidden="true" />
            <select
              className="field"
              aria-label="Due"
              value={filters.scheduledState ?? "any"}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  scheduledState:
                    event.target.value === "any"
                      ? undefined
                      : (event.target.value as TaskFilters["scheduledState"]),
                })
              }
            >
              <option value="any">Any</option>
              <option value="undated">No Due Date</option>
              <option value="overdue">Overdue</option>
              <option value="today">Today</option>
              <option value="future">Upcoming</option>
            </select>
          </label>
          <div className="view-controls__filter-row">
            <div className="task-tag-filter">
              <Tags aria-hidden="true" />
              <SharedTagPicker
                data={data}
                scope="task"
                selectedIds={filters.tagIds ?? []}
                setSelectedIds={(tagIds) =>
                  setFilters({
                    ...filters,
                    tagIds: tagIds.length ? tagIds : undefined,
                  })
                }
                addLabel="+ Add"
                addAriaLabel="Add Tag filter"
                enforceExclusiveGroups={false}
                emptyText="No active Task tags available."
              />
            </div>
          </div>
        </div>
      )}
      <ActiveFilterChips
        data={data}
        filters={filters}
        setFilters={setFilters}
      />
    </div>
  );
}

function ShowClosedIconToggle({
  checked,
  setChecked,
  showLabel,
  hideLabel,
}: {
  checked: boolean;
  setChecked: (checked: boolean) => void;
  showLabel: string;
  hideLabel: string;
}) {
  const label = checked ? hideLabel : showLabel;
  return (
    <button
      type="button"
      className={`show-closed-toggle ${checked ? "is-on" : "is-off"}`}
      aria-pressed={checked}
      aria-label={label}
      title={label}
      onClick={() => setChecked(!checked)}
    >
      <span className={`show-closed-toggle__state ${!checked ? "is-selected" : ""}`} aria-hidden="true">
        <EyeClosed />
      </span>
      <span className={`show-closed-toggle__state ${checked ? "is-selected" : ""}`} aria-hidden="true">
        <Eye />
      </span>
    </button>
  );
}

function ActiveFilterChips({
  data,
  filters,
  setFilters,
}: {
  data: AppData;
  filters: TaskFilters;
  setFilters: (filters: TaskFilters) => void;
}) {
  const remove = (key: keyof TaskFilters, tagId?: string) =>
    setFilters(
      key === "tagIds" && tagId
        ? {
            ...filters,
            tagIds: filters.tagIds?.filter((id) => id !== tagId).length
              ? filters.tagIds.filter((id) => id !== tagId)
              : undefined,
          }
        : { ...filters, [key]: undefined },
    );
  const chips: Array<{ key: keyof TaskFilters; id?: string; label: string }> =
    [];
  if (filters.statusId)
    chips.push({
      key: "statusId",
      label: `Status: ${data.statuses.find((item) => item.id === filters.statusId)?.name ?? "Unavailable"}`,
    });
  if (filters.priorityId)
    chips.push({
      key: "priorityId",
      label: `Priority: ${data.priorities.find((item) => item.id === filters.priorityId)?.name ?? "Unavailable"}`,
    });
  if (filters.scheduledState && filters.scheduledState !== "any")
    chips.push({
      key: "scheduledState",
      label: `Due: ${filters.scheduledState}`,
    });
  if (filters.closed)
    chips.push({ key: "closed", label: `State: ${filters.closed}` });
  if (filters.deferred !== undefined)
    chips.push({
      key: "deferred",
      label: `Deferred: ${filters.deferred ? "Yes" : "No"}`,
    });
  if (filters.location)
    chips.push({ key: "location", label: `Location: ${filters.location}` });
  if (filters.areaId)
    chips.push({
      key: "areaId",
      label: `Area: ${data.areas.find((item) => item.id === filters.areaId)?.title ?? "Unavailable"}`,
    });
  if (filters.projectId)
    chips.push({
      key: "projectId",
      label: `Project: ${data.projects.find((item) => item.id === filters.projectId)?.title ?? "Unavailable"}`,
    });
  for (const id of filters.tagIds ?? [])
    chips.push({
      key: "tagIds",
      id,
      label: `Tag: ${data.tags.find((item) => item.id === id)?.name ?? "Unavailable"}`,
    });
  return chips.length ? (
    <div className="active-filter-chips" aria-label="Active filters">
      {chips.map((chip) => (
        <span
          className="filter-chip"
          key={`${chip.key}:${chip.id ?? chip.label}`}
        >
          {chip.label}
          <button
            type="button"
            aria-label={`Remove filter ${chip.label}`}
            onClick={() => remove(chip.key, chip.id)}
          >
            <X aria-hidden="true" />
          </button>
        </span>
      ))}
    </div>
  ) : null;
}

function BulkActionBar({
  data,
  selectedTasks,
  completedStatusId,
  cancelledStatusId,
  runBulk,
  openBulkMove,
  clearSelection,
}: {
  data: AppData;
  selectedTasks: Task[];
  completedStatusId: string;
  cancelledStatusId: string;
  runBulk: (command: BulkTaskCommand) => void;
  openBulkMove: () => void;
  clearSelection: () => void;
}) {
  const [tagId, setTagId] = useState("");
  const [priorityId, setPriorityId] = useState(
    data.priorities.find((priority) => !priority.deletedAt)?.id ?? "",
  );
  const [statusId, setStatusId] = useState(
    data.statuses.find((status) => !status.deletedAt)?.id ?? "",
  );
  const [date, setDate] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const [optionsFor, setOptionsFor] = useState<"reschedule" | "tags" | "status" | "priority" | null>(null);
  const selectedCount = selectedTasks.length;
  return (
    <div
      className="bulk-action-bar"
      role="region"
      aria-label="Bulk Task actions"
    >
      <div className="bulk-action-bar__summary">
        <strong>{selectedCount} selected</strong>
        <button
          type="button"
          className="icon-button button ghost"
          aria-label="Clear selection"
          onClick={clearSelection}
        >
          <X aria-hidden="true" />
        </button>
      </div>
      <div className="bulk-action-row">
        <Button variant="ghost" disabled={!selectedCount} onClick={openBulkMove}>
          Move
        </Button>
        <Button
          variant="ghost"
          onClick={() => setOptionsFor(optionsFor === "reschedule" ? null : "reschedule")}
        >
          Reschedule
        </Button>
        <Button
          variant="ghost"
          onClick={() =>
            runBulk({
              type: "complete",
              statusId: completedStatusId,
              cancelledStatusId,
            })
          }
        >
          Complete
        </Button>
        <Button
          variant="ghost"
          onClick={() =>
            runBulk({
              type: "cancel",
              statusId: cancelledStatusId,
              completedStatusId,
            })
          }
        >
          Cancel
        </Button>
        <Button variant="ghost" onClick={() => setMoreOpen((value) => !value)}>
          More
          {moreOpen ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
        </Button>
      </div>
      {moreOpen && (
        <div className="bulk-action-row bulk-action-row--more">
          <Button variant="ghost" onClick={() => setOptionsFor("tags")}>
            Add Tags
          </Button>
          <Button variant="ghost" onClick={() => setOptionsFor("tags")}>
            Remove Tags
          </Button>
          <Button variant="ghost" onClick={() => setOptionsFor("status")}>
            Change Status
          </Button>
          <Button variant="ghost" onClick={() => setOptionsFor("priority")}>
            Change Priority
          </Button>
          <Button variant="danger" onClick={() => runBulk({ type: "trash" })}>
            Move to Trash
          </Button>
        </div>
      )}
      {optionsFor === "reschedule" && (
        <div className="bulk-action-options">
          <input
            className="field"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            aria-label="Bulk Due Date"
          />
          <Button
            variant="primary"
            onClick={() =>
              runBulk({ type: "reschedule", scheduledDate: date || null })
            }
          >
            Apply Due Date
          </Button>
        </div>
      )}
      {optionsFor === "tags" && (
        <div className="bulk-action-options">
          <select
            className="field"
            aria-label="Bulk tag"
            value={tagId}
            onChange={(event) => setTagId(event.target.value)}
          >
            <option value="">Tag</option>
            {data.tags
              .filter((tag) => !tag.deletedAt && tag.allowedScopes.includes("task"))
              .map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
          </select>
          <Button
            variant="ghost"
            disabled={!tagId}
            onClick={() => runBulk({ type: "addTags", tagIds: [tagId] })}
          >
            Add Selected Tag
          </Button>
          <Button
            variant="ghost"
            disabled={!tagId}
            onClick={() => runBulk({ type: "removeTags", tagIds: [tagId] })}
          >
            Remove Selected Tag
          </Button>
        </div>
      )}
      {optionsFor === "status" && (
        <div className="bulk-action-options">
          <select
            className="field"
            aria-label="Bulk status"
            value={statusId}
            onChange={(event) => setStatusId(event.target.value)}
          >
            {data.statuses
              .filter((status) => !status.deletedAt)
              .map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
          </select>
          <Button
            variant="primary"
            onClick={() => runBulk({ type: "status", statusId })}
          >
            Apply Status
          </Button>
        </div>
      )}
      {optionsFor === "priority" && (
        <div className="bulk-action-options">
          <select
            className="field"
            aria-label="Bulk priority"
            value={priorityId}
            onChange={(event) => setPriorityId(event.target.value)}
          >
            {data.priorities
              .filter((priority) => !priority.deletedAt)
              .sort((a, b) => b.rank - a.rank)
              .map((priority) => (
                <option key={priority.id} value={priority.id}>
                  {priority.name}
                </option>
              ))}
          </select>
          <Button
            variant="primary"
            onClick={() => runBulk({ type: "priority", priorityId })}
          >
            Apply Priority
          </Button>
        </div>
      )}
    </div>
  );
}

function groupOptionsForView(
  viewId: TaskViewId,
): Array<{ value: TaskGroupingField; label: string }> {
  const all: Array<{ value: TaskGroupingField; label: string }> = [
    { value: "none", label: "None" },
    { value: "area", label: "Area" },
    { value: "project", label: "Project or location" },
    { value: "status", label: "Status" },
    { value: "priority", label: "Priority" },
    { value: "scheduledDate", label: "Due Date" },
    { value: "tag", label: "Tag" },
  ];
  if (viewId === "tasks") return all;
  const allowed: Record<TaskViewId, TaskGroupingField[]> = {
    today: ["none", "project", "status", "priority"],
    inbox: ["none", "status", "priority", "tag"],
    upcoming: ["scheduledDate", "project", "priority", "status"],
    overdue: ["scheduledDate", "project", "priority", "status"],
    someday: ["none", "status", "priority", "tag"],
    "project-detail": ["none", "status", "priority", "scheduledDate"],
    "area-detail": ["none", "project", "status", "priority", "scheduledDate"],
    tasks: ["none"],
  };
  return all.filter((option) => allowed[viewId].includes(option.value));
}

function toTaskViewId(view: ViewId): TaskViewId | null {
  if (view === "all") return "tasks";
  return ["today", "inbox", "upcoming", "overdue", "someday"].includes(view)
    ? (view as TaskViewId)
    : null;
}

interface RouteState {
  view: ViewId;
  listId: string | null;
  projectId: string | null;
  areaId: string | null;
  settingsSubsection: SettingsSubsection;
}

function parseHashRoute(): RouteState {
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  const [root, id] = parts;
  if (root === "tasks")
    return {
      view: "all",
      listId: null,
      projectId: null,
      areaId: null,
      settingsSubsection: "home",
    };
  if (root === "lists" && id)
    return {
      view: "lists",
      listId: id,
      projectId: null,
      areaId: null,
      settingsSubsection: "home",
    };
  if (root === "projects" && id)
    return {
      view: "projects",
      listId: null,
      projectId: id,
      areaId: null,
      settingsSubsection: "home",
    };
  if (root === "areas" && id)
    return {
      view: "areas",
      listId: null,
      projectId: null,
      areaId: id,
      settingsSubsection: "home",
    };
  if (root === "settings" && id)
    return {
      view: "settings",
      listId: null,
      projectId: null,
      areaId: null,
      settingsSubsection: settingsSectionFromRoute(id),
    };
  const view = navigationRegistry.some((item) => item.id === root)
    ? (root as ViewId)
    : "today";
  return {
    view,
    listId: null,
    projectId: null,
    areaId: null,
    settingsSubsection: "home",
  };
}

function isPasswordRecoveryRedirect(): boolean {
  const fragment = location.hash.replace(/^#/, "");
  if (!fragment || fragment.startsWith("/")) return false;
  return new URLSearchParams(fragment).get("type") === "recovery";
}

function routeToHash(route: RouteState): string {
  if (route.view === "all") return "#/tasks";
  if (route.view === "lists" && route.listId) return `#/lists/${route.listId}`;
  if (route.view === "projects" && route.projectId)
    return `#/projects/${route.projectId}`;
  if (route.view === "areas" && route.areaId)
    return `#/areas/${route.areaId}`;
  if (route.view === "settings" && route.settingsSubsection !== "home")
    return `#/settings/${route.settingsSubsection === "tagGroups" ? "tag-groups" : route.settingsSubsection}`;
  return `#/${route.view}`;
}

function settingsSectionFromRoute(value: string): SettingsSubsection {
  if (value === "tag-groups") return "tagGroups";
  if (
    value === "statuses" ||
    value === "priorities" ||
    value === "tags" ||
    value === "quantifiers" ||
    value === "recurrence" ||
    value === "diagnostics"
  )
    return value;
  return "home";
}

function locationValue(location: TaskLocation): string {
  if (location.type === "project") return `project:${location.projectId}`;
  if (location.type === "area") return `area:${location.areaId}`;
  return location.type;
}

function parseLocationValue(value: string): TaskLocation {
  if (value.startsWith("project:"))
    return { type: "project", projectId: value.slice("project:".length) };
  if (value.startsWith("area:"))
    return { type: "area", areaId: value.slice("area:".length) };
  return value === "someday" ? { type: "someday" } : { type: "inbox" };
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: NavigationDestination;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`nav-button ${active ? "active" : ""}`}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
    >
      <item.icon aria-hidden="true" />
      <span>{item.label}</span>
    </button>
  );
}

function ApplicationMenu({
  view,
  createMultipleListItems,
  signOut,
  exportData,
}: {
  view: ViewId;
  createMultipleListItems: (() => void) | null;
  signOut: (() => void) | null;
  exportData: () => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  function close(restoreFocus = true) {
    setOpen(false);
    if (restoreFocus) window.setTimeout(() => triggerRef.current?.focus(), 0);
  }

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: globalThis.PointerEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      )
        return;
      close(false);
    }
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) close(false);
  }, [view]);

  const choose = (action: () => void) => {
    action();
    close();
  };

  return (
    <div className="application-menu">
      <button
        ref={triggerRef}
        type="button"
        className="icon-button button ghost"
        aria-label="Open application menu"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <Menu aria-hidden="true" />
      </button>
      {open && (
        <div ref={menuRef} className="application-menu__panel" role="menu">
          <button
            type="button"
            className="application-menu__item application-menu__item--desktop"
            role="menuitem"
            onClick={() => choose(exportData)}
          >
            <Download aria-hidden="true" />
            <span>Export</span>
          </button>
          {createMultipleListItems && (
            <button
              type="button"
              className="application-menu__item"
              role="menuitem"
              onClick={() => choose(createMultipleListItems)}
            >
              <FileStack aria-hidden="true" />
              <span>Multiple</span>
            </button>
          )}
          {signOut && (
            <button
              type="button"
              className="application-menu__item"
              role="menuitem"
              onClick={() => choose(signOut)}
            >
              <LogOut aria-hidden="true" />
              <span>Sign out</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MutationRecoveryPanel({
  operation,
  retry,
  discard,
  reload,
}: {
  operation: MutationOperation | null;
  retry: () => void;
  discard: () => void;
  reload: () => void;
}) {
  const conflicted = operation?.state === "conflicted";
  return (
    <div className="status-line failed mutation-recovery">
      <div>
        <strong>
          {conflicted ? "A newer saved version exists." : "Save failed."}
        </strong>
        <span>
          {conflicted
            ? " Your attempted change was not saved, and current server data was not overwritten."
            : " The local change is still visible but has not been confirmed."}
        </span>
      </div>
      <div className="status-actions">
        {!conflicted && operation?.recoveryActions.includes("retry") && (
          <Button variant="ghost" onClick={retry}>
            Retry
          </Button>
        )}
        {operation?.recoveryActions.includes("discard") && (
          <Button variant="ghost" onClick={discard}>
            Discard my unsaved change
          </Button>
        )}
        <Button variant="primary" onClick={reload}>
          Reload current version
        </Button>
      </div>
    </div>
  );
}

function MobileDock({
  page,
  direction,
  view,
  setPage,
  navigate,
}: {
  page: number;
  direction: "left" | "right";
  view: ViewId;
  setPage: (page: number, direction: "left" | "right") => void;
  navigate: (view: ViewId) => void;
}) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const [transition, setTransition] = useState<{
    from: number;
    to: number;
    direction: "left" | "right";
    active: boolean;
  }>({ from: page, to: page, direction, active: false });
  useEffect(() => {
    if (page === transition.to) return;
    setTransition({ from: transition.to, to: page, direction, active: true });
    const timeout = window.setTimeout(
      () =>
        setTransition((current) => ({
          ...current,
          from: current.to,
          active: false,
        })),
      300,
    );
    return () => window.clearTimeout(timeout);
  }, [page, direction, transition.to]);
  function end(event: PointerEvent) {
    if (!start.current) return;
    const dx = event.clientX - start.current.x;
    const dy = event.clientY - start.current.y;
    start.current = null;
    if (Math.abs(dx) < 46 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    setPage(page === 0 ? 1 : 0, dx < 0 ? "left" : "right");
  }
  return (
    <nav
      className={`mobile-dock slide-${direction}`}
      aria-label="Mobile primary"
      onPointerDown={(event) => {
        start.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={end}
      onPointerCancel={() => {
        start.current = null;
      }}
    >
      <div className="mobile-dock__viewport">
        {transition.active && (
          <DockPage
            page={transition.from}
            phase="exit"
            direction={transition.direction}
            view={view}
            navigate={navigate}
          />
        )}
        <DockPage
          page={transition.to}
          phase={transition.active ? "enter" : "current"}
          direction={transition.direction}
          view={view}
          navigate={navigate}
        />
      </div>
      <div className="dock-indicator" aria-hidden="true">
        <span className={page === 0 ? "active" : ""} />
        <span className={page === 1 ? "active" : ""} />
      </div>
    </nav>
  );
}

function DockPage({
  page,
  phase,
  direction,
  view,
  navigate,
}: {
  page: number;
  phase: "current" | "enter" | "exit";
  direction: "left" | "right";
  view: ViewId;
  navigate: (view: ViewId) => void;
}) {
  return (
    <div className={`mobile-dock__page ${phase} ${direction}`}>
      {mobileDock[page].map((item) => (
        <NavButton
          key={item.id}
          item={item}
          active={view === item.id}
          onClick={() => navigate(item.id)}
        />
      ))}
    </div>
  );
}

function FloatingAdd({
  buttonRef,
  open,
  actions,
  onToggle,
  onClose,
  onPick,
}: {
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  open: boolean;
  actions: AddActionDefinition[];
  onToggle: () => void;
  onClose: () => void;
  onPick: (id: AddActionId) => void;
}) {
  if (actions.length === 0) return null;
  return (
    <div className="fab-wrap">
      {open && (
        <button
          className="fab-scrim"
          aria-label="Close add menu"
          onClick={onClose}
        />
      )}
      {open && (
        <div className="fab-menu open">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              className="fab-menu__item"
              aria-label={action.accessibleName}
              onClick={() => onPick(action.id)}
            >
              <action.icon aria-hidden="true" />
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}
      <button
        ref={buttonRef}
        type="button"
        className="fab"
        aria-label="Add"
        aria-expanded={open}
        onClick={onToggle}
      >
        <Plus aria-hidden="true" />
      </button>
    </div>
  );
}

function CreationModal({
  modal,
  data,
  selectedList,
  listDefaults,
  projectDefaultAreaId,
  onClose,
  commit,
  commitMultiline,
}: {
  modal: ModalState;
  data: AppData;
  selectedList: ReferenceList | null;
  listDefaults: Pick<ReferenceList, "location" | "areaId" | "projectId">;
  projectDefaultAreaId: string | null;
  onClose: () => void;
  commit: (
    next: AppData,
    expectedIds?: string[],
    successMessage?: string,
  ) => Promise<boolean>;
  commitMultiline: (next: AppData, createdIds: string[], listId: string) => Promise<boolean>;
}) {
  const editingStatus = modal?.kind === "status" ? modal.status : null;
  const editingPriority = modal?.kind === "priority" ? modal.priority : null;
  const editingTag = modal?.kind === "tag" ? modal.tag : null;
  const editingTagGroup = modal?.kind === "tagGroup" ? modal.tagGroup : null;
  const deletingStatus = modal?.kind === "deleteStatus" ? modal.status : null;
  const editingList = modal?.kind === "list" ? modal.list : null;
  const editingProject = modal?.kind === "project" ? modal.project : null;
  const editingArea = modal?.kind === "area" ? modal.area : null;
  const [title, setTitle] = useState(
    modal?.kind === "listItem"
      ? (modal.entry?.text ?? "")
      : (editingStatus?.name ??
          editingPriority?.name ??
          editingTag?.name ??
          editingTagGroup?.name ??
          editingList?.title ??
          editingProject?.title ??
          editingArea?.title ??
          ""),
  );
  const [link, setLink] = useState(
    modal?.kind === "listItem" ? (modal.entry?.link ?? "") : "",
  );
  const [listItemMode, setListItemMode] = useState<"single" | "multiple">(
    modal?.kind === "listItem" ? (modal.mode ?? "single") : "single",
  );
  const [multilineItems, setMultilineItems] = useState("");
  const [listColor, setListColor] = useState(editingList?.color ?? "");
  const [listLocation, setListLocation] = useState<ReferenceListLocation>(
    editingList?.location ?? listDefaults.location,
  );
  const [listTagIds, setListTagIds] = useState<string[]>(
    editingList?.tagIds ?? [],
  );
  const [listQuantifierSelections, setListQuantifierSelections] = useState(
    editingList?.quantifierSelections ?? {},
  );
  const [projectDescription, setProjectDescription] = useState(
    editingProject?.description ?? "",
  );
  const [projectAreaId, setProjectAreaId] = useState(
    editingProject?.areaId ?? projectDefaultAreaId,
  );
  const [projectStatusId, setProjectStatusId] = useState(
    editingProject?.statusId ?? defaultStatusId(data),
  );
  const [projectColor] = useState(
    editingProject?.color ?? "var(--palette-aqua-light)",
  );
  const [projectEditorTagIds, setProjectEditorTagIds] = useState<string[]>(
    editingProject?.tagIds ?? [],
  );
  const [projectQuantifierSelections, setProjectQuantifierSelections] = useState(
    editingProject?.quantifierSelections ?? {},
  );
  const [areaDescription, setAreaDescription] = useState(
    editingArea?.description ?? "",
  );
  const [areaColor, setAreaColor] = useState(
    editingArea?.color ?? "var(--palette-aqua-dark)",
  );
  const statusColoursInUse = data.statuses.filter((status) => !status.deletedAt && status.id !== editingStatus?.id).map((status) => status.color);
  const statusIconsInUse = data.statuses.filter((status) => !status.deletedAt && status.id !== editingStatus?.id).map((status) => status.icon);
  const [statusColor, setStatusColor] = useState(
    editingStatus?.color ?? paletteOptions.find((option) => !statusColoursInUse.includes(option.value))?.value ?? paletteOptions[0].value,
  );
  const [statusIcon, setStatusIcon] = useState(
    editingStatus?.icon ?? STATUS_ICON_OPTIONS.find((icon) => !statusIconsInUse.includes(icon)) ?? STATUS_ICON_OPTIONS[0],
  );
  const [statusCategory, setStatusCategory] = useState<Status["category"]>(
    editingStatus?.category ?? "active",
  );
  const [makeDefault, setMakeDefault] = useState(
    editingStatus
      ? editingStatus.id ===
          data.statuses
            .filter(
              (status) => !status.deletedAt && status.category === "active",
            )
            .sort((a, b) => a.order - b.order)[0]?.id
      : false,
  );
  const [priorityColor, setPriorityColor] = useState(
    editingPriority?.color ?? "var(--palette-aqua-dark)",
  );
  const [priorityDefault, setPriorityDefault] = useState(
    editingPriority
      ? editingPriority.id === data.settings.defaultPriorityId
      : false,
  );
  const [tagDescription, setTagDescription] = useState(
    editingTag?.description ?? "",
  );
  const [tagColor, setTagColor] = useState(
    editingTag?.color ?? "var(--palette-aqua-light)",
  );
  const [tagScopes, setTagScopes] = useState<TagScope[]>(
    editingTag?.allowedScopes ?? DEFAULT_TAG_SCOPES,
  );
  const [tagGroupId, setTagGroupId] = useState(editingTag?.tagGroupId ?? "");
  const [tagGroupDescription, setTagGroupDescription] = useState(
    editingTagGroup?.description ?? "",
  );
  const [tagGroupColor, setTagGroupColor] = useState(
    editingTagGroup?.color ?? "var(--palette-aqua-light)",
  );
  const [tagGroupExclusive, setTagGroupExclusive] = useState(
    editingTagGroup?.mutuallyExclusive ?? false,
  );
  const [projectTagIds, setProjectTagIds] = useState(
    modal?.kind === "projectTags" ? modal.project.tagIds : [],
  );
  const [replacementStatusId, setReplacementStatusId] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [titleTouched, setTitleTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const linkValidation = safeHttpUrl(link);
  const invalidLink =
    modal?.kind === "listItem" &&
    listItemMode === "single" &&
    !linkValidation.valid
      ? linkValidation.message
      : "";
  const multilineCount = multilineItems
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean).length;
  if (!modal) return null;
  const activeModal = modal;
  const currentStatuses = activeStatuses(data);
  const affected = deletingStatus
    ? affectedTasksForStatus(data, deletingStatus.id)
    : [];
  const affectedProjects = deletingStatus ? data.projects.filter((project) => project.statusId === deletingStatus.id) : [];
  const isDefaultDelete = deletingStatus
    ? data.statuses
        .filter((status) => !status.deletedAt && status.category === "active")
        .sort((a, b) => a.order - b.order)[0]?.id === deletingStatus.id
    : false;
  const replacementOptions = deletingStatus
    ? currentStatuses.filter((status) => status.id !== deletingStatus.id)
    : [];
  const replacementRequired = Boolean(
    deletingStatus && (affected.length > 0 || affectedProjects.length > 0 || isDefaultDelete),
  );
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (
      (!["deleteStatus", "deleteTag", "deleteTagGroup", "projectTags"].includes(
        activeModal.kind,
      ) &&
        !title.trim() &&
        !(
          activeModal.kind === "listItem" &&
          listItemMode === "multiple" &&
          multilineCount > 0
        )) ||
      invalidLink ||
      submitting ||
      (replacementRequired && !replacementStatusId)
    )
      return;
    setSubmitting(true);
    setFormError("");
    try {
      if (activeModal.kind === "list") {
        const next = activeModal.list
          ? updateReferenceListCommand(data, activeModal.list.id, {
              title,
              location: listLocation,
              tagIds: listTagIds,
              quantifierSelections: listQuantifierSelections,
              color: listColor || null,
              icon: activeModal.list.icon ?? "list-ordered",
            })
          : createReferenceListCommand(data, {
              title,
              location: listLocation,
              tagIds: listTagIds,
              quantifierSelections: listQuantifierSelections,
              color: listColor || null,
              icon: "list-ordered",
            });
        const saved = await commit(
          next,
          activeModal.list ? [activeModal.list.id] : [],
          activeModal.list ? "List saved" : "List created",
        );
        if (!saved) return;
      }
      if (activeModal.kind === "project") {
        const next = activeModal.project
          ? updateProjectCommand(data, activeModal.project.id, {
              title,
              description: projectDescription,
              areaId: projectAreaId,
              statusId: projectStatusId,
              color: projectColor,
              icon: activeModal.project.icon ?? "folder",
              tagIds: projectEditorTagIds,
              quantifierSelections: projectQuantifierSelections,
            })
          : createProjectCommand(data, {
              title,
              description: projectDescription,
              areaId: projectAreaId,
              statusId: projectStatusId,
              color: projectColor,
              icon: "folder",
              tagIds: projectEditorTagIds,
              quantifierSelections: projectQuantifierSelections,
            });
        const saved = await commit(
          next,
          activeModal.project ? [activeModal.project.id] : [],
          activeModal.project ? "Project saved" : "Project created",
        );
        if (!saved) return;
      }
      if (activeModal.kind === "area") {
        const next = activeModal.area
          ? updateAreaCommand(data, activeModal.area.id, {
              title,
              description: areaDescription,
              color: areaColor,
              icon: activeModal.area.icon ?? "folder",
            })
          : createAreaCommand(data, {
              title,
              description: areaDescription,
              color: areaColor,
              icon: "folder",
            });
        const saved = await commit(
          next,
          activeModal.area ? [activeModal.area.id] : [],
          activeModal.area ? "Area saved" : "Area created",
        );
        if (!saved) return;
      }
      if (activeModal.kind === "listItem" && selectedList) {
        const next =
          !activeModal.entry && listItemMode === "multiple"
            ? addReferenceEntries(data, selectedList.id, multilineItems)
            : activeModal.entry
              ? updateReferenceEntry(data, activeModal.entry.id, title, link)
              : createReferenceEntry(data, selectedList.id, title, link);
        const createdIds = next.referenceListEntries
          .filter(
            (entry) =>
              !data.referenceListEntries.some(
                (existing) => existing.id === entry.id,
              ),
          )
          .map((entry) => entry.id);
        if (!activeModal.entry && listItemMode === "multiple" && createdIds.length > 1) {
          const saved = await commitMultiline(next, createdIds, selectedList.id);
          if (!saved) return;
          onClose();
          return;
        }
        const saved = await commit(
          next,
          activeModal.entry
            ? [activeModal.entry.id]
            : createdIds.length
              ? createdIds
              : [selectedList.id],
          activeModal.entry
            ? "List item updated"
            : createdIds.length > 1
              ? `${createdIds.length} List Items added`
              : "List item added",
        );
        if (!saved) return;
      }
      if (activeModal.kind === "status") {
        const next = activeModal.status
          ? updateStatusCommand(data, activeModal.status.id, {
              name: title,
              color: statusColor,
              icon: statusIcon,
              category: statusCategory,
              makeDefault,
            })
          : createStatusCommand(data, {
              name: title,
              color: statusColor,
              icon: statusIcon,
              category: statusCategory,
              makeDefault,
            });
        const saved = await commit(
          next,
          activeModal.status ? [activeModal.status.id] : [],
          activeModal.status ? "Status saved" : "Status created",
        );
        if (!saved) return;
      }
      if (activeModal.kind === "priority") {
        const saved = await commit(
          updatePriorityCommand(data, activeModal.priority.id, {
            name: title,
            color: priorityColor,
            icon: activeModal.priority.icon ?? "minus",
            makeDefault: priorityDefault,
          }),
          [activeModal.priority.id],
          "Priority saved",
        );
        if (!saved) return;
      }
      if (activeModal.kind === "tag") {
        const next = activeModal.tag
          ? updateTagCommand(data, activeModal.tag.id, {
              name: title,
              description: tagDescription,
              color: tagColor,
              allowedScopes: tagScopes,
              tagGroupId: tagGroupId || null,
            })
          : createTagCommand(data, {
              name: title,
              description: tagDescription,
              color: tagColor,
              allowedScopes: tagScopes,
              tagGroupId: tagGroupId || null,
            });
        const saved = await commit(
          next,
          activeModal.tag ? [activeModal.tag.id] : [],
          activeModal.tag ? "Tag saved" : "Tag created",
        );
        if (!saved) return;
      }
      if (activeModal.kind === "tagGroup") {
        const next = activeModal.tagGroup
          ? updateTagGroupCommand(data, activeModal.tagGroup.id, {
              name: title,
              description: tagGroupDescription,
              color: tagGroupColor,
              mutuallyExclusive: tagGroupExclusive,
              inherited: activeModal.tagGroup.inherited,
            })
          : createTagGroupCommand(data, {
              name: title,
              description: tagGroupDescription,
              color: tagGroupColor,
              mutuallyExclusive: tagGroupExclusive,
            });
        const saved = await commit(
          next,
          activeModal.tagGroup ? [activeModal.tagGroup.id] : [],
          activeModal.tagGroup ? "Tag Group saved" : "Tag Group created",
        );
        if (!saved) return;
      }
      if (activeModal.kind === "projectTags") {
        const project = activeModal.project;
        const updated = {
          ...project,
          tagIds: projectTagIds,
          updatedAt: new Date().toISOString(),
          version: project.version + 1,
        };
        const saved = await commit(
          {
            ...data,
            projects: data.projects.map((candidate) =>
              candidate.id === project.id ? updated : candidate,
            ),
            activity: [
              ...data.activity,
              createActivity(
                "project",
                project.id,
                "tagsChanged",
                "Project tags changed",
                project.tagIds,
                projectTagIds,
              ),
            ],
          },
          [project.id],
          "Project tags saved",
        );
        if (!saved) return;
      }
      if (activeModal.kind === "deleteStatus") {
        const saved = await commit(
          deleteStatusCommand(
            data,
            activeModal.status.id,
            replacementStatusId || undefined,
          ),
          [activeModal.status.id, replacementStatusId].filter(Boolean),
          "Status deleted",
        );
        if (!saved) return;
      }
      if (activeModal.kind === "deleteTag") {
        const saved = await commit(
          deleteTagCommand(data, activeModal.tag.id),
          [activeModal.tag.id],
          "Tag deleted",
        );
        if (!saved) return;
      }
      if (activeModal.kind === "deleteTagGroup") {
        const saved = await commit(
          deleteTagGroupCommand(data, activeModal.tagGroup.id),
          [activeModal.tagGroup.id],
          "Tag Group deleted",
        );
        if (!saved) return;
      }
      onClose();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Could not save Status.",
      );
    } finally {
      setSubmitting(false);
    }
  }
  const safeClose = () => {
    if (!submitting) onClose();
  };
  if (activeModal.kind === "deleteStatus")
    return (
      <Modal
        title={`Delete ${activeModal.status.name}`}
        onClose={safeClose}
        closeDisabled={submitting}
      >
        <form onSubmit={submit} className="status-form">
          <p className="inline-note">
            {affected.length === 0 && affectedProjects.length === 0
              ? "This Status is unused. It will be moved to Trash."
              : `${affected.length} Task${affected.length === 1 ? "" : "s"} and ${affectedProjects.length} Project${affectedProjects.length === 1 ? "" : "s"} currently use this Status. They will be changed before the Status is moved to Trash.`}
          </p>
          {isDefaultDelete && (
            <p className="inline-warning">
              This is the default open Status. Choose another Status to become
              the default.
            </p>
          )}
          {replacementRequired && (
            <label className="form-row">
              <span>
                {affected.length > 0 || affectedProjects.length > 0
                  ? "Replacement Status"
                  : "New default Status"}
              </span>
              <select
                className="field"
                value={replacementStatusId}
                onChange={(event) => setReplacementStatusId(event.target.value)}
              >
                <option value="">Choose Status</option>
                {replacementOptions.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {formError && <em className="field-error">{formError}</em>}
          <div className="modal-actions">
            <Button
              type="button"
              variant="ghost"
              onClick={safeClose}
              disabled={submitting}
            >
              <X aria-hidden="true" />
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={
                submitting || (replacementRequired && !replacementStatusId)
              }
            >
              {submitting ? "Deleting..." : "Delete Status"}
            </Button>
          </div>
        </form>
      </Modal>
    );
  if (activeModal.kind === "deleteTag")
    return (
      <Modal
        title={`Delete ${activeModal.tag.name}`}
        onClose={safeClose}
        closeDisabled={submitting}
      >
        <form onSubmit={submit} className="status-form">
          <p className="inline-note">
            This Tag will be moved to Trash and removed from every assigned
            Task, Project and List.
          </p>
          {formError && <em className="field-error">{formError}</em>}
          <div className="modal-actions">
            <Button
              type="button"
              variant="ghost"
              onClick={safeClose}
              disabled={submitting}
            >
              <X aria-hidden="true" />
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={submitting}>
              {submitting ? "Deleting..." : "Delete Tag"}
            </Button>
          </div>
        </form>
      </Modal>
    );
  if (activeModal.kind === "deleteTagGroup")
    return (
      <Modal
        title={`Delete ${activeModal.tagGroup.name}`}
        onClose={safeClose}
        closeDisabled={submitting}
      >
        <form onSubmit={submit} className="status-form">
          <p className="inline-note">
            {
              data.tags.filter(
                (tag) =>
                  !tag.deletedAt && tag.tagGroupId === activeModal.tagGroup.id,
              ).length
            }{" "}
            Tag(s) will become ungrouped. Existing entity Tag assignments are
            preserved.
          </p>
          {formError && <em className="field-error">{formError}</em>}
          <div className="modal-actions">
            <Button
              type="button"
              variant="ghost"
              onClick={safeClose}
              disabled={submitting}
            >
              <X aria-hidden="true" />
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={submitting}>
              {submitting ? "Deleting..." : "Delete Tag Group"}
            </Button>
          </div>
        </form>
      </Modal>
    );
  if (activeModal.kind === "projectTags")
    return (
      <Modal
        title={`Edit tags for ${activeModal.project.title}`}
        onClose={safeClose}
        closeDisabled={submitting}
      >
        <form onSubmit={submit} className="status-form">
          <SharedTagPicker
            data={data}
            scope="project"
            selectedIds={projectTagIds}
            setSelectedIds={setProjectTagIds}
            emptyText="No Project tags available."
          />
          {formError && <em className="field-error">{formError}</em>}
          <div className="modal-actions">
            <Button
              type="button"
              variant="ghost"
              onClick={safeClose}
              disabled={submitting}
            >
              <X aria-hidden="true" />
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              <Save aria-hidden="true" />
              Save Tags
            </Button>
          </div>
        </form>
      </Modal>
    );
  const modalTitle =
    activeModal.kind === "status"
      ? activeModal.status
        ? "Edit Status"
        : "New Status"
      : activeModal.kind === "priority"
        ? "Edit Priority"
        : activeModal.kind === "tag"
          ? activeModal.tag
            ? "Edit Tag"
            : "New Tag"
          : activeModal.kind === "tagGroup"
            ? activeModal.tagGroup
              ? "Edit Tag Group"
              : "New Tag Group"
            : activeModal.kind === "list"
              ? activeModal.list
                ? "Edit List"
                : "New List"
              : activeModal.kind === "project"
                ? activeModal.project
                  ? "Edit Project"
                  : "New Project"
                : activeModal.kind === "area"
                  ? activeModal.area
                    ? "Edit Area"
                    : "New Area"
                  : activeModal.kind === "listItem" && activeModal.entry
                    ? "Edit List Item"
                    : "New List Item";
  return (
    <Modal
      title={modalTitle}
      onClose={safeClose}
      closeDisabled={submitting}
      initialFocusRef={inputRef}
    >
      <form onSubmit={submit} className={`modal-form ${activeModal.kind === "list" ? "modal-form--list" : ""}`}>
        {activeModal.kind !== "listItem" ||
        activeModal.entry ||
        listItemMode === "single" ? (
          <label className="form-row">
            <span>
              {activeModal.kind === "listItem"
                ? "Text"
                : activeModal.kind === "status"
                  ? "Status name"
                  : activeModal.kind === "priority"
                    ? "Priority name"
                    : activeModal.kind === "tag"
                      ? "Tag name"
                      : activeModal.kind === "tagGroup"
                        ? "Tag Group name"
                        : activeModal.kind === "list"
                          ? "List title"
                          : activeModal.kind === "project"
                            ? "Project title"
                            : activeModal.kind === "area"
                              ? "Area title"
                              : "Title"}
            </span>
            <input
              ref={inputRef}
              className="field"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onBlur={() => setTitleTouched(true)}
            />
            {activeModal.kind === "list" && titleTouched && !title.trim() && (
              <em className="field-error">List title is required.</em>
            )}
          </label>
        ) : (
          <label className="form-row">
            <span>Items</span>
            <textarea
              className="field multiline-items"
              value={multilineItems}
              onChange={(event) => setMultilineItems(event.target.value)}
              placeholder="One List Item per line"
            />
            <div className="multiline-items-meta">
              <small>
                {multilineCount} Item{multilineCount === 1 ? "" : "s"} will be
                created.
              </small>
              <small>Format: "Name of item(https://url)"</small>
            </div>
            {multilineCount === 0 && (
              <em className="field-error">Enter at least one List Item.</em>
            )}
          </label>
        )}
        {activeModal.kind === "listItem" &&
          (activeModal.entry || listItemMode === "single") && (
            <label className="form-row">
              <span>Link</span>
              <input
                className="field"
                value={link}
                onChange={(event) => setLink(event.target.value)}
                placeholder="https://example.com"
              />
              {invalidLink && <em className="field-error">{invalidLink}</em>}
            </label>
          )}
        {activeModal.kind === "list" && (
          <>
            <ListLocationSelector
              data={data}
              value={listLocation}
              setValue={setListLocation}
              currentList={activeModal.list ?? null}
            />
            <QuantifierFields data={data} value={listQuantifierSelections} onChange={setListQuantifierSelections} />
            <SharedTagPicker
              data={data}
              scope="referenceList"
              selectedIds={listTagIds}
              setSelectedIds={setListTagIds}
              emptyText="No List tags available."
            />
            <ListAppearancePicker
              color={listColor}
              setColor={setListColor}
            />
          </>
        )}
        {activeModal.kind === "status" && (
          <StatusAppearancePicker
            color={statusColor}
            icon={statusIcon}
            category={statusCategory}
            makeDefault={makeDefault}
            setColor={setStatusColor}
            setIcon={setStatusIcon}
            excludedColors={statusColoursInUse}
            excludedIcons={statusIconsInUse}
            setCategory={(category) => {
              setStatusCategory(category);
              if (category !== "active") setMakeDefault(false);
            }}
            setMakeDefault={setMakeDefault}
          />
        )}
        {activeModal.kind === "project" && (
          <>
            <label className="form-row">
              <span>Description</span>
              <textarea
                className="field"
                value={projectDescription}
                onChange={(event) => setProjectDescription(event.target.value)}
              />
            </label>
            <div className="form-row-columns">
              <label className="form-row">
                <span>Area</span>
                <select
                  className="field"
                  style={projectAreaId ? { color: data.areas.find((area) => area.id === projectAreaId)?.color } : undefined}
                  value={projectAreaId ?? ""}
                  onChange={(event) => setProjectAreaId(event.target.value || null)}
                >
                  <option value="">Unassigned</option>
                  {activeOrderedAreas(data).map((area) => (
                    <option key={area.id} value={area.id} style={area.color ? { color: area.color } : undefined}>{area.title}</option>
                  ))}
                </select>
              </label>
              <label className="form-row">
                <span>Status</span>
                <select className="field" style={{ color: data.statuses.find((status) => status.id === projectStatusId)?.color }} value={projectStatusId} onChange={(event) => setProjectStatusId(event.target.value)}>
                  {activeStatuses(data).map((status) => <option key={status.id} value={status.id} style={{ color: status.color }}>{status.name}</option>)}
                </select>
              </label>
            </div>
            <QuantifierFields data={data} value={projectQuantifierSelections} onChange={setProjectQuantifierSelections} />
            <SharedTagPicker
              data={data}
              scope="project"
              selectedIds={projectEditorTagIds}
              setSelectedIds={setProjectEditorTagIds}
              emptyText="No Project tags available."
            />
          </>
        )}
        {activeModal.kind === "area" && (
          <>
            <label className="form-row">
              <span>Description</span>
              <textarea
                className="field"
                value={areaDescription}
                onChange={(event) => setAreaDescription(event.target.value)}
              />
            </label>
            <ColourPicker
              label="Area colour"
              value={areaColor}
              onChange={setAreaColor}
            />
          </>
        )}
        {activeModal.kind === "priority" && (
          <fieldset className="appearance-picker">
            <legend>Priority configuration</legend>
            <ColourPicker
              label="Priority colour"
              value={priorityColor}
              onChange={setPriorityColor}
            />
            <CircleCheckbox checked={priorityDefault} onChange={setPriorityDefault}>Use as default Priority</CircleCheckbox>
          </fieldset>
        )}
        {activeModal.kind === "tag" && (
          <fieldset className="tag-editor-fields">
            <legend className="sr-only">Tag fields</legend>
            <label className="form-row">
              <span>Description</span>
              <textarea
                className="field"
                value={tagDescription}
                onChange={(event) => setTagDescription(event.target.value)}
              />
            </label>
            {!tagGroupId && (
              <ColourPicker
                label="Colour"
                value={tagColor}
                onChange={setTagColor}
              />
            )}
            <ScopeSelector value={tagScopes} onChange={setTagScopes} />
            <label className="form-row">
              <span>Group</span>
              <select
                className="field"
                value={tagGroupId}
                onChange={(event) => setTagGroupId(event.target.value)}
              >
                <option value="">Loose</option>
                {data.tagGroups
                  .filter((group) => !group.deletedAt)
                  .sort((a, b) => a.order - b.order)
                  .map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
              </select>
            </label>
          </fieldset>
        )}
        {activeModal.kind === "tagGroup" && (
          <fieldset className="tag-editor-fields">
            <legend className="sr-only">Tag Group fields</legend>
            <label className="form-row">
              <span>Description</span>
              <textarea
                className="field"
                value={tagGroupDescription}
                onChange={(event) => setTagGroupDescription(event.target.value)}
              />
            </label>
            <ColourPicker
              label="Colour"
              value={tagGroupColor}
              onChange={setTagGroupColor}
            />
            <CircleCheckbox checked={tagGroupExclusive} onChange={setTagGroupExclusive}>Mutually exclusive</CircleCheckbox>
          </fieldset>
        )}
        {formError && <em className="field-error">{formError}</em>}
        {activeModal.kind === "list" && activeModal.list && (
          <ActivityHistory
            data={data}
            entityKind="referenceList"
            entityId={activeModal.list.id}
          />
        )}
        {activeModal.kind === "project" && activeModal.project && (
          <ActivityHistory
            data={data}
            entityKind="project"
            entityId={activeModal.project.id}
          />
        )}
        {activeModal.kind === "area" && activeModal.area && (
          <ActivityHistory
            data={data}
            entityKind="area"
            entityId={activeModal.area.id}
          />
        )}
        <div className="modal-actions">
          <Button
            type="button"
            variant="ghost"
            onClick={safeClose}
            disabled={submitting}
          >
            <X aria-hidden="true" />
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={
              Boolean(invalidLink) ||
              submitting ||
              (activeModal.kind === "listItem" && listItemMode === "multiple"
                ? multilineCount === 0
                : !title.trim())
            }
          >
            <Save aria-hidden="true" />
            {submitting
              ? "Saving..."
              : activeModal.kind === "list" && activeModal.list
                ? "Save Changes"
                : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function ListLocationSelector({
  data,
  value,
  setValue,
  currentList,
}: {
  data: AppData;
  value: ReferenceListLocation;
  setValue: (value: ReferenceListLocation) => void;
  currentList: ReferenceList | null;
}) {
  const activeAreas = data.areas
    .filter((area) => !area.deletedAt && !area.archivedAt)
    .sort((a, b) => a.title.localeCompare(b.title));
  const activeProjects = data.projects
    .filter(
      (project) =>
        !project.deletedAt && !project.archivedAt && statusCategory(data, project.statusId) === "active",
    )
    .sort((a, b) => a.title.localeCompare(b.title));
  let currentProject: Project | null = null;
  if (currentList?.location.type === "project") {
    const projectId = currentList.location.projectId;
    currentProject =
      data.projects.find((project) => project.id === projectId) ?? null;
  }
  const projects =
    currentProject &&
    currentProject.archivedAt &&
    !activeProjects.some((project) => project.id === currentProject.id)
      ? [currentProject, ...activeProjects]
      : activeProjects;
  const [projectText, setProjectText] = useState(() => value.type === "project" ? projects.find((project) => project.id === value.projectId)?.title ?? "" : "");
  return (
    <fieldset className="location-picker">
      <legend>Location</legend>
      <div
        className="segmented-control"
        role="radiogroup"
        aria-label="List location"
      >
        <button
          type="button"
          className={value.type === "loose" ? "selected" : ""}
          onClick={() => { setProjectText(""); setValue({ type: "loose" }); }}
        >
          Loose
        </button>
        <button
          type="button"
          className={value.type === "area" ? "selected" : ""}
          onClick={() => {
            setProjectText("");
            setValue(
              activeAreas[0]
                ? { type: "area", areaId: activeAreas[0].id }
                : { type: "area", areaId: "" },
            );
          }}
        >
          Area
        </button>
        <button
          type="button"
          className={value.type === "project" ? "selected" : ""}
          onClick={() => {
            if (value.type !== "project") setProjectText("");
            setValue({ type: "project", projectId: value.type === "project" ? value.projectId : "" });
          }}
        >
          Project
        </button>
      </div>
      {value.type === "area" &&
        (activeAreas.length ? (
          <label className="form-row">
            <span>Area</span>
            <select
              className="field"
              style={{ color: activeAreas.find((area) => area.id === value.areaId)?.color }}
              value={value.areaId}
              onChange={(event) =>
                setValue({ type: "area", areaId: event.target.value })
              }
            >
              {activeAreas.map((area) => (
                <option key={area.id} value={area.id} style={area.color ? { color: area.color } : undefined}>
                  {area.title}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="inline-note">No valid Area destinations.</p>
        ))}
      {value.type === "project" &&
        (projects.length ? (
          <label className="form-row">
            <span>Project</span>
            <ProjectCombobox
              projects={projects}
              text={projectText}
              selectedProjectId={value.projectId || null}
              onTextChange={setProjectText}
              onProjectChange={(projectId) => setValue({ type: "project", projectId: projectId ?? "" })}
              placeholder="Type a Project title"
            />
            {currentProject?.archivedAt &&
              value.type === "project" &&
              value.projectId === currentProject.id && (
                <span className="inline-warning">
                  Archived Project can stay as current context but is not a
                  relocation target.
                </span>
              )}
          </label>
        ) : (
          <p className="inline-note">No valid Project destinations.</p>
        ))}
    </fieldset>
  );
}

function ListBrowser({
  data,
  openList,
  editList,
  reorderList,
  reorderListBefore,
  archiveList,
  deleteList,
}: {
  data: AppData;
  openList: (id: string) => void;
  editList: (list: ReferenceList) => void;
  reorderList: (list: ReferenceList, direction: -1 | 1, visibleIds: string[]) => void;
  reorderListBefore: (list: ReferenceList, targetList: ReferenceList, visibleIds: string[]) => void;
  archiveList: (list: ReferenceList) => void;
  deleteList: (list: ReferenceList) => void;
}) {
  const lists = data.referenceLists
    .filter((list) => !list.deletedAt && !list.archivedAt)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  return (
    <section className="task-section list-browser-view">
      {lists.length === 0 ? (
        <EmptyState>No Lists yet.</EmptyState>
      ) : (
        <div className="list-browser">
          {lists.map((list) => (
            <ListRow
              key={list.id}
              data={data}
              list={list}
              visibleIds={lists.map((candidate) => candidate.id)}
              onClick={() => openList(list.id)}
              reorderList={(direction, visibleIds) => reorderList(list, direction, visibleIds)}
              reorderListBefore={(draggedId, targetId, visibleIds) => {
                const dragged = lists.find((candidate) => candidate.id === draggedId);
                const target = lists.find((candidate) => candidate.id === targetId);
                if (dragged && target) reorderListBefore(dragged, target, visibleIds);
              }}
              editList={() => editList(list)}
              archiveList={() => archiveList(list)}
              deleteList={() => deleteList(list)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ListAppearancePicker({
  color,
  setColor,
}: {
  color: string;
  setColor: (value: string) => void;
}) {
  return (
    <fieldset className="appearance-picker">
      <legend>Appearance</legend>
      <div className="color-grid" aria-label="List color">
        <button
          type="button"
          className={`swatch ${!color ? "selected" : ""}`}
          aria-label="No color"
          onClick={() => setColor("")}
        />
        {listColorOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`swatch ${color === option.value ? "selected" : ""}`}
            style={{ "--swatch-colour": option.value } as CSSProperties}
            aria-label={option.label}
            onClick={() => setColor(option.value)}
          />
        ))}
      </div>
    </fieldset>
  );
}

function StatusAppearancePicker({
  color,
  icon,
  category,
  makeDefault,
  setColor,
  setIcon,
  setCategory,
  setMakeDefault,
  excludedColors,
  excludedIcons,
}: {
  color: string;
  icon: string;
  category: Status["category"];
  makeDefault: boolean;
  setColor: (value: string) => void;
  setIcon: (value: string) => void;
  setCategory: (value: Status["category"]) => void;
  setMakeDefault: (value: boolean) => void;
  excludedColors: string[];
  excludedIcons: string[];
}) {
  return (
    <fieldset className="appearance-picker">
      <legend>Status configuration</legend>
      <label className="form-row">
        <span>Classification</span>
        <select
          className="field"
          value={category}
          onChange={(event) =>
            setCategory(event.target.value as Status["category"])
          }
        >
          <option value="active">Open</option>
          <option value="completed">Closed: Completed</option>
          <option value="cancelled">Closed: Cancelled</option>
        </select>
      </label>
      <ColourPicker label="Status colour" value={color} onChange={setColor} excludeValues={excludedColors} />
      <div className="config-picker">
        <span className="config-picker__label">Status icon</span>
        <div className="status-icon-grid" aria-label="Status icon">
          {STATUS_ICON_OPTIONS.filter((option) => option === icon || !excludedIcons.includes(option)).map((option) => (
            <button key={option} type="button" className={`icon-button button ghost ${icon === option ? "selected" : ""}`} aria-label={option} title={option} onClick={() => setIcon(option)}>
              <StatusIcon icon={option} color={color} />
            </button>
          ))}
        </div>
      </div>
      <CircleCheckbox checked={makeDefault} disabled={category !== "active"} onChange={setMakeDefault}>Use as default open Status</CircleCheckbox>
    </fieldset>
  );
}

export function ListRow({
  data,
  list,
  visibleIds,
  onClick,
  editList,
  reorderList,
  reorderListBefore,
  canReorder,
  archiveList,
  deleteList,
}: {
  data: AppData;
  list: ReferenceList;
  visibleIds?: string[];
  onClick: () => void;
  reorderList?: (direction: -1 | 1, visibleIds: string[]) => void;
  reorderListBefore?: (draggedId: string, targetId: string, visibleIds: string[]) => void;
  canReorder?: boolean;
  editList?: () => void;
  archiveList?: () => void;
  deleteList?: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const orderedIds = visibleIds ?? [list.id];
  const index = orderedIds.indexOf(list.id);
  const showReorderHandle = Boolean(reorderList);
  const manualReorderEnabled = showReorderHandle && canReorder !== false;
  return (
    <div
      className={`list-browser__row list-row-action reference-list-row ${showReorderHandle ? "reference-list-row--reorderable" : ""} ${dragOver ? "drop-before" : ""}`}
      onDragOver={(event) => {
        if (!manualReorderEnabled) return;
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        setDragOver(false);
        if (!manualReorderEnabled) return;
        const draggedId = event.dataTransfer.getData("text/list-id");
        const from = orderedIds.indexOf(draggedId);
        const to = orderedIds.indexOf(list.id);
        if (from < 0 || to < 0 || from === to) return;
        reorderListBefore?.(draggedId, list.id, orderedIds);
      }}
    >
      {showReorderHandle && (
        <button
          type="button"
          className={`project-row__handle icon-button button ghost ${manualReorderEnabled ? "" : "drag-handle--inactive"}`}
          draggable={manualReorderEnabled}
          aria-label={`Reorder ${list.title}`}
          aria-disabled={!manualReorderEnabled}
          title="Reorder"
          onDragStart={(event) => {
            if (!manualReorderEnabled) return;
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/list-id", list.id);
          }}
          onKeyDown={(event) => {
            if (!manualReorderEnabled) return;
            if (event.key === "ArrowUp" && index > 0) {
              event.preventDefault();
              reorderList?.(-1, orderedIds);
            }
            if (event.key === "ArrowDown" && index < orderedIds.length - 1) {
              event.preventDefault();
              reorderList?.(1, orderedIds);
            }
          }}
        >
          <GripVertical aria-hidden="true" />
        </button>
      )}
      <button
        type="button"
        className="list-row-action__main"
        onClick={onClick}
        aria-label={`Open ${list.title}`}
      >
        <strong className="reference-list-row__title" style={list.color ? { color: list.color } : undefined}>
          <span className="entity-title-text">{list.title}</span>
          <QuantifierTitleIcons data={data} selections={list.quantifierSelections} />
        </strong>
        <span className="reference-list-row__location">{listLocationIndicator(data, list)}</span>
      </button>
      <div className="row-icon-actions reference-list-row__actions">
        {editList && (
          <button
            type="button"
            className="icon-button button ghost list-card-action--edit"
            aria-label={`Edit ${list.title}`}
            title="Edit"
            onClick={editList}
          >
            <Pencil aria-hidden="true" />
          </button>
        )}
        {archiveList && (
          <button
            type="button"
            className="icon-button button ghost list-card-action--archive"
            aria-label={`Archive ${list.title}`}
            title="Archive"
            onClick={archiveList}
          >
            <Archive aria-hidden="true" />
          </button>
        )}
        {deleteList && (
          <button
            type="button"
            className="icon-button button danger list-card-action--delete"
            aria-label={`Move ${list.title} to Trash`}
            title="Move to Trash"
            onClick={deleteList}
          >
            <Trash2 aria-hidden="true" />
          </button>
        )}
      </div>
      {(editList || archiveList || deleteList) && <CardActionMenu label={`Open actions for ${list.title}`} actions={[
        ...(editList ? [{ id: "edit", label: "Edit", icon: <Pencil aria-hidden="true" />, onSelect: editList }] : []),
        ...(archiveList ? [{ id: "archive", label: "Archive", icon: <Archive aria-hidden="true" />, onSelect: archiveList }] : []),
        ...(deleteList ? [{ id: "delete", label: "Move to Trash", icon: <Trash2 aria-hidden="true" />, onSelect: deleteList, danger: true }] : []),
      ]} />}
    </div>
  );
}

function ReferenceListDetail({
  data,
  list,
  commit,
  editEntry,
  editList,
  archiveList,
  deleteList,
}: {
  data: AppData;
  list: ReferenceList;
  commit: (
    next: AppData,
    expectedIds?: string[],
    successMessage?: string,
  ) => Promise<boolean>;
  editEntry: (entry: ReferenceListEntry) => void;
  editList: (list: ReferenceList) => void;
  archiveList: (list: ReferenceList) => void;
  deleteList: (list: ReferenceList) => void;
}) {
  const [undoService] = useState(() => new UndoService());
  const feedback = useFeedback();
  const entries = data.referenceListEntries
    .filter((entry) => entry.referenceListId === list.id && !entry.deletedAt)
    .sort((a, b) => a.orderKey.localeCompare(b.orderKey));
  function move(entryId: string, targetId: string) {
    const ids = moveIdBefore(
      entries.map((entry) => entry.id),
      entryId,
      targetId,
    );
    if (ids === entries.map((entry) => entry.id)) return;
    void commit(
      reorderReferenceEntries(data, list.id, ids),
      ids,
      "Entry moved",
    );
  }
  function moveEntry(entryId: string, direction: -1 | 1) {
    void commit(
      reorderReferenceEntry(data, entryId, direction),
      [entryId],
      "List item order changed",
    );
  }
  function deleteEntry(entry: ReferenceListEntry) {
    const index = entries.findIndex((candidate) => candidate.id === entry.id);
    const receipt = undoService.register({
      id: `undo_${entry.id}_${Date.now()}`,
      label: "Undo",
      expiresAt: Date.now() + 5200,
      run: () => {
        const restored = restoreCommand(data, "referenceListEntry", entry.id);
        const visible = restored.referenceListEntries
          .filter(
            (candidate) =>
              candidate.referenceListId === list.id && !candidate.deletedAt,
          )
          .sort((a, b) => a.orderKey.localeCompare(b.orderKey))
          .map((candidate) => candidate.id);
        visible.splice(Math.min(index, visible.length), 0, entry.id);
        void commit(
          reorderReferenceEntries(restored, list.id, [...new Set(visible)]),
          [entry.id],
          "List item restored",
        );
      },
    });
    void commit(
      softDeleteCommand(data, "referenceListEntry", entry.id),
      [entry.id],
      "List item deleted",
    );
    feedback.info("List item deleted", {
      scope: "route",
      dedupeKey: `delete:${entry.id}`,
      action: {
        label: "Undo",
        run: () => void undoService.execute(receipt.id),
      },
    });
  }
  const tags = list.tagIds
    .map((id) => data.tags.find((tag) => tag.id === id && !tag.deletedAt))
    .filter(Boolean) as AppData["tags"];
  return (
    <section
      className={`task-section ${list.archivedAt ? "archived-detail" : ""}`}
    >
      <div className="list-detail-header">
        <div className="list-detail-title">
          <p className="list-detail-context">
            {listLocationIndicator(data, list)}
            {list.archivedAt && (
              <span className="archived-indicator" aria-label="Archived list">
                <Archive aria-hidden="true" />
                Archived
              </span>
            )}
          </p>
          {tags.length > 0 && (
            <div className="tag-wrap">
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className="tag"
                  style={{ "--tag-colour": tag.color } as CSSProperties}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="row-icon-actions">
          {!list.archivedAt && (
            <button
              type="button"
              className="icon-button button ghost"
              aria-label={`Edit ${list.title}`}
              title="Edit"
              onClick={() => editList(list)}
            >
              <Pencil aria-hidden="true" />
            </button>
          )}
          {!list.archivedAt && (
            <button
              type="button"
              className="icon-button button ghost"
              aria-label={`Archive ${list.title}`}
              title="Archive"
              onClick={() => archiveList(list)}
            >
              <Archive aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            className="icon-button button danger"
            aria-label={`Move ${list.title} to Trash`}
            title="Move to Trash"
            onClick={() => deleteList(list)}
          >
            <Trash2 aria-hidden="true" />
          </button>
        </div>
      </div>
      {entries.length === 0 ? (
        <EmptyState>No items.</EmptyState>
      ) : (
        <div className="reference-list-detail">
          {entries.map((entry, index) => (
            <ReferenceEntryRow
              key={entry.id}
              entry={entry}
              move={move}
              moveUp={() => moveEntry(entry.id, -1)}
              moveDown={() => moveEntry(entry.id, 1)}
              canMoveUp={index > 0}
              canMoveDown={index < entries.length - 1}
              edit={() => editEntry(entry)}
              deleteEntry={() => deleteEntry(entry)}
              readOnly={Boolean(list.archivedAt)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ReferenceEntryRow({
  entry,
  move,
  moveUp,
  moveDown,
  canMoveUp,
  canMoveDown,
  edit,
  deleteEntry,
  readOnly = false,
}: {
  entry: ReferenceListEntry;
  move: (entryId: string, targetId: string) => void;
  moveUp: () => void;
  moveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  edit: () => void;
  deleteEntry: () => void;
  readOnly?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [swipe, setSwipe] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  function interactiveTarget(event: { target: EventTarget | null }) {
    return event.target instanceof Element && Boolean(event.target.closest("button, a, input, select, textarea"));
  }
  function swipeEnd() {
    if (Math.abs(swipe) > 82) deleteEntry();
    setSwipe(0);
    start.current = null;
  }
  return (
    <div
      className={`reference-item ${dragging ? "dragging" : ""} ${dragOver ? "drop-before" : ""} ${Math.abs(swipe) > 50 ? "swipe-ready" : ""}`}
      style={{ "--swipe-x": `${swipe}px` } as CSSProperties}
      draggable={dragging}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", entry.id);
      }}
      onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        setDragOver(false);
        move(event.dataTransfer.getData("text/plain"), entry.id);
      }}
      onPointerDown={(event) => {
        if (interactiveTarget(event)) return;
        start.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerMove={(event) => {
        if (!start.current) return;
        const dx = event.clientX - start.current.x;
        const dy = event.clientY - start.current.y;
        if (Math.abs(dx) > 18 && Math.abs(dx) > Math.abs(dy) * 1.3)
          setSwipe(Math.max(-110, Math.min(110, dx)));
      }}
      onPointerUp={swipeEnd}
      onPointerCancel={() => setSwipe(0)}
    >
      <button
        type="button"
        className="drag-handle"
        draggable={!readOnly}
        disabled={readOnly}
        aria-label={`Reorder ${entry.text}`}
        onPointerDown={() => {
          if (!readOnly) setDragging(true);
        }}
        onPointerUp={() => setDragging(false)}
        onDragEnd={() => setDragging(false)}
      >
        <GripVertical aria-hidden="true" />
      </button>
      <div className="reference-item__text">
        {entry.link ? (
          <a href={entry.link} target="_blank" rel="noreferrer noopener">
            {entry.text}
          </a>
        ) : (
          <span>{entry.text}</span>
        )}
      </div>
      {!readOnly && (
        <>
          <button
            type="button"
            className="icon-button button ghost"
            aria-label={`Move ${entry.text} up`}
            title="Move up"
            disabled={!canMoveUp}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => { event.stopPropagation(); moveUp(); }}
          >
            <ChevronUp aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-button button ghost"
            aria-label={`Move ${entry.text} down`}
            title="Move down"
            disabled={!canMoveDown}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => { event.stopPropagation(); moveDown(); }}
          >
            <ChevronDown aria-hidden="true" />
          </button>
        </>
      )}
      {!readOnly && (
        <button
          type="button"
          className="icon-button button ghost"
          aria-label={`Edit ${entry.text}`}
          title="Edit"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => { event.stopPropagation(); edit(); }}
        >
          <Pencil aria-hidden="true" />
        </button>
      )}
      {!readOnly && (
        <button
          type="button"
          className="icon-button button danger"
          aria-label={`Delete ${entry.text}`}
          title="Delete"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => { event.stopPropagation(); deleteEntry(); }}
        >
          <Trash2 aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function ProjectsView(props: any) {
  const { data } = props;
  const mode = props.mode as "projects" | "areas";
  const [showCompleted, setShowCompleted] = useState(false);
  const [sort, setSort] = useState<"manual" | "title">("manual");
  const [group, setGroup] = useState<"none" | "area" | "status">("none");
  if (props.selectedProject)
    return (
      <ProjectDetail
        {...props}
        data={data}
        project={props.selectedProject}
        back={props.back}
      />
    );
  if (props.selectedArea)
    return (
      <AreaDetail
        {...props}
        data={data}
        area={props.selectedArea}
        showCompleted={showCompleted}
        setShowCompleted={setShowCompleted}
      />
    );
  if (mode === "projects" && props.requestedProjectId) return <UnavailableEntity title="Project unavailable" browserLabel="Back to Projects" back={props.back} />;
  if (mode === "areas" && props.requestedAreaId) return <UnavailableEntity title="Area unavailable" browserLabel="Back to Areas" back={props.back} />;
  const projectsBase = [
    ...activeOrderedProjects(data),
    ...(showCompleted ? completedProjects(data) : []),
  ];
  const projects = sortProjectsForBrowser(projectsBase, sort);
  const projectGroups = group === "area" ? groupProjectsByArea(data, projects) : group === "status" ? groupProjectsByStatus(data, projects) : [{ key: "all", title: "Projects", projects }];
  const areasBase = [
    ...activeOrderedAreas(data),
  ];
  const areas = sortAreasForBrowser(areasBase, sort);
  if (mode === "projects") return (
    <section className="task-section project-area-browser">
      <ProjectAreaBrowserToolbar sort={sort} setSort={setSort} group={group} setGroup={setGroup} groupOptions={[{ value: "none", label: "None" }, { value: "area", label: "Area" }, { value: "status", label: "Status" }]} toggle={<ShowClosedIconToggle checked={showCompleted} setChecked={setShowCompleted} showLabel="Show Closed Projects" hideLabel="Hide Closed Projects" />} />
      {projects.length === 0 ? (
        <EmptyState>No Projects yet.</EmptyState>
      ) : (
        projectGroups.map((projectGroup) => (
          <section className="task-section project-area-browser__content" key={projectGroup.key}>
            {group !== "none" && <h3 className="section-heading">{projectGroup.title}</h3>}
            <div className="list-browser">
              {projectGroup.projects.map((project) => (
                <ProjectRow
                  key={project.id}
                  data={data}
                  project={project}
                  open={() => props.openProject(project.id)}
                  edit={() => props.editProject(project)}
                  demote={() => props.demoteProject(project)}
                  complete={() =>
                    statusCategory(data, project.statusId) !== "active"
                      ? props.reopenProject(project)
                      : props.completeProject(project)
                  }
                  archive={() => props.archiveProject(project)}
                  deleteProject={() => props.deleteProject(project)}
                  moveUp={() => props.reorderProject(project, -1)}
                  moveDown={() => props.reorderProject(project, 1)}
                  canReorder={sort === "manual"}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </section>
  );
  return (
    <section className="task-section project-area-browser">
      <ProjectAreaBrowserToolbar sort={sort} setSort={setSort} group={group} setGroup={setGroup} groupOptions={[{ value: "none", label: "None" }, { value: "status", label: "State" }]} />
      {areas.length === 0 ? (
        <EmptyState>No Areas yet.</EmptyState>
      ) : (
        <section className="task-section project-area-browser__content">
          {group === "status" && <h3 className="section-heading">Active Areas</h3>}
          <div className="list-browser">
            {areas.filter((area) => !area.deletedAt).map((area) => (
              <AreaRow
                key={area.id}
                data={data}
                area={area}
                open={() => props.openArea(area.id)}
                edit={() => props.editArea(area)}
                moveUp={() => props.reorderArea(area, -1)}
                moveDown={() => props.reorderArea(area, 1)}
                canReorder={sort === "manual"}
                archiveArea={() => props.archiveArea(area)}
                deleteArea={() => props.deleteArea(area)}
              />
            ))}
          </div>
        </section>
      )}
    </section>
  );
}

function ProjectAreaBrowserToolbar({
  sort,
  setSort,
  group,
  setGroup,
  groupOptions,
  toggle = null,
}: {
  sort: "manual" | "title";
  setSort: (sort: "manual" | "title") => void;
  group: "none" | "area" | "status";
  setGroup: (group: "none" | "area" | "status") => void;
  groupOptions: Array<{ value: "none" | "area" | "status"; label: string }>;
  toggle?: ReactNode;
}) {
  return (
    <div className="view-controls project-area-controls" id="active-view-controls">
      <label className="view-control-field" title="Sort">
        <span className="sr-only">Sort</span>
        <ArrowUpDown aria-hidden="true" />
        <select
          className="field"
          aria-label="Sort"
          value={sort}
          onChange={(event) => setSort(event.target.value as "manual" | "title")}
        >
          <option value="manual">Manual</option>
          <option value="title">Title</option>
        </select>
      </label>
      <label className="view-control-field" title="Group">
        <span className="sr-only">Group</span>
        <Layers3 aria-hidden="true" />
        <select
          className="field"
          aria-label="Group"
          value={group}
          onChange={(event) => setGroup(event.target.value as "none" | "area" | "status")}
        >
          {groupOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {toggle && <div className="view-controls__actions">{toggle}</div>}
    </div>
  );
}

function sortProjectsForBrowser(projects: Project[], sort: "manual" | "title"): Project[] {
  return [...projects].sort((a, b) => sort === "title" ? a.title.localeCompare(b.title) : a.order - b.order || a.title.localeCompare(b.title));
}

function sortAreasForBrowser(areas: Area[], sort: "manual" | "title"): Area[] {
  return [...areas].sort((a, b) => sort === "title" ? a.title.localeCompare(b.title) : a.order - b.order || a.title.localeCompare(b.title));
}

function groupProjectsByArea(data: AppData, projects: Project[]) {
  const areaTitle = (project: Project) => project.areaId ? data.areas.find((area) => area.id === project.areaId)?.title ?? "Area unavailable" : "Loose";
  const groups = new Map<string, Project[]>();
  for (const project of projects) {
    const title = areaTitle(project);
    groups.set(title, [...(groups.get(title) ?? []), project]);
  }
  return [...groups.entries()].map(([title, groupedProjects]) => ({ key: `area:${title}`, title, projects: groupedProjects }));
}

function groupProjectsByStatus(data: AppData, projects: Project[]) {
  return activeStatuses(data).map((status) => ({ key: `status:${status.id}`, title: status.name, projects: projects.filter((project) => project.statusId === status.id) })).filter((group) => group.projects.length);
}

function UnavailableEntity({ title, browserLabel, back }: { title: string; browserLabel: string; back: () => void }) {
  return <section className="unavailable-entity" role="status"><h3>{title}</h3><p>This saved link no longer points to an available item. It may have been deleted or changed after the link was saved.</p><div className="row-icon-actions">{history.length > 1 && <Button variant="ghost" onClick={() => history.back()}>Back</Button>}<Button variant="primary" onClick={back}>{browserLabel}</Button></div></section>;
}

export function ProjectRow({
  data,
  project,
  open,
  edit,
  demote,
  complete,
  archive,
  deleteProject,
  moveUp,
  moveDown,
  allowReorder = true,
  canReorder = true,
}: {
  data: AppData;
  project: Project;
  open: () => void;
  edit: () => void;
  demote: () => void;
  complete: () => void;
  archive: () => void;
  deleteProject: () => void;
  moveUp: () => void;
  moveDown: () => void;
  allowReorder?: boolean;
  canReorder?: boolean;
}) {
  const progress = projectProgress(data, project.id);
  const status = data.statuses.find((candidate) => candidate.id === project.statusId);
  const closed = status?.category !== "active";
  const area = project.areaId
    ? data.areas.find((candidate) => candidate.id === project.areaId)
    : null;
  const tags = project.tagIds
    .map((id) => data.tags.find((tag) => tag.id === id && !tag.deletedAt))
    .filter(Boolean) as AppData["tags"];
  const progressMeta = progress.total
    ? `${progress.percentClosed}% closed · ${progress.open} open · ${progress.completed} completed`
    : "No actionable Tasks";
  const mobileActions: CardActionMenuItem[] = [
    ...(!closed && !project.archivedAt ? [{ id: "edit", label: "Edit", icon: <Pencil aria-hidden="true" />, onSelect: edit }] : []),
    ...(!project.archivedAt ? [{ id: "demote", label: "Demote to Task", icon: <PanelBottomClose aria-hidden="true" />, onSelect: demote }] : []),
    { id: "complete", label: closed ? "Reopen" : "Complete", icon: <CheckCheck aria-hidden="true" />, onSelect: complete },
    { id: "archive", label: "Archive", icon: <Archive aria-hidden="true" />, onSelect: archive },
    { id: "delete", label: "Move to Trash", icon: <Trash2 aria-hidden="true" />, onSelect: deleteProject, danger: true },
  ];
  return (
    <article
      className={`list-browser__row project-row project-card-row ${allowReorder ? "project-row--reorderable" : ""} ${closed ? "completed-project" : ""}`}
    >
      {allowReorder && (
        <button
          type="button"
          className={`project-row__handle icon-button button ghost ${canReorder ? "" : "drag-handle--inactive"}`}
          aria-label={`Reorder ${project.title}`}
          aria-disabled={!canReorder}
          title="Reorder"
          onKeyDown={(event) => {
            if (!canReorder) return;
            if (event.key === "ArrowUp") {
              event.preventDefault();
              moveUp();
            }
            if (event.key === "ArrowDown") {
              event.preventDefault();
              moveDown();
            }
          }}
        >
          <GripVertical aria-hidden="true" />
        </button>
      )}
      <button type="button" className="list-row-action__main project-row__main" onClick={open}>
        <strong className="project-row__title">
          {status && <StatusIcon icon={status.icon} color={status.color} label={status.name} />}
          <span className="entity-title-text">{project.title}</span>
          <QuantifierTitleIcons data={data} selections={project.quantifierSelections} />
        </strong>
        <span className="project-row__meta"><EntityContextLine items={[...(area ? [{ kind: "area", prefix: "Area", title: area.title, color: area.color }] : [{ kind: "location", prefix: "", title: "Unassigned" }]), ...quantifierMetadataContextsForSelections(data, project.quantifierSelections)]} />, <TaskProgressMeta>{progressMeta}</TaskProgressMeta></span>
        {tags.length > 0 && (
          <span className="tag-wrap">
            {tags.map((tag) => (
              <span
                className="tag"
                key={tag.id}
                style={{ "--tag-colour": tag.color } as CSSProperties}
              >
                {tag.name}
              </span>
            ))}
          </span>
        )}
      </button>
      <div className="row-icon-actions row-icon-actions--desktop">
        {!closed && !project.archivedAt && (
          <button
            type="button"
            className="icon-button button ghost"
            aria-label={`Edit ${project.title}`}
            onClick={edit}
          >
            <Pencil aria-hidden="true" />
          </button>
        )}
        {!project.archivedAt && (
          <button type="button" className="icon-button button ghost" aria-label={`Demote ${project.title} to Task`} title="Demote to Task" onClick={demote}>
            <PanelBottomClose aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          className="icon-button button ghost"
          aria-label={`${closed ? "Reopen" : "Complete"} ${project.title}`}
          title={closed ? "Reopen" : "Complete"}
          onClick={complete}
        >
          <CheckCheck aria-hidden="true" />
        </button>
        <button
          type="button"
          className="icon-button button ghost"
          aria-label={`Archive ${project.title}`}
          onClick={archive}
        >
          <Archive aria-hidden="true" />
        </button>
        <button
          type="button"
          className="icon-button button danger"
          aria-label={`Move ${project.title} to Trash`}
          onClick={deleteProject}
        >
          <Trash2 aria-hidden="true" />
        </button>
      </div>
      <CardActionMenu label={`Open actions for ${project.title}`} actions={mobileActions} />
    </article>
  );
}

export function AreaRow({
  data,
  area,
  open,
  edit,
  moveUp,
  moveDown,
  canReorder = true,
  archiveArea,
  deleteArea,
}: {
  data: AppData;
  area: Area;
  open: () => void;
  edit: () => void;
  moveUp: () => void;
  moveDown: () => void;
  canReorder?: boolean;
  archiveArea: () => void;
  deleteArea: () => void;
}) {
  const projects = projectsByArea(data, area.id, true).filter(
    (project) => !project.archivedAt,
  );
  const tasks = standaloneTasksByArea(data, area.id);
  const lists = directListsByArea(data, area.id);
  const areaMeta = area.description || `${projects.length} Projects · ${tasks.length} standalone Tasks · ${lists.length} direct Lists`;
  return (
    <article
      className="list-browser__row project-row area-card-row project-row--colour-accent project-row--reorderable"
      style={{ "--project-colour": area.color } as CSSProperties}
    >
      <button
        type="button"
        className={`project-row__handle icon-button button ghost ${canReorder ? "" : "drag-handle--inactive"}`}
        aria-label={`Reorder ${area.title}`}
        aria-disabled={!canReorder}
        title="Reorder"
        onKeyDown={(event) => {
          if (!canReorder) return;
          if (event.key === "ArrowUp") {
            event.preventDefault();
            moveUp();
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            moveDown();
          }
        }}
      >
        <GripVertical aria-hidden="true" />
      </button>
      <button type="button" className="list-row-action__main project-row__main" onClick={open}>
        <strong className="project-row__title">{area.title}</strong>
        <span className="project-row__meta">{areaMeta}</span>
      </button>
      <div className="row-icon-actions row-icon-actions--desktop">
        <button
          type="button"
          className="icon-button button ghost"
          aria-label={`Edit ${area.title}`}
          onClick={edit}
        >
          <Pencil aria-hidden="true" />
        </button>
        <button
          type="button"
          className="icon-button button ghost"
          aria-label={`Archive ${area.title}`}
          onClick={archiveArea}
        >
          <Archive aria-hidden="true" />
        </button>
        <button
          type="button"
          className="icon-button button danger"
          aria-label={`Move ${area.title} to Trash`}
          onClick={deleteArea}
        >
          <Trash2 aria-hidden="true" />
        </button>
      </div>
      <CardActionMenu label={`Open actions for ${area.title}`} actions={[
        { id: "edit", label: "Edit", icon: <Pencil aria-hidden="true" />, onSelect: edit },
        { id: "archive", label: "Archive", icon: <Archive aria-hidden="true" />, onSelect: archiveArea },
        { id: "delete", label: "Move to Trash", icon: <Trash2 aria-hidden="true" />, onSelect: deleteArea, danger: true },
      ]} />
    </article>
  );
}

function ProjectDetail({
  data,
  project,
  editProject,
  demoteProject,
  completeProject,
  reopenProject,
  archiveProject,
  unarchiveProject,
  deleteProject,
  openList,
  editList,
  reorderList,
  reorderListBefore,
  archiveList,
  deleteList,
  completeTask,
  deleteTask,
  editTask,
  moveTask,
  promoteTask,
  reorderTask,
  openBulkMove,
  taskPreference,
  taskFilters,
  setTaskFilters,
  updateTaskPreference,
  activeTaskId,
  selectTask,
  selectionMode,
  setSelectionMode,
  selectedTaskIds,
  toggleSelected,
  clearSelection,
  runBulk,
  selectedTasks,
}: any) {
  const progress = projectProgress(data, project.id);
  const projectStatus = data.statuses.find((status: Status) => status.id === project.statusId);
  const readOnly = Boolean(project.archivedAt || projectStatus?.category !== "active");
  const projectArea = project.areaId ? data.areas.find((candidate: Area) => candidate.id === project.areaId) : null;
  const lists = listsByProject(data, project.id);
  const taskView = buildTaskView(
    data,
    "project-detail",
    { ...taskPreference, filters: taskFilters, projectId: project.id },
    localDateString(),
  );
  return (
    <section className={`task-section ${readOnly ? "archived-detail" : ""}`}>
      <div className="list-detail-header project-detail-header">
        <div className="list-detail-title">
          <h3>
            <span className="entity-title-text">{project.title}</span>
            <QuantifierTitleIcons data={data} selections={project.quantifierSelections} />
          </h3>
          <p className="task-meta">
            <EntityContextLine items={[...(project.areaId ? [{ kind: "area", prefix: "Area", title: projectArea?.title ?? "Area unavailable", color: projectArea?.color }] : [{ kind: "location", prefix: "", title: "Unassigned" }]), ...quantifierMetadataContextsForSelections(data, project.quantifierSelections)]} />{", "}
            {project.archivedAt
              ? "Archived"
              : projectStatus?.name ?? "Status unavailable"}{" "}
            ·{" "}
            <TaskProgressMeta>{progress.total
              ? `${progress.percentClosed}% closed`
              : "No actionable Tasks"}</TaskProgressMeta>
          </p>
        </div>
        <div className="row-icon-actions">
          {!readOnly && (
            <button
              type="button"
              className="icon-button button ghost"
              aria-label={`Edit ${project.title}`}
              onClick={() => editProject(project)}
            >
              <Pencil aria-hidden="true" />
            </button>
          )}
          {!project.archivedAt && (
            <button type="button" className="icon-button button ghost" aria-label={`Demote ${project.title} to Task`} title="Demote to Task" onClick={() => demoteProject(project)}>
              <PanelBottomClose aria-hidden="true" />
            </button>
          )}
          {!project.archivedAt && (
            <button
              type="button"
              className="icon-button button ghost"
              aria-label={`${projectStatus?.category !== "active" ? "Reopen" : "Complete"} ${project.title}`}
              title={projectStatus?.category !== "active" ? "Reopen" : "Complete"}
              onClick={() =>
                projectStatus?.category !== "active"
                  ? reopenProject(project)
                  : completeProject(project)
              }
            >
              <CheckCheck aria-hidden="true" />
            </button>
          )}
          {project.archivedAt ? (
            <Button variant="ghost" onClick={() => unarchiveProject(project)}>
              Unarchive
            </Button>
          ) : (
            <button
              type="button"
              className="icon-button button ghost"
              aria-label={`Archive ${project.title}`}
              onClick={() => archiveProject(project)}
            >
              <Archive aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            className="icon-button button danger"
            aria-label={`Move ${project.title} to Trash`}
            onClick={() => deleteProject(project)}
          >
            <Trash2 aria-hidden="true" />
          </button>
        </div>
      </div>
      <TaskViewPanel
        data={data}
        viewId="project-detail"
        result={taskView}
        preference={taskPreference}
        filters={taskFilters}
        setFilters={setTaskFilters}
        updatePreference={updateTaskPreference}
        activeTaskId={activeTaskId}
        selectTask={selectTask}
        completeTask={completeTask}
        deleteTask={deleteTask}
        editTask={editTask}
        moveTask={moveTask}
        promoteTask={promoteTask}
        reorderTask={reorderTask}
        selectionMode={selectionMode}
        setSelectionMode={setSelectionMode}
        selectedTaskIds={selectedTaskIds}
        toggleSelected={toggleSelected}
        clearSelection={clearSelection}
        runBulk={runBulk}
        openBulkMove={openBulkMove}
        selectedTasks={selectedTasks}
      />{" "}
      <section className="task-section">
        <h3 className="section-heading">Lists</h3>
        {lists.length === 0 ? (
          <EmptyState>No Lists in this Project.</EmptyState>
        ) : (
          <div className="list-browser">
            {lists.map((list: ReferenceList) => (
              <ListRow
                key={list.id}
                data={data}
                list={list}
                visibleIds={lists.map((candidate: ReferenceList) => candidate.id)}
                onClick={() => openList(list.id)}
                reorderList={(direction, visibleIds) => reorderList(list, direction, visibleIds)}
                reorderListBefore={(draggedId, targetId, visibleIds) => {
                  const dragged = lists.find((candidate: ReferenceList) => candidate.id === draggedId);
                  const target = lists.find((candidate: ReferenceList) => candidate.id === targetId);
                  if (dragged && target) reorderListBefore(dragged, target, visibleIds);
                }}
                editList={!readOnly ? () => editList(list) : undefined}
                archiveList={!readOnly ? () => archiveList(list) : undefined}
                deleteList={!readOnly ? () => deleteList(list) : undefined}
              />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

function AreaDetail({
  data,
  area,
  editArea,
  deleteArea,
  openProject,
  editProject,
  demoteProject,
  completeProject,
  reopenProject,
  archiveProject,
  deleteProject,
  openList,
  editList,
  reorderList,
  reorderListBefore,
  archiveList,
  deleteList,
  completeTask,
  deleteTask,
  editTask,
  moveTask,
  promoteTask,
  reorderTask,
  openBulkMove,
  showCompleted,
  setShowCompleted,
  taskPreference,
  taskFilters,
  setTaskFilters,
  updateTaskPreference,
  activeTaskId,
  selectTask,
  selectionMode,
  setSelectionMode,
  selectedTaskIds,
  toggleSelected,
  clearSelection,
  runBulk,
  selectedTasks,
}: any) {
  const projects = projectsByArea(data, area.id, showCompleted);
  const taskView = buildTaskView(
    data,
    "area-detail",
    { ...taskPreference, filters: taskFilters, areaId: area.id },
    localDateString(),
  );
  const lists = directListsByArea(data, area.id);
  return (
    <section className="task-section">
      <div className="list-detail-header">
        <div className="list-detail-title">
          <h3>{area.title}</h3>
          {area.description && <p className="task-meta">{area.description}</p>}
        </div>
        <div className="row-icon-actions">
          <button
            type="button"
            className="icon-button button ghost"
            aria-label={`Edit ${area.title}`}
            onClick={() => editArea(area)}
          >
            <Pencil aria-hidden="true" />
          </button>
          <button
            type="button"
            className="icon-button button danger"
            aria-label={`Move ${area.title} to Trash`}
            onClick={() => deleteArea(area)}
          >
            <Trash2 aria-hidden="true" />
          </button>
        </div>
      </div>
      <section className="task-section">
        <div className="section-toolbar">
          <h3 className="section-heading">Projects</h3>
          <ShowClosedIconToggle
            checked={showCompleted}
            setChecked={setShowCompleted}
            showLabel="Show completed Projects"
            hideLabel="Hide completed Projects"
          />
        </div>
        {projects.length === 0 ? (
          <EmptyState>No Projects in this Area.</EmptyState>
        ) : (
          <div className="list-browser">
            {projects.map((project: Project) => (
              <ProjectRow
                key={project.id}
                data={data}
                project={project}
                open={() => openProject(project.id)}
                edit={() => editProject(project)}
                demote={() => demoteProject(project)}
                complete={() =>
                  statusCategory(data, project.statusId) !== "active"
                    ? reopenProject(project)
                    : completeProject(project)
                }
                archive={() => archiveProject(project)}
                deleteProject={() => deleteProject(project)}
                moveUp={() => undefined}
                moveDown={() => undefined}
                allowReorder={false}
              />
            ))}
          </div>
        )}
      </section>
      <TaskViewPanel
        data={data}
        viewId="area-detail"
        result={taskView}
        preference={taskPreference}
        filters={taskFilters}
        setFilters={setTaskFilters}
        updatePreference={updateTaskPreference}
        activeTaskId={activeTaskId}
        selectTask={selectTask}
        completeTask={completeTask}
        deleteTask={deleteTask}
        editTask={editTask}
        moveTask={moveTask}
        promoteTask={promoteTask}
        reorderTask={reorderTask}
        selectionMode={selectionMode}
        setSelectionMode={setSelectionMode}
        selectedTaskIds={selectedTaskIds}
        toggleSelected={toggleSelected}
        clearSelection={clearSelection}
        runBulk={runBulk}
        openBulkMove={openBulkMove}
        selectedTasks={selectedTasks}
      />
      <section className="task-section">
        <h3 className="section-heading">Lists</h3>
        {lists.length === 0 ? (
          <EmptyState>No direct Lists in this Area.</EmptyState>
        ) : (
          <div className="list-browser">
            {lists.map((list: ReferenceList) => (
              <ListRow
                key={list.id}
                data={data}
                list={list}
                visibleIds={lists.map((candidate: ReferenceList) => candidate.id)}
                onClick={() => openList(list.id)}
                reorderList={(direction, visibleIds) => reorderList(list, direction, visibleIds)}
                reorderListBefore={(draggedId, targetId, visibleIds) => {
                  const dragged = lists.find((candidate: ReferenceList) => candidate.id === draggedId);
                  const target = lists.find((candidate: ReferenceList) => candidate.id === targetId);
                  if (dragged && target) reorderListBefore(dragged, target, visibleIds);
                }}
                editList={() => editList(list)}
                archiveList={() => archiveList(list)}
                deleteList={() => deleteList(list)}
              />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
function listContext(data: AppData, list: ReferenceList) {
  if (list.location.type === "project") {
    const project = data.projects.find(
      (candidate) =>
        candidate.id ===
        (list.location as { type: "project"; projectId: string }).projectId,
    );
    return project
      ? `${project.title}${project.archivedAt ? " (archived)" : ""}`
      : "Unknown project";
  }
  if (list.location.type === "area")
    return (
      data.areas.find(
        (area) =>
          area.id ===
          (list.location as { type: "area"; areaId: string }).areaId,
      )?.title ?? "Unknown area"
    );
  return "Loose list";
}

function listLocationIndicator(data: AppData, list: ReferenceList) {
  const locationItems = entityContextsForLocation(data, list.location);
  return <EntityContextLine items={[...(locationItems.length ? locationItems : [{ kind: "location", prefix: "", title: "Loose" }]), ...quantifierMetadataContextsForSelections(data, list.quantifierSelections)]} />;
}

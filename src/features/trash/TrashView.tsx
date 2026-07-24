import { Archive, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { AppData, Area, Project, ReferenceList, Task } from "../../domain";
import { purgeCommand, restoreCommand, softDeleteCommand, unarchiveListCommand, unarchiveProjectCommand } from "../../core/lifecycle/lifecycleCommands";
import { useConfirmation } from "../../core/dialogs/confirmation";
import { archivedAreas, deleteAreaCommand, unarchiveAreaCommand } from "../projects/projectAreaModel";
import { Button } from "../../shared/components/Button";
import { EmptyState } from "../../shared/components/EmptyState";

export type HiddenMode = "deleted" | "archived";
type DeletedTab = "areas" | "projects" | "tasks" | "lists";
type HiddenTab = DeletedTab;
type HiddenRecord = Area | Project | Task | ReferenceList;

const deletedTabs: Array<{ id: DeletedTab; label: string }> = [
  { id: "areas", label: "Areas" },
  { id: "projects", label: "Projects" },
  { id: "tasks", label: "Tasks" },
  { id: "lists", label: "Lists" },
];

export function TrashView({ data, commit, mode: controlledMode, setMode: setControlledMode }: { data: AppData; commit: (next: AppData, expectedIds?: string[], successMessage?: string) => Promise<boolean | void>; mode?: HiddenMode; setMode?: (mode: HiddenMode) => void }) {
  const confirm = useConfirmation();
  const [uncontrolledMode, setUncontrolledMode] = useState<HiddenMode>("deleted");
  const mode = controlledMode ?? uncontrolledMode;
  const setMode = setControlledMode ?? setUncontrolledMode;
  const [tab, setTab] = useState<HiddenTab>("projects");
  const tabs = deletedTabs;
  const selectedTab = tabs.some((candidate) => candidate.id === tab) ? tab : "projects";
  const records = hiddenRecords(data, mode, selectedTab);
  function action(record: HiddenRecord) {
    if (mode === "deleted") return void commit(restoreCommand(data, record.kind, record.id), [record.id], "Restored");
    if (record.kind === "area") return void commit(unarchiveAreaCommand(data, record.id), [record.id], "Unarchived");
    if (record.kind === "project") return void commit(unarchiveProjectCommand(data, record.id), [record.id], "Unarchived");
    return void commit(unarchiveListCommand(data, record.id), [record.id], "Unarchived");
  }
  function deleteArchived(record: HiddenRecord) {
    confirm({
      title: `Delete ${titleOf(record)}`,
      message: `Move this archived ${recordLabel(record)} to Deleted items? It can be restored as an active record or purged from Deleted items.`,
      confirmLabel: "Delete",
      tone: "destructive",
      onConfirm: () => {
        if (record.kind === "area") return void commit(deleteAreaCommand(data, record.id).data, [record.id], "Moved to Deleted");
        return void commit(softDeleteCommand(data, record.kind, record.id), [record.id], "Moved to Deleted");
      },
    });
  }
  function purge(record: HiddenRecord) {
    confirm({
      title: `Purge ${titleOf(record)}`,
      message: `Permanently remove this ${recordLabel(record)} from ToDonut? This cannot be undone.`,
      confirmLabel: "Purge",
      tone: "destructive",
      onConfirm: () => void commit(purgeCommand(data, record.kind, record.id), [record.id], "Purged"),
    });
  }
  return <section className="task-section hidden-screen">
    <div className="hidden-toolbar">
      <div className="hidden-tabs" role="tablist" aria-label={`${mode} entity tabs`}>
        {tabs.map((item) => <button key={item.id} type="button" className={selectedTab === item.id ? "selected" : ""} aria-selected={selectedTab === item.id} onClick={() => setTab(item.id)}>{item.label}</button>)}
      </div>
    </div>
    {records.length === 0 ? <EmptyState>No {mode} {tabLabel(selectedTab)}.</EmptyState> : <div className="hidden-list">{records.map((record) => <HiddenRow key={record.id} data={data} mode={mode} record={record} action={() => action(record)} deleteArchived={() => deleteArchived(record)} purge={() => purge(record)} />)}</div>}
  </section>;
}

export function TrashModeToggle({ mode, setMode }: { mode: HiddenMode; setMode: (mode: HiddenMode) => void }) {
  return <button type="button" className={`show-closed-toggle hidden-mode-toggle ${mode === "archived" ? "is-on" : ""}`} aria-label={mode === "deleted" ? "Showing Deleted items" : "Showing Archived items"} onClick={() => setMode(mode === "deleted" ? "archived" : "deleted")}>
    <span className={`show-closed-toggle__state ${mode === "deleted" ? "is-selected" : ""}`} aria-hidden="true"><Trash2 /></span>
    <span className={`show-closed-toggle__state ${mode === "archived" ? "is-selected" : ""}`} aria-hidden="true"><Archive /></span>
  </button>;
}

function hiddenRecords(data: AppData, mode: HiddenMode, tab: HiddenTab): HiddenRecord[] {
  if (mode === "deleted") {
    if (tab === "areas") return sortByHiddenAt(data.areas.filter((area) => area.deletedAt), "deleted");
    if (tab === "projects") return sortByHiddenAt(data.projects.filter((project) => project.deletedAt), "deleted");
    if (tab === "tasks") return sortByHiddenAt(data.tasks.filter((task) => task.deletedAt && (!task.parentTaskId || !data.tasks.find((parent) => parent.id === task.parentTaskId)?.deletedAt)), "deleted");
    return sortByHiddenAt(data.referenceLists.filter((list) => list.deletedAt), "deleted");
  }
  if (tab === "areas") return archivedAreas(data);
  if (tab === "projects") return sortByHiddenAt(data.projects.filter((project) => !project.deletedAt && project.archivedAt), "archived");
  if (tab === "tasks") return [];
  return sortByHiddenAt(data.referenceLists.filter((list) => !list.deletedAt && list.archivedAt), "archived");
}

function sortByHiddenAt<T extends HiddenRecord>(records: T[], mode: HiddenMode): T[] {
  return [...records].sort((a, b) => {
    const left = mode === "deleted" ? a.deletedAt : "archivedAt" in a ? a.archivedAt : null;
    const right = mode === "deleted" ? b.deletedAt : "archivedAt" in b ? b.archivedAt : null;
    return (right ?? "").localeCompare(left ?? "") || titleOf(a).localeCompare(titleOf(b));
  });
}

function HiddenRow({ data, mode, record, action, deleteArchived, purge }: { data: AppData; mode: HiddenMode; record: HiddenRecord; action: () => void; deleteArchived: () => void; purge: () => void }) {
  const timestamp = mode === "deleted" ? record.deletedAt : "archivedAt" in record ? record.archivedAt : null;
  const label = mode === "deleted" ? "Deleted" : "Archived";
  return <article className="hidden-row">
    <div className="hidden-row__main">
      <strong>{titleOf(record)}</strong>
      <span>{recordLabel(record)} - {label} {formatHiddenTimestamp(timestamp)}</span>
      <span>{contextOf(data, record)}</span>
    </div>
    <div className="hidden-row__actions">
      <Button variant="ghost" onClick={action}>{mode === "deleted" ? <RotateCcw aria-hidden="true" /> : <Archive aria-hidden="true" />}{mode === "deleted" ? "Restore" : "Unarchive"}</Button>
      {mode === "deleted" ? <Button variant="danger" onClick={purge}><Trash2 aria-hidden="true" />Purge</Button> : <Button variant="danger" onClick={deleteArchived}><Trash2 aria-hidden="true" />Delete</Button>}
    </div>
  </article>;
}

function titleOf(record: HiddenRecord): string {
  return record.title;
}

function recordLabel(record: HiddenRecord): string {
  if (record.kind === "area") return "Area";
  if (record.kind === "project") return "Project";
  if (record.kind === "task") return "Task";
  return "List";
}

function tabLabel(tab: HiddenTab): string {
  if (tab === "areas") return "Areas";
  if (tab === "projects") return "Projects";
  if (tab === "tasks") return "Tasks";
  return "Lists";
}

function contextOf(data: AppData, record: HiddenRecord): string {
  if (record.kind === "area") {
    const projectCount = data.projects.filter((project) => project.areaId === record.id && !project.deletedAt).length;
    const taskCount = data.tasks.filter((task) => task.location.type === "area" && task.location.areaId === record.id && !task.deletedAt).length;
    const listCount = data.referenceLists.filter((list) => list.location.type === "area" && list.location.areaId === record.id && !list.deletedAt).length;
    return `${projectCount} Project${projectCount === 1 ? "" : "s"} - ${taskCount} Task${taskCount === 1 ? "" : "s"} - ${listCount} List${listCount === 1 ? "" : "s"}`;
  }
  if (record.kind === "project") return record.areaId ? data.areas.find((area) => area.id === record.areaId)?.title ?? "Former area unavailable" : "Unassigned Project";
  if (record.kind === "task") {
    const descendantCount = countTaskDescendants(data, record.id);
    const subtree = descendantCount ? ` - ${descendantCount} deleted descendant${descendantCount === 1 ? "" : "s"}` : "";
    if (record.location.type === "project") {
      const projectId = record.location.projectId;
      return `${data.projects.find((project) => project.id === projectId)?.title ?? "Project unavailable"}${subtree}`;
    }
    if (record.location.type === "area") {
      const areaId = record.location.areaId;
      return `${data.areas.find((area) => area.id === areaId)?.title ?? "Area unavailable"}${subtree}`;
    }
    return `${record.location.type === "someday" ? "Someday" : "Inbox"}${subtree}`;
  }
  if (record.location.type === "project") {
    const projectId = record.location.projectId;
    return data.projects.find((project) => project.id === projectId)?.title ?? "Project unavailable";
  }
  if (record.location.type === "area") {
    const areaId = record.location.areaId;
    return data.areas.find((area) => area.id === areaId)?.title ?? "Area unavailable";
  }
  return "Loose List";
}

function countTaskDescendants(data: AppData, taskId: string): number {
  const children = data.tasks.filter((task) => task.parentTaskId === taskId && task.deletedAt);
  return children.length + children.reduce((count, child) => count + countTaskDescendants(data, child.id), 0);
}

function formatHiddenTimestamp(value: string | null): string {
  if (!value) return "time unavailable";
  return new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Sydney" }).format(new Date(value));
}

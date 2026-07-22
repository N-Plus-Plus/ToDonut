import { CSSProperties, FormEvent, KeyboardEvent, RefObject, useEffect, useRef, useState } from "react";
import { CalendarDays, CalendarPlus, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Circle, CircleCheck, GripVertical, Pencil, Plus, Trash2, X } from "lucide-react";
import { AppData, ChecklistItem, Task, TaskDraftInput, createTaskCommand, defaultPriorityId, defaultStatusId, newId, nowIso, orderedActivePriorities, saveTaskCommand } from "../../../domain";
import { addDateDays, formatAustralianDate, localDateString, mondayOfWeek, nineWeekDateGrid, parseAustralianDate } from "../../../core/dates/dateService";
import { moveId } from "../../../core/ordering/ordering";
import { Modal } from "../../../core/dialogs/Modal";
import { AnchoredOverlay, anchoredOverlayPosition } from "../../../core/dialogs/AnchoredOverlay";
import { ActivityHistory } from "../../../core/activity/ActivityHistory";
import { Button } from "../../../shared/components/Button";
import { SharedTagPicker } from "../../../shared/components/ConfigurationControls";
import { ProjectCombobox, projectIdForExactTitle } from "../../../shared/components/ProjectCombobox";
import { CircleCheckbox } from "../../../shared/components/CircleCheckbox";
import { QuantifierFields } from "../../../shared/components/QuantifierFields";

type TaskEditorMode = { type: "create"; defaults?: Partial<Pick<Task, "location" | "scheduledDate" | "parentTaskId">> } | { type: "edit"; taskId: string; initialTab?: TaskEditorTab };
type TaskEditorTab = "Basics" | "More" | "Checklist" | "History";
const editTabs: TaskEditorTab[] = ["Basics", "More", "Checklist", "History"];
const createTabs: TaskEditorTab[] = ["Basics", "More", "Checklist"];

export function TaskEditor({ data, mode, onClose, commit, createScheduleFromTask }: { data: AppData; mode: TaskEditorMode; onClose: () => void; commit: (next: AppData, expectedIds?: string[], successMessage?: string) => Promise<boolean | void>; createScheduleFromTask?: (taskId: string) => void }) {
  const task = mode.type === "edit" ? data.tasks.find((candidate) => candidate.id === mode.taskId) ?? null : null;
  const [draft, setDraft] = useState(() => initialDraft(data, mode, task));
  const [expanded, setExpanded] = useState(Boolean(mode.type === "edit" && mode.initialTab));
  const [activeTab, setActiveTab] = useState<TaskEditorTab>(mode.type === "edit" && mode.initialTab ? mode.initialTab : "Basics");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState("");
  const activeProjects = data.projects.filter((project) => !project.deletedAt && !project.archivedAt && !project.completedAt);
  const [projectText, setProjectText] = useState(() => {
    const location = initialDraft(data, mode, task).location;
    return location.type === "project" ? activeProjects.find((project) => project.id === location.projectId)?.title ?? "" : "";
  });
  const [submitting, setSubmitting] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const tabPanelRef = useRef<HTMLDivElement>(null);
  const focusTabOnRender = useRef(false);
  const aggregate = Boolean(task?.aggregate);
  const statuses = data.statuses.filter((status) => !status.deletedAt).sort((a, b) => a.order - b.order);
  const priorities = orderedActivePriorities(data);
  const projectValue = draft.location.type === "project" ? draft.location.projectId : "";
  const selectedAreaIds = (draft as TaskDraftInput & { areaIds?: string[] }).areaIds ?? (draft.location.type === "area" ? [draft.location.areaId] : []);
  const tabs = mode.type === "edit" ? editTabs : createTabs;

  useEffect(() => {
    if (!expanded || !focusTabOnRender.current) return;
    focusTabOnRender.current = false;
    const target = tabPanelRef.current?.querySelector<HTMLElement>("input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])");
    target?.focus();
  }, [activeTab, expanded]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const exactProjectId = projectIdForExactTitle(activeProjects, projectText);
    const submittedDraft = draft.location.type === "project" || projectText.trim()
      ? { ...draft, location: exactProjectId ? { type: "project" as const, projectId: exactProjectId } : { type: "inbox" as const } }
      : draft;
    const validation = validateDraft(data, submittedDraft, task?.id ?? null);
    setErrors(validation);
    if (Object.keys(validation).length || submitting) return;
    setSubmitting(true);
    try {
      const next = mode.type === "create" ? createTaskCommand(data, submittedDraft) : saveTaskCommand(data, mode.taskId, submittedDraft);
      await commit(next, mode.type === "create" ? [] : [mode.taskId], mode.type === "create" ? "Task created" : "Task saved");
      onClose();
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "Task could not be saved." });
    } finally {
      setSubmitting(false);
    }
  }

  function updateProject(projectId: string) {
    const location = projectId ? { type: "project" as const, projectId } : { type: "inbox" as const };
    setDraft((current) => ({ ...current, location, parentTaskId: null }));
    if (draft.parentTaskId) setFeedback("Parent cleared because the Project changed.");
  }

  function updateAreas(areaIds: string[]) {
    const areaId = areaIds[0];
    setDraft((current) => ({ ...current, areaIds, location: areaId ? { type: "area", areaId } : { type: "inbox" }, parentTaskId: null }));
    setProjectText("");
  }

  function setActiveDetailsTab(tab: TaskEditorTab) {
    focusTabOnRender.current = true;
    setActiveTab(tab);
  }

  return <Modal title={mode.type === "create" ? "New Task" : "Edit Task"} onClose={() => !submitting && onClose()} closeDisabled={submitting} initialFocusRef={titleRef}>
    <form className="task-editor" onSubmit={submit}>
      <label className="form-row"><span className={mode.type === "create" ? "sr-only" : ""}>Task title</span><input ref={titleRef} aria-label="Task title" className="field" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />{errors.title && <em className="field-error">{errors.title}</em>}</label>
      {mode.type === "edit" && !aggregate && draft.checklist.length > 0 && <ChecklistPreview items={draft.checklist} />}
      <button type="button" className="details-toggle disclosure-heading" aria-expanded={expanded} onClick={() => { setExpanded((value) => !value); if (!expanded && !activeTab) setActiveTab("Basics"); }}>
        {expanded ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />} DETAILS
      </button>
      {expanded && <div className="task-details">
        <Tabs tabs={tabs} value={activeTab} setValue={setActiveDetailsTab} />
        {activeTab === "Basics" && <section className="tab-panel" ref={tabPanelRef}>
          {aggregate ? <p className="inline-note">Aggregate parents keep leaf-only workflow fields inactive.</p> : <>
            <div className="three-field-row">
              <label className="form-row"><span>Status</span><select className="field" value={draft.statusId} onChange={(event) => setDraft({ ...draft, statusId: event.target.value })}>{statuses.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}</select>{errors.statusId && <em className="field-error">{errors.statusId}</em>}</label>
              <label className="form-row"><span>Priority</span><select className="field" value={draft.priorityId} onChange={(event) => setDraft({ ...draft, priorityId: event.target.value })}>{priorities.map((priority) => <option key={priority.id} value={priority.id}>{priority.name}</option>)}</select>{errors.priorityId && <em className="field-error">{errors.priorityId}</em>}</label>
              <DateField label="Due Date" value={draft.scheduledDate} onChange={(scheduledDate) => setDraft({ ...draft, scheduledDate })} warnPast prefillTodayOnFocus />
            </div>
            <QuantifierFields data={data} value={draft.quantifierSelections ?? {}} onChange={(quantifierSelections) => setDraft({ ...draft, quantifierSelections })} />
            <SharedTagPicker data={data} scope="task" selectedIds={draft.tagIds} setSelectedIds={(tagIds) => setDraft({ ...draft, tagIds })} />
            {errors.tagIds && <em className="field-error">{errors.tagIds}</em>}
            <label className="form-row"><span>Description</span><textarea className="field task-description" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
          </>}
        </section>}
        {activeTab === "More" && <section className="tab-panel" ref={tabPanelRef}>
          {aggregate ? <p className="inline-note">Aggregate parents do not use leaf Reveal On fields.</p> : null}
          <div className="two-field-row">
            <AreaMultiSelect data={data} selectedIds={selectedAreaIds} setSelectedIds={updateAreas} />
            <label className="form-row"><span>Project</span><ProjectCombobox projects={activeProjects} text={projectText} selectedProjectId={projectValue || null} onTextChange={setProjectText} onProjectChange={(projectId) => updateProject(projectId ?? "")} placeholder="Inbox" /></label>
          </div>
          {(errors.project || errors.area) && <em className="field-error">{errors.project ?? errors.area}</em>}
          {feedback && <p className="inline-note">{feedback}</p>}
          {!aggregate && <div className="two-field-row"><DateField label="Reveal On" value={draft.revealDate} onChange={(revealDate) => setDraft({ ...draft, revealDate })} />{task && createScheduleFromTask && canCreateScheduleFromTask(data, task) && <div className="form-row schedule-action-row"><span className="sr-only">Schedule</span><Button type="button" variant="ghost" onClick={() => createScheduleFromTask(task.id)}><CalendarPlus aria-hidden="true" />Create Schedule</Button></div>}</div>}
        </section>}
        {activeTab === "Checklist" && <section className="tab-panel" ref={tabPanelRef}>
          {aggregate ? <p className="inline-note">Aggregate parents do not have checklist content.</p> : <ChecklistEditor items={draft.checklist} setItems={(checklist) => setDraft({ ...draft, checklist })} />}
        </section>}
        {mode.type === "edit" && activeTab === "History" && <section className="tab-panel" ref={tabPanelRef}>
          <ActivityHistory data={data} entityKind="task" entityId={mode.taskId} showHeading={false} />
        </section>}
      </div>}
      {errors.form && <em className="field-error">{errors.form}</em>}
      {mode.type === "edit" && task?.recurrence && <p className="inline-note">Generated by {scheduleLabel(data, task.recurrence.ruleId, task.recurrence.scheduleLabel)} for {task.recurrence.occurrenceDate}.</p>}
      <div className="modal-actions"><Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button><Button type="submit" variant="primary" disabled={submitting || !draft.title.trim()}>{submitting ? "Saving..." : mode.type === "create" ? "Create Task" : "Save Changes"}</Button></div>
    </form>
  </Modal>;
}

function initialDraft(data: AppData, mode: TaskEditorMode, task: Task | null): TaskDraftInput {
  if (task) return { title: task.title, description: task.description, statusId: task.statusId, priorityId: task.priorityId, scheduledDate: task.scheduledDate, revealDate: task.revealDate, mustDoToday: false, location: task.location, parentTaskId: null, tagIds: [...task.tagIds], quantifierSelections: { ...task.quantifierSelections }, checklist: [...(task.checklist ?? [])].sort((a, b) => a.order - b.order) };
  return { title: "", description: "", statusId: defaultStatusId(data), priorityId: defaultPriorityId(data), scheduledDate: mode.type === "create" ? mode.defaults?.scheduledDate ?? null : null, revealDate: null, mustDoToday: false, location: mode.type === "create" ? mode.defaults?.location ?? { type: "inbox" } : { type: "inbox" }, parentTaskId: null, tagIds: [], quantifierSelections: {}, checklist: [] };
}

function validateDraft(data: AppData, draft: TaskDraftInput, taskId: string | null) {
  const errors: Record<string, string> = {};
  if (!draft.title.trim()) errors.title = "Task title is required.";
  if (!data.statuses.some((status) => status.id === draft.statusId && !status.deletedAt)) errors.statusId = "Choose an available Status.";
  if (!data.priorities.some((priority) => priority.id === draft.priorityId && !priority.deletedAt)) errors.priorityId = "Configuration error: repair the missing Priority before saving.";
  if (draft.tagIds.some((tagId) => !data.tags.some((tag) => tag.id === tagId && !tag.deletedAt && tag.allowedScopes.includes("task")))) errors.tagIds = "Choose Task tags only.";
  if (draft.location.type === "project") {
    const projectId = draft.location.projectId;
    if (!data.projects.some((project) => project.id === projectId && !project.deletedAt && !project.archivedAt && !project.completedAt)) errors.project = "Choose an available Project.";
  }
  if (draft.location.type === "area") {
    const areaId = draft.location.areaId;
    if (!data.areas.some((area) => area.id === areaId && !area.deletedAt && !area.archivedAt)) errors.area = "Choose an available Area.";
  }
  if (draft.checklist.some((item) => !item.text.trim())) errors.checklist = "Checklist item text is required.";
  return errors;
}

function canCreateScheduleFromTask(data: AppData, task: Task): boolean {
  if (task.aggregate || task.deletedAt) return false;
  const location = task.location;
  if (location.type === "project") {
    const project = data.projects.find((candidate) => candidate.id === location.projectId);
    return Boolean(project && !project.deletedAt && !project.archivedAt && !project.completedAt);
  }
  if (location.type === "area") return data.areas.some((area) => area.id === location.areaId && !area.deletedAt && !area.archivedAt);
  return true;
}

function scheduleLabel(data: AppData, ruleId: string, fallback: string): string {
  const rule = data.recurrenceRules.find((candidate) => candidate.id === ruleId && !candidate.deletedAt);
  return rule?.label || fallback;
}

function Tabs({ tabs, value, setValue }: { tabs: TaskEditorTab[]; value: TaskEditorTab; setValue: (value: TaskEditorTab) => void }) {
  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    const index = tabs.indexOf(value);
    if (event.key === "ArrowRight") { event.preventDefault(); setValue(tabs[(index + 1) % tabs.length]); }
    if (event.key === "ArrowLeft") { event.preventDefault(); setValue(tabs[(index + tabs.length - 1) % tabs.length]); }
    if (event.key === "Home") { event.preventDefault(); setValue(tabs[0]); }
    if (event.key === "End") { event.preventDefault(); setValue(tabs.at(-1)!); }
  }
  return <div className="task-tabs" role="tablist" aria-label="Task details" style={{ "--task-tab-count": tabs.length } as CSSProperties} onKeyDown={onKey}>{tabs.map((tab) => <button key={tab} type="button" role="tab" aria-selected={value === tab} className={value === tab ? "selected" : ""} onClick={() => setValue(tab)}>{tab}</button>)}</div>;
}

function AreaMultiSelect({ data, selectedIds, setSelectedIds }: { data: AppData; selectedIds: string[]; setSelectedIds: (ids: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const areas = data.areas.filter((area) => !area.deletedAt && !area.archivedAt).sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  const selectedAreas = areas.filter((area) => selectedIds.includes(area.id));
  const label = selectedAreas.length ? selectedAreas.map((area) => area.title).join(", ") : "Inbox";
  function toggleArea(areaId: string) {
    const next = selectedIds.includes(areaId) ? selectedIds.filter((id) => id !== areaId) : [...selectedIds, areaId];
    setSelectedIds(next);
  }
  return <div className="form-row area-dropdown"><span>Area/s</span><button ref={buttonRef} type="button" className="field area-dropdown__button" style={selectedAreas.length === 1 && selectedAreas[0].color ? { color: selectedAreas[0].color } : undefined} disabled={areas.length === 0} aria-expanded={open} onClick={() => setOpen((value) => !value)}><span>{label}</span><ChevronDown aria-hidden="true" /></button>{open && <AnchoredOverlay anchorRef={buttonRef} className="area-dropdown__menu anchored-dropdown" matchAnchorWidth onClose={() => setOpen(false)}>{areas.map((area) => <CircleCheckbox key={area.id} checked={selectedIds.includes(area.id)} checkedColor={area.color} onChange={() => toggleArea(area.id)}><span style={area.color ? { color: area.color } : undefined}>{area.title}</span></CircleCheckbox>)}</AnchoredOverlay>}{areas.length === 0 && <small>No Areas defined.</small>}</div>;
}

function DateField({ label, value, onChange, warnPast = false, prefillTodayOnFocus = false }: { label: string; value: string | null; onChange: (value: string | null) => void; warnPast?: boolean; prefillTodayOnFocus?: boolean }) {
  const [text, setText] = useState(formatAustralianDate(value));
  const [error, setError] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [prefilled, setPrefilled] = useState(false);
  function commitText(nextText: string) {
    setText(nextText);
    if (!nextText.trim()) { setError(""); onChange(null); return; }
    const parsed = parseAustralianDate(nextText);
    if (!parsed.valid) { setError(parsed.message); return; }
    setError(""); onChange(parsed.date);
  }
  function prefillIfEmpty() {
    if (!prefillTodayOnFocus || prefilled || value || text.trim()) return;
    const today = localDateString();
    setPrefilled(true);
    setText(formatAustralianDate(today));
    onChange(today);
  }
  return <label className="form-row date-field"><span>{label}</span><div className="date-control"><input className="field" value={text} placeholder="D/M/YY" onFocus={prefillIfEmpty} onChange={(event) => commitText(event.target.value)} /><button ref={buttonRef} type="button" className="icon-button button ghost" aria-label={`Choose ${label}`} onClick={() => setPickerOpen((open) => !open)}><CalendarDays aria-hidden="true" /></button><button type="button" className="icon-button button ghost" aria-label={`Clear ${label}`} onClick={() => { setText(""); setError(""); onChange(null); }}><X aria-hidden="true" /></button></div>{warnPast && value && value < localDateString() && <span className="inline-warning">Past Due Date</span>}{error && <em className="field-error">{error}</em>}{pickerOpen && <DatePickerOverlay anchorRef={buttonRef} selected={value} onClose={() => setPickerOpen(false)} onPick={(date) => { onChange(date); setText(formatAustralianDate(date)); setPickerOpen(false); }} />}</label>;
}

export function datePickerOverlayPosition(anchor: Pick<DOMRect, "top" | "right" | "bottom">, picker: Pick<DOMRect, "width" | "height">, viewport: { width: number; height: number }, gap = 6): { top: number; left: number } {
  return anchoredOverlayPosition({ ...anchor, left: anchor.right }, picker, viewport, "end", gap);
}

function DatePickerOverlay({ anchorRef, selected, onClose, onPick }: { anchorRef: RefObject<HTMLElement | null>; selected: string | null; onClose: () => void; onPick: (date: string) => void }) {
  return <AnchoredOverlay anchorRef={anchorRef} className="date-picker-overlay" alignment="end" onClose={onClose}><NineWeekDatePicker selected={selected} onPick={onPick} /></AnchoredOverlay>;
}

function NineWeekDatePicker({ selected, onPick }: { selected: string | null; onPick: (date: string) => void }) {
  const today = localDateString();
  const [start, setStart] = useState(mondayOfWeek(today));
  const cells = nineWeekDateGrid(today, selected, start);
  return <div className="date-picker"><div className="date-picker__nav"><button type="button" className="icon-button button ghost" aria-label="Previous dates" onClick={() => setStart(addDateDays(start, -63))}><ChevronLeft aria-hidden="true" /></button><Button type="button" variant="ghost" onClick={() => setStart(mondayOfWeek(today))}>Today</Button><button type="button" className="icon-button button ghost" aria-label="Next dates" onClick={() => setStart(addDateDays(start, 63))}><ChevronRight aria-hidden="true" /></button></div><div className="date-grid headings">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}</div><div className="date-grid">{cells.map((cell) => <button key={cell.date} type="button" className={`${cell.middleMonth ? "middle" : "outer"} ${cell.today ? "today" : ""} ${cell.selected ? "selected" : ""}`} aria-label={new Date(`${cell.date}T00:00:00`).toLocaleDateString("en-AU", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} onClick={() => onPick(cell.date)}>{cell.day}</button>)}</div></div>;
}

function ChecklistEditor({ items, setItems }: { items: ChecklistItem[]; setItems: (items: ChecklistItem[]) => void }) {
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const ordered = [...items].sort((a, b) => a.order - b.order);
  function add() {
    const clean = text.trim();
    if (!clean) return;
    const at = nowIso();
    setItems([...ordered, { id: newId("check"), text: clean, checked: false, order: ordered.length + 1, createdAt: at, updatedAt: at }]);
    setText("");
  }
  function reorder(id: string, direction: -1 | 1) {
    const ids = moveId(ordered.map((item) => item.id), id, direction);
    setItems(ids.map((itemId, index) => ({ ...ordered.find((item) => item.id === itemId)!, order: index + 1, updatedAt: nowIso() })));
  }
  return <div className="checklist-editor"><h4>Checklist</h4><div className="checklist-add"><input aria-label="Checklist item text" className="field" value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); add(); } }} /><Button type="button" variant="ghost" onClick={add}><Plus aria-hidden="true" />Add</Button></div>{ordered.map((item, index) => <div key={item.id} className="checklist-row" draggable onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const dragged = event.dataTransfer.getData("text/plain"); const ids = ordered.map((candidate) => candidate.id); const from = ids.indexOf(dragged); const to = ids.indexOf(item.id); if (from >= 0 && to >= 0) { ids.splice(to, 0, ids.splice(from, 1)[0]); setItems(ids.map((id, orderIndex) => ({ ...ordered.find((candidate) => candidate.id === id)!, order: orderIndex + 1, updatedAt: nowIso() }))); } }}><GripVertical aria-hidden="true" /><CircleCheckbox ariaLabel={`Check ${item.text}`} checked={item.checked} onChange={() => setItems(ordered.map((candidate) => candidate.id === item.id ? { ...candidate, checked: !candidate.checked, updatedAt: nowIso() } : candidate))} />{editingId === item.id ? <input aria-label={`Edit text for ${item.text}`} className="field" value={item.text} onChange={(event) => setItems(ordered.map((candidate) => candidate.id === item.id ? { ...candidate, text: event.target.value, updatedAt: nowIso() } : candidate))} onBlur={() => setEditingId(null)} /> : <span className={item.checked ? "checked" : ""}>{item.text}</span>}<button type="button" className="icon-button button ghost" aria-label={`Move ${item.text} up`} title="Move up" onClick={() => reorder(item.id, -1)} disabled={index === 0}><ChevronUp aria-hidden="true" /></button><button type="button" className="icon-button button ghost" aria-label={`Move ${item.text} down`} title="Move down" onClick={() => reorder(item.id, 1)} disabled={index === ordered.length - 1}><ChevronDown aria-hidden="true" /></button><button type="button" className="icon-button button ghost" aria-label={`Edit ${item.text}`} onClick={() => setEditingId(item.id)}><Pencil aria-hidden="true" /></button><button type="button" className="icon-button button danger" aria-label={`Delete ${item.text}`} onClick={() => setItems(ordered.filter((candidate) => candidate.id !== item.id).map((candidate, orderIndex) => ({ ...candidate, order: orderIndex + 1 })))}><Trash2 aria-hidden="true" /></button></div>)}</div>;
}

function ChecklistPreview({ items }: { items: ChecklistItem[] }) {
  const ordered = [...items].sort((a, b) => a.order - b.order);
  return <ul className="checklist-preview" aria-label="Checklist items">{ordered.map((item) => <li key={item.id} className={item.checked ? "checked" : ""}><span aria-hidden="true" className={`checklist-preview__box ${item.checked ? "is-checked" : ""}`}>{item.checked ? <CircleCheck /> : <Circle />}</span><span>{item.text}</span></li>)}</ul>;
}

import { FormEvent, useState } from "react";
import { CalendarClock, Pause, Pencil, Play, Trash2 } from "lucide-react";
import { AppData, RecurrenceFrequency, RecurrenceRule, RecurrenceRuleInput, RecurrenceTaskTemplate, TaskLocation, createRecurrenceRuleCommand, defaultPriorityId, defaultStatusId, orderedActivePriorities, pauseRecurrenceRuleCommand, processDueRecurrenceSchedules, resumeRecurrenceRuleCommand, ruleSummary, softDeleteRecurrenceRuleCommand, statusCategory, updateRecurrenceRuleCommand } from "../../domain";
import { localDateString } from "../../core/dates/dateService";
import { ActivityHistory } from "../../core/activity/ActivityHistory";
import { Modal } from "../../core/dialogs/Modal";
import { Button } from "../../shared/components/Button";
import { EmptyState } from "../../shared/components/EmptyState";
import { SharedTagPicker } from "../../shared/components/ConfigurationControls";
import { EntityContextLine, entityContextsForLocation, quantifierContextsForSelections } from "../../shared/components/EntityContextLine";
import { CircleCheckbox } from "../../shared/components/CircleCheckbox";
import { QuantifierFields } from "../../shared/components/QuantifierFields";

type ScheduleEditorMode = { type: "create"; sourceTaskId?: string } | { type: "edit"; ruleId: string };

export function SchedulesView({ data, commit, editSchedule }: { data: AppData; commit: (next: AppData, expectedIds?: string[], successMessage?: string) => Promise<boolean | void>; editSchedule: (mode: ScheduleEditorMode) => void }) {
  const schedules = data.recurrenceRules
    .filter((rule) => !rule.deletedAt)
    .sort((a, b) => Number(Boolean(b.attention)) - Number(Boolean(a.attention)) || Number(!a.active) - Number(!b.active) || a.nextBoundaryDate.localeCompare(b.nextBoundaryDate) || scheduleLabel(a).localeCompare(scheduleLabel(b)) || a.id.localeCompare(b.id));
  return <section className="task-section recurrence-settings">
    <p className="inline-note">Schedules generate ordinary leaf Tasks during authenticated catch-up processing.</p>
    {schedules.length === 0 ? <EmptyState>No Schedules.</EmptyState> : <div className="recurrence-list">{schedules.map((rule) => <ScheduleRow key={rule.id} data={data} rule={rule} edit={() => editSchedule({ type: "edit", ruleId: rule.id })} commit={commit} />)}</div>}
  </section>;
}

function ScheduleRow({ data, rule, edit, commit }: { data: AppData; rule: RecurrenceRule; edit: () => void; commit: (next: AppData, expectedIds?: string[], successMessage?: string) => Promise<boolean | void> }) {
  const state = rule.attention ? "Needs Attention" : rule.active && !rule.pausedAt ? "Active" : "Paused";
  const last = rule.lastGeneratedDate ?? "Not yet";
  return <article className={`recurrence-row ${rule.attention ? "needs-attention" : rule.active ? "active" : "paused"}`}>
    <div className="recurrence-row__icon"><CalendarClock aria-hidden="true" /></div>
    <div className="recurrence-row__main">
      <strong>{scheduleLabel(rule)}</strong>
      <div className="task-meta"><span className={`badge ${rule.attention ? "danger" : rule.active ? "success" : ""}`}>{state}</span><span>{ruleSummary(rule)}</span><span>Next {rule.nextBoundaryDate}</span><span><EntityContextLine items={[...(rule.template.location.type === "inbox" ? [{ kind: "location", prefix: "", title: "Inbox" }] : rule.template.location.type === "someday" ? [{ kind: "location", prefix: "", title: "Someday" }] : entityContextsForLocation(data, rule.template.location)), ...quantifierContextsForSelections(data, rule.template.quantifierSelections)]} /></span><span>Last {last}</span></div>
      {rule.attention && <p className="inline-warning">{rule.attention.message}</p>}
    </div>
    <div className="row-icon-actions">
      <button type="button" className="icon-button button ghost" aria-label={`Edit ${scheduleLabel(rule)}`} onClick={edit}><Pencil aria-hidden="true" /></button>
      {rule.active && !rule.pausedAt ? <button type="button" className="icon-button button ghost" aria-label={`Pause ${scheduleLabel(rule)}`} onClick={() => void commit(pauseRecurrenceRuleCommand(data, rule.id), [rule.id], "Schedule paused")}><Pause aria-hidden="true" /></button> : <button type="button" className="icon-button button ghost" aria-label={`Resume ${scheduleLabel(rule)}`} onClick={() => { const resumed = processDueRecurrenceSchedules(resumeRuleForUi(data, rule.id), localDateString()).data; void commit(resumed, [rule.id], "Schedule resumed"); }}><Play aria-hidden="true" /></button>}
      <button type="button" className="icon-button button danger" aria-label={`Move ${scheduleLabel(rule)} to Trash`} onClick={() => void commit(softDeleteRecurrenceRuleCommand(data, rule.id), [rule.id], "Schedule moved to Trash")}><Trash2 aria-hidden="true" /></button>
    </div>
  </article>;
}

export function ScheduleEditor({ data, mode, onClose, commit }: { data: AppData; mode: ScheduleEditorMode; onClose: () => void; commit: (next: AppData, expectedIds?: string[], successMessage?: string) => Promise<boolean | void> }) {
  const existing = mode.type === "edit" ? data.recurrenceRules.find((rule) => rule.id === mode.ruleId) ?? null : null;
  const sourceTask = mode.type === "create" && mode.sourceTaskId ? data.tasks.find((task) => task.id === mode.sourceTaskId) ?? null : null;
  const [draft, setDraft] = useState<RecurrenceRuleInput>(() => existing ? inputFromRule(existing) : inputFromSource(data, sourceTask));
  const [tab, setTab] = useState<"Schedule" | "Rule" | "Task" | "History">("Schedule");
  const [error, setError] = useState("");
  const priorities = orderedActivePriorities(data);

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const next = existing ? updateRecurrenceRuleCommand(data, existing.id, draft, localDateString()) : createRecurrenceRuleCommand(data, draft, localDateString());
      await commit(next, existing ? [existing.id] : [], existing ? "Schedule saved" : "Schedule created");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Schedule could not be saved.");
    }
  }

  return <Modal title={existing ? "Edit Schedule" : "New Schedule"} onClose={onClose}>
    <form className="task-editor schedule-editor" onSubmit={submit}>
      <div className="task-tabs" role="tablist" aria-label="Schedule editor tabs">{(["Schedule", "Rule", "Task", "History"] as const).filter((item) => item !== "History" || existing).map((item) => <button type="button" key={item} className={tab === item ? "selected" : ""} onClick={() => setTab(item)}>{item}</button>)}</div>
      {tab === "Schedule" && <section className="tab-panel">
        <label className="form-row"><span>Schedule name</span><input className="field" value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} /></label>
        <div className="two-field-row"><label className="form-row"><span>Start date</span><input className="field" type="date" value={draft.firstScheduledDate} onChange={(event) => setDraft({ ...draft, firstScheduledDate: event.target.value })} /></label><label className="form-row"><span>End date</span><input className="field" type="date" value={draft.endDate ?? ""} onChange={(event) => setDraft({ ...draft, endDate: event.target.value || null })} /></label></div>
      </section>}
      {tab === "Rule" && <section className="tab-panel">
        <div className="two-field-row"><label className="form-row"><span>Repeats</span><select className="field" value={draft.frequency} onChange={(event) => setDraft(nextFrequencyDraft(draft, event.target.value as RecurrenceFrequency))}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label><label className="form-row"><span>Every</span><input className="field" type="number" min={1} value={draft.interval} onChange={(event) => setDraft({ ...draft, interval: Number(event.target.value) })} /></label></div>
        {draft.frequency === "weekly" && <fieldset className="weekday-selector"><legend>Weekdays</legend>{[1, 2, 3, 4, 5, 6, 0].map((day) => <CircleCheckbox key={day} checked={draft.weekdays.includes(day)} onChange={() => setDraft({ ...draft, weekdays: toggleDay(draft.weekdays, day) })}>{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day]}</CircleCheckbox>)}</fieldset>}
        {draft.frequency === "monthly" && <label className="form-row"><span>Day of month</span><input className="field" type="number" min={1} max={31} value={draft.dayOfMonth ?? 1} onChange={(event) => setDraft({ ...draft, dayOfMonth: Number(event.target.value) })} /></label>}
      </section>}
      {tab === "Task" && <section className="tab-panel">
        <label className="form-row"><span>Task title</span><input className="field" value={draft.template.title} onChange={(event) => setDraft({ ...draft, template: { ...draft.template, title: event.target.value } })} /></label>
        <label className="form-row"><span>Description</span><textarea className="field task-description" value={draft.template.description} onChange={(event) => setDraft({ ...draft, template: { ...draft.template, description: event.target.value } })} /></label>
        <div className="two-field-row"><AreaField data={data} value={draft.template.location} onChange={(location) => setDraft({ ...draft, template: { ...draft.template, location } })} /><DestinationField data={data} value={draft.template.location} onChange={(location) => setDraft({ ...draft, template: { ...draft.template, location } })} /></div>
        <label className="form-row"><span>Priority</span><select className="field" value={draft.template.priorityId} onChange={(event) => setDraft({ ...draft, template: { ...draft.template, priorityId: event.target.value } })}>{priorities.map((priority) => <option key={priority.id} value={priority.id}>{priority.name}</option>)}</select></label>
        <QuantifierFields data={data} value={draft.template.quantifierSelections ?? {}} onChange={(quantifierSelections) => setDraft({ ...draft, template: { ...draft.template, quantifierSelections } })} />
        <SharedTagPicker data={data} scope="task" selectedIds={draft.template.tagIds} setSelectedIds={(tagIds) => setDraft({ ...draft, template: { ...draft.template, tagIds } })} />
        <CircleCheckbox checked={draft.template.dueOnOccurrence !== false} className="schedule-occurrence-toggle" onChange={(checked) => setDraft({ ...draft, template: { ...draft.template, dueOnOccurrence: checked } })}>Due Date equals occurrence date</CircleCheckbox>
      </section>}
      {tab === "History" && existing && <ActivityHistory data={data} entityKind="recurrenceRule" entityId={existing.id} />}
      {error && <em className="field-error">{error}</em>}
      <div className="modal-actions"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" variant="primary">{existing ? "Save Changes" : "Create Schedule"}</Button></div>
    </form>
  </Modal>;
}

function DestinationField({ data, value, onChange }: { data: AppData; value: TaskLocation; onChange: (location: TaskLocation) => void }) {
  const projects = data.projects.filter((project) => !project.deletedAt && !project.archivedAt && statusCategory(data, project.statusId) === "active");
  const selectedProject = value.type === "project" ? projects.find((project) => project.id === value.projectId) : null;
  return <label className="form-row"><span>Destination</span><select className="field" style={selectedProject?.color ? { color: selectedProject.color } : undefined} value={value.type === "project" ? value.projectId : ""} onChange={(event) => {
    const next = event.target.value;
    onChange(next ? { type: "project", projectId: next } : { type: "inbox" });
  }}><option value="">Inbox</option>{projects.map((project) => <option key={project.id} value={project.id} style={project.color ? { color: project.color } : undefined}>{project.title}</option>)}</select></label>;
}

function AreaField({ data, value, onChange }: { data: AppData; value: TaskLocation; onChange: (location: TaskLocation) => void }) {
  const areas = data.areas.filter((area) => !area.deletedAt && !area.archivedAt);
  const selectedArea = value.type === "area" ? areas.find((area) => area.id === value.areaId) : null;
  return <label className="form-row"><span>Area</span><select className="field" style={selectedArea?.color ? { color: selectedArea.color } : undefined} value={value.type === "area" ? value.areaId : ""} onChange={(event) => onChange(event.target.value ? { type: "area", areaId: event.target.value } : { type: "inbox" })}><option value="">None</option>{areas.map((area) => <option key={area.id} value={area.id} style={area.color ? { color: area.color } : undefined}>{area.title}</option>)}</select></label>;
}

function scheduleLabel(rule: RecurrenceRule) { return rule.label || rule.template.title || rule.id; }
function inputFromRule(rule: RecurrenceRule): RecurrenceRuleInput { return { label: rule.label, frequency: rule.frequency, interval: rule.interval, weekdays: [...rule.weekdays], dayOfMonth: rule.dayOfMonth, firstScheduledDate: rule.firstScheduledDate, endDate: rule.endDate, template: { ...rule.template, tagIds: [...rule.template.tagIds], checklist: [] } }; }
function inputFromSource(data: AppData, task: AppData["tasks"][number] | null): RecurrenceRuleInput {
  const today = localDateString();
  const template: RecurrenceTaskTemplate = { title: task?.title ?? "", description: task?.description ?? "", statusId: defaultStatusId(data), priorityId: task?.priorityId ?? defaultPriorityId(data), location: task?.location ?? { type: "inbox" }, revealDate: null, tagIds: task ? [...task.tagIds] : [], quantifierSelections: task ? { ...task.quantifierSelections } : {}, mustDoToday: false, dueOnOccurrence: true, checklist: [] };
  return { label: task?.title ?? "", frequency: "daily", interval: 1, weekdays: [1], dayOfMonth: Number(today.slice(8, 10)), firstScheduledDate: today, endDate: null, template };
}
function nextFrequencyDraft(draft: RecurrenceRuleInput, frequency: RecurrenceFrequency): RecurrenceRuleInput { return { ...draft, frequency, weekdays: frequency === "weekly" ? (draft.weekdays.length ? draft.weekdays : [1]) : [], dayOfMonth: frequency === "monthly" ? draft.dayOfMonth ?? Number(draft.firstScheduledDate.slice(8, 10)) : null }; }
function toggleDay(days: number[], day: number) { return days.includes(day) ? days.filter((value) => value !== day) : [...days, day].sort((a, b) => a - b); }
function resumeRuleForUi(data: AppData, ruleId: string): AppData { return resumeRecurrenceRuleCommand(data, ruleId, localDateString()); }

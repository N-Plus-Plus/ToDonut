import { CSSProperties, FormEvent, ReactNode, useState } from "react";
import { ArrowDown, ArrowDown01, ArrowUp, Braces, CalendarSync, ChevronDown, ChevronUp, Component, GripVertical, LucideIcon, Pencil, Pipette, Plus, Save, SlidersHorizontal, Tag as TagIcon, Trash2, Workflow, X, Zap } from "lucide-react";
import { AppData, Priority, QuantifierDefinition, Status, Tag, TagGroup, activeStatuses, defaultPriorityId, orderedActivePriorities, orderedActiveTagGroups, orderedQuantifierDefinitions, updateQuantifierDefinitionCommand } from "../../domain";
import { AuthState, PersistenceProvider } from "../../persistence";
import { MutationState, SyncState } from "../../exportSafety";
import { createDiagnosticsPayload } from "../../core/diagnostics/diagnosticsBuilder";
import { normaliseApplicationError } from "../../core/errors/applicationErrors";
import { useFeedback } from "../../core/feedback/useFeedback";
import { Button } from "../../shared/components/Button";
import { EmptyState } from "../../shared/components/EmptyState";
import { StatusIcon } from "../../shared/components/StatusIcon";
import { parseLucideIconTokens } from "../../core/icons/lucideIconTokens";
import { invalidLucideIconNames } from "../../core/icons/lucideIconRegistry";
import { SettingsSubsection } from "../../core/add/contextualAdd";
import { SchedulesView } from "../recurrence/SchedulesView";
import { Modal } from "../../core/dialogs/Modal";
import { CardActionMenu } from "../../shared/components/CardActionMenu";
import { paletteOptions } from "../../shared/components/ConfigurationControls";

interface SettingsViewProps {
  provider: PersistenceProvider;
  auth: AuthState;
  data: AppData;
  sync: SyncState;
  mutation: MutationState;
  connection: string;
  viewRuntime: { activeFilterCount: number; activeTagFilterCount: number; structuralAncestorCount: number; aggregateBulkCascadeCount: number; unavailableRouteStateType: string };
  section: SettingsSubsection;
  setSection: (section: SettingsSubsection) => void;
  editStatus: (status: Status) => void;
  deleteStatus: (status: Status) => void;
  reorderStatus: (status: Status, direction: -1 | 1) => void;
  reorderStatusRelative: (statusId: string, targetStatusId: string, placement: "before" | "after") => void;
  editPriority: (priority: Priority) => void;
  reorderPriority: (priority: Priority, direction: -1 | 1) => void;
  editTag: (tag: Tag) => void;
  deleteTag: (tag: Tag) => void;
  reorderTag: (tag: Tag, direction: -1 | 1) => void;
  reorderTagRelative: (tagId: string, targetTagId: string, placement: "before" | "after") => void;
  editTagGroup: (group: TagGroup) => void;
  deleteTagGroup: (group: TagGroup) => void;
  reorderTagGroup: (group: TagGroup, direction: -1 | 1) => void;
  editSchedule: (mode: { type: "create"; sourceTaskId?: string } | { type: "edit"; ruleId: string }) => void;
  commit: (next: AppData, expectedIds?: string[], successMessage?: string) => Promise<boolean | void>;
}

export function SettingsView(props: SettingsViewProps) {
  const { provider, auth, data, sync, mutation, connection, section, setSection } = props;
  const feedback = useFeedback();
  const payload = createDiagnosticsPayload({ provider, providerDiagnostics: provider.diagnostics(), auth, sync, mutation, data, basePath: import.meta.env.BASE_URL, viewRuntime: props.viewRuntime });
  if (section === "statuses") return <StatusSettings {...props} />;
  if (section === "priorities") return <PrioritySettings {...props} />;
  if (section === "tags" || section === "tagGroups") return <TagSettings {...props} />;
  if (section === "quantifiers") return <QuantifierSettings {...props} />;
  if (section === "recurrence") return <ConfigSection title="Schedule" note="Use the floating Add button to create a Schedule."><SchedulesView data={data} commit={props.commit} editSchedule={props.editSchedule} /></ConfigSection>;
  return <div className={section === "home" ? "settings-home" : "diagnostics-view"}>{section === "home" ? <>
    <SettingsHomeRow icon={Workflow} title="Statuses" description="Configure task workflow states" onClick={() => setSection("statuses")} />
    <SettingsHomeRow icon={ArrowDown01} title="Priorities" description="Configure the five task priority levels" onClick={() => setSection("priorities")} />
    <SettingsHomeRow icon={TagIcon} title="Tags" description="Configure Tags and Tag Groups" onClick={() => setSection("tags")} />
    <SettingsHomeRow icon={SlidersHorizontal} title="Quantifiers" description="Configure Energy, Context and their options" onClick={() => setSection("quantifiers")} />
    <SettingsHomeRow icon={CalendarSync} title="Schedule" description="Manage Task Schedules" onClick={() => setSection("recurrence")} />
    <SettingsHomeRow icon={Braces} title="Diagnostics" description="Provider and sync troubleshooting" onClick={() => setSection("diagnostics")} />
  </> : <>
    <DiagnosticGroup title="Application" rows={[["Version", payload.application.applicationVersion], ["Build", payload.application.buildId], ["Build time", payload.application.buildTimestamp], ["Schema", String(payload.application.schemaVersion)], ["Timezone", payload.application.timezone]]} />
    <DiagnosticGroup title="Backend" rows={[["Provider", payload.backend.provider], ["Configuration", payload.backend.providerConfigured], ["Auth", payload.backend.authenticationState], ["User", payload.backend.userIdentifier], ["Connection", connection], ["Initial sync", payload.backend.initialSynchronisationState], ["Last sync", payload.backend.lastSuccessfulSynchronisationTime], ["Last snapshot", payload.backend.lastAuthoritativeSnapshotLoadTime], ["Canonical revision", payload.backend.currentCanonicalRevision], ["Last confirmed revision", payload.backend.lastConfirmedRevision], ["Canonical trusted", payload.backend.canonicalStateTrusted]]} />
    <DiagnosticGroup title="Mutations" rows={[["Pending", String(payload.mutations.pendingCount)], ["Retrying", String(payload.mutations.retryingCount ?? 0)], ["Failed", String(payload.mutations.failedCount)], ["Conflicts", String(payload.mutations.conflictCount ?? 0)], ["Current", payload.mutations.currentSummary], ["Last failure", payload.mutations.lastFailureCategory], ["Last confirmed", payload.mutations.lastSuccessfulMutationAt ?? "Not yet confirmed"], ["Checkpoints", String(payload.mutations.boundedCheckpointCount)], ["Export safe", payload.mutations.exportSafe ? "Yes" : "No"], ["Export state", payload.mutations.exportSafetyReason]]} />
    <DiagnosticGroup title="Lifecycle" rows={[["Deleted Projects", String(payload.lifecycle.deletedProjects)], ["Deleted Tasks", String(payload.lifecycle.deletedTasks)], ["Deleted Lists", String(payload.lifecycle.deletedLists)], ["Archived Projects", String(payload.lifecycle.archivedProjects)], ["Archived Lists", String(payload.lifecycle.archivedLists)]]} />
    <DiagnosticGroup title="Organisation" rows={[["Active Projects", String(payload.organisation.activeProjects)], ["Completed Projects", String(payload.organisation.completedProjects)], ["Archived Projects", String(payload.organisation.archivedProjects)], ["Deleted Projects", String(payload.organisation.deletedProjects)], ["Unassigned Projects", String(payload.organisation.unassignedProjects)], ["Active Areas", String(payload.organisation.activeAreas)], ["Deleted Areas", String(payload.organisation.deletedAreas)], ["Invalid Project Area refs", String(payload.organisation.projectsWithInvalidAreaReferences)], ["Invalid Task Project refs", String(payload.organisation.tasksWithInvalidProjectReferences)], ["Invalid List Project refs", String(payload.organisation.listsWithInvalidProjectReferences)], ["Invalid standalone Task Area refs", String(payload.organisation.standaloneTasksWithInvalidAreaReferences)], ["Invalid direct List Area refs", String(payload.organisation.directListsWithInvalidAreaReferences)]]} />
    <DiagnosticGroup title="Bakery" rows={[["Schema", String(payload.bakery.schemaVersion)], ["Market health", payload.bakery.marketEngineHealth], ["Configuration", payload.bakery.configurationState], ["Active timed campaigns", String(payload.bakery.activeTimedCampaignCount)], ["Expired unresolved campaigns", String(payload.bakery.expiredUnresolvedCampaignCount)], ["Pending Spotlights", String(payload.bakery.pendingSpotlightCount)], ["Ingredient quotes", payload.bakery.ingredientQuoteValidation], ["Business path", payload.bakery.businessPurchasePathHealth], ["Statistics", payload.bakery.statisticsConsistencyState], ["Missing upgrade handlers", String(payload.bakery.paidUpgradesWithMissingEffectHandlerCount)], ["Missing campaign handlers", String(payload.bakery.campaignsWithMissingEffectHandlerCount)], ["Art fallbacks", String(payload.bakery.missingArtFallbackCount)]]} />
    <DiagnosticGroup title="Configuration" rows={[["Active Statuses", String(payload.configuration.activeStatuses)], ["Active Priorities", String(payload.configuration.activePriorities)], ["Active Tags", String(payload.configuration.activeTags)], ["Active Tag Groups", String(payload.configuration.activeTagGroups)], ["Deleted Statuses", String(payload.configuration.deletedStatuses)], ["Deleted Tags", String(payload.configuration.deletedTags)], ["Deleted Tag Groups", String(payload.configuration.deletedTagGroups)], ["Missing Status refs", String(payload.configuration.invalidMissingStatusReferences)], ["Missing Priority refs", String(payload.configuration.invalidMissingPriorityReferences)], ["Invalid Tag scopes", String(payload.configuration.invalidTagScopeAssignments)], ["Exclusive Tag conflicts", String(payload.configuration.mutuallyExclusiveTagConflicts)], ["Supabase public config", payload.configuration.supabasePublicConfiguration], ["Production provider", payload.configuration.productionProviderSelected], ["Development warning", payload.configuration.developmentAdapterWarning], ["Missing variables", payload.configuration.missingRequiredPublicVariables], ["Base path", payload.configuration.githubPagesBasePath]]} />
    <Button className="diagnostic-copy" onClick={() => void navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).then(() => feedback.success("Diagnostics copied", { scope: "global" })).catch((error) => feedback.error(normaliseApplicationError(error).message, { scope: "global" }))}>Copy Diagnostics</Button><details><summary>Technical details</summary><pre>{JSON.stringify(payload, null, 2)}</pre></details></>}</div>;
}

function SettingsHomeRow({ icon: Icon, title, description, onClick }: { icon: LucideIcon; title: string; description: string; onClick: () => void }) {
  return <button className="list-browser__row settings-home__row" onClick={onClick}><span className="settings-home__icon"><Icon aria-hidden="true" /></span><strong>{title}</strong><span>{description}</span></button>;
}

function StatusSettings({ data, editStatus, deleteStatus, reorderStatus, reorderStatusRelative }: SettingsViewProps) {
  const statuses = activeStatuses(data);
  const defaultId = statuses.filter((status) => status.category === "active")[0]?.id;
  return <ConfigSection title="Statuses" note="Use the floating Add button to create a Status.">{statuses.length === 0 ? <EmptyState>No statuses available.</EmptyState> : <div className="status-list">{statuses.map((status, index) => <ConfigRow key={status.id} actionLayout="status" reorderId={status.id} reorderScope="statuses" name={status.name} color={status.color} marker={<StatusIcon icon={status.icon} color={status.color} />} metadata={[status.category === "active" ? "Open" : status.category === "completed" ? "Closed: Completed" : "Closed: Cancelled"]} isDefault={status.id === defaultId} inlineMetadata index={index} count={statuses.length} move={(direction) => reorderStatus(status, direction)} moveRelative={reorderStatusRelative} edit={() => editStatus(status)} remove={statuses.length === 1 ? undefined : () => deleteStatus(status)} />)}</div>}</ConfigSection>;
}

function PrioritySettings({ data, editPriority, reorderPriority }: SettingsViewProps) {
  const priorities = orderedActivePriorities(data);
  const defaultId = defaultPriorityId(data);
  return <ConfigSection title="Priorities" note="There are exactly five active Priority levels. Reorder them to change task sorting rank.">{priorities.length === 0 ? <EmptyState>No priorities available.</EmptyState> : <div className="status-list">{priorities.map((priority, index) => <ConfigRow key={priority.id} actionLayout="priority" name={priority.name} color={priority.color} metadata={[`Rank ${index + 1} of 5`]} isDefault={priority.id === defaultId} index={index} count={priorities.length} move={(direction) => reorderPriority(priority, direction)} edit={() => editPriority(priority)} />)}</div>}</ConfigSection>;
}

function QuantifierSettings({ data, commit }: SettingsViewProps) {
  const definitions = orderedQuantifierDefinitions(data);
  return <ConfigSection title="Quantifiers" note="Rename each dimension and configure as many selectable options as you need.">
    <div className="quantifier-settings">{definitions.map((definition) => <QuantifierEditor key={`${definition.id}:${definition.version}`} data={data} definition={definition} commit={commit} />)}</div>
  </ConfigSection>;
}

export function QuantifierEditor({ data, definition, commit }: { data: AppData; definition: QuantifierDefinition; commit: SettingsViewProps["commit"] }) {
  const [name, setName] = useState(definition.name);
  const [options, setOptions] = useState(() => [...definition.options].sort((a, b) => a.order - b.order).map((option) => ({ id: option.id, key: option.id, name: option.name, iconText: option.iconNames.join("|"), color: option.color })));
  const [colourOptionKey, setColourOptionKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const Icon = definition.icon === "zap" ? Zap : Component;
  const moveOption = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= options.length) return;
    const next = [...options];
    [next[index], next[target]] = [next[target], next[index]];
    setOptions(next);
  };
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const preparedOptions = options.map((option) => ({ id: option.id || undefined, name: option.name, iconNames: parseLucideIconTokens(option.iconText), color: option.color }));
      const invalidIconNames = invalidLucideIconNames(preparedOptions.flatMap((option) => option.iconNames));
      if (invalidIconNames.length) throw new Error(`Unknown Lucide icon${invalidIconNames.length === 1 ? "" : "s"}: ${[...new Set(invalidIconNames)].join(", ")}.`);
      await commit(updateQuantifierDefinitionCommand(data, definition.id, { name, options: preparedOptions }), [definition.id], `${name.trim() || definition.name} saved`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Quantifier could not be saved.");
    }
  }
  return <form className="quantifier-settings__card" onSubmit={submit}>
    <label className="form-row"><span className="quantifier-field__label"><Icon aria-hidden="true" />Dimension name</span><input className="field" aria-label={`${definition.name} dimension name`} value={name} onChange={(event) => setName(event.target.value)} /></label>
    <div className="quantifier-settings__options">
      <span className="config-picker__label">Options</span>
      <small className="inline-note">Add Lucide icon names separated by pipes. Spaces are ignored; order and duplicates are preserved.</small>
      {options.map((option, index) => <div className="quantifier-option-row" key={option.key}>
        <input className="field" aria-label={`${definition.name} option ${index + 1}`} value={option.name} onChange={(event) => setOptions(options.map((candidate) => candidate.key === option.key ? { ...candidate, name: event.target.value } : candidate))} />
        <input className="field" aria-label={`${definition.name} option ${index + 1} icons`} placeholder="zap|component" value={option.iconText} onChange={(event) => setOptions(options.map((candidate) => candidate.key === option.key ? { ...candidate, iconText: event.target.value } : candidate))} />
        <button type="button" className="icon-button button ghost quantifier-option-colour-trigger" style={{ "--swatch-colour": option.color ?? "transparent" } as CSSProperties} aria-label={`Edit colour for ${option.name || `option ${index + 1}`}`} title="Option colour" onClick={() => setColourOptionKey(option.key)}><Pipette aria-hidden="true" /></button>
        <button type="button" className="icon-button button ghost" aria-label={`Move ${option.name || `option ${index + 1}`} up`} disabled={index === 0} onClick={() => moveOption(index, -1)}><ArrowUp aria-hidden="true" /></button>
        <button type="button" className="icon-button button ghost" aria-label={`Move ${option.name || `option ${index + 1}`} down`} disabled={index === options.length - 1} onClick={() => moveOption(index, 1)}><ArrowDown aria-hidden="true" /></button>
        <button type="button" className="icon-button button danger" aria-label={`Remove ${option.name || `option ${index + 1}`}`} onClick={() => setOptions(options.filter((candidate) => candidate.key !== option.key))}><X aria-hidden="true" /></button>
      </div>)}
      <Button type="button" variant="ghost" onClick={() => setOptions([...options, { id: "", key: `new-${Date.now()}-${options.length}`, name: "", iconText: "", color: null }])}><Plus aria-hidden="true" />Add Option</Button>
    </div>
    {error && <em className="field-error">{error}</em>}
    <div className="modal-actions"><Button type="submit" variant="primary"><Save aria-hidden="true" />Save {name.trim() || definition.name}</Button></div>
    {colourOptionKey && (() => {
      const option = options.find((candidate) => candidate.key === colourOptionKey);
      if (!option) return null;
      const label = option.name || "option";
      const selectColor = (color: string | null) => {
        setOptions(options.map((candidate) => candidate.key === option.key ? { ...candidate, color } : candidate));
        setColourOptionKey(null);
      };
      return <Modal title={`Colour for ${label}`} onClose={() => setColourOptionKey(null)}>
        <div className="quantifier-colour-grid" aria-label={`Colour options for ${label}`}>
          <button type="button" className={`swatch quantifier-colour-swatch ${!option.color ? "selected" : ""}`} aria-label="No colour" title="No colour" onClick={() => selectColor(null)}><Pipette aria-hidden="true" /></button>
          {paletteOptions.map((palette) => <button key={palette.value} type="button" className={`swatch quantifier-colour-swatch ${option.color === palette.value ? "selected" : ""}`} style={{ "--swatch-colour": palette.value } as CSSProperties} aria-label={palette.label} title={palette.label} onClick={() => selectColor(palette.value)} />)}
        </div>
      </Modal>;
    })()}
  </form>;
}

function TagSettings(props: SettingsViewProps) {
  const { section, setSection, data, editTag, deleteTag, reorderTag, reorderTagRelative, editTagGroup, deleteTagGroup, reorderTagGroup } = props;
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Set<string>>(() => new Set());
  const groups = orderedActiveTagGroups(data);
  const tagSections = buildTagSettingsGroups(data);
  const tagCount = tagSections.reduce((count, group) => count + group.tags.length, 0);
  const toggleGroup = (groupId: string) => setCollapsedGroupIds((current) => {
    const next = new Set(current);
    if (next.has(groupId)) next.delete(groupId);
    else next.add(groupId);
    return next;
  });
  return <ConfigSection title="Tags" note={section === "tags" ? "Use the floating Add button to create a Tag." : "Use the floating Add button to create a Tag Group."}>
    <div className="task-tabs compact" role="tablist" aria-label="Tag settings tabs"><button type="button" className={section === "tags" ? "selected" : ""} onClick={() => setSection("tags")}>Tags</button><button type="button" className={section === "tagGroups" ? "selected" : ""} onClick={() => setSection("tagGroups")}>Tag Groups</button></div>
    {section === "tags" ? tagCount === 0 ? <EmptyState>No tags available.</EmptyState> : <div className="tag-settings-groups">{tagSections.map((tagSection) => {
      const collapsed = !tagSection.loose && collapsedGroupIds.has(tagSection.id);
      const contentId = `tag-settings-content-${tagSection.id}`;
      return <section className={`tag-settings-group ${tagSection.loose ? "tag-settings-group--loose" : ""}`} key={tagSection.id} aria-labelledby={`tag-settings-group-${tagSection.id}`}>
        {tagSection.loose ? <h4 id={`tag-settings-group-${tagSection.id}`}>{tagSection.name}</h4> : <TagGroupHeading id={`tag-settings-group-${tagSection.id}`} contentId={contentId} name={tagSection.name} color={tagSection.color} expanded={!collapsed} toggle={() => toggleGroup(tagSection.id)} />}
        {!collapsed && <div id={contentId} className="status-list">{tagSection.tags.map((tag, index) => <ConfigRow key={tag.id} reorderId={tag.id} className="status-row--tag-member" reorderScope={tagSection.id} name={tag.name} color={tag.color} showColor={tagSection.loose} nameColor={tagSection.loose ? undefined : tagSection.color} inlineMetadata metadata={[tag.allowedScopes.map(scopeLabel).join(", ")]} index={index} count={tagSection.tags.length} move={(direction) => reorderTag(tag, direction)} moveRelative={reorderTagRelative} edit={() => editTag(tag)} remove={() => deleteTag(tag)} />)}</div>}
      </section>;
    })}</div> : groups.length === 0 ? <EmptyState>No Tag Groups available.</EmptyState> : <div className="status-list">{groups.map((group, index) => <ConfigRow key={group.id} name={group.name} color={group.color ?? "var(--colour-text-muted)"} metadata={[group.mutuallyExclusive ? "Mutually exclusive" : "Multiple allowed", `${data.tags.filter((tag) => !tag.deletedAt && tag.tagGroupId === group.id).length} Tags`]} index={index} count={groups.length} move={(direction) => reorderTagGroup(group, direction)} edit={() => editTagGroup(group)} remove={() => deleteTagGroup(group)} />)}</div>}
  </ConfigSection>;
}

export function TagGroupHeading({ id, contentId, name, color, expanded, toggle }: { id: string; contentId: string; name: string; color: string; expanded: boolean; toggle: () => void }) {
  return <div className="tag-settings-group__heading">
    <button type="button" className="icon-button button ghost tag-settings-group__toggle" aria-label={`${expanded ? "Collapse" : "Expand"} ${name}`} aria-expanded={expanded} aria-controls={contentId} onClick={toggle}>{expanded ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}</button>
    <span className="status-swatch status-swatch--plain tag-settings-group__swatch" style={{ "--status-colour": color } as CSSProperties} aria-hidden="true" />
    <h4 id={id}>{name}</h4>
  </div>;
}

export function buildTagSettingsGroups(data: AppData): Array<{ id: string; name: string; color: string; loose: boolean; tags: Tag[] }> {
  const groups = orderedActiveTagGroups(data);
  const activeGroupIds = new Set(groups.map((group) => group.id));
  const activeTags = data.tags.filter((tag) => !tag.deletedAt);
  const orderedTags = (tags: Tag[]) => [...tags].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  const grouped = groups.map((group) => ({
    id: group.id,
    name: group.name,
    color: group.color ?? "var(--colour-text-muted)",
    loose: false,
    tags: orderedTags(activeTags.filter((tag) => tag.tagGroupId === group.id)),
  })).filter((group) => group.tags.length > 0);
  const loose = orderedTags(activeTags.filter((tag) => !tag.tagGroupId || !activeGroupIds.has(tag.tagGroupId)));
  return loose.length ? [...grouped, { id: "loose", name: "Loose", color: "var(--colour-text)", loose: true, tags: loose }] : grouped;
}

function ConfigSection({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return <section className="list-panel status-settings"><div className="panel-header"><div className="panel-title"><h3>{title}</h3><p>{note}</p></div></div>{children}</section>;
}

export function ConfigRow({ name, color, marker, metadata, isDefault, index, count, move, moveRelative, edit, remove, className = "", reorderId = String(index), reorderScope = "configuration", showColor = true, nameColor, inlineMetadata = false, actionLayout }: { name: string; color: string; marker?: ReactNode; metadata: string[]; isDefault?: boolean; index: number; count: number; move?: (direction: -1 | 1) => void; moveRelative?: (draggedId: string, targetId: string, placement: "before" | "after") => void; edit: () => void; remove?: () => void; className?: string; reorderId?: string; reorderScope?: string; showColor?: boolean; nameColor?: string; inlineMetadata?: boolean; actionLayout?: "priority" | "status" }) {
  const [dragging, setDragging] = useState(false);
  const [dragOver, setDragOver] = useState<"before" | "after" | null>(null);
  const reorderWithKeyboard = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowUp" && index > 0) { event.preventDefault(); move?.(-1); }
    if (event.key === "ArrowDown" && index < count - 1) { event.preventDefault(); move?.(1); }
  };
  return <div className={`status-row ${className} ${showColor ? "" : "status-row--without-swatch"} ${actionLayout ? `status-row--${actionLayout}-action-grid` : ""} ${dragging ? "dragging" : ""} ${dragOver ? `drop-${dragOver}` : ""}`} onDragOver={(event) => { if (!move) return; event.preventDefault(); const bounds = event.currentTarget.getBoundingClientRect(); setDragOver(event.clientY >= bounds.top + bounds.height / 2 ? "after" : "before"); }} onDragLeave={() => setDragOver(null)} onDrop={(event) => { const placement = dragOver ?? "before"; setDragOver(null); if (!move || event.dataTransfer.getData("text/config-scope") !== reorderScope) return; const draggedId = event.dataTransfer.getData("text/config-id"); if (moveRelative && draggedId && draggedId !== reorderId) { moveRelative(draggedId, reorderId, placement); return; } const from = Number(event.dataTransfer.getData("text/config-index")); if (!Number.isFinite(from) || from === index) return; move(from < index ? 1 : -1); }}>
    {move && <button type="button" className="drag-handle" draggable aria-label={`Reorder ${name}`} title="Drag or use the arrow keys to reorder" onDragStart={(event) => { setDragging(true); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/config-index", String(index)); event.dataTransfer.setData("text/config-id", reorderId); event.dataTransfer.setData("text/config-scope", reorderScope); }} onDragEnd={() => setDragging(false)} onKeyDown={reorderWithKeyboard}><GripVertical aria-hidden="true" /></button>}
    {showColor && (marker ? <span className="status-icon-marker" aria-hidden="true">{marker}</span> : <span className="status-swatch status-swatch--plain" style={{ "--status-colour": color } as CSSProperties} aria-hidden="true" />)}
    <div className={`status-row__main ${inlineMetadata ? "status-row__main--inline" : ""}`}><strong style={nameColor ? { color: nameColor } : undefined}>{name}</strong><div className="task-meta">{metadata.map((item) => <span key={item} className="badge">{item}</span>)}{isDefault && <span className="badge success">Default</span>}</div></div>
    <div className="status-row__actions">
      {move && <>
        <button type="button" className="icon-button button ghost status-row__action--up" aria-label={`Move ${name} up`} disabled={index === 0} onClick={() => move(-1)}><ArrowUp aria-hidden="true" /></button>
        <button type="button" className="icon-button button ghost status-row__action--down" aria-label={`Move ${name} down`} disabled={index === count - 1} onClick={() => move(1)}><ArrowDown aria-hidden="true" /></button>
      </>}
      <button type="button" className="icon-button button ghost status-row__action--edit" aria-label={`Edit ${name}`} onClick={edit}><Pencil aria-hidden="true" /></button>
      {remove && <button type="button" className="icon-button button danger status-row__action--delete" aria-label={`Delete ${name}`} onClick={remove}><Trash2 aria-hidden="true" /></button>}
    </div>
    {actionLayout && <CardActionMenu label={`Open actions for ${name}`} actions={[
      ...(move ? [
        { id: "up", label: "Move up", icon: <ArrowUp aria-hidden="true" />, onSelect: () => move(-1) },
        { id: "down", label: "Move down", icon: <ArrowDown aria-hidden="true" />, onSelect: () => move(1) },
      ] : []),
      { id: "edit", label: "Edit", icon: <Pencil aria-hidden="true" />, onSelect: edit },
      ...(remove ? [{ id: "delete", label: "Delete", icon: <Trash2 aria-hidden="true" />, onSelect: remove, danger: true }] : []),
    ]} />}
  </div>;
}

function scopeLabel(scope: string) {
  if (scope === "task") return "Tasks";
  if (scope === "project") return "Projects";
  return "Lists";
}

function DiagnosticGroup({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return <section className="diagnostic-group"><h4>{title}</h4><dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>;
}

import { CSSProperties, useRef, useState } from "react";
import { GripVertical, Tag as TagIcon, X } from "lucide-react";
import { AppData, TagScope, applyMutuallyExclusiveTags, groupedTagsForPicker } from "../../domain";
import { AnchoredOverlay } from "../../core/dialogs/AnchoredOverlay";
import { CircleCheckbox } from "./CircleCheckbox";

export const paletteOptions = [
  { label: "Grapefruit Light", value: "var(--palette-grapefruit-light)" },
  { label: "Bittersweet Light", value: "var(--palette-bittersweet-light)" },
  { label: "Sunflower Light", value: "var(--palette-sunflower-light)" },
  { label: "Grass Light", value: "var(--palette-grass-light)" },
  { label: "Mint Light", value: "var(--palette-mint-light)" },
  { label: "Aqua Light", value: "var(--palette-aqua-light)" },
  { label: "Blue Jeans Light", value: "var(--palette-blue-jeans-light)" },
  { label: "Lavender Light", value: "var(--palette-lavender-light)" },
  { label: "Pink Rose Light", value: "var(--palette-pink-rose-light)" },
  { label: "Medium Grey Light", value: "var(--palette-medium-grey-light)" },
] as const;

export function ColourPicker({ label, value, onChange, allowNone = false, excludeValues = [] }: { label: string; value: string; onChange: (value: string) => void; allowNone?: boolean; excludeValues?: string[] }) {
  return <div className="config-picker"><span className="config-picker__label">{label}</span><div className="color-grid" aria-label={label}>
    {allowNone && <button type="button" className={`swatch ${!value ? "selected" : ""}`} aria-label="No colour" onClick={() => onChange("")} />}
    {paletteOptions.filter((option) => option.value === value || !excludeValues.includes(option.value)).map((option) => <button key={option.value} type="button" className={`swatch ${value === option.value ? "selected" : ""}`} style={{ "--swatch-colour": option.value } as CSSProperties} aria-label={option.label} title={option.label} onClick={() => onChange(option.value)} />)}
  </div></div>;
}

export function ScopeSelector({ value, onChange }: { value: TagScope[]; onChange: (value: TagScope[]) => void }) {
  const scopes: Array<{ id: TagScope; label: string }> = [{ id: "task", label: "Tasks" }, { id: "project", label: "Projects" }, { id: "referenceList", label: "Lists" }];
  return <fieldset className="scope-selector"><legend>Scopes</legend>{scopes.map((scope) => <CircleCheckbox key={scope.id} checked={value.includes(scope.id)} onChange={(checked) => onChange(checked ? [...value, scope.id] : value.filter((id) => id !== scope.id))}>{scope.label}</CircleCheckbox>)}</fieldset>;
}

export function SharedTagPicker({ data, scope, selectedIds, setSelectedIds, emptyText = "No tags available.", enforceExclusiveGroups = true, addLabel = "+ Add", addAriaLabel = "Add tag" }: { data: AppData; scope: TagScope; selectedIds: string[]; setSelectedIds: (ids: string[]) => void; emptyText?: string; enforceExclusiveGroups?: boolean; addLabel?: string; addAriaLabel?: string }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selected = selectedIds.map((id) => data.tags.find((tag) => tag.id === id && !tag.deletedAt && tag.allowedScopes.includes(scope))).filter(Boolean) as AppData["tags"];
  const groups = groupedTagsForPicker(data, scope).map((group) => ({ ...group, tags: group.tags.filter((tag) => !selectedIds.includes(tag.id)) })).filter((group) => group.tags.length);
  return <div className="tag-picker"><div className="tag-wrap"><button ref={triggerRef} type="button" className="button ghost tag-add" aria-label={addAriaLabel} aria-expanded={open} onClick={() => setOpen((value) => !value)}><TagIcon aria-hidden="true" />{addLabel}</button>{selected.map((tag) => <span key={tag.id} className="tag" style={{ "--tag-colour": tag.color } as CSSProperties}>{tag.name}<button type="button" aria-label={`Remove ${tag.name}`} onClick={() => setSelectedIds(selectedIds.filter((id) => id !== tag.id))}><X aria-hidden="true" /></button></span>)}</div>{open && <AnchoredOverlay anchorRef={triggerRef} className="tag-menu anchored-dropdown" onClose={() => setOpen(false)}>{groups.length ? groups.map((group) => <div key={group.group?.id ?? "ungrouped"} className="tag-menu__group">{group.group && <div className="tag-menu__heading">{group.group.name}{group.group.mutuallyExclusive ? <span>Exclusive</span> : null}</div>}{group.tags.map((tag) => <button key={tag.id} type="button" onClick={() => { setSelectedIds(enforceExclusiveGroups ? applyMutuallyExclusiveTags(data, selectedIds, tag.id, scope) : [...selectedIds, tag.id]); setOpen(false); }}>{tag.name}</button>)}</div>) : <span className="inline-note">{emptyText}</span>}</AnchoredOverlay>}</div>;
}

export function ConfigDragHandle() {
  return <span className="drag-handle" aria-hidden="true"><GripVertical /></span>;
}

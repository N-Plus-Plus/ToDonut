import { KeyboardEvent, useId, useMemo, useRef, useState } from "react";
import { Project } from "../../domain";
import { AnchoredOverlay } from "../../core/dialogs/AnchoredOverlay";

export function projectIdForExactTitle(projects: Project[], text: string): string | null {
  const normalised = text.trim().toLocaleLowerCase();
  if (!normalised) return null;
  const matches = projects.filter((project) => project.title.trim().toLocaleLowerCase() === normalised);
  return matches.length === 1 ? matches[0].id : null;
}

export function ProjectCombobox({
  projects,
  text,
  selectedProjectId,
  onTextChange,
  onProjectChange,
  placeholder = "No Project",
}: {
  projects: Project[];
  text: string;
  selectedProjectId: string | null;
  onTextChange: (text: string) => void;
  onProjectChange: (projectId: string | null) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const availableProjects = useMemo(
    () => projects.filter((project) => !project.deletedAt && !project.archivedAt && !project.completedAt),
    [projects],
  );
  const query = text.trim().toLocaleLowerCase();
  const suggestions = availableProjects.filter((project) => !query || project.title.toLocaleLowerCase().includes(query));
  const selectedProject = availableProjects.find((project) => project.id === selectedProjectId);

  function updateText(nextText: string) {
    onTextChange(nextText);
    onProjectChange(projectIdForExactTitle(availableProjects, nextText));
    setActiveIndex(0);
    setOpen(true);
  }

  function choose(project: Project) {
    onTextChange(project.title);
    onProjectChange(project.id);
    setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => suggestions.length ? (index + 1) % suggestions.length : 0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => suggestions.length ? (index + suggestions.length - 1) % suggestions.length : 0);
    } else if (event.key === "Enter" && open && suggestions[activeIndex]) {
      event.preventDefault();
      choose(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return <div className="project-combobox">
    <input
      ref={inputRef}
      className="field"
      style={selectedProject?.color ? { color: selectedProject.color } : undefined}
      role="combobox"
      aria-label="Project"
      aria-autocomplete="list"
      aria-expanded={open}
      aria-controls={listboxId}
      aria-activedescendant={open && suggestions[activeIndex] ? `${listboxId}-${suggestions[activeIndex].id}` : undefined}
      autoComplete="off"
      placeholder={placeholder}
      value={text}
      onFocus={() => setOpen(true)}
      onChange={(event) => updateText(event.target.value)}
      onKeyDown={onKeyDown}
    />
    {open && <AnchoredOverlay anchorRef={inputRef} className="project-combobox__menu anchored-dropdown" matchAnchorWidth onClose={() => setOpen(false)}>
      <div id={listboxId} role="listbox" aria-label="Project suggestions">
        {suggestions.map((project, index) => <button
          id={`${listboxId}-${project.id}`}
          key={project.id}
          type="button"
          role="option"
          aria-selected={project.id === selectedProjectId}
          className={index === activeIndex ? "active" : ""}
          onPointerMove={() => setActiveIndex(index)}
          onClick={() => choose(project)}
          style={project.color ? { color: project.color } : undefined}
        >{project.title}</button>)}
        {suggestions.length === 0 && <p className="project-combobox__empty">No matching Projects</p>}
      </div>
    </AnchoredOverlay>}
  </div>;
}

import { useState } from "react";
import { AppData, Task, TaskMoveDestination, descendants } from "../../domain";
import { Modal } from "../../core/dialogs/Modal";
import { Button } from "../../shared/components/Button";

export function TaskMoveDialog({ data, taskIds, onClose, onMove }: { data: AppData; taskIds: string[]; onClose: () => void; onMove: (destination: TaskMoveDestination) => void }) {
  const selected = taskIds.map((id) => data.tasks.find((task) => task.id === id && !task.deletedAt)).filter(Boolean) as Task[];
  const selectedIds = new Set(selected.map((task) => task.id));
  const roots = selected.filter((task) => !ancestorIds(data, task).some((id) => selectedIds.has(id)));
  const movingIds = new Set(roots.flatMap((task) => [task.id, ...descendants(data, task.id).map((child) => child.id)]));
  const [value, setValue] = useState("inbox");
  const total = movingIds.size;
  const leaves = [...movingIds].filter((id) => !data.tasks.find((task) => task.id === id)?.aggregate).length;
  const destination = parseDestination(value);
  const selectedColor = value.startsWith("area:")
    ? data.areas.find((area) => area.id === value.slice(5))?.color
    : value.startsWith("project:")
      ? data.projects.find((project) => project.id === value.slice(8))?.color
      : undefined;
  return <Modal title={roots.length > 1 ? "Move Tasks" : "Move Task"} onClose={onClose}>
    <div className="move-dialog">
      <p className="inline-note">{total} Task{total === 1 ? "" : "s"} will move, including {leaves} actionable leaf Task{leaves === 1 ? "" : "s"}. Entire subtrees stay together.</p>
      <label className="form-row"><span>Destination</span><select className="field" style={selectedColor ? { color: selectedColor } : undefined} value={value} onChange={(event) => setValue(event.target.value)}>
        <optgroup label="Roots">
          <option value="inbox">Inbox</option>
          <option value="someday">Someday</option>
          {data.areas.filter((area) => !area.deletedAt).sort((a, b) => a.order - b.order).map((area) => <option key={area.id} value={`area:${area.id}`} style={area.color ? { color: area.color } : undefined}>Area: {area.title}</option>)}
          {data.projects.filter((project) => !project.deletedAt && !project.archivedAt && !project.completedAt).sort((a, b) => a.order - b.order).map((project) => <option key={project.id} value={`project:${project.id}`} style={project.color ? { color: project.color } : undefined}>Project: {project.title}</option>)}
        </optgroup>
      </select></label>
      <div className="modal-actions"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={() => onMove(destination)}>Move</Button></div>
    </div>
  </Modal>;
}

function parseDestination(value: string): TaskMoveDestination {
  if (value.startsWith("project:")) return { type: "root", location: { type: "project", projectId: value.slice(8) } };
  if (value.startsWith("area:")) return { type: "root", location: { type: "area", areaId: value.slice(5) } };
  return { type: "root", location: value === "someday" ? { type: "someday" } : { type: "inbox" } };
}

function ancestorIds(data: AppData, task: Task): string[] {
  const result: string[] = [];
  let parent = task.parentTaskId ? data.tasks.find((candidate) => candidate.id === task.parentTaskId) : null;
  while (parent) {
    result.push(parent.id);
    parent = parent.parentTaskId ? data.tasks.find((candidate) => candidate.id === parent!.parentTaskId) : null;
  }
  return result;
}

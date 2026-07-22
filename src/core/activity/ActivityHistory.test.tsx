import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createActivity } from "../../domain";
import { createSeedData } from "../../seed";
import { ActivityHistory } from "./ActivityHistory";

describe("ActivityHistory", () => {
  afterEach(() => cleanup());

  it("renders old and new entity ids as display names", () => {
    const data = createSeedData();
    const personal = { ...data.areas[0], id: "area_personal", title: "Personal" };
    const social = { ...data.areas[0], id: "area_social", title: "Social" };
    const project = { ...data.projects[0], areaId: personal.id };
    const event = createActivity("project", project.id, "moved", "Project Area changed", personal.id, social.id);
    const fixture = { ...data, areas: [personal, social], projects: [project], activity: [event] };

    render(<ActivityHistory data={fixture} entityKind="project" entityId={project.id} showHeading={false} />);

    expect(screen.getByText("Personal")).toBeInTheDocument();
    expect(screen.getByText("Social")).toBeInTheDocument();
    expect(screen.queryByText(personal.id)).not.toBeInTheDocument();
    expect(screen.queryByText(social.id)).not.toBeInTheDocument();
  });

  it("renders arrays and structured old/new values without raw database keys", () => {
    const data = createSeedData();
    const tag = data.tags[0];
    const task = data.tasks[0];
    const event = createActivity("task", task.id, "tagsChanged", "Task tags changed", [], { tagIds: [tag.id], statusId: data.statuses[0].id });
    const fixture = { ...data, activity: [event] };

    render(<ActivityHistory data={fixture} entityKind="task" entityId={task.id} showHeading={false} />);

    expect(screen.getByText(`Tags: ${tag.name}; Status: ${data.statuses[0].name}`)).toBeInTheDocument();
    expect(screen.queryByText(tag.id)).not.toBeInTheDocument();
    expect(screen.queryByText(data.statuses[0].id)).not.toBeInTheDocument();
    expect(screen.queryByText(/tagIds/)).not.toBeInTheDocument();
    expect(screen.queryByText(/statusId/)).not.toBeInTheDocument();
  });
});

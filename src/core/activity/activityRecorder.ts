import { ActivityEvent, EntityKind, createActivity } from "../../domain";

export function activityCreated(entityKind: EntityKind, entityId: string, summary: string): ActivityEvent {
  return createActivity(entityKind, entityId, "created", summary);
}

export function activityUndo(entityKind: EntityKind, entityId: string, summary: string, operationId?: string): ActivityEvent {
  return { ...createActivity(entityKind, entityId, "undo", summary, null, { operationId }) };
}

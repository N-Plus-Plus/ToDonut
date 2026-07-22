export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length || from === to) return items;
  const next = [...items];
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
}

export function moveId(ids: string[], id: string, direction: -1 | 1): string[] {
  const index = ids.indexOf(id);
  return moveItem(ids, index, index + direction);
}

export function moveIdBefore(ids: string[], id: string, targetId: string): string[] {
  const from = ids.indexOf(id);
  const to = ids.indexOf(targetId);
  return moveItem(ids, from, from < to ? to - 1 : to);
}

export function nextIntegerOrder(existing: Array<{ order: number }>): number {
  return existing.reduce((max, item) => Math.max(max, item.order), 0) + 1;
}

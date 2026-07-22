import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { FeedbackStore } from "./feedbackStore";
import { feedbackDurationMs } from "./feedbackTypes";
import { FeedbackProvider, useFeedbackMessages, useFeedbackStore } from "./FeedbackProvider";
import { FeedbackHost } from "./FeedbackHost";

function StoreProbe({ onStore, onSnapshot }: { onStore?: (store: FeedbackStore) => void; onSnapshot?: (snapshot: ReturnType<FeedbackStore["snapshot"]>) => void }) {
  const store = useFeedbackStore();
  const snapshot = useFeedbackMessages();
  onStore?.(store);
  onSnapshot?.(snapshot);
  return null;
}

describe("feedback store", () => {
  it("returns the same snapshot reference until feedback state changes", () => {
    const store = new FeedbackStore();
    const initial = store.snapshot();

    expect(store.snapshot()).toBe(initial);
    store.show({ tone: "success", message: "Saved" });
    const added = store.snapshot();
    expect(added).not.toBe(initial);
    expect(store.snapshot()).toBe(added);
    store.dismiss(added.messages[0].id);
    const dismissed = store.snapshot();
    expect(dismissed).not.toBe(added);
    expect(store.snapshot()).toBe(dismissed);
  });

  it("does not notify or replace the snapshot for no-op operations", () => {
    const store = new FeedbackStore();
    const listener = vi.fn();
    store.subscribe(listener);
    const initial = store.snapshot();

    store.dismiss("missing");
    store.clearRouteScoped();
    store.clearAll();

    expect(store.snapshot()).toBe(initial);
    expect(listener).not.toHaveBeenCalled();
  });

  it("subscribes and unsubscribes listeners", () => {
    const store = new FeedbackStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.show({ tone: "info", message: "One" });
    unsubscribe();
    store.show({ tone: "info", message: "Two" });

    expect(listener).toHaveBeenCalledOnce();
  });

  it("deduplicates messages and clears route scoped feedback", () => {
    const store = new FeedbackStore();
    store.show({ tone: "success", message: "Moved to Trash", dedupeKey: "trash", scope: "route" });
    store.show({ tone: "success", message: "Moved to Trash", dedupeKey: "trash", scope: "route" });
    store.show({ tone: "info", message: "Export created", scope: "global" });
    expect(store.snapshot().messages).toHaveLength(2);
    store.clearRouteScoped();
    expect(store.snapshot().messages.map((message) => message.message)).toEqual(["Export created"]);
  });

  it("only emits route cleanup when route-scoped messages exist", () => {
    const store = new FeedbackStore();
    const listener = vi.fn();
    store.show({ tone: "info", message: "Export created", scope: "global" });
    const beforeCleanup = store.snapshot();
    store.subscribe(listener);

    store.clearRouteScoped();
    expect(store.snapshot()).toBe(beforeCleanup);
    expect(listener).not.toHaveBeenCalled();

    store.show({ tone: "success", message: "Moved to Trash", scope: "route" });
    listener.mockClear();
    store.clearRouteScoped();

    expect(listener).toHaveBeenCalledOnce();
    expect(store.snapshot().messages.map((message) => message.message)).toEqual(["Export created"]);
  });

  it("bounds the visible queue length", () => {
    const store = new FeedbackStore(2);
    store.show({ tone: "info", message: "One" });
    store.show({ tone: "info", message: "Two" });
    store.show({ tone: "info", message: "Three" });

    expect(store.snapshot().messages.map((message) => message.message)).toEqual(["Two", "Three"]);
  });

  it("supports action execution and explicit dismissal", async () => {
    const action = vi.fn();
    const store = new FeedbackStore();
    const message = store.show({ tone: "info", message: "List item deleted", action: { label: "Undo", run: action } });
    await message.action?.run();
    store.dismiss(message.id);
    expect(action).toHaveBeenCalledOnce();
    expect(store.snapshot().messages).toEqual([]);
  });

  it("maps automatic dismissal durations", () => {
    expect(feedbackDurationMs("standard")).toBe(2500);
    expect(feedbackDurationMs("short")).toBe(2500);
    expect(feedbackDurationMs("long")).toBe(2500);
    expect(feedbackDurationMs("persistent")).toBeNull();
  });

  it("mounts FeedbackHost without an external-store update loop", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(<FeedbackProvider><FeedbackHost /></FeedbackProvider>);

    expect(document.querySelector(".feedback-live")).toBeTruthy();
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it("expires a timed message once", () => {
    vi.useFakeTimers();
    const providerStoreSnapshots: FeedbackStore[] = [];
    render(<FeedbackProvider><StoreProbe onStore={(providedStore) => providerStoreSnapshots.push(providedStore)} /><FeedbackHost /></FeedbackProvider>);
    const providerStore = providerStoreSnapshots.at(-1)!;
    const providerListener = vi.fn();
    providerStore.subscribe(providerListener);
    act(() => {
      providerStore.show({ tone: "info", message: "Short", duration: 25 });
    });

    act(() => {
      vi.advanceTimersByTime(25);
    });

    expect(providerStore.snapshot().messages).toEqual([]);
    expect(providerListener).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("keeps the feedback store instance stable across provider rerenders", () => {
    const stores: FeedbackStore[] = [];
    const snapshots: ReturnType<FeedbackStore["snapshot"]>[] = [];
    const view = render(<FeedbackProvider><StoreProbe onStore={(store) => stores.push(store)} onSnapshot={(snapshot) => snapshots.push(snapshot)} /></FeedbackProvider>);
    view.rerender(<FeedbackProvider><StoreProbe onStore={(store) => stores.push(store)} onSnapshot={(snapshot) => snapshots.push(snapshot)} /></FeedbackProvider>);

    expect(stores[1]).toBe(stores[0]);
    expect(snapshots[1]).toBe(snapshots[0]);
  });

  it("renders accessible live announcements and actions", async () => {
    const action = vi.fn();
    const stores: FeedbackStore[] = [];
    render(<FeedbackProvider><StoreProbe onStore={(store) => stores.push(store)} /><FeedbackHost /></FeedbackProvider>);

    act(() => {
      stores[0].show({ tone: "info", message: "List item deleted", action: { label: "Undo", run: action } });
    });

    screen.getByRole("status");
    await act(async () => {
      screen.getByRole("button", { name: "Undo" }).click();
    });
    expect(action).toHaveBeenCalledOnce();
    expect(stores[0].snapshot().messages).toEqual([]);
  });
});

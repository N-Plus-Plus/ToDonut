import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { createSeedData } from "../../seed";
import { getSupabaseBrowserClient, SupabaseProductionProvider } from "./persistence";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {},
    channel: vi.fn(),
    rpc: vi.fn(),
    removeChannel: vi.fn(),
  })),
}));

describe("Supabase browser client singleton", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockClear();
    globalThis.__todonutSupabaseBrowserClient = undefined;
  });

  it("reuses one configured browser client for repeated access", () => {
    const first = getSupabaseBrowserClient("https://example.supabase.co", "publishable-key-value-with-length");
    const second = getSupabaseBrowserClient("https://example.supabase.co", "publishable-key-value-with-length");

    expect(second).toBe(first);
    expect(createClient).toHaveBeenCalledOnce();
    expect(createClient).toHaveBeenCalledWith("https://example.supabase.co", "publishable-key-value-with-length", {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "todonut.supabase.auth",
      },
    });
  });

  it("shares the client across production provider instances", () => {
    new SupabaseProductionProvider("https://example.supabase.co", "publishable-key-value-with-length");
    new SupabaseProductionProvider("https://example.supabase.co", "publishable-key-value-with-length");

    expect(createClient).toHaveBeenCalledOnce();
  });

  it("sends the exact named arguments from the authoritative RPC signature", async () => {
    const provider = new SupabaseProductionProvider("https://example.supabase.co", "publishable-key-value-with-length");
    const client = vi.mocked(createClient).mock.results[0].value;
    vi.mocked(client.rpc).mockResolvedValue({ data: { snapshot: {}, canonicalRevision: 8 }, error: null });

    await provider.replace({ next: {} as never, expectedRevision: 7, operationId: "rpc-operation", expectedVersions: new Map([["task-1", 3]]) });

    expect(client.rpc).toHaveBeenCalledWith("todonut_replace_snapshot", {
      next_snapshot: {},
      expected_revision: 7,
      operation_id: "rpc-operation",
      expected_versions: { "task-1": 3 },
    });
  });

  it("persists the one-off cleanup when a stored snapshot has invalid Tag assignments", async () => {
    const provider = new SupabaseProductionProvider("https://example.supabase.co", "publishable-key-value-with-length");
    const client = vi.mocked(createClient).mock.results[0].value;
    const seed = createSeedData();
    const tag = seed.tags[0];
    const legacy = {
      ...seed,
      tags: seed.tags.map((candidate) => candidate.id === tag.id ? { ...candidate, allowedScopes: ["project"] } : candidate),
      tasks: seed.tasks.map((task, index) => index === 0 ? { ...task, tagIds: [tag.id] } : task),
    };
    vi.mocked(client.rpc)
      .mockResolvedValueOnce({ data: { snapshot: legacy, canonicalRevision: 7 }, error: null })
      .mockResolvedValueOnce({ data: { snapshot: legacy, canonicalRevision: 8 }, error: null });

    await provider.load();

    const calls = vi.mocked(client.rpc).mock.calls;
    expect(calls[0][0]).toBe("todonut_get_snapshot");
    expect(calls[1][0]).toBe("todonut_replace_snapshot");
    expect(calls[1][1]).toMatchObject({ expected_revision: 7, expected_versions: {} });
    expect((calls[1][1] as { next_snapshot: typeof seed }).next_snapshot.tasks[0].tagIds).toEqual([]);
  });
});

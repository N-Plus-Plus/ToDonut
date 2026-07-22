import { AuthChangeEvent, createClient, SupabaseClient, User } from "@supabase/supabase-js";
import { AppData, CollectionName, MutableRecord, migrateAppData } from "../../domain";
import { createSeedData } from "../../seed";

export class ConflictError extends Error { constructor(public readonly entityId: string, public readonly currentRevision?: number) { super("A newer saved version exists. Your attempted change was not saved, and current server data was not overwritten."); this.name = "ConflictError"; } }
export type SubscriptionState = "idle" | "connecting" | "connected" | "disconnected" | "error";
export interface ProviderDiagnostics { provider: PersistenceProvider["backendProvider"]; label: string; productionReady: boolean; configured: boolean; sync: "not-started" | "loading" | "ready" | "error"; connection: SubscriptionState; lastSuccessfulSyncAt: string | null; details: Record<string, string | boolean | number | null> }
export interface AuthState { required: boolean; ready: boolean; userEmail: string | null; error: string | null; recovery?: boolean }
export interface CanonicalSnapshot { data: AppData; canonicalRevision: number }
export interface ReplaceSnapshotRequest { next: AppData; expectedRevision: number; operationId: string; expectedVersions?: Map<string, number> }
export interface PersistenceProvider { readonly label: string; readonly productionReady: boolean; readonly backendProvider: "local-development" | "supabase" | "missing"; diagnostics(): ProviderDiagnostics; load(): Promise<CanonicalSnapshot>; replace(request: ReplaceSnapshotRequest): Promise<CanonicalSnapshot>; subscribe?(onSnapshot: (snapshot: CanonicalSnapshot) => void, onStatus?: (state: SubscriptionState) => void): () => void; getAuthState?(): Promise<AuthState>; signInWithPassword?(email: string, password: string): Promise<AuthState>; updatePassword?(password: string): Promise<AuthState>; signOut?(): Promise<AuthState>; onAuthStateChange?(callback: (state: AuthState) => void): () => void }

const STORAGE_KEY = "todonut.dev.local-data";
const REVISION_KEY = "todonut.dev.canonical-revision";
const OPERATIONS_KEY = "todonut.dev.snapshot-operations";
const SUPABASE_AUTH_STORAGE_KEY = "todonut.supabase.auth";

declare global {
  var __todonutSupabaseBrowserClient: { key: string; client: SupabaseClient } | undefined;
}

export class LocalDevelopmentProvider implements PersistenceProvider {
  readonly label = "Development localStorage adapter";
  readonly productionReady = false;
  readonly backendProvider = "local-development" as const;
  private lastSuccessfulSyncAt: string | null = null;
  diagnostics(): ProviderDiagnostics { return { provider: this.backendProvider, label: this.label, productionReady: false, configured: true, sync: this.lastSuccessfulSyncAt ? "ready" : "not-started", connection: "idle", lastSuccessfulSyncAt: this.lastSuccessfulSyncAt, details: { storageKey: STORAGE_KEY, revisionKey: REVISION_KEY, developmentOnly: true, checkpointCount: 0 } }; }
  async load(): Promise<CanonicalSnapshot> { const raw = localStorage.getItem(STORAGE_KEY); const data = raw ? migrateAppData(JSON.parse(raw) as Partial<AppData>) : migrateAppData(createSeedData()); const revision = Number(localStorage.getItem(REVISION_KEY) ?? "1") || 1; localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); localStorage.setItem(REVISION_KEY, String(revision)); this.lastSuccessfulSyncAt = new Date().toISOString(); return { data, canonicalRevision: revision }; }
  async replace(request: ReplaceSnapshotRequest): Promise<CanonicalSnapshot> {
    const operations = JSON.parse(localStorage.getItem(OPERATIONS_KEY) ?? "{}") as Record<string, { request: string; result: CanonicalSnapshot }>;
    const requestIdentity = JSON.stringify({ next: request.next, expectedRevision: request.expectedRevision, expectedVersions: Object.fromEntries(request.expectedVersions ?? new Map<string, number>()) });
    const prior = operations[request.operationId];
    if (prior) {
      if (prior.request !== requestIdentity) throw new Error("Operation ID was reused with a different snapshot request.");
      return prior.result;
    }
    const current = await this.load();
    if (!Number.isFinite(request.expectedRevision)) throw new ConflictError("snapshot", current.canonicalRevision);
    if (request.expectedRevision !== current.canonicalRevision) throw new ConflictError("snapshot", current.canonicalRevision);
    for (const [id, expected] of request.expectedVersions ?? new Map<string, number>()) {
      const stored = findMutableRecord(current.data, id);
      if (stored && stored.version !== expected) throw new ConflictError(id, current.canonicalRevision);
    }
    const confirmedRevision = current.canonicalRevision + 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(request.next));
    localStorage.setItem(REVISION_KEY, String(confirmedRevision));
    const result = { data: request.next, canonicalRevision: confirmedRevision };
    localStorage.setItem(OPERATIONS_KEY, JSON.stringify({ [request.operationId]: { request: requestIdentity, result } }));
    this.lastSuccessfulSyncAt = new Date().toISOString();
    return result;
  }
}

export class SupabaseProductionProvider implements PersistenceProvider {
  readonly label = "Supabase production adapter";
  readonly productionReady = true;
  readonly backendProvider = "supabase" as const;
  private readonly client: SupabaseClient;
  private lastSuccessfulSyncAt: string | null = null;
  private connection: SubscriptionState = "idle";
  constructor(url: string, publishableKey: string) { this.client = getSupabaseBrowserClient(url, publishableKey); }
  diagnostics(): ProviderDiagnostics { return { provider: this.backendProvider, label: this.label, productionReady: true, configured: true, sync: this.lastSuccessfulSyncAt ? "ready" : "not-started", connection: this.connection, lastSuccessfulSyncAt: this.lastSuccessfulSyncAt, details: { authSessionStoredBySupabase: true, realtimeChannel: "todonut-domain", checkpointCount: 0 } }; }
  private stateFromUser(user: User | null, error: string | null = null, event?: AuthChangeEvent): AuthState { return { required: true, ready: Boolean(user), userEmail: user?.email ?? null, error, recovery: event === "PASSWORD_RECOVERY" || undefined }; }
  async getAuthState(): Promise<AuthState> { const { data, error } = await this.client.auth.getUser(); return this.stateFromUser(data.user, error?.message ?? null); }
  async signInWithPassword(email: string, password: string): Promise<AuthState> { const { data, error } = await this.client.auth.signInWithPassword({ email, password }); if (error) return this.stateFromUser(null, error.message); return this.stateFromUser(data.user); }
  async updatePassword(password: string): Promise<AuthState> { const { data, error } = await this.client.auth.updateUser({ password }); if (error) return this.stateFromUser(null, error.message, "PASSWORD_RECOVERY"); return this.stateFromUser(data.user); }
  async signOut(): Promise<AuthState> { const { error } = await this.client.auth.signOut(); return { required: true, ready: false, userEmail: null, error: error?.message ?? null }; }
  onAuthStateChange(callback: (state: AuthState) => void): () => void { const { data } = this.client.auth.onAuthStateChange((event, session) => callback(this.stateFromUser(session?.user ?? null, null, event))); return () => data.subscription.unsubscribe(); }
  async load(): Promise<CanonicalSnapshot> { const { data, error } = await this.client.rpc("todonut_get_snapshot"); if (error) throw new Error(error.message); this.lastSuccessfulSyncAt = new Date().toISOString(); return snapshotFromRpc(data); }
  async replace(request: ReplaceSnapshotRequest): Promise<CanonicalSnapshot> { const { data, error } = await this.client.rpc("todonut_replace_snapshot", { next_snapshot: request.next, expected_revision: request.expectedRevision, operation_id: request.operationId, expected_versions: Object.fromEntries(request.expectedVersions ?? new Map<string, number>()) }); if (error) { if (error.message.toLowerCase().includes("conflict")) throw new ConflictError("snapshot"); throw new Error(error.message); } this.lastSuccessfulSyncAt = new Date().toISOString(); return snapshotFromRpc(data); }
  subscribe(onSnapshot: (snapshot: CanonicalSnapshot) => void, onStatus?: (state: SubscriptionState) => void): () => void { this.connection = "connecting"; onStatus?.(this.connection); const channel = this.client.channel("todonut-domain").on("postgres_changes", { event: "*", schema: "public", table: "app_snapshots" }, async () => onSnapshot(await this.load())).subscribe((status) => { this.connection = status === "SUBSCRIBED" ? "connected" : status === "CHANNEL_ERROR" ? "error" : "connecting"; onStatus?.(this.connection); }); return () => { this.connection = "disconnected"; onStatus?.(this.connection); void this.client.removeChannel(channel); }; }
}

export function getSupabaseBrowserClient(url: string, publishableKey: string): SupabaseClient {
  const key = `${url}\u0000${publishableKey}\u0000${SUPABASE_AUTH_STORAGE_KEY}`;
  if (globalThis.__todonutSupabaseBrowserClient?.key === key) return globalThis.__todonutSupabaseBrowserClient.client;
  const client = createClient(url, publishableKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: SUPABASE_AUTH_STORAGE_KEY } });
  globalThis.__todonutSupabaseBrowserClient = { key, client };
  return client;
}

class MissingProductionProvider implements PersistenceProvider {
  readonly label = "No production persistence provider configured";
  readonly productionReady = false;
  readonly backendProvider = "missing" as const;
  diagnostics(): ProviderDiagnostics { return { provider: this.backendProvider, label: this.label, productionReady: false, configured: false, sync: "error", connection: "error", lastSuccessfulSyncAt: null, details: { requiredEnv: "VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY", localStorageFallback: false } }; }
  async load(): Promise<CanonicalSnapshot> { throw new Error("No production persistence provider is configured. Add Supabase public environment values before treating this deployment as canonical."); }
  async replace(): Promise<CanonicalSnapshot> { throw new Error("No production persistence provider is configured. Changes cannot be saved in production."); }
}

function validSupabaseConfig(url: string | undefined, key: string | undefined): boolean {
  if (!url || !key) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname.endsWith(".supabase.co") && key.trim().length > 20;
  } catch {
    return false;
  }
}

export function createPersistenceProvider(): PersistenceProvider { const url = import.meta.env.VITE_SUPABASE_URL as string | undefined; const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined; if (validSupabaseConfig(url, key)) return new SupabaseProductionProvider(url!, key!); if (url || key || (import.meta.env.PROD && import.meta.env.VITE_ALLOW_DEV_PERSISTENCE !== "true")) return new MissingProductionProvider(); return new LocalDevelopmentProvider(); }
export function findMutableRecord(data: AppData, id: string): MutableRecord | undefined { const collections: CollectionName[] = ["areas", "projects", "tasks", "referenceLists", "referenceListEntries", "statuses", "priorities", "tags", "tagGroups", "quantifierDefinitions", "recurrenceRules", "recurrenceGenerations", "viewPreferences"]; for (const collection of collections) { const match = data[collection].find((record) => record.id === id); if (match) return match; } return undefined; }

function snapshotFromRpc(value: unknown): CanonicalSnapshot {
  if (value === null || value === undefined) return { data: migrateAppData(createSeedData()), canonicalRevision: 0 };
  const payload = value as { snapshot?: Partial<AppData>; canonicalRevision?: number; canonical_revision?: number };
  const data = payload?.snapshot ? payload.snapshot : value as Partial<AppData>;
  const revision = Number(payload?.canonicalRevision ?? payload?.canonical_revision ?? 1);
  return { data: migrateAppData(data), canonicalRevision: Number.isFinite(revision) && revision >= 0 ? revision : 0 };
}

import { ExportEnvelope } from "./domain";

export interface AuthPolicy { maxFailedAttempts: number; lockoutMinutes: number }
export interface TrustedSessionState { authenticated: boolean; trustedDevice: boolean; requiresAdditionalSecret: boolean }
export const defaultAuthPolicy: AuthPolicy = { maxFailedAttempts: 5, lockoutMinutes: 15 };
export function trustedSessionState(sessionExists: boolean, trustedDevice: boolean): TrustedSessionState { return { authenticated: sessionExists && trustedDevice, trustedDevice, requiresAdditionalSecret: !trustedDevice }; }
export function shouldLockOut(failedAttempts: number, policy = defaultAuthPolicy): boolean { return failedAttempts >= policy.maxFailedAttempts; }
export function redactRecoveryCodes<T extends object>(value: T): T { return redactKeys(value, ["recoveryCode", "recoveryCodes", "recoveryCodeHashes"]) as T; }
export function exportExcludesSecrets(envelope: ExportEnvelope): boolean { const serialized = JSON.stringify(envelope).toLowerCase(); return !["password", "totp", "recoverycode", "recovery_code", "access_token", "refresh_token", "service_role", "private_api_key"].some((token) => serialized.includes(token)); }
export function sanitiseDiagnostics<T extends object>(diagnostics: T, extras: Record<string, unknown> = {}): T { return redactKeys({ ...diagnostics, ...extras }, ["token", "secret", "password", "totp", "recovery", "anonKey", "serviceRoleKey", "accessToken", "refreshToken", "service_role"]) as T; }
function redactKeys(value: unknown, blocked: string[]): unknown { if (Array.isArray(value)) return value.map((item) => redactKeys(item, blocked)); if (!value || typeof value !== "object") return value; return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, blocked.some((blockedKey) => key.toLowerCase().includes(blockedKey.toLowerCase())) ? "[redacted]" : redactKeys(item, blocked)])); }

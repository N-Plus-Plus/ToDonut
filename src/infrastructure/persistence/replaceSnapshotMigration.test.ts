import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = join(process.cwd(), "supabase/migrations/0005_fix_snapshot_operation_cleanup.sql");
const migration = readFileSync(migrationPath, "utf8");

describe("replace snapshot forward migration", () => {
  it("exists and preserves the authoritative four-argument named signature", () => {
    expect(existsSync(migrationPath)).toBe(true);
    expect(migration).toMatch(/create or replace function public\.todonut_replace_snapshot\(\s*next_snapshot jsonb,\s*expected_revision bigint,\s*operation_id text,\s*expected_versions jsonb default '\{\}'::jsonb\s*\)/s);
  });

  it("copies arguments to unambiguous locals and uses an explicit idempotency alias", () => {
    expect(migration).not.toContain("replace_snapshot.");
    expect(migration).toContain("v_next_snapshot jsonb := next_snapshot");
    expect(migration).toContain("v_expected_revision bigint := expected_revision");
    expect(migration).toContain("v_operation_id text := operation_id");
    expect(migration).toContain("v_expected_versions jsonb := expected_versions");
    expect(migration).toMatch(/select aso\.\*\s+into prior_operation\s+from public\.app_snapshot_operations as aso\s+where aso\.operation_id = v_operation_id/s);
  });

  it("retains revision, entity-version, idempotency, atomic update, and one-increment guards", () => {
    const updatePosition = migration.indexOf("update public.app_snapshots");

    expect(migration).toContain("for update");
    expect(migration).toContain("current_revision <> v_expected_revision");
    expect(migration).toContain("actual_version <> expected.value::bigint");
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration.match(/version = aps\.version \+ 1/g)).toHaveLength(1);
    expect(migration).toContain("return prior_operation.result");
    expect(migration.indexOf("raise exception 'conflict: expected canonical revision is required'")).toBeLessThan(updatePosition);
    expect(migration.indexOf("raise exception 'conflict: stale canonical revision'")).toBeLessThan(updatePosition);
    expect(migration.indexOf("raise exception 'conflict: stale version")).toBeLessThan(updatePosition);
    expect(migration.indexOf("raise exception 'operation id was reused")).toBeLessThan(updatePosition);
    expect(migration).toContain("security definer\nset search_path = public");
  });

  it("retains recent operation replay records with a safe cleanup predicate", () => {
    expect(migration).not.toMatch(/delete from public\.app_snapshot_operations\s*;/i);
    expect(migration).toMatch(/delete from public\.app_snapshot_operations as stale\s+where stale\.operation_id in/s);
    expect(migration).toMatch(/limit 16/s);
    expect(migration.indexOf("insert into public.app_snapshot_operations as aso")).toBeLessThan(
      migration.indexOf("delete from public.app_snapshot_operations as stale"),
    );
    expect(migration).toContain("order by retained.created_at desc, retained.operation_id desc");
    expect(migration).toContain("return prior_operation.result");
  });
});

<!-- Document ceiling: 90 lines; 5,500 characters including metadata. On overflow, apply AGENTS.md decision rule. -->
# Project-local Codex skills and configuration


Create a Codex skill **only after a specific repeated or complex specialist workflow justifies it**. Put its entry point at `.agents/skills/<skill-name>/SKILL.md`; give it a short description, clear activation boundary, concrete steps and links to supporting reference files or scripts **only if needed**. Keep skills small and focused, test that Codex can find/use the skill, and remove or revise instructions when the workflow changes. Do not duplicate standing policy from `AGENTS.md` or automatically create an elaborate toolchain.

> **Repository instruction precedence:** `AGENTS.md` outranks task prompts and all other repository documents. When a prompt contradicts `AGENTS.md`, follow `AGENTS.md` and report the conflict. If a prompt conflicts with another active document, or two other active documents conflict, stop the affected work and ask the owner. Do not choose by recency or specificity. Higher-level platform instructions remain unaffected.

When a new skill is genuinely needed, add a one-line entry here explaining its purpose and when to invoke it; update `AGENTS.md`'s routing only if the new skill needs a distinct topic-level pointer. Keep skill instructions scoped to their own workflow. More-specific repository agent instructions may be introduced only where their authority and interaction with the root are understood.

Project-specific Codex configuration may be added under the supported `.codex/` layout when it solves a concrete execution need. Prefer established Codex defaults otherwise; do not add config, skills, MCP integrations or third-party services as starter ceremony.

## Current skills

None. This document describes how to create and maintain them, not a requirement to prebuild one.

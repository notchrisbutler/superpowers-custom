# Opt-In Superpowers Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `using-superpowers` route requests to full flow, quick flow, or no Superpowers unless invoked later.

**Architecture:** Keep OpenCode plugin injection unchanged. The plugin dynamically loads `skills/using-superpowers/SKILL.md`, so routing behavior belongs in skill text. Downstream skills narrow activation so quick-flow and no-Superpowers work do not automatically trigger full brainstorming, TDD, or root-cause workflows.

**Tech Stack:** Markdown skill files, OpenCode skill frontmatter, local harness docs.

---

## File Structure

- Modify `skills/using-superpowers/SKILL.md`: Rich router with dotgraph, route matrix, quick flow, no-Superpowers rules, three-option route question, escalation table, red flags, and skill priority.
- Modify `skills/brainstorming/SKILL.md`: Narrow activation to explicit Superpowers brainstorming or clearly design-heavy work while preserving the full brainstorming process once selected.
- Modify `skills/test-driven-development/SKILL.md`: Narrow activation to explicit TDD, full-flow requirements, or high-risk tests-first work while preserving strict TDD once selected.
- Modify `skills/systematic-debugging/SKILL.md`: Narrow activation to explicit root-cause work, complex issues, multi-component issues, or failed prior fixes while preserving strict debugging once selected.
- Modify `README.md`, `.opencode/INSTALL.md`, `CLAUDE.md`, `docs/testing.md`, and `CHANGELOG.md`: Keep user-facing docs aligned with the final routing model and reduce duplicated version/routing details.
- Review package and harness manifests: Keep required literal package names, versions, plugin paths, and hook references where consumers require them.

## Task 1: Rewrite `using-superpowers` Routing

**Files:**
- Modify: `skills/using-superpowers/SKILL.md`

- [x] Replace catch-all skill invocation with an opt-in router.
- [x] Preserve rich skill structure: dotgraph, route matrix, escalation table, red flags, skill priority, and skill type guidance.
- [x] Model exactly three outcomes: full flow, quick flow, no Superpowers.
- [x] Make ask-before-choosing a pending user choice, not a fourth route.
- [x] Ask this three-option route question when unsure:

```markdown
> Which route should I use?
> 1. Full Superpowers flow: brainstorm, TDD, spec/plan, and execution workflow.
> 2. Quick Superpowers flow: quick context gather, code change, and surface-level validation.
> 3. No Superpowers: normal agent behavior for this session unless you invoke Superpowers later.
```

- [x] Allow quick flow to ask up to five focused context questions.
- [x] Prefer the harness's structured user-question tool when available, such as Claude Code `AskUserQuestion` or a local equivalent, with an `Other` option when supported.
- [x] Keep full brainstorming uncapped and governed by the brainstorming skill once selected.

## Task 2: Narrow `brainstorming`

**Files:**
- Modify: `skills/brainstorming/SKILL.md`

- [x] Narrow frontmatter to explicit Superpowers brainstorming or clearly design-heavy work.
- [x] Make the hard gate apply after intentional skill selection.
- [x] Remove broad "every project" and "single-function utility" activation language.
- [x] Preserve checklist and process dotgraph.
- [x] Explicitly exclude quick flow, no-Superpowers work, small reviews, wording edits, simple config tweaks, and bounded code changes unless the user asks for brainstorming.

## Task 3: Narrow `test-driven-development`

**Files:**
- Modify: `skills/test-driven-development/SKILL.md`

- [x] Narrow frontmatter to explicit TDD, full-flow requirements, or high-risk tests-first work.
- [x] Remove auto-trigger language for every feature, bugfix, refactor, or behavior change.
- [x] Respect quick flow and no-Superpowers routing unless the task escalates.
- [x] Preserve the Iron Law, process diagrams, examples, and strict TDD guidance once selected.

## Task 4: Narrow `systematic-debugging`

**Files:**
- Modify: `skills/systematic-debugging/SKILL.md`

- [x] Narrow frontmatter to explicit debugging/root-cause work, complex or non-reproducible issues, multi-component issues, or prior failed fixes.
- [x] Remove auto-trigger language for every bug, test failure, or unexpected behavior.
- [x] Allow quick flow for obvious localized fixes and no Superpowers when the user asks for ordinary agent behavior.
- [x] Preserve the four phases, examples, and strict root-cause guidance once selected.

## Task 5: Update User-Facing Docs

**Files:**
- Modify: `README.md`
- Modify: `.opencode/INSTALL.md`
- Modify: `CHANGELOG.md`

- [x] Document that Superpowers is opt-in by default.
- [x] Document the three outcomes without duplicating the full route matrix outside `skills/using-superpowers/SKILL.md`.
- [x] Add OpenCode verification prompts for full flow, quick flow, and no-Superpowers behavior.
- [x] Summarize routing changes inside the active `2026.4.30-alpha.1` changelog.

## Task 6: Audit Docs, Package, and Config Surfaces

**Files:**
- Audit: `README.md`, `CHANGELOG.md`, `CLAUDE.md`, `GEMINI.md`, `package.json`, `.version-bump.json`, `.opencode/INSTALL.md`, `.opencode/plugins/superpowers.js`, `.claude-plugin/*`, `.codex-plugin/*`, `.cursor-plugin/*`, `gemini-extension.json`, `hooks/*.json`, `docs/**/*.md`, `skills/**/*.md`

- [x] Remove stale always-on routing language from active skills and user-facing docs.
- [x] Collapse detailed routing docs into `skills/using-superpowers/SKILL.md` as the source of truth.
- [x] Replace exact version examples in docs with `YYYY.M.D-alpha.N` where a concrete version is not required.
- [x] Keep required literal names, versions, paths, and hook references in package and harness manifests.
- [x] Confirm `.opencode/plugins/superpowers.js` dynamically loads `skills/using-superpowers/SKILL.md`, so no JavaScript routing change is required.

## Task 7: Validation

**Files:**
- Read/check only unless validation finds stale wording.

- [x] Run stale routing searches across `skills/`.
- [x] Run stale routing searches across user-facing docs.
- [x] Run `git diff --check`.
- [x] Inspect working tree status.

Validation commands:

```bash
rg 'quick-fix|full workflow or a quick-fix|brainstorming/planning session|skip Superpowers and do a quick-fix|at most one clarifying|one clarifying question|Ask before choosing \\|' skills
rg '1% chance|ABSOLUTELY MUST|before ANY response|Use when starting any conversation|MUST use this before any creative work|Every project goes through this process|Use for ANY technical issue|Use when implementing any feature or bugfix' skills
git diff --check
```

Expected: no stale routing matches in active skills, and no whitespace errors.

## Notes

- `.gitignore` and `.ignore` changes were present during implementation and should be reviewed separately if they are not intended.
- `docs/superpowers/` is currently ignored by `.gitignore`, so spec/plan updates are on disk but not tracked unless the ignore rule changes or files are force-added.

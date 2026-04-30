# Harness Packaging Refresh Design

Date: 2026-04-30

## Problem

SuperDuperPowers ships local-first skills, agents, hooks, and harness manifests for multiple coding-agent environments. The repository currently supports OpenCode, Claude Code, Codex, Cursor, and Gemini, and documents Copilot compatibility through tool mappings and shared hooks. Upstream harness docs have moved since the first alpha packaging pass, especially around Codex plugins, Gemini extensions, Claude Code plugin manifests/hooks, and OpenCode plugin/skill discovery.

The project needs a compatibility refresh that keeps alpha packaging honest: prepare the repo for current harness expectations, improve install and verification steps, and avoid claiming marketplace availability before a v1 non-alpha release.

## Goals

- Bring harness manifests, hooks, and install documentation in line with current public docs for Codex, Copilot, Gemini, Claude Code, OpenCode, and Cursor.
- Keep changes small and reviewable; do not add third-party dependencies or broad release infrastructure.
- Preserve local-first installation paths for alpha users.
- Prepare marketplace metadata where useful, but clearly state that public marketplace distribution is future v1 work.
- Keep shared hook behavior explicit and compatible across Claude Code, Cursor, Copilot-style SDK output, and any documented Gemini/Codex hook consumers.
- Update package file inclusion so shipped artifacts match documented support.

## Non-Goals

- Publishing to any marketplace now.
- Adding MCP servers, app connectors, themes, monitors, policies, or LSP integrations unless a harness requires the metadata for existing behavior.
- Rewriting skills or changing workflow behavior beyond harness-specific setup and routing references.
- Adding dependency installation flows beyond existing shell hook wrappers.
- Guaranteeing support for undocumented Copilot CLI plugin internals; Copilot support should remain explicit where it is based on custom instructions, AGENTS.md behavior, shared hook output, or tool mapping guidance.

## Current Local Surfaces

- `package.json` publishes the local package entrypoint at `.opencode/plugins/superpowers.js` and includes harness directories.
- `.opencode/plugins/superpowers.js` injects the `skills/` path into OpenCode config and prepends the `using-superpowers` bootstrap to the first user message.
- `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` describe Claude Code plugin metadata.
- `.codex-plugin/plugin.json` describes Codex plugin metadata.
- `.cursor-plugin/plugin.json` references shared skills, agents, and Cursor hook config.
- `gemini-extension.json` points Gemini CLI to `GEMINI.md`.
- `hooks/hooks.json`, `hooks/hooks-cursor.json`, `hooks/session-start`, and `hooks/run-hook.cmd` provide shared SessionStart context injection.
- `skills/using-superpowers/references/*-tools.md` maps Claude Code tool names to other harnesses.
- `README.md` and `.opencode/INSTALL.md` document a narrow OpenCode-first install path.

## Upstream Findings

### OpenCode

OpenCode docs currently describe plugin loading through `.opencode/plugins/`, `~/.config/opencode/plugins/`, or the `plugin` array in `opencode.json`. The config docs recommend including `$schema: "https://opencode.ai/config.json"`. OpenCode skill docs require `SKILL.md` frontmatter with `name` and `description`, and discovery supports `.opencode/skills`, `.claude/skills`, and `.agents/skills` locations.

Design implication: keep the existing package plugin entrypoint and update docs/examples to include the schema and current plugin terminology. Verify skill frontmatter compatibility before changing skill files; do not mass-edit skill content unless validation shows missing required fields.

### Claude Code

Claude Code plugin docs support plugin-root `skills/`, `agents/`, `hooks/hooks.json`, and richer manifest fields such as `skills`, `agents`, `hooks`, `repository`, `homepage`, `license`, and `keywords`. Claude Code hooks now document many event types, multiple hook handler types, plugin root variables, and `hookSpecificOutput.additionalContext` for `SessionStart`.

Design implication: keep the plugin root layout, add manifest component paths where useful, and keep `hooks/hooks.json` in the documented plugin hook format. Do not add monitors, themes, MCP, LSP, or settings because this plugin does not need them today.

### Codex

Codex docs now document plugins with `.codex-plugin/plugin.json`, optional `skills/`, `.mcp.json`, `.app.json`, `hooks/hooks.json`, and assets at the plugin root. Codex local marketplace metadata is documented under `.agents/plugins/marketplace.json`, with local plugin sources using `./`-prefixed paths relative to the marketplace root. Codex config includes `[features].codex_hooks`, `features.multi_agent`, and plugin enable state under `~/.codex/config.toml`.

Design implication: update `.codex-plugin/plugin.json` to current manifest conventions and add documentation for local marketplace testing without claiming official publication. If a repo-local marketplace file is added, it should be clearly labeled as a local testing catalog, not a published distribution channel.

### Gemini CLI

Gemini CLI extensions are installed with `gemini extensions install <source> [--ref <ref>]` or linked for local development with `gemini extensions link <path>`. Extensions use `gemini-extension.json` at the root, can bundle `skills/`, `agents/`, `hooks/hooks.json`, and `GEMINI.md`, and use `${extensionPath}`/`${workspacePath}` substitution. Gemini hooks are configured in `hooks/hooks.json` inside the extension, use events such as `SessionStart`, `BeforeTool`, `AfterTool`, and output `hookSpecificOutput.additionalContext` for `SessionStart`.

Design implication: update Gemini install docs and confirm the manifest stays minimal. Do not add Gemini policies or themes. Shared hook config may need either separate Gemini hook JSON or documentation explaining which existing hook config is for Claude/Cursor versus Gemini if event naming differs.

### Copilot

GitHub Copilot docs emphasize repository custom instructions, path-specific `.github/instructions/*.instructions.md`, `AGENTS.md`, and root `CLAUDE.md`/`GEMINI.md` support for AI agents. The current repo has no first-class Copilot plugin manifest, but it does include Copilot tool mapping guidance and shared hook output comments for Copilot CLI-style SDK context.

Design implication: document Copilot as guidance-compatible rather than marketplace/plugin-supported unless a concrete Copilot plugin spec is verified. Keep tool mapping references current and avoid inventing unsupported manifest files.

### Cursor

The repo already ships `.cursor-plugin/plugin.json` and `hooks/hooks-cursor.json`. Cursor was not listed in the initial request but is in scope for this refresh because it is an existing published surface in the repository.

Design implication: audit the Cursor manifest and hook references for consistency with shared paths. Change only what is needed for packaging parity or hook compatibility.

## Proposed Changes

### Manifests And Package Files

- Refresh `.claude-plugin/plugin.json` with documented component paths (`skills`, `agents`, `hooks`) and repository/homepage metadata where helpful.
- Refresh `.codex-plugin/plugin.json` with current Codex component path conventions, interface metadata, and local-first descriptions.
- Audit `.cursor-plugin/plugin.json` for consistent metadata and path references.
- Keep `gemini-extension.json` minimal unless adding fields improves current extension behavior.
- Update `package.json` `files` to include any newly added docs or marketplace metadata required for local testing.

### Hook Compatibility

- Keep `hooks/session-start` as the shared context injection script for Claude Code, Cursor, and Copilot-style SDK output if the current JSON shapes remain valid.
- Keep `hooks/hooks.json` in Claude Code plugin format.
- Keep `hooks/hooks-cursor.json` for Cursor if Cursor still expects lower-case `sessionStart` and `additional_context`.
- Add a separate Gemini hook config only if Gemini needs different event names or command paths; otherwise document that Gemini extension support relies on `GEMINI.md` and skills discovery rather than shared SessionStart hook injection.
- Avoid changing hook semantics beyond output shape/path compatibility.

### Install And Verification Docs

- Expand `README.md` Quick Start into harness-specific subsections for OpenCode, Claude Code, Codex, Gemini CLI, Cursor, and Copilot guidance.
- Update `.opencode/INSTALL.md` with current `$schema` and plugin-array examples.
- Add or update docs for Codex local testing through `.codex-plugin/plugin.json` and optional `.agents/plugins/marketplace.json`.
- Add or update docs for Gemini local testing through `gemini extensions link .` and `gemini extensions install <repo> --ref main`.
- Add verification prompts per harness that check full flow, quick flow, and no-Superpowers routing without requiring marketplace publication.
- State clearly that official marketplace publishing is deferred until a v1 non-alpha release.

### Skill Reference Updates

- Update `skills/using-superpowers/references/codex-tools.md` if current Codex multi-agent or plugin behavior differs from the existing mapping.
- Update `skills/using-superpowers/references/gemini-tools.md` if current Gemini skill activation, hook, or subagent support differs from the existing mapping.
- Update `skills/using-superpowers/references/copilot-tools.md` only where there is verified public behavior; do not claim unsupported plugin capabilities.

### Release Notes

- Add a changelog entry describing harness packaging and install-doc refresh.
- Preserve calendar alpha version posture unless the implementation plan explicitly includes a version bump.

## Data Flow

Install paths remain local-first during alpha:

- OpenCode loads the npm/git package entrypoint and that plugin injects skill discovery plus bootstrap context.
- Claude Code loads plugin components from plugin-root directories and SessionStart hook output injects bootstrap context.
- Codex loads plugin components through a Codex plugin manifest and, for local testing, through a local marketplace catalog or manual plugin browser flow.
- Gemini loads extension context from `GEMINI.md`, discovers bundled skills, and optionally uses extension hooks if a Gemini-specific hook config is added.
- Cursor loads its plugin manifest and Cursor-specific hook config.
- Copilot consumes repository instructions, AGENTS-style guidance, and documented tool mappings; it is not presented as an installable plugin surface yet.

## Error Handling

- Hook scripts must fail softly for optional harnesses. Existing Windows wrapper behavior should remain: if Bash is unavailable, exit successfully and let the plugin continue without hook context injection.
- Docs should include verification prompts that let a user detect missing skill discovery or missing bootstrap injection early.
- Manifest path errors should be caught by JSON validation and, where possible, by harness-specific local test commands.
- If a harness surface is not verifiable locally, the implementation report should state that explicitly.

## Testing And Verification

Targeted validation should include:

- JSON parsing for all manifest and hook JSON files.
- Existing OpenCode tests under `tests/opencode/run-tests.sh` if they remain applicable.
- Shell syntax check for `hooks/session-start` and `hooks/run-hook.cmd` where practical.
- Any existing Claude Code skill tests that do not require unavailable credentials or network.
- Manual or documented verification prompts for Codex, Gemini, Claude Code, Cursor, Copilot, and OpenCode.
- A final diff review to ensure no marketplace publication claim was introduced.

## Open Questions Resolved

- Cursor is included because it is already an existing repo surface.
- Marketplace publication is explicitly out of scope until a v1 non-alpha release.

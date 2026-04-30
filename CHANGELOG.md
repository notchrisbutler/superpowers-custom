# Changelog

## Unreleased

- Refreshed local-first harness packaging metadata for Claude Code, Codex, Cursor, Gemini CLI, and OpenCode
- Added harness-specific install and verification documentation while keeping public marketplace publication deferred until a future v1 non-alpha release
- Updated Codex, Gemini, and Copilot tool mapping references for current local plugin, extension, and guidance-compatible workflows
- Aligned packaged docs, instruction files, tests, and Windows hook wrapper guidance with the shipped harness artifacts

## 2026.4.30-alpha.1

Initial alpha release of SuperDuperPowers.

- Reworked Superpowers bootstrap routing around three outcomes: full flow, quick flow, or no Superpowers unless invoked later
- Added quick flow guidance for bounded work: focused context gathering, small changes, targeted validation, and surface-level review without full brainstorming/TDD ceremony
- Narrowed brainstorming, TDD, and systematic debugging activation so ordinary quick tasks do not automatically trigger heavy workflows
- Added named `spec-reviewer`, `code-reviewer`, `lite-spec-reviewer`, and `lite-code-reviewer` review routing so grouped execution can route full reviews and lightweight checkpoints explicitly
- Reworked planning and execution skills around flat, dependency-ordered task lists with group labels instead of nested todos
- Updated subagent-driven development to use lite task checkpoints, full group reviews, and final task-set reviews instead of mandatory full review loops after every tiny task
- Updated finishing guidance to keep push local-first: prepare PR commands unless the user explicitly asks the agent to push
- Documented public GitHub `main` branch installation, including `opencode.json` setup for OpenCode before tagged releases exist
- Renamed active release history from `RELEASE-NOTES.md` to `CHANGELOG.md`

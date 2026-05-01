# Changelog

## 2026.4.30

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
- Refreshed packaging metadata around the included OpenCode plugin config while keeping the workflow sources harness-agnostic
- Added OpenCode install and verification documentation while keeping other harness configs deferred until future focused rebuilds
- Preserved non-included harness context in future planning docs instead of shipping unverified active config surfaces
- Removed inactive hook wrapper guidance and non-OpenCode adapter files from the active package surface
- Clarified development finalization workflows so current-branch execution stays locally committed while worktree branches merge back only to their parent/source branch
- Registered bundled reviewer agents in the OpenCode plugin so execution workflows can dispatch `code-reviewer`, `spec-reviewer`, `lite-code-reviewer`, and `lite-spec-reviewer` as named subagents
- Refined full-workflow execution todos to use `Task N` / `Task N.M` labels, full task-scope spec reviews, lite task-scope code reviews, and final full task-set reviews
- Added root `AGENTS.md` as canonical contributor guidance for harness-agnostic workflow sources and the included OpenCode config
- Deferred broader harness compatibility documentation until additional harness configs are rebuilt and validated
- Clarified marketplace/plugin-repository installation as the primary product path and removed global npm CLI installation framing
- Made workflow commit behavior conditional on explicit user request and aligned integration docs/tests around changed-file reporting instead of automatic commits
- Aligned reviewer-agent fallback prompts with the canonical reviewer definitions and made skill wording more marketplace-appropriate

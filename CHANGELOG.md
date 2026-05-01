# Changelog

## 2026.4.30

Initial release of SuperDuperPowers.

### What Changed From Original Superpowers

- Reworked the bootstrap behavior so Superpowers is opt-in by default instead of treating every task as a full workflow.
- Added three clear routing outcomes: full Superpowers flow, quick Superpowers flow, or ordinary agent behavior with no Superpowers unless invoked later.
- Added quick-flow guidance for bounded work: gather enough context, make the smallest correct change, run targeted validation, and report results without forcing brainstorming, TDD, or full planning ceremony.
- Narrowed automatic activation of brainstorming, TDD, systematic debugging, and other heavy workflows so small edits and ordinary reviews stay lightweight.
- Refined planning and execution guidance around flat, dependency-ordered task groups instead of deeply nested todos.
- Updated subagent-driven development to use lightweight checkpoints for small tasks, full reviews at meaningful task boundaries, and final task-set reviews when the work is complete.
- Made agent commit and push behavior more conservative: commits require an explicit user request or a workflow that clearly calls for them, and pushes require explicit user approval.

### Skills And Reviewers

- Added bundled reviewer agents for `code-reviewer`, `spec-reviewer`, `lite-code-reviewer`, and `lite-spec-reviewer`.
- Aligned reviewer-agent fallback prompts with the canonical `agents/` definitions.
- Updated skill wording to be more direct, harness-neutral, and marketplace-appropriate.
- Added root `AGENTS.md` contributor guidance for maintaining harness-agnostic workflow sources and the included OpenCode adapter.

### OpenCode Initial Package

- Slimmed the active package surface down to OpenCode support for this alpha release.
- Added the OpenCode plugin adapter, reviewer-agent registration, install instructions, and verification guidance.
- Documented installation from the public GitHub `main` branch while tagged releases and registry distribution are still being established.
- Refreshed package metadata around marketplace/plugin-repository installation and removed unsupported global npm CLI installation framing.
- Removed inactive hook-wrapper guidance and non-OpenCode adapter files from the active package surface.
- Preserved broader harness context as future planning material instead of shipping unverified active configs.

### Release And Maintenance

- Renamed active release history from `RELEASE-NOTES.md` to `CHANGELOG.md`.
- Clarified development finalization workflows for local branches and worktrees.
- Added packaging guidance that keeps `skills/` and `agents/` as the canonical workflow sources.

### Future Plans

- Lock down the OpenCode initial setup first: validate installation, reviewer registration, skill routing, and marketplace/plugin-repository behavior.
- Revisit Claude Code support with a focused adapter pass instead of carrying forward stale hook or wrapper assumptions.
- Explore Codex support once the OpenCode workflow surface is stable and the required tool mappings are clear.
- Explore Cursor hooks, plugins, or setup guidance after the core workflow model has settled.
- Keep future harness integrations thin: each adapter should wrap the canonical `skills/` and `agents/` sources rather than forking workflow content.

# Release Notes

## 2026.4.30-alpha.1

Initial alpha release of this custom Superpowers fork.

- Reset project identity and active documentation for this fork
- Removed Visual Companion runtime, tests, and historical design docs
- Removed legacy slash-command stubs and upstream Codex sync automation
- Slimmed public contribution/release posture for local fork development
- Started fork-specific calendar versioning
- Reworked Superpowers bootstrap routing around three outcomes: full flow, quick flow, or no Superpowers unless invoked later
- Added quick flow guidance for bounded work: focused context gathering, small changes, targeted validation, and surface-level review without full brainstorming/TDD ceremony
- Narrowed brainstorming, TDD, and systematic debugging activation so ordinary quick tasks do not automatically trigger heavy workflows
- Updated local-first docs and testing notes to reduce stale upstream install details and duplicated version examples
- Documented public GitHub `main` branch installation, including `opencode.json` setup for OpenCode before tagged releases exist

# Superpowers Custom

Superpowers Custom is an alpha fork of Superpowers focused on a slim, local-first skills workflow for coding agents.

This fork keeps the core process ideas: use skills deliberately, clarify before building, plan carefully, test changes, debug systematically, verify before claiming success, and keep human review in the loop.

## Status

This is an early alpha cleanup release. Expect names, packaging, and supported harnesses to change while the fork settles.

## What's Included

- Skills for brainstorming, planning, execution, TDD, debugging, verification, code review, and development-branch completion
- Bootstrap hooks/manifests for supported agent harnesses
- OpenCode plugin support through `.opencode/plugins/superpowers.js`
- Claude/Cursor/Codex/Gemini plugin manifests kept minimal for local testing

## What's Not Included

- Visual Companion browser server
- Upstream release history
- Legacy slash-command stubs
- Upstream marketplace/release automation
- Public upstream PR policy text

## Installation

### OpenCode

For local development, point OpenCode at this repository as a plugin source. See `.opencode/INSTALL.md` for the current local setup notes.

### Claude, Cursor, Codex, Gemini

The repo contains harness manifests, but this fork is not currently published to official marketplaces. Use local plugin/extension installation for the harness you are testing.

## Core Workflow

1. `using-superpowers` loads the skill-use rules at session start.
2. `brainstorming` turns rough ideas into an approved design.
3. `writing-plans` turns the design into executable implementation steps.
4. `executing-plans` or `subagent-driven-development` carries out the plan.
5. `test-driven-development`, `systematic-debugging`, and `verification-before-completion` guide implementation quality.
6. `requesting-code-review`, `receiving-code-review`, and `finishing-a-development-branch` help close work cleanly.

## Versioning

This fork uses calendar-based alpha versions, for example `2026.4.30-alpha.1`. Multiple releases on the same day should increment the prerelease suffix.

## Attribution

This project is a custom fork derived from upstream Superpowers by Jesse Vincent and contributors. The fork keeps MIT licensing and upstream attribution while resetting the active docs and release history for this project.

## License

MIT License. See `LICENSE` for details.

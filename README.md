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

Superpowers is opt-in by default for normal coding turns.

- Explicit requests such as `using superpowers brainstorming`, `/brainstorm`, or `use superpowers executing-plans` load the requested workflow.
- Clearly deep and ambiguous, investigation-heavy, high-risk, or plan-heavy requests may still trigger Superpowers implicitly.
- Small reviews, quick code changes, wording edits, and config tweaks can use quick flow: check enough context, make the smallest correct change, run targeted validation when practical, and report what changed.
- Trivial requests or requests to avoid Superpowers use normal agent behavior unless Superpowers is invoked later.
- If intent is unclear, the agent should ask whether to use full flow, quick flow, or no Superpowers for the session.

Available full-flow workflows include brainstorming, planning, execution, TDD, debugging, verification, code review, and development-branch completion.

`skills/using-superpowers/SKILL.md` is the source of truth for routing details.

## Versioning

This fork uses calendar-based alpha versions in the form `YYYY.M.D-alpha.N`. Use `scripts/bump-version.sh` to keep package and harness manifest versions in sync; active release history starts in `RELEASE-NOTES.md`.

## Attribution

This project is a custom fork derived from upstream Superpowers by Jesse Vincent and contributors. The fork keeps MIT licensing and upstream attribution while resetting the active docs and release history for this project.

## License

MIT License. See `LICENSE` for details.

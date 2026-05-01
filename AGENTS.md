# SuperDuperPowers - Contributor Notes

SuperDuperPowers is an alpha skills and reviewer-agents plugin. Keep changes focused on slim packaging, harness-agnostic workflow sources, the included OpenCode config, marketplace/plugin-repository readiness, and practical skill workflows.

## Working Principles

- Prefer small, reviewable changes over broad rewrites.
- Keep documentation and workflows harness-neutral unless documenting the included OpenCode setup.
- Preserve attribution to Jesse Vincent ([@obra](https://github.com/obra)) and the [obra/superpowers](https://github.com/obra/superpowers) MIT-licensed baseline platform.
- Keep included-harness behavior explicit and tested in OpenCode when practical.
- Do not add third-party dependencies unless they are essential for the included OpenCode plugin support.
- Treat `skills/` and `agents/` as the canonical workflow sources.
- Treat `skills/` and `agents/` as harness-agnostic workflow sources.
- Treat `.opencode/plugins/superpowers.js`, `.opencode/INSTALL.md`, and package metadata as the only included harness adapter surface for now.

## Install And Release Posture

- Primary distribution target is marketplace or package-style plugin installation, starting with OpenCode.
- Alpha installation may use local checkouts or GitHub repository references.
- Document GitHub installs as `superduperpowers@git+https://github.com/notchrisbutler/superduperpowers.git#main` until npm publication is active.
- Document local checkout installs as `superduperpowers@git+file:///path/to/superduperpowers` until npm publication is active.
- Document the future npm package name as `@notchrisbutler/superduperpowers` only where npm publishing or future registry installation is discussed.
- Do not present `npm install -g @notchrisbutler/superduperpowers` as a supported product path.
- Keep npm metadata only where the included OpenCode plugin resolution needs it.
- This project uses calendar versions in the form `YYYY.M.D`, with `YYYY.M.D-N` for additional same-day releases. Active release history starts in `CHANGELOG.md`.

## Skill Changes

Skills shape agent behavior. Edit them carefully.

- Keep wording direct, operational, and marketplace-appropriate.
- Avoid adding process unless it solves a concrete problem in this project.
- Keep canonical skill wording harness-neutral when practical and avoid stale adapter references.
- Put OpenCode-specific tool translations in active OpenCode docs only when they help users verify included behavior.
- Test changed skills with realistic prompts in the included OpenCode harness when practical.
- Do not add browser-server requirements unless the included OpenCode plugin support requires them.
- Do not instruct agents to commit changes unless the user explicitly requested commits or selected a Superpowers workflow that documents local workflow commits at spec, plan, or task-scope checkpoints. Never push without an explicit user request.

## Agent Changes

- Keep `agents/*.md` as the canonical reviewer-agent definitions.
- Keep fallback reviewer prompts aligned with the canonical agent definitions.
- Keep reviewer behavior read-only where the active harness supports tool restrictions.
- Verify reviewer registration through the included OpenCode plugin when changing agent definitions or plugin packaging.

## Pull Requests

For pull requests, explain the problem, summarize the change, list verification performed, and call out included OpenCode compatibility risks.

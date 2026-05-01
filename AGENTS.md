# SuperDuperPowers - Contributor Notes

SuperDuperPowers is an alpha skills and agents plugin. Keep changes focused on slim packaging, local-first harness support, marketplace/plugin-repository readiness, and practical skill workflows.

## Working Principles

- Prefer small, reviewable changes over broad rewrites.
- Keep documentation and workflows focused on this project rather than comparisons to other distributions.
- Preserve attribution to Jesse Vincent ([@obra](https://github.com/obra)) and the [obra/superpowers](https://github.com/obra/superpowers) MIT-licensed baseline platform.
- Keep harness-specific behavior explicit and tested in at least one relevant harness when practical.
- Do not add third-party dependencies unless they are essential for a supported harness.
- Treat `skills/` and `agents/` as the canonical workflow sources.
- Treat `CLAUDE.md`, `GEMINI.md`, harness manifests, and OpenCode plugin code as adapters over the canonical sources.

## Install And Release Posture

- Primary distribution target is marketplace or harness plugin/extension installation.
- Alpha installation may use local checkouts or GitHub repository references.
- Do not present `npm install -g superduperpowers` as a supported product path.
- Keep npm metadata only where a supported harness needs it, such as OpenCode plugin resolution.
- This project uses calendar alpha versions in the form `YYYY.M.D-alpha.N`. Active release history starts in `CHANGELOG.md`.

## Skill Changes

Skills shape agent behavior. Edit them carefully.

- Keep wording direct, operational, and marketplace-appropriate.
- Avoid adding process unless it solves a concrete problem in this project.
- Keep canonical skill wording harness-neutral when practical.
- Put harness-specific tool translations in adapter docs or `skills/using-superpowers/references/`.
- Test changed skills with realistic prompts when practical.
- Do not add browser-server requirements unless needed by an explicitly supported harness.
- Do not instruct agents to commit changes unless the user explicitly requested commits or selected a Superpowers workflow that documents local workflow commits at spec, plan, or task-scope checkpoints. Never push without an explicit user request.

## Agent Changes

- Keep `agents/*.md` as the canonical reviewer-agent definitions.
- Keep fallback reviewer prompts aligned with the canonical agent definitions.
- Keep reviewer behavior read-only where the harness supports tool restrictions.
- Document fallback behavior for harnesses without named-agent support.

## Pull Requests

For pull requests, explain the problem, summarize the change, list verification performed, and call out harness compatibility risks.

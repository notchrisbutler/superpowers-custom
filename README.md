# SuperDuperPowers

**Local-first skills and agents for deliberate coding workflows**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2026.4.30--alpha.1-purple.svg)](CHANGELOG.md)
[![OpenCode](https://img.shields.io/badge/OpenCode-plugin-111827.svg)](.opencode/INSTALL.md)
[![Claude](https://img.shields.io/badge/Claude-skills-D97706.svg)](.claude-plugin/plugin.json)
[![Codex](https://img.shields.io/badge/Codex-skills-10B981.svg)](.codex-plugin/plugin.json)

SuperDuperPowers gives coding agents a practical workflow toolkit: brainstorm when the work is ambiguous, write plans when the scope is real, execute in grouped phases, review at meaningful checkpoints, and verify before claiming success.

This project is built from Jesse Vincent's [obra/superpowers](https://github.com/obra/superpowers) baseline platform and substantially modifies the workflow, packaging, and agent model. Jesse Vincent ([@obra](https://github.com/obra)) and contributors retain their original MIT-licensed attribution.

---

## Features

- Opt-in Superpowers routing with full flow, quick flow, and no-Superpowers modes
- Brainstorming, planning, TDD, debugging, verification, and branch-finishing skills
- Grouped execution with flat, dependency-ordered task lists for harnesses that do not support nested todos
- Named reviewer agents: `spec-reviewer`, `code-reviewer`, `lite-spec-reviewer`, and `lite-code-reviewer`
- Local-first finishing flow that prepares PR commands without pushing unless explicitly requested
- OpenCode plugin support through `.opencode/plugins/superpowers.js`
- Harness manifests for Claude, Cursor, Codex, and Gemini local testing
- Calendar alpha versioning in the form `YYYY.M.D-alpha.N`

---

## Quick Start

SuperDuperPowers is alpha software. Install from the current `main` branch or a local checkout until a v1 non-alpha release is published. Public marketplace publication is planned for v1; current manifests and local catalogs are for development and compatibility testing.

### OpenCode

Add the plugin to your OpenCode config, typically `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["superduperpowers@git+https://github.com/notchrisbutler/superduperpowers.git#main"]
}
```

For local checkout development, use a `git+file` source instead:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["superduperpowers@git+file:///path/to/superduperpowers"]
}
```

See [OpenCode Install](.opencode/INSTALL.md) for verification prompts.

### Claude Code

Load this checkout as a local plugin while testing:

```bash
claude --plugin-dir /path/to/superduperpowers
```

See [Claude Code Install](docs/claude-code.md) for hook and verification notes.

### Codex

Use the `.codex-plugin/plugin.json` manifest directly through Codex plugin flows, or add the repo-local testing marketplace from `.agents/plugins/marketplace.json` while developing.

See [Codex Install](docs/codex.md) for local marketplace setup and verification prompts.

### Gemini CLI

Link a local checkout for development:

```bash
gemini extensions link /path/to/superduperpowers
```

See [Gemini CLI Install](docs/gemini.md) for install and verification prompts.

### Cursor

Use the `.cursor-plugin/plugin.json` manifest from a local checkout while testing Cursor-specific plugin behavior.

See [Cursor Install](docs/cursor.md) for verification prompts.

### Copilot

Copilot support is guidance-compatible during alpha. Use shipped repository guidance (`CLAUDE.md`, `GEMINI.md`) and the Copilot tool mapping reference; repository checkouts may also expose AGENTS-style instructions. SuperDuperPowers does not claim a public Copilot plugin surface yet.

See [Copilot Guidance](docs/copilot.md) for setup notes.

---

## Documentation

| Guide | Description |
|-------|-------------|
| [OpenCode Install](.opencode/INSTALL.md) | OpenCode plugin setup and routing verification prompts |
| [Claude Code Install](docs/claude-code.md) | Claude Code local plugin setup and hook notes |
| [Codex Install](docs/codex.md) | Codex local plugin and local marketplace setup |
| [Gemini CLI Install](docs/gemini.md) | Gemini extension setup and verification prompts |
| [Cursor Install](docs/cursor.md) | Cursor plugin setup and routing verification prompts |
| [Copilot Guidance](docs/copilot.md) | Copilot custom-instruction and tool-mapping compatibility notes |
| [Testing](docs/testing.md) | Claude Code integration tests and transcript-based verification |
| [Windows Hooks](docs/windows/polyglot-hooks.md) | Cross-platform hook behavior and Windows notes |
| [Changelog](CHANGELOG.md) | Active release history |
| [Acknowledgements](ACKNOWLEDGEMENTS.md) | Baseline platform attribution |

---

## Core Workflow

Superpowers is opt-in by default for normal coding turns.

- Explicit requests such as `using superpowers brainstorming`, `/brainstorm`, or `use superpowers executing-plans` load the requested workflow.
- Clearly deep and ambiguous, investigation-heavy, high-risk, or plan-heavy requests may still trigger Superpowers implicitly.
- Small reviews, quick code changes, wording edits, and config tweaks can use quick flow: check enough context, make the smallest correct change, run targeted validation when practical, and report what changed.
- Trivial requests or requests to avoid Superpowers use normal agent behavior unless Superpowers is invoked later.
- If intent is unclear, the agent should ask whether to use full flow, quick flow, or no Superpowers for the session.

Available full-flow workflows include brainstorming, planning, execution, TDD, debugging, verification, spec review, code review, and development-branch completion.

`skills/using-superpowers/SKILL.md` is the source of truth for routing details.

---

## Security

Please review [SECURITY.md](SECURITY.md) for supported version policy and responsible disclosure instructions. Do not file public GitHub issues for security bugs.

---

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening issues or pull requests.

---

## License

SuperDuperPowers is available under the MIT License. See [LICENSE](LICENSE) for the full license text.

---

## Acknowledgements

- [Jesse Vincent](https://github.com/obra) and [obra/superpowers](https://github.com/obra/superpowers) - the MIT-licensed baseline platform this project builds on
- The Superpowers contributors whose work made the baseline platform possible
- The coding-agent harness ecosystems that make portable skills and agents practical

---

## Author

**Chris Butler** - [@notchrisbutler](https://github.com/notchrisbutler)

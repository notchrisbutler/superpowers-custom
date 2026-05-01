# Future Harness Context - 2026-04-30

After the OpenCode-first rebuild, `superduperpowers` keeps a harness-agnostic workflow core and includes only the OpenCode harness config. All other harness sections in this document are preserved future context, not active setup promises.

## Active Baseline OpenCode

OpenCode is the first included harness config for this rebuild. Keep active runtime, install, package, and marketplace work focused on the OpenCode plugin surface, while keeping canonical `skills/` workflows and canonical `agents/` reviewer definitions portable.

## Future Claude Code

Removed files and intent:

- `CLAUDE.md`: Claude Code adapter instructions and local contributor/runtime guidance.
- `.claude-plugin/plugin.json`: Claude plugin manifest metadata.
- `.claude-plugin/hooks.json`: Claude plugin hook configuration.
- `.claude-plugin/marketplace.json`: Claude marketplace/package listing metadata.
- `docs/claude-code.md`: Claude Code installation and usage documentation.
- `docs/windows/polyglot-hooks.md`: Cross-platform Claude hook wrapper guidance.
- `hooks/session-start`: Claude-oriented session startup hook.
- `hooks/run-hook.cmd`: Windows hook runner used by Claude-oriented hook flows.

Future rebuild should reintroduce Claude Code after the OpenCode config is stable, using the canonical skills and agents as the source of truth rather than restoring setup files blindly.

## Future Codex

Removed files and intent:

- `.codex-plugin/plugin.json`: Codex plugin manifest metadata.
- `.agents/plugins/marketplace.json`: Agents plugin marketplace listing metadata used by Codex-oriented packaging.
- `docs/codex.md`: Codex installation and usage documentation.
- `skills/using-superpowers/references/codex-tools.md`: Codex tool mapping reference for harness adaptation.

Future rebuild should recreate Codex support as a focused adapter over the proven harness-agnostic core.

## Future Cursor

Removed files and intent:

- `.cursor-plugin/plugin.json`: Cursor plugin manifest metadata.
- `hooks/hooks-cursor.json`: Cursor hook configuration.
- `docs/cursor.md`: Cursor installation and usage documentation.

Future rebuild should validate Cursor-specific hook and manifest behavior against current Cursor extension expectations before publishing any support claim.

## Future Gemini

Removed files and intent:

- `GEMINI.md`: Gemini adapter instructions and runtime guidance.
- `gemini-extension.json`: Gemini extension manifest metadata.
- `docs/gemini.md`: Gemini installation and usage documentation.
- `skills/using-superpowers/references/gemini-tools.md`: Gemini tool mapping reference for harness adaptation.

Future rebuild should treat Gemini support as a separate adapter with explicit runtime mapping and smoke tests.

## Future Copilot

Removed files and intent:

- `docs/copilot.md`: Copilot CLI installation and usage documentation.
- `skills/using-superpowers/references/copilot-tools.md`: Copilot CLI tool mapping reference for harness adaptation.

Future rebuild should add Copilot only after the higher-priority harnesses have stable manifests, docs, and tool mapping behavior.

## Shared Skill And Agent Context

The canonical workflow sources remain `skills/` and `agents/`. Future harness work should adapt those sources instead of copying divergent process text into harness-specific docs. Tool mapping should stay harness-specific and should not make omitted harness configs appear included in active runtime instructions.

Removed shared compatibility file and intent:

- `docs/compatibility.md`: Cross-harness compatibility notes for the previously active multi-harness support surface.

## Packaging And Marketplace Context

The package name is `superduperpowers`, and the repository URL is `https://github.com/notchrisbutler/superduperpowers`. Active package metadata should include only the included OpenCode distribution surface until a future harness config is rebuilt and verified. Marketplace files for omitted harness configs should remain absent from active package contents.

## Reintroduction Order

1. Claude Code
2. Codex
3. Cursor
4. Gemini
5. Copilot

## Guardrails For Future Work

- Do not restore omitted harness config files without a current implementation task.
- Keep future context clearly labeled as future context, not an installation promise.
- Keep OpenCode as the included baseline until another harness has current docs, manifests, packaging entries, and validation.
- Preserve attribution to the upstream Superpowers baseline when rebuilding harness adapters.
- Use `superduperpowers` for package and plugin identity.
- Add harness-specific tests or realistic smoke validation before claiming support.

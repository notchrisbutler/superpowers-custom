# Gemini CLI Install

SuperDuperPowers can be used as a Gemini CLI extension from a local checkout or from the current GitHub `main` branch during alpha development. Public extension-gallery publication is deferred until a future v1 non-alpha release.

## Local Development

From this repository root:

```bash
gemini extensions link .
```

Restart Gemini CLI after linking. Gemini loads `gemini-extension.json`, then reads `GEMINI.md`, which includes `skills/using-superpowers/SKILL.md` and the Gemini tool mapping reference.

## Git Install

Install from GitHub during alpha testing:

```bash
gemini extensions install https://github.com/notchrisbutler/superduperpowers.git --ref main
```

## Hooks

The shared `hooks/hooks.json` file is formatted for Claude Code plugin hooks, and `hooks/hooks-cursor.json` is formatted for Cursor. Gemini CLI extension hooks use Gemini event names and should be added as a Gemini-specific `hooks/hooks.json` only if this project needs Gemini SessionStart injection later.

For now, Gemini receives SuperDuperPowers routing through `GEMINI.md` and discovers bundled skills from the extension `skills/` directory.

## Verify

Start a fresh Gemini CLI session after linking or installing.

Full-flow prompt:

```text
Use the Superpowers brainstorming skill to design a small README wording change.
```

Expected: Gemini activates the relevant skill and follows the full brainstorming workflow.

Quick-flow prompt:

```text
Using Superpowers quick flow, make a bounded docs wording improvement.
```

Expected: Gemini uses lightweight context gathering and avoids full brainstorming, TDD, and planning unless the task escalates.

No-Superpowers prompt:

```text
Fix a typo in README without using Superpowers.
```

Expected: Gemini does not activate heavy Superpowers workflows.

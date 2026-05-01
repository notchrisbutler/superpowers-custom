# Gemini CLI Install

SuperDuperPowers is alpha software. The intended product path is marketplace or harness plugin/extension installation; until that is available, use the documented local checkout or GitHub repository install path. This is not a global npm CLI install path. See [Harness Compatibility](compatibility.md) for capability differences and fallback behavior.

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

This repository root currently includes shared hook scripts and `hooks/hooks-cursor.json` for Cursor. Claude Code hook configuration lives under `.claude-plugin/`. The current alpha does not provide Gemini SessionStart hook injection; if Gemini reports hook warnings, unlink this extension and use `GEMINI.md` as repository guidance instead.

For now, Gemini receives SuperDuperPowers routing through `GEMINI.md` and discovers bundled skills from the extension `skills/` directory. Add a Gemini-specific hook file only if this project needs Gemini SessionStart injection later.

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

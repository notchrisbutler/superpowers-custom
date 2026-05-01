# Cursor Install

SuperDuperPowers is alpha software. The intended product path is marketplace or harness plugin/extension installation; until that is available, use the documented local checkout or GitHub repository install path. This is not a global npm CLI install path. See [Harness Compatibility](compatibility.md) for capability differences and fallback behavior.

## Components

The Cursor manifest is `.cursor-plugin/plugin.json`. It points to:

- `skills/` for SuperDuperPowers skills
- `agents/` for reviewer agents
- `hooks/hooks-cursor.json` for Cursor SessionStart context injection

`hooks/hooks-cursor.json` runs `./hooks/session-start`. The script emits Cursor's `additional_context` output shape when `CURSOR_PLUGIN_ROOT` is set.

## Verify

Start a fresh Cursor agent session with this plugin loaded from a local checkout.

Full-flow prompt:

```text
Use the Superpowers brainstorming skill.
```

Expected: Cursor can load the skill and follows the brainstorming workflow.

Quick-flow prompt:

```text
Using Superpowers quick flow, make a small README wording improvement.
```

Expected: Cursor keeps the task lightweight unless the scope escalates.

No-Superpowers prompt:

```text
Fix a typo in README without using Superpowers.
```

Expected: Cursor does not invoke heavy Superpowers workflows.

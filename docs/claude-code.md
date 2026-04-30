# Claude Code Install

SuperDuperPowers can be loaded as a Claude Code plugin from a local checkout during alpha development. Public marketplace publication is deferred until a future v1 non-alpha release.

## Local Development

From any project where you want to test the plugin, run:

```bash
claude --plugin-dir /path/to/superduperpowers
```

Run `/reload-plugins` after changing plugin files inside an active Claude Code session.

## Components

The Claude Code manifest is `.claude-plugin/plugin.json`. It points to:

- `skills/` for SuperDuperPowers skills
- `agents/` for reviewer agents
- `.claude-plugin/hooks.json` for SessionStart context injection

The SessionStart hook runs `hooks/run-hook.cmd session-start`, which uses `hooks/session-start` to inject the `using-superpowers` routing bootstrap.

## Verify

Full-flow prompt:

```text
Use the superpowers brainstorming skill.
```

Expected: Claude Code loads the namespaced plugin skill and follows the brainstorming workflow.

Quick-flow prompt:

```text
Using Superpowers quick flow, make a small README wording improvement.
```

Expected: Claude Code keeps the task lightweight and avoids TDD/planning ceremony unless the task escalates.

No-Superpowers prompt:

```text
Fix a typo in README without using Superpowers.
```

Expected: Claude Code does not load heavy Superpowers process skills.

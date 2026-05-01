# OpenCode Install

SuperDuperPowers is alpha software. The intended product path is marketplace or harness plugin/extension installation; until that is available, use the documented local checkout or GitHub repository install path. This is not a global npm CLI install path. See [Harness Compatibility](../docs/compatibility.md) for capability differences and fallback behavior.

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

The OpenCode plugin entrypoint is `.opencode/plugins/superpowers.js`. It injects the `skills/` directory into OpenCode skill discovery, registers bundled reviewer agents from `agents/` as named OpenCode subagents, and prepends the `using-superpowers` bootstrap to the first user message.

Bundled agents do not need to be copied to `~/.agents/agents`. OpenCode's native markdown-agent directories are `~/.config/opencode/agents/` globally or `.opencode/agents/` per project, but this plugin registers the packaged agents directly when it loads.

## Verify

Start a fresh OpenCode session and test the main routing outcomes.

Full-flow prompt:

```text
Use the superpowers brainstorming skill.
```

Expected: the `skill` tool can load skills from this checkout and the agent follows the brainstorming workflow.

Named reviewer-agent prompt:

```text
List the available subagent types relevant to SuperDuperPowers review workflows.
```

Expected: `code-reviewer`, `spec-reviewer`, `lite-code-reviewer`, and `lite-spec-reviewer` are available as named subagents, so execution workflows can route reviews through those agents instead of generic `general` tasks.

Quick-flow prompt:

```text
Using Superpowers quick flow, make a small README wording improvement.
```

Expected: the agent gathers only lightweight context, makes the bounded change, and avoids full brainstorming, TDD, and planning unless the task escalates.

No-Superpowers prompt:

```text
Fix a typo in README without using Superpowers.
```

Expected: the agent does not load brainstorming, TDD, or planning skills for the no-Superpowers prompt.

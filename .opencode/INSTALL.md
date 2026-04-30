# OpenCode Install

SuperDuperPowers can be installed directly from the public GitHub repository during alpha development. Tagged marketplace-style release channels are deferred until a future v1 non-alpha release.

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

The OpenCode plugin entrypoint is `.opencode/plugins/superpowers.js`. It injects the `skills/` directory into OpenCode skill discovery and prepends the `using-superpowers` bootstrap to the first user message.

## Verify

Start a fresh OpenCode session and test the main routing outcomes.

Full-flow prompt:

```text
Use the superpowers brainstorming skill.
```

Expected: the `skill` tool can load skills from this checkout and the agent follows the brainstorming workflow.

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

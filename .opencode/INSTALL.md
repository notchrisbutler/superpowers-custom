# OpenCode Install

This fork can be installed directly from the public GitHub repository. Tagged releases are not available yet, so install from the current `main` branch.

Add the plugin to your OpenCode config, typically `opencode.json`:

```json
{
  "plugin": ["superpowers-custom@git+https://github.com/notchrisbutler/superpowers-custom.git#main"]
}
```

For local checkout development, use a `git+file` source instead:

```json
{
  "plugin": ["superpowers-custom@git+file:///path/to/superpowers-custom"]
}
```

The OpenCode plugin entrypoint is `.opencode/plugins/superpowers.js`. It injects the `skills/` directory into OpenCode skill discovery and prepends the `using-superpowers` bootstrap to the first user message.

## Verify

Start a fresh OpenCode session and test the main routing outcomes.

Full-flow prompt:

```text
Use the superpowers brainstorming skill.
```

The `skill` tool should be able to load skills from this checkout.

Quick-flow prompt:

```text
Using Superpowers quick flow, make a small README wording improvement.
```

The agent should gather only lightweight context, make the bounded change, and avoid full brainstorming, TDD, and planning unless the task escalates.

No-Superpowers prompt:

```text
Fix a typo in README without using Superpowers.
```

The agent should not load brainstorming, TDD, or planning skills for the no-Superpowers prompt.

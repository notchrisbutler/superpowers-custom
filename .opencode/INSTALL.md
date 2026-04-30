# OpenCode Local Install

This fork is intended for local plugin development and testing.

Add this repository as a git plugin source from your OpenCode config or package manager flow. For local checkout testing, use the repository path you are editing rather than an upstream marketplace URL.

Example plugin reference:

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

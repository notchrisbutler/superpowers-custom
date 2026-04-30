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

Start a fresh OpenCode session and ask:

```text
Use the superpowers brainstorming skill.
```

The `skill` tool should be able to load skills from this checkout.

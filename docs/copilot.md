# Copilot Guidance

SuperDuperPowers does not claim a public Copilot plugin surface during alpha. Copilot compatibility is guidance-based: repository instructions, AGENTS-style files, and tool mapping references help Copilot agents follow the same workflow concepts when available.

## Repository Instructions

GitHub Copilot supports repository instructions in `.github/copilot-instructions.md`, path-specific `.github/instructions/*.instructions.md`, and agent instructions through `AGENTS.md`. Copilot can also use root `CLAUDE.md` or `GEMINI.md` files in some agent contexts.

This repository keeps contributor guidance in `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` so Copilot-style agents can discover the project posture without a separate plugin manifest.

## Tool Mapping

When using SuperDuperPowers skill text in a Copilot CLI-style harness, use `skills/using-superpowers/references/copilot-tools.md` to translate Claude Code tool names to Copilot equivalents.

## Verify

Use a Copilot agent with this repository attached and ask:

```text
Follow the repository instructions and explain how SuperDuperPowers routes full flow, quick flow, and no-Superpowers requests.
```

Expected: Copilot describes the routing policy from repository instructions or skill references without claiming that SuperDuperPowers is installed from a public Copilot marketplace.

# Copilot Guidance

SuperDuperPowers does not claim a public Copilot plugin surface during alpha. Copilot compatibility is guidance-based: repository instructions, AGENTS-style files, and tool mapping references help Copilot agents follow the same workflow concepts when available.

SuperDuperPowers is alpha software. The intended product path is marketplace or harness plugin/extension installation; until that is available, use the documented local checkout or GitHub repository install path. This is not a global npm CLI install path. See [Harness Compatibility](compatibility.md) for capability differences and fallback behavior.

## Repository Instructions

GitHub Copilot supports repository instructions in `.github/copilot-instructions.md`, path-specific `.github/instructions/*.instructions.md`, and AGENTS-style instruction files when present. Copilot can also use root `CLAUDE.md` or `GEMINI.md` files in some agent contexts.

This package ships `CLAUDE.md` and `GEMINI.md` so Copilot-style agents can discover the project posture without a separate plugin manifest. Local repository checkouts may also include AGENTS-style instructions.

## Tool Mapping

When using SuperDuperPowers skill text in a Copilot CLI-style harness, use `skills/using-superpowers/references/copilot-tools.md` to translate Claude Code tool names to Copilot equivalents.

## Verify

Use a Copilot agent with this repository attached.

Full-flow prompt:

```text
Follow the repository instructions and explain how SuperDuperPowers handles an explicit request to use the brainstorming skill.
```

Expected: Copilot identifies the full-flow route from repository instructions or skill references without claiming that SuperDuperPowers is installed from a public Copilot marketplace.

Quick-flow prompt:

```text
Using Superpowers quick flow, describe the lightweight steps for a bounded docs wording improvement.
```

Expected: Copilot describes lightweight context gathering, a small change, targeted validation, and a brief report without escalating to full brainstorming, TDD, or planning.

No-Superpowers prompt:

```text
Fix a typo in README without using Superpowers.
```

Expected: Copilot follows ordinary repository instructions and does not claim to load SuperDuperPowers skills or a public Copilot plugin.

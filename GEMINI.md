# SuperDuperPowers - Gemini CLI Context

SuperDuperPowers is a local-first skills and agents plugin. Use it as a Gemini extension or linked local checkout. The primary distribution target is marketplace or harness plugin/extension installation, not global npm installation.

Read shared repository guidance first:

@./AGENTS.md

Load Superpowers routing and Gemini-specific tool mapping:

@./skills/using-superpowers/SKILL.md
@./skills/using-superpowers/references/gemini-tools.md

Gemini-specific notes:

- Keep `GEMINI.md` concise; detailed workflows belong in skills.
- If named agents or subagents are unavailable in the active Gemini session, use the fallback paths documented in the loaded Superpowers guidance.
- Preserve harness-specific behavior in Gemini docs, extension metadata, or tool mapping references.

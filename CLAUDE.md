# SuperDuperPowers - Claude Code Notes

Read `AGENTS.md` first. It is the canonical contributor guidance for this repository.

Claude Code-specific notes:

- This checkout can be loaded as a local plugin with `claude --plugin-dir /path/to/superduperpowers`.
- Plugin skills live in `skills/` and reviewer agents live in `agents/`.
- Claude plugin metadata lives in `.claude-plugin/plugin.json` and hook configuration lives in `.claude-plugin/hooks.json`.
- Preserve Claude-specific behavior only in Claude adapter files or clearly marked Claude sections.
- Do not duplicate broad contributor guidance here; update `AGENTS.md` instead.

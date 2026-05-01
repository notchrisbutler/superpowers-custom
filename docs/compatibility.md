# Harness Compatibility

SuperDuperPowers provides the same workflow intent across supported harnesses, adapted to each harness's plugin, skills, agent, hook, and permission model. It does not claim identical mechanics everywhere.

## Distribution Model

The intended product path is marketplace or harness plugin/extension installation. During alpha, local checkouts and GitHub repository references are supported for development and compatibility testing. `npm install -g superduperpowers` is not a supported product path.

## Compatibility Matrix

| Harness | Install Source | Skill Discovery | Agent Support | Bootstrap | Hooks | Subagents | Permissions | Verification Prompt | Known Limitations |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Claude Code | Local plugin now; marketplace later | Plugin `skills/` | Plugin `agents/` | SessionStart hook loads `using-superpowers` | Supported through `.claude-plugin/hooks.json` | Supported | Uses Claude Code permissions and plugin hook policy | `What SuperDuperPowers skills and reviewer agents are available?` | Public marketplace publication is deferred. |
| OpenCode | Config plugin from repo or local checkout | `.opencode/plugins/superpowers.js` registers `skills/` | Plugin registers reviewer agents | First user message transform injects bootstrap once | Plugin API dependent | Supported through OpenCode agent system | Reviewer agents deny edit and todo tools in plugin config | `What SuperDuperPowers skills are available, and is using-superpowers already loaded?` | Behavior depends on OpenCode plugin/config APIs. |
| Cursor | Local plugin manifest | Manifest `skills` path | Manifest `agents` path where supported | Hook/config dependent | Uses `hooks/hooks-cursor.json` | Capability dependent | Uses active Cursor permission and plugin behavior | `What SuperDuperPowers skills are available in this Cursor session?` | Treat as evolving until verified in Cursor release target. |
| Codex | Plugin manifest or repo-local marketplace | Plugin `skills/` and Agent Skills discovery | Fallback/generic worker prompts unless native registry exists | `AGENTS.md` plus explicit skill invocation | Capability dependent | Capability dependent | Uses Codex approval, sandbox, and `AGENTS.md` instruction policy | `Use SuperDuperPowers brainstorming to explore this change without writing code.` | Skills are first-class; named reviewer agents are not guaranteed. |
| Gemini CLI | Extension link/install from repo | Extension context plus Agent Skills where available | Capability dependent | `GEMINI.md` imports routing and tool mapping | Gemini-specific hook semantics | Capability dependent | Uses Gemini trusted-folder, tool, and extension permissions | `Use SuperDuperPowers routing and list the Gemini tool mapping guidance.` | Named agents and subagents vary by Gemini CLI version/session. |
| Copilot | Guidance-compatible repo checkout | Capability dependent | Not claimed | Instruction files and docs | Not claimed | Not claimed | Uses Copilot and host-editor permission behavior | `Summarize the SuperDuperPowers guidance available in this repo checkout.` | No public SuperDuperPowers Copilot plugin surface is claimed. |

## Fallback Rules

- If a skill does not appear, check install source, manifest paths, `SKILL.md` frontmatter, permissions, and harness restart requirements.
- If a skill triggers too often, tighten its `description` or disable implicit invocation where the harness supports that policy.
- If a skill does not trigger, invoke it explicitly and verify that descriptions are concise and front-loaded.
- If named reviewer agents are unavailable, use fallback review prompts or inline review instructions.
- If subagents are unavailable, use `executing-plans` instead of `subagent-driven-development`.
- If hooks or bootstrap injection are unavailable, invoke `using-superpowers` manually or rely on context-file bootstrap.
- If a marketplace or repo install is stale, update through the harness-specific marketplace or repo-ref command.
- If a tool name is unsupported, consult `skills/using-superpowers/references/` for harness mappings.

## Smoke Prompt Set

- Skill discovery: `What SuperDuperPowers skills are available?`
- Explicit routing: `Use SuperDuperPowers brainstorming to explore this change without writing code.`
- Quick routing: `Use quick Superpowers flow to make a small wording edit.`
- No routing: `Do not use Superpowers. Explain this repository in one paragraph.`
- Review fallback: `Review these docs with the appropriate SuperDuperPowers reviewer path for this harness.`

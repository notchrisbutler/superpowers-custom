# Codex Tool Mapping

Skills use Claude Code tool names. When you encounter these in a skill, use your platform equivalent:

| Skill references | Codex equivalent |
|-----------------|------------------|
| `Task` tool (dispatch subagent) | `spawn_agent` (see [Named agent dispatch](#named-agent-dispatch)) |
| Multiple `Task` calls (parallel) | Multiple `spawn_agent` calls |
| Task returns result | `wait` |
| Task completes automatically | `close_agent` to free slot |
| `TodoWrite` (task tracking) | `update_plan` |
| `Skill` tool (invoke a skill) | Skills load natively — just follow the instructions |
| `Read`, `Write`, `Edit` (files) | Use your native file tools |
| `Bash` (run commands) | Use your native shell tools |

## Subagent dispatch requires multi-agent support

Codex supports multi-agent collaboration tools when multi-agent support is enabled. Check the active Codex build and config; current config uses:

```toml
[features]
multi_agent = true
```

This enables agent-spawning workflows for skills like `dispatching-parallel-agents` and `subagent-driven-development` when the harness exposes those tools in the current session.

## Named agent dispatch

Claude Code skills reference named agent types like `code-reviewer` or `spec-reviewer`.
Codex does not have a named agent registry — `spawn_agent` creates generic agents
from built-in roles (`default`, `explorer`, `worker`).

When a skill says to dispatch a named agent type:

1. Find the agent's prompt file (e.g., `agents/code-reviewer.md` or the skill's
   local prompt template like `code-quality-reviewer-prompt.md`)
2. Read the prompt content
3. Fill any template placeholders (`{BASE_SHA}`, `{WHAT_WAS_IMPLEMENTED}`, etc.)
4. Spawn a `worker` agent with the filled content as the `message`

| Skill instruction | Codex equivalent |
|-------------------|------------------|
| `Task tool (code-reviewer)` | `spawn_agent(agent_type="worker", message=...)` with `agents/code-reviewer.md` content |
| `Task tool (general-purpose)` with inline prompt | `spawn_agent(message=...)` with the same prompt |

### Message framing

The `message` parameter is user-level input, not a system prompt. Structure it
for maximum instruction adherence:

```
Your task is to perform the following. Follow the instructions below exactly.

<agent-instructions>
[filled prompt content from the agent's .md file]
</agent-instructions>

Execute this now. Output ONLY the structured response following the format
specified in the instructions above.
```

- Use task-delegation framing ("Your task is...") rather than persona framing ("You are...")
- Wrap instructions in XML tags — the model treats tagged blocks as authoritative
- End with an explicit execution directive to prevent summarization of the instructions

### Codex plugin notes

Codex now supports plugin manifests at `.codex-plugin/plugin.json` with bundled `skills/`, lifecycle hooks, MCP config, app config, and assets at the plugin root. SuperDuperPowers uses the manifest for local alpha packaging, but does not enable Codex hooks until a Codex-specific hook config exists.

Codex plugin marketplaces can be local during development. A repo-local catalog can live at `.agents/plugins/marketplace.json`, while personal catalogs can live at `~/.agents/plugins/marketplace.json`. Public Plugin Directory publication for SuperDuperPowers is deferred until a future v1 non-alpha release.

Named Claude Code agent dispatch still needs adaptation unless the active Codex build exposes equivalent named plugin agents. When a skill says to dispatch a named agent and the harness only exposes generic workers, read the relevant `agents/*.md` prompt and spawn a worker with that prompt content.

## Environment Detection

Skills that create worktrees or finish branches should detect their
environment with read-only git commands before proceeding:

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```

- `GIT_DIR != GIT_COMMON` → already in a linked worktree (skip creation)
- `BRANCH` empty → detached HEAD (cannot branch/push/PR from sandbox)

See `using-git-worktrees` Step 0 and `finishing-a-development-branch`
Step 1 for how each skill uses these signals.

## Codex App Finishing

When the sandbox blocks branch/push operations (detached HEAD in an
externally managed worktree), do not create detached commits. Inform
the user to use the App's native controls:

- **"Create branch"** — names the branch, then commit/push/PR via App UI
- **"Hand off to local"** — transfers work to the user's local checkout

The agent can still run tests and output suggested branch names, commit
messages, and PR descriptions for the user to apply through the App UI.

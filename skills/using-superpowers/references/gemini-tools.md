# Gemini CLI Tool Mapping

Skills use Claude Code tool names. When you encounter these in a skill, use your platform equivalent:

| Skill references | Gemini CLI equivalent |
|-----------------|----------------------|
| `Read` (file reading) | `read_file` |
| `Write` (file creation) | `write_file` |
| `Edit` (file editing) | `replace` |
| `Bash` (run commands) | `run_shell_command` |
| `Grep` (search file content) | `grep_search` |
| `Glob` (search files by name) | `glob` |
| `TodoWrite` (task tracking) | `write_todos` |
| `Skill` tool (invoke a skill) | `activate_skill` |
| `WebSearch` | `google_web_search` |
| `WebFetch` | `web_fetch` |
| `Task` tool (dispatch subagent) | No guaranteed equivalent; see [Subagent support](#subagent-support) |

## Subagent support

Gemini CLI has preview extension support for bundled `agents/`, but not every session exposes a Claude Code-style `Task` tool. When a Superpowers skill requires subagent dispatch and no equivalent is available, fall back to single-session execution via `executing-plans`.

## Additional Gemini CLI tools

These tools are available in Gemini CLI but have no Claude Code equivalent:

| Tool | Purpose |
|------|---------|
| `list_directory` | List files and subdirectories |
| `save_memory` | Persist facts to GEMINI.md across sessions |
| `ask_user` | Request structured input from the user |
| `tracker_create_task` | Rich task management (create, update, list, visualize) |
| `enter_plan_mode` / `exit_plan_mode` | Switch to read-only research mode before making changes |

## Extension notes

Gemini CLI extensions use `gemini-extension.json` at the extension root. SuperDuperPowers uses `contextFileName: "GEMINI.md"` so Gemini loads the routing bootstrap and this tool mapping reference.

Install or link during alpha development with:

```bash
gemini extensions install https://github.com/notchrisbutler/superduperpowers.git --ref main
gemini extensions link /path/to/superduperpowers
```

Gemini extension hooks use Gemini event names such as `SessionStart`, `BeforeTool`, and `AfterTool`. Do not assume Claude Code's `hooks/hooks.json` event semantics apply in Gemini without a Gemini-specific hook config.

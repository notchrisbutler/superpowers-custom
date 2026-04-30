# Cross-Platform Polyglot Hooks for Claude Code

Claude Code plugins need hooks that work on Windows, macOS, and Linux. This document explains the polyglot wrapper technique that makes this possible.

## The Problem

Claude Code runs hook commands through the system's default shell:
- **Windows**: CMD.exe
- **macOS/Linux**: bash or sh

This creates several challenges:

1. **Script execution**: Windows CMD can't execute `.sh` files directly - it tries to open them in a text editor
2. **Path format**: Windows uses backslashes (`C:\path`), Unix uses forward slashes (`/path`)
3. **Environment variables**: `$VAR` syntax doesn't work in CMD
4. **No `bash` in PATH**: Even with Git Bash installed, `bash` isn't in the PATH when CMD runs

## The Solution: Polyglot `.cmd` Wrapper

A polyglot script is valid syntax in multiple languages simultaneously. Our wrapper is valid in both CMD and bash:

```cmd
: << 'CMDBLOCK'
@echo off
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_NAME=%~1"
"C:\Program Files\Git\bin\bash.exe" "%SCRIPT_DIR%%SCRIPT_NAME%"
exit /b
CMDBLOCK

# Unix: run the named script directly
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT_NAME="$1"
shift
exec bash "${SCRIPT_DIR}/${SCRIPT_NAME}" "$@"
```

### How It Works

#### On Windows (CMD.exe)

1. `: << 'CMDBLOCK'` - CMD sees `:` as a label (like `:label`) and ignores `<< 'CMDBLOCK'`
2. `@echo off` - Suppresses command echoing
3. The wrapper tries Git for Windows Bash from standard install paths, then tries `bash` on `PATH`
4. `exit /b` - Exits the batch script, stopping CMD here
5. Everything after `CMDBLOCK` is never reached by CMD

#### On Unix (bash/sh)

1. `: << 'CMDBLOCK'` - `:` is a no-op, `<< 'CMDBLOCK'` starts a heredoc
2. Everything until `CMDBLOCK` is consumed by the heredoc (ignored)
3. `# Unix: run the named script directly` - Comment
4. The script runs directly with the Unix path

## File Structure

```
hooks/
├── hooks.json           # Points to the .cmd wrapper
├── run-hook.cmd         # Polyglot wrapper (cross-platform entry point)
└── session-start        # Actual hook logic (bash script)
```

### hooks.json

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|clear|compact",
        "hooks": [
          {
            "type": "command",
            "command": "\"${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd\" session-start",
            "async": false
          }
        ]
      }
    ]
  }
}
```

Note: The path must be quoted because `${CLAUDE_PLUGIN_ROOT}` may contain spaces on Windows (e.g., `C:\Program Files\...`).

## Requirements

### Windows
- **Git for Windows** should be installed to provide `bash.exe`
- Default installation path: `C:\Program Files\Git\bin\bash.exe`
- If Git is installed elsewhere, put `bash` on `PATH`

### Unix (macOS/Linux)
- Standard bash or sh shell
- The `.cmd` file must have execute permission (`chmod +x`)

## Writing Cross-Platform Hook Scripts

Your actual hook logic goes in the extensionless bash file. To ensure it works on Windows (via Git Bash):

### Do:
- Use pure bash builtins when possible
- Use `$(command)` instead of backticks
- Quote all variable expansions: `"$VAR"`
- Use `printf` or here-docs for output

### Avoid:
- External commands that may not be in PATH (sed, awk, grep)
- If you must use them, they're available in Git Bash but ensure PATH is set up

### Example: JSON Escaping Without sed/awk

Instead of:
```bash
escaped=$(echo "$content" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}')
```

Use pure bash:
```bash
escape_for_json() {
    local input="$1"
    local output=""
    local i char
    for (( i=0; i<${#input}; i++ )); do
        char="${input:$i:1}"
        case "$char" in
            $'\\') output+='\\' ;;
            '"') output+='\"' ;;
            $'\n') output+='\n' ;;
            $'\r') output+='\r' ;;
            $'\t') output+='\t' ;;
            *) output+="$char" ;;
        esac
    done
    printf '%s' "$output"
}
```

## Reusable Wrapper Pattern

For plugins with multiple hooks, you can create a generic wrapper that takes the script name as an argument:

### run-hook.cmd
```cmd
: << 'CMDBLOCK'
@echo off
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_NAME=%~1"
"C:\Program Files\Git\bin\bash.exe" "%SCRIPT_DIR%%SCRIPT_NAME%"
exit /b
CMDBLOCK

# Unix: run the named script directly
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT_NAME="$1"
shift
exec bash "${SCRIPT_DIR}/${SCRIPT_NAME}" "$@"
```

### hooks.json using the reusable wrapper
```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          {
            "type": "command",
            "command": "\"${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd\" session-start"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd\" validate-bash"
          }
        ]
      }
    ]
  }
}
```

## Troubleshooting

### Hook exits without injecting context on Windows
`run-hook.cmd` exits successfully when it cannot find Bash, so the plugin still works without SessionStart context injection. Install Git for Windows or put another Bash on `PATH`.

### Script opens in text editor instead of running
The hooks.json is pointing directly to the `.sh` file. Point to the `.cmd` wrapper instead.

### Works in terminal but not as hook
Claude Code may run hooks differently. Test by simulating the hook environment:
```powershell
$env:CLAUDE_PLUGIN_ROOT = "C:\path\to\plugin"
cmd /c "C:\path\to\plugin\hooks\run-hook.cmd session-start"
```

## Related Issues

- [anthropics/claude-code#9758](https://github.com/anthropics/claude-code/issues/9758) - .sh scripts open in editor on Windows
- [anthropics/claude-code#3417](https://github.com/anthropics/claude-code/issues/3417) - Hooks don't work on Windows
- [anthropics/claude-code#6023](https://github.com/anthropics/claude-code/issues/6023) - CLAUDE_PROJECT_DIR not found

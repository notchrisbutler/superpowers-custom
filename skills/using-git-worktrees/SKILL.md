---
name: using-git-worktrees
description: Use when starting feature work that needs isolation from current workspace or before executing implementation plans.
---

# Using Git Worktrees

## Overview

Git worktrees create isolated workspaces sharing the same repository, allowing work on multiple branches simultaneously without switching.

**Core principle:** Project-local OpenCode worktrees + ignore safety + explicit finalization approval = reliable isolation.

**Announce at start:** "I'm using the using-git-worktrees skill to set up an isolated workspace."

## Directory Selection Process

Follow this priority order:

### 1. Default Location

Default to `{project root}/.opencode/worktrees/`.

Use this location unless the user explicitly directs a different worktree directory or a repo instruction requires another location.

### 2. Respect Explicit Overrides

If the user or repo instructions specify a directory, use that directory.

Still apply ignore safety before creating the worktree.

### 3. Ask Only When Ambiguous

Ask the user only if repo instructions conflict or the directed location is unsafe/unclear:

```
Worktree location is unclear. Where should I create worktrees?

1. .opencode/worktrees/ (project-local default)
2. <repo-directed location>
3. Custom path

Which would you prefer?
```

## Safety Verification

### Ignore Rules Before Creation

Before creating any worktree directory, ensure the chosen worktree root is ignored by git and explicitly allowed through `.ignore` for OpenCode visibility.

For the default location, add these before creating `.opencode/worktrees/`:

`.gitignore`:
```gitignore
.opencode/worktrees/
```

`.ignore`:
```gitignore
!.opencode/worktrees/
```

If the user overrides the worktree location, add that directed worktree root to `.gitignore` and add a matching negated `!` entry to `.ignore` before creation.

After updating ignore files, verify the worktree root is ignored:

```bash
git check-ignore -q <worktree-root>
```

Do not commit ignore-file changes unless the user explicitly asks for a commit.

**Why critical:** Prevents accidentally committing worktree contents to repository.

## Creation Steps

### 1. Detect Project Name

```bash
repo_root=$(git rev-parse --show-toplevel)
project=$(basename "$repo_root")
```

### 2. Create Worktree

```bash
path="$repo_root/.opencode/worktrees/$BRANCH_NAME"

# Create worktree with new branch
git worktree add "$path" -b "$BRANCH_NAME"
cd "$path"
```

### 3. Run Project Setup

Auto-detect and run appropriate setup:

```bash
# Node.js
if [ -f package.json ]; then npm install; fi

# Rust
if [ -f Cargo.toml ]; then cargo build; fi

# Python
if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
if [ -f pyproject.toml ]; then poetry install; fi

# Go
if [ -f go.mod ]; then go mod download; fi
```

### 4. Verify Clean Baseline

Run tests to ensure worktree starts clean:

```bash
# Examples - use project-appropriate command
npm test
cargo test
pytest
go test ./...
```

**If tests fail:** Report failures, ask whether to proceed or investigate.

**If tests pass:** Report ready.

### 5. Report Location

```
Worktree ready at <full-path>
Tests passing (<N> tests, 0 failures)
Ready to implement <feature-name>
```

## Quick Reference

| Situation | Action |
|-----------|--------|
| No override | Use `.opencode/worktrees/` |
| User/repo overrides location | Use override after ignore safety |
| Directory not ignored | Add to `.gitignore` before creation |
| Missing OpenCode allow rule | Add matching `!` entry to `.ignore` |
| Tests fail during baseline | Report failures + ask |
| No package.json/Cargo.toml | Skip dependency install |

## Common Mistakes

### Skipping ignore verification

- **Problem:** Worktree contents get tracked, pollute git status
- **Fix:** Always use `git check-ignore` before creating project-local worktree

### Using the old default

- **Problem:** `.worktrees/` or global worktrees hide OpenCode context and drift from repo-local defaults
- **Fix:** Use `.opencode/worktrees/` unless the user or repo explicitly overrides it

### Proceeding with failing tests

- **Problem:** Can't distinguish new bugs from pre-existing issues
- **Fix:** Report failures, get explicit permission to proceed

### Hardcoding setup commands

- **Problem:** Breaks on projects using different tools
- **Fix:** Auto-detect from project files (package.json, etc.)

## Example Workflow

```
You: I'm using the using-git-worktrees skill to set up an isolated workspace.

[Add `.opencode/worktrees/` to .gitignore before creating the directory]
[Add `!.opencode/worktrees/` to .ignore]
[Verify ignored - git check-ignore confirms .opencode/worktrees/ is ignored]
[Create worktree: git worktree add .opencode/worktrees/auth -b feature/auth]
[Run npm install]
[Run npm test - 47 passing]

Worktree ready at /Users/jesse/myproject/.opencode/worktrees/auth
Tests passing (47 tests, 0 failures)
Ready to implement auth feature
```

## Finalization

When work in one or more worktrees is complete, stop and ask the user how to proceed before merging, committing, deleting worktrees, or pushing.

Default recommendation:
- Merge all completed worktree branches into one local feature branch.
- Confirm whether to commit the unified feature branch locally.
- Do not push unless the user explicitly directs you to push.

Question to ask:

```
Worktree work is complete. How should I finalize it?

1. Merge completed worktrees into one local feature branch and confirm before committing
2. Leave worktrees and branches as-is
3. Custom finalization
```

## Red Flags

**Never:**
- Create worktree without verifying it's ignored (project-local)
- Create `.opencode/worktrees/` before adding ignore rules
- Use `.worktrees/` or a global directory without explicit override
- Skip baseline test verification
- Proceed with failing tests without asking
- Merge, commit, clean up, or push worktree changes without user approval
- Push unless the user explicitly directs it

**Always:**
- Default to `.opencode/worktrees/`
- Add `.gitignore` and `.ignore` entries before creation
- Verify directory is ignored
- Auto-detect and run project setup
- Verify clean test baseline

## Integration

**Called by:**
- **brainstorming** (Phase 4) - REQUIRED when design is approved and implementation follows
- **subagent-driven-development** - REQUIRED before executing any tasks
- **executing-plans** - REQUIRED before executing any tasks
- Any skill needing isolated workspace

**Pairs with:**
- **finishing-a-development-branch** - REQUIRED for cleanup after work complete

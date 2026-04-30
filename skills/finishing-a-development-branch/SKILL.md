---
name: finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup
---

# Finishing a Development Branch

## Overview

Guide completion of development work by presenting clear options and handling chosen workflow.

**Core principle:** Verify tests → Present local-first options → Execute choice → Clean up.

**Announce at start:** "I'm using the finishing-a-development-branch skill to complete this work."

## The Process

### Step 1: Verify Tests

**Before presenting options, verify tests pass:**

```bash
# Run project's test suite
npm test / cargo test / pytest / go test ./...
```

**If tests fail:**
```
Tests failing (<N> failures). Must fix before completing:

[Show failures]

Cannot proceed with merge/PR until tests pass.
```

Stop. Don't proceed to Step 2.

**If tests pass:** Continue to Step 2.

### Step 2: Determine Base Branch

```bash
# Try common base branches
git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null
```

Or ask: "This branch split from main - is that correct?"

### Step 3: Present Options

If worktrees or per-subagent branches were used, first explain that the recommended next step is to merge completed work back into a local feature branch, then clean up temporary worktrees and local task branches.

Present exactly these 4 options:

```
Implementation complete. What would you like to do?

1. Merge back locally
2. Prepare Pull Request summary and commands (you push when ready)
3. Keep the branch as-is (I'll handle it later)
4. Discard this work

Which option?
```

**Don't add explanation** - keep options concise.

### Step 4: Execute Choice

#### Option 1: Merge Locally

If finishing from a feature branch, commit locally if needed and leave push to the user unless they explicitly request it.

If finishing from worktrees or task branches, merge them back into the chosen local feature branch, verify, then clean up temporary worktrees and local task branches.

```bash
# Switch to target local branch
git checkout <target-local-branch>

# Merge completed work
git merge <completed-work-branch>

# Verify tests on merged result
<test command>

# If tests pass
git branch -d <completed-work-branch>
```

Then: Cleanup worktree (Step 5)

#### Option 2: Prepare PR Summary and Commands

Do not push automatically. Prepare the summary and exact commands for the user to run, unless the user explicitly asks you to push or repo instructions allow it.

```bash
git push -u origin <feature-branch>
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
<2-3 bullets of what changed>

## Test Plan
- [ ] <verification steps>
EOF
)"
```

Then: Ask whether to clean up local worktrees and temporary task branches now or keep them until after the user pushes/opens the PR.

#### Option 3: Keep As-Is

Report: "Keeping branch <name>. Worktree preserved at <path>."

**Don't cleanup worktree.**

#### Option 4: Discard

**Confirm first:**
```
This will permanently delete:
- Branch <name>
- All commits: <commit-list>
- Worktree at <path>

Type 'discard' to confirm.
```

Wait for exact confirmation.

If confirmed:
```bash
git checkout <base-branch>
git branch -D <feature-branch>
```

Then: Cleanup worktree (Step 5)

### Step 5: Cleanup Worktrees And Temporary Branches

**For Options 1 and 4:** clean up worktrees and completed temporary branches after verification or typed discard confirmation.

**For Option 2:** ask before cleanup. The user may want to keep worktrees or temporary branches until after they push/open the PR.

**For Option 3:** keep worktrees and branches.

Check if in worktree:
```bash
git worktree list | grep $(git branch --show-current)
```

If yes:
```bash
git worktree remove <worktree-path>
```

## Quick Reference

| Option | Merge | Push | Keep Worktree | Cleanup Branch |
|--------|-------|------|---------------|----------------|
| 1. Merge locally | ✓ | - | - | ✓ |
| 2. Prepare PR | - | user-run | ask | ask |
| 3. Keep as-is | - | - | ✓ | - |
| 4. Discard | - | - | - | ✓ (force) |

## Common Mistakes

**Skipping test verification**
- **Problem:** Merge broken code, create failing PR
- **Fix:** Always verify tests before offering options

**Open-ended questions**
- **Problem:** "What should I do next?" → ambiguous
- **Fix:** Present exactly 4 structured options

**Automatic worktree cleanup**
- **Problem:** Remove worktree when might need it (Option 2, 3)
- **Fix:** Cleanup automatically only for Options 1 and 4. For Option 2, ask first.

**No confirmation for discard**
- **Problem:** Accidentally delete work
- **Fix:** Require typed "discard" confirmation

## Red Flags

**Never:**
- Proceed with failing tests
- Merge without verifying tests on result
- Delete work without confirmation
- Force-push without explicit request
- Push without explicit request or repo instructions allowing it

**Always:**
- Verify tests before offering options
- Present exactly 4 options
- Get typed confirmation for Option 4
- Clean up worktrees automatically for Options 1 & 4 only; ask before cleanup for Option 2

## Integration

**Called by:**
- **subagent-driven-development** (Step 7) - After all tasks complete
- **executing-plans** (Step 5) - After all batches complete

**Pairs with:**
- **using-git-worktrees** - Cleans up worktree created by that skill

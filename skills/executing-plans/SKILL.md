---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
---

# Executing Plans

## Overview

Load plan, review critically, execute flat parent tasks and subtasks, commit locally at verified task-scope boundaries when workflow commits are enabled, report when complete.

If the active harness does not support subagents or worker dispatch, use `executing-plans` in the main session and preserve the same flat task labels and review checkpoints.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

**Note:** Tell the user that Superpowers works much better with access to subagents. The quality of its work will be significantly higher if run on a platform with subagent support (such as Claude Code or Codex). If subagents are available, use superpowers:subagent-driven-development instead of this skill.

## The Process

### Step 1: Load and Review Plan
1. Read plan file
2. Review critically - identify any questions or concerns about the plan
3. If concerns: Raise them with the user before starting
4. If no concerns: Determine whether workflow commits are enabled, create a flat, dependency-ordered harness todo list, and proceed

### Step 2: Execute Tasks

Build the harness todo list flat, even when the plan has conceptual groups. Use `Task N` for parent task-scope reviews and `Task N.M` for subtasks:

```markdown
- Execution setup: read plan, classify groups, prepare context
- Task 1.1: <task name>
- Task 1.1: Lite review checkpoint
- Task 1: Full spec review
- Task 1: Lite code review
- Final: full task-set spec review
- Final: full task-set code review
- Final: validation
- Final: commit verified remaining changes if workflow commits are enabled
- Finalize: complete on current branch or prompt for worktree merge/cleanup choice
```

For each flat todo:
1. Mark as in_progress immediately before starting that todo
2. Follow each step exactly (plan has grouped, dependency-ordered steps)
3. Run verifications as specified
4. Mark as completed immediately before moving to the next todo

Do not create nested todos. Do not use `Group N` in harness todos; preserve conceptual grouping with `Task N` parent labels and `Task N.M` subtask labels.

At each parent task boundary, run full spec review for that task scope and lite code review for that task scope. Reserve full code review for high-risk task scopes, escalations from lite code review, and the final full task-set review.

When workflow commits are enabled, commit locally after each parent task boundary only after task-scope validation and required reviews pass. On current feature branches this is the normal early-and-often cadence. In worktree or temporary task-branch execution, keep commits on the temporary branch and let finishing-a-development-branch handle integration back to the parent/source branch. Do not push unless the user explicitly requests it.

### Step 3: Complete Development

After all tasks complete and verified:
- Run final full-scope spec review across all completed tasks.
- If final spec review finds issues, fix them and re-run final full-scope spec review until approved or blocked.
- Run final full-scope code review across all completed tasks.
- If final code review finds issues, fix them and re-run final full-scope code review until approved or blocked.
- If workflow commits are enabled and verified changes remain uncommitted, commit them locally before finishing the branch.
- Announce: "I'm using the finishing-a-development-branch skill to complete this work."
- **REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch
- Follow that skill to verify tests, present options, execute choice

## When to Stop and Ask for Help

**STOP executing immediately when:**
- Hit a blocker (missing dependency, test fails, instruction unclear)
- Plan has critical gaps preventing starting
- You don't understand an instruction
- Verification fails repeatedly

**Ask for clarification rather than guessing.**

## When to Revisit Earlier Steps

**Return to Review (Step 1) when:**
- Partner updates the plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** - stop and ask.

## Remember
- Review plan critically first
- Keep harness todos flat; preserve conceptual groups with `Task N` / `Task N.M` labels and ordering
- Follow plan steps exactly
- Don't skip verifications
- Reference skills when plan says to
- Stop when blocked, don't guess
- Never start implementation on main/master branch without explicit user consent
- Respect explicit user direction to execute on the current branch; do not force a worktree in that case
- Commit early and often at verified task-scope boundaries when workflow commits are enabled; keep pushes explicit

## Integration

**Required workflow skills:**
- **superpowers:using-git-worktrees** - Use before starting when work should be isolated; skip when the user explicitly directs execution on the current branch
- **superpowers:writing-plans** - Creates the plan this skill executes
- **superpowers:finishing-a-development-branch** - Complete development after all tasks

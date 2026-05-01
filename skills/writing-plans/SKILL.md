---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for our codebase or local conventions. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as grouped, dependency-ordered tasks. DRY. YAGNI. TDD. Include commit steps only when the user explicitly requested commits.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Context:** Prefer a dedicated worktree when the user wants isolated execution. If the user explicitly directs work to happen on the current branch, write the plan for current-branch execution and do not assume worktree setup or cleanup.

**Save plans to:** `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`
- (User preferences for plan location override this default)
- If that path is ignored in the active repository, treat the plan as local-only unless the user chooses a trackable path or explicitly requests force-adding ignored docs.

## Scope Check

If the spec covers multiple independent subsystems, it should have been broken into sub-project specs during brainstorming. If it wasn't, suggest breaking this into separate plans — one per subsystem. Each plan should produce working, testable software on its own.

## File Structure

Before defining tasks, map out which files will be created or modified and what each one is responsible for. This is where decomposition decisions get locked in.

- Design units with clear boundaries and well-defined interfaces. Each file should have one clear responsibility.
- You reason best about code you can hold in context at once, and your edits are more reliable when files are focused. Prefer smaller, focused files over large ones that do too much.
- Files that change together should live together. Split by responsibility, not by technical layer.
- In existing codebases, follow established patterns. If the codebase uses large files, don't unilaterally restructure - but if a file you're modifying has grown unwieldy, including a split in the plan is reasonable.

This structure informs the task decomposition. Each task should produce self-contained changes that make sense independently.

## Grouped Task Granularity

Plan in parent task scopes that share one useful validation boundary. Keep harness task lists flat by encoding scope membership in labels, not nesting.

**Each task should be small enough to execute safely, but not so small that it forces a cold-start review loop for mechanical work:**
- Good task scope: `Task 1: Login Flow` with test, implementation, and validation subtasks
- Good task: `Task 1.1: Write failing login validation tests`
- Good lite checkpoint: `Task 1.1: Lite review checkpoint` using lite spec/code reviewers as needed
- Good task-scope review: `Task 1: Full spec review` and `Task 1: Lite code review`
- Bad default: full spec review and full code review after every tiny task

Use task-level full review only for high-risk, ambiguous, or cross-cutting work.

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan in flat, dependency-ordered task groups. Steps use checkbox (`- [ ]`) syntax for tracking; harness todos must remain flat.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

---
```

## Task Structure

````markdown
### Task N: [Feature/Validation Boundary]

**Review policy:** [lite task checkpoints + full task-scope spec review + lite task-scope code review, or full spec/code review for high-risk work]

#### Task N.1: [Component Name]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

- [ ] **Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

- [ ] **Step 3: Write minimal implementation**

```python
def function(input):
    return expected
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

- [ ] **Step 5: Report changed files**

Report the files changed in this task and whether tests passed. Do not commit unless the user explicitly requested commits.

#### Task N Review

- [ ] Run full spec review for Task N
- [ ] Run lite code review for Task N
- [ ] Run task-scope validation command: `pytest tests/path -v`
````

## No Placeholders

Every step must contain the actual content an engineer needs. These are **plan failures** — never write them:
- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" / "add validation" / "handle edge cases"
- "Write tests for the above" (without actual test code)
- "Similar to Task N" (repeat the code — the engineer may be reading tasks out of order)
- Steps that describe what to do without showing how (code blocks required for code steps)
- References to types, functions, or methods not defined in any task

## Remember
- Exact file paths always
- Complete code in every step — if a step changes code, show the code
- Exact commands with expected output
- DRY, YAGNI, TDD, and no automatic commits without explicit user request
- Conceptual groups are allowed in plan docs; harness todos must be flat and ordered by dependency
- Include an explicit review policy per group

## Self-Review

After writing the complete plan, look at the spec with fresh eyes and check the plan against it. This is a checklist you run yourself — not a subagent dispatch.

**1. Spec coverage:** Skim each section/requirement in the spec. Can you point to a task that implements it? List any gaps.

**2. Placeholder scan:** Search your plan for red flags — any of the patterns from the "No Placeholders" section above. Fix them.

**3. Type consistency:** Do the types, method signatures, and property names you used in later tasks match what you defined in earlier tasks? A function called `clearLayers()` in Task 3 but `clearFullLayers()` in Task 7 is a bug.

**4. Execution shape:** Does the plan create flat, dependency-ordered todos with labels like `Task 1.1: <task name>`, `Task 1.1: Lite review checkpoint`, `Task 1: Full spec review`, and `Task 1: Lite code review`? If the plan implies nested todos or mandatory full reviews after every tiny task, fix it.

If you find issues, fix them inline. No need to re-review — just fix and move on. If you find a spec requirement with no task, add the task.

## Execution Handoff

After saving the plan, offer execution choice:

**"Plan complete and saved to `docs/superpowers/plans/<filename>.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I execute flat task scopes with lite task checkpoints, full task-scope spec reviews, lite task-scope code reviews, and final full reviews

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?"**

**If Subagent-Driven chosen:**
- **REQUIRED SUB-SKILL:** Use superpowers:subagent-driven-development
- Flat, dependency-ordered harness todo list with `Task N` / `Task N.M` labels and review checkpoints

**If Inline Execution chosen:**
- **REQUIRED SUB-SKILL:** Use superpowers:executing-plans
- Flat, dependency-ordered harness todo list with `Task N` / `Task N.M` labels and review checkpoints

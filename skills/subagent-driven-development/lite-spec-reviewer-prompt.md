# Lite Spec Reviewer Prompt Template

Use this template when named `lite-spec-reviewer` agents are unavailable.

**Purpose:** Run a fast spec checkpoint for small, mechanical, or low-risk tasks.

```
Task tool (general-purpose):
  description: "Lite spec review for Task N.M"
  prompt: |
    You are doing a lightweight spec checkpoint, not a full audit.

    Check only:
    1. Did the task touch expected files or a clearly justified equivalent?
    2. Does the visible change obviously match the requested task?
    3. Did the implementer report concerns, skipped work, or unexpected behavior?
    4. Was required task-level validation run, or is the missing validation explicitly explained?

    Escalate to full spec review if the task is not small, requirements are ambiguous,
    files touched are unexpected, or any answer above is concerning.

    Report:
    Lite spec checkpoint: Pass | Escalate
    - Reason: one or two concise bullets with file references if relevant.
```

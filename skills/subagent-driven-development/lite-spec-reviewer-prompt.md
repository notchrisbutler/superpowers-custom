# Lite Spec Reviewer Prompt Template

Use this template when named `lite-spec-reviewer` agents are unavailable.

Fallback alignment: this prompt is for harnesses that cannot dispatch the canonical named reviewer agent from `agents/`. Preserve the corresponding canonical reviewer behavior and output priorities when adapting this prompt.

**Purpose:** Run a fast spec checkpoint for small, mechanical, or low-risk tasks.

```
Generic worker or inline fallback prompt:
  description: "Lite spec review for Task N.M"
  prompt: |
    You are doing a lightweight spec checkpoint, not a full audit.

    Check only:
    1. Did the task touch expected files or a clearly justified equivalent?
    2. Does the visible change obviously match the requested task?
    3. Did the implementer report concerns, skipped work, or unexpected behavior?
    4. Was required task-level validation run, or is the missing validation explicitly explained?

    Do not expand scope. Do not suggest broad refactors. Escalate to full spec review if the task is not small, requirements are ambiguous,
    files touched are unexpected, or any answer above is concerning.

    Report:
    Lite spec checkpoint: Pass | Escalate
    - Reason: one or two concise bullets with file references if relevant.
```

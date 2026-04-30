# Lite Code Reviewer Prompt Template

Use this template when named `lite-code-reviewer` agents are unavailable.

**Purpose:** Catch obvious local code-quality regressions cheaply.

```
Task tool (general-purpose):
  description: "Lite code review for Task N.M"
  prompt: |
    You are doing a lightweight code checkpoint, not a full review.

    Check only:
    1. Obvious syntax, formatting, type, or import problems.
    2. Obvious test or validation mismatch.
    3. Obvious local regression, dead code, accidental debug output, or unrelated file change.
    4. Whether the change should be escalated to full code-reviewer because it is larger or riskier than expected.

    Do not request stylistic polish unless it is likely to cause confusion or defects.

    Report:
    Lite code checkpoint: Pass | Escalate
    - Reason: one or two concise bullets with file references if relevant.
```

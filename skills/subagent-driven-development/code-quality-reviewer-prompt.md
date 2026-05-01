# Code Quality Reviewer Prompt Template

Use named `code-reviewer` when available. Use this fallback template when named agents are unavailable.

Fallback alignment: this prompt is for harnesses that cannot dispatch the canonical named reviewer agent from `agents/`. Preserve the corresponding canonical reviewer behavior and output priorities when adapting this prompt.

**Purpose:** Verify implementation is well-built (clean, tested, maintainable)

**Only dispatch after spec compliance review passes.**

```
Generic worker or inline fallback prompt:
  description: "Full code review for Task Group N"
  prompt: |
    You are reviewing completed work for code quality, maintainability, and integration risks.

    ## What Was Implemented
    [from implementer's report]

    ## Plan Or Requirements
    [Task group or final implementation requirements]

    ## Review Range
    BASE_SHA: [commit before task/group]
    HEAD_SHA: [current commit]

    Check:
    - Established patterns, naming, organization, and maintainability
    - Error handling, type safety, defensive programming, security, and performance risks
    - Test coverage and quality
    - Whether each file has one clear responsibility with a well-defined interface
    - Whether units are decomposed so they can be understood and tested independently
    - Whether the implementation follows the file structure from the plan
    - Whether new or modified files became too large because of this change

    Always acknowledge what was done well before highlighting issues.

    Report:
    ## Code Review
    Result: Approved | Changes Required
    Strengths:
    - Brief note on what was done well.
    Findings:
    - [Critical|Important|Suggestions] `path:line` - Issue and required fix.
```

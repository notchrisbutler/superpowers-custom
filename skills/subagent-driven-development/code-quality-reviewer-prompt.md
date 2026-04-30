# Code Quality Reviewer Prompt Template

Use named `code-reviewer` when available. Use this fallback template when named agents are unavailable.

**Purpose:** Verify implementation is well-built (clean, tested, maintainable)

**Only dispatch after spec compliance review passes.**

```
Task tool (general-purpose):
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

    Report:
    ## Code Review
    Result: Approved | Changes Required
    Findings:
    - [Critical|Important|Minor] `path:line` - Issue and required fix.
```

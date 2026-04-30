# Opt-In Superpowers Routing Design

## Problem

Superpowers currently activates too aggressively. The `using-superpowers` skill tells agents to invoke skills when there is even a 1% chance a skill might apply, and several workflow skills have broad descriptions and hard "always" language. As a result, quick reviews and small code changes can escalate into brainstorming, TDD, planning, subagents, and review workflows without the user clearly asking for that level of process.

This fork should preserve Superpowers for deliberate deep work while making normal coding turns feel lightweight and pragmatic. The bootstrap should route each request to full flow, quick flow, or no Superpowers unless the user invokes it later.

## Goals

- Make Superpowers opt-in by default for normal coding turns.
- Keep implicit activation only when the user request is clearly deep and ambiguous, investigation-heavy, high-risk, or plan-heavy.
- Ask the user when the request could reasonably be full flow, quick flow, or no Superpowers.
- Add a first-class quick flow for lightweight Superpowers-assisted changes.
- Explicitly support no-Superpowers routing for trivial work or sessions where the user does not want Superpowers unless invoked later.
- Avoid automatic TDD, full brainstorming, design docs, subagents, or intensive review for quick-flow and no-Superpowers work.

## Non-Goals

- Removing core Superpowers workflows.
- Reintroducing slash-command stubs.
- Reintroducing Visual Companion or browser-server behavior.
- Adding third-party dependencies.
- Making every quick task use a new formal process.

## Trigger Model

Superpowers has three routing outcomes: full flow, quick flow, and no Superpowers.

### Full Flow

Use full flow when the user explicitly asks for Superpowers, names a Superpowers skill/workflow, or the request clearly needs structured process.

Examples:

- `using superpowers brainstorming`
- `use superpowers executing-plans`
- `run the superpowers TDD workflow`
- `/brainstorm`
- `/superpowers`

Also use full flow when the request is clearly deep and ambiguous enough to require investigation, decomposition, planning, or multi-stage execution.

Examples:

- A broad feature request with unclear boundaries.
- A bug report that requires root-cause investigation across components.
- A multi-file refactor with behavioral risk.
- A request to produce a plan or design before coding.

### Quick Flow

Use quick flow when the user asks for a small review, small code change, wording adjustment, configuration tweak, or similarly bounded task where lightweight Superpowers guidance is useful and they have not explicitly requested full flow.

Quick flow is a lightweight version of Superpowers routing:

1. Check enough local context to avoid guessing.
2. Ask up to five focused context questions if needed, preferably with the harness's structured user-question tool and an Other option when supported.
3. Make the smallest correct change.
4. Run targeted validation when practical.
5. Do a surface-level self-review for obvious regressions, missed call sites, and formatting issues.
6. Report what changed and what validation was performed.

Quick flow must not require TDD, design docs, implementation plans, subagents, branch-completion workflows, or exhaustive code review unless the work escalates.

### No Superpowers

Use no Superpowers when the user asks to avoid Superpowers, the task is trivial, or Superpowers would add process without improving the result. Work normally under the active system, developer, repo, and user instructions until the user invokes Superpowers later.

### Ask Before Choosing

If intent is uncertain, ask one routing question before loading heavy workflow skills:

> Which route should I use?
> 1. Full Superpowers flow: brainstorm, TDD, spec/plan, and execution workflow.
> 2. Quick Superpowers flow: quick context gather, code change, and surface-level validation.
> 3. No Superpowers: normal agent behavior for this session unless you invoke Superpowers later.

This question should be used when a request might fit more than one routing outcome.

## Skill Changes

### `using-superpowers`

Rewrite this bootstrap from mandatory catch-all invocation to routing guidance.

Key changes:

- Replace the "1% chance" rule with an opt-in and high-confidence trigger rule.
- Explicitly permit normal coding behavior without loading skills for quick tasks.
- Define the three outcomes: full flow, quick flow, and no Superpowers. Ask-before-choosing is a pending user choice, not a fourth route.
- Keep tool mapping and instruction-priority guidance.
- Remove language that says skill checks happen before any response or action.

### `brainstorming`

Narrow the skill description and body.

Key changes:

- Use when explicitly requested or when a request clearly needs design discovery.
- Remove "every project" and "single-function utility" language.
- Keep the full brainstorming workflow strict once the skill is intentionally selected.
- Keep design docs only for full workflow use.

### `test-driven-development`

Narrow frontmatter and usage guidance.

Key changes:

- Use when Superpowers full workflow is active, when the user asks for TDD, or when the change is high-risk enough that the agent should ask before skipping tests-first work.
- Do not auto-trigger on every feature, bugfix, refactor, or behavior change.
- Preserve strict TDD rules once the skill is intentionally selected.

### `systematic-debugging`

Narrow frontmatter and usage guidance.

Key changes:

- Use when the user asks for debugging/root-cause analysis, when the issue is non-reproducible or multi-component, or when prior fixes failed.
- Quick bug fixes can use quick flow if the cause is obvious and the scope is small, or no Superpowers if the user asks for ordinary agent behavior.
- Preserve strict root-cause discipline once the skill is intentionally selected.

### Docs

Update README and OpenCode install notes to explain:

- Superpowers is opt-in by default.
- Explicit Superpowers requests still load the relevant skills.
- Quick flow handles small changes without full workflow ceremony.
- No-Superpowers routing handles trivial work or sessions where the user opts out.
- Unclear requests should prompt the three-option routing question.

## Escalation Rules

Quick flow should escalate to full flow or ask the user when:

- The change expands beyond the originally bounded scope.
- Multiple subsystems are involved.
- Requirements are unclear after up to five focused quick-flow questions.
- Validation reveals unexpected failures.
- The agent finds meaningful design tradeoffs rather than a straightforward edit.

## Compatibility Notes

OpenCode currently injects `using-superpowers` into the first user message. That can remain, but the injected content should no longer force skill invocation. Other harnesses that include `using-superpowers` should inherit the same opt-in behavior from the skill text.

No package structure changes are required.

## Validation

Validate with realistic prompt classes:

- "Fix this typo in README" should not load brainstorming or TDD.
- "Quick review this small diff" should use normal review behavior or quick flow, not full Superpowers planning.
- "Using superpowers brainstorming, design X" should load brainstorming.
- "Use superpowers executing-plans on docs/superpowers/plans/example.md" should load the execution workflow.
- A broad ambiguous feature request should either trigger full flow or ask the routing question.
- An ambiguous medium-sized change should ask whether to use full flow, quick flow, or no Superpowers.

## Open Questions

None. Quick flow and no-Superpowers routing are part of the bootstrap guidance rather than separate heavy workflow skills for the first pass.

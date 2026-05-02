# OpenCode Install

SuperDuperPowers is alpha software. Its workflow sources are harness and model agnostic. OpenCode is the first included harness config, installed as a package-style plugin from npm. This is not a global npm CLI install path.

## npm Package Install

Add the plugin to your OpenCode config, typically `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@notchrisbutler/superduperpowers"]
}
```

Start a fresh OpenCode session after changing plugin config so the package is resolved and loaded.

If you previously tested a local shim named `superpowers.js` in your user OpenCode plugins directory, remove that stale shim before verifying this package. The included entrypoint is now `superduperpowers.js`; keeping both shims can make OpenCode load duplicate plugin copies.

## GitHub Backup Install

If npm resolution is unavailable, use the GitHub repository directly:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["superduperpowers@git+https://github.com/notchrisbutler/superduperpowers.git"]
}
```

## Local Checkout Install

For development against a local checkout, use a `git+file` source:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["superduperpowers@git+file:///path/to/superduperpowers"]
}
```

Use an absolute path to the repository checkout. Restart OpenCode after changing the checkout or plugin config when you need to verify package loading from a clean session.

## What The Plugin Registers

The OpenCode plugin entrypoint is `.opencode/plugins/superduperpowers.js`.

- It adds the packaged `skills/` directory to OpenCode skill discovery.
- It registers reviewer subagents from `agents/` as named OpenCode subagents: `code-reviewer`, `spec-reviewer`, `lite-code-reviewer`, and `lite-spec-reviewer`.
- It injects the `using-superpowers` bootstrap into the first user message once per session so routing guidance is available without duplicating it on later turns.
- Custom tools: `sdp_profile`, `sdp_setup_hygiene`, and `sdp_branch_context`.
- User-level runtime state and default worktrees under `{OPENCODE_CONFIG_DIR}/superduperpowers/`.

Bundled agents do not need to be copied into a project. The plugin registers the packaged agent definitions directly when it loads.

## Verify

Start a fresh OpenCode session and test these prompts.

Skill discovery and bootstrap prompt:

```text
Use the superpowers brainstorming skill.
Use SuperDuperPowers brainstorming for this feature.
Use superduperpowers quick flow for a small typo fix.
Execute this approved plan with subagents using user-level worktrees.
```

Expected: the `skill` tool can load skills from this package, the `using-superpowers` bootstrap is present once, and the agent follows the requested brainstorming workflow.

Reviewer subagents prompt:

```text
List the available subagent types relevant to SuperDuperPowers review workflows.
```

Expected: `code-reviewer`, `spec-reviewer`, `lite-code-reviewer`, and `lite-spec-reviewer` are available as named subagents.

Quick-flow prompt:

```text
Using SuperDuperPowers quick flow, make a small README wording improvement.
```

Expected: the agent gathers lightweight context, makes the bounded change, runs targeted validation when practical, and avoids full brainstorming, TDD, and planning unless the task escalates.

No-SuperDuperPowers prompt:

```text
Fix a typo in README without using SuperDuperPowers.
```

Expected: the agent does not load brainstorming, TDD, planning, or other SuperDuperPowers workflow skills for the no-SuperDuperPowers prompt.

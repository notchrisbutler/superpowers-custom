# Codex Install

SuperDuperPowers includes a Codex plugin manifest for local alpha testing. Public Plugin Directory publication is deferred until a future v1 non-alpha release.

## Manifest

The Codex manifest is `.codex-plugin/plugin.json`. It points to the root `skills/` directory. It does not enable hooks yet because SuperDuperPowers does not include a Codex-specific hook config.

## Local Marketplace Testing

The repo-local testing catalog is `.agents/plugins/marketplace.json`. Codex resolves local `source.path` entries relative to the marketplace root.

From this repository, restart Codex and open the plugin browser:

```text
/plugins
```

Select the `SuperDuperPowers Local` marketplace if your Codex build discovers repo-local marketplaces.

If you manage marketplaces from the terminal, add this repository as a local marketplace root:

```bash
codex plugin marketplace add /path/to/superduperpowers
```

## Config Notes

Codex stores user configuration in `~/.codex/config.toml`. Current Codex builds support `features.multi_agent`; enable it when you want SuperDuperPowers workflows to dispatch subagents in builds that expose agent-spawning tools.

```toml
[features]
multi_agent = true
```

Do not enable SuperDuperPowers Codex hook injection until this project adds a Codex-specific hook config. Claude Code hook configuration lives under `.claude-plugin/` and uses Claude Code plugin variables.

## Verify

Full-flow prompt:

```text
Use SuperDuperPowers brainstorming to design a small docs change.
```

Expected: Codex loads the relevant skill and follows the full workflow.

Quick-flow prompt:

```text
Using Superpowers quick flow, make a bounded README wording improvement.
```

Expected: Codex keeps the work lightweight and reports targeted validation.

No-Superpowers prompt:

```text
Fix a typo in README without using Superpowers.
```

Expected: Codex does not invoke full Superpowers process skills.

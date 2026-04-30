# SuperDuperPowers — Contributor Notes

SuperDuperPowers is an alpha skills and agents plugin. Keep changes focused on slim packaging, local-first harness support, and practical skill workflows.

## Working Principles

- Prefer small, reviewable changes over broad rewrites.
- Keep documentation and workflows focused on this project rather than comparisons to other distributions.
- Preserve attribution to Jesse Vincent ([@obra](https://github.com/obra)) and the [obra/superpowers](https://github.com/obra/superpowers) MIT-licensed baseline platform.
- Keep harness-specific behavior explicit and tested in at least one relevant harness when practical.
- Do not add third-party dependencies unless they are essential for a supported harness.

## Skill Changes

Skills shape agent behavior. Edit them carefully.

- Keep wording direct and operational.
- Avoid adding process unless it solves a concrete problem in this project.
- Test changed skills with realistic prompts when practical.
- Do not add browser-server requirements unless they are needed by an explicitly supported harness.

## Release Posture

This project uses calendar alpha versions in the form `YYYY.M.D-alpha.N`. Active release history starts in `CHANGELOG.md`.

## Pull Requests

For pull requests, explain the problem, summarize the change, list verification performed, and call out harness compatibility risks.

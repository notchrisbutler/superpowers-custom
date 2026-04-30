# Superpowers Custom — Contributor Notes

This is a custom alpha fork of Superpowers. Keep changes focused on the fork's current goals: slim packaging, local-first harness support, and practical skill workflows.

## Working Principles

- Prefer small, reviewable changes over broad rewrites.
- Remove stale upstream ceremony when it does not serve this fork.
- Preserve upstream attribution and MIT licensing.
- Keep harness-specific behavior explicit and tested in at least one relevant harness when practical.
- Do not add third-party dependencies unless they are essential for a supported harness.

## Skill Changes

Skills shape agent behavior. Edit them carefully.

- Keep wording direct and operational.
- Avoid adding process unless it solves a concrete problem in this fork.
- Test changed skills with realistic prompts when practical.
- Do not reintroduce Visual Companion behavior or browser-server requirements.

## Release Posture

This fork uses calendar alpha versions in the form `YYYY.M.D-alpha.N`. Active release history starts in `RELEASE-NOTES.md`; old upstream history should not be restored to active docs.

## Pull Requests

For fork-local PRs, explain the problem, summarize the change, list verification performed, and call out harness compatibility risks.

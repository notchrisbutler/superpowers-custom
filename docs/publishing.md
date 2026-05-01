# Publishing

SuperDuperPowers publishes as the scoped public npm package `@notchrisbutler/superduperpowers`.

Publishing never runs on pushes to `main`, tags, or GitHub Releases. It runs only when manually dispatched.

## npm Setup

1. Create or sign in to the npm account that owns the `@notchrisbutler` scope.
2. Enable 2FA on the npm account.
3. Configure npm Trusted Publishing for the real package workflow:

```text
Provider: GitHub Actions
Repository: notchrisbutler/superduperpowers
Workflow filename: publish.yml
Environment: npm
```

The package is public, so publishes use `npm publish --access public --provenance`.

## GitHub Setup

Create a GitHub Actions environment named `npm` in the repository settings. Add required reviewers if you want an approval gate before publish jobs can run.

No `NPM_TOKEN` secret is needed when Trusted Publishing is configured.

## Local Version Bump

Before publishing, bump the version locally and push the result to `main`:

```bash
scripts/bump-version.sh --next
scripts/bump-version.sh --check
scripts/bump-version.sh --audit
git add package.json README.md
git commit -m "Release v$(node -p "require('./package.json').version")"
git push origin main
```

For the current first package release, use the committed `package.json` version; run the check and audit commands before creating the release. Do not use leading zeroes such as `YYYY.04.DD`; npm semver requires `YYYY.M.D`.

The first release on a date uses `YYYY.M.D`. Additional releases on the same date use semver-compatible suffixes such as `YYYY.M.D-1`, `YYYY.M.D-2`, and so on. npm does not accept four numeric version segments such as `YYYY.M.D.1`.

You can also pass an explicit version:

```bash
scripts/bump-version.sh 2026.5.1
scripts/bump-version.sh 2026.5.1-1
```

## Dry Run

Run the `Publish package` workflow manually with:

```text
mode: dry-run
version: YYYY.M.D
dist_tag: latest
```

Dry-run mode validates package metadata and runs `npm publish --dry-run` with the selected npm dist-tag. It does not publish.

## Publish To npm

Create the GitHub Release separately if you want one:

```text
Tag: vYYYY.M.D
Release title: vYYYY.M.D
Target: main
```

Then run the `Publish package` workflow manually. Choose npm dist-tag `prerelease` for a pre-release and `latest` for a stable/latest release.

```text
mode: publish
version: YYYY.M.D
dist_tag: prerelease
```

Manual publish mode:

1. Checks out `main` at the workflow run ref.
2. Validates the input version and npm dist-tag.
3. Verifies `package.json.version` matches the input version.
4. Runs `npm publish --dry-run` with the selected npm dist-tag.
5. Publishes to npm with provenance and the selected dist-tag only if the dry run passed.

Use a new calendar version each time. npm will reject attempts to republish an already-published version.

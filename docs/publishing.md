# Publishing

SuperDuperPowers publishes as the scoped public npm package `@notchrisbutler/superduperpowers`.

Publishing is manual-only for now. The workflow does not run on pushes to `main` or tags.

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

For the one-time placeholder reservation workflow, also configure:

```text
Provider: GitHub Actions
Repository: notchrisbutler/superduperpowers
Workflow filename: publish-placeholder.yml
Environment: npm
```

The package is public, so publishes use `npm publish --access public --provenance`.

## GitHub Setup

Create a GitHub Actions environment named `npm` in the repository settings. Add required reviewers if you want an approval gate before publish jobs can run.

No `NPM_TOKEN` secret is needed when Trusted Publishing is configured.

## Reserve The npm Name

Use this only once, before the full package is ready to publish. It publishes a generated minimal package from the workflow workspace and does not modify, commit, or tag this repository.

Run the `Publish placeholder package` workflow manually with:

```text
mode: dry-run
version: 0.0.0
```

After the dry run succeeds and npm Trusted Publishing is configured for `publish-placeholder.yml`, rerun with:

```text
mode: publish
version: 0.0.0
```

The placeholder publish uses npm dist-tag `placeholder`, not `latest`. The later full publish can use a higher calendar version such as `2026.5.1` and dist-tag `latest`.

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
dist_tag: latest
```

Dry-run mode validates package metadata, confirms the release tag does not already exist, and runs `npm pack --dry-run`. It does not tag, push, or publish.

## Publish

Run the `Publish package` workflow manually with:

```text
mode: publish
dist_tag: latest
```

Publish mode:

1. Reads the committed version from `package.json` on `main`.
2. Confirms tag `v<version>` does not already exist.
3. Runs `npm pack --dry-run`.
4. Creates local tag `v<version>`.
5. Publishes to npm with provenance and the requested dist-tag.
6. Pushes tag `v<version>` to GitHub after npm publish succeeds.

Use a new calendar version each time. npm will reject attempts to republish an already-published version.

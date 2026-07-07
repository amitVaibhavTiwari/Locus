# Contributing to Locus

Thank you for your interest in contributing to Locus. Contributions are welcome for bug fixes, features, documentation, and anything else that makes Locus better. This guide exists to keep Locus stable and scalable as it grows. Please go through it once before opening a PR.

## Setting up locally

Clone the repo and follow the [Local Setup](README.md#local-setup) steps in the README.

## Before you start

If you want to work on a bug or feature that isn't already tracked, open an issue first. This avoids duplicated effort and lets us align on the approach before code is written. For small fixes (typos, obvious bugs), you can skip this and go straight to a PR.

## Branches

`main` is the stable branch. It reflects what users clone and deploy. Do not open PRs directly against `main`.

All contributions go through `stage` first. `stage` is the integration branch where changes are reviewed and tested before being promoted to `main`.

## Recommended workflow

This flow keeps your branch clean and avoids conflicts with `stage`, which may be ahead of `main` at any point.

1. **Branch off `main`** : Always start from `main`, not `stage`.
   ```bash
   git checkout main
   git pull origin main
   git checkout -b your-feature-branch
   ```

2. **Do your work** on that branch.

3. **Pull `stage` into your branch before opening a PR** : This surfaces any conflicts on your side before review.
   ```bash
   git pull origin stage
   ```

4. **Open a PR against `stage`** not `main`.

5. Once your PR is reviewed and merged into `stage`, **open a second PR from your original branch against `main`** . This is the PR that gets merged to production.

6. **If changes are requested** on your `stage` PR, make them on your original branch (branched from `main`), then pull `stage` again and push. Keep the `main` PR open as-is.

This way your `main` PR always stays clean and reflects exactly what will land in production.

## Pull requests

- Keep changes focused, one thing per PR
- Write a clear description of what changed and why
- Test your changes locally before opening the PR
- Keep PRs small where possible; large changes are harder to review and slower to merge

## Code guidelines

- TypeScript throughout the codebase and avoid `any`.
- Mutations go through Server Actions; Route Handlers are only used where Server Actions don't fit.
- All DB queries use Kysely. No string-interpolated SQL.
- Avoid adding dependencies unless nothing in the existing stack covers the need.
- All files are formatted with Prettier. If you have the [Prettier VS Code extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) it will handle this automatically on save, otherwise run `npx prettier --write .` before committing

## Reporting issues

Include the following when opening a bug report:

- What you expected vs. what happened
- Steps to reproduce
- Environment details (Node version, database type, deployment setup)

By contributing, you agree that your changes will be licensed under the same [MIT License](LICENSE) as the project.

# Crossword Maker

## Workflow: verify → bump → commit

The order is strict:

1. **Make the change.** Do NOT touch the version in `index.html` yet. Report what you did and stop.
2. **Wait for the user to verify end-to-end.** Not "tests pass" — the user has actually used the feature in the browser and said it works.
3. **Wait for explicit approval to commit** ("commit", "ship it", or equivalent). Code-complete is not approval. Verified is not approval. Only an explicit go-ahead is.
4. **Bump the version in `index.html`** (the `v1.x.y` string in the footer) as part of the commit. Never bump earlier — a premature bump means the displayed version doesn't match what's actually deployed, and if the user asks for more changes the bump has to be redone.
5. **Commit** with the version bump in the same commit. Never a follow-up "bump version" commit.

### Versioning rules

Every commit bumps the version. No exceptions — internal refactors, doc edits, and config tweaks all bump too. Follow semver:

- **Patch** (`1.4.1 → 1.4.2`): bug fixes, copy tweaks, small UI adjustments, internal changes.
- **Minor** (`1.4.x → 1.5.0`): new features, new options, meaningful UX changes.
- **Major** (`1.x.y → 2.0.0`): breaking changes to saved-puzzle format, auth, or core workflow.

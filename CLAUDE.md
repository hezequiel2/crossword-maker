# Crossword Maker

## Versioning

**Every commit bumps the version** in `index.html` (the `v1.x.y` string in the footer). No exceptions — internal refactors, doc edits, and config tweaks all bump too. Follow semver:

- **Patch** (`1.4.1 → 1.4.2`): bug fixes, copy tweaks, small UI adjustments, internal changes.
- **Minor** (`1.4.x → 1.5.0`): new features, new options, meaningful UX changes.
- **Major** (`1.x.y → 2.0.0`): breaking changes to saved-puzzle format, auth, or core workflow.

The bump goes in the same commit as the change — never a follow-up commit.

## Committing

Never commit without explicit user approval. Approval comes **after** the user has verified the change works end-to-end — not after you finish writing code, not after tests pass, not after a self-review. Make the change, report what you did, and wait. The user will say "commit" (or equivalent) once they've confirmed it themselves.

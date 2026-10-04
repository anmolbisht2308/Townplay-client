# Progress

- Done: Phases 0–6 (Phase 6: venue page plans/batches/club sessions + join, `/memberships` + `/memberships/[id]` pay/renew, owner `/owner/venues/[id]/memberships` plans/batches/members, `/owner/batches/[id]/attendance`, batch slots in the calendar, member discount + membership earnings).
- Next: Phase 7 (admin, reviews, analytics, launch readiness).
- Gotchas: `@townplay/shared` points to a local tarball (0.7.0) → after the server merges and releases shared-v0.7.0, set the release URL in `apps/web/package.json` and run `pnpm install` before committing.

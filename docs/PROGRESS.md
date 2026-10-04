# Progress

- Done: Phases 0–6 + UI redesign of the player journey (home, city, venue + booking, events, games, sign-in, bookings, account): new design system, CSS-only motion, mobile tab bar, loading skeletons. Lighthouse mobile: SEO 100, best practices 100, a11y 96–100, perf 75–83.
- Next: owner/admin screens in the new style, then Phase 7.
- Gotchas: never animate the LCP element or start fades at opacity 0; listings need `grid-cols-1` (minmax) or truncated text widens the page.

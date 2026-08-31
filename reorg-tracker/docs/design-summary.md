# Design summary

## Architecture decisions

**Stack: Vite + React + TypeScript + Tailwind v4 + Vitest, no router, no state library,
no component library.** The problem is a single-screen local tool with at most 30
records — a router and a state library would be pure ceremony. Tailwind v4's
`@tailwindcss/vite` plugin needs no `tailwind.config.js` and no `content` array (a real
trap for anything trained on v3 examples — see the AI interaction log), so setup is a
one-line `@import` plus a small `@theme` block.

**`src/org/` is pure TypeScript with no React import, checkable with one grep
(`npm run check:layering`, which also enforces that nothing in `src/` imports
`tests/`).** Validation, tree-building, rollups, transfer, and diff are five small,
independently testable modules, each with one job:

- `validate.ts` — the six load-error codes and their precedence order
- `tree.ts` — builds the reporting tree with source-ordered children
- `rollups.ts` — the two recursive formulas from the spec
- `transfer.ts` — the five transfer checks, then mutation
- `diff.ts` — `changed_rollup_ids`

**Tree and rollups are derived per render from `records`, never stored in state.** At
n ≤ 30 the full recompute is free, and derived state cannot go stale — there is no cache
to invalidate when a transfer succeeds. The one deliberate trade-off: this recomputes the
whole tree on every keystroke-adjacent render (e.g. selecting a row), not just after a
transfer. For 30 records that's microseconds, so it wasn't worth the complexity of
incremental patching.

**Transfer only ever changes one record's `manager_id`; it never reorders the underlying
array.** This is the single decision that makes "rebuild both affected direct-report
lists in source order" fall out for free: `tree.ts` builds each manager's children by
walking the full records array in its existing order and pushing into that manager's
list, so as long as the array's element positions never move, the moved employee lands
exactly where its original source index says relative to any pre-existing children of
its new manager — no manual list-splicing needed. Confirmed against the hand-worked
`docs/expected-results.md` numbers for `LEAD_A → MGR_B`, including the exact post-move
child order (`LEAD_A, LEAD_B, E_6` under `MGR_B`).

**Indented, file-explorer-style tree instead of a node-link chart.** Nested
`<div className="border-l ... pl-3">` blocks per level give the guide rail from normal
block nesting — no layout math, no external charting library, and it reads like a rollup
statement with headcount/payroll as right-aligned `tabular-nums` columns. Scales cleanly
to 30 rows, which a force-directed or manually-positioned node graph would not.

**Two separate pieces of transfer-outcome state** (`lastTransfer` for the last
*successful* transfer, `transferAttemptError` for the current attempt if rejected). The
spec requires a rejection to preserve every prior successful result; a single shared slot
would have made a rejected demo attempt (e.g. the cycle rejection, meant to be shown
right after the valid transfer) erase the valid transfer's own explanation from the
Impact Panel. See `docs/implementation-plan.md`'s "changes from plan" for how this was
verified.

**Two tree views, same underlying state.** `OrganizationPanel.tsx` toggles between the
required indented tree and an added box/node-link "org chart" (`OrgChart.tsx`) — both
render from the same `root`/`rollups`/`selectedId` props, so there's exactly one source
of truth and no risk of the two views disagreeing. The chart's connector lines are drawn
with plain positioned `<div>`s (the classic half-width-border technique), not an SVG
layout pass or a charting library — proportional to the "boring implementation" rule and
easy to reason about at ≤30 nodes. Adding it was scoped by `CLAUDE.md` itself as "a
stretch goal only if everything else is finished" — it was, so this came after the
required view, not instead of it. See `docs/ai-interaction-log.md` for the full review
of a proposed alternative UI spec and which parts of it conflicted with hard requirements
(currency abbreviation, colour-only state indicators, an under-sized example dataset,
missing names, a demo dataset that would have hidden the seven other load-error
fixtures) versus which parts were adopted (the palette, the chart, the old/new-manager
colour coding — added as a supplement to the required text badges, not a replacement).

**`formatCurrency` is the only place a number becomes a currency string**
(`src/format.ts`, `Intl.NumberFormat('en-IN', ...)`, whole units, Indian digit grouping,
₹ symbol). Nothing parses a formatted string back into a calculation.

## AI influence

This build was done with Claude Code driving the implementation directly (not just
suggesting snippets to paste), per the AI-assisted-interview format. Two moments worth
naming:

1. The Tailwind v4 vs. v3 setup trap named in `CLAUDE.md` didn't actually occur, because
   the v4 config was written directly from the spec rather than generated fresh and
   checked afterward — a case of a documented risk being avoided by writing the constraint
   into the prompt up front, rather than caught after the fact.
2. The Vite 8 / rolldown native-binding failure *did* occur, and was diagnosed and fixed
   by reading the actual error (an `engines.node` mismatch), not by retrying the same
   install. See `docs/ai-interaction-log.md` for the full account, including a
   self-caught bug in a property test (not the app) during Step 2.

## Trade-offs

- **Full recompute over incremental rollup patching** — simplicity and correctness over
  a performance concern that doesn't exist at this scale (≤30 records).
- **Indented tree first, node-link chart second, not instead** — the indented tree alone
  satisfies "clear organisation chart" within a one-day budget and no extra dependency;
  the box/node-link `OrgChart` view was added afterward as CLAUDE.md's own stretch goal,
  once the required view was done and tested. A comparison-drawer side-by-side view (the
  spec's other optional feature) was still deferred — one add-on was enough to demonstrate
  the pattern without over-spending rehearsal time on polish.
- **Chart connector lines via absolutely-positioned divs, not SVG or a layout library** —
  cheap to reason about and matches the "boring implementation" rule, but it has a real
  sharp edge: the connector's `left`/`right` must resolve against the column's full
  *padding* box, not its content box, or lines break at every sibling boundary above 2
  children. Got this wrong on the first pass (caught via a user screenshot, not before
  shipping it), fixed by switching the connector to `position: absolute` — documented in
  `docs/ai-interaction-log.md` since it's a real, previously-shipped bug, not a
  hypothetical.
- **CSS `transform: scale()` for chart zoom, not a pan/zoom library** — a wide or deep
  30-employee chart can outgrow the viewport; a simple scale transform inside the
  existing `overflow-auto` container handles that without adding a dependency, at the
  cost of no click-and-drag panning (horizontal/vertical scroll plus zoom-out covers it).
- **Property tests kept, not cut** — the plan flagged them as the first thing to cut if
  Step 3 overran; it didn't overrun, so 200 seeded departments × several invariants stayed
  in, at effectively zero extra runtime (the whole suite runs in well under a second).
- **`tsc --noEmit` instead of a linter** — after dropping `oxlint` for the toolchain-pin
  reason above, a full lint config wasn't worth adding back for a single-screen app;
  type-checking catches the errors that matter here.

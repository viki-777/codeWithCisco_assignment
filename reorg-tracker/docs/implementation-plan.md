# Implementation plan

Five ordered steps, each with a checkpoint that is evidence, not a feeling. Written
before implementation started; the "changes from plan" section at the end is honest
about where reality differed.

## Step 1 — Records and validation (~1h)

Employee type, the nine hand-authored fixtures, and structural validation implementing
the precedence order from the spec (invalid field/count → duplicate ID → root count →
self/unknown manager → cycle).

**Checkpoint:** tests show all six error codes returned for the right fixtures, in the
right precedence order, and the 12-person set builds one connected tree.

## Step 2 — Rollups and transfers (~1h15)

Recursive team headcount and payroll. The five transfer checks in specified order.
Validate the complete request before any mutation. Rebuild both affected child lists in
source order by re-deriving the tree from the (position-preserving) records array.
Compute `changed_rollup_ids`.

**Checkpoint:** tests assert the hand-worked numbers from `tests/expected.ts`; a rejected
transfer leaves state deep-equal to before.

## Step 3 — The workspace (~1h45)

Header with dataset selector and Load, indented org tree, source-ordered employee table,
selected-employee card, transfer controls, impact panel, error panel.

**Checkpoint:** load → inspect → transfer → attempt cycle → attempt root move → reset,
end to end, no console errors, no stale panels.

## Step 4 — Polish and edge cases (~45m)

Badge language (label + symbol, not colour alone), tabular numerals, the single currency
helper, empty and error states, the solo-department view.

**Checkpoint:** `docs/requirements-checklist.md` fully ticked.

## Step 5 — Evidence and rehearsal (~1h15)

Screenshots, the five process docs, two live modifications rehearsed cold.

**Checkpoint:** both modifications completed from a clean start in under eight minutes.

Total ≈ 6h, matching the take-home's stated budget. Property tests (a seeded generator
plus a few hundred randomized checks) were folded into Step 2, as planned, since they
were the first thing scoped to be cut if time ran short — they weren't cut; see
`tests/properties.test.ts` (617 tests total across the whole suite).

## Changes from the plan

- **Toolchain pin, not in the original plan.** `npm create vite@latest` pulled Vite 8
  (its new default `rolldown-vite` bundler), which failed to start on this machine's
  Node version (native binding resolution, not a config error). Pinned to the
  well-established `vite@^6`, `vitest@^2`, `@vitejs/plugin-react@^4` line instead, and
  dropped `oxlint` (replaced its `lint` script with `tsc --noEmit`, which needed no extra
  dependency). Full account in `docs/ai-interaction-log.md`. This cost real time but
  wasn't optional — the suite could not run at all beforehand.
- **`transferAttemptError` added to `AppState`,** beyond the shape sketched in the
  original design notes. The spec requires a rejected transfer to preserve "every prior
  successful result" — a single shared slot for both the last successful transfer and
  any rejection would have wiped the Impact Panel's explanation the moment a rejection
  was attempted right after a valid demo transfer. Splitting them into two fields keeps
  the impact panel showing the last *successful* transfer while the Transfer panel shows
  the *current* attempt's rejection, independently. Verified live in the browser: applied
  the valid `LEAD_A → MGR_B` transfer, then attempted the `MGR_A → E_3` cycle, and the
  impact panel stayed exactly as the valid transfer left it.
- **No separate "shuffled main department" fixture** was added to the dropdown, though
  early working notes considered one. `validate.test.ts` already covers "resolve managers
  by ID, not position" by reversing `mainDepartment`'s source order inline and asserting
  the tree still builds correctly and root children still land in reversed source order
  — a dedicated fixture would have tested the same property with more setup, not less.
- Everything else — dataset tiers, state model, repository layout, the five transfer
  checks, the property-test list — was followed as originally scoped.

# Test evidence

## How it was tested

Two layers: an automated test suite (`npm test`, Vitest) covering every required
correctness property, and manual end-to-end verification in a real browser (dev server,
driven through the actual UI, not just unit tests) covering the acceptance-criteria
scenarios that only show up in the wired-together app.

## Automated suite

```
npm test

 ✓ tests/rollups.test.ts     (5 tests)
 ✓ tests/transfer.test.ts    (14 tests)
 ✓ tests/validate.test.ts    (19 tests)
 ✓ tests/properties.test.ts  (579 tests)

 Test Files  4 passed (4)
      Tests  617 passed (617)

npm run lint             # tsc --noEmit — clean
npm run check:layering   # nothing in src/ imports tests/ — clean
```

### `tests/validate.test.ts` (19 tests) — load validation

- Accepts the 12-person main department; builds one connected tree with correct root and
  child order.
- Accepts a single-employee department.
- Resolves managers by ID regardless of source order (reversed main department still
  finds `HOD` as root and produces correctly-ordered — reversed — children).
- All six error codes, one fixture each: `INVALID_EMPLOYEE` (bad field shape and, in a
  separate case, record count outside 1–30), `DUPLICATE_EMPLOYEE_ID`,
  `INVALID_ROOT_COUNT`, `SELF_MANAGER`, `UNKNOWN_MANAGER`, `MANAGEMENT_CYCLE`.
- Precedence ordering: `precedenceDept` (duplicate ID + root count + unknown manager
  simultaneously) resolves to `DUPLICATE_EMPLOYEE_ID`, the earliest bucket. Two further
  hand-built cases confirm self-manager does not automatically beat unknown-manager —
  whichever record appears first in source order wins, in either direction.
- Six additional per-field `INVALID_EMPLOYEE` cases built directly from a spread of
  `mainDepartment[0]`: bad ID pattern, blank name, blank role, non-integer salary, salary
  0, salary over 1,000,000.

### `tests/rollups.test.ts` (5 tests) — team headcount and payroll

- Every value in `tests/expected.ts` (hand-worked, independent of the app) matches what
  `computeRollups` produces for the main department.
- Every leaf has headcount 1 and payroll equal to its own salary.
- Root headcount equals record count (12); root payroll equals the salary sum (707000).
- Generic invariant check: every node's headcount is `1 + sum(children headcounts)`,
  walked recursively over the whole tree.
- Solo department: headcount 1, payroll equal to the one salary.

### `tests/transfer.test.ts` (14 tests) — the reorganisation

- The documented `LEAD_A → MGR_B` transfer reproduces the hand-worked post-transfer
  rollups exactly (`MGR_A` 6→2/302000→130000, `MGR_B` 5→9/255000→427000).
- `changed_rollup_ids` is exactly `["MGR_A", "MGR_B"]`, in source order, and never
  includes the root.
- Both affected managers' direct-report lists come out correctly ordered:
  `MGR_A` → `["E_3"]`, `MGR_B` → `["LEAD_A", "LEAD_B", "E_6"]` (the moved lead lands
  first, per its source index).
- The moved subtree's own salary, membership, and rollup are unchanged by the move; all
  twelve source positions are unchanged.
- Reapplying the same transfer to a fresh load reproduces an identical result
  (deep-equal).
- All five rejection codes, one case each: `UNKNOWN_TRANSFER_EMPLOYEE` (bad employee id
  and, separately, bad manager id), `ROOT_MOVE_FORBIDDEN`, `SELF_MANAGER`,
  `ALREADY_REPORTS_TO_MANAGER`, `MANAGEMENT_CYCLE`.
- The documented cycle rejection (`MGR_A → E_3`) is rejected both before and after the
  valid `LEAD_A → MGR_B` transfer, as the spec requires being demonstrable in either
  order. A second cycle case checks a deeper subtree member (`MGR_A → E_7`).
- Atomicity: a rejected transfer leaves the input employee array byte-for-byte
  (deep-equal) unchanged.

### `tests/properties.test.ts` (579 tests) — seeded generator, 200 departments

A deterministic mulberry32 PRNG builds 200 single-rooted, acyclic departments (sizes
1–30, cycling through the range), never reused for the demo data. For every seed:

- The department validates and forms one connected tree.
- Root headcount equals record count; root payroll equals the salary sum.
- Every leaf has headcount 1; every parent's headcount/payroll equals `1 + sum(children)`.
- A randomly chosen valid, non-cycle transfer leaves the root's headcount and payroll
  unchanged, and the moved subtree's membership identical before and after.
- A randomly chosen descendant-as-manager transfer is always rejected with
  `MANAGEMENT_CYCLE` and leaves the employee array deep-equal to before.

(One property-test bug was found and fixed during development — a candidate pool that
could pick the tree's root as the "manager to relocate," which correctly gets
`ROOT_MOVE_FORBIDDEN` rather than the `MANAGEMENT_CYCLE` the test assumed. Documented in
`docs/ai-interaction-log.md`; the fix was to the test, not the implementation.)

## Manual end-to-end verification (real browser, `npm run dev`)

Every scenario below was driven through the actual rendered UI and confirmed by reading
the page's text content (not just visually), with the browser console checked for errors
after each step (none, throughout):

1. **Load** the main department → header shows "12 employees, ₹7,07,000 total payroll";
   tree and table both show every rollup value matching `docs/expected-results.md`
   exactly, root selected by default.
2. **Apply the documented transfer** (`LEAD_A → MGR_B`) → impact panel shows
   "Karan Bose moved from Rahul Sen to Devika Iyer," moved-subtree line reads "4 people,
   ₹1,72,000," the before→after table shows exactly `MGR_A` and `MGR_B`'s numbers, and an
   explicit `Priya Nair (HOD) — unchanged, 12 → 12, ₹7,07,000 → ₹7,07,000` row. Tree and
   table both show `◆ selected` + `↗ moved` on `LEAD_A` and `Δ changed` on `MGR_A`/`MGR_B`.
3. **Attempt the documented cycle** (`MGR_A → E_3`) → inline `MANAGEMENT_CYCLE` message
   appears in the Transfer panel; the impact panel, tree, and table are byte-for-byte the
   same as after step 2 — nothing from the valid transfer was disturbed.
4. **Attempt a root move** (`HOD → MGR_B`) → inline `ROOT_MOVE_FORBIDDEN`, same
   non-disturbance check.
5. **Reset** → tree and table return to the original 12-record layout (`LEAD_A` back
   under `MGR_A`), `HOD` re-selected by default, both badges cleared, impact panel back
   to "No transfer applied yet."
6. **Load an invalid department** (`precedenceDept`) → the entire workspace (tree, table,
   right rail, employee/payroll counts) is replaced by the `DUPLICATE_EMPLOYEE_ID` error
   panel; nothing from the previously-loaded valid department remains on screen.
7. **Load the solo department** → tree/table show one row, headcount 1, payroll
   ₹1,50,000, 0 direct reports; both transfer dropdowns list only the one (root)
   employee.

### Org chart view — connector-line fix and 30-employee scaling

Added after a post-build redesign (see `docs/design-summary.md` and
`docs/ai-interaction-log.md`). Re-verified separately since it touched rendering logic
a first pass of manual testing hadn't exercised (3+ siblings under one node):

8. **Reproduced a reported bug**: applied `LEAD_A → HOD`, giving the root three direct
   children. The connector lines between them had visible gaps (a padding/positioning
   bug — the connector overlay resolved against each column's content box instead of its
   full padding box). Fixed by making the connector `position: absolute`; reloaded and
   confirmed the same three-sibling layout now renders one continuous line across all
   three, with no visual break at either sibling boundary.
9. **30-employee stress test**: built a temporary fixture (5-way branching root, mixed
   depth, exactly 30 records), loaded it, and confirmed the chart still renders correct
   connector lines throughout at that size, the zoom controls (40%–150%, added at the
   same time to handle a chart wide enough to outgrow the viewport) worked as expected,
   and the console stayed error-free. The fixture and its wiring were removed afterward —
   `npm test` / `tsc --noEmit` / `check:layering` all re-confirmed clean, and the dataset
   dropdown is back to exactly the nine required fixtures.
10. **No magic-number coupling**: `grep -n '\b12\b' src` turned up only an SVG icon
    coordinate and the display label `'Main department (12)'` — no computation, layout,
    or rendering logic anywhere references the literal employee count.

## Edge cases specifically covered

- Employee count outside 1–30 (both 0 and 31).
- Every one of the six load-error codes, individually and in a documented multi-error
  precedence collision.
- Records arriving in non-source order (managers resolved by ID, not array position).
- A self-manager record that appears after an unknown-manager record, and vice versa
  (precedence is positional, not code-type-based).
- Every one of the five transfer rejection codes, individually.
- The one documented cycle check demonstrated in both possible orders relative to the
  valid transfer.
- A rejected transfer immediately following a successful one, checked for zero
  side-effects on the prior result.
- A single-employee department (headcount/payroll = the one record; 0 direct reports).

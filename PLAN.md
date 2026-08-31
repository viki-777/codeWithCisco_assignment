# Departmental Reorg Payroll Rollup Tracker — build plan

Vite + React + TypeScript + Tailwind v4 + Vitest. Local only, no backend.

---

## Part A — Implementation plan (the version you present)

This is the deliverable the Student Guide asks for: 3–5 ordered steps, each with a
checkpoint that is actual evidence rather than a feeling.

### Step 1 — Records and validation (~1h)

Employee type, the hand-authored fixtures, and structural validation with the
precedence order the PS specifies.

**Checkpoint:** `npm test` shows all six error codes returned for the right fixtures,
in the right precedence order, and the 12-person set builds one connected tree.

### Step 2 — Rollups and transfers (~1h15)

Recursive team headcount and payroll. The five transfer checks in specified order.
Validate fully, then mutate. Rebuild both affected child lists in source order.
Compute `changed_rollup_ids`.

**Checkpoint:** tests assert the hand-worked numbers from `tests/expected.ts`; a
rejected transfer leaves state deep-equal to before.

### Step 3 — The workspace (~1h45)

Header with dataset selector and Load, indented org tree, source-ordered employee
table, selected-employee card, transfer controls, impact panel, error panel.

**Checkpoint:** load → inspect → transfer → attempt cycle → attempt root move → reset,
end to end, no console errors, no stale panels.

### Step 4 — Polish and edge cases (~45m)

Badge language, tabular numerals, currency helper, empty and error states, the
solo-department view.

**Checkpoint:** `docs/requirements-checklist.md` fully ticked.

### Step 5 — Evidence and rehearsal (~1h15)

Screenshots, the five docs, two live modifications rehearsed cold.

**Checkpoint:** both modifications completed from a clean start in under eight minutes.

Total ≈ 6h. Property tests are folded into step 2 and are the first thing to cut if
time runs short.

---

## Part B — Working notes (not for the presentation)

### B1. Dataset strategy

Three tiers, kept strictly separate.

**Tier 1 — hand-authored, deterministic, in `src/data/`.** These drive the demo and
all exact-value assertions.

| Fixture | Purpose |
| --- | --- |
| `mainDepartment` | the 12-person demo |
| `soloDepartment` | required headcount-1 case |
| `duplicateIdDept` | `DUPLICATE_EMPLOYEE_ID` |
| `unknownManagerDept` | `UNKNOWN_MANAGER` |
| `cycleDept` | `MANAGEMENT_CYCLE` |
| `twoRootsDept` | `INVALID_ROOT_COUNT` |
| `selfManagerDept` | `SELF_MANAGER` |
| `badFieldDept` | `INVALID_EMPLOYEE` — blank name, bad ID shape, salary 0 |
| `precedenceDept` | deliberately carries several errors at once; asserts ordering |

All of these appear in the header dropdown. That is what makes the "a failed load must
show no partial tree, totals, or stale result" requirement demonstrable on screen
rather than only in a test file.

**Tier 2 — the shuffled main department.** Same 12 records, scrambled source order.
Rollup values are order-independent, so this asserts equal rollups without needing a
second set of hand-worked numbers. It proves managers are resolved by ID rather than
by position. Note it will produce different sibling ordering and a different
`changed_rollup_ids` order, so do not reuse the main expected constants for those.

**Tier 3 — seeded generator, in `tests/support/`.** Deterministic PRNG (mulberry32),
`makeDepartment(seed, n)` for n in 1..30. Each employee after the first picks a parent
from those already created, which makes a single-rooted acyclic tree by construction;
source order is then shuffled. Odd names are fine — syllable concatenation.

Hard rule: `src/` never imports from `tests/`. Add a grep to the test script so this
can't drift.

### B2. Property tests

The payoff for the generator. For a few hundred seeded departments:

- validation accepts every generated department
- `root.headcount === n` and `root.payroll === sum(salaries)`
- every leaf has headcount 1
- `headcount(parent) === 1 + sum(headcount(children))`
- pick a random valid transfer: total headcount unchanged, root payroll unchanged,
  moved subtree membership identical before and after
- pick a random descendant-as-manager transfer: rejected, and state deep-equal

### B3. The main dataset

Source order as listed.

| # | ID | Name | Role | Salary | Manager |
| --- | --- | --- | --- | ---: | --- |
| 1 | `HOD` | Priya Nair | Department head | 150000 | null |
| 2 | `MGR_A` | Rahul Sen | Programme manager | 90000 | `HOD` |
| 3 | `MGR_B` | Devika Iyer | Laboratory manager | 85000 | `HOD` |
| 4 | `LEAD_A` | Karan Bose | Project lead | 65000 | `MGR_A` |
| 5 | `LEAD_B` | Nikhil Varma | Research lead | 62000 | `MGR_B` |
| 6 | `E_1` | Meera Joshi | Senior developer | 45000 | `LEAD_A` |
| 7 | `E_2` | Arjun Menon | Developer | 42000 | `LEAD_A` |
| 8 | `E_3` | Anita Rao | Data analyst | 40000 | `MGR_A` |
| 9 | `E_4` | Vikram Das | Lab technician | 38000 | `LEAD_B` |
| 10 | `E_5` | Farah Khan | Lab technician | 36000 | `LEAD_B` |
| 11 | `E_6` | Sana Qureshi | Coordinator | 34000 | `MGR_B` |
| 12 | `E_7` | Tanvi Shah | Research intern | 20000 | `E_1` |

Demo moves: valid `LEAD_A → MGR_B`; cycle `MGR_A → E_3` (works in either order because
`E_3` stays inside `MGR_A`'s subtree throughout); root `HOD → MGR_B`.

Hand-worked totals go in `docs/expected-results.md` and are transcribed into
`tests/expected.ts` as literal constants.

### B4. Repository layout

```
reorg-tracker/
├── README.md
├── docs/
│   ├── implementation-plan.md
│   ├── expected-results.md
│   ├── design-summary.md
│   ├── ai-interaction-log.md
│   ├── requirements-checklist.md
│   └── test-evidence.md
├── src/
│   ├── org/
│   │   ├── types.ts
│   │   ├── validate.ts      validation + precedence
│   │   ├── tree.ts          build children lists in source order
│   │   ├── rollups.ts       headcount + payroll
│   │   ├── transfer.ts      five checks, validate-then-mutate
│   │   └── diff.ts          changed_rollup_ids
│   ├── data/                the nine fixtures
│   ├── ui/                  App, Header, OrgTree, EmployeeTable,
│   │                        EmployeeDetail, TransferPanel,
│   │                        ImpactPanel, ErrorPanel
│   ├── format.ts            formatCurrency — the only place money is stringified
│   └── main.tsx
└── tests/
    ├── expected.ts          hand-worked constants, never imported by src/
    ├── support/generateDepartment.ts
    ├── validate.test.ts
    ├── rollups.test.ts
    ├── transfer.test.ts
    └── properties.test.ts
```

Nothing in `src/org/` imports React. That is the whole architecture claim, and it is
checkable in one grep during the interview.

### B5. State model

```ts
type AppState = {
  datasetId: string
  baseline: readonly Employee[]   // frozen at load, never mutated
  records: Employee[]             // current
  selectedId: string | null
  form: { employeeId: string; newManagerId: string }
  lastTransfer: TransferOutcome | null
  previousRollups: RollupMap | null
}
```

Tree and rollups are derived per render from `records`, not stored. Derived state can't
go stale. At n ≤ 30 the recompute is free, and "I recompute rather than patch totals
incrementally" is a trade-off worth stating out loud.

Reset rebuilds `records` from `baseline` and clears `selectedId`, `form`, `lastTransfer`
and `previousRollups` — the PS asks for the controls and highlights to reset too, not
just the manager links.

A failed load produces `{ error }` only. The UI renders the error panel *instead of*
the tree, table and totals — never above them.

### B6. Tailwind v4 setup

```
npm create vite@latest reorg-tracker -- --template react-ts
npm i tailwindcss @tailwindcss/vite
npm i -D vitest
```

`vite.config.ts` gets `tailwindcss()` in plugins. `index.css` is one line:
`@import "tailwindcss";` plus an `@theme` block for the accent, warning and rail
colours.

Known trap: most AI assistants still generate the v3 setup — `tailwind.config.js`,
`content: [...]`, `@tailwind base/components/utilities`. None of that applies in v4 and
it fails silently, producing an unstyled page. Pin the version in your prompt. If it
happens, it is a real and useful entry for the AI interaction log.

### B7. Live modifications — prepare three

1. **Team payroll share.** `teamPayroll / rootPayroll * 100`, one decimal. Touches the
   detail card only.
2. **Employee search.** Filters the table, preserves source order among matches, does
   not touch records or tree.
3. **Up/down arrows in the impact panel.** Presentation-only, one component.

All three are single-file changes because currency formatting and rollup derivation
each live in one place. Say that when it happens — it is the architecture paying off
in front of the interviewer.

Rehearsal script: restate the outcome, name the constraint ("presentation only, no
change to how payroll is calculated"), write the prompt, read the diff aloud, run the
tests, show the screen.

### B8. Risks

| Risk | Mitigation |
| --- | --- |
| Tailwind v4 setup burns 30 min | exact commands above, before anything else |
| Sibling ordering bug (`push` instead of rebuild) | test written before the code |
| Root wrongly marked as affected | explicit test asserting `HOD ∉ changed_rollup_ids` |
| Currency abbreviated in the UI | single `formatCurrency`, no `k`/`L` anywhere |
| Dropdowns filtered to valid targets only | keep permissive; rejections must be demoable |
| Docs squeezed at the end | log prompts as you go, two lines each |

### B9. Requirements checklist seed

```
[ ] 12 employees, one root, two branches
[ ] ≥3 employees with direct reports        [ ] depth ≥3 links below head
[ ] movable non-leaf lead                   [ ] all salaries distinct
[ ] load in one action                      [ ] solo department, headcount 1
[ ] supports 1..30 records
[ ] six load error codes                    [ ] precedence order
[ ] failed load clears everything
[ ] leaf hc=1                               [ ] root hc=12, payroll=707000
[ ] valid transfer, subtree intact          [ ] siblings in source order
[ ] changed_rollup_ids exact, source order  [ ] root shown unchanged
[ ] MANAGEMENT_CYCLE rejected               [ ] ROOT_MOVE_FORBIDDEN rejected
[ ] SELF_MANAGER, ALREADY_REPORTS_TO_MANAGER, UNKNOWN_TRANSFER_EMPLOYEE
[ ] rejection atomic                        [ ] reset restores selection + controls
[ ] reapplying same transfer reproduces result
[ ] no rounding or abbreviation of currency
[ ] labels/symbols as well as colour
```

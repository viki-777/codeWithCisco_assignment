# HANDOFF — Departmental Reorg Payroll Rollup Tracker

Drop this at the repo root as `CLAUDE.md` (or `HANDOFF.md`) so it loads as standing
context. It is self-contained: it does not depend on the chat that produced it.

Also copy the original problem statement into `docs/problem-statement.md` and keep it
there. When a rule below and the problem statement disagree, the problem statement wins.

---

## 0. What this is

An AI-assisted take-home interview task (problem SPR26_D2_P04). A local browser app
that loads a flat employee list, builds one validated reporting tree, computes each
employee's whole-team headcount and payroll, lets an admin move an employee (with their
entire subtree) under a different manager, and explains exactly which totals changed.

The interview scores the *process* as much as the code: an ordered plan, honest
documentation of AI prompting, test evidence, and the ability to make a small live
change under observation. So: small, readable, explainable. No cleverness that can't be
defended out loud.

Budget is roughly six focused hours.

---

## 1. Non-negotiable rules from the spec

Violating any of these costs marks. They are the acceptance criteria in compressed form.

**Records**

- Engine supports 1–30 employees. The demo department has exactly 12.
- `employee_id` matches `[A-Z][A-Z0-9_-]{0,15}` and is unique.
- `name` and `role` non-empty after trimming. `monthly_salary` is a whole number, 1 to
  1,000,000. `manager_id` is `null` or another employee's ID.
- Exactly one employee has `manager_id: null`. Nobody manages themself.
- Records may arrive in **any order**. Resolve managers by ID, never by position.
- **Source order is preserved** in the employee table and among each manager's direct
  reports.

**Load validation** — reject before computing or displaying anything. Error codes:
`INVALID_EMPLOYEE`, `DUPLICATE_EMPLOYEE_ID`, `INVALID_ROOT_COUNT`, `UNKNOWN_MANAGER`,
`SELF_MANAGER`, `MANAGEMENT_CYCLE`.

Precedence when a dataset has several problems:

```
1. invalid field or count
2. duplicate ID
3. root count
4. self-manager OR unknown manager   <- same bucket
5. cycle
```

Within a bucket, source-record order decides. Note step 4: a self-reference does not
automatically beat an unknown reference — whichever record appears first wins.

A failed load must show **no** partial tree, totals, transfer result, or leftover state
from a previously valid department.

**Rollups**

```
team_headcount(e) = 1 + sum(team_headcount(child))
team_payroll(e)   = monthly_salary(e) + sum(team_payroll(child))
```

Both include `e`. A leaf is headcount 1. Root headcount must equal the record count and
root payroll must equal the sum of all salaries — treat a violation as a bug, not an
alternative reading.

Whole currency units only. Format for display with separators or a symbol; **never
round, never abbreviate** (no `₹145k`, no lakh shorthand), and never parse a displayed
string back into a calculation.

**Transfers** — check in this order, all before any mutation:

```
1. UNKNOWN_TRANSFER_EMPLOYEE   either ID unknown
2. ROOT_MOVE_FORBIDDEN         selected employee is the root
3. SELF_MANAGER                both IDs the same
4. ALREADY_REPORTS_TO_MANAGER  already a direct report of that manager
5. MANAGEMENT_CYCLE            proposed manager is inside the selected subtree
```

A rejected transfer is atomic: every manager link, rollup, and prior result survives
untouched. On success, only the selected employee's `manager_id` changes; the subtree,
salaries and source positions do not. Rebuild **both** affected child lists in source
order — the moved employee lands where its source index says, and no other sibling
shifts relative to its neighbours.

`changed_rollup_ids` is exactly those employees whose headcount or payroll differs from
immediately before the transfer, **listed in source order**. An unchanged common
ancestor is not "affected" merely because it sits above both branches — the root
typically does not change on a within-department move, and must not be marked as
changed.

Reset restores the original records, rollups, default selected employee, empty transfer
controls, and clears every result and highlight.

**Out of scope** — accounts, auth, databases, HR integrations, salary editing,
hiring/firing, tax, dotted-line reporting, approvals, reorg history. Do not add them.

---

## 2. Stack and setup

Vite + React + TypeScript + Tailwind v4 + Vitest. No router, no state library, no
component library, no charting library.

```bash
npm create vite@latest reorg-tracker -- --template react-ts
cd reorg-tracker
npm i tailwindcss @tailwindcss/vite
npm i -D vitest
```

`vite.config.ts` — add `tailwindcss()` to `plugins`.
`src/index.css` — `@import "tailwindcss";` plus an `@theme` block for accent, warning
and rail colours. That is the whole setup.

**Trap:** Tailwind v4 has no `tailwind.config.js`, no `content` array, and no
`@tailwind base/components/utilities`. Generated v3-style setup fails silently to an
unstyled page. If that happens, note it in the AI interaction log — it is a genuine
"caught the model being wrong" entry.

Scripts: `dev`, `build`, `test`, and a `check:layering` grep asserting that nothing in
`src/` imports from `tests/`.

---

## 3. Architecture

```
src/org/     pure TypeScript. No React import anywhere in this folder.
src/data/    the nine fixtures
src/ui/      React components, presentation only
src/format.ts   formatCurrency — the ONLY place money becomes a string
tests/       vitest, including tests/expected.ts and the seeded generator
```

```
reorg-tracker/
├── docs/
│   ├── problem-statement.md
│   ├── implementation-plan.md
│   ├── expected-results.md
│   ├── design-summary.md
│   ├── ai-interaction-log.md
│   ├── requirements-checklist.md
│   └── test-evidence.md
├── src/
│   ├── org/{types,validate,tree,rollups,transfer,diff}.ts
│   ├── data/{mainDepartment,soloDepartment,invalidDepartments}.ts
│   ├── ui/{App,Header,OrgTree,EmployeeTable,EmployeeDetail,
│   │        TransferPanel,ImpactPanel,ErrorPanel}.tsx
│   ├── format.ts
│   └── main.tsx
└── tests/
    ├── expected.ts
    ├── support/generateDepartment.ts
    └── {validate,rollups,transfer,properties}.test.ts
```

State lives in `App.tsx`:

```ts
type AppState = {
  datasetId: string
  baseline: readonly Employee[]      // frozen at load
  records: Employee[]                // current
  selectedId: string | null
  form: { employeeId: string; newManagerId: string }
  lastTransfer: TransferOutcome | null
  previousRollups: RollupMap | null
}
```

Tree and rollups are **derived per render** from `records`, never stored. At n ≤ 30 the
recompute is free and derived state cannot go stale. Full recomputation over
incremental patching is a deliberate trade-off — be ready to say why.

A failed load yields `{ error }` only, and the UI renders the error panel *instead of*
the tree, table and totals.

---

## 4. Data

### Fixtures — hand-authored, in `src/data/`, all reachable from the header dropdown

`mainDepartment` (12) · `soloDepartment` (1) · `duplicateIdDept` ·
`unknownManagerDept` · `cycleDept` · `twoRootsDept` · `selfManagerDept` ·
`badFieldDept` (blank name, bad ID shape, salary 0) · `precedenceDept` (several errors
at once, asserts the ordering rule).

Putting the broken ones in the dropdown is what makes "a failed load clears everything"
demonstrable on screen rather than only in a test file.

### The main department — source order as listed

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

Shape check: one root; two branches; five employees have direct reports; `E_7` sits four
links below the head; all twelve salaries distinct. Salary sum **707000**.

### Expected results — worked by hand, not by this codebase

Initial:

| ID | Headcount | Payroll |
| --- | ---: | ---: |
| `HOD` | 12 | 707000 |
| `MGR_A` | 6 | 302000 |
| `MGR_B` | 5 | 255000 |
| `LEAD_A` | 4 | 172000 |
| `LEAD_B` | 3 | 136000 |
| `E_1` | 2 | 65000 |
| `E_2` | 1 | 42000 |
| `E_3` | 1 | 40000 |
| `E_4` | 1 | 38000 |
| `E_5` | 1 | 36000 |
| `E_6` | 1 | 34000 |
| `E_7` | 1 | 20000 |

Demonstration transfer: **`LEAD_A` → `MGR_B`**. Moves 4 people and 172000.

| ID | Headcount | Payroll |
| --- | ---: | ---: |
| `MGR_A` | 6 → 2 | 302000 → 130000 |
| `MGR_B` | 5 → 9 | 255000 → 427000 |
| `HOD` | 12 (unchanged) | 707000 (unchanged) |

`changed_rollup_ids = ["MGR_A", "MGR_B"]`. Everyone else is unchanged.

After the move, `MGR_B`'s direct reports in source order are `LEAD_A`, `LEAD_B`, `E_6` —
the moved lead lands **first**, because its source index (4) precedes both. That
ordering is a required behaviour, not a cosmetic detail.

Rejections to demonstrate:

- `MGR_A → E_3` → `MANAGEMENT_CYCLE`. `E_3` stays inside `MGR_A`'s subtree both before
  and after the valid move, so this works in either order, as the spec requires.
- `HOD → MGR_B` → `ROOT_MOVE_FORBIDDEN`.

These numbers go into `docs/expected-results.md` as prose and into `tests/expected.ts`
as literal constants. **`src/` must never import `tests/expected.ts`** — the app has to
compute its own answers.

### Seeded generator — `tests/support/generateDepartment.ts`

Deterministic mulberry32 PRNG. `makeDepartment(seed, n)` for n in 1..30: each employee
after the first picks a parent from those already created (single-rooted and acyclic by
construction), then source order is shuffled. Odd syllable-concatenation names are fine.

It exists for property tests only. It must never generate the demo data — the spec
requires the demo department to be deterministic and independently documented, and
generating it would make the app grade its own homework.

Property tests over a few hundred seeds:

- validation accepts every generated department
- `root.headcount === n`; `root.payroll === sum(salaries)`
- every leaf has headcount 1
- `headcount(parent) === 1 + sum(headcount(children))`
- a random valid transfer leaves total headcount and root payroll unchanged, and the
  moved subtree's membership identical
- a random descendant-as-manager transfer is rejected and leaves state deep-equal

---

## 5. UI

Layout: header (title, dataset select, Load, Reset, employee count, total payroll) ·
left column with the org tree above the source-ordered employee table · right rail with
selected-employee card, transfer controls, impact panel.

**Tree is indented, not a centred node-link chart.** File-explorer style with a
`border-left` guide rail per level, headcount and payroll as right-aligned columns with
`tabular-nums`. It reads like a rollup statement, scales to 30 rows, needs no layout
maths, and makes source order visible. A node-link chart is a stretch goal only if
everything else is finished.

Three visual states, each carrying a **label or symbol as well as colour** (required):

```
◆ selected     ↗ moved      Δ changed
```

The impact panel lists changed rollups in source order and additionally shows the root
as an explicit "unchanged" row. That row is deliberate: it demonstrates you distinguish
structural ancestry from financial impact.

**Do not filter the transfer dropdowns to valid targets.** Every employee including the
root must stay selectable, or the required `MANAGEMENT_CYCLE`, `ROOT_MOVE_FORBIDDEN`,
`SELF_MANAGER` and `ALREADY_REPORTS_TO_MANAGER` rejections become impossible to
demonstrate. Let the rules reject and show the error.

---

## 6. Plan and current position

| Step | Work | Checkpoint |
| --- | --- | --- |
| 1 | types, nine fixtures, validation with precedence, tree build | tests show all six codes in the right precedence; the 12 build one tree |
| 2 | rollups, transfer with five checks, validate-then-mutate, diff | tests assert §4 numbers from `tests/expected.ts`; rejected transfer leaves state deep-equal |
| 3 | header, tree, table, detail, transfer, impact, error panels | load → inspect → transfer → cycle → root move → reset, clean console |
| 4 | badges, tabular numerals, currency, empty/error states, solo view | requirements checklist fully ticked |
| 5 | screenshots, five docs, two live modifications rehearsed | both mods done cold in under eight minutes |

**Current position: nothing built. Start at step 1.**

Property tests fold into step 2 and are the first thing to cut if step 3 overruns.

---

## 7. Live modifications to keep ready

1. Team payroll share — `teamPayroll / rootPayroll * 100`, one decimal, detail card only.
2. Employee search — filters the table, preserves source order among matches, does not
   touch records or the tree.
3. Up/down arrows in the impact panel — presentation only.

Each is a single-file change because currency formatting and rollup derivation each live
in exactly one place. Rehearsal: restate the outcome, name the constraint, write the
prompt, read the diff aloud, run the tests, show the screen.

---

## 8. Standing instructions while building

- Append to `docs/ai-interaction-log.md` as you go — two lines per meaningful prompt:
  what was asked, what was accepted or rejected and why. Do not reconstruct it at the
  end and do not invent entries; a fabricated debugging story dies to one follow-up
  question.
- When a test fails, write the regression test before the fix.
- Prefer the boring implementation. Every abstraction has to be defensible in one
  sentence during a 30-minute interview.
- Keep `docs/requirements-checklist.md` updated as features land.

---

## 9. First task

> Set up the Vite + React + TS + Tailwind v4 + Vitest project per §2, then complete
> step 1: `src/org/types.ts`, the nine fixtures in `src/data/`, `src/org/validate.ts`
> implementing the precedence order in §1, and `src/org/tree.ts` building source-ordered
> child lists. Write `tests/validate.test.ts` covering all six error codes plus the
> multi-error precedence fixture. No UI and no React yet. Also write
> `docs/expected-results.md` from the tables in §4 and `tests/expected.ts` with the same
> values as literal constants.

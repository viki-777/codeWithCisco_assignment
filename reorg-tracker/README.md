# Departmental Reorg Payroll Rollup Tracker

A local browser app that turns a flat employee list into one validated reporting tree,
computes each employee's whole-team headcount and payroll, lets an administrator move an
employee (with their entire subtree) under a different manager, and explains exactly
which totals changed. Built for problem SPR26_D2_P04 — see [`docs/problem-statement.md`](docs/problem-statement.md).

## Running it

```bash
npm install
npm run dev      # starts the dev server, prints a localhost URL
```

Open the printed URL, pick a dataset from the dropdown (the 12-person **Main department**
is the default), click **Load**, and use the workspace: click any row in the tree or
table to inspect it, use the **Transfer** panel to move an employee, and read the result
in **Transfer impact**.

Other commands:

```bash
npm test              # runs the full test suite (vitest)
npm run lint           # type-checks with tsc --noEmit
npm run check:layering # asserts nothing in src/ imports from tests/
npm run build           # production build
```

## Sample data

Nine fixtures ship in [`src/data/`](src/data/) and are all reachable from the header
dropdown:

- **Main department (12)** — the deterministic demo department documented in
  [`docs/expected-results.md`](docs/expected-results.md); one root, two branches, a
  four-links-deep employee, and a movable non-leaf lead.
- **Solo department (1)** — the required headcount-1 case.
- Seven deliberately invalid departments, one per required load-error code (plus one,
  `precedenceDept`, that carries three simultaneous problems to demonstrate the
  precedence rule).

## Project layout

```
src/org/     pure TypeScript — validation, tree, rollups, transfer, diff. No React import.
src/data/    the nine fixtures
src/ui/      React components (presentation only)
src/format.ts   formatCurrency — the only place money becomes a string
tests/       vitest — unit tests plus a seeded-generator property-test suite
docs/        problem statement, plan, expected results, AI log, design summary, tests
```

See [`docs/implementation-plan.md`](docs/implementation-plan.md) for the ordered build
plan and checkpoints, and [`docs/design-summary.md`](docs/design-summary.md) for
architecture decisions and trade-offs.

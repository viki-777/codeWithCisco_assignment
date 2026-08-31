# Requirements checklist

Kept up to date as features land. Seeded from PLAN.md §B9.

## Records / demo dataset

- [x] 12 employees, one root, two branches
- [x] ≥3 employees with direct reports (six: `HOD`, `MGR_A`, `MGR_B`, `LEAD_A`, `LEAD_B`, `E_1`)
- [x] depth ≥3 links below head (`E_7` is four links below `HOD`)
- [x] movable non-leaf lead (`LEAD_A`, carries `E_1`/`E_2`/`E_7`)
- [x] all salaries distinct
- [x] load in one action (dataset dropdown + Load button, verified in browser)
- [x] solo department, headcount 1 (`soloDepartment`, tested)
- [x] supports 1..30 records (tested: 0 and 31 both rejected)

## Load validation

- [x] six load error codes implemented and unit tested
- [x] precedence order implemented and unit tested (`precedenceDept`, plus two
      hand-built self-vs-unknown ordering cases)
- [x] failed load clears everything — verified in browser: loading `precedenceDept`
      replaces the whole workspace with the error panel, no stale tree/table/rail/counts

## Rollups

- [x] leaf hc=1 (tested directly and via property tests)
- [x] root hc=12, payroll=707000 (tested against `tests/expected.ts`, confirmed in browser)
- [x] selecting an employee shows role/salary/direct-report count/team totals without
      mutating the tree (`EmployeeDetail`, read-only, verified in browser)

## Transfers

- [x] valid transfer, subtree intact (`docs/expected-results.md` numbers reproduced exactly,
      confirmed in unit tests and live in the browser)
- [x] siblings rebuilt in source order (`MGR_B` children come out `LEAD_A, LEAD_B, E_6`)
- [x] `changed_rollup_ids` exact, source order, root excluded
- [x] root shown unchanged, explicit row (impact panel, confirmed in browser)
- [x] `MANAGEMENT_CYCLE` rejected, demonstrable before/after the valid move
- [x] `ROOT_MOVE_FORBIDDEN` rejected
- [x] `SELF_MANAGER`, `ALREADY_REPORTS_TO_MANAGER`, `UNKNOWN_TRANSFER_EMPLOYEE` rejected
- [x] rejection atomic (deep-equal state before/after, unit test + property test + browser:
      a rejected cycle attempt left the prior valid transfer's impact panel untouched)
- [x] reset restores selection + controls + highlights (confirmed in browser)
- [x] reapplying same transfer reproduces result (unit test)
- [x] property tests: 200 seeded departments × structural invariants, valid-transfer
      totals/subtree preservation, and cycle-rejection atomicity — 617 tests total, all
      passing (`npm test`)

## Presentation

- [x] no rounding or abbreviation of currency — single `formatCurrency` (Indian digit
      grouping + ₹ symbol, whole units, e.g. "₹7,07,000")
- [x] labels/symbols as well as colour for selected/moved/changed states
      (`◆ selected`, `↗ moved`, `Δ changed` — confirmed legible as plain text)
- [x] dropdowns not filtered to valid targets only — both Transfer dropdowns list all
      12 employees including the root
- [x] second "org chart" (box/node-link) view added alongside the required indented
      tree, toggle-able, both driven by the same tree/rollup state — a `CLAUDE.md`
      §5-scoped stretch goal, added only after everything required was done
- [x] org chart connector lines render continuously at any sibling count — a padding/
      absolute-positioning bug that broke them at 3+ siblings was found and fixed
      (see `docs/ai-interaction-log.md`), reproduced and re-verified in the browser
- [x] org chart zoom controls (40%–150%) for wide/deep trees at the 30-employee ceiling
- [x] verified empirically at n=30 (temporary stress-test fixture, since removed): no
      broken connectors, no console errors; confirmed no logic or layout is coupled to
      the literal employee count via `grep` (`src/` contains no computational use of `12`)

## Process deliverables

- [x] `docs/problem-statement.md` copied in
- [x] `docs/expected-results.md` (hand-worked, independent of app code)
- [x] `tests/expected.ts` (literal constants, never imported by `src/`)
- [x] `docs/ai-interaction-log.md`, updated as work happened (not reconstructed after)
- [x] `docs/implementation-plan.md`
- [x] `docs/design-summary.md`
- [x] `docs/test-evidence.md`
- [x] `README.md` with running instructions
- [x] `npm run check:layering` passes (nothing in `src/` imports `tests/`)
- [ ] Screenshots — visual evidence exists as this session's browser transcript, but no
      image files were saved to `docs/`; add if the interview format wants image files
      specifically

## Current status

Steps 1–5 substantially complete. Full `src/org/` logic, nine fixtures, seeded generator
+ property tests (617 tests passing), the full React workspace, and all five process
docs are written. Verified end-to-end in a real browser: load → inspect → valid transfer
→ cycle rejection → root-move rejection → reset → invalid load → solo department, all
behaving exactly as documented, console clean throughout. `check:layering` and
`tsc --noEmit` both clean.

Post-build: reviewed a proposed alternative UI spec against `CLAUDE.md`, adopted the
parts that didn't conflict with hard requirements (new palette, an added box/node-link
org-chart view, old/new-manager colour coding), rejected the parts that did (currency
abbreviation, colour-only state indicators, a 9-person example dataset, hidden employee
names, a two-button loader that would have hidden the seven other load-error fixtures).
The new chart view had a real connector-line rendering bug (found from a user screenshot,
root-caused and fixed — see `docs/ai-interaction-log.md`), and now has zoom controls,
verified against a temporary 30-employee stress-test fixture (since removed) to confirm
it holds up at the engine's upper size limit, not just at the 12-person demo size.

Remaining before the interview: rehearse the two live-modification candidates from
CLAUDE.md §7 (team payroll share, employee search, or the impact-panel arrows) cold, and
optionally add saved screenshot files if the deliverable format calls for images
specifically rather than the test-evidence doc's written walkthrough.

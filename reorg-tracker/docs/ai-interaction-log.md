# AI interaction log

Two lines per meaningful prompt: what was asked, what was accepted or rejected and why.
Written as work happens, not reconstructed afterward.

---

**Prompt:** Scaffold the project per CLAUDE.md §2 (Vite + React + TS, Tailwind v4 via
`@tailwindcss/vite`, Vitest) and complete Step 1: types, the nine fixtures, `validate.ts`
with the six-error precedence order, `tree.ts`, `tests/validate.test.ts`, plus
`docs/expected-results.md` and `tests/expected.ts`.
**Result:** Accepted the scaffold and file layout as specified. Wrote `index.css` as the
one-line `@import "tailwindcss";` plus an `@theme` block directly — did not let the
default `create-vite` template's boilerplate `index.css` survive, since it isn't Tailwind
at all.

**Problem hit:** `npm create vite@latest` pulled in Vite 8.2.2, which defaults to the
experimental `rolldown-vite` bundler, plus `oxlint` and `vitest@4`. `npm test` failed at
startup with `Cannot find native binding` / `Cannot find module
'@rolldown/binding-wasm32-wasi'` — a native-binding resolution failure, not a config
mistake. A clean `node_modules` + lockfile reinstall (the fix the error itself suggests)
did not resolve it.
**Result:** Rejected staying on the bleeding-edge chain. Diagnosed it as a Node-version
mismatch — Vite 8 / oxlint / rolldown all declare `engines.node: ^20.19.0 || >=22.12.0`,
and this machine runs 20.18.0, one patch short — so their platform-specific optional
dependencies weren't resolving correctly. Pinned to the well-established stable line
instead: `vite@^6.0.7`, `@vitejs/plugin-react@^4.3.4`, `vitest@^2.1.8`, dropped `oxlint`
(replaced the `lint` script with `tsc --noEmit`, which needs no extra dependency). This
is the real-world analogue of the "Tailwind v3-vs-v4 trap" CLAUDE.md warned about: newest
isn't automatically best when a fresh major version hasn't stabilized against the local
toolchain — a genuine caught-the-defaults-being-wrong entry, not a style preference.

**Design decision:** For `badFieldDept`, CLAUDE.md asks for one fixture demonstrating
"blank name, bad ID shape, salary 0" together, but `validate()` only ever reports the
*first* problem found (bucket 1 returns on the first bad record). Ordered the fixture so
the bad-ID-shape record comes first (deterministic, documented), with the blank-name and
zero-salary records present afterward purely as illustration of the other two subtypes —
documented in a code comment so the discrepancy between "fixture contains three problems"
and "test asserts one code" doesn't read as a bug later. Individual coverage of blank
name, blank role, non-integer salary, salary 0, and salary > 1,000,000 is instead handled
by small inline record arrays directly in `tests/validate.test.ts`, built from a spread of
`mainDepartment[0]` — more precise than depending on which fixture record trips first.

**Design decision:** Cycle detection in `validate()` walks up from each record in source
order and only reports a record as `MANAGEMENT_CYCLE` if that record's own upward walk
returns to itself (i.e., the record is *on* the cycle), not merely upstream of one. An
earlier draft flagged any record whose manager chain eventually repeated any node,
which would have reported an uninvolved ancestor rather than a cycle member, and made the
"within one bucket, source-record order" precedence rule ambiguous when the reporting
record isn't actually part of the cycle. Rejected that draft; kept the stricter check.

**Step 2 — rollups, transfer, diff.** Rollups came out as a straightforward bottom-up
tree walk. The interesting decision was in `transfer.ts`: since only the moved record's
`manager_id` changes (its array position never moves), rebuilding the tree from the same
array automatically produces both affected managers' children lists in correct source
order — no manual list-splicing needed. Verified this against the hand-worked
`docs/expected-results.md` numbers for `LEAD_A → MGR_B` and it matched on the first run,
including `MGR_B`'s post-transfer child order (`LEAD_A, LEAD_B, E_6`).

**Problem hit (self-caught):** Property tests (`tests/properties.test.ts`, 200 seeded
departments × several checks) initially had 41 failures, all `expected
'ROOT_MOVE_FORBIDDEN' to be 'MANAGEMENT_CYCLE'`. Traced it to a bug in the *test*, not
the app: the random "manager to relocate" pool included the tree's root, and when the
root was picked, `transfer()` correctly rejects with `ROOT_MOVE_FORBIDDEN` (checked
before `MANAGEMENT_CYCLE` in the required order) rather than the cycle code the test
assumed. Fixed by excluding the root from that candidate pool — a case of the test's
assumption being wrong, not the implementation.

**Step 3 — the workspace.** Built Header, ErrorPanel, StatusBadges, OrgTree,
EmployeeTable, EmployeeDetail, TransferPanel, ImpactPanel and App per CLAUDE.md §5/§3.
Key call: the indented tree uses nested `<div className="border-l ... pl-3">` per level
rather than a flat list with computed left-padding — gives the file-explorer guide rail
for free from normal block nesting, no manual depth-to-pixel math.

**Design decision:** `AppState` follows CLAUDE.md §3 closely but adds one field it didn't
specify: `transferAttemptError`, kept separate from `lastTransfer`. Reasoning: the spec
requires a rejected transfer to "preserve ... every prior successful result" — if a
rejection overwrote the same slot the Impact Panel reads from, attempting the documented
cycle rejection right after the valid demo transfer would blank out that transfer's own
explanation. Keeping them as two fields means the Impact Panel always reflects the last
*successful* transfer, while the Transfer panel shows the *current* attempt's rejection
inline, independently — verified this in the browser: applied `LEAD_A → MGR_B`, then
attempted the `MGR_A → E_3` cycle, and the impact panel's before/after table stayed
exactly as the valid transfer left it while the rejection appeared as its own inline
`MANAGEMENT_CYCLE` message.

**Verification (real browser, not just unit tests):** Ran the dev server and drove it
end to end — Load main department (12 employees, ₹7,07,000, matches
`docs/expected-results.md` exactly) → apply `LEAD_A → MGR_B` (produced the exact
documented before/after numbers and child ordering) → attempt `MGR_A → E_3`
(`MANAGEMENT_CYCLE`, prior result untouched) → attempt `HOD → MGR_B`
(`ROOT_MOVE_FORBIDDEN`) → Reset (restored the original tree, table, and selection,
cleared both badges and the impact panel) → loaded the deliberately-broken
`precedenceDept` dataset and confirmed the error panel replaced the entire workspace
(tree, table, rail, employee/payroll counts) rather than appearing alongside stale data.
Console stayed clean throughout.

**Minor testing hiccup, worth noting honestly:** immediately after that pass, a couple of
follow-up browser interactions (reloading the main department a second time, then loading
the solo department) appeared to silently no-op — `get_page_text` showed the app still on
its initial "choose a dataset" screen after a click that should have loaded data. Root
cause was on the automation side, not the app: a coordinate-based click landed just
outside the Load button after the dataset label's text length changed the header's
layout (a longer/shorter option shifts the button a few pixels). Re-finding the element
fresh and clicking it worked immediately, and the app behaved correctly every time the
click actually landed. No app-code change resulted from this — noted here only because
the log is meant to record what actually happened, not a cleaned-up version of it.

**Post-build redesign.** After the workspace was fully built, tested, and verified,
given a reference screenshot and a detailed UI/UX spec for a more polished-looking
"Departmental Payroll Tracker" mockup (white cards, blue primary color, a box/node-link
org chart with orthogonal connector lines, colour-coded old/new-manager blocks in the
impact panel) and asked to adopt it. Reviewed it against `CLAUDE.md` before touching any
code and found several real conflicts, which were surfaced to the user rather than
implemented as-is:
- The spec allowed `$145k`-style abbreviation "just in the visual tree for space" —
  `CLAUDE.md` §1 is unconditional (no rounding, no abbreviation, anywhere), and even
  names that exact shorthand pattern as the thing to avoid. Rejected outright.
- The mockup's tree nodes were distinguished by border colour alone (blue = selected,
  red = old manager, green = new manager), with no text/symbol on the node itself —
  `CLAUDE.md` §5 requires a label or symbol *as well as* colour on every visual state.
  Kept inline text badges (`◆ selected`, `↗ moved`, plus new `▼ old manager` /
  `▲ new manager` labels) on every node in the new chart, not just a side legend.
- The mockup's example dataset had 9 employees ($1,240,000 total) — the spec requires
  exactly 12 for the main demo. Kept the existing, hand-worked `mainDepartment` and its
  real numbers; only the presentation was restyled.
- The mockup showed no employee names, only IDs — `name` is a required, validated field
  distinct from `role`; kept both visible.
- The mockup's two-button "Load Valid/Invalid Demo" header would have replaced the
  9-fixture dropdown that makes every individual load-error code demonstrable on screen.
  Kept the dropdown and added the two demo buttons *on top of it* as one-click shortcuts
  (`Load Valid Demo` → main department, `Load Invalid Demo` → the duplicate-ID fixture),
  losing nothing.
- The mockup's impact panel explicitly omitted the root/HOD row when it didn't change —
  `CLAUDE.md` §5 requires that row explicitly, precisely to show ancestry isn't the same
  as impact. Kept it, styled as a neutral `[=] UNCHANGED` block.

Given the user's explicit go-ahead ("reskin + add the box chart as a second view"),
implemented: a new blue/slate/Inter theme across every panel (`src/index.css`,
`Header.tsx`, `ErrorPanel.tsx`, `EmployeeTable.tsx` — now with a totals footer row —
`EmployeeDetail.tsx`, `TransferPanel.tsx`, `ImpactPanel.tsx` — now with moved/old
manager/new manager/root blocks, colour *and* bracketed text label on each), a new
`OrgChart.tsx` box/node-link view (`CLAUDE.md`'s own stretch-goal framing: "only if
everything else is finished" — it was), connector lines drawn with plain divs (no
canvas/SVG position math, no charting library) using the classic half-width-border
technique, and `OrganizationPanel.tsx` to toggle between it and the original required
indented tree — both driven by the same tree/rollup state, so nothing about the
underlying logic changed. `src/org/` was untouched; all 617 tests still pass unmodified,
confirming the redesign is presentation-only. Re-verified end-to-end in the browser:
loaded main → applied `LEAD_A → MGR_B` (chart showed `▼ old manager` on `MGR_A`,
`▲ new manager` on `MGR_B`, impact panel showed all four blocks with exact expected
numbers) → attempted the `MGR_A → E_3` cycle (rejected, prior result undisturbed) →
toggled to the indented view and back (state stayed in sync) → Reset. Console clean
throughout.

**Step 4/5 — polish and documentation.** Step 4's items (badge language, tabular
numerals, the single currency helper, empty/error states, solo-department view) were
already satisfied by the Step 3 implementation rather than needing a separate pass —
confirmed each explicitly in the browser rather than assuming. Wrote the remaining
process docs (`docs/implementation-plan.md`, `docs/design-summary.md`,
`docs/test-evidence.md`, `README.md`) from the actual state of the code and test suite,
not from the original plan — `docs/implementation-plan.md`'s "changes from plan" section
records where the two diverged (the toolchain pin, and the `transferAttemptError`
addition to `AppState`).

**Bug report from user (screenshot).** Given a screenshot of the new `OrgChart` view
showing visibly broken connector lines — clear gaps between sibling cards under the root
— plus two follow-up questions: does the chart hold up at 30 employees, and is anything
coupled to the literal number 12.

**Root cause, found by reading the CSS, not by guessing.** Each child column
(`OrgChart.tsx`) had `px-4` padding applied directly to itself, and the connector overlay
inside it used `width: 100%` in normal flow — which resolves against the *content* box,
i.e. excludes that element's own padding. So at every sibling boundary there was a
~32px dead zone (left column's right padding + right column's left padding) with no line
— precisely the gaps in the screenshot. Fix: made the connector `position: absolute`
instead of a normal-flow `w-full` div, since absolutely positioned children resolve
`left`/`right` against the containing block's *padding* box, not its content box — the
same rule the classic `::before`/`::after` CSS-org-chart technique relies on. Reproduced
the user's exact scenario (`LEAD_A → HOD`, giving the root three children) to confirm the
fix before reporting it fixed, rather than trusting the diagnosis alone.

**Magic-number check.** Grepped `src/` for `\b12\b` rather than asserting from memory:
the only matches were SVG icon `viewBox` coordinates (unrelated) and one UI label string
(`'Main department (12)'`, a display name for the fixed 12-record fixture, not used in
any computation). Every actual computation — tree building, rollups, the chart's own
layout — is driven by `.length`/`.map()`/recursion, generic over 1–30.

**30-node scaling — verified empirically, not just argued.** Rather than reason
abstractly about whether the chart would hold up at the engine's 30-employee ceiling,
built a temporary `_stressTest30` fixture (5-way branching root, mixed depth, exactly 30
records) and wired it into the dataset dropdown just long enough to check it in the
running app: connector lines stayed continuous, the app stayed error-free in the
console, and — since a wide 30-node chart can genuinely outgrow a viewport — added zoom
controls (`−`/`100%`/`+`, 40%–150% via CSS `transform: scale()`) to `OrganizationPanel.tsx`
next to the view toggle, matching the zoom affordance from the earlier mockup review.
Deleted the temporary fixture and its wiring afterward and re-ran `npm test` /
`tsc --noEmit` / `check:layering` to confirm the dataset set was back to exactly the
nine required fixtures — a temporary diagnostic aid, not a permanent addition to the
dropdown CLAUDE.md scopes explicitly.

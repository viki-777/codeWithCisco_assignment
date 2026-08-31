# Expected results — hand-worked, not computed by the app

These numbers were worked out by hand from the main department table below, before any
`src/org` code ran against them. They exist so the application can be checked against an
independent answer key rather than grading its own homework. The same literal values are
transcribed into `tests/expected.ts`, which `src/` never imports.

## The main department (12 employees, source order)

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

Shape check: one root (`HOD`); two branches (`MGR_A`, `MGR_B`); five employees with
direct reports (`HOD`, `MGR_A`, `MGR_B`, `LEAD_A`, `LEAD_B`, `E_1` — six, comfortably
above the "at least three" requirement); `E_7` sits four reporting links below `HOD`
(`HOD → MGR_A → LEAD_A → E_1 → E_7`); all twelve salaries are distinct.

Salary sum: 150000 + 90000 + 85000 + 65000 + 62000 + 45000 + 42000 + 40000 + 38000 +
36000 + 34000 + 20000 = **707000**.

## Initial rollups

Computed bottom-up from the table above:

| ID | Direct reports | team_headcount | team_payroll |
| --- | --- | ---: | ---: |
| `HOD` | `MGR_A`, `MGR_B` | 12 | 707000 |
| `MGR_A` | `LEAD_A`, `E_3` | 6 | 302000 |
| `MGR_B` | `LEAD_B`, `E_6` | 5 | 255000 |
| `LEAD_A` | `E_1`, `E_2` | 4 | 172000 |
| `LEAD_B` | `E_4`, `E_5` | 3 | 136000 |
| `E_1` | `E_7` | 2 | 65000 |
| `E_2` | — | 1 | 42000 |
| `E_3` | — | 1 | 40000 |
| `E_4` | — | 1 | 38000 |
| `E_5` | — | 1 | 36000 |
| `E_6` | — | 1 | 34000 |
| `E_7` | — | 1 | 20000 |

Work shown for the two non-trivial branches:

- `LEAD_A` = 65000 (self) + `E_1`.team_payroll (65000) + `E_2`.team_payroll (42000) =
  172000; headcount = 1 + 2 (E_1's team) + 1 (E_2) = 4.
- `E_1` = 45000 (self) + `E_7`.team_payroll (20000) = 65000; headcount = 1 + 1 = 2.
- `MGR_A` = 90000 (self) + `LEAD_A`.team_payroll (172000) + `E_3`.team_payroll (40000) =
  302000; headcount = 1 + 4 + 1 = 6.
- `LEAD_B` = 62000 (self) + 38000 (`E_4`) + 36000 (`E_5`) = 136000; headcount = 1+1+1 = 3.
- `MGR_B` = 85000 (self) + `LEAD_B`.team_payroll (136000) + `E_6`.team_payroll (34000) =
  255000; headcount = 1 + 3 + 1 = 5.
- `HOD` = 150000 (self) + `MGR_A`.team_payroll (302000) + `MGR_B`.team_payroll (255000) =
  707000; headcount = 1 + 6 + 5 = 12.

Root invariants hold: `HOD`.team_headcount (12) equals the record count (12); `HOD`.team_
payroll (707000) equals the sum of all salaries (707000).

## Demonstration transfer — `LEAD_A → MGR_B`

`LEAD_A` is a non-leaf (carries `E_1`, `E_2`, and transitively `E_7`) and this is a
cross-branch move: `LEAD_A` currently reports to `MGR_A`, and is moved to report to
`MGR_B`. The moved subtree is `LEAD_A`, `E_1`, `E_2`, `E_7` — headcount 4, payroll
172000 (unchanged by the move, since the subtree's own structure and salaries do not
change).

| ID | Headcount before → after | Payroll before → after |
| --- | --- | --- |
| `MGR_A` | 6 → 2 | 302000 → 130000 |
| `MGR_B` | 5 → 9 | 255000 → 427000 |
| `HOD` | 12 → 12 (unchanged) | 707000 → 707000 (unchanged) |

Working:

- `MGR_A` loses `LEAD_A`'s whole subtree: headcount 6 − 4 = 2 (itself + `E_3`); payroll
  302000 − 172000 = 130000 (= 90000 self + 40000 `E_3`).
- `MGR_B` gains the same subtree: headcount 5 + 4 = 9; payroll 255000 + 172000 = 427000.
- `HOD` is an ancestor of both `MGR_A` and `MGR_B` both before and after the move, so its
  own subtree membership does not change — headcount and payroll stay at 12 and 707000.

`changed_rollup_ids = ["MGR_A", "MGR_B"]`, in source order (record 2 then record 3).
Every other employee, including `HOD`, `LEAD_A` itself, and all leaves, is unchanged.

After the move, `MGR_B`'s direct reports in source order are `LEAD_A` (source index 4),
`LEAD_B` (source index 5), `E_6` (source index 11) — the moved lead lands **first**
because its source index precedes both existing children. `MGR_A`'s remaining direct
report list is unchanged except for `LEAD_A`'s removal: just `E_3`.

## Rejections to demonstrate

- **`MGR_A → E_3` → `MANAGEMENT_CYCLE`.** `E_3` is a direct report of `MGR_A` both before
  and after the valid `LEAD_A → MGR_B` transfer (that move never touches `E_3` or
  `MGR_A`'s relationship to it), so `E_3` stays inside `MGR_A`'s subtree throughout and
  this rejection is demonstrable in either order, as required.
- **`HOD → MGR_B` → `ROOT_MOVE_FORBIDDEN`.** `HOD` is the root; any transfer naming it as
  the selected employee is rejected before the manager side is even considered.

## Solo department

`soloDepartment` has one employee (`HOD`, manager_id null, salary 150000). Expected:
`team_headcount("HOD") = 1`, `team_payroll("HOD") = 150000`.

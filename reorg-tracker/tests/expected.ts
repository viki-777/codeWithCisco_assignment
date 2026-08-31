// Hand-worked constants from docs/expected-results.md. NEVER imported by src/ —
// enforced by `npm run check:layering`. The app must compute these itself.

export const MAIN_SALARY_SUM = 707000

export const MAIN_INITIAL_ROLLUPS: Record<string, { headcount: number; payroll: number }> = {
  HOD: { headcount: 12, payroll: 707000 },
  MGR_A: { headcount: 6, payroll: 302000 },
  MGR_B: { headcount: 5, payroll: 255000 },
  LEAD_A: { headcount: 4, payroll: 172000 },
  LEAD_B: { headcount: 3, payroll: 136000 },
  E_1: { headcount: 2, payroll: 65000 },
  E_2: { headcount: 1, payroll: 42000 },
  E_3: { headcount: 1, payroll: 40000 },
  E_4: { headcount: 1, payroll: 38000 },
  E_5: { headcount: 1, payroll: 36000 },
  E_6: { headcount: 1, payroll: 34000 },
  E_7: { headcount: 1, payroll: 20000 },
}

export const DEMO_TRANSFER = {
  employeeId: 'LEAD_A',
  newManagerId: 'MGR_B',
} as const

export const MAIN_POST_TRANSFER_ROLLUPS: Record<string, { headcount: number; payroll: number }> = {
  ...MAIN_INITIAL_ROLLUPS,
  MGR_A: { headcount: 2, payroll: 130000 },
  MGR_B: { headcount: 9, payroll: 427000 },
}

export const DEMO_CHANGED_ROLLUP_IDS = ['MGR_A', 'MGR_B']

export const MGR_B_CHILDREN_AFTER_TRANSFER = ['LEAD_A', 'LEAD_B', 'E_6']
export const MGR_A_CHILDREN_AFTER_TRANSFER = ['E_3']

export const CYCLE_REJECTION = {
  employeeId: 'MGR_A',
  newManagerId: 'E_3',
} as const

export const ROOT_MOVE_REJECTION = {
  employeeId: 'HOD',
  newManagerId: 'MGR_B',
} as const

export const SOLO_ROLLUP = { headcount: 1, payroll: 150000 }

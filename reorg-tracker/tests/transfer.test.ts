import { describe, expect, it } from 'vitest'
import { validate } from '../src/org/validate'
import { buildTree } from '../src/org/tree'
import { transfer } from '../src/org/transfer'
import { mainDepartment } from '../src/data/mainDepartment'
import {
  CYCLE_REJECTION,
  DEMO_CHANGED_ROLLUP_IDS,
  DEMO_TRANSFER,
  MAIN_POST_TRANSFER_ROLLUPS,
  MGR_A_CHILDREN_AFTER_TRANSFER,
  MGR_B_CHILDREN_AFTER_TRANSFER,
  ROOT_MOVE_REJECTION,
} from './expected'

function loaded() {
  const result = validate(mainDepartment)
  if (!result.ok) throw new Error('expected a valid department')
  return result.employees
}

describe('transfer — the documented valid move (LEAD_A -> MGR_B)', () => {
  it('produces exactly the hand-worked post-transfer rollups', () => {
    const employees = loaded()
    const outcome = transfer(employees, DEMO_TRANSFER.employeeId, DEMO_TRANSFER.newManagerId)
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    for (const [id, expected] of Object.entries(MAIN_POST_TRANSFER_ROLLUPS)) {
      expect(outcome.newRollups[id], `rollup for ${id}`).toEqual(expected)
    }
  })

  it('reports changed_rollup_ids exactly, in source order, and never includes the root', () => {
    const employees = loaded()
    const outcome = transfer(employees, DEMO_TRANSFER.employeeId, DEMO_TRANSFER.newManagerId)
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(outcome.changedRollupIds).toEqual(DEMO_CHANGED_ROLLUP_IDS)
    expect(outcome.changedRollupIds).not.toContain('HOD')
  })

  it('rebuilds both affected direct-report lists in source order', () => {
    const employees = loaded()
    const outcome = transfer(employees, DEMO_TRANSFER.employeeId, DEMO_TRANSFER.newManagerId)
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    const root = buildTree(outcome.employees)
    const mgrA = root.children.find((c) => c.employee.employee_id === 'MGR_A')!
    const mgrB = root.children.find((c) => c.employee.employee_id === 'MGR_B')!
    expect(mgrA.children.map((c) => c.employee.employee_id)).toEqual(MGR_A_CHILDREN_AFTER_TRANSFER)
    expect(mgrB.children.map((c) => c.employee.employee_id)).toEqual(MGR_B_CHILDREN_AFTER_TRANSFER)
  })

  it('preserves the moved subtree exactly (salary, descendants, own rollup)', () => {
    const employees = loaded()
    const outcome = transfer(employees, DEMO_TRANSFER.employeeId, DEMO_TRANSFER.newManagerId)
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    const leadA = outcome.employees.find((e) => e.employee_id === 'LEAD_A')!
    expect(leadA.monthly_salary).toBe(65000)
    expect(leadA.manager_id).toBe('MGR_B')
    expect(outcome.newRollups.LEAD_A).toEqual({ headcount: 4, payroll: 172000 })
    // source positions of every record are untouched — only manager_id changed
    expect(outcome.employees.map((e) => e.employee_id)).toEqual(employees.map((e) => e.employee_id))
  })

  it('preserves source order in the employee table (transfer never reorders records)', () => {
    const employees = loaded()
    const outcome = transfer(employees, DEMO_TRANSFER.employeeId, DEMO_TRANSFER.newManagerId)
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(outcome.employees.map((e) => e.employee_id)).toEqual(mainDepartment.map((e) => e.employee_id))
  })

  it('reapplying the same transfer to a fresh load reproduces the same result', () => {
    const first = transfer(loaded(), DEMO_TRANSFER.employeeId, DEMO_TRANSFER.newManagerId)
    const second = transfer(loaded(), DEMO_TRANSFER.employeeId, DEMO_TRANSFER.newManagerId)
    expect(first).toEqual(second)
  })
})

describe('transfer — rejections', () => {
  it('rejects UNKNOWN_TRANSFER_EMPLOYEE when the employee id is unknown', () => {
    const outcome = transfer(loaded(), 'GHOST', 'MGR_B')
    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.error.code).toBe('UNKNOWN_TRANSFER_EMPLOYEE')
  })

  it('rejects UNKNOWN_TRANSFER_EMPLOYEE when the new manager id is unknown', () => {
    const outcome = transfer(loaded(), 'LEAD_A', 'GHOST')
    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.error.code).toBe('UNKNOWN_TRANSFER_EMPLOYEE')
  })

  it('rejects ROOT_MOVE_FORBIDDEN when the selected employee is the root', () => {
    const outcome = transfer(loaded(), ROOT_MOVE_REJECTION.employeeId, ROOT_MOVE_REJECTION.newManagerId)
    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.error.code).toBe('ROOT_MOVE_FORBIDDEN')
  })

  it('rejects SELF_MANAGER when both ids are the same', () => {
    const outcome = transfer(loaded(), 'MGR_A', 'MGR_A')
    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.error.code).toBe('SELF_MANAGER')
  })

  it('rejects ALREADY_REPORTS_TO_MANAGER when already a direct report', () => {
    const outcome = transfer(loaded(), 'E_1', 'LEAD_A')
    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.error.code).toBe('ALREADY_REPORTS_TO_MANAGER')
  })

  it('rejects the documented cycle (MGR_A -> E_3) both before and after the valid transfer', () => {
    const before = transfer(loaded(), CYCLE_REJECTION.employeeId, CYCLE_REJECTION.newManagerId)
    expect(before.ok).toBe(false)
    if (!before.ok) expect(before.error.code).toBe('MANAGEMENT_CYCLE')

    const validOutcome = transfer(loaded(), DEMO_TRANSFER.employeeId, DEMO_TRANSFER.newManagerId)
    expect(validOutcome.ok).toBe(true)
    if (!validOutcome.ok) return
    const after = transfer(validOutcome.employees, CYCLE_REJECTION.employeeId, CYCLE_REJECTION.newManagerId)
    expect(after.ok).toBe(false)
    if (!after.ok) expect(after.error.code).toBe('MANAGEMENT_CYCLE')
  })

  it('rejects a manager proposed from deeper in the subtree (MGR_A -> E_7)', () => {
    const outcome = transfer(loaded(), 'MGR_A', 'E_7')
    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.error.code).toBe('MANAGEMENT_CYCLE')
  })

  it('a rejected transfer is atomic — the input array is left untouched', () => {
    const employees = loaded()
    const snapshot = JSON.parse(JSON.stringify(employees))
    const outcome = transfer(employees, CYCLE_REJECTION.employeeId, CYCLE_REJECTION.newManagerId)
    expect(outcome.ok).toBe(false)
    expect(employees).toEqual(snapshot)
  })
})

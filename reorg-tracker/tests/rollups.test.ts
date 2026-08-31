import { describe, expect, it } from 'vitest'
import { validate } from '../src/org/validate'
import { buildTree } from '../src/org/tree'
import { computeRollups } from '../src/org/rollups'
import { mainDepartment } from '../src/data/mainDepartment'
import { soloDepartment } from '../src/data/soloDepartment'
import { MAIN_INITIAL_ROLLUPS, MAIN_SALARY_SUM, SOLO_ROLLUP } from './expected'

function rollupsFor(records: typeof mainDepartment) {
  const result = validate(records)
  if (!result.ok) throw new Error('expected a valid department')
  return computeRollups(buildTree(result.employees))
}

describe('computeRollups — main department', () => {
  const rollups = rollupsFor(mainDepartment)

  it('matches every hand-worked value from tests/expected.ts', () => {
    for (const [id, expected] of Object.entries(MAIN_INITIAL_ROLLUPS)) {
      expect(rollups[id], `rollup for ${id}`).toEqual(expected)
    }
  })

  it('gives every leaf headcount 1', () => {
    const leaves = ['E_2', 'E_3', 'E_4', 'E_5', 'E_6', 'E_7']
    for (const id of leaves) {
      expect(rollups[id].headcount).toBe(1)
      expect(rollups[id].payroll).toBe(mainDepartment.find((e) => e.employee_id === id)!.monthly_salary)
    }
  })

  it('root headcount equals record count and root payroll equals salary sum', () => {
    expect(rollups.HOD.headcount).toBe(mainDepartment.length)
    expect(rollups.HOD.payroll).toBe(MAIN_SALARY_SUM)
  })

  it('parent headcount is 1 + sum of children headcounts', () => {
    const root = buildTree(mainDepartment)
    function check(node: ReturnType<typeof buildTree>) {
      const expectedHc = 1 + node.children.reduce((sum, c) => sum + rollups[c.employee.employee_id].headcount, 0)
      expect(rollups[node.employee.employee_id].headcount).toBe(expectedHc)
      node.children.forEach(check)
    }
    check(root)
  })
})

describe('computeRollups — solo department', () => {
  it('headcount 1, payroll equal to own salary', () => {
    const rollups = rollupsFor(soloDepartment)
    expect(rollups.HOD).toEqual(SOLO_ROLLUP)
  })
})

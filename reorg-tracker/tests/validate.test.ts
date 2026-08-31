import { describe, expect, it } from 'vitest'
import type { Employee } from '../src/org/types'
import { validate } from '../src/org/validate'
import { buildTree } from '../src/org/tree'
import { mainDepartment } from '../src/data/mainDepartment'
import { soloDepartment } from '../src/data/soloDepartment'
import { duplicateIdDept } from '../src/data/duplicateIdDept'
import { unknownManagerDept } from '../src/data/unknownManagerDept'
import { cycleDept } from '../src/data/cycleDept'
import { twoRootsDept } from '../src/data/twoRootsDept'
import { selfManagerDept } from '../src/data/selfManagerDept'
import { badFieldDept } from '../src/data/badFieldDept'
import { precedenceDept } from '../src/data/precedenceDept'

function expectError(records: readonly Employee[], code: string) {
  const result = validate(records)
  expect(result.ok).toBe(false)
  if (!result.ok) expect(result.error.code).toBe(code)
}

describe('validate — valid departments', () => {
  it('accepts the 12-person main department and builds one connected tree', () => {
    const result = validate(mainDepartment)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.employees.map((e) => e.employee_id)).toEqual(
      mainDepartment.map((e) => e.employee_id),
    )
    const root = buildTree(result.employees)
    expect(root.employee.employee_id).toBe('HOD')
    expect(root.children.map((c) => c.employee.employee_id)).toEqual(['MGR_A', 'MGR_B'])
  })

  it('accepts a single-employee (solo) department', () => {
    const result = validate(soloDepartment)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const root = buildTree(result.employees)
    expect(root.children).toHaveLength(0)
  })

  it('resolves managers by ID regardless of source order', () => {
    const shuffled = [...mainDepartment].reverse()
    const result = validate(shuffled)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const root = buildTree(result.employees)
    expect(root.employee.employee_id).toBe('HOD')
    // source order (reversed) must still be preserved for each manager's children
    expect(root.children.map((c) => c.employee.employee_id)).toEqual(['MGR_B', 'MGR_A'])
  })
})

describe('validate — each of the six error codes', () => {
  it('INVALID_EMPLOYEE — bad field shape', () => {
    expectError(badFieldDept, 'INVALID_EMPLOYEE')
  })

  it('INVALID_EMPLOYEE — record count out of 1..30 range', () => {
    expectError([], 'INVALID_EMPLOYEE')
    const tooMany: Employee[] = Array.from({ length: 31 }, (_, i) => ({
      employee_id: `E${i}`,
      name: `Person ${i}`,
      role: 'Staff',
      monthly_salary: 30000,
      manager_id: i === 0 ? null : 'E0',
    }))
    expectError(tooMany, 'INVALID_EMPLOYEE')
  })

  it('DUPLICATE_EMPLOYEE_ID', () => {
    expectError(duplicateIdDept, 'DUPLICATE_EMPLOYEE_ID')
  })

  it('INVALID_ROOT_COUNT', () => {
    expectError(twoRootsDept, 'INVALID_ROOT_COUNT')
  })

  it('SELF_MANAGER', () => {
    expectError(selfManagerDept, 'SELF_MANAGER')
  })

  it('UNKNOWN_MANAGER', () => {
    expectError(unknownManagerDept, 'UNKNOWN_MANAGER')
  })

  it('MANAGEMENT_CYCLE', () => {
    expectError(cycleDept, 'MANAGEMENT_CYCLE')
  })
})

describe('validate — precedence ordering', () => {
  it('reports the earliest-bucket error when several problems coexist', () => {
    // precedenceDept has a duplicate ID (bucket 2), a root-count problem
    // (bucket 3) and an unknown manager (bucket 4) simultaneously. Bucket 2
    // must win.
    expectError(precedenceDept, 'DUPLICATE_EMPLOYEE_ID')
  })

  it('self-manager does not automatically beat unknown-manager — source order decides', () => {
    const records: Employee[] = [
      { employee_id: 'HOD', name: 'Priya Nair', role: 'Head', monthly_salary: 150000, manager_id: null },
      { employee_id: 'A', name: 'A', role: 'Staff', monthly_salary: 30000, manager_id: 'GHOST' }, // unknown, first
      { employee_id: 'B', name: 'B', role: 'Staff', monthly_salary: 30000, manager_id: 'B' }, // self, second
    ]
    expectError(records, 'UNKNOWN_MANAGER')
  })

  it('a later self-manager record is reported when it precedes an unknown-manager record', () => {
    const records: Employee[] = [
      { employee_id: 'HOD', name: 'Priya Nair', role: 'Head', monthly_salary: 150000, manager_id: null },
      { employee_id: 'A', name: 'A', role: 'Staff', monthly_salary: 30000, manager_id: 'A' }, // self, first
      { employee_id: 'B', name: 'B', role: 'Staff', monthly_salary: 30000, manager_id: 'GHOST' }, // unknown, second
    ]
    expectError(records, 'SELF_MANAGER')
  })
})

describe('validate — per-field INVALID_EMPLOYEE cases (constructed directly)', () => {
  const base = mainDepartment[0]

  it('rejects an employee_id that does not match the required pattern', () => {
    expectError([{ ...base, employee_id: 'lowercase' }], 'INVALID_EMPLOYEE')
  })

  it('rejects a blank name', () => {
    expectError([{ ...base, name: '   ' }], 'INVALID_EMPLOYEE')
  })

  it('rejects a blank role', () => {
    expectError([{ ...base, role: '' }], 'INVALID_EMPLOYEE')
  })

  it('rejects a non-integer salary', () => {
    expectError([{ ...base, monthly_salary: 1000.5 }], 'INVALID_EMPLOYEE')
  })

  it('rejects a salary of 0', () => {
    expectError([{ ...base, monthly_salary: 0 }], 'INVALID_EMPLOYEE')
  })

  it('rejects a salary over 1,000,000', () => {
    expectError([{ ...base, monthly_salary: 1_000_001 }], 'INVALID_EMPLOYEE')
  })
})

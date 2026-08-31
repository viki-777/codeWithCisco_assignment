import type { Employee } from './types'
import { buildTree } from './tree'
import { computeRollups, type RollupMap } from './rollups'
import { changedRollupIds } from './diff'

export type TransferErrorCode =
  | 'UNKNOWN_TRANSFER_EMPLOYEE'
  | 'ROOT_MOVE_FORBIDDEN'
  | 'SELF_MANAGER'
  | 'ALREADY_REPORTS_TO_MANAGER'
  | 'MANAGEMENT_CYCLE'

export interface TransferError {
  code: TransferErrorCode
  message: string
}

export interface TransferSuccess {
  ok: true
  employees: Employee[]
  previousRollups: RollupMap
  newRollups: RollupMap
  changedRollupIds: string[]
}

export type TransferResult = TransferSuccess | { ok: false; error: TransferError }

function fail(code: TransferErrorCode, message: string): TransferResult {
  return { ok: false, error: { code, message } }
}

function subtreeIds(employees: readonly Employee[], rootId: string): Set<string> {
  const childrenOf = new Map<string, string[]>()
  for (const e of employees) {
    if (e.manager_id === null) continue
    const list = childrenOf.get(e.manager_id) ?? []
    list.push(e.employee_id)
    childrenOf.set(e.manager_id, list)
  }
  const subtree = new Set<string>()
  const stack = [...(childrenOf.get(rootId) ?? [])]
  while (stack.length > 0) {
    const id = stack.pop()!
    if (subtree.has(id)) continue
    subtree.add(id)
    for (const child of childrenOf.get(id) ?? []) stack.push(child)
  }
  return subtree
}

/**
 * Validates then applies a transfer, in the five-check order from CLAUDE.md
 * §1. All checks run before any mutation; a rejection returns the original
 * `employees` reference untouched. On success, only the selected employee's
 * manager_id changes — every other record keeps its array position, which is
 * what makes both affected direct-report lists come out in source order for
 * free when the tree is rebuilt from the returned array.
 */
export function transfer(
  employees: readonly Employee[],
  employeeId: string,
  newManagerId: string,
): TransferResult {
  const byId = new Map(employees.map((e) => [e.employee_id, e]))
  const employee = byId.get(employeeId)
  const newManager = byId.get(newManagerId)

  if (!employee || !newManager) {
    const badId = !employee ? employeeId : newManagerId
    return fail('UNKNOWN_TRANSFER_EMPLOYEE', `unknown employee_id in transfer request: "${badId}"`)
  }
  if (employee.manager_id === null) {
    return fail('ROOT_MOVE_FORBIDDEN', `"${employeeId}" is the department head and cannot be moved`)
  }
  if (employeeId === newManagerId) {
    return fail('SELF_MANAGER', `"${employeeId}" cannot manage themself`)
  }
  if (employee.manager_id === newManagerId) {
    return fail(
      'ALREADY_REPORTS_TO_MANAGER',
      `"${employeeId}" already reports directly to "${newManagerId}"`,
    )
  }
  if (subtreeIds(employees, employeeId).has(newManagerId)) {
    return fail(
      'MANAGEMENT_CYCLE',
      `moving "${employeeId}" under "${newManagerId}" would create a reporting cycle`,
    )
  }

  const previousRollups = computeRollups(buildTree(employees))

  const nextEmployees = employees.map((e) =>
    e.employee_id === employeeId ? { ...e, manager_id: newManagerId } : e,
  )
  const newRollups = computeRollups(buildTree(nextEmployees))

  return {
    ok: true,
    employees: nextEmployees,
    previousRollups,
    newRollups,
    changedRollupIds: changedRollupIds(nextEmployees, previousRollups, newRollups),
  }
}

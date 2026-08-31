import type { Employee, ErrorCode, LoadResult } from './types'

const ID_PATTERN = /^[A-Z][A-Z0-9_-]{0,15}$/

function fail(code: ErrorCode, message: string): LoadResult {
  return { ok: false, error: { code, message } }
}

function shapeProblem(e: Employee): string | null {
  if (typeof e.employee_id !== 'string' || !ID_PATTERN.test(e.employee_id)) {
    return `employee_id "${String(e.employee_id)}" must match [A-Z][A-Z0-9_-]{0,15}`
  }
  if (typeof e.name !== 'string' || e.name.trim().length === 0) {
    return `employee "${e.employee_id}": name must be non-empty after trimming`
  }
  if (typeof e.role !== 'string' || e.role.trim().length === 0) {
    return `employee "${e.employee_id}": role must be non-empty after trimming`
  }
  if (
    typeof e.monthly_salary !== 'number' ||
    !Number.isInteger(e.monthly_salary) ||
    e.monthly_salary < 1 ||
    e.monthly_salary > 1_000_000
  ) {
    return `employee "${e.employee_id}": monthly_salary must be a whole number from 1 to 1,000,000`
  }
  if (e.manager_id !== null && typeof e.manager_id !== 'string') {
    return `employee "${e.employee_id}": manager_id must be null or a string`
  }
  return null
}

/**
 * Validates a flat employee record list per the precedence order:
 * 1. invalid field or count  2. duplicate ID  3. root count
 * 4. self-manager or unknown manager (same bucket, source order decides)
 * 5. management cycle
 * Returns { ok: true, employees } with source order preserved, or the first
 * error found, all before any tree/rollup computation.
 */
export function validate(records: readonly Employee[]): LoadResult {
  // Bucket 1: invalid field or count
  if (records.length < 1 || records.length > 30) {
    return fail(
      'INVALID_EMPLOYEE',
      `department must contain 1 to 30 employee records, got ${records.length}`,
    )
  }
  for (const e of records) {
    const problem = shapeProblem(e)
    if (problem) return fail('INVALID_EMPLOYEE', problem)
  }

  // Bucket 2: duplicate employee_id, source order
  const seen = new Set<string>()
  for (const e of records) {
    if (seen.has(e.employee_id)) {
      return fail('DUPLICATE_EMPLOYEE_ID', `employee_id "${e.employee_id}" is duplicated`)
    }
    seen.add(e.employee_id)
  }

  // Bucket 3: exactly one root
  const roots = records.filter((e) => e.manager_id === null)
  if (roots.length !== 1) {
    return fail(
      'INVALID_ROOT_COUNT',
      `expected exactly one employee with manager_id null, found ${roots.length}`,
    )
  }

  // Bucket 4: self-manager or unknown manager, source order — whichever record
  // trips first wins, regardless of which of the two conditions it is.
  const ids = new Set(records.map((e) => e.employee_id))
  for (const e of records) {
    if (e.manager_id === null) continue
    if (e.manager_id === e.employee_id) {
      return fail('SELF_MANAGER', `employee "${e.employee_id}" cannot manage themself`)
    }
    if (!ids.has(e.manager_id)) {
      return fail(
        'UNKNOWN_MANAGER',
        `employee "${e.employee_id}" references unknown manager "${e.manager_id}"`,
      )
    }
  }

  // Bucket 5: management cycle, source order — first record that sits on a
  // cycle (its own upward walk returns to itself) wins.
  const byId = new Map(records.map((e) => [e.employee_id, e]))
  for (const start of records) {
    const chain = new Set<string>([start.employee_id])
    let current: Employee | undefined =
      start.manager_id === null ? undefined : byId.get(start.manager_id)
    let onCycle = false
    while (current) {
      if (current.employee_id === start.employee_id) {
        onCycle = true
        break
      }
      if (chain.has(current.employee_id)) break
      chain.add(current.employee_id)
      current = current.manager_id === null ? undefined : byId.get(current.manager_id)
    }
    if (onCycle) {
      return fail('MANAGEMENT_CYCLE', `management cycle detected involving "${start.employee_id}"`)
    }
  }

  return { ok: true, employees: [...records] }
}

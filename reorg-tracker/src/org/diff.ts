import type { Employee } from './types'
import type { RollupMap } from './rollups'

/**
 * Employees whose headcount or payroll differs between two rollup snapshots,
 * listed in source order. `employeesInSourceOrder` drives the order — pass
 * the full current employee list, not either rollup map's own key order.
 */
export function changedRollupIds(
  employeesInSourceOrder: readonly Employee[],
  before: RollupMap,
  after: RollupMap,
): string[] {
  const changed: string[] = []
  for (const e of employeesInSourceOrder) {
    const b = before[e.employee_id]
    const a = after[e.employee_id]
    if (!b || !a) continue
    if (b.headcount !== a.headcount || b.payroll !== a.payroll) {
      changed.push(e.employee_id)
    }
  }
  return changed
}

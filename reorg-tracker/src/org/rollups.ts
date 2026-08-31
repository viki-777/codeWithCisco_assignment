import type { TreeNode } from './types'

export interface Rollup {
  headcount: number
  payroll: number
}

export type RollupMap = Record<string, Rollup>

/**
 * team_headcount(e) = 1 + sum(team_headcount(child))
 * team_payroll(e)   = monthly_salary(e) + sum(team_payroll(child))
 * Both include e. Computed bottom-up in one pass over the tree.
 */
export function computeRollups(root: TreeNode): RollupMap {
  const map: RollupMap = {}

  function visit(node: TreeNode): Rollup {
    let headcount = 1
    let payroll = node.employee.monthly_salary
    for (const child of node.children) {
      const rollup = visit(child)
      headcount += rollup.headcount
      payroll += rollup.payroll
    }
    const rollup: Rollup = { headcount, payroll }
    map[node.employee.employee_id] = rollup
    return rollup
  }

  visit(root)
  return map
}

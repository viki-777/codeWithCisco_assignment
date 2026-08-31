import type { Employee, TreeNode } from './types'

/**
 * Builds the reporting tree from a validated, source-ordered employee list.
 * Each manager's children array is populated in the same order the array is
 * walked, so it matches source order. Call only after validate() succeeds.
 */
export function buildTree(employees: readonly Employee[]): TreeNode {
  const nodeById = new Map<string, TreeNode>()
  for (const e of employees) {
    nodeById.set(e.employee_id, { employee: e, children: [] })
  }

  let root: TreeNode | undefined
  for (const e of employees) {
    const node = nodeById.get(e.employee_id)!
    if (e.manager_id === null) {
      root = node
    } else {
      nodeById.get(e.manager_id)!.children.push(node)
    }
  }

  if (!root) {
    throw new Error('buildTree: no root employee found — call validate() first')
  }
  return root
}

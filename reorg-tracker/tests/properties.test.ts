import { describe, expect, it } from 'vitest'
import type { TreeNode } from '../src/org/types'
import { validate } from '../src/org/validate'
import { buildTree } from '../src/org/tree'
import { computeRollups } from '../src/org/rollups'
import { transfer } from '../src/org/transfer'
import { makeDepartment } from './support/generateDepartment'

const SEEDS = Array.from({ length: 200 }, (_, i) => i)

function findNode(root: TreeNode, id: string): TreeNode | undefined {
  if (root.employee.employee_id === id) return root
  for (const child of root.children) {
    const found = findNode(child, id)
    if (found) return found
  }
  return undefined
}

function subtreeIds(node: TreeNode): Set<string> {
  const ids = new Set<string>()
  function visit(n: TreeNode) {
    ids.add(n.employee.employee_id)
    n.children.forEach(visit)
  }
  visit(node)
  return ids
}

describe('property: seeded departments are always structurally valid', () => {
  for (const seed of SEEDS) {
    const n = (seed % 30) + 1
    it(`seed ${seed}, n=${n} validates and forms one tree`, () => {
      const dept = makeDepartment(seed, n)
      const result = validate(dept)
      expect(result.ok).toBe(true)
      if (!result.ok) return

      const root = buildTree(result.employees)
      const rollups = computeRollups(root)
      const salarySum = result.employees.reduce((sum, e) => sum + e.monthly_salary, 0)

      expect(rollups[root.employee.employee_id].headcount).toBe(n)
      expect(rollups[root.employee.employee_id].payroll).toBe(salarySum)

      function checkNode(node: TreeNode) {
        const own = rollups[node.employee.employee_id]
        if (node.children.length === 0) {
          expect(own.headcount).toBe(1)
          expect(own.payroll).toBe(node.employee.monthly_salary)
        }
        const childHc = node.children.reduce((sum, c) => sum + rollups[c.employee.employee_id].headcount, 0)
        const childPay = node.children.reduce((sum, c) => sum + rollups[c.employee.employee_id].payroll, 0)
        expect(own.headcount).toBe(1 + childHc)
        expect(own.payroll).toBe(node.employee.monthly_salary + childPay)
        node.children.forEach(checkNode)
      }
      checkNode(root)
    })
  }
})

describe('property: random valid transfers preserve totals and subtree membership', () => {
  for (const seed of SEEDS) {
    const n = (seed % 30) + 1
    if (n < 3) continue // need at least a root, a mover, and a candidate manager

    it(`seed ${seed}, n=${n}: a valid non-cycle transfer keeps root totals fixed`, () => {
      const result = validate(makeDepartment(seed, n))
      if (!result.ok) throw new Error('generator produced an invalid department')
      const employees = result.employees
      const rootBefore = buildTree(employees)
      const rollupsBefore = computeRollups(rootBefore)

      // deterministic pick from the seed itself, not a fresh unseeded random
      const pick = (seed * 2654435761) >>> 0
      const nonRoot = employees.filter((e) => e.manager_id !== null)
      if (nonRoot.length === 0) return
      const mover = nonRoot[pick % nonRoot.length]
      const moverNode = findNode(rootBefore, mover.employee_id)!
      const forbidden = subtreeIds(moverNode)
      forbidden.add(mover.manager_id!)

      const candidate = employees.find((e) => !forbidden.has(e.employee_id))
      if (!candidate) return // every other node is in the way for this seed; skip

      const movedSubtreeBefore = subtreeIds(moverNode)
      const outcome = transfer(employees, mover.employee_id, candidate.employee_id)
      expect(outcome.ok).toBe(true)
      if (!outcome.ok) return

      const rootId = rootBefore.employee.employee_id
      expect(outcome.newRollups[rootId].headcount).toBe(rollupsBefore[rootId].headcount)
      expect(outcome.newRollups[rootId].payroll).toBe(rollupsBefore[rootId].payroll)

      const rootAfter = buildTree(outcome.employees)
      const moverNodeAfter = findNode(rootAfter, mover.employee_id)!
      expect(subtreeIds(moverNodeAfter)).toEqual(movedSubtreeBefore)
    })
  }
})

describe('property: a descendant-as-manager transfer is always rejected atomically', () => {
  for (const seed of SEEDS) {
    const n = (seed % 30) + 1
    if (n < 2) continue

    it(`seed ${seed}, n=${n}: moving a manager under its own descendant is rejected`, () => {
      const result = validate(makeDepartment(seed, n))
      if (!result.ok) throw new Error('generator produced an invalid department')
      const employees = result.employees
      const root = buildTree(employees)

      const withChildren = employees.filter(
        (e) => e.manager_id !== null && findNode(root, e.employee_id)!.children.length > 0,
      )
      if (withChildren.length === 0) return // no non-root manager with reports for this seed

      const pick = (seed * 2246822519) >>> 0
      const manager = withChildren[pick % withChildren.length]
      const managerNode = findNode(root, manager.employee_id)!
      const descendantIds = [...subtreeIds(managerNode)].filter((id) => id !== manager.employee_id)
      const descendant = descendantIds[pick % descendantIds.length]

      const snapshot = JSON.parse(JSON.stringify(employees))
      const outcome = transfer(employees, manager.employee_id, descendant)
      expect(outcome.ok).toBe(false)
      if (!outcome.ok) expect(outcome.error.code).toBe('MANAGEMENT_CYCLE')
      expect(employees).toEqual(snapshot)
    })
  }
})

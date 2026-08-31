import type { TreeNode } from '../org/types'
import type { RollupMap } from '../org/rollups'
import { formatCurrency } from '../format'
import { StatusBadges } from './StatusBadges'

interface OrgTreeProps {
  root: TreeNode
  rollups: RollupMap
  selectedId: string
  movedId: string | null
  changedIds: ReadonlySet<string>
  onSelect: (id: string) => void
}

/**
 * File-explorer style indented tree: a border-left guide rail per level,
 * headcount/payroll right-aligned with tabular-nums. Deliberately not a
 * node-link chart — reads like a rollup statement and scales to 30 rows.
 * (A node-link "org chart" view is available as a toggle — see OrgChart.tsx.)
 */
export function OrgTree({ root, rollups, selectedId, movedId, changedIds, onSelect }: OrgTreeProps) {
  return (
    <TreeRow
      node={root}
      rollups={rollups}
      selectedId={selectedId}
      movedId={movedId}
      changedIds={changedIds}
      onSelect={onSelect}
    />
  )
}

interface TreeRowProps extends Omit<OrgTreeProps, 'root'> {
  node: TreeNode
}

function TreeRow({ node, rollups, selectedId, movedId, changedIds, onSelect }: TreeRowProps) {
  const { employee, children } = node
  const rollup = rollups[employee.employee_id]
  const isSelected = employee.employee_id === selectedId
  const isMoved = employee.employee_id === movedId
  const isChanged = changedIds.has(employee.employee_id)

  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(employee.employee_id)}
        className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-50 ${
          isSelected ? 'bg-accent/10' : ''
        }`}
      >
        <span className="min-w-0 flex-1 truncate">
          <span className="font-medium text-slate-900">{employee.name}</span>
          <span className="ml-2 text-xs text-slate-500">
            {employee.employee_id} · {employee.role}
          </span>
        </span>
        <StatusBadges isSelected={isSelected} isMoved={isMoved} isChanged={isChanged} />
        <span className="w-10 shrink-0 text-right text-xs tabular-nums text-slate-500">
          {rollup.headcount}
        </span>
        <span className="w-28 shrink-0 text-right text-xs font-medium tabular-nums text-slate-700">
          {formatCurrency(rollup.payroll)}
        </span>
      </button>

      {children.length > 0 && (
        <div className="ml-4 border-l border-rail pl-3">
          {children.map((child) => (
            <TreeRow
              key={child.employee.employee_id}
              node={child}
              rollups={rollups}
              selectedId={selectedId}
              movedId={movedId}
              changedIds={changedIds}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

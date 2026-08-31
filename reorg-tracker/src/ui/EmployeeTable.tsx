import type { Employee } from '../org/types'
import type { RollupMap } from '../org/rollups'
import { formatCurrency } from '../format'
import { StatusBadges } from './StatusBadges'

interface EmployeeTableProps {
  records: readonly Employee[]
  rollups: RollupMap
  selectedId: string
  movedId: string | null
  changedIds: ReadonlySet<string>
  onSelect: (id: string) => void
}

/** Always in source order — never re-sorted by the transfer or by clicking a column. */
export function EmployeeTable({
  records,
  rollups,
  selectedId,
  movedId,
  changedIds,
  onSelect,
}: EmployeeTableProps) {
  const rootId = records.find((e) => e.manager_id === null)?.employee_id
  const totalHeadcount = rootId ? rollups[rootId].headcount : records.length
  const totalPayroll = rootId
    ? rollups[rootId].payroll
    : records.reduce((sum, e) => sum + e.monthly_salary, 0)

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <h2 className="px-4 pt-4 text-sm font-semibold text-slate-900">Employee Directory</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2 font-medium">ID</th>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Manager</th>
              <th className="px-4 py-2 text-right font-medium">Headcount</th>
              <th className="px-4 py-2 text-right font-medium">Payroll</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((employee) => {
              const rollup = rollups[employee.employee_id]
              const isSelected = employee.employee_id === selectedId
              const isMoved = employee.employee_id === movedId
              const isChanged = changedIds.has(employee.employee_id)
              return (
                <tr
                  key={employee.employee_id}
                  onClick={() => onSelect(employee.employee_id)}
                  className={`cursor-pointer border-b border-slate-100 last:border-b-0 hover:bg-slate-50 ${
                    isSelected ? 'bg-accent/5' : ''
                  }`}
                >
                  <td className="px-4 py-2 font-mono text-xs text-slate-500">{employee.employee_id}</td>
                  <td className="px-4 py-2 font-medium text-slate-900">{employee.name}</td>
                  <td className="px-4 py-2 text-slate-600">{employee.role}</td>
                  <td className="px-4 py-2 font-mono text-xs text-slate-500">
                    {employee.manager_id ?? '—'}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-slate-700">{rollup.headcount}</td>
                  <td className="px-4 py-2 text-right tabular-nums font-medium text-slate-900">
                    {formatCurrency(rollup.payroll)}
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadges isSelected={isSelected} isMoved={isMoved} isChanged={isChanged} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-6 rounded-b-xl border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
        <span>
          Total Headcount: <span className="font-semibold tabular-nums text-slate-900">{totalHeadcount}</span>
        </span>
        <span>
          Total Payroll:{' '}
          <span className="font-semibold tabular-nums text-slate-900">{formatCurrency(totalPayroll)}</span>
        </span>
      </div>
    </section>
  )
}

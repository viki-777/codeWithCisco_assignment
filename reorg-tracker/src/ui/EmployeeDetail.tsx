import type { Employee } from '../org/types'
import type { Rollup } from '../org/rollups'
import { formatCurrency } from '../format'
import { UserIcon } from './icons'

interface EmployeeDetailProps {
  employee: Employee
  rollup: Rollup
  directReportCount: number
}

/** Shows the selected employee without ever mutating the tree. */
export function EmployeeDetail({ employee, rollup, directReportCount }: EmployeeDetailProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
        <UserIcon className="h-4 w-4 text-slate-400" />
        Selected Employee Details
      </h2>

      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
          {employee.name.charAt(0)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-medium text-slate-900">{employee.name}</p>
          <p className="truncate text-sm text-slate-500">
            {employee.employee_id} · {employee.role}
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-y-2.5 border-t border-slate-100 pt-3 text-sm">
        <dt className="text-slate-500">Own salary</dt>
        <dd className="text-right tabular-nums font-medium text-slate-900">
          {formatCurrency(employee.monthly_salary)}
        </dd>

        <dt className="text-slate-500">Direct reports</dt>
        <dd className="text-right tabular-nums font-medium text-slate-900">{directReportCount}</dd>

        <dt className="text-slate-500">Team headcount</dt>
        <dd className="text-right tabular-nums font-medium text-slate-900">{rollup.headcount}</dd>

        <dt className="text-slate-500">Team payroll</dt>
        <dd className="text-right tabular-nums font-medium text-slate-900">
          {formatCurrency(rollup.payroll)}
        </dd>
      </dl>
    </section>
  )
}

import type { Employee } from '../org/types'
import type { TransferError } from '../org/transfer'
import { TransferIcon, WarningIcon } from './icons'

export interface TransferForm {
  employeeId: string
  newManagerId: string
}

interface TransferPanelProps {
  records: readonly Employee[]
  form: TransferForm
  onChange: (form: TransferForm) => void
  onApply: () => void
  error: { employeeId: string; newManagerId: string; error: TransferError } | null
}

/**
 * Both dropdowns list every employee, including the root — deliberately not
 * filtered to "valid" targets, or the required ROOT_MOVE_FORBIDDEN,
 * MANAGEMENT_CYCLE, SELF_MANAGER and ALREADY_REPORTS_TO_MANAGER rejections
 * would become impossible to demonstrate.
 */
export function TransferPanel({ records, form, onChange, onApply, error }: TransferPanelProps) {
  const canApply = form.employeeId !== '' && form.newManagerId !== ''

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
        <TransferIcon className="h-4 w-4 text-slate-400" />
        Transfer Controls
      </h2>

      <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="transfer-employee">
        Select Employee to Move
      </label>
      <select
        id="transfer-employee"
        className="mb-3 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900"
        value={form.employeeId}
        onChange={(e) => onChange({ ...form, employeeId: e.target.value })}
      >
        <option value="">— choose an employee —</option>
        {records.map((e) => (
          <option key={e.employee_id} value={e.employee_id}>
            {e.employee_id} — {e.name} ({e.role})
          </option>
        ))}
      </select>

      <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="transfer-manager">
        Select New Manager
      </label>
      <select
        id="transfer-manager"
        className="mb-3 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900"
        value={form.newManagerId}
        onChange={(e) => onChange({ ...form, newManagerId: e.target.value })}
      >
        <option value="">— choose a manager —</option>
        {records.map((e) => (
          <option key={e.employee_id} value={e.employee_id}>
            {e.employee_id} — {e.name} ({e.role})
          </option>
        ))}
      </select>

      {error && (
        <div role="alert" className="mb-3 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-danger">
          <WarningIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm">
            <span className="font-mono text-xs font-semibold uppercase tracking-wide">{error.error.code}</span>
            {': '}
            {error.error.message}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onApply}
        disabled={!canApply}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Execute Transfer
      </button>
    </section>
  )
}

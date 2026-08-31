import { formatCurrency } from '../format'
import { HelpIcon, HierarchyIcon, ResetIcon } from './icons'

export interface DatasetOption {
  id: string
  label: string
}

interface HeaderProps {
  datasets: DatasetOption[]
  selectedDatasetId: string
  onSelectDataset: (id: string) => void
  onLoad: () => void
  onQuickLoad: (id: string) => void
  onReset: () => void
  canReset: boolean
  employeeCount: number | null
  totalPayroll: number | null
}

export function Header({
  datasets,
  selectedDatasetId,
  onSelectDataset,
  onLoad,
  onQuickLoad,
  onReset,
  canReset,
  employeeCount,
  totalPayroll,
}: HeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white">
            <HierarchyIcon className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-semibold leading-tight text-slate-900">
              Departmental Reorg Payroll Rollup Tracker
            </h1>
            <p className="text-xs text-slate-500">Manage organization structure and payroll impacts</p>
          </div>
        </div>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onQuickLoad('main')}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Load Valid Demo
          </button>
          <button
            type="button"
            onClick={() => onQuickLoad('duplicateId')}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Load Invalid Demo
          </button>

          <div className="mx-1 h-6 w-px bg-slate-200" />

          <select
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900"
            value={selectedDatasetId}
            onChange={(e) => onSelectDataset(e.target.value)}
          >
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onLoad}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-accent/90"
          >
            Load
          </button>

          <button
            type="button"
            onClick={onReset}
            disabled={!canReset}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ResetIcon className="h-4 w-4" />
            Reset
          </button>

          <button
            type="button"
            title="Click any employee to inspect them. Transfer controls list every employee, including the root, so rejections (cycle, root move, self-manager, already-reports-to) can be demonstrated."
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <HelpIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-6 border-t border-slate-100 bg-slate-50 px-6 py-2 text-sm text-slate-600">
        <span className="tabular-nums">
          <span className="font-medium text-slate-900">{employeeCount === null ? '—' : employeeCount}</span> employees
        </span>
        <span className="tabular-nums">
          <span className="font-medium text-slate-900">
            {totalPayroll === null ? '—' : formatCurrency(totalPayroll)}
          </span>{' '}
          total payroll
        </span>
      </div>
    </header>
  )
}

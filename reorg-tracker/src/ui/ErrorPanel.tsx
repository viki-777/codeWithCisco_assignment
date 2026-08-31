import type { LoadError } from '../org/types'
import { WarningIcon } from './icons'

interface ErrorPanelProps {
  error: LoadError
}

/**
 * Rendered INSTEAD OF the tree, table and totals — never above them. A
 * failed load must show no partial tree, totals, transfer result, or
 * leftover state from a previously valid department.
 */
export function ErrorPanel({ error }: ErrorPanelProps) {
  return (
    <div
      role="alert"
      className="mx-6 mt-6 flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-danger"
    >
      <WarningIcon className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-mono text-xs font-semibold uppercase tracking-wide">{error.code}</p>
        <p className="mt-1 text-sm text-slate-700">{error.message}</p>
      </div>
    </div>
  )
}

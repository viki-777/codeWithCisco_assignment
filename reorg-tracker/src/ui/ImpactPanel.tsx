import type { ReactNode } from 'react'
import type { Employee } from '../org/types'
import type { RollupMap } from '../org/rollups'
import { formatCurrency } from '../format'
import { ChartIcon } from './icons'

export interface SuccessfulTransfer {
  employeeId: string
  oldManagerId: string
  newManagerId: string
  previousRollups: RollupMap
  newRollups: RollupMap
  changedRollupIds: string[]
}

interface ImpactPanelProps {
  rootId: string
  records: readonly Employee[]
  lastTransfer: SuccessfulTransfer | null
}

function nameOf(records: readonly Employee[], id: string): string {
  return records.find((e) => e.employee_id === id)?.name ?? id
}

const BLOCK_THEME = {
  moved: { border: 'border-l-moved', bg: 'bg-moved/5', text: 'text-moved', label: '[i] MOVED SUBTREE' },
  old: { border: 'border-l-danger', bg: 'bg-danger/5', text: 'text-danger', label: '[-] OLD MANAGER' },
  new: { border: 'border-l-success', bg: 'bg-success/5', text: 'text-success', label: '[+] NEW MANAGER' },
  other: { border: 'border-l-warning', bg: 'bg-warning/5', text: 'text-warning', label: '[Δ] CHANGED' },
  neutral: { border: 'border-l-slate-300', bg: 'bg-slate-50', text: 'text-slate-500', label: '[=] UNCHANGED' },
} as const

/**
 * Lists changed rollups in source order, plus an explicit root row even
 * when unchanged — deliberately distinguishing structural ancestry from
 * financial impact, per CLAUDE.md §5. Old/new-manager colour coding is an
 * enhancement beyond the required "label or symbol as well as colour" rule,
 * not a replacement for it — every block still carries a bracketed text
 * label ([-], [+], [Δ], [=]) alongside its colour.
 */
export function ImpactPanel({ rootId, records, lastTransfer }: ImpactPanelProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
        <ChartIcon className="h-4 w-4 text-slate-400" />
        Transfer Impact
      </h2>

      {!lastTransfer ? (
        <p className="text-sm text-slate-500">No transfer applied yet.</p>
      ) : (
        <div className="space-y-2.5">
          <Block theme={BLOCK_THEME.moved}>
            <p className={`text-xs font-semibold tracking-wide ${BLOCK_THEME.moved.text}`}>
              {BLOCK_THEME.moved.label}: {lastTransfer.employeeId}
            </p>
            <p className="mt-1 text-sm text-slate-700">
              {nameOf(records, lastTransfer.employeeId)} moved from {nameOf(records, lastTransfer.oldManagerId)}{' '}
              to {nameOf(records, lastTransfer.newManagerId)}.
            </p>
            <p className="mt-1 text-sm tabular-nums text-slate-600">
              Headcount: {lastTransfer.newRollups[lastTransfer.employeeId].headcount} · Payroll:{' '}
              {formatCurrency(lastTransfer.newRollups[lastTransfer.employeeId].payroll)}
            </p>
          </Block>

          {lastTransfer.changedRollupIds.map((id) => {
            const theme = id === lastTransfer.oldManagerId ? BLOCK_THEME.old : id === lastTransfer.newManagerId ? BLOCK_THEME.new : BLOCK_THEME.other
            const before = lastTransfer.previousRollups[id]
            const after = lastTransfer.newRollups[id]
            return (
              <Block key={id} theme={theme}>
                <p className={`text-xs font-semibold tracking-wide ${theme.text}`}>
                  {theme.label}: {id} — {nameOf(records, id)}
                </p>
                <div className="mt-1 flex justify-between text-sm tabular-nums text-slate-700">
                  <span>
                    Size: {before.headcount} → {after.headcount}
                  </span>
                  <span>
                    Pay: {formatCurrency(before.payroll)} → {formatCurrency(after.payroll)}
                  </span>
                </div>
              </Block>
            )
          })}

          <Block theme={BLOCK_THEME.neutral}>
            <p className={`text-xs font-semibold tracking-wide ${BLOCK_THEME.neutral.text}`}>
              {BLOCK_THEME.neutral.label}: {rootId} — {nameOf(records, rootId)}
            </p>
            <div className="mt-1 flex justify-between text-sm tabular-nums text-slate-700">
              <span>
                Size: {lastTransfer.previousRollups[rootId].headcount} → {lastTransfer.newRollups[rootId].headcount}
              </span>
              <span>
                Pay: {formatCurrency(lastTransfer.previousRollups[rootId].payroll)} →{' '}
                {formatCurrency(lastTransfer.newRollups[rootId].payroll)}
              </span>
            </div>
          </Block>
        </div>
      )}
    </section>
  )
}

function Block({
  theme,
  children,
}: {
  theme: (typeof BLOCK_THEME)[keyof typeof BLOCK_THEME]
  children: ReactNode
}) {
  return <div className={`rounded-lg border-l-4 ${theme.border} ${theme.bg} px-3 py-2`}>{children}</div>
}

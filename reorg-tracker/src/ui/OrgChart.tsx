import type { TreeNode } from '../org/types'
import type { RollupMap } from '../org/rollups'
import { formatCurrency } from '../format'

interface OrgChartProps {
  root: TreeNode
  rollups: RollupMap
  selectedId: string
  movedId: string | null
  changedIds: ReadonlySet<string>
  oldManagerId: string | null
  newManagerId: string | null
  onSelect: (id: string) => void
  /** 1 = 100%. Wide (many siblings) or deep (many levels) trees — up to the
   * engine's 30-employee limit — can outgrow the viewport; zooming out via
   * a CSS transform keeps the whole chart reachable without a canvas/pan
   * library. Owned by the caller (OrganizationPanel) so the toolbar can
   * live in the shared card header next to the view toggle. */
  zoom: number
}

/**
 * Box/node-link organisation chart — an optional second view alongside the
 * required indented tree (CLAUDE.md §5 scopes a node-link chart as a
 * stretch goal once everything else is done). Connector lines are drawn
 * with plain divs (no canvas/SVG position math, no charting library), using
 * the same half-width-border technique as classic CSS org charts.
 */
export function OrgChart({ zoom, ...rest }: OrgChartProps) {
  return (
    <div className="overflow-auto pb-2">
      <div
        className="flex min-w-max justify-center px-4 pt-2"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
      >
        <ChartNode node={rest.root} depth={0} {...rest} />
      </div>
    </div>
  )
}

interface ChartNodeProps extends Omit<OrgChartProps, 'root' | 'zoom'> {
  node: TreeNode
  depth: number
}

function ChartNode({ node, depth, rollups, selectedId, movedId, changedIds, oldManagerId, newManagerId, onSelect }: ChartNodeProps) {
  const { employee, children } = node
  const rollup = rollups[employee.employee_id]
  const id = employee.employee_id

  const isRoot = depth === 0
  const isSelected = id === selectedId
  const isMoved = id === movedId
  const isOldManager = id === oldManagerId
  const isNewManager = id === newManagerId
  const isChanged = changedIds.has(id)
  const isChangedOther = isChanged && !isOldManager && !isNewManager

  let cardClass = 'border-slate-200 bg-white text-slate-900'
  if (isRoot) cardClass = 'border-slate-800 bg-slate-800 text-white'
  else if (isMoved) cardClass = 'border-moved bg-moved/5 text-slate-900'
  else if (isOldManager) cardClass = 'border-danger bg-danger/5 text-slate-900'
  else if (isNewManager) cardClass = 'border-success bg-success/5 text-slate-900'
  else if (isChangedOther) cardClass = 'border-warning bg-warning/5 text-slate-900'
  else if (isSelected) cardClass = 'border-accent bg-accent/5 text-slate-900'

  const childCount = children.length

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={() => onSelect(id)}
        className={`w-44 shrink-0 rounded-xl border-2 px-3 py-2 text-left shadow-sm transition hover:shadow-md ${cardClass} ${
          isSelected && !isRoot ? 'ring-2 ring-accent/40' : ''
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
              isRoot ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {employee.name.charAt(0)}
          </span>
          <span className="min-w-0 flex-1">
            <span className={`block truncate text-sm font-semibold ${isRoot ? 'text-white' : 'text-slate-900'}`}>
              {employee.name}
            </span>
            <span className={`block truncate text-xs ${isRoot ? 'text-white/70' : 'text-slate-500'}`}>
              {id} · {employee.role}
            </span>
          </span>
        </div>

        <div className={`mt-2 flex items-center justify-between text-xs tabular-nums ${isRoot ? 'text-white/90' : 'text-slate-600'}`}>
          <span>Headcount: {rollup.headcount}</span>
          <span className="font-medium">{formatCurrency(rollup.payroll)}</span>
        </div>

        {(isSelected || isMoved || isOldManager || isNewManager || isChangedOther) && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {isSelected && (
              <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                ◆ selected
              </span>
            )}
            {isMoved && (
              <span className="rounded-full bg-moved/15 px-1.5 py-0.5 text-[10px] font-medium text-moved">
                ↗ moved
              </span>
            )}
            {isOldManager && (
              <span className="rounded-full bg-danger/15 px-1.5 py-0.5 text-[10px] font-medium text-danger">
                ▼ old manager
              </span>
            )}
            {isNewManager && (
              <span className="rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-medium text-success">
                ▲ new manager
              </span>
            )}
            {isChangedOther && (
              <span className="rounded-full bg-warning/15 px-1.5 py-0.5 text-[10px] font-medium text-warning">
                Δ changed
              </span>
            )}
          </div>
        )}
      </button>

      {childCount > 0 && (
        <>
          <div className="h-5 w-px bg-rail" />
          <div className="flex">
            {children.map((child, i) => {
              const isFirst = i === 0
              const isLast = i === childCount - 1
              return (
                <div key={child.employee.employee_id} className="relative flex flex-col items-center px-4">
                  {/* Absolutely positioned so left/right resolve against this
                      column's full padding box (including the px-4 above) —
                      a normal-flow w-full div here would stop at the content
                      box instead, leaving a gap at every column boundary. */}
                  {childCount > 1 && (
                    <div
                      className={`absolute top-0 h-px bg-rail ${
                        isFirst ? 'left-1/2 right-0' : isLast ? 'left-0 right-1/2' : 'left-0 right-0'
                      }`}
                    />
                  )}
                  <div className="absolute left-1/2 top-0 h-5 w-px -translate-x-1/2 bg-rail" />
                  <div className="h-5" />
                  <ChartNode
                    node={child}
                    depth={depth + 1}
                    rollups={rollups}
                    selectedId={selectedId}
                    movedId={movedId}
                    changedIds={changedIds}
                    oldManagerId={oldManagerId}
                    newManagerId={newManagerId}
                    onSelect={onSelect}
                  />
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

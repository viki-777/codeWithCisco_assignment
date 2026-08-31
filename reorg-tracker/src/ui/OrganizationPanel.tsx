import { useState } from 'react'
import type { TreeNode } from '../org/types'
import type { RollupMap } from '../org/rollups'
import { OrgTree } from './OrgTree'
import { OrgChart } from './OrgChart'
import { HierarchyIcon, TreeViewIcon } from './icons'

interface OrganizationPanelProps {
  root: TreeNode
  rollups: RollupMap
  selectedId: string
  movedId: string | null
  changedIds: ReadonlySet<string>
  oldManagerId: string | null
  newManagerId: string | null
  onSelect: (id: string) => void
}

type View = 'chart' | 'indented'

const MIN_ZOOM = 0.4
const MAX_ZOOM = 1.5
const ZOOM_STEP = 0.1

/**
 * Two views over the same tree/rollup data: the required indented,
 * file-explorer-style rollup statement, and an optional box/node-link org
 * chart (CLAUDE.md §5's stretch goal, added once the required view was
 * already built and tested). The chart view also gets zoom controls — at
 * up to 30 employees a wide (many siblings) or deep tree can outgrow the
 * viewport; the indented view doesn't need this since it just grows the
 * page vertically like a normal list.
 */
export function OrganizationPanel(props: OrganizationPanelProps) {
  const [view, setView] = useState<View>('chart')
  const [zoom, setZoom] = useState(1)

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Organization Structure</h2>
        <div className="flex items-center gap-2">
          {view === 'chart' && (
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)))}
                disabled={zoom <= MIN_ZOOM}
                aria-label="Zoom out"
                className="flex h-6 w-6 items-center justify-center rounded text-slate-600 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                −
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                aria-label="Reset zoom"
                className="w-12 rounded px-1 text-center tabular-nums text-slate-600 hover:bg-white"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)))}
                disabled={zoom >= MAX_ZOOM}
                aria-label="Zoom in"
                className="flex h-6 w-6 items-center justify-center rounded text-slate-600 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                +
              </button>
            </div>
          )}
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setView('chart')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 ${
                view === 'chart' ? 'bg-white text-accent shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <HierarchyIcon className="h-3.5 w-3.5" />
              Org Chart
            </button>
            <button
              type="button"
              onClick={() => setView('indented')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 ${
                view === 'indented' ? 'bg-white text-accent shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <TreeViewIcon className="h-3.5 w-3.5" />
              Indented
            </button>
          </div>
        </div>
      </div>

      {view === 'chart' ? (
        <OrgChart
          root={props.root}
          rollups={props.rollups}
          selectedId={props.selectedId}
          movedId={props.movedId}
          changedIds={props.changedIds}
          oldManagerId={props.oldManagerId}
          newManagerId={props.newManagerId}
          onSelect={props.onSelect}
          zoom={zoom}
        />
      ) : (
        <OrgTree
          root={props.root}
          rollups={props.rollups}
          selectedId={props.selectedId}
          movedId={props.movedId}
          changedIds={props.changedIds}
          onSelect={props.onSelect}
        />
      )}
    </section>
  )
}

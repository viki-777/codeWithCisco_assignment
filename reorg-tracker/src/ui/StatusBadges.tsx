interface StatusBadgesProps {
  isSelected: boolean
  isMoved: boolean
  isChanged: boolean
}

/**
 * The three visual states required by CLAUDE.md §5, each with a label or
 * symbol as well as colour so the meaning survives without colour vision.
 */
export function StatusBadges({ isSelected, isMoved, isChanged }: StatusBadgesProps) {
  if (!isSelected && !isMoved && !isChanged) return null
  return (
    <span className="inline-flex items-center gap-1">
      {isSelected && (
        <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
          ◆ selected
        </span>
      )}
      {isMoved && (
        <span className="rounded-full border border-moved/40 bg-moved/10 px-2 py-0.5 text-xs font-medium text-moved">
          ↗ moved
        </span>
      )}
      {isChanged && (
        <span className="rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
          Δ changed
        </span>
      )}
    </span>
  )
}

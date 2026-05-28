export function EdgePill({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      aria-label="Edge"
      data-active={active}
      onClick={onToggle}
      className="rounded-full border-2 px-5 py-1.5 text-sm font-bold transition-colors"
      style={
        active
          ? { background: 'var(--player-accent)', color: 'var(--player-accent-fg)', borderColor: 'var(--player-accent)' }
          : { background: 'transparent', color: 'var(--player-accent)', borderColor: 'var(--player-accent)' }
      }
    >
      Edge
    </button>
  )
}

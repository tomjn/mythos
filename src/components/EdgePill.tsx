export function EdgePill({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-label="Edge"
      data-active={active}
      onClick={onToggle}
      className="hover-lift rounded-full border-2 px-5 py-1.5 text-sm font-bold transition-[transform,background-color,border-color,color] duration-200 active:scale-95"
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

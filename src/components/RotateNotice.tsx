import { RotateCcw } from 'lucide-react'

// Visibility is controlled by the `.landscape-blocker` media query in index.css:
// it stays hidden except on short landscape (phone-on-its-side) viewports.
export function RotateNotice() {
  return (
    <div className="landscape-blocker fixed inset-0 z-50 flex-col items-center justify-center gap-4 bg-slate-900 p-8 text-center text-slate-100">
      <RotateCcw size={48} className="text-slate-300" />
      <p className="text-lg font-semibold">Please rotate to portrait</p>
      <p className="max-w-xs text-sm text-slate-400">
        This counter is made for a phone held upright or laid flat between players.
      </p>
    </div>
  )
}

import { QRCodeSVG } from 'qrcode.react'
import { useTheme } from '@/match/ThemeContext'

// The app's own URL, minus the hash route, so the QR points at the app root
// wherever it's hosted (GitHub Pages today, elsewhere later).
function shareUrl(): string {
  if (typeof window === 'undefined') return 'https://tomjn.github.io/mythos/'
  return window.location.origin + window.location.pathname
}

export function ShareCard() {
  const url = shareUrl()
  const { theme } = useTheme()
  return (
    <section className="flex flex-col items-center gap-3 rounded-xl bg-[color:var(--page-field)] p-5 text-center">
      <h2 className={`text-sm font-semibold uppercase tracking-widest opacity-80 ${theme.displayFont ? 'font-ninja' : ''}`}>Share</h2>
      <div className="rounded-xl bg-white p-3">
        <QRCodeSVG
          value={url}
          size={168}
          level="H"
          bgColor="#ffffff"
          fgColor="#16306b"
          marginSize={1}
          imageSettings={{ src: `${import.meta.env.BASE_URL}swirl.svg`, height: 44, width: 44, excavate: true }}
        />
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-sm underline underline-offset-2 opacity-80 hover:opacity-100"
      >
        {url}
      </a>
    </section>
  )
}

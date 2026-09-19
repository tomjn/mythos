import type { LogEntry, Player } from './types'

export function formatMs(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(m)}:${pad(s)}`
}

export function formatMinutes(ms: number): string {
  return String(Math.round((ms / 60000) * 100) / 100)
}

export function formatLogEntry(entry: LogEntry, players: [Player, Player]): string {
  if (entry.kind === 'event') return entry.text
  const delta = entry.to - entry.from
  const verb = delta > 0 ? 'added' : 'removed'
  return `${players[entry.player].name} ${verb} ${Math.abs(delta)} ${entry.stat} (${entry.from} to ${entry.to})`
}

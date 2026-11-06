import type { BookedSlot, BusinessHourRecord } from '@/types/appointments'

// Grade de horários: início a cada 30 min, dentro dos períodos de atendimento da loja.
export const SLOT_STEP_MINUTES = 30

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function fromMinutes(total: number): string {
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

// Data local no formato YYYY-MM-DD
export function formatLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Dia da semana (0 = domingo) de uma data YYYY-MM-DD, igual ao usado no backend
export function weekdayOf(date: string): number {
  return new Date(date + 'T12:00:00Z').getUTCDay()
}

// Próximas datas a partir de hoje (inclusive)
export function buildUpcomingDates(days: number, from: Date = new Date()): string[] {
  const out: string[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i)
    out.push(formatLocalDate(d))
  }
  return out
}

// Horários de início livres para uma data e duração. Respeita períodos, ocupações e horários passados.
export function computeFreeSlots(params: {
  date: string
  durationMinutes: number
  hours: BusinessHourRecord[]
  booked: BookedSlot[]
  now?: Date
}): string[] {
  const { date, durationMinutes, hours, booked, now = new Date() } = params
  const weekday = weekdayOf(date)
  const dayBooked = booked.filter((b) => b.date === date)
  const starts = new Set<number>()

  for (const h of hours) {
    if (h.weekday !== weekday || h.active === false) continue
    const hStart = toMinutes(h.start_time)
    const hEnd = toMinutes(h.end_time)
    for (let s = hStart; s + durationMinutes <= hEnd; s += SLOT_STEP_MINUTES) {
      const e = s + durationMinutes
      const overlaps = dayBooked.some(
        (b) => s < toMinutes(b.end_time) && e > toMinutes(b.start_time),
      )
      if (overlaps) continue
      // Fuso de Brasília, igual à validação do backend
      const slotTime = new Date(`${date}T${fromMinutes(s)}:00-03:00`)
      if (slotTime.getTime() < now.getTime()) continue
      starts.add(s)
    }
  }
  return Array.from(starts)
    .sort((a, b) => a - b)
    .map(fromMinutes)
}

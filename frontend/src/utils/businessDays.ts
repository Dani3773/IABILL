// Dias úteis para o prazo de comunicação de incidente na LGPD (Resolução CD/ANPD
// 15/2024: 3 dias úteis). Pula sábados, domingos e feriados nacionais. Feriados
// estaduais e municipais não entram: dependem do local e o sistema não os conhece.

// Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher, calendário gregoriano).
function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function key(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

// Feriados nacionais: Lei 662/1949, Lei 6.802/1980 (Aparecida), Lei 14.759/2023
// (Consciência Negra) e Paixão de Cristo (sexta-feira antes da Páscoa).
export function brazilianNationalHolidays(year: number): Set<string> {
  const fixed: [number, number][] = [
    [1, 1], [4, 21], [5, 1], [9, 7], [10, 12], [11, 2], [11, 15], [11, 20], [12, 25],
  ]
  const days = fixed.map(([month, day]) => key(new Date(year, month - 1, day)))
  const goodFriday = easterSunday(year)
  goodFriday.setDate(goodFriday.getDate() - 2)
  days.push(key(goodFriday))
  return new Set(days)
}

export function isBrazilianBusinessDay(date: Date): boolean {
  const weekday = date.getDay()
  if (weekday === 0 || weekday === 6) return false
  return !brazilianNationalHolidays(date.getFullYear()).has(key(date))
}

// Soma N dias úteis a uma data (o dia do início não conta).
export function addBrazilianBusinessDays(start: Date, days: number): Date {
  const result = new Date(start)
  let added = 0
  while (added < days) {
    result.setDate(result.getDate() + 1)
    if (isBrazilianBusinessDay(result)) added++
  }
  return result
}

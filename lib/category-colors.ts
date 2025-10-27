export function getCategoryBadgeColorByName(name: string): string {
  const map: Record<string, string> = {
    Principiante: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    Intermedio: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    Avanzado: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
    Competición: 'bg-red-100 text-red-800 hover:bg-red-200',
    Veterano: 'bg-purple-100 text-purple-800 hover:bg-purple-200'
  }
  if (map[name]) return map[name]
  const palette = [
    'bg-sky-100 text-sky-800 hover:bg-sky-200',
    'bg-teal-100 text-teal-800 hover:bg-teal-200',
    'bg-amber-100 text-amber-800 hover:bg-amber-200',
    'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
    'bg-rose-100 text-rose-800 hover:bg-rose-200',
    'bg-lime-100 text-lime-800 hover:bg-lime-200'
  ]
  const hash = (name || '')
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return palette[hash % palette.length]
}

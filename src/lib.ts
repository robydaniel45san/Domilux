export const money = (n: number) =>
  'Bs.' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const colorHex: Record<string, string> = {
  Blanco: '#ffffff',
  Negro: '#1f1f1f',
  Gris: '#9ca3af',
}

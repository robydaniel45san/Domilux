export const money = (n: number) =>
  'Bs.' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const SHIPPING_FLAT = 15
export const FREE_SHIPPING_FROM = 500

export const colorHex: Record<string, string> = {
  Blanco: '#ffffff',
  Negro: '#1f1f1f',
  Gris: '#9ca3af',
}

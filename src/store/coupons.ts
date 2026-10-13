import { createStore, useStoreValue } from './persist'

export interface Coupon {
  code: string
  type: 'percent' | 'fixed'
  value: number
  minSubtotal: number
  active: boolean
  uses: number
}

const seed = (): Coupon[] => [
  { code: 'DOMI10', type: 'percent', value: 10, minSubtotal: 0, active: true, uses: 4 },
  { code: 'BIENVENIDO', type: 'fixed', value: 20, minSubtotal: 150, active: true, uses: 2 },
  { code: 'VERANO25', type: 'percent', value: 25, minSubtotal: 300, active: false, uses: 9 },
]

export const couponStore = createStore<Coupon[]>('dl-coupons', seed)
export const useCoupons = () => useStoreValue(couponStore)

export const findCoupon = (code: string) => couponStore.get().find((c) => c.code.toLowerCase() === code.trim().toLowerCase())

/** Devuelve un mensaje de error o null si el cupón es válido para ese subtotal. */
export function validateCoupon(code: string, subtotal: number): string | null {
  const c = findCoupon(code)
  if (!c || !c.active) return 'El cupón no existe o no está activo.'
  if (subtotal < c.minSubtotal) return `Este cupón requiere una compra mínima de Bs.${c.minSubtotal}.`
  return null
}

export const couponDiscount = (code: string | null, subtotal: number): number => {
  if (!code || validateCoupon(code, subtotal)) return 0
  const c = findCoupon(code)!
  const d = c.type === 'percent' ? (subtotal * c.value) / 100 : c.value
  return Math.round(Math.min(d, subtotal) * 100) / 100
}

export const registerCouponUse = (code: string) =>
  couponStore.set((l) => l.map((c) => (c.code.toLowerCase() === code.toLowerCase() ? { ...c, uses: c.uses + 1 } : c)))

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { CartItem, User } from '../types'
import { getProductById } from '../data/products'
import { useSettings, type PayMethod } from '../store/settings'
import { couponDiscount, registerCouponUse, validateCoupon } from '../store/coupons'
import { createOrder, type Order } from '../store/orders'

export interface CheckoutData {
  customer: Order['customer']
  payMethod: PayMethod
  notes: string
}

interface Store {
  cart: CartItem[]
  wishlist: number[]
  user: User | null
  cartCount: number
  subtotal: number
  discount: number
  shipping: number
  total: number
  carrierId: string
  setCarrierId: (id: string) => void
  couponCode: string | null
  applyCoupon: (code: string) => string | null
  removeCoupon: () => void
  placeOrder: (d: CheckoutData) => Order
  addToCart: (id: number, qty?: number) => void
  setQty: (id: number, qty: number) => void
  removeFromCart: (id: number) => void
  clearCart: () => void
  toggleWish: (id: number) => void
  login: (u: User) => void
  logout: () => void
  drawer: 'cart' | 'login' | null
  openDrawer: (d: 'cart' | 'login' | null) => void
}

const Ctx = createContext<Store>(null!)
// eslint-disable-next-line react-refresh/only-export-components
export const useStore = () => useContext(Ctx)

function useLocal<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(() => {
    try {
      const s = localStorage.getItem(key)
      return s ? (JSON.parse(s) as T) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(v))
    } catch {
      /* sin storage */
    }
  }, [key, v])
  return [v, setV] as const
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const settings = useSettings()
  const [cart, setCart] = useLocal<CartItem[]>('dl-cart', [])
  const [wishlist, setWishlist] = useLocal<number[]>('dl-wish', [])
  const [user, setUser] = useLocal<User | null>('dl-user', null)
  const [carrierPref, setCarrierId] = useLocal<string>('dl-carrier', 'local')
  const [couponCode, setCoupon] = useLocal<string | null>('dl-coupon', null)
  const [drawer, openDrawer] = useState<Store['drawer']>(null)

  const value = useMemo<Store>(() => {
    const subtotal = cart.reduce((s, i) => s + (getProductById(i.id)?.price ?? 0) * i.qty, 0)
    const active = settings.shipping.carriers.filter((c) => c.active)
    const carrier = active.find((c) => c.id === carrierPref) ?? active[0]
    const shipping = !carrier || cart.length === 0 || carrier.price === 0 || subtotal >= settings.shipping.freeFrom ? 0 : carrier.price
    const discount = couponDiscount(couponCode, subtotal)
    return {
      cart,
      wishlist,
      user,
      drawer,
      openDrawer,
      cartCount: cart.reduce((s, i) => s + i.qty, 0),
      subtotal,
      discount,
      shipping,
      total: subtotal - discount + shipping,
      carrierId: carrier?.id ?? '',
      setCarrierId,
      couponCode: discount > 0 ? couponCode : null,
      applyCoupon: (code) => {
        const err = validateCoupon(code, subtotal)
        if (err) return err
        setCoupon(code.trim().toUpperCase())
        return null
      },
      removeCoupon: () => setCoupon(null),
      placeOrder: (d) => {
        const items = cart.flatMap((i) => {
          const p = getProductById(i.id)
          return p ? [{ id: p.id, name: p.name, price: p.price, qty: i.qty, image: p.images[0] ?? '' }] : []
        })
        const order = createOrder({
          customer: d.customer,
          items,
          subtotal,
          shipping,
          discount,
          coupon: discount > 0 ? couponCode : null,
          total: subtotal - discount + shipping,
          payMethod: d.payMethod,
          carrierId: carrier?.id ?? '',
          notes: d.notes,
        })
        if (discount > 0 && couponCode) registerCouponUse(couponCode)
        setCart([])
        setCoupon(null)
        return order
      },
      addToCart: (id, qty = 1) =>
        setCart((c) =>
          c.some((i) => i.id === id)
            ? c.map((i) => (i.id === id ? { ...i, qty: i.qty + qty } : i))
            : [...c, { id, qty }],
        ),
      setQty: (id, qty) =>
        setCart((c) => (qty <= 0 ? c.filter((i) => i.id !== id) : c.map((i) => (i.id === id ? { ...i, qty } : i)))),
      removeFromCart: (id) => setCart((c) => c.filter((i) => i.id !== id)),
      clearCart: () => setCart([]),
      toggleWish: (id) => setWishlist((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id])),
      login: setUser,
      logout: () => setUser(null),
    }
  }, [cart, wishlist, user, drawer, settings, carrierPref, couponCode, setCart, setWishlist, setUser, setCarrierId, setCoupon])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

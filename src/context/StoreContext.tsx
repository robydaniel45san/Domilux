import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { CartItem, User } from '../types'
import { getProductById } from '../data/products'
import { FREE_SHIPPING_FROM, SHIPPING_FLAT } from '../lib'

interface Store {
  cart: CartItem[]
  wishlist: number[]
  user: User | null
  cartCount: number
  subtotal: number
  shipping: number
  total: number
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
  const [cart, setCart] = useLocal<CartItem[]>('dl-cart', [])
  const [wishlist, setWishlist] = useLocal<number[]>('dl-wish', [])
  const [user, setUser] = useLocal<User | null>('dl-user', null)
  const [drawer, openDrawer] = useState<Store['drawer']>(null)

  const value = useMemo<Store>(() => {
    const subtotal = cart.reduce((s, i) => s + (getProductById(i.id)?.price ?? 0) * i.qty, 0)
    const shipping = cart.length === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FLAT
    return {
      cart,
      wishlist,
      user,
      drawer,
      openDrawer,
      cartCount: cart.reduce((s, i) => s + i.qty, 0),
      subtotal,
      shipping,
      total: subtotal + shipping,
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
  }, [cart, wishlist, user, drawer, setCart, setWishlist, setUser])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

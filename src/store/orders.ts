import { allProducts, adjustStock } from '../data/products'
import { createStore, useStoreValue } from './persist'
import type { PayMethod } from './settings'

export type OrderStatus = 'pendiente' | 'preparando' | 'enviado' | 'entregado' | 'cancelado'
export type PayStatus = 'pendiente' | 'pagado' | 'reembolsado' | 'fallido'

export const orderStatuses: OrderStatus[] = ['pendiente', 'preparando', 'enviado', 'entregado', 'cancelado']
export const payStatuses: PayStatus[] = ['pendiente', 'pagado', 'reembolsado', 'fallido']

export interface OrderItem {
  id: number
  name: string
  price: number
  qty: number
  image: string
}

export interface Order {
  id: number
  createdAt: string
  customer: { name: string; email: string; phone: string; address: string; city: string }
  items: OrderItem[]
  subtotal: number
  shipping: number
  discount: number
  coupon: string | null
  total: number
  payMethod: PayMethod
  payStatus: PayStatus
  status: OrderStatus
  carrierId: string
  tracking: string
  notes: string
  demo?: boolean
  history: { at: string; text: string }[]
}

// ---------- Datos de demostración (determinísticos) ----------
function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const people = [
  ['Carlos Mendoza', 'Equipetrol'], ['Lucía Vaca', 'Urbarí'], ['Marcelo Suárez', 'Plan 3000'], ['Andrea Rojas', 'Las Palmas'],
  ['Jorge Antelo', 'Av. Banzer'], ['Valeria Peña', 'Equipetrol'], ['Diego Salvatierra', 'Villa 1ro de Mayo'], ['Camila Justiniano', 'Cristo Redentor'],
  ['Roberto Egüez', 'Urbarí'], ['Daniela Parada', 'Av. Alemana'], ['Fabián Roca', 'Los Pozos'], ['Mónica Ribera', 'Av. Santos Dumont'],
  ['Hugo Chávez', 'Av. Mutualista'], ['Paola Gutiérrez', 'Equipetrol Norte'],
]

export function seedOrders(): Order[] {
  const rand = rng(2026)
  const day = 86400000
  const now = Date.now()
  const pool = allProducts.filter((p) => p.price >= 100 && p.active !== false)
  const out: Order[] = []
  let id = 10240
  for (let d = 29; d >= 0; d--) {
    const n = rand() < 0.25 ? 0 : 1 + Math.floor(rand() * 2)
    for (let k = 0; k < n; k++) {
      const [name, zone] = people[Math.floor(rand() * people.length)]
      const items: OrderItem[] = Array.from({ length: 1 + Math.floor(rand() * 2) }, () => {
        const p = pool[Math.floor(rand() * pool.length)]
        return { id: p.id, name: p.name, price: p.price, qty: 1 + Math.floor(rand() * 2), image: p.images[0] ?? '' }
      })
      const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
      const carrierId = rand() < 0.65 ? 'local' : rand() < 0.6 ? 'nacional' : 'recojo'
      const shipping = carrierId === 'recojo' || subtotal >= 500 ? 0 : carrierId === 'local' ? 15 : 40
      const createdAt = new Date(now - d * day - Math.floor(rand() * 8) * 3600000).toISOString()
      const r = rand()
      let status: OrderStatus
      let payStatus: PayStatus
      if (d > 6) {
        status = r < 0.06 ? 'cancelado' : 'entregado'
        payStatus = status === 'cancelado' ? (rand() < 0.5 ? 'reembolsado' : 'fallido') : 'pagado'
      } else if (d > 2) {
        status = r < 0.55 ? 'entregado' : r < 0.85 ? 'enviado' : 'preparando'
        payStatus = 'pagado'
      } else {
        status = r < 0.4 ? 'pendiente' : r < 0.75 ? 'preparando' : 'enviado'
        payStatus = status === 'pendiente' ? 'pendiente' : 'pagado'
      }
      const payMethod: PayMethod = rand() < 0.55 ? 'qr' : rand() < 0.7 ? 'cash' : 'store'
      if (payMethod === 'cash' && status !== 'entregado' && status !== 'cancelado') payStatus = 'pendiente'
      const tracking = status === 'enviado' || status === 'entregado' ? (carrierId === 'nacional' ? `ENC-${Math.floor(100000 + rand() * 900000)}` : carrierId === 'local' ? `DEL-${Math.floor(1000 + rand() * 9000)}` : '') : ''
      out.push({
        id: id++,
        createdAt,
        customer: {
          name,
          email: `${name.split(' ')[0].toLowerCase()}${Math.floor(rand() * 90 + 10)}@mail.com`,
          phone: `+591 7${Math.floor(1000000 + rand() * 8999999)}`,
          address: `${zone}, Calle ${Math.floor(1 + rand() * 20)} #${Math.floor(10 + rand() * 300)}`,
          city: carrierId === 'nacional' ? ['La Paz', 'Cochabamba', 'Sucre', 'Tarija'][Math.floor(rand() * 4)] : 'Santa Cruz de la Sierra',
        },
        items,
        subtotal,
        shipping,
        discount: 0,
        coupon: null,
        total: subtotal + shipping,
        payMethod,
        payStatus,
        status,
        carrierId,
        tracking,
        notes: '',
        demo: true,
        history: [{ at: createdAt, text: 'Pedido recibido' }],
      })
    }
  }
  return out.sort((a, b) => b.id - a.id)
}

export const orderStore = createStore<Order[]>('dl-orders', seedOrders)
export const useOrders = () => useStoreValue(orderStore)

const nowIso = () => new Date().toISOString()

export function createOrder(o: Omit<Order, 'id' | 'createdAt' | 'history' | 'status' | 'payStatus' | 'tracking' | 'demo'>): Order {
  const id = Math.max(10239, ...orderStore.get().map((x) => x.id)) + 1
  const order: Order = {
    ...o,
    id,
    createdAt: nowIso(),
    status: 'pendiente',
    payStatus: 'pendiente',
    tracking: '',
    history: [{ at: nowIso(), text: 'Pedido recibido desde la tienda' }],
  }
  orderStore.set((l) => [order, ...l])
  o.items.forEach((i) => adjustStock(i.id, -i.qty))
  return order
}

/** Aplica un cambio al pedido y registra una línea en su historial. Repone stock al cancelar. */
export function updateOrder(id: number, patch: Partial<Order>, log?: string) {
  const prev = orderStore.get().find((o) => o.id === id)
  if (!prev) return
  if (patch.status && patch.status !== prev.status) {
    if (patch.status === 'cancelado') prev.items.forEach((i) => adjustStock(i.id, i.qty))
    if (prev.status === 'cancelado') prev.items.forEach((i) => adjustStock(i.id, -i.qty))
  }
  orderStore.set((l) =>
    l.map((o) => (o.id === id ? { ...o, ...patch, history: log ? [...o.history, { at: nowIso(), text: log }] : o.history } : o)),
  )
}

export const statusMeta: Record<OrderStatus, { label: string; tone: 'yellow' | 'blue' | 'purple' | 'green' | 'red' }> = {
  pendiente: { label: 'Pendiente', tone: 'yellow' },
  preparando: { label: 'Preparando', tone: 'blue' },
  enviado: { label: 'Enviado', tone: 'purple' },
  entregado: { label: 'Entregado', tone: 'green' },
  cancelado: { label: 'Cancelado', tone: 'red' },
}

export const payMeta: Record<PayStatus, { label: string; tone: 'yellow' | 'green' | 'gray' | 'red' }> = {
  pendiente: { label: 'Por cobrar', tone: 'yellow' },
  pagado: { label: 'Pagado', tone: 'green' },
  reembolsado: { label: 'Reembolsado', tone: 'gray' },
  fallido: { label: 'Fallido', tone: 'red' },
}

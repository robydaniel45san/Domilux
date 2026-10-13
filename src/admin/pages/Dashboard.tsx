import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, DollarSign, Hourglass, Receipt, ShoppingBag, Truck } from 'lucide-react'
import { allProducts, useCatalog } from '../../data/products'
import { money } from '../../lib'
import { payMeta, statusMeta, orderStatuses, useOrders, type Order } from '../../store/orders'
import { useSettings } from '../../store/settings'
import { Badge, Card, Empty, PageHeader, Stat, fmtDate } from '../ui'

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
const RANGES = [7, 14, 30] as const

export default function Dashboard() {
  const orders = useOrders()
  useCatalog()
  const { lowStock } = useSettings()
  const [range, setRange] = useState<(typeof RANGES)[number]>(14)

  const data = useMemo(() => {
    const now = new Date()
    const days = Array.from({ length: range }, (_, i) => {
      const d = new Date(now)
      d.setDate(now.getDate() - (range - 1 - i))
      return { d, key: dayKey(d), total: 0, count: 0 }
    })
    const byKey = new Map(days.map((x) => [x.key, x]))
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
    let monthRevenue = 0
    let monthOrders = 0
    let monthPaidCount = 0
    for (const o of orders) {
      const t = new Date(o.createdAt)
      const paid = o.payStatus === 'pagado'
      const slot = byKey.get(dayKey(t))
      if (slot && o.status !== 'cancelado') {
        slot.count++
        if (paid) slot.total += o.total
      }
      if (t.getTime() >= monthStart && o.status !== 'cancelado') {
        monthOrders++
        if (paid) {
          monthRevenue += o.total
          monthPaidCount++
        }
      }
    }
    const toCollect = orders.filter((o) => o.payStatus === 'pendiente' && o.status !== 'cancelado').reduce((s, o) => s + o.total, 0)
    const toShip = orders.filter((o) => o.status === 'pendiente' || o.status === 'preparando').length
    const inRoute = orders.filter((o) => o.status === 'enviado').length
    const sold = new Map<number, { name: string; qty: number; amount: number }>()
    for (const o of orders) {
      if (o.status === 'cancelado') continue
      for (const i of o.items) {
        const cur = sold.get(i.id) ?? { name: i.name, qty: 0, amount: 0 }
        cur.qty += i.qty
        cur.amount += i.qty * i.price
        sold.set(i.id, cur)
      }
    }
    const top = [...sold.values()].sort((a, b) => b.qty - a.qty).slice(0, 5)
    return { days, monthRevenue, monthOrders, avgTicket: monthPaidCount ? monthRevenue / monthPaidCount : 0, toCollect, toShip, inRoute, top }
  }, [orders, range])

  const max = Math.max(1, ...data.days.map((d) => d.total))
  const lowItems = allProducts.filter((p) => p.stock <= lowStock).sort((a, b) => a.stock - b.stock)
  const byStatus = orderStatuses.map((s) => ({ s, n: orders.filter((o: Order) => o.status === s).length }))
  const totalOrders = Math.max(1, orders.length)
  const recent = orders.slice(0, 6)

  return (
    <>
      <PageHeader title="Resumen" desc="Estado general de la tienda: ventas, pedidos, cobros y logística." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Stat label="Ventas cobradas (mes)" value={money(data.monthRevenue)} sub={`${data.monthOrders} pedidos este mes`} icon={<DollarSign />} tone="green" />
        <Stat label="Ticket promedio" value={money(data.avgTicket)} sub="Por pedido cobrado" icon={<Receipt />} tone="blue" />
        <Stat label="Por cobrar" value={money(data.toCollect)} sub="Pedidos con pago pendiente" icon={<Hourglass />} tone="yellow" />
        <Stat label="Por despachar" value={String(data.toShip)} sub="Pendientes o preparando" icon={<ShoppingBag />} tone="purple" />
        <Stat label="En ruta" value={String(data.inRoute)} sub="Pedidos enviados" icon={<Truck />} tone="blue" />
        <Stat label="Stock bajo" value={String(lowItems.length)} sub={`Productos con ≤ ${lowStock} unidades`} icon={<AlertTriangle />} tone={lowItems.length ? 'red' : 'gray'} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card
          title="Ventas cobradas por día"
          className="xl:col-span-2"
          action={
            <div className="flex gap-1 rounded-lg bg-neutral-100 p-1 text-xs font-semibold">
              {RANGES.map((r) => (
                <button key={r} onClick={() => setRange(r)} className={`cursor-pointer rounded-md px-2.5 py-1 ${range === r ? 'bg-white shadow' : 'text-neutral-500'}`}>{r} días</button>
              ))}
            </div>
          }
        >
          <div className="flex h-56 items-end gap-1 sm:gap-1.5" role="img" aria-label="Gráfico de barras de ventas por día">
            {data.days.map((d) => (
              <div key={d.key} className="group relative flex h-full flex-1 flex-col justify-end">
                <div className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded bg-neutral-900 px-2 py-1 text-xs text-white group-hover:block">
                  {d.d.toLocaleDateString('es-BO', { day: 'numeric', month: 'short' })} · {money(d.total)} · {d.count} ped.
                </div>
                <div className="w-full rounded-t bg-brand transition-colors group-hover:bg-accent" style={{ height: `${Math.max(2, (d.total / max) * 100)}%`, opacity: d.total ? 1 : 0.2 }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-neutral-400">
            <span>{data.days[0].d.toLocaleDateString('es-BO', { day: 'numeric', month: 'short' })}</span>
            <span>Máx. diario {money(max === 1 ? 0 : max)}</span>
            <span>Hoy</span>
          </div>
        </Card>

        <Card title="Pedidos por estado">
          <ul className="space-y-3">
            {byStatus.map(({ s, n }) => (
              <li key={s}>
                <div className="mb-1 flex justify-between text-sm"><span>{statusMeta[s].label}</span><b>{n}</b></div>
                <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${(n / totalOrders) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Últimos pedidos" className="xl:col-span-2" pad={false} action={<Link to="/admin/pedidos" className="text-sm font-medium text-brand hover:underline">Ver todos</Link>}>
          {recent.length === 0 ? <Empty>Aún no hay pedidos.</Empty> : (
            <ul className="divide-y divide-neutral-100">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link to={`/admin/pedidos?ver=${o.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm hover:bg-neutral-50">
                    <b className="w-16">#{o.id}</b>
                    <span className="min-w-0 flex-1 truncate">{o.customer.name} <span className="text-neutral-400">· {fmtDate(o.createdAt)}</span></span>
                    <Badge tone={statusMeta[o.status].tone}>{statusMeta[o.status].label}</Badge>
                    <Badge tone={payMeta[o.payStatus].tone}>{payMeta[o.payStatus].label}</Badge>
                    <b className="w-24 text-right">{money(o.total)}</b>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card title="Más vendidos">
            {data.top.length === 0 ? <Empty>Sin ventas todavía.</Empty> : (
              <ol className="space-y-3 text-sm">
                {data.top.map((t, i) => (
                  <li key={t.name} className="flex items-center gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-neutral-100 text-xs font-bold">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate">{t.name}</span>
                    <span className="shrink-0 text-neutral-500">{t.qty} u.</span>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card title="Alertas de stock" action={<Link to="/admin/productos" className="text-sm font-medium text-brand hover:underline">Gestionar</Link>}>
            {lowItems.length === 0 ? <p className="text-sm text-green-700">Todo el inventario está por encima del mínimo.</p> : (
              <ul className="space-y-2 text-sm">
                {lowItems.slice(0, 5).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate">{p.name}</span>
                    <Badge tone={p.stock === 0 ? 'red' : 'yellow'}>{p.stock === 0 ? 'Agotado' : `${p.stock} u.`}</Badge>
                  </li>
                ))}
                {lowItems.length > 5 && <li className="text-xs text-neutral-500">y {lowItems.length - 5} más…</li>}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}

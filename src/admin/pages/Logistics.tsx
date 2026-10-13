import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, PackageCheck, Plus, Trash2, Truck } from 'lucide-react'
import { adjustStock, allProducts, useCatalog } from '../../data/products'
import { money } from '../../lib'
import { statusMeta, updateOrder, useOrders, type Order, type OrderStatus } from '../../store/orders'
import { updateSettings, useSettings, type Carrier } from '../../store/settings'
import { Badge, Card, Empty, Stat, Table, TD, TH, PageHeader, Toggle, fmtDate } from '../ui'

const columns: { s: OrderStatus; title: string; next?: OrderStatus; cta?: string }[] = [
  { s: 'pendiente', title: 'Por confirmar', next: 'preparando', cta: 'Preparar' },
  { s: 'preparando', title: 'Preparando', next: 'enviado', cta: 'Marcar enviado' },
  { s: 'enviado', title: 'En ruta', next: 'entregado', cta: 'Marcar entregado' },
  { s: 'entregado', title: 'Entregados' },
]

function Card1({ o, next, cta, carrierName }: { o: Order; next?: OrderStatus; cta?: string; carrierName: string }) {
  const units = o.items.reduce((s, i) => s + i.qty, 0)
  const needsTracking = o.status === 'enviado' && !o.tracking && o.carrierId !== 'recojo'
  return (
    <div className="space-y-2 rounded-lg border border-neutral-200 bg-white p-3 text-sm shadow-sm">
      <div className="flex items-center justify-between">
        <Link to={`/admin/pedidos?ver=${o.id}`} className="font-bold text-brand hover:underline">#{o.id}</Link>
        <span className="text-xs text-neutral-400">{fmtDate(o.createdAt)}</span>
      </div>
      <p className="font-medium">{o.customer.name}</p>
      <p className="text-xs text-neutral-500">{o.customer.city} · {units} {units === 1 ? 'unidad' : 'unidades'} · {money(o.total)}</p>
      <p className="flex items-center gap-1 text-xs text-neutral-500"><Truck size={12} /> {carrierName}</p>
      {o.tracking && <p className="text-xs">Guía: <b>{o.tracking}</b></p>}
      {needsTracking && <Badge tone="yellow">Falta n.º de guía</Badge>}
      {o.payStatus === 'pendiente' && <Badge tone="yellow">Pago pendiente</Badge>}
      {next && (
        <button
          onClick={() => updateOrder(o.id, { status: next, ...(next === 'entregado' && o.payMethod === 'cash' && o.payStatus === 'pendiente' ? { payStatus: 'pagado' as const } : {}) }, `Estado: ${statusMeta[next].label}`)}
          className="btn btn-outline w-full !py-1.5 !text-xs"
        >
          {cta} <ArrowRight size={14} />
        </button>
      )}
    </div>
  )
}

export default function Logistics() {
  const orders = useOrders()
  useCatalog()
  const { shipping, lowStock } = useSettings()
  const carriers = shipping.carriers

  const byCol = useMemo(() => {
    const m = new Map<OrderStatus, Order[]>()
    columns.forEach((c) => m.set(c.s, orders.filter((o) => o.status === c.s)))
    return m
  }, [orders])

  const today = new Date().toDateString()
  const deliveredToday = orders.filter((o) => o.status === 'entregado' && new Date(o.history[o.history.length - 1]?.at ?? o.createdAt).toDateString() === today).length
  const noTracking = orders.filter((o) => o.status === 'enviado' && !o.tracking && o.carrierId !== 'recojo').length
  const low = allProducts.filter((p) => p.stock <= lowStock).sort((a, b) => a.stock - b.stock)

  const setCarrier = (id: string, patch: Partial<Carrier>) =>
    updateSettings((s) => ({ ...s, shipping: { ...s.shipping, carriers: s.shipping.carriers.map((c) => (c.id === id ? { ...c, ...patch } : c)) } }))
  const addCarrier = () =>
    updateSettings((s) => ({ ...s, shipping: { ...s.shipping, carriers: [...s.shipping.carriers, { id: `envio-${Date.now()}`, name: 'Nuevo método de envío', eta: '2 – 3 días', price: 25, active: true }] } }))
  const delCarrier = (id: string) => {
    if (carriers.length <= 1) return
    updateSettings((s) => ({ ...s, shipping: { ...s.shipping, carriers: s.shipping.carriers.filter((c) => c.id !== id) } }))
  }

  return (
    <>
      <PageHeader title="Logística" desc="Despacho de pedidos, tarifas de envío e inventario." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Por despachar" value={String((byCol.get('pendiente')?.length ?? 0) + (byCol.get('preparando')?.length ?? 0))} icon={<PackageCheck />} tone="purple" />
        <Stat label="En ruta" value={String(byCol.get('enviado')?.length ?? 0)} sub={noTracking ? `${noTracking} sin n.º de guía` : 'Todos con guía'} icon={<Truck />} tone="blue" />
        <Stat label="Entregados hoy" value={String(deliveredToday)} icon={<CheckCircle2 />} tone="green" />
        <Stat label="Envío gratis desde" value={money(shipping.freeFrom)} sub="Configurable abajo" icon={<Truck />} tone="yellow" />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((c) => {
          const items = (byCol.get(c.s) ?? []).slice(0, c.s === 'entregado' ? 6 : 50)
          return (
            <section key={c.s} className="rounded-xl bg-neutral-200/60 p-3">
              <header className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-sm font-bold text-neutral-700">{c.title}</h2>
                <Badge tone={statusMeta[c.s].tone}>{byCol.get(c.s)?.length ?? 0}</Badge>
              </header>
              <div className="max-h-[560px] space-y-3 overflow-y-auto pr-0.5">
                {items.length === 0 && <p className="py-6 text-center text-xs text-neutral-500">Sin pedidos</p>}
                {items.map((o) => (
                  <Card1 key={o.id} o={o} next={c.next} cta={c.cta} carrierName={carriers.find((x) => x.id === o.carrierId)?.name ?? o.carrierId} />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card
          title="Métodos y tarifas de envío"
          className="xl:col-span-2"
          pad={false}
          action={<button onClick={addCarrier} className="btn btn-outline !py-1.5 !text-xs"><Plus size={14} /> Agregar</button>}
        >
          <Table>
            <thead className="bg-neutral-50"><tr><TH>Método</TH><TH>Plazo</TH><TH>Tarifa (Bs.)</TH><TH>Activo</TH><TH /></tr></thead>
            <tbody className="divide-y divide-neutral-100">
              {carriers.map((c) => (
                <tr key={c.id}>
                  <TD><input className="input min-w-52" value={c.name} onChange={(e) => setCarrier(c.id, { name: e.target.value })} /></TD>
                  <TD><input className="input min-w-32" value={c.eta} onChange={(e) => setCarrier(c.id, { eta: e.target.value })} /></TD>
                  <TD><input className="input w-24" type="number" min={0} step="0.5" value={c.price} onChange={(e) => setCarrier(c.id, { price: Math.max(0, Number(e.target.value)) })} /></TD>
                  <TD><Toggle checked={c.active} onChange={(v) => setCarrier(c.id, { active: v })} label={`Activar ${c.name}`} /></TD>
                  <TD><button aria-label="Eliminar" disabled={carriers.length <= 1} onClick={() => delCarrier(c.id)} className="cursor-pointer text-neutral-400 hover:text-red-600 disabled:opacity-30"><Trash2 size={16} /></button></TD>
                </tr>
              ))}
            </tbody>
          </Table>
          <div className="flex flex-wrap items-center gap-3 border-t border-neutral-100 px-5 py-4 text-sm">
            <label className="font-medium" htmlFor="free">Envío gratis para compras desde (Bs.)</label>
            <input id="free" type="number" min={0} className="input w-28" value={shipping.freeFrom} onChange={(e) => updateSettings((s) => ({ ...s, shipping: { ...s.shipping, freeFrom: Math.max(0, Number(e.target.value)) } }))} />
            <span className="text-xs text-neutral-500">Se aplica al instante en el carrito de la tienda.</span>
          </div>
        </Card>

        <Card title={`Reposición de stock (≤ ${lowStock})`} pad={false}>
          {low.length === 0 ? <Empty>Sin productos con stock bajo.</Empty> : (
            <ul className="max-h-96 divide-y divide-neutral-100 overflow-y-auto text-sm">
              {low.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="min-w-0 flex-1"><span className="block truncate">{p.name}</span><Badge tone={p.stock === 0 ? 'red' : 'yellow'}>{p.stock === 0 ? 'Agotado' : `${p.stock} u.`}</Badge></span>
                  <button onClick={() => adjustStock(p.id, 10)} className="btn btn-outline !px-3 !py-1.5 !text-xs">+10</button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, MessageCircle, Printer, Search } from 'lucide-react'
import { money } from '../../lib'
import { orderStatuses, payMeta, payStatuses, statusMeta, updateOrder, useOrders, type Order, type OrderStatus, type PayStatus } from '../../store/orders'
import { payLabels, useSettings } from '../../store/settings'
import { Badge, Card, Empty, Field, Modal, PageHeader, TD, TH, Table, downloadCsv, fmtDate } from '../ui'

function OrderDetail({ order, onClose }: { order: Order; onClose: () => void }) {
  const { shipping, store } = useSettings()
  const [tracking, setTracking] = useState(order.tracking)
  const [notes, setNotes] = useState(order.notes)
  const carrier = shipping.carriers.find((c) => c.id === order.carrierId)

  useEffect(() => {
    setTracking(order.tracking)
    setNotes(order.notes)
  }, [order.id, order.tracking, order.notes])

  const setStatus = (status: OrderStatus) => updateOrder(order.id, { status }, `Estado: ${statusMeta[status].label}`)
  const setPay = (payStatus: PayStatus) => updateOrder(order.id, { payStatus }, `Pago: ${payMeta[payStatus].label}`)
  const msg = `Hola ${order.customer.name.split(' ')[0]}, te escribimos de ${store.name} sobre tu pedido #${order.id} (${money(order.total)}). Estado: ${statusMeta[order.status].label}.${order.tracking ? ` Guía: ${order.tracking}.` : ''}`
  const phone = order.customer.phone.replace(/\D/g, '')

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={`Pedido #${order.id}`}
      footer={
        <>
          <a href={`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer" className="btn btn-outline"><MessageCircle size={16} /> Avisar por WhatsApp</a>
          <button onClick={() => window.print()} className="btn btn-outline"><Printer size={16} /> Imprimir comprobante</button>
          <button
            onClick={() => {
              updateOrder(order.id, { tracking: tracking.trim(), notes }, tracking.trim() !== order.tracking ? `Guía asignada: ${tracking.trim() || '—'}` : 'Notas actualizadas')
            }}
            className="btn btn-primary"
          >
            Guardar guía y notas
          </button>
        </>
      }
    >
      <div id="print-area" className="space-y-6">
        <div className="hidden print:block">
          <h2 className="text-xl font-bold">{store.name} · Comprobante de pedido #{order.id}</h2>
          <p className="text-sm">{store.address} · {store.phone} · {store.email}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-1 text-sm">
            <h3 className="mb-1 font-semibold text-neutral-800">Cliente</h3>
            <p className="font-medium">{order.customer.name}</p>
            <p className="text-neutral-600">{order.customer.email}</p>
            <p className="text-neutral-600">{order.customer.phone}</p>
            <p className="text-neutral-600">{order.customer.address}</p>
            <p className="text-neutral-600">{order.customer.city}</p>
            <p className="pt-2 text-xs text-neutral-400">Creado: {fmtDate(order.createdAt, true)}{order.demo ? ' · pedido de demostración' : ''}</p>
          </div>
          <div className="grid gap-3 print:hidden">
            <Field label="Estado del pedido">
              <select className="input" value={order.status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
                {orderStatuses.map((s) => <option key={s} value={s}>{statusMeta[s].label}</option>)}
              </select>
            </Field>
            <Field label="Estado del pago" hint={`Método: ${payLabels[order.payMethod]}`}>
              <select className="input" value={order.payStatus} onChange={(e) => setPay(e.target.value as PayStatus)}>
                {payStatuses.map((s) => <option key={s} value={s}>{payMeta[s].label}</option>)}
              </select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Transportista">
                <select className="input" value={order.carrierId} onChange={(e) => updateOrder(order.id, { carrierId: e.target.value }, `Envío: ${shipping.carriers.find((c) => c.id === e.target.value)?.name}`)}>
                  {shipping.carriers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="N.º de guía / seguimiento">
                <input className="input" value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Ej. ENC-123456" />
              </Field>
            </div>
          </div>
          <div className="hidden text-sm print:block">
            <p>Estado: {statusMeta[order.status].label} · Pago: {payMeta[order.payStatus].label} ({payLabels[order.payMethod]})</p>
            <p>Envío: {carrier?.name} {order.tracking && `· Guía ${order.tracking}`}</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="bg-neutral-50"><tr><TH>Producto</TH><TH className="text-right">Precio</TH><TH className="text-right">Cant.</TH><TH className="text-right">Subtotal</TH></tr></thead>
            <tbody className="divide-y divide-neutral-100">
              {order.items.map((i) => (
                <tr key={i.id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      {i.image && <img src={i.image} alt="" className="h-10 w-10 rounded bg-neutral-100 object-contain" />}
                      <span>{i.name}</span>
                    </div>
                  </TD>
                  <TD className="text-right">{money(i.price)}</TD>
                  <TD className="text-right">{i.qty}</TD>
                  <TD className="text-right font-medium">{money(i.price * i.qty)}</TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
          {order.discount > 0 && <div className="flex justify-between text-green-700"><dt>Cupón {order.coupon}</dt><dd>-{money(order.discount)}</dd></div>}
          <div className="flex justify-between"><dt>Envío</dt><dd>{order.shipping ? money(order.shipping) : 'Gratis'}</dd></div>
          <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-bold"><dt>Total</dt><dd>{money(order.total)}</dd></div>
        </dl>

        <div className="grid gap-6 md:grid-cols-2 print:hidden">
          <Field label="Notas internas">
            <textarea className="input" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas visibles solo para el equipo…" />
          </Field>
          <div>
            <h3 className="mb-2 text-sm font-medium text-neutral-700">Historial</h3>
            <ol className="max-h-40 space-y-2 overflow-y-auto border-l-2 border-neutral-200 pl-4 text-sm">
              {[...order.history].reverse().map((h, i) => (
                <li key={i}><span className="block text-xs text-neutral-400">{fmtDate(h.at, true)}</span>{h.text}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default function Orders() {
  const orders = useOrders()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [tab, setTab] = useState<OrderStatus | 'todos'>('todos')
  const [pay, setPay] = useState<PayStatus | 'todos'>('todos')
  const openId = Number(params.get('ver')) || null
  const open = orders.find((o) => o.id === openId) ?? null

  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: orders.length }
    orderStatuses.forEach((s) => (c[s] = orders.filter((o) => o.status === s).length))
    return c
  }, [orders])

  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return orders.filter(
      (o) =>
        (tab === 'todos' || o.status === tab) &&
        (pay === 'todos' || o.payStatus === pay) &&
        (!t || String(o.id).includes(t) || o.customer.name.toLowerCase().includes(t) || o.customer.email.toLowerCase().includes(t) || o.tracking.toLowerCase().includes(t)),
    )
  }, [orders, q, tab, pay])

  const exportCsv = () =>
    downloadCsv('pedidos-domilux.csv', [
      ['Pedido', 'Fecha', 'Cliente', 'Correo', 'Teléfono', 'Ciudad', 'Subtotal', 'Envío', 'Descuento', 'Total', 'Método de pago', 'Estado de pago', 'Estado', 'Guía'],
      ...list.map((o) => [o.id, fmtDate(o.createdAt), o.customer.name, o.customer.email, o.customer.phone, o.customer.city, o.subtotal, o.shipping, o.discount, o.total, payLabels[o.payMethod], payMeta[o.payStatus].label, statusMeta[o.status].label, o.tracking]),
    ])

  const tabs: { k: OrderStatus | 'todos'; l: string }[] = [{ k: 'todos', l: 'Todos' }, ...orderStatuses.map((s) => ({ k: s, l: statusMeta[s].label }))]

  return (
    <>
      <PageHeader
        title="Pedidos"
        desc="Todos los pedidos de la tienda. Los del checkout aparecen aquí al instante."
        actions={<button onClick={exportCsv} className="btn btn-outline"><Download size={16} /> Exportar CSV</button>}
      />

      <Card pad={false}>
        <div className="flex flex-wrap gap-1 border-b border-neutral-100 p-3">
          {tabs.map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)} className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium ${tab === t.k ? 'bg-brand text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}>
              {t.l} <span className={`ml-1 text-xs ${tab === t.k ? 'text-white/70' : 'text-neutral-400'}`}>{counts[t.k]}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 border-b border-neutral-100 p-3">
          <div className="relative min-w-52 flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por n.º, cliente, correo o guía…" className="input pl-9" />
          </div>
          <select value={pay} onChange={(e) => setPay(e.target.value as PayStatus | 'todos')} className="input w-auto">
            <option value="todos">Todos los pagos</option>
            {payStatuses.map((s) => <option key={s} value={s}>{payMeta[s].label}</option>)}
          </select>
        </div>

        {list.length === 0 ? <Empty>No hay pedidos con esos filtros.</Empty> : (
          <Table>
            <thead className="bg-neutral-50"><tr><TH>Pedido</TH><TH>Fecha</TH><TH>Cliente</TH><TH>Pago</TH><TH>Estado</TH><TH className="text-right">Total</TH></tr></thead>
            <tbody className="divide-y divide-neutral-100">
              {list.map((o) => (
                <tr key={o.id} onClick={() => setParams({ ver: String(o.id) })} className="cursor-pointer hover:bg-neutral-50">
                  <TD className="font-semibold">#{o.id}</TD>
                  <TD className="text-neutral-500">{fmtDate(o.createdAt)}</TD>
                  <TD><p className="font-medium">{o.customer.name}</p><p className="text-xs text-neutral-400">{o.customer.city}</p></TD>
                  <TD><Badge tone={payMeta[o.payStatus].tone}>{payMeta[o.payStatus].label}</Badge><p className="mt-0.5 text-xs text-neutral-400">{payLabels[o.payMethod]}</p></TD>
                  <TD><Badge tone={statusMeta[o.status].tone}>{statusMeta[o.status].label}</Badge></TD>
                  <TD className="text-right font-semibold">{money(o.total)}</TD>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {open && <OrderDetail order={open} onClose={() => setParams({})} />}
    </>
  )
}

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Ban, CheckCircle2, Download, RotateCcw, Search } from 'lucide-react'
import { money } from '../../lib'
import { payMeta, payStatuses, updateOrder, useOrders, type PayStatus } from '../../store/orders'
import { payLabels, type PayMethod } from '../../store/settings'
import { Badge, Card, Empty, PageHeader, Stat, Table, TD, TH, downloadCsv, fmtDate } from '../ui'

export default function Payments() {
  const orders = useOrders()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<PayStatus | 'todos'>('todos')
  const [method, setMethod] = useState<PayMethod | 'todos'>('todos')

  const sums = useMemo(() => {
    const by = (s: PayStatus) => orders.filter((o) => o.payStatus === s)
    const sum = (l: typeof orders) => l.reduce((a, o) => a + o.total, 0)
    const paid = by('pagado')
    const methods = (Object.keys(payLabels) as PayMethod[]).map((m) => ({ m, total: sum(paid.filter((o) => o.payMethod === m)), n: paid.filter((o) => o.payMethod === m).length }))
    return { paid: sum(paid), paidN: paid.length, pending: sum(by('pendiente').filter((o) => o.status !== 'cancelado')), pendingN: by('pendiente').filter((o) => o.status !== 'cancelado').length, refunded: sum(by('reembolsado')), failed: sum(by('fallido')), failedN: by('fallido').length, methods }
  }, [orders])

  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return orders.filter((o) => (status === 'todos' || o.payStatus === status) && (method === 'todos' || o.payMethod === method) && (!t || String(o.id).includes(t) || o.customer.name.toLowerCase().includes(t)))
  }, [orders, q, status, method])

  const maxMethod = Math.max(1, ...sums.methods.map((m) => m.total))
  const set = (id: number, payStatus: PayStatus) => updateOrder(id, { payStatus }, `Pago: ${payMeta[payStatus].label}`)

  return (
    <>
      <PageHeader
        title="Transacciones"
        desc="Control de cobros, conciliación por método de pago y reembolsos."
        actions={
          <button
            onClick={() => downloadCsv('transacciones-domilux.csv', [['Pedido', 'Fecha', 'Cliente', 'Método', 'Estado del pago', 'Monto'], ...list.map((o) => [o.id, fmtDate(o.createdAt), o.customer.name, payLabels[o.payMethod], payMeta[o.payStatus].label, o.total])])}
            className="btn btn-outline"
          >
            <Download size={16} /> Exportar CSV
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Cobrado" value={money(sums.paid)} sub={`${sums.paidN} transacciones`} icon={<CheckCircle2 />} tone="green" />
        <Stat label="Por cobrar" value={money(sums.pending)} sub={`${sums.pendingN} pendientes`} icon={<RotateCcw />} tone="yellow" />
        <Stat label="Reembolsado" value={money(sums.refunded)} icon={<RotateCcw />} tone="gray" />
        <Stat label="Fallido" value={money(sums.failed)} sub={`${sums.failedN} intentos`} icon={<Ban />} tone="red" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Cobrado por método de pago">
          <ul className="space-y-4">
            {sums.methods.map(({ m, total, n }) => (
              <li key={m}>
                <div className="mb-1 flex justify-between text-sm"><span>{payLabels[m]} <span className="text-neutral-400">· {n}</span></span><b>{money(total)}</b></div>
                <div className="h-2.5 overflow-hidden rounded-full bg-neutral-100"><div className="h-full rounded-full bg-brand" style={{ width: `${(total / maxMethod) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </Card>

        <Card pad={false} className="xl:col-span-2">
          <div className="flex flex-wrap gap-3 border-b border-neutral-100 p-3">
            <div className="relative min-w-48 flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por pedido o cliente…" className="input pl-9" />
            </div>
            <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value as PayStatus | 'todos')}>
              <option value="todos">Todos los estados</option>
              {payStatuses.map((s) => <option key={s} value={s}>{payMeta[s].label}</option>)}
            </select>
            <select className="input w-auto" value={method} onChange={(e) => setMethod(e.target.value as PayMethod | 'todos')}>
              <option value="todos">Todos los métodos</option>
              {(Object.keys(payLabels) as PayMethod[]).map((m) => <option key={m} value={m}>{payLabels[m]}</option>)}
            </select>
          </div>
          {list.length === 0 ? <Empty>Sin transacciones con esos filtros.</Empty> : (
            <div className="max-h-[560px] overflow-y-auto">
              <Table>
                <thead className="sticky top-0 bg-neutral-50"><tr><TH>Pedido</TH><TH>Fecha</TH><TH>Cliente</TH><TH>Método</TH><TH>Estado</TH><TH className="text-right">Monto</TH><TH /></tr></thead>
                <tbody className="divide-y divide-neutral-100">
                  {list.map((o) => (
                    <tr key={o.id}>
                      <TD><Link to={`/admin/pedidos?ver=${o.id}`} className="font-semibold text-brand hover:underline">#{o.id}</Link></TD>
                      <TD className="text-neutral-500">{fmtDate(o.createdAt)}</TD>
                      <TD>{o.customer.name}</TD>
                      <TD className="text-neutral-600">{payLabels[o.payMethod]}</TD>
                      <TD><Badge tone={payMeta[o.payStatus].tone}>{payMeta[o.payStatus].label}</Badge></TD>
                      <TD className="text-right font-semibold">{money(o.total)}</TD>
                      <TD className="text-right">
                        {o.payStatus === 'pendiente' && <button onClick={() => set(o.id, 'pagado')} className="btn btn-outline !px-2.5 !py-1 !text-xs">Marcar pagado</button>}
                        {o.payStatus === 'pagado' && <button onClick={() => set(o.id, 'reembolsado')} className="btn !px-2.5 !py-1 !text-xs border border-neutral-300 text-neutral-600 hover:bg-neutral-100">Reembolsar</button>}
                        {o.payStatus === 'fallido' && <button onClick={() => set(o.id, 'pendiente')} className="btn btn-outline !px-2.5 !py-1 !text-xs">Reintentar</button>}
                      </TD>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </>
  )
}

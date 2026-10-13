import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, MessageCircle, Search } from 'lucide-react'
import { money } from '../../lib'
import { useOrders } from '../../store/orders'
import { Badge, Card, Empty, PageHeader, Table, TD, TH, downloadCsv, fmtDate } from '../ui'

export default function Customers() {
  const orders = useOrders()
  const [q, setQ] = useState('')

  const customers = useMemo(() => {
    const m = new Map<string, { name: string; email: string; phone: string; city: string; orders: number; spent: number; last: string; lastId: number }>()
    for (const o of orders) {
      if (o.status === 'cancelado') continue
      const key = o.customer.email.toLowerCase() || o.customer.phone
      const cur = m.get(key) ?? { name: o.customer.name, email: o.customer.email, phone: o.customer.phone, city: o.customer.city, orders: 0, spent: 0, last: o.createdAt, lastId: o.id }
      cur.orders++
      if (o.payStatus === 'pagado') cur.spent += o.total
      if (o.createdAt > cur.last) {
        cur.last = o.createdAt
        cur.lastId = o.id
      }
      m.set(key, cur)
    }
    return [...m.values()].sort((a, b) => b.spent - a.spent)
  }, [orders])

  const list = customers.filter((c) => !q.trim() || `${c.name} ${c.email} ${c.phone} ${c.city}`.toLowerCase().includes(q.trim().toLowerCase()))

  return (
    <>
      <PageHeader
        title="Clientes"
        desc="Se arma automáticamente a partir de los pedidos."
        actions={<button onClick={() => downloadCsv('clientes-domilux.csv', [['Nombre', 'Correo', 'Teléfono', 'Ciudad', 'Pedidos', 'Total comprado (Bs.)', 'Última compra'], ...list.map((c) => [c.name, c.email, c.phone, c.city, c.orders, c.spent, fmtDate(c.last)])])} className="btn btn-outline"><Download size={16} /> Exportar CSV</button>}
      />
      <Card pad={false}>
        <div className="border-b border-neutral-100 p-3">
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, correo, teléfono o ciudad…" className="input pl-9" />
          </div>
        </div>
        {list.length === 0 ? <Empty>No se encontraron clientes.</Empty> : (
          <Table>
            <thead className="bg-neutral-50"><tr><TH>Cliente</TH><TH>Contacto</TH><TH>Ciudad</TH><TH className="text-right">Pedidos</TH><TH className="text-right">Comprado</TH><TH>Última compra</TH><TH /></tr></thead>
            <tbody className="divide-y divide-neutral-100">
              {list.map((c) => (
                <tr key={c.email || c.phone}>
                  <TD><p className="font-medium">{c.name}</p>{c.orders >= 3 && <Badge tone="green">Frecuente</Badge>}</TD>
                  <TD className="text-neutral-600"><p>{c.email}</p><p className="text-xs">{c.phone}</p></TD>
                  <TD>{c.city}</TD>
                  <TD className="text-right">{c.orders}</TD>
                  <TD className="text-right font-semibold">{money(c.spent)}</TD>
                  <TD className="text-neutral-500"><Link to={`/admin/pedidos?ver=${c.lastId}`} className="hover:underline">{fmtDate(c.last)}</Link></TD>
                  <TD><a href={`https://wa.me/${c.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${c.name}`} className="text-green-700 hover:text-green-900"><MessageCircle size={18} /></a></TD>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  )
}

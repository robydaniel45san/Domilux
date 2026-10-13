import { useState, type FormEvent } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { money } from '../../lib'
import { couponStore, useCoupons, type Coupon } from '../../store/coupons'
import { Badge, Card, Empty, Field, Modal, PageHeader, Table, TD, TH, Toggle } from '../ui'

const blank: Coupon = { code: '', type: 'percent', value: 10, minSubtotal: 0, active: true, uses: 0 }

export default function Coupons() {
  const coupons = useCoupons()
  const [editing, setEditing] = useState<{ orig: string | null; data: Coupon } | null>(null)
  const [err, setErr] = useState('')

  const save = (e: FormEvent) => {
    e.preventDefault()
    if (!editing) return
    const d = { ...editing.data, code: editing.data.code.trim().toUpperCase() }
    if (!/^[A-Z0-9_-]{3,20}$/.test(d.code)) return setErr('El código debe tener 3–20 letras, números, guion o guion bajo.')
    if (d.type === 'percent' && (d.value <= 0 || d.value > 100)) return setErr('El porcentaje debe estar entre 1 y 100.')
    if (d.value <= 0) return setErr('El valor debe ser mayor que 0.')
    if (coupons.some((c) => c.code === d.code && c.code !== editing.orig)) return setErr('Ya existe un cupón con ese código.')
    couponStore.set((l) => (editing.orig ? l.map((c) => (c.code === editing.orig ? d : c)) : [d, ...l]))
    setEditing(null)
    setErr('')
  }

  const patch = (code: string, p: Partial<Coupon>) => couponStore.set((l) => l.map((c) => (c.code === code ? { ...c, ...p } : c)))

  return (
    <>
      <PageHeader
        title="Cupones"
        desc="Los cupones activos funcionan en el carrito de la tienda."
        actions={<button onClick={() => { setErr(''); setEditing({ orig: null, data: blank }) }} className="btn btn-primary"><Plus size={16} /> Nuevo cupón</button>}
      />
      <Card pad={false}>
        {coupons.length === 0 ? <Empty>Aún no hay cupones.</Empty> : (
          <Table>
            <thead className="bg-neutral-50"><tr><TH>Código</TH><TH>Descuento</TH><TH>Compra mínima</TH><TH>Usos</TH><TH>Estado</TH><TH /></tr></thead>
            <tbody className="divide-y divide-neutral-100">
              {coupons.map((c) => (
                <tr key={c.code}>
                  <TD><code className="rounded bg-neutral-100 px-2 py-1 font-bold">{c.code}</code></TD>
                  <TD>{c.type === 'percent' ? `${c.value}%` : money(c.value)}</TD>
                  <TD>{c.minSubtotal ? money(c.minSubtotal) : <span className="text-neutral-400">Sin mínimo</span>}</TD>
                  <TD>{c.uses}</TD>
                  <TD><div className="flex items-center gap-2"><Toggle checked={c.active} onChange={(v) => patch(c.code, { active: v })} label={`Activar ${c.code}`} /><Badge tone={c.active ? 'green' : 'gray'}>{c.active ? 'Activo' : 'Inactivo'}</Badge></div></TD>
                  <TD>
                    <div className="flex justify-end gap-3 text-neutral-400">
                      <button aria-label="Editar" onClick={() => { setErr(''); setEditing({ orig: c.code, data: c }) }} className="cursor-pointer hover:text-brand"><Pencil size={16} /></button>
                      <button aria-label="Eliminar" onClick={() => confirm(`¿Eliminar el cupón ${c.code}?`) && couponStore.set((l) => l.filter((x) => x.code !== c.code))} className="cursor-pointer hover:text-red-600"><Trash2 size={16} /></button>
                    </div>
                  </TD>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.orig ? `Editar ${editing.orig}` : 'Nuevo cupón'}
        footer={<><button type="button" onClick={() => setEditing(null)} className="btn btn-outline">Cancelar</button><button form="coupon-form" className="btn btn-primary">Guardar</button></>}
      >
        {editing && (
          <form id="coupon-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <Field label="Código *" className="sm:col-span-2"><input required className="input uppercase" value={editing.data.code} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, code: e.target.value } })} placeholder="DOMI10" /></Field>
            <Field label="Tipo">
              <select className="input" value={editing.data.type} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, type: e.target.value as Coupon['type'] } })}>
                <option value="percent">Porcentaje (%)</option>
                <option value="fixed">Monto fijo (Bs.)</option>
              </select>
            </Field>
            <Field label={editing.data.type === 'percent' ? 'Porcentaje' : 'Monto (Bs.)'}><input type="number" min={1} className="input" value={editing.data.value} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, value: Number(e.target.value) } })} /></Field>
            <Field label="Compra mínima (Bs.)" hint="0 = sin mínimo"><input type="number" min={0} className="input" value={editing.data.minSubtotal} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, minSubtotal: Number(e.target.value) } })} /></Field>
            <div className="flex items-center gap-3 self-end pb-2"><Toggle checked={editing.data.active} onChange={(v) => setEditing({ ...editing, data: { ...editing.data, active: v } })} label="Activo" /><span className="text-sm">Activo</span></div>
            {err && <p className="text-sm text-red-600 sm:col-span-2">{err}</p>}
          </form>
        )}
      </Modal>
    </>
  )
}

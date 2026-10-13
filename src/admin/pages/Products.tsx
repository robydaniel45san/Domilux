import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Copy, Download, Percent, Plus, Search, Trash2 } from 'lucide-react'
import { allProducts, categories, createProduct, duplicateProduct, isOnSale, removeProduct, saveProduct, useCatalog } from '../../data/products'
import { money } from '../../lib'
import { useSettings } from '../../store/settings'
import type { Product } from '../../types'
import { Badge, Card, Empty, Field, Modal, PageHeader, Table, TD, TH, Toggle, downloadCsv } from '../ui'

/** Input numérico que confirma el cambio al salir del campo o con Enter. */
function NumInput({ value, onCommit, step = 1, width = 'w-24', min = 0 }: { value: number; onCommit: (n: number) => void; step?: number; width?: string; min?: number }) {
  const [v, setV] = useState(String(value))
  useEffect(() => setV(String(value)), [value])
  const commit = () => {
    const n = Number(v)
    if (!Number.isFinite(n) || n < min) return setV(String(value))
    if (n !== value) onCommit(n)
  }
  return <input type="number" min={min} step={step} value={v} onChange={(e) => setV(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} className={`input ${width}`} />
}

type Draft = { name: string; category: string; sku: string; price: string; regularPrice: string; stock: string; color: string; tomas: string; brand: string; image: string; features: string; active: boolean }
const emptyDraft: Draft = { name: '', category: 'Domotica', sku: '', price: '', regularPrice: '', stock: '10', color: '', tomas: '', brand: '', image: '', features: '', active: true }
const toDraft = (p: Product): Draft => ({ name: p.name, category: p.category, sku: p.sku, price: String(p.price), regularPrice: String(p.regularPrice), stock: String(p.stock), color: p.color ?? '', tomas: p.tomas ?? '', brand: p.brand ?? '', image: p.images[0] ?? '', features: (p.features.length ? p.features : p.bullets).join('\n'), active: p.active !== false })

function ProductForm({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const [d, setD] = useState<Draft>(product ? toDraft(product) : emptyDraft)
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const price = Number(d.price)
    const regular = d.regularPrice === '' ? price : Number(d.regularPrice)
    const common = {
      name: d.name.trim(),
      category: d.category.trim() || 'Domotica',
      sku: d.sku.trim(),
      price,
      regularPrice: Math.max(regular, price),
      onSale: isOnSale(price, Math.max(regular, price)),
      stock: Math.max(0, Math.floor(Number(d.stock) || 0)),
      color: d.color.trim() || null,
      tomas: d.tomas.trim() || null,
      brand: d.brand.trim() || null,
      features: d.features.split('\n').map((s) => s.trim()).filter(Boolean),
      active: d.active,
    }
    if (product) {
      const images = d.image.trim() ? [d.image.trim(), ...product.images.filter((i) => i !== product.images[0])] : product.images
      saveProduct(product.id, { ...common, images })
    } else createProduct({ ...common, images: d.image.trim() ? [d.image.trim()] : [] })
    onClose()
  }

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={product ? 'Editar producto' : 'Nuevo producto'}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-outline">Cancelar</button>
          <button form="product-form" className="btn btn-primary">{product ? 'Guardar cambios' : 'Crear producto'}</button>
        </>
      }
    >
      <form id="product-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre *" className="sm:col-span-2"><input required className="input" value={d.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Precio de venta (Bs.) *"><input required type="number" min={0} step="0.5" className="input" value={d.price} onChange={(e) => set('price', e.target.value)} /></Field>
        <Field label="Precio normal (Bs.)" hint="Si el precio de venta es menor, el producto aparece en oferta."><input type="number" min={0} step="0.5" className="input" value={d.regularPrice} onChange={(e) => set('regularPrice', e.target.value)} /></Field>
        <Field label="Stock"><input type="number" min={0} className="input" value={d.stock} onChange={(e) => set('stock', e.target.value)} /></Field>
        <Field label="SKU"><input className="input" value={d.sku} onChange={(e) => set('sku', e.target.value)} /></Field>
        <Field label="Categoría"><input list="cats" className="input" value={d.category} onChange={(e) => set('category', e.target.value)} /><datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist></Field>
        <Field label="Marca"><input className="input" value={d.brand} onChange={(e) => set('brand', e.target.value)} /></Field>
        <Field label="Color"><input className="input" value={d.color} onChange={(e) => set('color', e.target.value)} placeholder="Blanco, Negro, Gris…" /></Field>
        <Field label="Tomas"><input className="input" value={d.tomas} onChange={(e) => set('tomas', e.target.value)} placeholder="1 Toma, 2 Tomas…" /></Field>
        <Field label="Imagen principal (URL)" className="sm:col-span-2"><input type="url" className="input" value={d.image} onChange={(e) => set('image', e.target.value)} placeholder="https://…" /></Field>
        <Field label="Características (una por línea)" className="sm:col-span-2"><textarea rows={5} className="input" value={d.features} onChange={(e) => set('features', e.target.value)} /></Field>
        <div className="flex items-center gap-3 sm:col-span-2">
          <Toggle checked={d.active} onChange={(v) => set('active', v)} label="Visible en la tienda" />
          <span className="text-sm">{d.active ? 'Visible en la tienda' : 'Oculto (borrador)'}</span>
        </div>
      </form>
    </Modal>
  )
}

export default function Products() {
  const catalog = useCatalog()
  const { lowStock } = useSettings()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [filter, setFilter] = useState<'todos' | 'activos' | 'ocultos' | 'bajo' | 'oferta'>('todos')
  const [editing, setEditing] = useState<Product | 'new' | null>(null)
  const [bulk, setBulk] = useState(false)
  const [pct, setPct] = useState('10')

  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return allProducts.filter(
      (p) =>
        (!t || p.name.toLowerCase().includes(t) || p.sku.toLowerCase().includes(t)) &&
        (!cat || p.category === cat) &&
        (filter === 'todos' || (filter === 'activos' && p.active !== false) || (filter === 'ocultos' && p.active === false) || (filter === 'bajo' && p.stock <= lowStock) || (filter === 'oferta' && p.onSale)),
    )
  }, [q, cat, filter, lowStock, catalog])

  const setPrice = (p: Product, price: number) => saveProduct(p.id, { price, regularPrice: Math.max(p.regularPrice, price), onSale: isOnSale(price, Math.max(p.regularPrice, price)) })
  const setRegular = (p: Product, regular: number) => saveProduct(p.id, { regularPrice: Math.max(regular, p.price), onSale: isOnSale(p.price, Math.max(regular, p.price)) })

  const applyBulk = () => {
    const f = 1 + Number(pct) / 100
    if (!Number.isFinite(f) || f <= 0) return
    list.forEach((p) => {
      const price = Math.round(p.price * f * 2) / 2
      saveProduct(p.id, { price, regularPrice: Math.max(p.regularPrice, price), onSale: isOnSale(price, Math.max(p.regularPrice, price)) })
    })
    setBulk(false)
  }

  const filters: { k: typeof filter; l: string }[] = [{ k: 'todos', l: 'Todos' }, { k: 'activos', l: 'Visibles' }, { k: 'ocultos', l: 'Ocultos' }, { k: 'oferta', l: 'En oferta' }, { k: 'bajo', l: 'Stock bajo' }]

  return (
    <>
      <PageHeader
        title="Productos y precios"
        desc="Los cambios de precio, stock y visibilidad se reflejan al instante en la tienda."
        actions={
          <>
            <button onClick={() => downloadCsv('productos-domilux.csv', [['ID', 'SKU', 'Nombre', 'Categoría', 'Precio', 'Precio normal', 'Stock', 'Visible'], ...list.map((p) => [p.id, p.sku, p.name, p.category, p.price, p.regularPrice, p.stock, p.active === false ? 'No' : 'Sí'])])} className="btn btn-outline"><Download size={16} /> CSV</button>
            <button onClick={() => setBulk(true)} className="btn btn-outline"><Percent size={16} /> Ajustar precios</button>
            <button onClick={() => setEditing('new')} className="btn btn-primary"><Plus size={16} /> Nuevo producto</button>
          </>
        }
      />

      <Card pad={false}>
        <div className="flex flex-wrap gap-1 border-b border-neutral-100 p-3">
          {filters.map((f) => (
            <button key={f.k} onClick={() => setFilter(f.k)} className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium ${filter === f.k ? 'bg-brand text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}>{f.l}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 border-b border-neutral-100 p-3">
          <div className="relative min-w-52 flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o SKU…" className="input pl-9" />
          </div>
          <select className="input w-auto" value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">Todas las categorías</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        {list.length === 0 ? <Empty>No hay productos con esos filtros.</Empty> : (
          <Table>
            <thead className="bg-neutral-50"><tr><TH>Producto</TH><TH>Precio venta</TH><TH>Precio normal</TH><TH>Stock</TH><TH>Visible</TH><TH /></tr></thead>
            <tbody className="divide-y divide-neutral-100">
              {list.map((p) => (
                <tr key={p.id} className={p.active === false ? 'bg-neutral-50/70' : ''}>
                  <TD>
                    <button onClick={() => setEditing(p)} className="flex cursor-pointer items-center gap-3 text-left">
                      <img src={p.images[0]} alt="" className="h-12 w-12 shrink-0 rounded bg-neutral-100 object-contain" />
                      <span className="min-w-0">
                        <span className="block max-w-xs truncate font-medium hover:text-brand">{p.name}</span>
                        <span className="text-xs text-neutral-400">{p.sku || 'Sin SKU'} · {p.category}</span>
                        {p.onSale && <Badge tone="red">Oferta</Badge>}
                      </span>
                    </button>
                  </TD>
                  <TD><NumInput value={p.price} step={0.5} onCommit={(n) => setPrice(p, n)} /></TD>
                  <TD><NumInput value={p.regularPrice} step={0.5} onCommit={(n) => setRegular(p, n)} /></TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <NumInput value={p.stock} width="w-20" onCommit={(n) => saveProduct(p.id, { stock: Math.floor(n) })} />
                      {p.stock === 0 ? <Badge tone="red">Agotado</Badge> : p.stock <= lowStock ? <Badge tone="yellow">Bajo</Badge> : null}
                    </div>
                  </TD>
                  <TD><Toggle checked={p.active !== false} onChange={(v) => saveProduct(p.id, { active: v })} label={`Visible: ${p.name}`} /></TD>
                  <TD>
                    <div className="flex justify-end gap-3 text-neutral-400">
                      <button aria-label="Duplicar" title="Duplicar" onClick={() => duplicateProduct(p.id)} className="cursor-pointer hover:text-brand"><Copy size={16} /></button>
                      <button aria-label="Eliminar" title="Eliminar" onClick={() => confirm(`¿Eliminar "${p.name}"? Esta acción se puede revertir desde Configuración → Restablecer catálogo.`) && removeProduct(p.id)} className="cursor-pointer hover:text-red-600"><Trash2 size={16} /></button>
                    </div>
                  </TD>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <p className="border-t border-neutral-100 px-5 py-3 text-xs text-neutral-500">{list.length} de {allProducts.length} productos · Precio mostrado: <b>{money(list.reduce((s, p) => s + p.price, 0) / Math.max(1, list.length))}</b> en promedio</p>
      </Card>

      {editing && <ProductForm key={editing === 'new' ? 'new' : editing.id} product={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}

      <Modal open={bulk} onClose={() => setBulk(false)} title="Ajuste masivo de precios" footer={<><button onClick={() => setBulk(false)} className="btn btn-outline">Cancelar</button><button onClick={applyBulk} className="btn btn-primary">Aplicar a {list.length} productos</button></>}>
        <p className="mb-3 text-sm text-neutral-600">Sube o baja el precio de venta de los <b>{list.length}</b> productos que ves ahora (según filtros). Usa un valor negativo para descontar. Se redondea a 0,50.</p>
        <Field label="Porcentaje (%)"><input type="number" step="1" className="input" value={pct} onChange={(e) => setPct(e.target.value)} /></Field>
      </Modal>
    </>
  )
}

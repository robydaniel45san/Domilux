import { Minus, Plus, Trash2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { getProductById } from '../data/products'
import { money } from '../lib'

export function QtyControl({ qty, onChange }: { qty: number; onChange: (n: number) => void }) {
  return (
    <div className="inline-flex items-center rounded border border-neutral-300">
      <button aria-label="Menos" onClick={() => onChange(qty - 1)} className="p-2 cursor-pointer"><Minus size={14} /></button>
      <span className="w-8 text-center text-sm font-semibold">{qty}</span>
      <button aria-label="Más" onClick={() => onChange(qty + 1)} className="p-2 cursor-pointer"><Plus size={14} /></button>
    </div>
  )
}

export default function MiniCart() {
  const { drawer, openDrawer, cart, setQty, removeFromCart, subtotal } = useStore()
  if (drawer !== 'cart') return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => openDrawer(null)}>
      <aside className="flex h-full w-full max-w-sm flex-col bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-neutral-200 p-4">
          <h2 className="font-bold">Carrito de Compra</h2>
          <button aria-label="Cerrar" onClick={() => openDrawer(null)} className="cursor-pointer"><X size={20} /></button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {cart.length === 0 && <p className="text-neutral-500">Su carrito está vacío.</p>}
          {cart.map((i) => {
            const p = getProductById(i.id)
            if (!p) return null
            return (
              <div key={i.id} className="flex gap-3">
                <img src={p.images[0]} alt="" className="h-16 w-16 rounded bg-surface object-contain" />
                <div className="flex-1">
                  <p className="line-clamp-2 text-sm font-semibold">{p.name}</p>
                  <p className="text-sm text-brand">{i.qty} × {money(p.price)}</p>
                  <QtyControl qty={i.qty} onChange={(n) => setQty(i.id, n)} />
                </div>
                <button aria-label="Quitar" onClick={() => removeFromCart(i.id)} className="self-start text-neutral-400 hover:text-red-500 cursor-pointer"><Trash2 size={16} /></button>
              </div>
            )
          })}
        </div>
        <div className="space-y-2 border-t border-neutral-200 p-4">
          <div className="flex justify-between font-bold"><span>Subtotal:</span><span>{money(subtotal)}</span></div>
          <Link to="/carrito-compra" onClick={() => openDrawer(null)} className="btn btn-outline w-full">Ver carrito</Link>
          {cart.length > 0 && <Link to="/checkout" onClick={() => openDrawer(null)} className="btn btn-accent w-full">Finalizar compra</Link>}
          <button onClick={() => openDrawer(null)} className="w-full text-sm text-neutral-500 cursor-pointer">Continuar con la compra</button>
        </div>
      </aside>
    </div>
  )
}

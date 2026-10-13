import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { PageTitle } from '../components/PageTitle'
import { QtyControl } from '../components/MiniCart'
import ProductCard from '../components/ProductCard'
import { useStore } from '../context/StoreContext'
import { getProductById, products } from '../data/products'
import { FREE_SHIPPING_FROM, money } from '../lib'

export default function Cart() {
  const { cart, setQty, removeFromCart, subtotal, shipping, total } = useStore()
  const [coupon, setCoupon] = useState('')
  const [couponMsg, setCouponMsg] = useState('')

  if (cart.length === 0)
    return (
      <>
        <PageTitle title="Carrito de Compra" />
        <div className="container-x py-10">
          <div className="border-t-4 border-brand bg-surface p-5 text-sm">Tu carrito está vacío.</div>
          <Link to="/tienda" className="btn btn-outline mt-5">Volver a la tienda</Link>
          <h2 className="mb-4 mt-12 text-lg font-bold">Quizá te interese</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {products.filter((p) => p.onSale).slice(0, 4).map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </div>
      </>
    )

  const missing = Math.max(0, FREE_SHIPPING_FROM - subtotal)

  return (
    <>
      <PageTitle title="Carrito de Compra" />
      <div className="container-x grid gap-8 py-10 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-4 rounded bg-surface p-4 text-sm">
            {missing > 0 ? <>Agrega <b>{money(missing)}</b> más para obtener envío gratis.</> : <b className="text-green-700">¡Tienes envío gratis!</b>}
            <div className="mt-2 h-2 rounded bg-neutral-200">
              <div className="h-2 rounded bg-accent" style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_FROM) * 100)}%` }} />
            </div>
          </div>
          <div className="divide-y divide-neutral-200 rounded-lg border border-neutral-200">
            {cart.map((i) => {
              const p = getProductById(i.id)
              if (!p) return null
              return (
                <div key={i.id} className="flex flex-wrap items-center gap-4 p-4">
                  <img src={p.images[0]} alt="" className="h-20 w-20 rounded bg-surface object-contain" />
                  <div className="min-w-48 flex-1">
                    <Link to={`/producto/${p.slug}`} className="font-semibold hover:text-brand">{p.name}</Link>
                    <p className="text-xs text-neutral-500">{[p.color, p.tomas].filter(Boolean).join(' · ')}</p>
                    <p className="text-sm text-brand">{money(p.price)}</p>
                  </div>
                  <QtyControl qty={i.qty} onChange={(n) => setQty(i.id, n)} />
                  <p className="w-24 text-right font-bold">{money(p.price * i.qty)}</p>
                  <button aria-label="Quitar" onClick={() => removeFromCart(i.id)} className="cursor-pointer text-neutral-400 hover:text-red-500"><Trash2 size={18} /></button>
                </div>
              )
            })}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); setCouponMsg(coupon ? 'El cupón no es válido (mockup).' : '') }}
            className="mt-4 flex max-w-sm gap-2"
          >
            <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Código de cupón" className="input" />
            <button className="btn btn-outline">Aplicar</button>
          </form>
          {couponMsg && <p className="mt-2 text-sm text-red-600">{couponMsg}</p>}
          <Link to="/tienda" className="mt-6 inline-block text-sm text-brand underline">← Continuar con la compra</Link>
        </div>

        <aside className="h-fit rounded-lg border border-neutral-200 p-5">
          <h2 className="mb-4 font-bold uppercase">Totales del carrito</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Envío</dt><dd>{shipping === 0 ? 'Gratis' : money(shipping)}</dd></div>
            <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-bold"><dt>Total</dt><dd>{money(total)}</dd></div>
          </dl>
          <Link to="/checkout" className="btn btn-accent mt-5 w-full">Finalizar compra</Link>
        </aside>
      </div>
    </>
  )
}

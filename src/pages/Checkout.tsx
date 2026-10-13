import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { PageTitle } from '../components/PageTitle'
import { useStore } from '../context/StoreContext'
import { getProductById } from '../data/products'
import { money } from '../lib'

export default function Checkout() {
  const { cart, subtotal, shipping, total, clearCart, user } = useStore()
  const [done, setDone] = useState<string | null>(null)
  const [pay, setPay] = useState('qr')

  if (done)
    return (
      <div className="container-x py-20 text-center">
        <CheckCircle className="mx-auto text-green-600" size={64} />
        <h1 className="mt-4 text-2xl font-bold text-brand">¡Gracias por tu compra!</h1>
        <p className="mt-2 text-neutral-600">Pedido <b>#{done}</b> recibido. Te contactaremos por WhatsApp para coordinar la entrega.</p>
        <p className="mt-1 text-xs text-neutral-400">Mockup: no se realizó ningún cobro.</p>
        <Link to="/tienda" className="btn btn-primary mt-6">Seguir comprando</Link>
      </div>
    )

  if (cart.length === 0)
    return (
      <>
        <PageTitle title="Finalizar compra" />
        <div className="container-x py-10">
          <p>Tu carrito está vacío.</p>
          <Link to="/tienda" className="btn btn-outline mt-4">Volver a la tienda</Link>
        </div>
      </>
    )

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setDone(String(Math.floor(10000 + Math.random() * 90000)))
    clearCart()
  }

  return (
    <>
      <PageTitle title="Finalizar compra" />
      <form onSubmit={submit} className="container-x grid gap-8 py-10 lg:grid-cols-[1fr_400px]">
        <div className="space-y-4">
          <h2 className="font-bold uppercase">Detalles de facturación</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input required placeholder="Nombre" defaultValue={user?.name} className="input" />
            <input required placeholder="Apellidos" className="input" />
            <input required type="email" placeholder="Correo electrónico" defaultValue={user?.email} className="input sm:col-span-2" />
            <input required type="tel" placeholder="Teléfono / WhatsApp" className="input sm:col-span-2" />
            <input required placeholder="Dirección" className="input sm:col-span-2" />
            <input required placeholder="Ciudad" defaultValue="Santa Cruz de la Sierra" className="input" />
            <input placeholder="Zona / Barrio" className="input" />
          </div>
          <textarea placeholder="Notas del pedido" rows={3} className="input" />
        </div>
        <aside className="h-fit space-y-4 rounded-lg border border-neutral-200 p-5">
          <h2 className="font-bold uppercase">Tu pedido</h2>
          <ul className="divide-y divide-neutral-100 text-sm">
            {cart.map((i) => {
              const p = getProductById(i.id)
              return (
                p && (
                  <li key={i.id} className="flex justify-between gap-3 py-2">
                    <span>{p.name} × {i.qty}</span>
                    <span className="shrink-0">{money(p.price * i.qty)}</span>
                  </li>
                )
              )
            })}
          </ul>
          <div className="space-y-1 border-t border-neutral-200 pt-3 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>
            <div className="flex justify-between"><span>Envío</span><span>{shipping ? money(shipping) : 'Gratis'}</span></div>
            <div className="flex justify-between text-base font-bold"><span>Total</span><span>{money(total)}</span></div>
          </div>
          <div className="space-y-2 text-sm">
            {[['qr', 'Transferencia / QR'], ['cash', 'Pago contra entrega'], ['store', 'Recoger en tienda']].map(([v, l]) => (
              <label key={v} className="flex items-center gap-2">
                <input type="radio" name="pay" checked={pay === v} onChange={() => setPay(v)} /> {l}
              </label>
            ))}
          </div>
          <button className="btn btn-accent w-full">Realizar el pedido</button>
        </aside>
      </form>
    </>
  )
}

import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { PageTitle } from '../components/PageTitle'
import { useStore } from '../context/StoreContext'
import { getProductById } from '../data/products'
import { money } from '../lib'
import { payLabels, useSettings, type PayMethod } from '../store/settings'

export default function Checkout() {
  const { cart, subtotal, discount, shipping, total, user, placeOrder, carrierId, setCarrierId, couponCode } = useStore()
  const { shipping: shipCfg, payments, store } = useSettings()
  const [done, setDone] = useState<number | null>(null)
  const methods = (Object.keys(payLabels) as PayMethod[]).filter((m) => payments[m])
  const [pay, setPay] = useState<PayMethod>(methods[0] ?? 'qr')
  const carriers = shipCfg.carriers.filter((c) => c.active)

  if (done)
    return (
      <div className="container-x py-20 text-center">
        <CheckCircle className="mx-auto text-green-600" size={64} />
        <h1 className="mt-4 text-2xl font-bold text-brand">¡Gracias por tu compra!</h1>
        <p className="mt-2 text-neutral-600">Pedido <b>#{done}</b> recibido. Te contactaremos por WhatsApp para coordinar la entrega.</p>
        <p className="mt-1 text-xs text-neutral-400">Mockup: no se realizó ningún cobro. El pedido ya aparece en el panel administrativo.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/tienda" className="btn btn-primary">Seguir comprando</Link>
          <a href={`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(`Hola, hice el pedido #${done} en Domilux`)}`} target="_blank" rel="noreferrer" className="btn btn-outline">Escribir por WhatsApp</a>
        </div>
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

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const g = (k: string) => String(f.get(k) ?? '').trim()
    const order = placeOrder({
      customer: {
        name: `${g('first')} ${g('last')}`.trim(),
        email: g('email'),
        phone: g('phone'),
        address: [g('address'), g('zone')].filter(Boolean).join(', '),
        city: g('city'),
      },
      payMethod: pay,
      notes: g('notes'),
    })
    setDone(order.id)
  }

  return (
    <>
      <PageTitle title="Finalizar compra" />
      <form onSubmit={submit} className="container-x grid gap-8 py-10 lg:grid-cols-[1fr_400px]">
        <div className="space-y-4">
          <h2 className="font-bold uppercase">Detalles de facturación</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="first" required placeholder="Nombre" defaultValue={user?.name} className="input" />
            <input name="last" required placeholder="Apellidos" className="input" />
            <input name="email" required type="email" placeholder="Correo electrónico" defaultValue={user?.email} className="input sm:col-span-2" />
            <input name="phone" required type="tel" placeholder="Teléfono / WhatsApp" className="input sm:col-span-2" />
            <input name="address" required placeholder="Dirección" className="input sm:col-span-2" />
            <input name="city" required placeholder="Ciudad" defaultValue="Santa Cruz de la Sierra" className="input" />
            <input name="zone" placeholder="Zona / Barrio" className="input" />
          </div>
          <textarea name="notes" placeholder="Notas del pedido" rows={3} className="input" />
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
          <div className="space-y-2 border-t border-neutral-200 pt-3 text-sm">
            <p className="font-semibold">Envío</p>
            {carriers.map((c) => (
              <label key={c.id} className="flex cursor-pointer items-start gap-2">
                <input type="radio" name="carrier" className="mt-1" checked={carrierId === c.id} onChange={() => setCarrierId(c.id)} />
                <span>{c.name} <span className="text-neutral-500">· {c.eta}</span></span>
              </label>
            ))}
          </div>
          <div className="space-y-1 border-t border-neutral-200 pt-3 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-green-700"><span>Cupón {couponCode}</span><span>-{money(discount)}</span></div>}
            <div className="flex justify-between"><span>Envío</span><span>{shipping ? money(shipping) : 'Gratis'}</span></div>
            <div className="flex justify-between text-base font-bold"><span>Total</span><span>{money(total)}</span></div>
          </div>
          <div className="space-y-2 text-sm">
            {methods.length === 0 && <p className="text-red-600">No hay métodos de pago habilitados.</p>}
            {methods.map((v) => (
              <label key={v} className="flex items-center gap-2">
                <input type="radio" name="pay" checked={pay === v} onChange={() => setPay(v)} /> {payLabels[v]}
              </label>
            ))}
          </div>
          <button className="btn btn-accent w-full" disabled={methods.length === 0}>Realizar el pedido</button>
        </aside>
      </form>
    </>
  )
}

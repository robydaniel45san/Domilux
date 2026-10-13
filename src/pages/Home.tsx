import { Link } from 'react-router-dom'
import { Mic, ShieldCheck, Smartphone, Truck } from 'lucide-react'
import HeroSlider from '../components/HeroSlider'
import ProductCard from '../components/ProductCard'
import { products } from '../data/products'

const perks = [
  { icon: Smartphone, t: 'Control por app', d: 'Compatible con Smart Life y Tuya' },
  { icon: Mic, t: 'Asistentes de voz', d: 'Alexa y Google Assistant' },
  { icon: ShieldCheck, t: 'Vidrio templado', d: 'Resistentes al agua' },
  { icon: Truck, t: 'Envíos', d: 'Santa Cruz de la Sierra y todo el país' },
]

function Section({ title, to, items }: { title: string; to: string; items: typeof products }) {
  return (
    <section className="container-x mt-12">
      <div className="mb-4 flex items-end justify-between border-b border-neutral-200 pb-2">
        <h2 className="text-xl font-bold text-brand">{title}</h2>
        <Link to={to} className="text-sm text-brand underline">Ver todo</Link>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
    </section>
  )
}

export default function Home() {
  const offers = products.filter((p) => p.onSale)
  return (
    <>
      <HeroSlider />

      <div className="container-x mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {perks.map(({ icon: Icon, t, d }) => (
          <div key={t} className="flex items-center gap-3 rounded-lg border border-neutral-200 p-4">
            <Icon className="text-brand" size={28} />
            <div><p className="text-sm font-bold">{t}</p><p className="text-xs text-neutral-500">{d}</p></div>
          </div>
        ))}
      </div>

      <Section title="Productos en oferta" to="/ofertas" items={offers.slice(0, 4)} />
      <Section title="Productos más vendidos" to="/tienda" items={products.filter((p) => p.name.includes('Mini')).slice(0, 4)} />
      <Section title="Recomendado para ti" to="/tienda" items={products.slice(0, 8)} />

      <section className="container-x mt-12">
        <h2 className="mb-4 border-b border-neutral-200 pb-2 text-xl font-bold text-brand">Categorías destacadas</h2>
        <Link to="/tienda?cat=Domotica" className="flex items-center justify-between rounded-lg bg-surface p-6 hover:shadow">
          <div><p className="text-lg font-bold">Domótica</p><p className="text-sm text-neutral-500">{products.length} elementos</p></div>
          <span className="btn btn-primary">Explorar</span>
        </Link>
      </section>
    </>
  )
}

import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageTitle } from '../components/PageTitle'
import ProductCard from '../components/ProductCard'
import { categories, colors, products } from '../data/products'
import { colorHex, money } from '../lib'

export default function Shop({ onlyOffers = false }: { onlyOffers?: boolean }) {
  const [params] = useSearchParams()
  const [color, setColor] = useState('')
  const [tomas, setTomas] = useState('')
  const [max, setMax] = useState(1200)
  const [sort, setSort] = useState('default')
  const q = (params.get('q') ?? '').toLowerCase()
  const cat = params.get('cat') ?? ''

  const list = useMemo(() => {
    const l = products.filter(
      (p) =>
        (!onlyOffers || p.onSale) &&
        (!q || p.name.toLowerCase().includes(q)) &&
        (!cat || p.category === cat) &&
        (!color || p.color === color) &&
        (!tomas || p.tomas?.toLowerCase().startsWith(tomas)) &&
        p.price <= max,
    )
    if (sort === 'asc') l.sort((a, b) => a.price - b.price)
    if (sort === 'desc') l.sort((a, b) => b.price - a.price)
    return l
  }, [q, cat, color, tomas, max, sort, onlyOffers])

  return (
    <>
      <PageTitle title={onlyOffers ? 'Ofertas' : 'Tienda'} />
      <div className="container-x grid gap-8 py-10 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-6 text-sm">
          <div>
            <h3 className="mb-2 font-bold uppercase">Categorías</h3>
            <p>{categories[0]} <span className="text-neutral-400">({products.length})</span></p>
          </div>
          <div>
            <h3 className="mb-2 font-bold uppercase">Color</h3>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  title={c}
                  aria-label={c}
                  onClick={() => setColor(color === c ? '' : c)}
                  className={`h-7 w-7 cursor-pointer rounded-full border ${color === c ? 'ring-2 ring-brand ring-offset-2' : 'border-neutral-300'}`}
                  style={{ background: colorHex[c] }}
                />
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 font-bold uppercase">Tomas</h3>
            <div className="flex gap-2">
              {['1', '2', '3'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTomas(tomas === t ? '' : t)}
                  className={`cursor-pointer rounded border px-3 py-1 ${tomas === t ? 'border-brand bg-brand text-white' : 'border-neutral-300'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 font-bold uppercase">Precio máximo</h3>
            <input type="range" min={30} max={1200} step={10} value={max} onChange={(e) => setMax(+e.target.value)} className="w-full accent-brand" />
            <p>Hasta {money(max)}</p>
          </div>
        </aside>
        <section>
          <div className="mb-4 flex items-center justify-between text-sm">
            <p>{list.length} productos{q && <> para “{q}”</>}</p>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded border border-neutral-300 px-2 py-1.5">
              <option value="default">Orden predeterminado</option>
              <option value="asc">Precio: menor a mayor</option>
              <option value="desc">Precio: mayor a menor</option>
            </select>
          </div>
          {list.length === 0 ? (
            <p className="py-10 text-neutral-500">No se encontraron productos.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>
          )}
        </section>
      </div>
    </>
  )
}

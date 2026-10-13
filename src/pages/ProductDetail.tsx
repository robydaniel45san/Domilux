import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Heart, Star, X } from 'lucide-react'
import { QtyControl } from '../components/MiniCart'
import { Stars } from '../components/ProductCard'
import ProductCarousel from '../components/ProductCarousel'
import { useStore } from '../context/StoreContext'
import { getProduct, products } from '../data/products'
import { money } from '../lib'
import type { Review } from '../types'

const Card = ({ children, id, className = '' }: { children: React.ReactNode; id?: string; className?: string }) => (
  <section id={id} className={`rounded-lg bg-white p-4 shadow-sm sm:p-6 md:p-8 ${className}`}>{children}</section>
)

export default function ProductDetail() {
  const { slug = '' } = useParams()
  const p = getProduct(slug)
  const navigate = useNavigate()
  const { addToCart, toggleWish, wishlist, openDrawer } = useStore()
  const [img, setImg] = useState(0)
  const [qty, setQty] = useState(1)
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null)
  const [lightbox, setLightbox] = useState(false)
  const [extraReviews, setExtraReviews] = useState<Review[]>([])
  const [stars, setStars] = useState(0)
  const [sent, setSent] = useState(false)
  const thumbs = useRef<HTMLDivElement>(null)
  const touchX = useRef(0)

  // Mantiene visible la miniatura activa dentro de la tira (sin mover la página)
  useEffect(() => {
    const box = thumbs.current
    const el = box?.querySelector<HTMLElement>(`[data-thumb="${img}"]`)
    if (!box || !el) return
    const vertical = box.scrollHeight > box.clientHeight + 1
    if (vertical) box.scrollTo({ top: el.offsetTop - (box.clientHeight - el.offsetHeight) / 2, behavior: 'smooth' })
    else box.scrollTo({ left: el.offsetLeft - (box.clientWidth - el.offsetWidth) / 2, behavior: 'smooth' })
  }, [img])

  // Al cambiar de producto se reinicia el estado local
  useEffect(() => {
    setImg(0)
    setQty(1)
    setExtraReviews([])
    setStars(0)
    setSent(false)
  }, [slug])

  const idx = products.findIndex((x) => x.slug === slug)
  const prev = idx > 0 ? products[idx - 1] : undefined
  const next = idx >= 0 && idx < products.length - 1 ? products[idx + 1] : undefined

  const related = useMemo(
    () => products.filter((x) => x.slug !== slug && x.category === p?.category).slice(0, 12),
    [slug, p?.category],
  )

  useEffect(() => {
    if (!lightbox || !p) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false)
      if (e.key === 'ArrowRight') setImg((i) => (i + 1) % p.images.length)
      if (e.key === 'ArrowLeft') setImg((i) => (i - 1 + p.images.length) % p.images.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, p])

  if (!p)
    return (
      <div className="container-x py-20 text-center">
        <p>Producto no encontrado.</p>
        <Link to="/tienda" className="btn btn-primary mt-4">Volver a la tienda</Link>
      </div>
    )

  const go = (d: number) => setImg((i) => (i + d + p.images.length) % p.images.length)
  const buyNow = () => {
    addToCart(p.id, qty)
    navigate('/checkout')
  }
  const reviews = [...p.reviewList, ...extraReviews]
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0
  const wished = wishlist.includes(p.id)
  const url = typeof window !== 'undefined' ? window.location.href : ''
  const tall = (s: string) => /scaled|Beneeficios|Formas/i.test(s)

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
  }

  const submitReview = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!stars) return
    const f = new FormData(e.currentTarget)
    setExtraReviews((r) => [
      ...r,
      { author: String(f.get('name')), date: new Date().toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' }), rating: stars, text: String(f.get('text')) },
    ])
    setSent(true)
    e.currentTarget.reset()
    setStars(0)
  }

  return (
    <div className="bg-surface pb-24 md:pb-4">
      {/* Breadcrumb + Prev/Siguiente */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="container-x flex items-center justify-between py-3 text-xs text-neutral-500">
          <p>
            <Link to="/" className="hover:text-brand">Inicio</Link> / <Link to={`/tienda?cat=${p.category}`} className="hover:text-brand">{p.category}</Link>
          </p>
          <div className="flex items-center gap-4">
            {prev ? <Link to={`/producto/${prev.slug}`} title={prev.name} className="flex items-center gap-1 hover:text-brand"><ChevronLeft size={14} /> Prev</Link> : <span className="flex items-center gap-1 opacity-40"><ChevronLeft size={14} /> Prev</span>}
            {next ? <Link to={`/producto/${next.slug}`} title={next.name} className="flex items-center gap-1 hover:text-brand">Siguiente <ChevronRight size={14} /></Link> : <span className="flex items-center gap-1 opacity-40">Siguiente <ChevronRight size={14} /></span>}
          </div>
        </div>
      </div>

      <div className="container-x mt-5 space-y-5">
        {/* Galería + información */}
        <Card className="grid gap-6 lg:grid-cols-2 lg:gap-10">
          <div className="min-w-0 md:grid md:grid-cols-[76px_minmax(0,1fr)] md:gap-3">
            {/* Imagen principal */}
            <div
              className="relative aspect-square cursor-zoom-in overflow-hidden rounded-lg bg-white md:order-2"
              onMouseMove={onMove}
              onMouseLeave={() => setZoom(null)}
              onClick={() => setLightbox(true)}
              onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
              onTouchEnd={(e) => {
                const dx = e.changedTouches[0].clientX - touchX.current
                if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
              }}
            >
              {p.onSale && <span className="absolute left-3 top-3 z-10 rounded bg-red-500 px-2 py-0.5 text-xs font-bold text-white">-{Math.round((1 - p.price / p.regularPrice) * 100)}%</span>}
              <img
                key={p.images[img]}
                src={p.images[img]}
                alt={p.name}
                className="h-full w-full object-contain transition-transform duration-150"
                style={zoom ? { transform: 'scale(2)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
              />
              {p.images.length > 1 && (
                <>
                  <button aria-label="Imagen anterior" onClick={(e) => { e.stopPropagation(); go(-1) }} className="absolute left-2 top-1/2 hidden -translate-y-1/2 cursor-pointer rounded-full bg-white/90 p-1.5 shadow md:block md:opacity-0 md:transition-opacity md:[div:hover>&]:opacity-100"><ChevronLeft size={18} /></button>
                  <button aria-label="Imagen siguiente" onClick={(e) => { e.stopPropagation(); go(1) }} className="absolute right-2 top-1/2 hidden -translate-y-1/2 cursor-pointer rounded-full bg-white/90 p-1.5 shadow md:block md:opacity-0 md:transition-opacity md:[div:hover>&]:opacity-100"><ChevronRight size={18} /></button>
                  <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2.5 py-0.5 text-xs text-white">{img + 1}/{p.images.length}</span>
                </>
              )}
            </div>

            {/* Miniaturas: tira horizontal en móvil, columna vertical sin barras en escritorio */}
            <div className="relative mt-3 md:order-1 md:mt-0">
              <div ref={thumbs} className="no-scrollbar flex snap-x gap-2 overflow-x-auto pb-1 md:absolute md:inset-0 md:snap-none md:flex-col md:overflow-x-hidden md:overflow-y-auto md:pb-0">
                {p.images.map((src, i) => (
                  <button
                    key={src}
                    data-thumb={i}
                    onClick={() => setImg(i)}
                    aria-label={`Ver imagen ${i + 1}`}
                    className={`aspect-square w-16 shrink-0 cursor-pointer snap-start overflow-hidden rounded-md border-2 bg-white transition-colors md:w-full ${i === img ? 'border-brand' : 'border-neutral-200 hover:border-neutral-400'}`}
                  >
                    <img src={src} alt="" loading="lazy" className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
              {p.images.length > 5 && (
                <>
                  <button aria-label="Subir miniaturas" onClick={() => thumbs.current?.scrollBy({ top: -160, behavior: 'smooth' })} className="absolute inset-x-0 top-0 z-10 hidden cursor-pointer place-items-center bg-gradient-to-b from-white to-transparent py-1 text-neutral-500 hover:text-brand md:grid"><ChevronUp size={16} /></button>
                  <button aria-label="Bajar miniaturas" onClick={() => thumbs.current?.scrollBy({ top: 160, behavior: 'smooth' })} className="absolute inset-x-0 bottom-0 z-10 hidden cursor-pointer place-items-center bg-gradient-to-t from-white to-transparent py-1 text-neutral-500 hover:text-brand md:grid"><ChevronDown size={16} /></button>
                </>
              )}
            </div>
          </div>

          <div>
            <h1 className="text-xl font-bold leading-snug text-neutral-800 md:text-2xl">{p.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
              <Stars value={avg || p.rating} size={14} />
              <a href="#reviews" className="underline">{reviews.length} comentarios de los clientes</a>
              <span>Vendidos:{p.sold}</span>
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-2xl font-bold text-brand">{money(p.price)}</span>
              {p.onSale && <span className="text-neutral-400 line-through">{money(p.regularPrice)}</span>}
            </div>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-neutral-700">
              {(p.features.length ? p.features : p.bullets).map((f) => <li key={f}>{f}</li>)}
            </ul>
            <p className="mt-4 text-sm">
              <span>Disponibilidad:</span>{' '}
              {p.stock > 0 ? <span className="text-green-600">{p.stock} disponibles</span> : <span className="text-red-600">Agotado</span>}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 border-b border-neutral-200 pb-5">
              <QtyControl qty={qty} onChange={(n) => setQty(Math.max(1, n))} />
              <button onClick={() => { addToCart(p.id, qty); openDrawer('cart') }} className="btn btn-outline min-w-[9rem] flex-1 sm:flex-none">Añadir al carrito</button>
              <button onClick={buyNow} className="btn btn-accent min-w-[9rem] flex-1 sm:flex-none">Comprar ahora</button>
              <button onClick={() => toggleWish(p.id)} aria-label="Lista de deseos" className="rounded border border-neutral-300 p-2.5 cursor-pointer">
                <Heart size={18} className={wished ? 'fill-red-500 text-red-500' : 'text-neutral-500'} />
              </button>
            </div>

            <dl className="mt-4 space-y-1 text-sm text-neutral-600">
              {p.sku && <div className="flex gap-2"><dt>SKU:</dt><dd>{p.sku}</dd></div>}
              <div className="flex gap-2"><dt>Categoría:</dt><dd><Link to={`/tienda?cat=${p.category}`} className="hover:text-brand">{p.category}</Link></dd></div>
              {p.tags.length > 0 && <div className="flex gap-2"><dt>Etiqueta:</dt><dd>{p.tags.join(', ')}</dd></div>}
              {p.brand && <div className="flex gap-2"><dt>Marca:</dt><dd>{p.brand}</dd></div>}
            </dl>

            <div className="mt-5 flex items-center gap-3 text-sm">
              <span className="text-neutral-500">Compartir:</span>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" className="text-brand hover:underline">Facebook</a>
              <a href={`https://wa.me/?text=${encodeURIComponent(p.name + ' ' + url)}`} target="_blank" rel="noreferrer" className="text-green-700 hover:underline">WhatsApp</a>
            </div>
          </div>
        </Card>

        {/* Descripción del producto */}
        <Card>
          <h2 className="mb-4 text-xl font-bold text-neutral-800">Descripción del Producto</h2>
          {p.bullets.length > 0 && (
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-neutral-700">{p.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
          )}
          {p.descImages.length > 0 && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {p.descImages.map((src) => (
                <img key={src} src={src} alt={p.name} loading="lazy" className={`w-full rounded ${tall(src) ? 'md:col-span-2' : ''}`} />
              ))}
            </div>
          )}
          {p.attributes.length > 0 && (
            <table className="mt-6 w-full max-w-xl border-collapse text-sm" aria-label="Detalles del producto">
              <tbody>
                {p.attributes.map((a) => (
                  <tr key={a.name} className="border-t border-neutral-200">
                    <th className="w-40 py-2.5 pr-4 text-left font-semibold">{a.name}</th>
                    <td className="py-2.5 text-neutral-700">{a.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* Valoraciones */}
        <Card id="reviews" className="grid scroll-mt-28 gap-10 md:grid-cols-2">
          <div>
            <h2 className="mb-4 text-xl font-bold text-neutral-800">
              {reviews.length} {reviews.length === 1 ? 'valoración' : 'valoraciones'} en {p.name}
            </h2>
            {reviews.length === 0 && <p className="text-sm text-neutral-500">Todavía no hay valoraciones.</p>}
            <ul className="space-y-5">
              {reviews.map((r, i) => (
                <li key={i} className="flex gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand text-lg font-bold uppercase text-white">{r.author.charAt(0)}</span>
                  <div>
                    <Stars value={r.rating} size={14} />
                    <p className="mt-1 text-sm"><b className="capitalize">{r.author}</b> <span className="text-neutral-400">– {r.date}</span></p>
                    <p className="mt-1 text-sm text-neutral-700">{r.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <form onSubmit={submitReview} className="space-y-3">
            <h3 className="text-lg font-bold text-neutral-800">Añade una valoración</h3>
            <p className="text-xs text-neutral-500">Tu dirección de correo electrónico no será publicada. Los campos obligatorios están marcados con *</p>
            <div>
              <p className="mb-1 text-sm">Tu puntuación *</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" aria-label={`${n} de 5 estrellas`} onClick={() => setStars(n)} className="cursor-pointer">
                    <Star size={24} className={n <= stars ? 'fill-accent text-accent' : 'text-neutral-300'} />
                  </button>
                ))}
              </div>
            </div>
            <textarea name="text" required rows={4} placeholder="Tu valoración *" className="input" />
            <input name="name" required placeholder="Nombre *" className="input" />
            <input name="email" type="email" required placeholder="Correo electrónico *" className="input" />
            <label className="flex items-start gap-2 text-xs text-neutral-600">
              <input type="checkbox" className="mt-0.5" /> Guarda mi nombre, correo electrónico y web en este navegador para la próxima vez que comente.
            </label>
            <button className="btn btn-primary" disabled={!stars} title={stars ? '' : 'Elige una puntuación'}>Enviar</button>
            {sent && <p className="text-sm text-green-700">¡Gracias! Tu valoración se añadió (mockup, no se guarda).</p>}
          </form>
        </Card>

        {/* Relacionados */}
        {related.length > 0 && (
          <Card>
            <h2 className="mb-4 text-xl font-bold text-neutral-800">Productos relacionados</h2>
            <ProductCarousel items={related} />
          </Card>
        )}
      </div>

      {/* Barra de compra fija en móvil */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-neutral-200 bg-white px-4 py-3 shadow-[0_-4px_12px_rgb(0_0_0/0.06)] md:hidden">
        <div className="min-w-0">
          <p className="text-[11px] text-neutral-500">Precio</p>
          <p className="truncate text-lg font-bold leading-none text-brand">{money(p.price * qty)}</p>
        </div>
        <button onClick={() => { addToCart(p.id, qty); openDrawer('cart') }} className="btn btn-outline ml-auto px-3">Añadir</button>
        <button onClick={buyNow} className="btn btn-accent px-4">Comprar ahora</button>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(false)}>
          <button aria-label="Cerrar" className="absolute right-4 top-4 cursor-pointer text-white"><X size={28} /></button>
          {p.images.length > 1 && (
            <>
              <button aria-label="Anterior" onClick={(e) => { e.stopPropagation(); setImg((i) => (i - 1 + p.images.length) % p.images.length) }} className="absolute left-4 cursor-pointer rounded-full bg-white/15 p-3 text-white"><ChevronLeft /></button>
              <button aria-label="Siguiente" onClick={(e) => { e.stopPropagation(); setImg((i) => (i + 1) % p.images.length) }} className="absolute right-4 cursor-pointer rounded-full bg-white/15 p-3 text-white"><ChevronRight /></button>
            </>
          )}
          <img src={p.images[img]} alt={p.name} className="max-h-full max-w-full rounded bg-white object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}

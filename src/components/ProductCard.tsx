import { Heart, ShoppingCart, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Product } from '../types'
import { money } from '../lib'
import { useStore } from '../context/StoreContext'

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} className={n <= Math.round(value) ? 'fill-accent text-accent' : 'text-neutral-300'} />
      ))}
    </span>
  )
}

export default function ProductCard({ p }: { p: Product }) {
  const { addToCart, toggleWish, wishlist, openDrawer } = useStore()
  const wished = wishlist.includes(p.id)
  const discount = p.onSale ? Math.round((1 - p.price / p.regularPrice) * 100) : 0
  return (
    <div className="group relative flex h-full flex-col rounded-lg border border-neutral-200 bg-white p-3 transition-shadow hover:shadow-lg">
      {p.onSale && (
        <span className="absolute left-3 top-3 z-10 rounded bg-red-500 px-2 py-0.5 text-xs font-bold text-white">-{discount}%</span>
      )}
      <button
        aria-label="Añadir a la lista de deseos"
        onClick={() => toggleWish(p.id)}
        className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-1.5 shadow cursor-pointer"
      >
        <Heart size={16} className={wished ? 'fill-red-500 text-red-500' : 'text-neutral-500'} />
      </button>
      <Link to={`/producto/${p.slug}`} className="block aspect-square overflow-hidden rounded bg-surface">
        <img src={p.images[0]} alt={p.name} loading="lazy" className="h-full w-full object-contain transition-transform group-hover:scale-105" />
      </Link>
      <Link to={`/producto/${p.slug}`} className="mt-3 line-clamp-2 min-h-10 text-sm font-semibold hover:text-brand">
        {p.name}
      </Link>
      <div className="mt-1 flex items-center gap-1">
        <Stars value={p.rating} />
        {p.reviews > 0 && <span className="text-xs text-neutral-500">({p.reviews})</span>}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-lg font-bold text-brand">{money(p.price)}</span>
        {p.onSale && <span className="text-sm text-neutral-400 line-through">{money(p.regularPrice)}</span>}
      </div>
      <button
        onClick={() => {
          addToCart(p.id)
          openDrawer('cart')
        }}
        disabled={p.stock <= 0}
        className="btn btn-accent mt-3 w-full disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ShoppingCart size={16} /> {p.stock <= 0 ? 'Agotado' : 'Añadir al carrito'}
      </button>
    </div>
  )
}

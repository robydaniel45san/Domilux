import { useState, type FormEvent } from 'react'
import { Heart, Menu, Search, ShoppingCart, User as UserIcon, X } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { categories } from '../data/products'

const nav = [
  { to: '/', label: 'Inicio' },
  { to: '/tienda', label: 'Tienda' },
  { to: '/ofertas', label: 'Ofertas' },
  { to: '/contactanos', label: 'Contáctanos' },
]

const LOGO = 'https://domilux.shop/wp-content/uploads/2025/11/Marca-WebP__Color.webp'

export default function Header() {
  const { cartCount, wishlist, user, logout, openDrawer } = useStore()
  const [mobile, setMobile] = useState(false)
  const [cat, setCat] = useState('')
  const [q, setQ] = useState('')
  const navigate = useNavigate()

  const search = (e: FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (cat) params.set('cat', cat)
    navigate(`/tienda?${params}`)
  }

  const badge = 'absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-brand-dark'

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
      <div className="container-x flex items-center gap-4 py-3">
        <button aria-label="Menú" className="lg:hidden cursor-pointer" onClick={() => setMobile(!mobile)}>
          {mobile ? <X /> : <Menu />}
        </button>
        <Link
          to="/"
          aria-label="Domilux – ir al inicio"
          onClick={() => {
            setMobile(false)
            openDrawer(null)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          className="shrink-0"
        >
          <img src={LOGO} alt="Domilux" className="h-10" />
        </Link>

        <form onSubmit={search} className="hidden flex-1 md:flex md:max-w-xl">
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-l border border-r-0 border-neutral-300 bg-white px-2 text-sm">
            <option value="">Todos</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar productos..." className="w-full border border-neutral-300 px-3 py-2 text-sm outline-none" />
          <button aria-label="Buscar" className="rounded-r bg-accent px-4 cursor-pointer"><Search size={18} /></button>
        </form>

        <div className="ml-auto flex items-center gap-5">
          {user ? (
            <div className="hidden text-sm sm:block">
              <p className="text-xs text-neutral-500">Hola, {user.name}</p>
              <button onClick={logout} className="font-semibold cursor-pointer">Cerrar sesión</button>
            </div>
          ) : (
            <button onClick={() => openDrawer('login')} className="hidden items-center gap-2 text-left text-sm sm:flex cursor-pointer">
              <UserIcon size={22} className="text-brand" />
              <span><span className="block text-xs text-neutral-500">Cuenta</span><span className="font-semibold">Iniciar Sesión/Registrar</span></span>
            </button>
          )}
          <Link to="/lista-deseos" aria-label="Lista de deseos" className="relative">
            <Heart size={24} className="text-brand" />
            <span className={badge}>{wishlist.length}</span>
          </Link>
          <button aria-label="Carrito" onClick={() => openDrawer('cart')} className="relative cursor-pointer">
            <ShoppingCart size={24} className="text-brand" />
            <span className={badge}>{cartCount}</span>
          </button>
        </div>
      </div>

      <nav className="hidden border-t border-neutral-100 lg:block">
        <ul className="container-x flex gap-8 py-2 text-sm font-semibold">
          {nav.map((n) => (
            <li key={n.to}>
              <NavLink to={n.to} className={({ isActive }) => (isActive ? 'text-brand underline decoration-accent decoration-2 underline-offset-8' : 'hover:text-brand')}>{n.label}</NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {mobile && (
        <nav className="border-t border-neutral-200 bg-white lg:hidden">
          <form onSubmit={search} className="flex p-3">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar productos..." className="input rounded-r-none" />
            <button aria-label="Buscar" className="rounded-r bg-accent px-4"><Search size={18} /></button>
          </form>
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} onClick={() => setMobile(false)} className="block border-t border-neutral-100 px-4 py-3 text-sm font-semibold">{n.label}</NavLink>
          ))}
          <button onClick={() => { setMobile(false); openDrawer('login') }} className="block w-full border-t border-neutral-100 px-4 py-3 text-left text-sm font-semibold">
            {user ? user.name : 'Iniciar Sesión/Registrar'}
          </button>
        </nav>
      )}
    </header>
  )
}

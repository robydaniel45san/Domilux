import { useState, type FormEvent } from 'react'
import { Link, NavLink, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { BarChart3, CreditCard, ExternalLink, LayoutDashboard, LogOut, Menu, Package, PanelsTopLeft, Settings as Cog, ShoppingBag, Tag, Truck, Users, X } from 'lucide-react'
import { useOrders } from '../store/orders'
import { useCatalog, allProducts } from '../data/products'
import { useSettings } from '../store/settings'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import Logistics from './pages/Logistics'
import Payments from './pages/Payments'
import Products from './pages/Products'
import Customers from './pages/Customers'
import Coupons from './pages/Coupons'
import Landing from './pages/Landing'
import SettingsPage from './pages/Settings'

// Credenciales del MOCKUP (no son seguridad real: el panel no tiene backend). Se pueden cambiar en .env
const ADMIN_USER = import.meta.env.VITE_ADMIN_USER ?? 'admin'
const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS ?? 'domilux'
const SESSION_KEY = 'dl-admin-session'

const isAuthed = () => {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1'
  } catch {
    return false
  }
}

function Login({ onOk }: { onOk: () => void }) {
  const [err, setErr] = useState('')
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    if (f.get('user') === ADMIN_USER && f.get('pass') === ADMIN_PASS) {
      try {
        sessionStorage.setItem(SESSION_KEY, '1')
      } catch {
        /* sin storage */
      }
      onOk()
    } else setErr('Usuario o contraseña incorrectos.')
  }
  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-brand-dark to-neutral-900 p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-8 shadow-2xl">
        <img src="https://domilux.shop/wp-content/uploads/2025/11/Marca-WebP__Color.webp" alt="Domilux" className="mx-auto h-12" />
        <div className="text-center">
          <h1 className="text-xl font-bold text-neutral-900">Panel administrativo</h1>
          <p className="text-sm text-neutral-500">Inicia sesión para gestionar la tienda</p>
        </div>
        <input name="user" required autoFocus placeholder="Usuario" autoComplete="username" className="input" />
        <input name="pass" required type="password" placeholder="Contraseña" autoComplete="current-password" className="input" />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="btn btn-primary w-full">Ingresar</button>
        <p className="text-center text-xs text-neutral-400">Mockup sin backend · usuario <b>{ADMIN_USER}</b> · contraseña <b>{ADMIN_PASS}</b></p>
        <Link to="/" className="block text-center text-sm text-brand underline">← Volver a la tienda</Link>
      </form>
    </div>
  )
}

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
  badge?: 'orders' | 'stock'
}

const nav: NavItem[] = [
  { to: '/admin', end: true, label: 'Resumen', icon: LayoutDashboard },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag, badge: 'orders' },
  { to: '/admin/logistica', label: 'Logística', icon: Truck },
  { to: '/admin/transacciones', label: 'Transacciones', icon: CreditCard },
  { to: '/admin/productos', label: 'Productos y precios', icon: Package, badge: 'stock' },
  { to: '/admin/clientes', label: 'Clientes', icon: Users },
  { to: '/admin/cupones', label: 'Cupones', icon: Tag },
  { to: '/admin/landing', label: 'Landing / Slider', icon: PanelsTopLeft },
  { to: '/admin/configuracion', label: 'Configuración', icon: Cog },
]

function Layout({ onLogout }: { onLogout: () => void }) {
  const orders = useOrders()
  useCatalog()
  const { lowStock } = useSettings()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const pending = orders.filter((o) => o.status === 'pendiente').length
  const low = allProducts.filter((p) => p.stock <= lowStock).length
  const badges: Record<string, number> = { orders: pending, stock: low }
  const current = nav.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)))

  const sidebar = (
    <nav className="flex h-full flex-col bg-brand-dark text-white">
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
        <BarChart3 className="text-accent" />
        <span className="font-bold">Domilux Admin</span>
      </div>
      <ul className="flex-1 space-y-1 overflow-y-auto p-3">
        {nav.map((n) => {
          const b = n.badge ? badges[n.badge] : 0
          return (
            <li key={n.to}>
              <NavLink
                to={n.to}
                end={n.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-accent text-brand-dark' : 'text-white/80 hover:bg-white/10'}`}
              >
                <n.icon size={18} /> <span className="flex-1">{n.label}</span>
                {b > 0 && <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white">{b}</span>}
              </NavLink>
            </li>
          )
        })}
      </ul>
      <div className="space-y-1 border-t border-white/10 p-3 text-sm">
        <Link to="/" target="_blank" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-white/80 hover:bg-white/10"><ExternalLink size={18} /> Ver la tienda</Link>
        <button onClick={onLogout} className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-white/80 hover:bg-white/10"><LogOut size={18} /> Cerrar sesión</button>
      </div>
    </nav>
  )

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-800">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <aside className="relative h-full w-64" onClick={(e) => e.stopPropagation()}>{sidebar}</aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3">
          <button aria-label="Menú" className="cursor-pointer lg:hidden" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
          <p className="font-semibold text-neutral-800">{current?.label ?? 'Panel'}</p>
          <span className="ml-auto hidden text-xs text-neutral-400 sm:block">Mockup · los datos se guardan en este navegador</span>
        </header>
        <main className="mx-auto max-w-[1400px] p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>
  )
}

export default function AdminApp() {
  const [authed, setAuthed] = useState(isAuthed)
  if (!authed) return <Login onOk={() => setAuthed(true)} />
  const logout = () => {
    try {
      sessionStorage.removeItem(SESSION_KEY)
    } catch {
      /* sin storage */
    }
    setAuthed(false)
  }
  return (
    <Routes>
      <Route element={<Layout onLogout={logout} />}>
        <Route index element={<Dashboard />} />
        <Route path="pedidos" element={<Orders />} />
        <Route path="logistica" element={<Logistics />} />
        <Route path="transacciones" element={<Payments />} />
        <Route path="productos" element={<Products />} />
        <Route path="clientes" element={<Customers />} />
        <Route path="cupones" element={<Coupons />} />
        <Route path="landing" element={<Landing />} />
        <Route path="configuracion" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  )
}

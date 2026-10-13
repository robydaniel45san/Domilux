import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { StoreProvider } from './context/StoreContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Shop from './pages/Shop'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Wishlist from './pages/Wishlist'
import Contact from './pages/Contact'

// El panel administrativo se carga solo al entrar a /admin
const AdminApp = lazy(() => import('./admin/AdminApp'))

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="grid min-h-screen place-items-center text-sm text-neutral-500">Cargando…</div>}>
        <Routes>
          <Route path="admin/*" element={<AdminApp />} />
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="tienda" element={<Shop />} />
            <Route path="ofertas" element={<Shop onlyOffers />} />
            <Route path="producto/:slug" element={<ProductDetail />} />
            <Route path="carrito-compra" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="lista-deseos" element={<Wishlist />} />
            <Route path="contactanos" element={<Contact />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        </Suspense>
      </BrowserRouter>
    </StoreProvider>
  )
}

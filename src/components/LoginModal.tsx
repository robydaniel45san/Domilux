import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { useStore } from '../context/StoreContext'

export default function LoginModal() {
  const { drawer, openDrawer, login } = useStore()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  if (drawer !== 'login') return null

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const email = String(f.get('email') ?? '')
    login({ name: String(f.get('name') || email.split('@')[0] || 'Cliente'), email })
    openDrawer(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => openDrawer(null)}>
      <div className="relative w-full max-w-md rounded-lg bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <button aria-label="Cerrar" onClick={() => openDrawer(null)} className="absolute right-3 top-3 cursor-pointer">
          <X size={20} />
        </button>
        <div className="mb-5 flex gap-6 border-b border-neutral-200 text-sm font-bold uppercase">
          {(['login', 'register'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px cursor-pointer border-b-2 pb-2 ${tab === t ? 'border-accent text-brand' : 'border-transparent text-neutral-400'}`}
            >
              {t === 'login' ? 'Inicio de sesión' : 'Registro'}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="space-y-3">
          <p className="text-sm text-neutral-600">
            {tab === 'login' ? 'Introduzca su nombre de usuario y contraseña para iniciar sesión.' : 'Cree su cuenta para comprar más rápido.'}
          </p>
          {tab === 'register' && <input name="name" required placeholder="Nombre completo" className="input" />}
          <input name="email" type="email" required placeholder="Correo electrónico" className="input" />
          <input name="password" type="password" required placeholder="Contraseña" className="input" />
          {tab === 'login' && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> Acuérdate de mí
            </label>
          )}
          <button className="btn btn-primary w-full">{tab === 'login' ? 'Inicio de sesión' : 'Registrarme'}</button>
          {tab === 'login' && <a href="#" className="block text-sm text-brand underline">¿Contraseña perdida?</a>}
          <p className="text-xs text-neutral-400">Mockup: cualquier dato inicia sesión.</p>
        </form>
      </div>
    </div>
  )
}

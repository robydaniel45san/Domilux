import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone } from 'lucide-react'
import { useSettings } from '../store/settings'

const Facebook = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 22v-8.2h2.8l.4-3.2h-3.2V8.6c0-.9.3-1.5 1.6-1.5h1.7V4.2c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1v2.4H7.6v3.2h2.8V22h3.1z" /></svg>
)
const Instagram = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>
)

export default function Footer() {
  const { store } = useSettings()
  return (
    <footer className="mt-16 bg-surface">
      <div className="container-x grid gap-8 py-10 md:grid-cols-2">
        <div>
          <h3 className="mb-3 font-bold text-brand">Contáctanos</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0" /> Dirección: {store.address}</li>
            <li className="flex gap-2"><Mail size={16} className="mt-0.5 shrink-0" /> Correo: {store.email}</li>
            <li className="flex gap-2"><Phone size={16} className="mt-0.5 shrink-0" /> Teléfono: {store.phone}</li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 font-bold text-brand">Síguenos</h3>
          <div className="flex gap-3">
            <a href={store.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="rounded-full bg-brand p-2.5 text-white"><Facebook size={18} /></a>
            <a href={store.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="rounded-full bg-brand p-2.5 text-white"><Instagram size={18} /></a>
            <a href={`https://wa.me/${store.whatsapp}`} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="rounded-full bg-green-600 p-2.5 text-white"><Phone size={18} /></a>
          </div>
        </div>
      </div>
      <p className="border-t border-neutral-200 py-4 text-center text-xs text-neutral-500">© {new Date().getFullYear()} {store.name}. Todos los derechos reservados. <Link to="/admin" className="ml-2 text-neutral-400 hover:text-brand">Panel administrativo</Link></p>
    </footer>
  )
}

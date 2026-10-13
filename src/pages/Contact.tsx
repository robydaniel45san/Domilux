import { useState, type FormEvent } from 'react'
import { Mail, MapPin, Phone } from 'lucide-react'
import { PageTitle } from '../components/PageTitle'
import { useSettings } from '../store/settings'

export default function Contact() {
  const { store } = useSettings()
  const [sent, setSent] = useState(false)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSent(true)
  }
  return (
    <>
      <PageTitle title="Contáctanos" />
      <div className="container-x grid gap-10 py-10 md:grid-cols-2">
        <div className="space-y-4 text-sm">
          <p className="flex gap-3"><MapPin className="text-brand" /> {store.address}</p>
          <p className="flex gap-3"><Mail className="text-brand" /> {store.email}</p>
          <p className="flex gap-3"><Phone className="text-brand" /> {store.phone}</p>
          <iframe
            title="Mapa"
            className="h-64 w-full rounded-lg border-0"
            loading="lazy"
            src={`https://www.google.com/maps?q=${encodeURIComponent(store.address)}&output=embed`}
          />
        </div>
        {sent ? (
          <div className="rounded-lg bg-green-50 p-6 text-green-800">Mensaje enviado (mockup). ¡Gracias por escribirnos!</div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <input required placeholder="Tu nombre" className="input" />
            <input required type="email" placeholder="Tu correo" className="input" />
            <input placeholder="Asunto" className="input" />
            <textarea required rows={5} placeholder="Tu mensaje" className="input" />
            <button className="btn btn-primary">Enviar</button>
          </form>
        )}
      </div>
    </>
  )
}

import { ExternalLink, RotateCcw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { defaultSettings, updateSettings, useSettings, type HeroText } from '../../store/settings'
import { Card, Field, PageHeader } from '../ui'

const slideNames = ['Interruptores táctiles', 'Cerradura inteligente', 'Cables eléctricos (Cobrecom)']

export default function Landing() {
  const { hero, store } = useSettings()
  const setHero = (i: number, p: Partial<HeroText>) => updateSettings((s) => ({ ...s, hero: s.hero.map((h, k) => (k === i ? { ...h, ...p } : h)) }))
  const setStore = (p: Partial<typeof store>) => updateSettings((s) => ({ ...s, store: { ...s.store, ...p } }))

  return (
    <>
      <PageHeader
        title="Landing / Slider"
        desc="Edita los textos del slider principal y los datos de contacto que se muestran en la tienda."
        actions={
          <>
            <button onClick={() => confirm('¿Restablecer los textos del slider?') && updateSettings((s) => ({ ...s, hero: defaultSettings().hero }))} className="btn btn-outline"><RotateCcw size={16} /> Restablecer slider</button>
            <Link to="/" target="_blank" className="btn btn-primary"><ExternalLink size={16} /> Ver en la tienda</Link>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        {hero.map((h, i) => (
          <Card key={i} title={`Slide ${i + 1} · ${slideNames[i] ?? ''}`}>
            <div className="space-y-3">
              <Field label="Etiqueta superior"><input className="input" value={h.kicker} onChange={(e) => setHero(i, { kicker: e.target.value })} /></Field>
              <Field label="Título (línea 1)"><input className="input" value={h.title1} onChange={(e) => setHero(i, { title1: e.target.value })} /></Field>
              <Field label="Título (línea 2, resaltada)"><input className="input" value={h.title2} onChange={(e) => setHero(i, { title2: e.target.value })} /></Field>
              <Field label="Descripción"><textarea rows={3} className="input" value={h.text} onChange={(e) => setHero(i, { text: e.target.value })} /></Field>
              <Field label="Texto del botón"><input className="input" value={h.cta} onChange={(e) => setHero(i, { cta: e.target.value })} /></Field>
            </div>
          </Card>
        ))}
      </div>
      <p className="mt-3 text-xs text-neutral-500">Los cambios se guardan solos y se ven al recargar el inicio. Las imágenes y los productos de cada slide siguen definidos en el código.</p>

      <Card title="Datos de la tienda (pie de página y contacto)" className="mt-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nombre de la tienda"><input className="input" value={store.name} onChange={(e) => setStore({ name: e.target.value })} /></Field>
          <Field label="Correo"><input type="email" className="input" value={store.email} onChange={(e) => setStore({ email: e.target.value })} /></Field>
          <Field label="Teléfono (visible)"><input className="input" value={store.phone} onChange={(e) => setStore({ phone: e.target.value })} /></Field>
          <Field label="WhatsApp (solo números, con código de país)"><input className="input" value={store.whatsapp} onChange={(e) => setStore({ whatsapp: e.target.value.replace(/\D/g, '') })} /></Field>
          <Field label="Dirección" className="md:col-span-2"><input className="input" value={store.address} onChange={(e) => setStore({ address: e.target.value })} /></Field>
          <Field label="Facebook (URL)"><input type="url" className="input" value={store.facebook} onChange={(e) => setStore({ facebook: e.target.value })} /></Field>
          <Field label="Instagram (URL)"><input type="url" className="input" value={store.instagram} onChange={(e) => setStore({ instagram: e.target.value })} /></Field>
        </div>
      </Card>
    </>
  )
}

import { createStore, useStoreValue } from './persist'

export interface Carrier {
  id: string
  name: string
  eta: string
  price: number
  active: boolean
}

export interface HeroText {
  kicker: string
  title1: string
  title2: string
  text: string
  cta: string
}

export interface Settings {
  store: {
    name: string
    email: string
    phone: string
    whatsapp: string
    address: string
    facebook: string
    instagram: string
  }
  shipping: { freeFrom: number; carriers: Carrier[] }
  payments: { qr: boolean; cash: boolean; store: boolean }
  lowStock: number
  hero: HeroText[]
}

export const defaultSettings = (): Settings => ({
  store: {
    name: 'Domilux',
    email: 'info@domilux.shop',
    phone: '+59173389366',
    whatsapp: '59173389366',
    address: 'Av. Prolongación Beni, Santa Cruz de la Sierra',
    facebook: 'https://www.facebook.com/domiluxbo',
    instagram: 'https://www.instagram.com/domilux.bo/',
  },
  shipping: {
    freeFrom: 500,
    carriers: [
      { id: 'local', name: 'Entrega en Santa Cruz (delivery)', eta: 'Mismo día – 24 h', price: 15, active: true },
      { id: 'nacional', name: 'Encomienda nacional (flota / transportadora)', eta: '2 – 4 días', price: 40, active: true },
      { id: 'recojo', name: 'Recojo en tienda', eta: 'Inmediato', price: 0, active: true },
    ],
  },
  payments: { qr: true, cash: true, store: true },
  lowStock: 5,
  hero: [
    { kicker: 'Interruptores', title1: 'Táctiles Wifi', title2: 'Inteligentes', text: 'Controla tu iluminación desde tu celular.', cta: 'Ver más' },
    { kicker: 'Cerradura Inteligente', title1: 'Diseño elegante', title2: 'y moderno.', text: 'Accede con código, huella, tarjeta, app móvil y llave.', cta: 'Ver más' },
    { kicker: 'Cobrecom · 100% Cobre · Antillama', title1: 'Cables', title2: 'eléctricos', text: 'La elección profesional para instalaciones seguras y eficientes.', cta: 'Comprar' },
  ],
})

/** Mezcla lo guardado con los valores por defecto, por si se añaden campos nuevos. */
const merge = (saved: Partial<Settings> | null): Settings => {
  const d = defaultSettings()
  if (!saved) return d
  return {
    ...d,
    ...saved,
    store: { ...d.store, ...saved.store },
    shipping: { ...d.shipping, ...saved.shipping },
    payments: { ...d.payments, ...saved.payments },
    hero: d.hero.map((h, i) => ({ ...h, ...saved.hero?.[i] })),
  }
}

const raw = createStore<Settings>('dl-settings', defaultSettings)
raw.set(merge(raw.get()))

export const settingsStore = raw
export const useSettings = () => useStoreValue(settingsStore)
export const updateSettings = (fn: (s: Settings) => Settings) => settingsStore.set(fn)

export const payLabels = { qr: 'Transferencia / QR', cash: 'Pago contra entrega', store: 'Pago en tienda' } as const
export type PayMethod = keyof typeof payLabels

import { useMemo, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronDown, ChevronUp, Plus, ShieldCheck, Zap } from 'lucide-react'
import { Autoplay, EffectCreative, Keyboard } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import type { Swiper as SwiperType } from 'swiper'
import 'swiper/css'
import 'swiper/css/effect-creative'
import { getProduct, products } from '../data/products'
import { useStore } from '../context/StoreContext'
import { colorHex, money } from '../lib'
import { useSettings } from '../store/settings'

const U = 'https://domilux.shop/wp-content/uploads'
const DELAY = 6500

type Kind = 'switch' | 'lock' | 'cable'

interface Spot {
  label: string
  detail: string
  x: number // % dentro del escenario
  y: number
  side: 'l' | 'r'
}

interface Slide {
  kind: Kind
  tab: string
  word: string
  kicker: string
  title: [string, string]
  text: string
  cta: string
  to: string
  chips: string[]
  glow: string
  spots?: Spot[]
}

// Slides replicados del Slider Revolution original (slider-1)
const slides: Slide[] = [
  {
    kind: 'switch',
    tab: 'Interruptores',
    word: 'SMART',
    kicker: 'Interruptores',
    title: ['Táctiles Wifi', 'Inteligentes'],
    text: 'Controla tu iluminación desde tu celular.',
    cta: 'Ver más',
    to: '/tienda',
    chips: ['Alexa', 'Google Assistant', 'Smart Life · Tuya'],
    glow: '250 190 43',
    spots: [
      { label: 'Vidrio templado', detail: 'Resistente al agua', x: 40, y: 22, side: 'l' },
      { label: 'Touch capacitivo', detail: 'Brilla en la oscuridad', x: 60, y: 48, side: 'r' },
      { label: 'WiFi integrado', detail: 'Control desde la app', x: 40, y: 80, side: 'l' },
    ],
  },
  {
    kind: 'lock',
    tab: 'Cerradura',
    word: 'LOCK',
    kicker: 'Cerradura Inteligente',
    title: ['Diseño elegante', 'y moderno.'],
    text: 'Accede con código, huella, tarjeta, app móvil y llave.',
    cta: 'Ver más',
    to: '/producto/cerradura-inteligente',
    chips: ['5 formas de apertura', 'Tuya · Smart Life'],
    glow: '110 160 255',
    spots: [
      { label: 'Teclado táctil', detail: 'Acceso por código', x: 40, y: 24, side: 'l' },
      { label: 'Huella digital', detail: 'Apertura en un toque', x: 60, y: 62, side: 'r' },
      { label: 'App móvil', detail: 'También tarjeta y llave', x: 40, y: 74, side: 'l' },
    ],
  },
  {
    kind: 'cable',
    tab: 'Cobrecom',
    word: 'COBRE',
    kicker: 'Cobrecom · 100% Cobre · Antillama',
    title: ['Cables', 'eléctricos'],
    text: 'La elección profesional para instalaciones seguras y eficientes.',
    cta: 'Comprar',
    to: '/tienda',
    chips: ['100% cobre', 'Antillama', 'Uso profesional'],
    glow: '255 140 60',
  },
]

const COLORS = ['Blanco', 'Negro', 'Gris']
const TOMAS = ['1', '2', '3']

export default function HeroSlider() {
  const { addToCart, openDrawer } = useStore()
  const { hero } = useSettings()
  const [active, setActive] = useState(0)
  const [color, setColor] = useState('Blanco')
  const [tomas, setTomas] = useState('3')
  const swiper = useRef<SwiperType | null>(null)
  const root = useRef<HTMLElement>(null)

  // Producto real del catálogo que corresponde al color y tomas elegidos
  const sw = useMemo(
    () => products.find((p) => /Touch/.test(p.name) && !p.onSale && p.color === color && p.tomas?.startsWith(tomas)) ?? products[0],
    [color, tomas],
  )
  const lock = getProduct('cerradura-inteligente')

  const onMove = (e: MouseEvent) => {
    const r = root.current?.getBoundingClientRect()
    if (!r) return
    root.current!.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3))
    root.current!.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3))
  }

  const quickAdd = (id: number) => {
    addToCart(id)
    openDrawer('cart')
  }

  return (
    <section ref={root} onMouseMove={onMove} className="hero-slider relative overflow-hidden bg-neutral-950 text-white">
      <Swiper
        modules={[Autoplay, EffectCreative, Keyboard]}
        effect="creative"
        creativeEffect={{
          limitProgress: 2,
          prev: { translate: ['-35%', 0, -300], opacity: 0, rotate: [0, 0, -4] },
          next: { translate: ['100%', 0, 0] },
        }}
        speed={1000}
        rewind
        keyboard
        noSwipingClass="swiper-no-swiping"
        autoplay={{ delay: DELAY, disableOnInteraction: false, pauseOnMouseEnter: true }}
        onSwiper={(s) => (swiper.current = s)}
        onSlideChange={(s) => setActive(s.realIndex)}
      >
        {slides.map((base, i) => {
          const h = hero[i]
          const s: Slide = h ? { ...base, kicker: h.kicker, title: [h.title1, h.title2], text: h.text, cta: h.cta } : base
          const product = s.kind === 'switch' ? sw : s.kind === 'lock' ? lock : undefined
          const image = s.kind === 'switch' ? `/cutouts/${sw.slug}.webp` : s.kind === 'lock' ? '/cutouts/cerradura-inteligente.webp' : undefined
          const to = s.kind === 'switch' ? `/producto/${sw.slug}` : s.to
          return (
            <SwiperSlide key={s.tab} className="bg-neutral-950">
              <div className="hero-slide relative" style={{ '--glow': s.glow } as CSSProperties}>
                {/* Fondo */}
                <div className="absolute inset-0">
                  {s.kind === 'cable' ? (
                    <>
                      <img src={`${U}/2025/11/conductores-electricos.jpg`} alt="" className="hero-kenburns h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/85 to-neutral-950/30" />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_72%_45%,rgb(var(--glow)/0.16),transparent_55%),linear-gradient(135deg,#0a0f1a,#101a2e_55%,#080c15)]" />
                  )}
                  <div className="hero-grid absolute inset-0 opacity-[0.07]" />
                </div>

                {/* Palabra gigante */}
                <span aria-hidden className="hero-word pointer-events-none absolute right-[-2%] top-1/2 -translate-y-1/2 select-none text-[11rem] font-black leading-none md:text-[26rem]">
                  {s.word}
                </span>

                <div className="container-x relative grid items-center gap-2 pb-14 pt-4 md:min-h-[760px] md:grid-cols-[0.95fr_1.05fr] md:gap-6 md:pb-24 md:pt-10">
                  {/* Texto */}
                  <div className="relative z-20 md:pl-10">
                    <p className="hero-in flex items-center gap-3 text-xs font-bold uppercase tracking-[0.25em] text-accent" style={{ '--d': '0.1s' } as CSSProperties}>
                      <span className="h-px w-10 bg-accent" /> {s.kicker}
                    </p>
                    <h2 className="mt-4 text-4xl font-extrabold leading-[1.05] md:text-6xl">
                      {s.title.map((line, k) => (
                        <span key={line} className="block overflow-hidden pb-1">
                          <span className="hero-line block" style={{ '--d': `${0.2 + k * 0.12}s` } as CSSProperties}>
                            {k === 1 ? <span className="bg-gradient-to-r from-accent to-amber-200 bg-clip-text text-transparent">{line}</span> : line}
                          </span>
                        </span>
                      ))}
                    </h2>
                    <p className="hero-in mt-5 max-w-md text-lg text-white/75" style={{ '--d': '0.5s' } as CSSProperties}>{s.text}</p>

                    {s.kind === 'switch' && (
                      <div className="hero-in swiper-no-swiping mt-6 flex flex-wrap items-center gap-x-8 gap-y-4" style={{ '--d': '0.6s' } as CSSProperties}>
                        <div>
                          <p className="mb-2 text-[11px] uppercase tracking-widest text-white/50">Color · {color}</p>
                          <div className="flex gap-3">
                            {COLORS.map((c) => (
                              <button
                                key={c}
                                aria-label={c}
                                title={c}
                                onClick={() => setColor(c)}
                                className={`h-8 w-8 cursor-pointer rounded-full border-2 transition-all ${color === c ? 'scale-110 border-accent ring-4 ring-accent/25' : 'border-white/30 hover:border-white'}`}
                                style={{ background: colorHex[c] }}
                              />
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="mb-2 text-[11px] uppercase tracking-widest text-white/50">Tomas</p>
                          <div className="flex gap-2">
                            {TOMAS.map((t) => (
                              <button
                                key={t}
                                onClick={() => setTomas(t)}
                                className={`h-8 w-9 cursor-pointer rounded-md border text-sm font-bold transition-colors ${tomas === t ? 'border-accent bg-accent text-brand-dark' : 'border-white/30 hover:border-white'}`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="hero-in mt-6 flex flex-wrap gap-2" style={{ '--d': '0.68s' } as CSSProperties}>
                      {s.chips.map((c) => (
                        <span key={c} className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs backdrop-blur">{c}</span>
                      ))}
                    </div>
                    <div className="hero-in mt-8 flex flex-wrap items-center gap-3" style={{ '--d': '0.8s' } as CSSProperties}>
                      <Link to={to} className="btn btn-accent group px-7 py-3.5 text-base">
                        {s.cta} <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                      </Link>
                      <Link to="/ofertas" className="btn border border-white/30 px-7 py-3.5 text-base text-white hover:bg-white/10">Ver ofertas</Link>
                    </div>
                  </div>

                  {/* Escenario: producto recortado, sin marcos */}
                  <div className="relative order-first mx-auto h-[300px] w-full max-w-[560px] sm:h-[380px] md:order-none md:h-[640px]">
                    {image && product && (
                      <>
                        <div className="hero-aura absolute left-1/2 top-1/2 aspect-square w-[95%] -translate-x-1/2 -translate-y-1/2 rounded-full" />
                        <div className="hero-prod-in absolute inset-0">
                          <div className="hero-float absolute inset-x-0 top-[4%] bottom-[10%] flex items-center justify-center">
                            <div className="hero-tilt h-full">
                              <img key={image} src={image} alt={product.name} className="hero-swap h-full w-auto max-w-full object-contain" />
                            </div>
                          </div>
                          <div className="hero-floor absolute bottom-[3%] left-1/2 h-8 w-[55%] -translate-x-1/2 rounded-full" />
                        </div>

                        {/* Hotspots */}
                        {s.spots?.map((sp, k) => (
                          <div
                            key={sp.label}
                            className={`hero-pop absolute z-20 hidden items-center gap-0 md:flex ${sp.side === 'l' ? 'flex-row-reverse' : ''}`}
                            style={{ ...(sp.side === 'l' ? { right: `${100 - sp.x}%` } : { left: `${sp.x}%` }), top: `${sp.y}%`, '--d': `${1 + k * 0.18}s` } as unknown as CSSProperties}
                          >
                            <span className="hero-spot-dot h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
                            <span className="hero-spot-line h-px w-24 bg-accent/70" style={{ '--d': `${1.1 + k * 0.18}s` } as CSSProperties} />
                            <span className={`whitespace-nowrap rounded-lg border border-white/15 bg-neutral-900/55 px-3 py-1.5 backdrop-blur-md ${sp.side === 'l' ? 'text-right' : ''}`}>
                              <span className="block text-xs font-bold">{sp.label}</span>
                              <span className="block text-[11px] text-white/60">{sp.detail}</span>
                            </span>
                          </div>
                        ))}

                        {/* Precio + añadir al carrito */}
                        <div className="hero-pop swiper-no-swiping absolute bottom-0 right-0 z-20 flex items-center gap-4 rounded-2xl border border-white/15 bg-neutral-900/60 py-3 pl-5 pr-3 backdrop-blur-md" style={{ '--d': '1.4s' } as CSSProperties}>
                          <div>
                            <p className="text-[11px] uppercase tracking-widest text-white/60">{s.kind === 'switch' ? `${color} · ${tomas} ${tomas === '1' ? 'toma' : 'tomas'}` : 'Cerradura'}</p>
                            <p key={product.price} className="hero-swap text-2xl font-extrabold text-accent">{money(product.price)}</p>
                          </div>
                          <button onClick={() => quickAdd(product.id)} aria-label="Añadir al carrito" title="Añadir al carrito" className="grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-accent text-brand-dark transition-transform hover:scale-110">
                            <Plus size={22} />
                          </button>
                        </div>
                      </>
                    )}

                    {s.kind === 'cable' && (
                      <div className="absolute inset-0 flex flex-col items-start justify-center gap-4 md:items-end">
                        {[
                          { icon: Zap, t: '100% Cobre', d: 'Máxima conductividad' },
                          { icon: ShieldCheck, t: 'Antillama', d: 'Instalaciones seguras' },
                        ].map((f, k) => (
                          <div key={f.t} className="hero-pop flex w-full max-w-xs items-center gap-4 rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-md" style={{ '--d': `${0.7 + k * 0.2}s`, marginRight: k ? '2.5rem' : 0 } as CSSProperties}>
                            <span className="rounded-xl bg-accent p-3 text-brand-dark"><f.icon size={24} /></span>
                            <div><p className="text-lg font-bold">{f.t}</p><p className="text-sm text-white/70">{f.d}</p></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <span className="sr-only">Slide {i + 1} de {slides.length}</span>
              </div>
            </SwiperSlide>
          )
        })}
      </Swiper>

      {/* Navegación vertical (derecha) */}
      <div className="absolute right-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-3 md:flex">
        <button aria-label="Anterior" onClick={() => swiper.current?.slidePrev()} className="cursor-pointer rounded-full border border-white/20 p-2 text-white/70 transition-colors hover:bg-accent hover:text-brand-dark">
          <ChevronUp size={18} />
        </button>
        {slides.map((s, i) => (
          <button key={s.tab} onClick={() => swiper.current?.slideTo(i)} aria-label={`Ir a ${s.tab}`} className="group flex cursor-pointer flex-col items-center gap-2">
            <span className={`text-xs font-bold transition-colors ${i === active ? 'text-accent' : 'text-white/40 group-hover:text-white'}`}>0{i + 1}</span>
            <span className="relative block h-12 w-[3px] overflow-hidden rounded bg-white/20">
              {i === active && <span key={active} className="hero-progress absolute left-0 top-0 rounded bg-accent" style={{ animationDuration: `${DELAY}ms` }} />}
              {i < active && <span className="absolute inset-0 rounded bg-accent/50" />}
            </span>
          </button>
        ))}
        <button aria-label="Siguiente" onClick={() => swiper.current?.slideNext()} className="cursor-pointer rounded-full border border-white/20 p-2 text-white/70 transition-colors hover:bg-accent hover:text-brand-dark">
          <ChevronDown size={18} />
        </button>
      </div>

      {/* Puntos en móvil */}
      <div className="absolute inset-x-0 bottom-4 z-30 flex justify-center gap-2 md:hidden">
        {slides.map((s, i) => (
          <button key={s.tab} aria-label={`Ir a ${s.tab}`} onClick={() => swiper.current?.slideTo(i)} className={`h-2 cursor-pointer rounded-full transition-all ${i === active ? 'w-6 bg-accent' : 'w-2 bg-white/40'}`} />
        ))}
      </div>
    </section>
  )
}


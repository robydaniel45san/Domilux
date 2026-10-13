import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Keyboard, Navigation } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import type { Swiper as SwiperType } from 'swiper'
import 'swiper/css'
import ProductCard from './ProductCard'
import type { Product } from '../types'

const arrow =
  'absolute top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-neutral-200 bg-white text-brand shadow-md transition hover:bg-accent hover:text-brand-dark disabled:cursor-default disabled:opacity-0'

/** Carrusel de una sola fila: 2 tarjetas en móvil, 3 en tablet, 4 en escritorio. */
export default function ProductCarousel({ items }: { items: Product[] }) {
  const [sw, setSw] = useState<SwiperType | null>(null)
  const [edge, setEdge] = useState({ start: true, end: false })
  const sync = (s: SwiperType) => setEdge({ start: s.isBeginning, end: s.isEnd })

  return (
    <div className="relative">
      <Swiper
        modules={[Navigation, Keyboard]}
        keyboard
        grabCursor
        slidesPerView={2}
        spaceBetween={12}
        slidesPerGroup={1}
        breakpoints={{ 640: { slidesPerView: 3, spaceBetween: 16 }, 1024: { slidesPerView: 4, spaceBetween: 16 } }}
        onSwiper={(s) => {
          setSw(s)
          sync(s)
        }}
        onSlideChange={sync}
        onResize={sync}
        onBreakpoint={sync}
        className="!pb-1"
      >
        {items.map((p) => (
          <SwiperSlide key={p.id} className="!h-auto">
            <ProductCard p={p} />
          </SwiperSlide>
        ))}
      </Swiper>

      <button aria-label="Productos anteriores" disabled={edge.start} onClick={() => sw?.slidePrev()} className={`${arrow} -left-3 md:-left-5`}>
        <ChevronLeft size={20} />
      </button>
      <button aria-label="Productos siguientes" disabled={edge.end} onClick={() => sw?.slideNext()} className={`${arrow} -right-3 md:-right-5`}>
        <ChevronRight size={20} />
      </button>
    </div>
  )
}

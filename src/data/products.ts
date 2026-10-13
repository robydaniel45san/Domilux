import raw from './products.json'
import type { Product } from '../types'
import { createStore, useStoreValue } from '../store/persist'

/**
 * Catálogo "vivo": parte del JSON sincronizado desde WooCommerce y le aplica los cambios del panel admin
 * (ediciones, productos nuevos y eliminados) guardados en localStorage.
 *  - `allProducts`: todo el catálogo (lo usa el admin).
 *  - `products`: solo los activos (lo usa la tienda).
 * Ambos arrays se mutan en sitio para que los imports existentes sigan funcionando.
 */
const base = raw as Product[]

interface Patch {
  edits: Record<number, Partial<Product>>
  added: Product[]
  deleted: number[]
}

const patchStore = createStore<Patch>('dl-catalog', () => ({ edits: {}, added: [], deleted: [] }))

export const allProducts: Product[] = []
export const products: Product[] = []
export const categories: string[] = []
export const colors: string[] = []

function rebuild() {
  const p = patchStore.get()
  const merged = [...base, ...p.added]
    .filter((x) => !p.deleted.includes(x.id))
    .map((x) => ({ ...x, ...p.edits[x.id] }))
  allProducts.splice(0, allProducts.length, ...merged)
  products.splice(0, products.length, ...merged.filter((x) => x.active !== false))
  categories.splice(0, categories.length, ...new Set(merged.map((x) => x.category)))
  colors.splice(0, colors.length, ...new Set(merged.map((x) => x.color).filter(Boolean) as string[]))
}
rebuild()
patchStore.subscribe(rebuild) // se suscribe primero: los arrays se actualizan antes de que re-rendericen los componentes

export const useCatalog = () => useStoreValue(patchStore)

export const getProduct = (slug: string) => products.find((p) => p.slug === slug)
export const getProductById = (id: number) => allProducts.find((p) => p.id === id)

export const saveProduct = (id: number, patch: Partial<Product>) =>
  patchStore.set((s) => ({ ...s, edits: { ...s.edits, [id]: { ...s.edits[id], ...patch } } }))

export const adjustStock = (id: number, delta: number) => {
  const cur = getProductById(id)
  if (cur) saveProduct(id, { stock: Math.max(0, cur.stock + delta) })
}

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export function createProduct(data: Pick<Product, 'name' | 'price' | 'category'> & Partial<Product>): Product {
  const id = Math.max(100000, ...allProducts.map((p) => p.id)) + 1
  let slug = slugify(data.name) || `producto-${id}`
  while (allProducts.some((p) => p.slug === slug)) slug += '-2'
  const p: Product = {
    regularPrice: data.price,
    onSale: false,
    images: [],
    features: [],
    color: null,
    tomas: null,
    rating: 0,
    reviews: 0,
    sku: `DL-${id}`,
    tags: [],
    brand: null,
    sold: 0,
    stock: 0,
    bullets: [],
    descImages: [],
    attributes: [],
    reviewList: [],
    active: true,
    ...data,
    id,
    slug,
  }
  patchStore.set((s) => ({ ...s, added: [...s.added, p] }))
  return p
}

export const duplicateProduct = (id: number) => {
  const src = getProductById(id)
  if (!src) return
  const { id: _id, slug: _slug, ...rest } = src
  void _id
  void _slug
  return createProduct({ ...rest, name: `${src.name} (copia)`, sku: '', active: false })
}

export const removeProduct = (id: number) =>
  patchStore.set((s) => ({ ...s, added: s.added.filter((p) => p.id !== id), deleted: [...s.deleted, id] }))

export const resetCatalog = () => patchStore.reset()

/** Marca de oferta coherente: si el precio de venta es menor al regular, está en oferta. */
export const isOnSale = (price: number, regular: number) => regular > 0 && price < regular

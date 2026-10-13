import raw from './products.json'
import type { Product } from '../types'

export const products = raw as Product[]
export const getProduct = (slug: string) => products.find((p) => p.slug === slug)
export const getProductById = (id: number) => products.find((p) => p.id === id)
export const categories = [...new Set(products.map((p) => p.category))]
export const colors = [...new Set(products.map((p) => p.color).filter(Boolean))] as string[]

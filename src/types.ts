export interface Product {
  id: number
  name: string
  slug: string
  price: number
  regularPrice: number
  onSale: boolean
  images: string[]
  features: string[]
  category: string
  color: string | null
  tomas: string | null
  rating: number
  reviews: number
  sku: string
  tags: string[]
  brand: string | null
  sold: number
  stock: number
  bullets: string[]
  descImages: string[]
  attributes: { name: string; value: string }[]
  reviewList: Review[]
}

export interface Review {
  author: string
  date: string
  rating: number
  text: string
}

export interface CartItem {
  id: number
  qty: number
}

export interface User {
  name: string
  email: string
}

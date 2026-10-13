// Descarga los productos reales de la tienda WooCommerce a src/data/products.json
// 1) Store API pública (precios, imágenes, categorías)  2) Scraping de cada ficha (galería, descripción, reseñas, SKU...)
import { writeFileSync } from 'node:fs'
import * as cheerio from 'cheerio'

const BASE = (process.env.DOMILUX_URL ?? 'https://domilux.shop').replace(/\/$/, '')
const UA = { 'User-Agent': 'Mozilla/5.0 (domilux-mockup sync)' }
const strip = (h) => h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim()
const num = (s) => Number((s ?? '').toString().replace(/[^\d.]/g, '')) || 0

const raw = await fetch(`${BASE}/wp-json/wc/store/v1/products?per_page=100`, { headers: UA }).then((r) => r.json())

async function scrape(url) {
  const html = await fetch(url, { headers: UA }).then((r) => r.text())
  const $ = cheerio.load(html)
  const text = (el) => $(el).text().replace(/\s+/g, ' ').trim()

  const gallery = [
    ...new Set(
      $('.woocommerce-product-gallery__image a')
        .map((_, a) => $(a).attr('href'))
        .get()
        .filter(Boolean),
    ),
  ]
  const desc = $('#tabs-list-description')
  // Algunos <li> traen varias líneas separadas por <br>: se parten en viñetas distintas
  const bullets = desc
    .find('li')
    .map((_, li) => ($(li).html() ?? '').split(/<br\s*\/?>/i).map((part) => cheerio.load(`<i>${part}</i>`)('i').text().replace(/\s+/g, ' ').trim()))
    .get()
    .flat()
    .filter(Boolean)
  const paragraphs = desc.find('p').map((_, p) => text(p)).get().filter((t) => t && t.length > 2)
  const descImages = [
    ...new Set(
      desc
        .find('img')
        .map((_, i) => $(i).attr('data-src') || $(i).attr('src'))
        .get()
        .filter((s) => s && !s.startsWith('data:')),
    ),
  ]
  const attributes = $('.woocommerce-product-attributes tr')
    .map((_, tr) => ({ name: text($(tr).find('th')), value: text($(tr).find('td')) }))
    .get()
  const reviews = $('li.review')
    .map((_, li) => ({
      author: text($(li).find('.woocommerce-review__author')) || 'Cliente',
      date: text($(li).find('.woocommerce-review__published-date')),
      rating: num($(li).find('.star-rating strong.rating').first().text()) || num($(li).find('.star-rating').attr('aria-label')),
      text: text($(li).find('.description')),
    }))
    .get()
  const meta = $('.product_meta')
  return {
    gallery,
    bullets,
    paragraphs,
    descImages,
    attributes,
    reviews,
    sku: text(meta.find('.sku')),
    tags: meta.find('.tagged_as a').map((_, a) => text(a)).get(),
    brand: meta.find('.posted_in').filter((_, e) => /Marca/.test($(e).text())).find('a').first().text().trim() || null,
    sold: num($('.rate-sold .count').first().text()),
    stock: num(text($('.stock').first()).replace(/Disponibilidad:?/i, '')),
    rating: num($('.woocommerce-product-rating strong.rating').first().text()),
    reviewCount: num($('.woocommerce-product-rating .count').first().text()),
  }
}

const products = []
for (const x of raw) {
  let extra = {}
  try {
    extra = await scrape(x.permalink)
  } catch (e) {
    console.warn(`  ! no se pudo leer ${x.permalink}: ${e.message}`)
  }
  const features = strip(x.short_description).split(/\n+/).map((s) => s.trim()).filter(Boolean)
  products.push({
    id: x.id,
    name: x.name,
    slug: x.slug,
    price: Number(x.prices.price) / 100,
    regularPrice: Number(x.prices.regular_price) / 100,
    onSale: x.on_sale,
    images: extra.gallery?.length ? extra.gallery : x.images.map((i) => i.src),
    features,
    category: x.categories[0]?.name ?? 'Domotica',
    color: x.attributes.find((a) => a.name === 'Color')?.terms[0]?.name ?? null,
    tomas: x.attributes.find((a) => a.name === 'Tomas')?.terms[0]?.name ?? null,
    rating: extra.rating || Number(x.average_rating) || 0,
    reviews: extra.reviewCount ?? (x.review_count || 0),
    sku: extra.sku || '',
    tags: extra.tags ?? [],
    brand: extra.brand ?? null,
    sold: extra.sold ?? 0,
    stock: extra.stock ?? 0,
    bullets: extra.bullets ?? [],
    descImages: extra.descImages ?? [],
    attributes: extra.attributes ?? [],
    reviewList: extra.reviews ?? [],
  })
  console.log(`${x.id} ${x.name} · galería ${extra.gallery?.length ?? 0} · desc-img ${extra.descImages?.length ?? 0} · reseñas ${extra.reviews?.length ?? 0}`)
}
writeFileSync('src/data/products.json', JSON.stringify(products, null, 2))
console.log(`\n${products.length} productos guardados`)

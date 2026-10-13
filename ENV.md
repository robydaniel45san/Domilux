# Variables de entorno

El archivo `.env` real **no se sube a git** (está en `.gitignore`). Aquí se documenta qué variables existen;
la plantilla vacía es [`.env.example`](.env.example).

Para usarlas:

```bash
cp .env.example .env     # en Windows: copy .env.example .env
```

## Variables actuales

| Variable | Obligatoria | Valor por defecto | Para qué sirve |
|---|---|---|---|
| `DOMILUX_URL` | No | `https://domilux.shop` | Tienda WooCommerce de la que `npm run sync-products` descarga los productos (Store API pública + fichas). |

El script la lee desde el entorno de la terminal. Ejemplo sin crear `.env`:

```bash
DOMILUX_URL=https://domilux.shop npm run sync-products          # Linux / macOS / Git Bash
$env:DOMILUX_URL="https://domilux.shop"; npm run sync-products  # PowerShell
```

## Panel administrativo (`/admin`)

| Variable | Obligatoria | Valor por defecto | Para qué sirve |
|---|---|---|---|
| `VITE_ADMIN_USER` | No | `admin` | Usuario para entrar a `/admin`. |
| `VITE_ADMIN_PASS` | No | `domilux` | Contraseña para entrar a `/admin`. |

> **Importante:** las variables `VITE_*` se incrustan en el JavaScript que descarga el navegador, así que cualquiera
> puede leerlas. Este acceso es **solo para el mockup** y no protege nada. Antes de producción, el panel debe
> autenticarse contra un backend.

Los datos del panel (pedidos, cupones, ajustes, ediciones de productos) se guardan en `localStorage` del navegador;
no hay variables de base de datos todavía.

## Lo que el mockup NO necesita

Hoy la app es solo frontend: no usa claves de API, base de datos ni pasarela de pagos. El catálogo base sale del
archivo estático `src/data/products.json` y el panel `/admin` guarda sus cambios en el navegador.

## Variables previstas al conectar el backend real

Aún **no se usan**; son una guía para cuando el carrito y el checkout se conecten a WooCommerce. Las variables que
empiezan con `VITE_` quedan visibles en el navegador, así que **nunca** pongas ahí secretos.

| Variable | Visible en el navegador | Uso previsto |
|---|---|---|
| `VITE_API_URL` | Sí | URL base de la API / Store API del backend. |
| `WC_CONSUMER_KEY` | No (solo servidor) | Clave de la API REST de WooCommerce. |
| `WC_CONSUMER_SECRET` | No (solo servidor) | Secreto de la API REST de WooCommerce. |

> Las claves `WC_*` solo deben vivir en un backend propio, nunca en el código del frontend.

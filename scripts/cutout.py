"""Quita el fondo blanco de las fotos de producto del hero y las guarda como WebP con transparencia.

Uso: python scripts/cutout.py
Entrada: src/data/products.json (imagen principal de cada producto usado en el hero)
Salida:  public/cutouts/<slug>.webp
"""
import io
import json
import re
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "cutouts"
OUT.mkdir(parents=True, exist_ok=True)

products = json.loads((ROOT / "src/data/products.json").read_text(encoding="utf-8"))

# Mismos productos que elige el hero: interruptores Touch (sin oferta) por color+tomas, y la cerradura
wanted = {}
for color in ("Blanco", "Negro", "Gris"):
    for t in ("1", "2", "3"):
        p = next((p for p in products if re.search("Touch", p["name"]) and not p["onSale"]
                  and p["color"] == color and (p["tomas"] or "").startswith(t)), None)
        if p:
            wanted[p["slug"]] = p
lock = next(p for p in products if p["slug"] == "cerradura-inteligente")
wanted[lock["slug"]] = lock

TOL = 12  # tolerancia respecto al blanco puro para considerar "fondo"


def cutout(img: Image.Image) -> Image.Image:
    rgb = np.asarray(img.convert("RGB")).astype(np.int16)
    near_white = (255 - rgb).max(axis=2) <= TOL
    labels, _ = ndimage.label(near_white)
    border = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    border = border[border != 0]
    bg = np.isin(labels, border)  # solo el blanco conectado con el borde = fondo
    fg = ~bg
    fg = ndimage.binary_opening(fg, iterations=1)
    # quita islas pequeñas (motas) y rellena huecos
    lab, n = ndimage.label(fg)
    if n > 1:
        sizes = ndimage.sum(fg, lab, range(1, n + 1))
        fg = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= 0.02 * fg.sum()])
    fg = ndimage.binary_fill_holes(fg)
    alpha = Image.fromarray((fg * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.1))
    out = img.convert("RGBA")
    out.putalpha(alpha)
    bbox = out.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox()
    if bbox:
        pad = 12
        bbox = (max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(out.width, bbox[2] + pad), min(out.height, bbox[3] + pad))
        out = out.crop(bbox)
    out.thumbnail((1000, 1000), Image.LANCZOS)
    return out


for slug, p in wanted.items():
    url = p["images"][0]
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    data = urllib.request.urlopen(req, timeout=30).read()
    res = cutout(Image.open(io.BytesIO(data)))
    res.save(OUT / f"{slug}.webp", "WEBP", quality=92, method=6)
    print(f"{slug}: {res.size}")

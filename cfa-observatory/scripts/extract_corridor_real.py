"""
Extractor reproducible de datos satelitales reales para el Corredor Costero de Rivas
(Ostional -> San Juan del Sur -> Playa Gigante / Tola).

Fuentes científicas objetivo (100% abiertas, sin API keys privadas):
  1. GHSL (Copernicus / JRC, 100 m):
     - GHS_BUILT_S (Superficie construida por época: 1995, 2005, 2015, 2020, 2025, 2030)
     - GHS_BUILT_H (Altura de edificación, 2018)
     - GHS_POP     (Población residente por celda de 100 m)
  2. Luces nocturnas armonizadas / NASA VIIRS:
     - Harmonized Global Nighttime Light (1992-2021+) / VIIRS VNP46A4 (2012-2024)

Uso:
  python3 -m venv .venv && source .venv/bin/activate
  pip install rasterio numpy shapely
  python scripts/extract_corridor_real.py --ghsl-dir ./raw/ghsl --ntl-dir ./raw/ntl --out src/data/corridor-real.json
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import numpy as np

# Bounding box exacto del corredor Ostional -> San Juan del Sur -> Playa Gigante / Tola
CORRIDOR_BBOX = (-86.09, 11.07, -85.71, 11.43)  # (west, south, east, north)

HUBS = {
    "ostional": {"lat": 11.114, "lon": -85.764, "radius_deg": 0.025},
    "sjds": {"lat": 11.253, "lon": -85.870, "radius_deg": 0.035},
    "gigante": {"lat": 11.377, "lon": -86.032, "radius_deg": 0.030},
}


def clip_raster_to_bbox(tif_path: Path, bbox: tuple[float, float, float, float]) -> tuple[np.ndarray, Any]:
    import rasterio
    from rasterio.windows import from_bounds
    from rasterio.warp import transform_bounds

    with rasterio.open(tif_path) as src:
        if src.crs and src.crs.to_epsg() != 4326:
            bounds = transform_bounds("EPSG:4326", src.crs, *bbox)
        else:
            bounds = bbox
        window = from_bounds(*bounds, transform=src.transform)
        data = src.read(1, window=window).astype(np.float32)
        transform = src.window_transform(window)
        nodata = src.nodata
        if nodata is not None:
            data = np.where(data == nodata, 0.0, data)
        return np.maximum(data, 0.0), (transform, src.crs)


def summarize_ntl(ntl_dir: Path) -> dict[str, dict[int, float]]:
    """Extrae la radiancia media normalizada (0-100) por polo a partir de GeoTIFFs anuales."""
    out: dict[str, dict[int, float]] = {k: {} for k in HUBS}
    if not ntl_dir.exists():
        return out

    tif_files = sorted(ntl_dir.glob("*.tif"))
    for tif in tif_files:
        # Espera nombre con año de 4 dígitos, ej. NTL_2015.tif
        digits = "".join(ch for ch in tif.stem if ch.isdigit())
        if len(digits) < 4:
            continue
        year = int(digits[:4])
        arr, (transform, _) = clip_raster_to_bbox(tif, CORRIDOR_BBOX)
        rows, cols = arr.shape
        for hub_id, cfg in HUBS.items():
            # Ventana aproximada alrededor del polo
            r_vals = []
            for r in range(rows):
                for c in range(cols):
                    lon, lat = transform * (c + 0.5, r + 0.5)
                    if ((lat - cfg["lat"]) ** 2 + (lon - cfg["lon"]) ** 2) ** 0.5 <= cfg["radius_deg"]:
                        r_vals.append(float(arr[r, c]))
            if r_vals:
                out[hub_id][year] = round(float(np.mean(r_vals)), 3)
    return out


def extract_ghsl_cells(ghsl_dir: Path) -> list[dict[str, Any]]:
    """Extrae celdas de 100 m con superficie construida > 0, altura y población."""
    built_files = sorted(ghsl_dir.glob("*BUILT_S*.tif"))
    height_files = sorted(ghsl_dir.glob("*BUILT_H*.tif"))
    pop_files = sorted(ghsl_dir.glob("*POP*.tif"))

    if not built_files:
        raise FileNotFoundError(f"No se encontraron archivos *BUILT_S*.tif en {ghsl_dir}")

    built_arr, (transform, _) = clip_raster_to_bbox(built_files[-1], CORRIDOR_BBOX)
    height_arr = clip_raster_to_bbox(height_files[0], CORRIDOR_BBOX)[0] if height_files else None
    pop_arr = clip_raster_to_bbox(pop_files[0], CORRIDOR_BBOX)[0] if pop_files else None

    cells: list[dict[str, Any]] = []
    rows, cols = built_arr.shape
    for r in range(rows):
        for c in range(cols):
            built_m2 = float(built_arr[r, c])
            if built_m2 < 250.0:  # Filtra ruido sub-umbral (< 2.5% de celda de 100x100m)
                continue
            lon, lat = transform * (c + 0.5, r + 0.5)
            h_m = float(height_arr[r, c]) if height_arr is not None else 4.0
            pop = float(pop_arr[r, c]) if pop_arr is not None else 0.0
            cells.append({
                "lat": round(lat, 5),
                "lon": round(lon, 5),
                "built_m2": round(built_m2, 1),
                "height_m": round(max(3.0, h_m), 1),
                "pop": round(pop, 1),
            })
    return cells


def main() -> None:
    parser = argparse.ArgumentParser(description="Extractor GHSL + NTL para Corredor Pacífico Sur")
    parser.add_argument("--ghsl-dir", type=Path, required=True, help="Carpeta con GeoTIFFs GHSL (100 m)")
    parser.add_argument("--ntl-dir", type=Path, default=Path("./raw/ntl"), help="Carpeta con GeoTIFFs NTL anuales")
    parser.add_argument("--out", type=Path, default=Path("src/data/corridor-real.json"), help="Archivo JSON de salida")
    args = parser.parse_args()

    cells = extract_ghsl_cells(args.ghsl_dir)
    ntl = summarize_ntl(args.ntl_dir)

    payload = {
        "bbox": CORRIDOR_BBOX,
        "sources": [
            "Copernicus / JRC GHSL 100m (BUILT_S, BUILT_H, POP)",
            "Harmonized DMSP-OLS / NASA VIIRS Black Marble",
        ],
        "cell_count": len(cells),
        "ntl_summary": ntl,
        "cells": cells,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    print(f"Exportadas {len(cells)} celdas reales a {args.out}")


if __name__ == "__main__":
    main()

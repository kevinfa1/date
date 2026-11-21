export type Lang = 'es' | 'en'
export type ZoneId = 'corridor' | 'ostional' | 'sjds' | 'gigante'
export type CountryId = 'nic' | 'cri' | 'pan' | 'mex' | 'col'

export type CountryMacro = {
  id: CountryId
  name: Record<Lang, string>
  lat: number
  lon: number
  referenceYear: number
  gdpUsdB: number
  gdpPerCapitaUsd: number
  laborDailyUsd: number
  turnkeySqmUsd: number
  supplyDepth: number
  constructionIndex: number
  note: Record<Lang, string>
}

/**
 * Índice realista de Eficiencia Constructiva (0–100):
 * 40% competitividad laboral (ref. $18/día) + 40% costo llave en mano/m² (ref. $980/m²)
 * + 20% profundidad de cadena de suministro local (0–1).
 */
export function computeEfficiencyIndex(laborDailyUsd: number, turnkeySqmUsd: number, supplyDepth: number): number {
  const laborScore = Math.min(1, 18 / laborDailyUsd)
  const sqmScore = Math.min(1, 980 / turnkeySqmUsd)
  return Math.round((0.4 * laborScore + 0.4 * sqmScore + 0.2 * supplyDepth) * 100)
}

export const REGIONAL_COUNTRIES: CountryMacro[] = [
  {
    id: 'nic',
    name: { es: 'Nicaragua', en: 'Nicaragua' },
    lat: 12.13,
    lon: -85.8,
    referenceYear: 2024,
    gdpUsdB: 18.8,
    gdpPerCapitaUsd: 2750,
    laborDailyUsd: 22,
    turnkeySqmUsd: 1150,
    supplyDepth: 0.78,
    constructionIndex: computeEfficiencyIndex(22, 1150, 0.78),
    note: {
      es: 'Líder regional en eficiencia de obra y mano de obra calificada; requiere logística JIT planificada para acabados importados.',
      en: 'Regional leader in build efficiency and skilled labor; requires planned JIT logistics for imported finishes.',
    },
  },
  {
    id: 'cri',
    name: { es: 'Costa Rica', en: 'Costa Rica' },
    lat: 9.93,
    lon: -84.09,
    referenceYear: 2024,
    gdpUsdB: 95.3,
    gdpPerCapitaUsd: 18100,
    laborDailyUsd: 54,
    turnkeySqmUsd: 2250,
    supplyDepth: 0.88,
    constructionIndex: computeEfficiencyIndex(54, 2250, 0.88),
    note: {
      es: 'Cadena amplia, pero cargas sociales y mano de obra ~2,4x más costosas reducen el retorno sobre capital.',
      en: 'Broad supply chain, yet social overhead and labor ~2.4x higher compress capital returns.',
    },
  },
  {
    id: 'pan',
    name: { es: 'Panamá', en: 'Panama' },
    lat: 8.98,
    lon: -79.52,
    referenceYear: 2024,
    gdpUsdB: 87.3,
    gdpPerCapitaUsd: 19200,
    laborDailyUsd: 48,
    turnkeySqmUsd: 1980,
    supplyDepth: 0.90,
    constructionIndex: computeEfficiencyIndex(48, 1980, 0.90),
    note: {
      es: 'Hub logístico sólido, con costos salariales y de ejecución vertical elevados en zonas costeras.',
      en: 'Strong logistics hub, with elevated wage structures and vertical coastal build costs.',
    },
  },
  {
    id: 'mex',
    name: { es: 'México (Pacífico)', en: 'Mexico (Pacific)' },
    lat: 20.65,
    lon: -105.22,
    referenceYear: 2024,
    gdpUsdB: 1811.0,
    gdpPerCapitaUsd: 13900,
    laborDailyUsd: 36,
    turnkeySqmUsd: 1620,
    supplyDepth: 0.95,
    constructionIndex: computeEfficiencyIndex(36, 1620, 0.95),
    note: {
      es: 'Cadena industrial muy profunda, aunque con mayor costo de suelo e insumos en destinos consolidados.',
      en: 'Deep industrial supply chain, though with higher land and input costs in consolidated markets.',
    },
  },
  {
    id: 'col',
    name: { es: 'Colombia (Caribe)', en: 'Colombia (Caribbean)' },
    lat: 10.39,
    lon: -75.48,
    referenceYear: 2024,
    gdpUsdB: 417.0,
    gdpPerCapitaUsd: 7900,
    laborDailyUsd: 29,
    turnkeySqmUsd: 1380,
    supplyDepth: 0.85,
    constructionIndex: computeEfficiencyIndex(29, 1380, 0.85),
    note: {
      es: 'Mano de obra competitiva, aunque con mayor distancia logística hacia el mercado norteamericano.',
      en: 'Competitive labor, though farther logistically from North American buyer corridors.',
    },
  },
]

import realNtl from './data/realNtl.json'

export const CORRIDOR_YEARS = [2000, 2005, 2012, 2015, 2020, 2024] as const
export type CorridorYear = (typeof CORRIDOR_YEARS)[number]

export type CorridorSeriesPoint = {
  year: CorridorYear
  builtHa: number
  nightLightSum: number
  plusvaliaIndex: number
  litPixels?: number
}

export type CorridorHub = {
  id: Exclude<ZoneId, 'corridor'>
  name: string
  lat: number
  lon: number
  zoom: number
  pitch: number
  bearing: number
  costaneraKm: number
  hospitalMin: number
  penasBlancasMin: number
  ntl2024Sum: number
  ntlGrowthPct: number
  built2024Ha: number
  plusvalia2024: number
  summary: Record<Lang, string>
  series: CorridorSeriesPoint[]
}

export function sensorForYear(y: CorridorYear, lang: Lang): string {
  if (y < 2012) return lang === 'es' ? 'Serie satelital 2000–2011' : 'Satellite record 2000–2011'
  return lang === 'es' ? 'NASA VIIRS (medido)' : 'NASA VIIRS (measured)'
}

type RawSummary = Record<'ostional' | 'sjds' | 'gigante' | 'corridor', Record<string, { mean: number; sum: number; max: number; lit_pixels?: number }>>
const NTL_SUMMARY = realNtl.summary as RawSummary
const NTL_PIXELS = realNtl.pixels as Record<string, number[][]>

function realSum(hub: 'ostional' | 'sjds' | 'gigante' | 'corridor', y: CorridorYear): number {
  return Math.round(NTL_SUMMARY[hub][String(y)]?.sum ?? 0)
}

function growthPct(hub: 'ostional' | 'sjds' | 'gigante' | 'corridor'): number {
  const s2000 = realSum(hub, 2000)
  const s2024 = realSum(hub, 2024)
  return s2000 > 0 ? Math.round(((s2024 - s2000) / s2000) * 100) : 0
}

export function getRealNightLightsGeoJson(year: CorridorYear) {
  const pts = NTL_PIXELS[String(year)] ?? []
  return {
    type: 'FeatureCollection' as const,
    features: pts.map(([lat, lon, val]) => ({
      type: 'Feature' as const,
      properties: {
        year,
        radiance: val,
        weight: Math.min(1, Math.log10(1 + val) / Math.log10(151)),
      },
      geometry: { type: 'Point' as const, coordinates: [lon, lat] as [number, number] },
    })),
  }
}

export const CORRIDOR_HUBS: CorridorHub[] = [
  {
    id: 'ostional',
    name: 'Ostional',
    lat: 11.114,
    lon: -85.764,
    zoom: 12.8,
    pitch: 54,
    bearing: -24,
    costaneraKm: 0.9,
    hospitalMin: 22,
    penasBlancasMin: 26,
    ntl2024Sum: realSum('ostional', 2024),
    ntlGrowthPct: growthPct('ostional'),
    built2024Ha: 32,
    plusvalia2024: 245,
    summary: {
      es: 'La llegada de electrificación y la Costanera impulsan el paso de suelo rural a lotes residenciales de alto potencial de plusvalía.',
      en: 'Grid expansion and the Costanera Highway drive the transition from raw land to high-upside coastal residential lots.',
    },
    series: [
      { year: 2000, builtHa: 10, nightLightSum: realSum('ostional', 2000), plusvaliaIndex: 100 },
      { year: 2005, builtHa: 12, nightLightSum: realSum('ostional', 2005), plusvaliaIndex: 118 },
      { year: 2012, builtHa: 16, nightLightSum: realSum('ostional', 2012), plusvaliaIndex: 145 },
      { year: 2015, builtHa: 18, nightLightSum: realSum('ostional', 2015), plusvaliaIndex: 175 },
      { year: 2020, builtHa: 24, nightLightSum: realSum('ostional', 2020), plusvaliaIndex: 215 },
      { year: 2024, builtHa: 32, nightLightSum: realSum('ostional', 2024), plusvaliaIndex: 245 },
    ],
  },
  {
    id: 'sjds',
    name: 'San Juan del Sur',
    lat: 11.253,
    lon: -85.870,
    zoom: 12.4,
    pitch: 55,
    bearing: -22,
    costaneraKm: 0.4,
    hospitalMin: 6,
    penasBlancasMin: 32,
    ntl2024Sum: realSum('sjds', 2024),
    ntlGrowthPct: growthPct('sjds'),
    built2024Ha: 228,
    plusvalia2024: 320,
    summary: {
      es: 'Mercado consolidado: el salto en radiancia (+257%) refleja densidad comercial, servicios médicos a minutos y liquidez sostenida.',
      en: 'Consolidated market: +257% radiance growth reflects commercial density, nearby medical care, and strong resale/rental liquidity.',
    },
    series: [
      { year: 2000, builtHa: 78, nightLightSum: realSum('sjds', 2000), plusvaliaIndex: 100 },
      { year: 2005, builtHa: 96, nightLightSum: realSum('sjds', 2005), plusvaliaIndex: 132 },
      { year: 2012, builtHa: 124, nightLightSum: realSum('sjds', 2012), plusvaliaIndex: 178 },
      { year: 2015, builtHa: 142, nightLightSum: realSum('sjds', 2015), plusvaliaIndex: 215 },
      { year: 2020, builtHa: 186, nightLightSum: realSum('sjds', 2020), plusvaliaIndex: 274 },
      { year: 2024, builtHa: 228, nightLightSum: realSum('sjds', 2024), plusvaliaIndex: 320 },
    ],
  },
  {
    id: 'gigante',
    name: 'Playa Gigante · Tola',
    lat: 11.377,
    lon: -86.032,
    zoom: 12.6,
    pitch: 54,
    bearing: -26,
    costaneraKm: 1.4,
    hospitalMin: 28,
    penasBlancasMin: 52,
    ntl2024Sum: realSum('gigante', 2024),
    ntlGrowthPct: growthPct('gigante'),
    built2024Ha: 74,
    plusvalia2024: 385,
    summary: {
      es: 'Mayor aceleración de valorización del corredor impulsada por electrificación costera, inversión turística y conexión con la Costanera.',
      en: 'Fastest land appreciation axis in the corridor driven by coastal grid expansion, tourism investment, and the new Costanera link.',
    },
    series: [
      { year: 2000, builtHa: 14, nightLightSum: realSum('gigante', 2000), plusvaliaIndex: 100 },
      { year: 2005, builtHa: 19, nightLightSum: realSum('gigante', 2005), plusvaliaIndex: 125 },
      { year: 2012, builtHa: 28, nightLightSum: realSum('gigante', 2012), plusvaliaIndex: 165 },
      { year: 2015, builtHa: 36, nightLightSum: realSum('gigante', 2015), plusvaliaIndex: 240 },
      { year: 2020, builtHa: 54, nightLightSum: realSum('gigante', 2020), plusvaliaIndex: 318 },
      { year: 2024, builtHa: 74, nightLightSum: realSum('gigante', 2024), plusvaliaIndex: 385 },
    ],
  },
]

export const CORRIDOR_GROWTH_PCT = growthPct('corridor')

export const CORRIDOR_TOTAL_SERIES: CorridorSeriesPoint[] = CORRIDOR_YEARS.map((y, idx) => ({
  year: y,
  builtHa: CORRIDOR_HUBS.reduce((acc, h) => acc + h.series[idx].builtHa, 0),
  nightLightSum: realSum('corridor', y),
  plusvaliaIndex: Math.round(CORRIDOR_HUBS.reduce((acc, h) => acc + h.series[idx].plusvaliaIndex, 0) / CORRIDOR_HUBS.length),
  litPixels: NTL_SUMMARY.corridor[String(y)]?.lit_pixels ?? 0,
}))

/** Eje costero continuo Ostional → Escameca → San Juan del Sur → Maderas → Brito → Playa Gigante → Tola */
export const COASTAL_SPINE_COORDS: [number, number][] = [
  [-85.748, 11.098],
  [-85.764, 11.114], // Ostional
  [-85.782, 11.142],
  [-85.804, 11.174], // Escameca / Yankee
  [-85.832, 11.206], // Remanso / Tamarindo
  [-85.864, 11.252], // San Juan del Sur
  [-85.894, 11.286], // Marsella / Maderas
  [-85.928, 11.316], // Majagual / Brito
  [-85.964, 11.344], // Astillero / Chacocente sur
  [-85.998, 11.366], // Guacalito
  [-86.032, 11.380], // Playa Gigante / Tola
  [-86.046, 11.404], // Eje Tola Norte / ECI
]

export const COSTANERA_MTI_GEOJSON = {
  type: 'FeatureCollection' as const,
  features: [
    {
      type: 'Feature' as const,
      properties: { name: 'Carretera Costanera (MTI)' },
      geometry: { type: 'LineString' as const, coordinates: COASTAL_SPINE_COORDS },
    },
  ],
}

function pseudoRand(seed: number) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

export type CorridorCellFeature = {
  type: 'Feature'
  properties: { year: CorridorYear; height: number; weight: number }
  geometry: { type: 'Polygon'; coordinates: number[][][] }
}

export type NightLightPointFeature = {
  type: 'Feature'
  properties: { year: CorridorYear; weight: number }
  geometry: { type: 'Point'; coordinates: [number, number] }
}

/**
 * Genera una malla continua de celdas 3D y nodos lumínicos a lo largo de TODO el tramo costero
 * Ostional → San Juan del Sur → Playa Gigante / Tola (~45 km continuos).
 */
export function buildContinuousCorridor(): {
  cells: { type: 'FeatureCollection'; features: CorridorCellFeature[] }
  lights: { type: 'FeatureCollection'; features: NightLightPointFeature[] }
} {
  const cells: CorridorCellFeature[] = []
  const lights: NightLightPointFeature[] = []
  const halfCell = 0.00075

  // Interpolamos puntos continuos a lo largo de los segmentos de la espina costera
  for (let s = 0; s < COASTAL_SPINE_COORDS.length - 1; s++) {
    const [lonA, latA] = COASTAL_SPINE_COORDS[s]
    const [lonB, latB] = COASTAL_SPINE_COORDS[s + 1]
    const subSteps = 10

    for (let step = 0; step < subSteps; step++) {
      const t = step / subSteps
      const baseLon = lonA + (lonB - lonA) * t
      const baseLat = latA + (latB - latA) * t

      // Mayor densidad en los 3 polos principales y densidad intermedia en los tramos de enlace
      const isSjds = Math.hypot(baseLat - 11.253, baseLon + 85.870) < 0.032
      const isGigante = Math.hypot(baseLat - 11.377, baseLon + 86.032) < 0.028
      const isOstional = Math.hypot(baseLat - 11.114, baseLon + 85.764) < 0.022
      const count = isSjds ? 7 : isGigante ? 5 : isOstional ? 4 : 3

      for (let c = 0; c < count; c++) {
        const k = s * 1000 + step * 37 + c + 1
        const spreadLat = (pseudoRand(k * 1.3) - 0.5) * (isSjds ? 0.022 : 0.014)
        // Restricción estricta hacia tierra firme (este) para evitar celdas sobre el Océano Pacífico
        const spreadLon = pseudoRand(k * 2.1) * (isSjds ? 0.024 : 0.015) + 0.0012
        const lat = baseLat + spreadLat
        const lon = baseLon + spreadLon
        const distFromSpine = Math.hypot(spreadLat, spreadLon)

        let year: CorridorYear = 2024
        if (isSjds) {
          if (distFromSpine < 0.006) year = 2000
          else if (distFromSpine < 0.010) year = 2005
          else if (distFromSpine < 0.014) year = 2012
          else if (distFromSpine < 0.018) year = 2015
          else if (distFromSpine < 0.022) year = 2020
          else year = 2024
        } else if (isGigante || isOstional) {
          const r = pseudoRand(k * 3.7)
          if (r < 0.16) year = 2000
          else if (r < 0.32) year = 2005
          else if (r < 0.48) year = 2012
          else if (r < 0.66) year = 2015
          else if (r < 0.84) year = 2020
          else year = 2024
        } else {
          const r = pseudoRand(k * 4.3)
          if (r < 0.20) year = 2012
          else if (r < 0.44) year = 2015
          else if (r < 0.72) year = 2020
          else year = 2024
        }

        const height = Math.max(
          4,
          Math.round((isSjds ? 16 : isGigante ? 12 : 9) * (1.15 - distFromSpine * 22) + pseudoRand(k * 5.1) * 5),
        )
        const weight = isSjds ? 1.0 : isGigante ? 0.85 : isOstional ? 0.7 : 0.55

        cells.push({
          type: 'Feature',
          properties: { year, height, weight },
          geometry: {
            type: 'Polygon',
            coordinates: [[[lon - halfCell, lat + halfCell], [lon + halfCell, lat + halfCell], [lon + halfCell, lat - halfCell], [lon - halfCell, lat - halfCell], [lon - halfCell, lat + halfCell]]],
          },
        })

        lights.push({
          type: 'Feature',
          properties: { year, weight },
          geometry: { type: 'Point', coordinates: [lon, lat] },
        })
      }
    }
  }

  return {
    cells: { type: 'FeatureCollection', features: cells },
    lights: { type: 'FeatureCollection', features: lights },
  }
}

export type Lang = 'es' | 'en'
export type ZoneId = 'corridor' | 'ostional' | 'sjds' | 'gigante'

export const CORRIDOR_YEARS = [1995, 2005, 2012, 2015, 2020, 2025, 2030, 2035] as const
export type CorridorYear = (typeof CORRIDOR_YEARS)[number]

export type CorridorSeriesPoint = {
  year: CorridorYear
  builtHa: number
  nightLightIdx: number
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
  eciAirportMin: number
  penasBlancasMin: number
  ntl2025: number
  ntlGrowthPct: number
  built2025Ha: number
  built2035Ha: number
  summary: Record<Lang, string>
  series: CorridorSeriesPoint[]
}

export function sensorForYear(y: CorridorYear, lang: Lang): string {
  if (y <= 2012) return lang === 'es' ? 'DMSP-OLS (Archivo 1995–2012)' : 'DMSP-OLS (Archive 1995–2012)'
  if (y <= 2025) return lang === 'es' ? 'NASA VIIRS Black Marble' : 'NASA VIIRS Black Marble'
  return lang === 'es' ? 'Proyección Costanera (2030–2035)' : 'Costanera Projection (2030–2035)'
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
    eciAirportMin: 48,
    penasBlancasMin: 26,
    ntl2025: 34,
    ntlGrowthPct: 325,
    built2025Ha: 34,
    built2035Ha: 62,
    summary: {
      es: 'Extremo sur del corredor. Conectividad directa hacia Peñas Blancas y expansión progresiva sobre el eje de la Costanera.',
      en: 'Southernmost anchor of the corridor. Direct connectivity toward Peñas Blancas and steady expansion along the Costanera axis.',
    },
    series: [
      { year: 1995, builtHa: 8, nightLightIdx: 8 },
      { year: 2005, builtHa: 12, nightLightIdx: 12 },
      { year: 2012, builtHa: 16, nightLightIdx: 18 },
      { year: 2015, builtHa: 18, nightLightIdx: 21 },
      { year: 2020, builtHa: 24, nightLightIdx: 27 },
      { year: 2025, builtHa: 34, nightLightIdx: 34 },
      { year: 2030, builtHa: 47, nightLightIdx: 46 },
      { year: 2035, builtHa: 62, nightLightIdx: 58 },
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
    eciAirportMin: 36,
    penasBlancasMin: 32,
    ntl2025: 84,
    ntlGrowthPct: 282,
    built2025Ha: 238,
    built2035Ha: 356,
    summary: {
      es: 'Núcleo urbano y de servicios del Pacífico Sur. Mayor densidad lumínica y articulador continuo entre Ostional, Maderas y Tola.',
      en: 'Urban and services core of the South Pacific. Highest light density and continuous bridge between Ostional, Maderas, and Tola.',
    },
    series: [
      { year: 1995, builtHa: 64, nightLightIdx: 22 },
      { year: 2005, builtHa: 96, nightLightIdx: 38 },
      { year: 2012, builtHa: 124, nightLightIdx: 54 },
      { year: 2015, builtHa: 142, nightLightIdx: 61 },
      { year: 2020, builtHa: 186, nightLightIdx: 72 },
      { year: 2025, builtHa: 238, nightLightIdx: 84 },
      { year: 2030, builtHa: 295, nightLightIdx: 91 },
      { year: 2035, builtHa: 356, nightLightIdx: 96 },
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
    eciAirportMin: 14,
    penasBlancasMin: 52,
    ntl2025: 61,
    ntlGrowthPct: 510,
    built2025Ha: 79,
    built2035Ha: 148,
    summary: {
      es: 'Eje de mayor aceleración relativa desde 2015 tras la apertura del Aeropuerto Costa Esmeralda (ECI) y el desarrollo costero de Tola.',
      en: 'Fastest-accelerating hub since 2015 following the opening of Costa Esmeralda Airport (ECI) and coastal development in Tola.',
    },
    series: [
      { year: 1995, builtHa: 11, nightLightIdx: 10 },
      { year: 2005, builtHa: 19, nightLightIdx: 16 },
      { year: 2012, builtHa: 28, nightLightIdx: 25 },
      { year: 2015, builtHa: 36, nightLightIdx: 34 },
      { year: 2020, builtHa: 54, nightLightIdx: 48 },
      { year: 2025, builtHa: 79, nightLightIdx: 61 },
      { year: 2030, builtHa: 112, nightLightIdx: 74 },
      { year: 2035, builtHa: 148, nightLightIdx: 85 },
    ],
  },
]

export const CORRIDOR_TOTAL_SERIES: CorridorSeriesPoint[] = CORRIDOR_YEARS.map((y, idx) => ({
  year: y,
  builtHa: CORRIDOR_HUBS.reduce((acc, h) => acc + h.series[idx].builtHa, 0),
  nightLightIdx: Math.round(CORRIDOR_HUBS.reduce((acc, h) => acc + h.series[idx].nightLightIdx, 0) / CORRIDOR_HUBS.length),
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
        const spreadLat = (pseudoRand(k * 1.3) - 0.5) * (isSjds ? 0.024 : 0.015)
        // Sesgo hacia tierra firme (este) para mantener el desarrollo sobre la franja costera terrestre
        const spreadLon = (pseudoRand(k * 2.1) - 0.3) * (isSjds ? 0.026 : 0.016)
        const lat = baseLat + spreadLat
        const lon = baseLon + spreadLon
        const distFromSpine = Math.hypot(spreadLat, spreadLon)

        // Los polos históricos nacen desde 1995–2012; los tramos intermedios se conectan en 2015–2035
        let year: CorridorYear = 2025
        if (isSjds) {
          if (distFromSpine < 0.005) year = 1995
          else if (distFromSpine < 0.008) year = 2005
          else if (distFromSpine < 0.011) year = 2012
          else if (distFromSpine < 0.014) year = 2015
          else if (distFromSpine < 0.017) year = 2020
          else if (distFromSpine < 0.020) year = 2025
          else if (distFromSpine < 0.023) year = 2030
          else year = 2035
        } else if (isGigante || isOstional) {
          const r = pseudoRand(k * 3.7)
          if (r < 0.14) year = 1995
          else if (r < 0.28) year = 2005
          else if (r < 0.42) year = 2012
          else if (r < 0.56) year = 2015
          else if (r < 0.70) year = 2020
          else if (r < 0.82) year = 2025
          else if (r < 0.91) year = 2030
          else year = 2035
        } else {
          // Tramos continuos entre polos: se iluminan progresivamente 2015 -> 2035
          const r = pseudoRand(k * 4.3)
          if (r < 0.15) year = 2012
          else if (r < 0.32) year = 2015
          else if (r < 0.50) year = 2020
          else if (r < 0.68) year = 2025
          else if (r < 0.85) year = 2030
          else year = 2035
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

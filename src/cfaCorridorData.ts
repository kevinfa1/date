export type Lang = 'es' | 'en'
export type ZoneId = 'ostional' | 'sjds' | 'gigante'

export const CORRIDOR_YEARS = [1995, 2005, 2012, 2015, 2020, 2025, 2030, 2035] as const
export type CorridorYear = (typeof CORRIDOR_YEARS)[number]

export type ZoneSeriesPoint = {
  year: CorridorYear
  builtHa: number
  nightLightIdx: number
  vegetationPct: number
}

export type EngineeringStandard = {
  id: string
  condition: Record<Lang, string>
  metric: string
  solutionTitle: Record<Lang, string>
  solutionDesc: Record<Lang, string>
}

export type CorridorZone = {
  id: ZoneId
  name: string
  municipality: string
  lat: number
  lon: number
  zoom: number
  pitch: number
  bearing: number
  tag: Record<Lang, string>
  summary: Record<Lang, string>
  elevationM: number
  costaneraKm: number
  eciAirportMin: number
  penasBlancasMin: number
  ntl2025: number
  ntlGrowth1995_2025Pct: number
  built2025Ha: number
  built2035Ha: number
  inideHousingGrowthPct: number
  marketProfile: Record<Lang, string>
  marenaStatus: Record<Lang, string>
  sinapredStatus: Record<Lang, string>
  series: ZoneSeriesPoint[]
  standards: EngineeringStandard[]
}

export type LandmarkPin = {
  id: string
  name: Record<Lang, string>
  lat: number
  lon: number
}

export const PUBLIC_LANDMARKS: LandmarkPin[] = [
  { id: 'la-flor', name: { es: 'Refugio La Flor (MARENA)', en: 'La Flor Wildlife Refuge' }, lat: 11.142, lon: -85.792 },
  { id: 'maderas', name: { es: 'Playa Maderas', en: 'Playa Maderas' }, lat: 11.292, lon: -85.910 },
  { id: 'eci', name: { es: 'Aeropuerto Costa Esmeralda (ECI)', en: 'Costa Esmeralda Airport (ECI)' }, lat: 11.428, lon: -86.028 },
]

export function sensorForYear(y: CorridorYear, lang: Lang): string {
  if (y <= 2012) return lang === 'es' ? 'DMSP-OLS (Luces 1 km)' : 'DMSP-OLS (Lights 1 km)'
  if (y <= 2025) return lang === 'es' ? 'NASA VIIRS Black Marble' : 'NASA VIIRS Black Marble'
  return lang === 'es' ? 'Escenario Costanera MTI' : 'MTI Coastal Highway Forecast'
}

export const CORRIDOR_ZONES: CorridorZone[] = [
  {
    id: 'ostional',
    name: 'Ostional',
    municipality: 'San Juan del Sur, Rivas',
    lat: 11.111,
    lon: -85.764,
    zoom: 13.2,
    pitch: 50,
    bearing: -20,
    tag: { es: 'Frontera verde · Baja densidad', en: 'Green frontier · Low density' },
    summary: {
      es: 'Extremo sur del corredor. Mantiene la mayor cobertura de bosque seco y baja saturación urbana, con fuerte proyección de conectividad gracias al tramo sur de la Carretera Costanera (MTI).',
      en: 'Southernmost anchor of the corridor. Preserves the highest dry-forest cover and low urban saturation, with rising connectivity driven by the southern stretch of the MTI Coastal Highway.',
    },
    elevationM: 28,
    costaneraKm: 0.9,
    eciAirportMin: 48,
    penasBlancasMin: 26,
    ntl2025: 34,
    ntlGrowth1995_2025Pct: 325,
    built2025Ha: 34,
    built2035Ha: 62,
    inideHousingGrowthPct: 29,
    marketProfile: {
      es: 'Eco-residencial de baja densidad y primera etapa de valorización',
      en: 'Low-density eco-residential & early-stage appreciation',
    },
    marenaStatus: {
      es: 'Colindante con zona de amortiguamiento del Refugio La Flor (MARENA)',
      en: 'Adjacent to La Flor Wildlife Refuge buffer zone (MARENA)',
    },
    sinapredStatus: {
      es: 'Cota segura +25 m · Fuera de planicie de inundación costera (SINAPRED)',
      en: 'Safe elevation +25 m · Outside coastal flood plain (SINAPRED)',
    },
    series: [
      { year: 1995, builtHa: 8, nightLightIdx: 8, vegetationPct: 88 },
      { year: 2005, builtHa: 12, nightLightIdx: 12, vegetationPct: 85 },
      { year: 2012, builtHa: 16, nightLightIdx: 18, vegetationPct: 82 },
      { year: 2015, builtHa: 18, nightLightIdx: 21, vegetationPct: 81 },
      { year: 2020, builtHa: 24, nightLightIdx: 27, vegetationPct: 78 },
      { year: 2025, builtHa: 34, nightLightIdx: 34, vegetationPct: 74 },
      { year: 2030, builtHa: 47, nightLightIdx: 46, vegetationPct: 69 },
      { year: 2035, builtHa: 62, nightLightIdx: 58, vegetationPct: 64 },
    ],
    standards: [
      {
        id: 'passive',
        condition: { es: 'Noches más cálidas y brisa marina', en: 'Warmer nights & coastal breeze' },
        metric: '+0,26 °C / década (NASA POWER)',
        solutionTitle: { es: 'Arquitectura pasiva y ventilación cruzada', en: 'Passive cooling & cross-ventilation' },
        solutionDesc: {
          es: 'Aleros de 1,8 m, orientación noreste-suroeste y cubiertas ventiladas que reducen hasta 35% el consumo eléctrico de climatización.',
          en: '1.8 m overhangs, NE–SW orientation, and vented roofs that cut cooling electricity demand by up to 35%.',
        },
      },
      {
        id: 'coastal',
        condition: { es: 'Salinidad y lluvias intensas de octubre', en: 'Marine salinity & October peak rainfall' },
        metric: '+11% picos diarios (INETER / NASA)',
        solutionTitle: { es: 'Especificación grado costero + drenaje permeable', en: 'Marine-grade spec + permeable drainage' },
        solutionDesc: {
          es: 'Concreto de baja permeabilidad, acero epóxico, herrajes inox 316 y cunetas de infiltración que protegen quebradas hacia la costa.',
          en: 'Low-permeability concrete, epoxy-coated rebar, 316 stainless hardware, and infiltration swales protecting coastal creeks.',
        },
      },
    ],
  },
  {
    id: 'sjds',
    name: 'San Juan del Sur',
    municipality: 'San Juan del Sur, Rivas',
    lat: 11.253,
    lon: -85.870,
    zoom: 12.9,
    pitch: 52,
    bearing: -18,
    tag: { es: 'Polo urbano consolidado · Alta liquidez', en: 'Consolidated urban hub · High liquidity' },
    summary: {
      es: 'Núcleo comercial, gastronómico y de servicios del corredor. Concentra la mayor intensidad lumínica nocturna (VIIRS) y expansión en laderas hacia Playa Maderas.',
      en: 'Commercial and services hub of the corridor. Concentrates the highest nighttime light intensity (VIIRS) and hillside expansion toward Playa Maderas.',
    },
    elevationM: 42,
    costaneraKm: 0.4,
    eciAirportMin: 36,
    penasBlancasMin: 32,
    ntl2025: 84,
    ntlGrowth1995_2025Pct: 282,
    built2025Ha: 238,
    built2035Ha: 356,
    inideHousingGrowthPct: 41,
    marketProfile: {
      es: 'Servicios completos, alta rotación de renta y mercado secundario activo',
      en: 'Full services, high rental turnover & active resale market',
    },
    marenaStatus: {
      es: 'Corredor urbano municipal · Fuera de áreas protegidas',
      en: 'Municipal urban corridor · Outside protected reserves',
    },
    sinapredStatus: {
      es: 'Bahía baja con alerta SINAPRED · Laderas altas (+35 m) estables',
      en: 'Low bay with SINAPRED alert · Upper hillsides (+35 m) stable',
    },
    series: [
      { year: 1995, builtHa: 64, nightLightIdx: 22, vegetationPct: 74 },
      { year: 2005, builtHa: 96, nightLightIdx: 38, vegetationPct: 68 },
      { year: 2012, builtHa: 124, nightLightIdx: 54, vegetationPct: 63 },
      { year: 2015, builtHa: 142, nightLightIdx: 61, vegetationPct: 61 },
      { year: 2020, builtHa: 186, nightLightIdx: 72, vegetationPct: 54 },
      { year: 2025, builtHa: 238, nightLightIdx: 84, vegetationPct: 48 },
      { year: 2030, builtHa: 295, nightLightIdx: 91, vegetationPct: 43 },
      { year: 2035, builtHa: 356, nightLightIdx: 96, vegetationPct: 39 },
    ],
    standards: [
      {
        id: 'slope',
        condition: { es: 'Crecimiento en laderas y escorrentía', en: 'Hillside expansion & stormwater runoff' },
        metric: 'Pendientes 12–22% (Copernicus DEM)',
        solutionTitle: { es: 'Estabilización geotécnica y terrazas drenadas', en: 'Geotechnical stabilization & terraced drainage' },
        solutionDesc: {
          es: 'Muros de contención con drenaje francés, disipadores hidráulicos y captación pluvial para proteger la inversión en laderas.',
          en: 'Retaining walls with French drains, hydraulic dissipators, and rainwater harvesting to protect hillside structures.',
        },
      },
      {
        id: 'opex',
        condition: { es: 'Costo energético en operación vacacional', en: 'Energy OPEX in rental & residential assets' },
        metric: '5,7 kWh/m²/día solar (NASA CERES)',
        solutionTitle: { es: 'Envolvente térmica + Solar-Ready', en: 'Thermal envelope + Solar-Ready' },
        solutionDesc: {
          es: 'Aislamiento en losas, vidriería de control solar y pre-cableado fotovoltaico para bajar el costo operativo mensual.',
          en: 'Roof-slab insulation, solar-control glazing, and PV pre-wiring to lower monthly operating expenses.',
        },
      },
    ],
  },
  {
    id: 'gigante',
    name: 'Playa Gigante · Tola',
    municipality: 'Tola, Rivas',
    lat: 11.377,
    lon: -86.032,
    zoom: 13.1,
    pitch: 50,
    bearing: -24,
    tag: { es: 'Mayor aceleración · Eje Aeropuerto ECI', en: 'Fastest acceleration · ECI Airport corridor' },
    summary: {
      es: 'Polo de expansión residencial-turística en Tola. El salto en luces nocturnas VIIRS desde 2015 refleja la consolidación tras la apertura del Aeropuerto Costa Esmeralda (ECI).',
      en: 'Residential-tourism growth hub in Tola. The surge in VIIRS night lights since 2015 reflects consolidation following the opening of Costa Esmeralda Airport (ECI).',
    },
    elevationM: 34,
    costaneraKm: 1.4,
    eciAirportMin: 14,
    penasBlancasMin: 52,
    ntl2025: 61,
    ntlGrowth1995_2025Pct: 510,
    built2025Ha: 79,
    built2035Ha: 148,
    inideHousingGrowthPct: 36,
    marketProfile: {
      es: 'Inversión internacional, acceso aéreo directo (14 min) y alta plusvalía',
      en: 'International investment, direct air access (14 min) & high upside',
    },
    marenaStatus: {
      es: 'Resguardo de franja costera y manejo de bosque seco tropical (MARENA)',
      en: 'Coastal setback compliance & tropical dry-forest stewardship (MARENA)',
    },
    sinapredStatus: {
      es: 'Cota residencial +30 m · Drenaje costero evaluado (SINAPRED)',
      en: 'Residential elevation +30 m · Coastal drainage assessed (SINAPRED)',
    },
    series: [
      { year: 1995, builtHa: 11, nightLightIdx: 10, vegetationPct: 84 },
      { year: 2005, builtHa: 19, nightLightIdx: 16, vegetationPct: 79 },
      { year: 2012, builtHa: 28, nightLightIdx: 25, vegetationPct: 75 },
      { year: 2015, builtHa: 36, nightLightIdx: 34, vegetationPct: 73 },
      { year: 2020, builtHa: 54, nightLightIdx: 48, vegetationPct: 68 },
      { year: 2025, builtHa: 79, nightLightIdx: 61, vegetationPct: 63 },
      { year: 2030, builtHa: 112, nightLightIdx: 74, vegetationPct: 57 },
      { year: 2035, builtHa: 148, nightLightIdx: 85, vegetationPct: 52 },
    ],
    standards: [
      {
        id: 'water',
        condition: { es: 'Estación seca marcada (dic–abr)', en: 'Pronounced dry season (Dec–Apr)' },
        metric: '5,8 kWh/m²/día + déficit estacional',
        solutionTitle: { es: 'Autonomía hídrica y energética', en: 'Water & energy resilience' },
        solutionDesc: {
          es: 'Cisternas de cosecha pluvial, biodigestores con reuso para riego nativo y respaldo solar con banco de baterías.',
          en: 'Rainwater cisterns, greywater biodigesters for native landscaping, and solar + battery backup readiness.',
        },
      },
      {
        id: 'heat',
        condition: { es: 'Radiación y picos diurnos de verano', en: 'Peak summer solar & daytime heat' },
        metric: '+0,29 °C / década (NASA POWER)',
        solutionTitle: { es: 'Cubiertas de alto albedo y sombreado', en: 'High-albedo roofs & architectural shading' },
        solutionDesc: {
          es: 'Membranas reflectivas, pérgolas térmicas en fachadas oeste y techos altos con extracción de aire caliente.',
          en: 'Reflective roof membranes, west-facade thermal pergolas, and high ceilings with hot-air exhaust.',
        },
      },
    ],
  },
]

export const COSTANERA_MTI_GEOJSON = {
  type: 'FeatureCollection' as const,
  features: [
    {
      type: 'Feature' as const,
      properties: { name: 'Carretera Costanera — Tramo Pacífico Sur (MTI)' },
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [-85.742, 11.095], [-85.764, 11.114], [-85.786, 11.148], [-85.812, 11.182],
          [-85.844, 11.216], [-85.864, 11.252], [-85.885, 11.284], [-85.918, 11.314],
          [-85.955, 11.345], [-85.998, 11.368], [-86.036, 11.385],
        ],
      },
    },
  ],
}

export const MARENA_PROTECTED_GEOJSON = {
  type: 'FeatureCollection' as const,
  features: [
    {
      type: 'Feature' as const,
      properties: { name: 'Refugio de Vida Silvestre La Flor (MARENA)' },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [-85.806, 11.132], [-85.774, 11.132], [-85.770, 11.160],
          [-85.802, 11.164], [-85.816, 11.148], [-85.806, 11.132],
        ]],
      },
    },
  ],
}

export const SINAPRED_HAZARD_GEOJSON = {
  type: 'FeatureCollection' as const,
  features: [
    {
      type: 'Feature' as const,
      properties: { name: 'Bahía baja San Juan del Sur (SINAPRED/INETER)' },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[[-85.876, 11.248], [-85.866, 11.248], [-85.865, 11.258], [-85.874, 11.260], [-85.876, 11.248]]],
      },
    },
    {
      type: 'Feature' as const,
      properties: { name: 'Desembocadura Ostional (SINAPRED/INETER)' },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[[-85.771, 11.106], [-85.762, 11.106], [-85.761, 11.114], [-85.770, 11.115], [-85.771, 11.106]]],
      },
    },
    {
      type: 'Feature' as const,
      properties: { name: 'Borde costero bajo Playa Gigante (SINAPRED/INETER)' },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[[-86.040, 11.371], [-86.031, 11.371], [-86.030, 11.381], [-86.039, 11.382], [-86.040, 11.371]]],
      },
    },
  ],
}

type UrbanSeed = { zone: ZoneId; lat: number; lon: number; radiusDeg: number; count: number; baseHeight: number }

const URBAN_SEEDS: UrbanSeed[] = [
  { zone: 'ostional', lat: 11.114, lon: -85.760, radiusDeg: 0.011, count: 30, baseHeight: 7 },
  { zone: 'sjds', lat: 11.256, lon: -85.864, radiusDeg: 0.017, count: 76, baseHeight: 14 },
  { zone: 'sjds', lat: 11.288, lon: -85.892, radiusDeg: 0.012, count: 32, baseHeight: 9 },
  { zone: 'gigante', lat: 11.378, lon: -86.026, radiusDeg: 0.014, count: 54, baseHeight: 11 },
  { zone: 'gigante', lat: 11.352, lon: -85.988, radiusDeg: 0.011, count: 28, baseHeight: 9 },
]

function pseudoRand(seed: number) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

export type CorridorCellFeature = {
  type: 'Feature'
  properties: { zone: ZoneId; year: CorridorYear; height: number }
  geometry: { type: 'Polygon'; coordinates: number[][][] }
}

export function buildCorridorCells(): { type: 'FeatureCollection'; features: CorridorCellFeature[] } {
  const features: CorridorCellFeature[] = []
  const halfCell = 0.00085

  URBAN_SEEDS.forEach((seed, sIdx) => {
    for (let i = 0; i < seed.count; i++) {
      const k = sIdx * 1000 + i + 1
      const angle = pseudoRand(k * 1.7) * Math.PI * 2
      const distNorm = Math.pow(pseudoRand(k * 2.3), 0.72)
      const lat = seed.lat + Math.sin(angle) * seed.radiusDeg * distNorm
      const lon = seed.lon + Math.cos(angle) * seed.radiusDeg * distNorm + 0.0025 * distNorm

      let year: CorridorYear = 1995
      if (distNorm > 0.86) year = 2035
      else if (distNorm > 0.74) year = 2030
      else if (distNorm > 0.60) year = 2025
      else if (distNorm > 0.48) year = 2020
      else if (distNorm > 0.36) year = 2015
      else if (distNorm > 0.25) year = 2012
      else if (distNorm > 0.14) year = 2005

      const height = Math.max(4, Math.round(seed.baseHeight * (1.25 - distNorm * 0.65) + pseudoRand(k * 3.1) * 6))
      features.push({
        type: 'Feature',
        properties: { zone: seed.zone, year, height },
        geometry: {
          type: 'Polygon',
          coordinates: [[[lon - halfCell, lat + halfCell], [lon + halfCell, lat + halfCell], [lon + halfCell, lat - halfCell], [lon - halfCell, lat - halfCell], [lon - halfCell, lat + halfCell]]],
        },
      })
    }
  })

  return { type: 'FeatureCollection', features }
}

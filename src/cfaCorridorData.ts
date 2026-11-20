export type PersonaId = 'buyer' | 'investor' | 'corporate'
export type ZoneId = 'ostional' | 'sjds' | 'gigante'

export const CORRIDOR_YEARS = [2015, 2020, 2025, 2030, 2035] as const
export type CorridorYear = (typeof CORRIDOR_YEARS)[number]

export type PersonaProfile = {
  id: PersonaId
  label: string
  subtitle: string
  headline: string
  thesis: string
  focusMetricLabel: string
  ctaLabel: string
}

export type ClimateEngineeringItem = {
  id: string
  variable: string
  source: string
  trend: string
  horizon: string
  riskLevel: 'moderado' | 'alto' | 'favorable'
  cfaSolutionTitle: string
  cfaSolution: string
}

export type ZoneSeriesPoint = {
  year: CorridorYear
  builtHa: number
  vegetationPct: number
  isProjected: boolean
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
  tag: string
  summary: string
  elevationM: number
  costaneraKm: number
  travelGainMin: number
  built2015Ha: number
  built2025Ha: number
  built2035Ha: number
  growthPct2015_2035: number
  vegetation2025Pct: number
  inideHousingGrowthPct: number
  marenaStatus: string
  sinapredStatus: string
  personaHighlight: Record<PersonaId, string>
  series: ZoneSeriesPoint[]
  engineering: ClimateEngineeringItem[]
}

export const PERSONAS: PersonaProfile[] = [
  {
    id: 'buyer',
    label: 'Comprador / Familia',
    subtitle: 'Confort térmico, cota segura y entorno verde',
    headline: 'Diseñamos para el clima de 2045, no para el folleto de hoy',
    thesis:
      'Cada lote se evalúa con elevación satelital Copernicus DEM, zonas de amenaza SINAPRED y 40 años de clima NASA POWER para garantizar confort térmico, drenaje seguro y preservación de bosque seco.',
    focusMetricLabel: 'Cota segura + confort térmico',
    ctaLabel: 'Solicitar estudio técnico de tu lote',
  },
  {
    id: 'investor',
    label: 'Inversionista',
    subtitle: 'Plusvalía Costanera MTI y expansión urbana verificada',
    headline: 'Plusvalía trazable con satélite y obra pública oficial',
    thesis:
      'Cruzamos la expansión construida satelital (GHSL/Sentinel-2) con el trazado de la Carretera Costanera (MTI) y el crecimiento habitacional INIDE para ubicar activos donde converge la demanda real.',
    focusMetricLabel: 'Expansión urbana + eje Costanera',
    ctaLabel: 'Descargar dossier de inversión CSV',
  },
  {
    id: 'corporate',
    label: 'Corporativo / ESG',
    subtitle: 'Cumplimiento MARENA, resiliencia y auditoría abierta',
    headline: 'Trazabilidad ambiental y territorial lista para comité',
    thesis:
      'Respeto verificable al Refugio de Vida Silvestre La Flor (MARENA), exclusión de franjas de amenaza costera (INETER/SINAPRED) y datos auditables descargables sin cajas negras.',
    focusMetricLabel: 'Cumplimiento MARENA + auditoría',
    ctaLabel: 'Exportar matriz territorial auditada',
  },
]

export const CORRIDOR_ZONES: CorridorZone[] = [
  {
    id: 'ostional',
    name: 'Ostional',
    municipality: 'San Juan del Sur, Rivas',
    lat: 11.111,
    lon: -85.764,
    zoom: 13.4,
    pitch: 52,
    bearing: -22,
    tag: 'Frontera verde · Baja densidad',
    summary:
      'Extremo sur del corredor. Conserva la mayor cobertura de bosque seco y baja presión urbana actual, con conectividad acelerada por el tramo sur de la Carretera Costanera (MTI).',
    elevationM: 28,
    costaneraKm: 0.9,
    travelGainMin: 35,
    built2015Ha: 18,
    built2025Ha: 34,
    built2035Ha: 62,
    growthPct2015_2035: 244,
    vegetation2025Pct: 74,
    inideHousingGrowthPct: 29,
    marenaStatus: 'Colindante con zona de amortiguamiento (Refugio La Flor)',
    sinapredStatus: 'Lotes CFA sobre cota +25 m · Fuera de planicie de inundación',
    personaHighlight: {
      buyer: 'Privacidad, entorno natural (74% vegetación) y microclima más fresco en laderas ventiladas.',
      investor: 'Etapa temprana de valorización: +244% de expansión proyectada 2015–2035 impulsada por la Costanera.',
      corporate: 'Zona crítica de cumplimiento MARENA: diseño de baja huella, manejo de aguas grises y cero invasión costera.',
    },
    series: [
      { year: 2015, builtHa: 18, vegetationPct: 81, isProjected: false },
      { year: 2020, builtHa: 24, vegetationPct: 78, isProjected: false },
      { year: 2025, builtHa: 34, vegetationPct: 74, isProjected: false },
      { year: 2030, builtHa: 47, vegetationPct: 69, isProjected: true },
      { year: 2035, builtHa: 62, vegetationPct: 64, isProjected: true },
    ],
    engineering: [
      {
        id: 'heat',
        variable: 'Noches cálidas (T2M_MIN)',
        source: 'NASA POWER · 1981–2025',
        trend: '+0,26 °C / década',
        horizon: '+0,6 °C hacia 2045',
        riskLevel: 'moderado',
        cfaSolutionTitle: 'Arquitectura pasiva y ventilación cruzada',
        cfaSolution: 'Aleros de 1,8 m, orientación noreste-suroeste para captar brisa marina y cubiertas ventiladas que reducen hasta 35% la carga de A/C.',
      },
      {
        id: 'rain',
        variable: 'Lluvia extrema (octubre)',
        source: 'NASA POWER + INETER',
        trend: '+11% en picos diarios',
        horizon: 'Eventos más concentrados',
        riskLevel: 'alto',
        cfaSolutionTitle: 'Drenaje pluvial y cota mínima elevada',
        cfaSolution: 'Implantación sobre cota +25 m (Copernicus DEM), cunetas de infiltración y pavimentos permeables para proteger quebradas hacia la costa.',
      },
      {
        id: 'solar',
        variable: 'Irradiancia solar (ALLSKY)',
        source: 'NASA CERES',
        trend: '5,6 kWh/m²/día estables',
        horizon: 'Alto potencial fotovoltaico',
        riskLevel: 'favorable',
        cfaSolutionTitle: 'Cubiertas Solar-Ready de fábrica',
        cfaSolution: 'Estructura de techo calculada para paneles solares, ductería preinstalada y retorno estimado de inversión energética en 4–5 años.',
      },
      {
        id: 'coastal',
        variable: 'Salinidad y corrosión marina',
        source: 'Perfil costero Pacífico Sur',
        trend: 'Exposición directa < 1,5 km',
        horizon: 'Mantenimiento crítico',
        riskLevel: 'alto',
        cfaSolutionTitle: 'Especificación estructural grado costero',
        cfaSolution: 'Concreto de baja permeabilidad, acero con recubrimiento epóxico y herrajes en aluminio anodizado/inox 316 para preservar el activo.',
      },
    ],
  },
  {
    id: 'sjds',
    name: 'San Juan del Sur',
    municipality: 'San Juan del Sur, Rivas',
    lat: 11.253,
    lon: -85.870,
    zoom: 13.0,
    pitch: 54,
    bearing: -18,
    tag: 'Polo urbano consolidado · Alta demanda',
    summary:
      'Núcleo comercial y de servicios del corredor. Concentra la mayor densidad construida y crecimiento en laderas hacia Playa Maderas, exigiendo ingeniería rigurosa de pendientes y drenaje.',
    elevationM: 42,
    costaneraKm: 0.4,
    travelGainMin: 22,
    built2015Ha: 142,
    built2025Ha: 238,
    built2035Ha: 356,
    growthPct2015_2035: 151,
    vegetation2025Pct: 48,
    inideHousingGrowthPct: 41,
    marenaStatus: 'Fuera de área protegida · Corredor urbano municipal',
    sinapredStatus: 'Bahía baja con alerta tsunami/inundación · Laderas CFA +35 m seguras',
    personaHighlight: {
      buyer: 'Servicios completos a minutos, evitando la cota baja inundable de la bahía mediante implantación en laderas estables.',
      investor: 'Liquidez comprobada: mayor masa urbana (238 ha en 2025) y +41% de crecimiento habitacional municipal (INIDE).',
      corporate: 'Gestión pluvial y control de escorrentía en ladera documentados para mitigar impacto sobre la bahía.',
    },
    series: [
      { year: 2015, builtHa: 142, vegetationPct: 61, isProjected: false },
      { year: 2020, builtHa: 186, vegetationPct: 54, isProjected: false },
      { year: 2025, builtHa: 238, vegetationPct: 48, isProjected: false },
      { year: 2030, builtHa: 295, vegetationPct: 43, isProjected: true },
      { year: 2035, builtHa: 356, vegetationPct: 39, isProjected: true },
    ],
    engineering: [
      {
        id: 'heat',
        variable: 'Isla de calor urbana (T2M_MIN)',
        source: 'NASA POWER · 1981–2025',
        trend: '+0,31 °C / década',
        horizon: '+0,75 °C hacia 2045',
        riskLevel: 'alto',
        cfaSolutionTitle: 'Envolvente térmica y sombra arbórea nativa',
        cfaSolution: 'Aislamiento térmico en losas, vidriería de control solar y conservación de árboles nativos en 30% del lote para bajar temperatura superficial.',
      },
      {
        id: 'rain',
        variable: 'Escorrentía en ladera',
        source: 'Copernicus DEM + SINAPRED',
        trend: 'Pendientes 12–22% en expansión norte',
        horizon: 'Riesgo de erosión si no se canaliza',
        riskLevel: 'alto',
        cfaSolutionTitle: 'Estabilización geotécnica y disipadores',
        cfaSolution: 'Muros de contención con drenaje francés, terrazas escalonadas y captación de agua lluvia para riego en época seca.',
      },
      {
        id: 'solar',
        variable: 'Irradiancia solar (ALLSKY)',
        source: 'NASA CERES',
        trend: '5,7 kWh/m²/día',
        horizon: 'Consistente todo el año',
        riskLevel: 'favorable',
        cfaSolutionTitle: 'Autoconsumo híbrido y eficiencia HVAC',
        cfaSolution: 'Pre-cableado fotovoltaico + sistemas Inverter de alta eficiencia SEER 20+ para reducir costos operativos de alquiler vacacional.',
      },
      {
        id: 'coastal',
        variable: 'Viento predominante (NE)',
        source: 'NASA POWER · 10 m',
        trend: 'Ráfagas secas dic–abr',
        horizon: 'Alto confort si se canaliza',
        riskLevel: 'favorable',
        cfaSolutionTitle: 'Terrazas protegidas y flujo dirigido',
        cfaSolution: 'Celosías y distribución volumétrica que aprovechan el viento fresco sin generar turbulencia en áreas sociales.',
      },
    ],
  },
  {
    id: 'gigante',
    name: 'Playa Gigante · Tola',
    municipality: 'Tola, Rivas',
    lat: 11.377,
    lon: -86.032,
    zoom: 13.2,
    pitch: 52,
    bearing: -25,
    tag: 'Eje de expansión premium · Tola',
    summary:
      'Polo de crecimiento residencial-turístico en Tola (entorno Gigante – Guacalito). Combina conectividad aérea/costera con terrenos amplios y fuerte aceleración constructiva desde 2020.',
    elevationM: 34,
    costaneraKm: 1.4,
    travelGainMin: 28,
    built2015Ha: 36,
    built2025Ha: 79,
    built2035Ha: 148,
    growthPct2015_2035: 311,
    vegetation2025Pct: 63,
    inideHousingGrowthPct: 36,
    marenaStatus: 'Cumplimiento de franja costera y manejo de bosque seco tropical',
    sinapredStatus: 'Evaluación de drenaje costero · Implantación sobre cota +30 m',
    personaHighlight: {
      buyer: 'Comunidad residencial planificada, playas de baja saturación y casas diseñadas para clima cálido-seco.',
      investor: 'Mayor aceleración relativa del corredor: +311% de expansión construida proyectada 2015–2035 en el eje Tola–Gigante.',
      corporate: 'Infraestructura hídrica y energética pensada para resiliencia operativa en un municipio en rápida transformación.',
    },
    series: [
      { year: 2015, builtHa: 36, vegetationPct: 73, isProjected: false },
      { year: 2020, builtHa: 54, vegetationPct: 68, isProjected: false },
      { year: 2025, builtHa: 79, vegetationPct: 63, isProjected: false },
      { year: 2030, builtHa: 112, vegetationPct: 57, isProjected: true },
      { year: 2035, builtHa: 148, vegetationPct: 52, isProjected: true },
    ],
    engineering: [
      {
        id: 'heat',
        variable: 'Temperatura máxima diurna (T2M_MAX)',
        source: 'NASA POWER · 1981–2025',
        trend: '+0,29 °C / década',
        horizon: 'Veranos más intensos (mar–abr)',
        riskLevel: 'alto',
        cfaSolutionTitle: 'Pérgolas térmicas y cubiertas reflectivas',
        cfaSolution: 'Pinturas y membranas de alto albedo, techos altos con extracción de aire caliente y sombreado estratégico en fachadas oeste.',
      },
      {
        id: 'rain',
        variable: 'Déficit hídrico estacional (dic–abr)',
        source: 'NASA POWER · Precipitación',
        trend: 'Estación seca más marcada',
        horizon: 'Presión sobre acuíferos locales',
        riskLevel: 'moderado',
        cfaSolutionTitle: 'Cosecha pluvial y reuso de aguas grises',
        cfaSolution: 'Cisternas de almacenamiento pluvial, grifería de bajo consumo y biodigestores con riego subsuperficial para jardines nativos.',
      },
      {
        id: 'solar',
        variable: 'Irradiancia solar (ALLSKY)',
        source: 'NASA CERES',
        trend: '5,8 kWh/m²/día',
        horizon: 'Máximo potencial del corredor',
        riskLevel: 'favorable',
        cfaSolutionTitle: 'Independencia energética con respaldo',
        cfaSolution: 'Integración de banco de baterías + solar para asegurar operación continua sin cortes en propiedades residenciales y de renta.',
      },
      {
        id: 'coastal',
        variable: 'Accesibilidad y drenaje Costanera',
        source: 'MTI + Copernicus DEM',
        trend: 'Nuevo nodo vial Tola–Gigante',
        horizon: 'Reducción de 28 min de traslado',
        riskLevel: 'favorable',
        cfaSolutionTitle: 'Urbanización conectada y permeable',
        cfaSolution: 'Accesos con rodaduras estabilizadas, alcantarillas sobredimensionadas y conexión directa a la red de la Costanera.',
      },
    ],
  },
]

/** Trazado referencial de la Carretera Costanera (MTI — Litoral Pacífico Sur: Ostional → SJDS → Tola/Gigante). */
export const COSTANERA_MTI_GEOJSON = {
  type: 'FeatureCollection' as const,
  features: [
    {
      type: 'Feature' as const,
      properties: { name: 'Carretera Costanera — Tramo Pacífico Sur (MTI)', status: 'Obra vial estratégica' },
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [-85.742, 11.095],
          [-85.764, 11.114],
          [-85.786, 11.148],
          [-85.812, 11.182],
          [-85.844, 11.216],
          [-85.864, 11.252],
          [-85.885, 11.284],
          [-85.918, 11.314],
          [-85.955, 11.345],
          [-85.998, 11.368],
          [-86.036, 11.385],
        ],
      },
    },
  ],
}

/** Polígono referencial de área protegida MARENA: Refugio de Vida Silvestre La Flor + zona de amortiguamiento. */
export const MARENA_PROTECTED_GEOJSON = {
  type: 'FeatureCollection' as const,
  features: [
    {
      type: 'Feature' as const,
      properties: { name: 'Refugio de Vida Silvestre La Flor (MARENA)', category: 'Área protegida y amortiguamiento' },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [-85.806, 11.132],
            [-85.774, 11.132],
            [-85.770, 11.160],
            [-85.802, 11.164],
            [-85.816, 11.148],
            [-85.806, 11.132],
          ],
        ],
      },
    },
  ],
}

/** Franjas referenciales de amenaza costera baja (INETER / SINAPRED: cota < 10 m y desembocaduras). */
export const SINAPRED_HAZARD_GEOJSON = {
  type: 'FeatureCollection' as const,
  features: [
    {
      type: 'Feature' as const,
      properties: { name: 'Bahía baja San Juan del Sur (SINAPRED/INETER)', risk: 'Cota baja costera < 10 m' },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [-85.876, 11.248],
            [-85.866, 11.248],
            [-85.865, 11.258],
            [-85.874, 11.260],
            [-85.876, 11.248],
          ],
        ],
      },
    },
    {
      type: 'Feature' as const,
      properties: { name: 'Desembocadura Ostional (SINAPRED/INETER)', risk: 'Escorrentía y marea alta' },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [-85.771, 11.106],
            [-85.762, 11.106],
            [-85.761, 11.114],
            [-85.770, 11.115],
            [-85.771, 11.106],
          ],
        ],
      },
    },
    {
      type: 'Feature' as const,
      properties: { name: 'Borde costero bajo Playa Gigante (SINAPRED/INETER)', risk: 'Cota baja costera < 10 m' },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [-86.040, 11.371],
            [-86.031, 11.371],
            [-86.030, 11.381],
            [-86.039, 11.382],
            [-86.040, 11.371],
          ],
        ],
      },
    },
  ],
}

type UrbanSeed = {
  zone: ZoneId
  lat: number
  lon: number
  radiusDeg: number
  count: number
  baseHeight: number
}

const URBAN_SEEDS: UrbanSeed[] = [
  // Ostional (expansión en laderas interiores junto a la Costanera)
  { zone: 'ostional', lat: 11.114, lon: -85.760, radiusDeg: 0.011, count: 28, baseHeight: 7 },
  // San Juan del Sur (núcleo consolidado + expansión hacia Maderas)
  { zone: 'sjds', lat: 11.256, lon: -85.864, radiusDeg: 0.017, count: 74, baseHeight: 14 },
  { zone: 'sjds', lat: 11.288, lon: -85.892, radiusDeg: 0.012, count: 32, baseHeight: 9 },
  // Playa Gigante / Tola (eje residencial-turístico en aceleración)
  { zone: 'gigante', lat: 11.378, lon: -86.026, radiusDeg: 0.014, count: 52, baseHeight: 11 },
  { zone: 'gigante', lat: 11.352, lon: -85.988, radiusDeg: 0.011, count: 26, baseHeight: 9 },
]

function pseudoRand(seed: number) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

export type CorridorCellFeature = {
  type: 'Feature'
  properties: {
    zone: ZoneId
    year: CorridorYear
    height: number
    kind: 'existing' | 'projected'
  }
  geometry: {
    type: 'Polygon'
    coordinates: number[][][]
  }
}

/** Genera la malla 3D determinística de celdas (~180 m) para el corredor Ostional–SJDS–Tola. */
export function buildCorridorCells(): { type: 'FeatureCollection'; features: CorridorCellFeature[] } {
  const features: CorridorCellFeature[] = []
  const halfCell = 0.00085 // ~95 m de semilado (~190 m por celda)

  URBAN_SEEDS.forEach((seed, sIdx) => {
    for (let i = 0; i < seed.count; i++) {
      const k = sIdx * 1000 + i + 1
      const angle = pseudoRand(k * 1.7) * Math.PI * 2
      // Distribución radial: núcleo más denso (2015) y periferia expansiva (2025–2035)
      const distNorm = Math.pow(pseudoRand(k * 2.3), 0.72)
      const dLat = Math.sin(angle) * seed.radiusDeg * distNorm
      // Sesgo ligero hacia tierra firme (este-noreste) para evitar celdas en el océano Pacífico
      const dLon = Math.cos(angle) * seed.radiusDeg * distNorm + 0.0025 * distNorm

      const lat = seed.lat + dLat
      const lon = seed.lon + dLon

      let year: CorridorYear = 2015
      if (distNorm > 0.78) year = 2035
      else if (distNorm > 0.60) year = 2030
      else if (distNorm > 0.42) year = 2025
      else if (distNorm > 0.24) year = 2020

      const height = Math.round(seed.baseHeight * (1.25 - distNorm * 0.65) + pseudoRand(k * 3.1) * 6)
      const kind = year <= 2025 ? 'existing' : 'projected'

      features.push({
        type: 'Feature',
        properties: { zone: seed.zone, year, height: Math.max(4, height), kind },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [lon - halfCell, lat + halfCell],
              [lon + halfCell, lat + halfCell],
              [lon + halfCell, lat - halfCell],
              [lon - halfCell, lat - halfCell],
              [lon - halfCell, lat + halfCell],
            ],
          ],
        },
      })
    }
  })

  return { type: 'FeatureCollection', features }
}

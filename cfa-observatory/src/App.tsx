import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl, { type StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  buildContinuousCorridor,
  CORRIDOR_GROWTH_PCT,
  CORRIDOR_HUBS,
  CORRIDOR_TOTAL_SERIES,
  CORRIDOR_YEARS,
  COSTANERA_MTI_GEOJSON,
  getRealNightLightsGeoJson,
  REGIONAL_COUNTRIES,
  sensorForYear,
  type CorridorYear,
  type CountryId,
  type Lang,
  type ZoneId,
} from './corridorData'
import { Button, Card, Disclosure, Kpi, Switch } from './ui'

const GIBS = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best'
const ESRI_IMAGERY = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

const GLOBE_STYLE: StyleSpecification = {
  version: 8,
  projection: { type: 'globe' },
  sky: { 'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 1, 7, 0] },
  sources: {
    day: {
      type: 'raster',
      tileSize: 256,
      maxzoom: 8,
      tiles: [`${GIBS}/BlueMarble_NextGeneration/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg`],
      attribution: 'NASA GIBS · Blue Marble',
    },
    night: {
      type: 'raster',
      tileSize: 256,
      maxzoom: 8,
      tiles: [`${GIBS}/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png`],
      attribution: 'NASA GIBS · VIIRS Black Marble',
    },
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#060c18' } },
    { id: 'day', type: 'raster', source: 'day' },
    { id: 'night', type: 'raster', source: 'night', layout: { visibility: 'none' } },
  ],
}

const CORRIDOR_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: 'raster',
      tileSize: 256,
      maxzoom: 17,
      tiles: [ESRI_IMAGERY],
      attribution: 'Esri World Imagery · NASA DMSP-OLS / VIIRS · MTI',
    },
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#080d14' } },
    {
      id: 'satellite',
      type: 'raster',
      source: 'satellite',
      paint: { 'raster-brightness-max': 0.52, 'raster-saturation': -0.35, 'raster-contrast': 0.15 },
    },
  ],
}

const CORRIDOR_OVERVIEW = {
  center: [-85.90, 11.25] as [number, number],
  zoom: 10.6,
  pitch: 50,
  bearing: -24,
}

const COPY = {
  es: {
    brandSub: 'Ingeniería Civil & Industrial · Pacífico Sur, Rivas',
    backHome: '← Constructora Flores Aburto',
    globeEyebrow: 'ESCALA REGIONAL · COMPARATIVA MACROECONÓMICA Y COSTO CONSTRUCTIVO',
    globeTitle: 'Globo Terráqueo: Nicaragua frente a mercados costeros de la región',
    globeLead: 'Selecciona un país en el globo para comparar su PIB, PIB per cápita y competitividad en mano de obra y costo constructivo por metro cuadrado.',
    globeNight: 'Luces orbitales (VIIRS)',
    globeJump: 'Bajar al Corredor 3D (Ostional – Tola) ↓',
    gdpLabel: 'PIB Nominal',
    gdpCapLabel: 'PIB per cápita',
    laborLabel: 'Mano de obra obra gris/día',
    indexLabel: 'Índice Eficiencia Constructiva',
    sqmLabel: 'Costo ref. llave en mano',
    rankingTitle: 'Competitividad constructiva regional (0–100)',
    macroSource: 'Ref. macro 2024: Banco Mundial / FMI · Índice = 40% laboral + 40% $/m² + 20% cadena local',
    scenarioTag: 'Medido',
    methodTitle: 'Transparencia metodológica y vínculo con plusvalía',
    methodBody: '1) Índice de Eficiencia Constructiva (0–100): 40% competitividad laboral + 40% costo llave en mano/m² + 20% profundidad de cadena de suministro local (Nicaragua = 82/100). 2) Luces nocturnas reales: extraídas de GeoTIFF anuales a 500 m (Zenodo VNL V2.1 / NASA VIIRS, 2000–2024; de 110 a 620 píxeles iluminados en el corredor). 3) Plusvalía Costera (Base 2000 = 100): índice referencial de valorización del suelo vinculado a electrificación, acceso Costanera/ECI y demanda turística.',
    corridorEyebrow: 'VISOR 3D CONTINUO · OSTIONAL → SAN JUAN DEL SUR → PLAYA GIGANTE / TOLA',
    corridorTitle: 'Por qué medimos la luz nocturna satelital en el corredor (2000–2024)',
    corridorSub: 'En mercados costeros donde no existe un MLS público, la radiancia nocturna (NASA/NOAA VIIRS · serie VNL V2.1 a 500 m) es el indicador económico estándar del Banco Mundial para verificar electrificación real, actividad comercial y consolidación de servicios que respaldan la plusvalía.',
    allCorridor: 'Tramo completo (45 km)',
    timeline: 'Serie medida (2000–2024)',
    play: 'Reproducir',
    pause: 'Pausar',
    layers: 'Capas activas',
    lLights: 'Luces reales 500 m (VNL V2.1)',
    lUrban: 'Huella 3D referencial',
    lCostanera: 'Vector Costanera (MTI)',
    connTitle: 'Logística y conectividad',
    connCostanera: 'Carretera Costanera (MTI)',
    connEci: 'Aeropuerto Costa Esmeralda (ECI)',
    connBorder: 'Frontera Peñas Blancas (CR)',
    kNtl: 'Actividad nocturna vs. 2000',
    kBuilt: 'Plusvalía estimada',
    kAir: 'Acceso aéreo (ECI)',
    kGrowth: 'Expansión eléctrica costera',
    chartTitle: 'Por qué la luz nocturna anticipa el valor del suelo costero',
    chartSub: 'La radiancia auditable NASA/NOAA VIIRS (500 m, VNL V2.1) demuestra dónde llegaron realmente la red eléctrica, el turismo y los servicios que sostienen la plusvalía (Base 2000 = 100)',
    footerLeft: 'Constructora Flores Aburto (CFA) · San Juan del Sur, Rivas, Nicaragua',
    footerRight: 'Datos orbitales reales: VNL V2.1 / NASA VIIRS (500 m, 2000–2024) · Eje Ostional – SJDS – Tola',
  },
  en: {
    brandSub: 'Civil & Industrial Engineering · Rivas South Pacific',
    backHome: '← Constructora Flores Aburto',
    globeEyebrow: 'REGIONAL SCALE · MACROECONOMICS & CONSTRUCTION COST BENCHMARK',
    globeTitle: '3D Globe: Nicaragua vs. regional coastal markets',
    globeLead: 'Select a country on the globe to compare GDP, GDP per capita, and competitiveness in construction labor and turnkey cost per square meter.',
    globeNight: 'Orbital lights (VIIRS)',
    globeJump: 'Jump to 3D Corridor (Ostional – Tola) ↓',
    gdpLabel: 'Nominal GDP',
    gdpCapLabel: 'GDP per capita',
    laborLabel: 'Construction labor / day',
    indexLabel: 'Construction Efficiency Index',
    sqmLabel: 'Turnkey ref. cost',
    rankingTitle: 'Regional construction competitiveness (0–100)',
    macroSource: '2024 macro ref.: World Bank / IMF · Index = 40% labor + 40% $/m² + 20% local supply',
    scenarioTag: 'Measured',
    methodTitle: 'Methodological transparency & appreciation link',
    methodBody: '1) Construction Efficiency Index (0–100): 40% daily labor competitiveness + 40% turnkey cost/m² + 20% local supply-chain depth (Nicaragua = 82/100). 2) Real nighttime lights: extracted from annual 500 m GeoTIFFs (Zenodo VNL V2.1 / NASA VIIRS, 2000–2024; lit pixels grew from 110 to 620). 3) Coastal Appreciation Index (Base 2000 = 100): land/property value proxy linked to electrification, Costanera/ECI access, and tourism demand.',
    corridorEyebrow: 'CONTINUOUS 3D VIEWER · OSTIONAL → SAN JUAN DEL SUR → PLAYA GIGANTE / TOLA',
    corridorTitle: 'Why we track orbital nighttime lights across the corridor (2000–2024)',
    corridorSub: 'In coastal markets without a public MLS, nighttime radiance (NASA/NOAA VIIRS · 500 m VNL V2.1 series) is the World Bank-backed proxy for real grid arrival, active commercial density, and infrastructure maturity that underpin long-term property equity.',
    allCorridor: 'Full 45 km stretch',
    timeline: 'Measured series (2000–2024)',
    play: 'Play',
    pause: 'Pause',
    layers: 'Active layers',
    lLights: 'Real 500 m lights (VNL V2.1)',
    lUrban: 'Reference 3D footprint',
    lCostanera: 'Costanera Vector (MTI)',
    connTitle: 'Logistics & connectivity',
    connCostanera: 'Costanera Highway (MTI)',
    connEci: 'Costa Esmeralda Airport (ECI)',
    connBorder: 'Peñas Blancas Border (CR)',
    kNtl: 'Nighttime activity vs. 2000',
    kBuilt: 'Estimated equity gain',
    kAir: 'Airport access (ECI)',
    kGrowth: 'Coastal grid expansion',
    chartTitle: 'Why orbital night lights track coastal land value',
    chartSub: 'Auditable NASA/NOAA VIIRS radiance (500 m, VNL V2.1) proves where grid power, tourism, and services actually arrived—explaining why coastal equity compounds (Base 2000 = 100)',
    footerLeft: 'Constructora Flores Aburto (CFA) · San Juan del Sur, Rivas, Nicaragua',
    footerRight: 'Real orbital data: VNL V2.1 / NASA VIIRS (500 m, 2000–2024) · Ostional – SJDS – Tola',
  },
} as const

function initialLang(): Lang {
  const q = new URLSearchParams(window.location.search).get('lang')
  return q === 'es' || q === 'en' ? q : 'en'
}

export default function App() {
  const [lang, setLang] = useState<Lang>(initialLang)
  const [countryId, setCountryId] = useState<CountryId>('nic')
  const [nightMode, setNightMode] = useState(true)

  const [zoneId, setZoneId] = useState<ZoneId>('corridor')
  const [yearIdx, setYearIdx] = useState<number>(CORRIDOR_YEARS.indexOf(2024))
  const [playing, setPlaying] = useState(false)
  const [showLights, setShowLights] = useState(true)
  const [showUrban, setShowUrban] = useState(true)
  const [showCostanera, setShowCostanera] = useState(true)

  const globeContainerRef = useRef<HTMLDivElement>(null)
  const globeMapRef = useRef<maplibregl.Map | null>(null)
  const globeReadyRef = useRef(false)
  const countryBtnsRef = useRef<Map<CountryId, HTMLButtonElement>>(new Map())

  const corridorSectionRef = useRef<HTMLDivElement>(null)
  const corridorContainerRef = useRef<HTMLDivElement>(null)
  const corridorMapRef = useRef<maplibregl.Map | null>(null)
  const corridorReadyRef = useRef(false)
  const hubBtnsRef = useRef<Map<string, HTMLButtonElement>>(new Map())

  const t = COPY[lang]
  const country = REGIONAL_COUNTRIES.find((c) => c.id === countryId) ?? REGIONAL_COUNTRIES[0]
  const year: CorridorYear = CORRIDOR_YEARS[yearIdx]
  const { cells } = useMemo(() => buildContinuousCorridor(), [])
  const activeHub = CORRIDOR_HUBS.find((h) => h.id === zoneId) ?? null
  const activeSeries = activeHub ? activeHub.series : CORRIDOR_TOTAL_SERIES
  const activePoint = activeSeries.find((s) => s.year === year) ?? activeSeries[5]

  useEffect(() => {
    document.documentElement.lang = lang
    const url = new URL(window.location.href)
    url.searchParams.set('lang', lang)
    window.history.replaceState({}, '', url)
  }, [lang])

  // 1. Inicialización del Globo Terráqueo superior
  useEffect(() => {
    const el = globeContainerRef.current
    if (!el) return
    const map = new maplibregl.Map({
      container: el,
      style: GLOBE_STYLE,
      center: [-85.5, 13.0],
      zoom: 2.8,
      pitch: 12,
    })
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'top-right')
    globeMapRef.current = map

    const created: maplibregl.Marker[] = []
    const btns = new Map<CountryId, HTMLButtonElement>()

    REGIONAL_COUNTRIES.forEach((c) => {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = `cfa-globe-pin${c.id === countryId ? ' active' : ''}`
      btn.textContent = c.name.es
      btn.addEventListener('click', () => {
        setCountryId(c.id)
        map.flyTo({ center: [c.lon, c.lat], zoom: 3.4, duration: 900 })
      })
      btns.set(c.id, btn)
      created.push(new maplibregl.Marker({ element: btn, anchor: 'center' }).setLngLat([c.lon, c.lat]).addTo(map))
    })
    countryBtnsRef.current = btns

    map.on('load', () => {
      globeReadyRef.current = true
      map.setLayoutProperty('night', 'visibility', nightMode ? 'visible' : 'none')
    })

    return () => {
      globeReadyRef.current = false
      created.forEach((m) => m.remove())
      countryBtnsRef.current.clear()
      map.remove()
      globeMapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    countryBtnsRef.current.forEach((btn, id) => {
      const c = REGIONAL_COUNTRIES.find((x) => x.id === id)
      if (c) btn.textContent = c.name[lang]
      btn.classList.toggle('active', id === countryId)
    })
  }, [countryId, lang])

  useEffect(() => {
    const map = globeMapRef.current
    if (!map || !globeReadyRef.current) return
    map.setLayoutProperty('night', 'visibility', nightMode ? 'visible' : 'none')
  }, [nightMode])

  function selectCountry(id: CountryId) {
    setCountryId(id)
    const c = REGIONAL_COUNTRIES.find((x) => x.id === id)
    if (c && globeMapRef.current) {
      globeMapRef.current.flyTo({ center: [c.lon, c.lat], zoom: 3.4, duration: 900 })
    }
  }

  // 2. Animación del timeline del Corredor 3D
  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setYearIdx((prev) => (prev + 1) % CORRIDOR_YEARS.length)
    }, 1150)
    return () => window.clearInterval(timer)
  }, [playing])

  // 3. Inicialización del Visor 3D Continuo del Corredor
  useEffect(() => {
    const el = corridorContainerRef.current
    if (!el) return
    const map = new maplibregl.Map({
      container: el,
      style: CORRIDOR_STYLE,
      center: CORRIDOR_OVERVIEW.center,
      zoom: CORRIDOR_OVERVIEW.zoom,
      pitch: CORRIDOR_OVERVIEW.pitch,
      bearing: CORRIDOR_OVERVIEW.bearing,
      maxPitch: 68,
    })
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')
    corridorMapRef.current = map

    const created: maplibregl.Marker[] = []
    const btns = new Map<string, HTMLButtonElement>()

    map.on('load', () => {
      corridorReadyRef.current = true

      map.addSource('costanera', { type: 'geojson', data: COSTANERA_MTI_GEOJSON })
      map.addLayer({ id: 'costanera-glow', type: 'line', source: 'costanera', paint: { 'line-color': '#4ea017', 'line-width': 8, 'line-opacity': 0.35 } })
      map.addLayer({ id: 'costanera-line', type: 'line', source: 'costanera', paint: { 'line-color': '#60b821', 'line-width': 2.8 } })

      map.addSource('night-lights', { type: 'geojson', data: getRealNightLightsGeoJson(2024) })
      map.addLayer({
        id: 'night-lights-heat',
        type: 'heatmap',
        source: 'night-lights',
        paint: {
          'heatmap-weight': ['get', 'weight'],
          'heatmap-intensity': 1.25,
          'heatmap-radius': 28,
          'heatmap-opacity': 0.88,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0,0,0,0)',
            0.2, 'rgba(180, 83, 9, 0.35)',
            0.45, 'rgba(245, 158, 11, 0.68)',
            0.75, 'rgba(253, 224, 71, 0.90)',
            1, 'rgba(255, 251, 235, 1)',
          ],
        },
      })
      map.addLayer({
        id: 'night-lights-core',
        type: 'circle',
        source: 'night-lights',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 2.5, 13, 5.2],
          'circle-color': '#fef08a',
          'circle-opacity': 0.85,
          'circle-blur': 0.45,
        },
      })

      map.addSource('corridor-cells', { type: 'geojson', data: cells })
      map.addLayer({
        id: 'urban-3d',
        type: 'fill-extrusion',
        source: 'corridor-cells',
        filter: ['<=', ['get', 'year'], 2024],
        paint: {
          'fill-extrusion-color': '#5c8aa8',
          'fill-extrusion-height': ['*', ['get', 'height'], 8],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.72,
        },
      })

      CORRIDOR_HUBS.forEach((h) => {
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.className = 'cfa-marker'
        btn.textContent = h.name
        btn.addEventListener('click', () => {
          setZoneId(h.id)
          map.flyTo({ center: [h.lon, h.lat], zoom: h.zoom, pitch: h.pitch, bearing: h.bearing, duration: 1000 })
        })
        btns.set(h.id, btn)
        created.push(new maplibregl.Marker({ element: btn, anchor: 'bottom' }).setLngLat([h.lon, h.lat]).addTo(map))
      })
      hubBtnsRef.current = btns
    })

    return () => {
      corridorReadyRef.current = false
      created.forEach((m) => m.remove())
      hubBtnsRef.current.clear()
      map.remove()
      corridorMapRef.current = null
    }
  }, [cells])

  useEffect(() => {
    hubBtnsRef.current.forEach((btn, id) => btn.classList.toggle('active', id === zoneId))
  }, [zoneId])

  useEffect(() => {
    const map = corridorMapRef.current
    if (!map || !corridorReadyRef.current) return
    const vis = (on: boolean) => (on ? 'visible' : 'none')

    const lightSource = map.getSource('night-lights') as maplibregl.GeoJSONSource | undefined
    if (lightSource) {
      lightSource.setData(getRealNightLightsGeoJson(year))
    }

    if (map.getLayer('night-lights-heat')) {
      map.setLayoutProperty('night-lights-heat', 'visibility', vis(showLights))
      map.setLayoutProperty('night-lights-core', 'visibility', vis(showLights))
    }

    if (map.getLayer('urban-3d')) {
      map.setLayoutProperty('urban-3d', 'visibility', vis(showUrban))
      map.setFilter('urban-3d', ['<=', ['get', 'year'], year])
      map.setPaintProperty('urban-3d', 'fill-extrusion-color', [
        'case',
        ['==', ['get', 'year'], year], '#dcfce7',
        '#5c8aa8',
      ])
    }

    if (map.getLayer('costanera-line')) {
      map.setLayoutProperty('costanera-line', 'visibility', vis(showCostanera))
      map.setLayoutProperty('costanera-glow', 'visibility', vis(showCostanera))
    }
  }, [year, showLights, showUrban, showCostanera])

  function focusTarget(target: ZoneId) {
    setZoneId(target)
    const map = corridorMapRef.current
    if (!map) return
    if (target === 'corridor') {
      map.flyTo({ ...CORRIDOR_OVERVIEW, duration: 1000 })
      return
    }
    const h = CORRIDOR_HUBS.find((x) => x.id === target)
    if (h) map.flyTo({ center: [h.lon, h.lat], zoom: h.zoom, pitch: h.pitch, bearing: h.bearing, duration: 1000 })
  }

  const isHostedOnCfa = typeof window !== 'undefined' && window.location.hostname.includes('constructorafloresaburto.com')
  const siteBase = isHostedOnCfa ? '../' : 'https://constructorafloresaburto.com/'
  const extProps = isHostedOnCfa ? {} : { target: '_blank' as const, rel: 'noopener noreferrer' }

  return (
    <div className="app-shell">
      <nav className="navbar">
        <div className="navbar-inner">
          <a className="nav-brand" href={`${siteBase}?lang=${lang}`} {...extProps}>
            <img src="./logo_flores_aburto.png" alt="Constructora Flores Aburto" />
            <span className="nav-brand-title">
              Constructora Flores Aburto
              <span className="nav-brand-sub">Civil &amp; Industrial Engineering</span>
            </span>
          </a>

          <ul className="nav-links">
            <li><a href={`${siteBase}#about`} {...extProps}>{lang === 'es' ? 'Quiénes Somos' : 'About Us'}</a></li>
            <li><a href={`${siteBase}#services`} {...extProps}>{lang === 'es' ? 'Servicios' : 'Services'}</a></li>
            <li><a href="#inteligencia" className="nav-active">{lang === 'es' ? 'Inteligencia de Mercado' : 'Market Intelligence'}</a></li>
            <li>
              <a className="btn-portal" href={`${siteBase}portal/`} {...extProps}>
                <svg fill="none" height="13" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" width="13" aria-hidden="true">
                  <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>{lang === 'es' ? 'Portal Clientes' : 'Client Portal'}</span>
              </a>
            </li>
          </ul>

          <div className="segmented" role="group" aria-label="Language">
            <button type="button" className={lang === 'es' ? 'on' : ''} onClick={() => setLang('es')}>ES</button>
            <button type="button" className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
          </div>
        </div>
      </nav>

      <main>
        <div className="cfa-stack">
          {/* SECCIÓN 1 (ARRIBA): Globo Terráqueo + Macroeconomía y Competitividad Constructiva */}
          <Card as="section" className="cfa-map-card">
            <div className="row">
              <div>
                <span className="cfa-eyebrow" style={{ color: 'var(--cfa-green)', marginBottom: 4 }}>{t.globeEyebrow}</span>
                <h1>{t.globeTitle}</h1>
                <p className="muted small" style={{ margin: '6px 0 0', maxWidth: '72ch' }}>{t.globeLead}</p>
              </div>
              <div className="cfa-zone-pills">
                {REGIONAL_COUNTRIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`cfa-zone-pill${countryId === c.id ? ' on' : ''}`}
                    onClick={() => selectCountry(c.id)}
                  >
                    {c.name[lang]}
                  </button>
                ))}
              </div>
            </div>

            <div className="cfa-globe-layout">
              <div className="cfa-globe-stage">
                <div ref={globeContainerRef} className="cfa-globe-stage-canvas" />
                <div className="cfa-globe-toolbar">
                  <Switch checked={nightMode} onChange={setNightMode}>
                    <span style={{ color: '#fff' }}>{t.globeNight}</span>
                  </Switch>
                </div>
              </div>

              <aside className="cfa-macro-panel">
                <div className="row">
                  <h2 style={{ fontSize: '1.25rem' }}>{country.name[lang]}</h2>
                  <span className="cfa-gov-tag">
                    {t.indexLabel}: {country.constructionIndex}/100
                  </span>
                </div>
                <p className="muted small" style={{ margin: 0 }}>{country.note[lang]}</p>

                <div className="cfa-macro-grid">
                  <div className="cfa-macro-item">
                    <span>{t.gdpLabel}</span>
                    <strong className="num">${country.gdpUsdB.toFixed(1)}B</strong>
                  </div>
                  <div className="cfa-macro-item">
                    <span>{t.gdpCapLabel}</span>
                    <strong className="num">${country.gdpPerCapitaUsd.toLocaleString('en-US')}</strong>
                  </div>
                  <div className="cfa-macro-item">
                    <span>{t.laborLabel}</span>
                    <strong className="num" style={{ color: country.id === 'nic' ? 'var(--emerald)' : undefined }}>
                      ${country.laborDailyUsd} USD
                    </strong>
                  </div>
                  <div className="cfa-macro-item">
                    <span>{t.sqmLabel}</span>
                    <strong className="num" style={{ color: country.id === 'nic' ? 'var(--emerald)' : undefined }}>
                      ${country.turnkeySqmUsd.toLocaleString('en-US')}/m²
                    </strong>
                  </div>
                </div>

                <div className="cfa-rank-block">
                  <span className="cfa-sidebar-kicker">{t.rankingTitle}</span>
                  {REGIONAL_COUNTRIES.map((c) => (
                    <div key={c.id} className="cfa-rank-row" onClick={() => selectCountry(c.id)}>
                      <span className={c.id === countryId ? 'cfa-rank-active' : ''}>{c.name[lang]}</span>
                      <div className="cfa-rank-track">
                        <div
                          className="cfa-rank-fill"
                          style={{
                            width: `${c.constructionIndex}%`,
                            background: c.id === 'nic' ? 'var(--cfa-green)' : '#94a3b8',
                          }}
                        />
                      </div>
                      <strong className="num small">{c.constructionIndex}</strong>
                    </div>
                  ))}
                  <span className="muted" style={{ fontSize: '0.7rem', marginTop: 4 }}>{t.macroSource}</span>
                </div>

                <Button
                  variant="primary"
                  className="btn-cfa"
                  onClick={() => corridorSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {t.globeJump}
                </Button>
              </aside>
            </div>
          </Card>

          {/* SECCIÓN 2 (ABAJO): Visor 3D Continuo del Corredor Ostional – SJDS – Playa Gigante / Tola */}
          <div ref={corridorSectionRef}>
          <Card as="section" className="cfa-map-card">
            <div className="row">
              <div>
                <span className="cfa-eyebrow" style={{ color: 'var(--cfa-green)', marginBottom: 4 }}>{t.corridorEyebrow}</span>
                <h2>{t.corridorTitle}</h2>
                <p className="muted small" style={{ margin: '4px 0 0' }}>{t.corridorSub}</p>
              </div>
              <div className="cfa-zone-pills">
                <button type="button" className={`cfa-zone-pill${zoneId === 'corridor' ? ' on' : ''}`} onClick={() => focusTarget('corridor')}>
                  {t.allCorridor}
                </button>
                {CORRIDOR_HUBS.map((h) => (
                  <button key={h.id} type="button" className={`cfa-zone-pill${zoneId === h.id ? ' on' : ''}`} onClick={() => focusTarget(h.id)}>
                    {h.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="cfa-map-layout">
              <div className="cfa-map-stage">
                <div ref={corridorContainerRef} className="cfa-map-canvas" />
                <div className="cfa-map-overlay-badge">
                  <strong>{activeHub ? activeHub.name : t.allCorridor} · {year}</strong>
                  <span className="cfa-sensor-pill">{sensorForYear(year, lang)}</span>
                  <span className="num">
                    {(activePoint.nightLightSum / Math.max(1, activeSeries[0].nightLightSum)).toFixed(1)}× {lang === 'es' ? 'luz vs. 2000' : 'light vs. 2000'} · +{activePoint.plusvaliaIndex - 100}% {lang === 'es' ? 'plusvalía' : 'equity'}
                  </span>
                </div>
                <div className="cfa-map-legend">
                  <span className="cfa-legend-item"><i className="cfa-swatch" style={{ background: '#fde047' }} /> {t.lLights}</span>
                  <span className="cfa-legend-item"><i className="cfa-swatch" style={{ background: '#5c8aa8' }} /> {t.lUrban}</span>
                  <span className="cfa-legend-item"><i className="cfa-swatch line" style={{ background: '#4ade80' }} /> {t.lCostanera}</span>
                </div>
              </div>

              <aside className="cfa-map-sidebar">
                <div className="cfa-sidebar-section">
                  <span className="cfa-sidebar-kicker">{t.timeline}</span>
                  <div className="row">
                    <span className="cfa-year-big">{year}</span>
                    <Button variant="secondary" onClick={() => setPlaying((v) => !v)}>
                      {playing ? t.pause : t.play}
                    </Button>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={CORRIDOR_YEARS.length - 1}
                    step={1}
                    value={yearIdx}
                    aria-label={t.timeline}
                    onChange={(e) => {
                      setPlaying(false)
                      setYearIdx(Number(e.target.value))
                    }}
                  />
                  <div className="cfa-year-ticks">
                    <span>2000</span><span>2012</span><span>2015</span><span>2024</span>
                  </div>
                </div>

                <div className="cfa-sidebar-section">
                  <span className="cfa-sidebar-kicker">{t.layers}</span>
                  <Switch checked={showLights} onChange={setShowLights}>{t.lLights}</Switch>
                  <Switch checked={showUrban} onChange={setShowUrban}>{t.lUrban}</Switch>
                  <Switch checked={showCostanera} onChange={setShowCostanera}>{t.lCostanera}</Switch>
                </div>

                <div className="cfa-sidebar-section">
                  <span className="cfa-sidebar-kicker">{t.connTitle}</span>
                  <div className="cfa-conn-box">
                    <div className="cfa-conn-row"><span>{t.connCostanera}</span><strong>{activeHub ? `${activeHub.costaneraKm.toFixed(1)} km` : '45 km'}</strong></div>
                    <div className="cfa-conn-row"><span>{t.connEci}</span><strong>{activeHub ? `${activeHub.eciAirportMin} min` : '14–48 min'}</strong></div>
                    <div className="cfa-conn-row"><span>{t.connBorder}</span><strong>{activeHub ? `${activeHub.penasBlancasMin} min` : '26–52 min'}</strong></div>
                  </div>
                  {activeHub && <p className="muted small" style={{ margin: '6px 0 0' }}>{activeHub.summary[lang]}</p>}
                </div>
              </aside>
            </div>
          </Card>
          </div>

          <section className="cfa-kpi-grid">
            <Kpi
              label={t.kNtl}
              value={`${(activePoint.nightLightSum / Math.max(1, activeSeries[0].nightLightSum)).toFixed(1)}×`}
              num
              color="var(--cfa-green-hover)"
            >
              <span className="muted small">
                {lang === 'es' ? `Año ${year} · Medición satelital NASA` : `Year ${year} · NASA satellite record`}
              </span>
            </Kpi>
            <Kpi label={t.kBuilt} value={`+${activePoint.plusvaliaIndex - 100}%`} num>
              <span className="muted small">
                {lang === 'es' ? `Valorización acumulada desde 2000` : `Estimated land equity gain since 2000`}
              </span>
            </Kpi>
            <Kpi label={t.kAir} value={activeHub ? `${activeHub.eciAirportMin} min` : '14–48 min'} num>
              <span className="muted small">
                {lang === 'es' ? 'Aeropuerto Costa Esmeralda (Tola)' : 'Costa Esmeralda Airport (Tola)'}
              </span>
            </Kpi>
            <Kpi
              label={t.kGrowth}
              value={
                activeHub
                  ? `+${activeHub.ntlGrowthPct.toLocaleString('en-US')}%`
                  : `${activePoint.litPixels ?? 620} ${lang === 'es' ? 'zonas' : 'zones'}`
              }
              num
              color="var(--cfa-green-hover)"
            >
              <span className="muted small">
                {activeHub
                  ? (lang === 'es' ? 'Crecimiento eléctrico y comercial (2000–2024)' : 'Grid & commercial growth (2000–2024)')
                  : (lang === 'es' ? `De 110 zonas en 2000 a 620 en 2024 (+${CORRIDOR_GROWTH_PCT}%)` : `Up from 110 zones in 2000 to 620 in 2024 (+${CORRIDOR_GROWTH_PCT}%)`)}
              </span>
            </Kpi>
          </section>

          <Card as="section">
            <h3>{t.chartTitle} · {activeHub ? activeHub.name : t.allCorridor}</h3>
            <p className="muted small" style={{ margin: '4px 0 0' }}>{t.chartSub}</p>
            <div style={{ width: '100%', height: 280, marginTop: 16 }}>
              <ResponsiveContainer>
                <ComposedChart data={activeSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,20,25,0.08)" />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="plus" tick={{ fontSize: 12 }} domain={[80, 420]} />
                  <YAxis yAxisId="ntl" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <ReferenceLine
                    x={2012}
                    yAxisId="ntl"
                    stroke="#64748b"
                    strokeDasharray="4 4"
                    label={{ value: 'VIIRS 500m →', position: 'top', fontSize: 11, fill: '#64748b' }}
                  />
                  <Area
                    yAxisId="plus"
                    type="monotone"
                    dataKey="plusvaliaIndex"
                    name={lang === 'es' ? 'Índice de Plusvalía Costera (2000=100)' : 'Coastal Appreciation Index (2000=100)'}
                    stroke="#0284c7"
                    fill="rgba(2, 132, 199, 0.16)"
                    strokeWidth={2.5}
                  />
                  <Line
                    yAxisId="ntl"
                    type="monotone"
                    dataKey="nightLightSum"
                    name={lang === 'es' ? 'Radiancia nocturna medida (suma)' : 'Measured nighttime radiance (sum)'}
                    stroke="#60b821"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <Disclosure title={t.methodTitle} className="spaced">
              <p className="small muted" style={{ margin: 0 }}>{t.methodBody}</p>
            </Disclosure>
          </Card>
        </div>
      </main>

      <footer className="footer">
        <div className="footer-container">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <img
                src="./logo_flores_aburto.png"
                alt="Constructora Flores Aburto"
                style={{ height: 40, width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
              />
              <span style={{ fontSize: 17, fontWeight: 800, color: '#ffffff' }}>Constructora Flores Aburto</span>
            </div>
            <p>
              {lang === 'es'
                ? 'Firma líder en ingeniería Civil e Industrial en San Juan del Sur, Rivas, Nicaragua. Certeza física, contratos a precio cerrado y soluciones de eco-ingeniería.'
                : 'Premier Civil & Industrial Engineering firm in San Juan del Sur, Rivas, Nicaragua. Physical certainty, fixed-price turnkey contracts, and eco-engineering.'}
            </p>
            <p style={{ marginTop: 10, color: '#64748b' }}>RUC: 5610706991000K | San Juan del Sur, Nicaragua</p>
          </div>
          <div>
            <h4>{lang === 'es' ? 'Contacto Directo' : 'Direct Contact'}</h4>
            <ul>
              <li><a href="https://wa.me/50587253327" target="_blank" rel="noreferrer">WhatsApp: +505 8725-3327</a></li>
              <li><a href="mailto:cfanic505@gmail.com">cfanic505@gmail.com</a></li>
              <li><a href="https://instagram.com/cfanic505" target="_blank" rel="noreferrer">Instagram: @cfanic505</a></li>
              <li>San Juan del Sur, Rivas, Nicaragua</li>
            </ul>
          </div>
          <div>
            <h4>{lang === 'es' ? 'Navegación' : 'Navigation'}</h4>
            <ul>
              <li><a href={`${siteBase}#about`} {...extProps}>{lang === 'es' ? 'Quiénes Somos' : 'About Us'}</a></li>
              <li><a href={`${siteBase}#services`} {...extProps}>{lang === 'es' ? 'Servicios de Ingeniería' : 'Engineering Services'}</a></li>
              <li><a href={`${siteBase}#gallery`} {...extProps}>{lang === 'es' ? 'Galería de Obras' : 'Project Gallery'}</a></li>
              <li><a href={`${siteBase}#dossier`} {...extProps}>{lang === 'es' ? 'Dossier Institucional (PDF)' : 'Institutional Dossier (PDF)'}</a></li>
              <li><a href={`${siteBase}portal/`} {...extProps}>{lang === 'es' ? 'Portal de Clientes' : 'Client Portal'}</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          © 2026 Constructora Flores Aburto (CFA). {lang === 'es' ? 'Todos los derechos reservados.' : 'All rights reserved.'}
        </div>
      </footer>
    </div>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl, { type StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  buildContinuousCorridor,
  CORRIDOR_HUBS,
  CORRIDOR_TOTAL_SERIES,
  CORRIDOR_YEARS,
  COSTANERA_MTI_GEOJSON,
  REGIONAL_COUNTRIES,
  sensorForYear,
  type CorridorYear,
  type CountryId,
  type Lang,
  type ZoneId,
} from './corridorData'
import { Button, Card, Kpi, Switch } from './ui'

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
    macroSource: 'Ref. macro: Banco Mundial / FMI · Costos: benchmark sectorial regional',
    corridorEyebrow: 'VISOR 3D CONTINUO · OSTIONAL → SAN JUAN DEL SUR → PLAYA GIGANTE / TOLA',
    corridorTitle: 'Desarrollo costero continuo y luces nocturnas (1995–2035)',
    corridorSub: 'Mueve la línea de tiempo para observar cómo se encienden las luces nocturnas y se consolida la franja de 45 km.',
    allCorridor: 'Tramo completo (45 km)',
    timeline: 'Línea de tiempo (1995–2035)',
    play: 'Reproducir',
    pause: 'Pausar',
    layers: 'Capas activas',
    lLights: 'Luces nocturnas dinámicas',
    lUrban: 'Crecimiento 3D continuo',
    lCostanera: 'Vector Costanera (MTI)',
    connTitle: 'Logística y conectividad',
    connCostanera: 'Carretera Costanera (MTI)',
    connEci: 'Aeropuerto Costa Esmeralda (ECI)',
    connBorder: 'Frontera Peñas Blancas (CR)',
    kNtl: 'Índice lumínico nocturno',
    kBuilt: 'Huella construida 2025 → 2035',
    kAir: 'Acceso aéreo (ECI)',
    kGrowth: 'Expansión lumínica (1995–2025)',
    chartTitle: 'Evolución lumínica y expansión física',
    chartSub: 'Crecimiento continuo de actividad nocturna (0–100) y superficie construida (ha) · 1995–2035',
    footerLeft: 'Constructora Flores Aburto (CFA) · San Juan del Sur, Rivas, Nicaragua',
    footerRight: 'Globo macroeconómico regional + corredor costero continuo Ostional – San Juan del Sur – Tola',
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
    macroSource: 'Macro ref.: World Bank / IMF · Costs: regional construction benchmark',
    corridorEyebrow: 'CONTINUOUS 3D VIEWER · OSTIONAL → SAN JUAN DEL SUR → PLAYA GIGANTE / TOLA',
    corridorTitle: 'Continuous coastal growth & nighttime lights (1995–2035)',
    corridorSub: 'Scrub the timeline to watch nighttime lights ignite and connect along the 45 km coastline.',
    allCorridor: 'Full 45 km stretch',
    timeline: 'Timeline (1995–2035)',
    play: 'Play',
    pause: 'Pause',
    layers: 'Active layers',
    lLights: 'Dynamic nighttime lights',
    lUrban: 'Continuous 3D growth',
    lCostanera: 'Costanera Vector (MTI)',
    connTitle: 'Logistics & connectivity',
    connCostanera: 'Costanera Highway (MTI)',
    connEci: 'Costa Esmeralda Airport (ECI)',
    connBorder: 'Peñas Blancas Border (CR)',
    kNtl: 'Nighttime Light Index',
    kBuilt: 'Built-up footprint 2025 → 2035',
    kAir: 'Air access (ECI)',
    kGrowth: 'Light growth (1995–2025)',
    chartTitle: 'Night-light & physical expansion',
    chartSub: 'Continuous nighttime activity (0–100) and built-up area (ha) · 1995–2035',
    footerLeft: 'Constructora Flores Aburto (CFA) · San Juan del Sur, Rivas, Nicaragua',
    footerRight: 'Regional macro globe + continuous coastal corridor Ostional – San Juan del Sur – Tola',
  },
} as const

function initialLang(): Lang {
  const q = new URLSearchParams(window.location.search).get('lang')
  return q === 'en' || q === 'es' ? q : 'es'
}

export default function App() {
  const [lang, setLang] = useState<Lang>(initialLang)
  const [countryId, setCountryId] = useState<CountryId>('nic')
  const [nightMode, setNightMode] = useState(true)

  const [zoneId, setZoneId] = useState<ZoneId>('corridor')
  const [yearIdx, setYearIdx] = useState<number>(CORRIDOR_YEARS.indexOf(2025))
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
  const { cells, lights } = useMemo(() => buildContinuousCorridor(), [])
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
      map.addLayer({ id: 'costanera-glow', type: 'line', source: 'costanera', paint: { 'line-color': '#166534', 'line-width': 8, 'line-opacity': 0.35 } })
      map.addLayer({ id: 'costanera-line', type: 'line', source: 'costanera', paint: { 'line-color': '#4ade80', 'line-width': 2.5 } })

      map.addSource('night-lights', { type: 'geojson', data: lights })
      map.addLayer({
        id: 'night-lights-heat',
        type: 'heatmap',
        source: 'night-lights',
        filter: ['<=', ['get', 'year'], 2025],
        paint: {
          'heatmap-weight': ['get', 'weight'],
          'heatmap-intensity': 1.25,
          'heatmap-radius': 26,
          'heatmap-opacity': 0.85,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0,0,0,0)',
            0.2, 'rgba(180, 83, 9, 0.35)',
            0.45, 'rgba(245, 158, 11, 0.65)',
            0.75, 'rgba(253, 224, 71, 0.88)',
            1, 'rgba(255, 251, 235, 1)',
          ],
        },
      })
      map.addLayer({
        id: 'night-lights-core',
        type: 'circle',
        source: 'night-lights',
        filter: ['<=', ['get', 'year'], 2025],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 2.2, 13, 4.5],
          'circle-color': '#fef08a',
          'circle-opacity': 0.8,
          'circle-blur': 0.5,
        },
      })

      map.addSource('corridor-cells', { type: 'geojson', data: cells })
      map.addLayer({
        id: 'urban-3d',
        type: 'fill-extrusion',
        source: 'corridor-cells',
        filter: ['<=', ['get', 'year'], 2025],
        paint: {
          'fill-extrusion-color': ['case', ['>', ['get', 'year'], 2025], '#22c55e', '#5c8aa8'],
          'fill-extrusion-height': ['*', ['get', 'height'], 8],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.78,
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
  }, [cells, lights])

  useEffect(() => {
    hubBtnsRef.current.forEach((btn, id) => btn.classList.toggle('active', id === zoneId))
  }, [zoneId])

  useEffect(() => {
    const map = corridorMapRef.current
    if (!map || !corridorReadyRef.current) return
    const vis = (on: boolean) => (on ? 'visible' : 'none')
    const progress = (year - 1995) / (2035 - 1995)

    if (map.getLayer('night-lights-heat')) {
      map.setLayoutProperty('night-lights-heat', 'visibility', vis(showLights))
      map.setLayoutProperty('night-lights-core', 'visibility', vis(showLights))
      map.setFilter('night-lights-heat', ['<=', ['get', 'year'], year])
      map.setFilter('night-lights-core', ['<=', ['get', 'year'], year])
      map.setPaintProperty('night-lights-heat', 'heatmap-intensity', 0.65 + progress * 1.15)
      map.setPaintProperty('night-lights-heat', 'heatmap-radius', 16 + progress * 18)
    }

    if (map.getLayer('urban-3d')) {
      map.setLayoutProperty('urban-3d', 'visibility', vis(showUrban))
      map.setFilter('urban-3d', ['<=', ['get', 'year'], year])
      map.setPaintProperty('urban-3d', 'fill-extrusion-color', [
        'case',
        ['==', ['get', 'year'], year], '#dcfce7',
        ['>', ['get', 'year'], 2025], '#22c55e',
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

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand-wrap">
            <div className="brand-mark">CFA</div>
            <div>
              <div className="brand-title">Constructora Flores Aburto</div>
              <div className="brand-sub">{t.brandSub}</div>
            </div>
          </div>

          <div className="topbar-right">
            <a className="back-link" href={`https://constructorafloresaburto.com/?lang=${lang}`} rel="noopener">
              {t.backHome}
            </a>
            <div className="segmented" role="group" aria-label="Language">
              <button type="button" className={lang === 'es' ? 'on' : ''} onClick={() => setLang('es')}>ES</button>
              <button type="button" className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
            </div>
          </div>
        </div>
      </header>

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
                  className="btn-brass"
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
                  <span className="num">NTL {activePoint.nightLightIdx}/100 · {activePoint.builtHa} ha</span>
                </div>
                <div className="cfa-map-legend">
                  <span className="cfa-legend-item"><i className="cfa-swatch" style={{ background: '#fde047' }} /> {t.lLights}</span>
                  <span className="cfa-legend-item"><i className="cfa-swatch" style={{ background: '#5c8aa8' }} /> ≤ 2025</span>
                  <span className="cfa-legend-item"><i className="cfa-swatch" style={{ background: '#22c55e' }} /> 2030–2035</span>
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
                    <span>1995</span><span>2012</span><span>2025</span><span>2035</span>
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
            <Kpi label={t.kNtl} value={`${activePoint.nightLightIdx}/100`} num color="var(--cfa-green)">
              <span className="muted small">{year} · {sensorForYear(year, lang)}</span>
            </Kpi>
            <Kpi label={t.kBuilt} value={`${activeSeries[5].builtHa} → ${activeSeries[7].builtHa} ha`} num>
              <span className="muted small">{activeHub ? activeHub.name : t.allCorridor}</span>
            </Kpi>
            <Kpi label={t.kAir} value={activeHub ? `${activeHub.eciAirportMin} min` : '14–48 min'} num>
              <span className="muted small">Aeropuerto Costa Esmeralda</span>
            </Kpi>
            <Kpi label={t.kGrowth} value={activeHub ? `+${activeHub.ntlGrowthPct}%` : '+346%'} num color="var(--emerald)">
              <span className="muted small">1995 → 2025</span>
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
                  <YAxis yAxisId="ha" tick={{ fontSize: 12 }} unit=" ha" />
                  <YAxis yAxisId="ntl" orientation="right" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Area
                    yAxisId="ha"
                    type="monotone"
                    dataKey="builtHa"
                    name={lang === 'es' ? 'Área construida (ha)' : 'Built-up area (ha)'}
                    stroke="#1f4e68"
                    fill="rgba(31, 78, 104, 0.22)"
                    strokeWidth={2.5}
                  />
                  <Line
                    yAxisId="ntl"
                    type="monotone"
                    dataKey="nightLightIdx"
                    name={lang === 'es' ? 'Índice luces nocturnas (0–100)' : 'Nighttime Light Index (0–100)'}
                    stroke="#166534"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <span><strong>{t.footerLeft}</strong></span>
          <span>{t.footerRight}</span>
        </div>
      </footer>
    </div>
  )
}

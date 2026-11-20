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
  buildCorridorCells,
  CORRIDOR_YEARS,
  CORRIDOR_ZONES,
  COSTANERA_MTI_GEOJSON,
  MARENA_PROTECTED_GEOJSON,
  PUBLIC_LANDMARKS,
  sensorForYear,
  SINAPRED_HAZARD_GEOJSON,
  type CorridorYear,
  type CorridorZone,
  type Lang,
  type ZoneId,
} from './corridorData'
import { DataTable, type Column } from './DataTable'
import { Button, Card, Disclosure, Kpi, Switch } from './ui'

const ESRI_IMAGERY = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const NASA_VIIRS_NIGHT =
  'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png'

const CORRIDOR_OVERVIEW = {
  center: [-85.895, 11.255] as [number, number],
  zoom: 10.4,
  pitch: 46,
  bearing: -24,
}

const BASE_STYLE: StyleSpecification = {
  version: 8,
  projection: { type: 'globe' },
  sky: { 'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 1, 7, 0] },
  sources: {
    satellite: {
      type: 'raster',
      tileSize: 256,
      maxzoom: 17,
      tiles: [ESRI_IMAGERY],
      attribution: 'Esri World Imagery · NASA DMSP-OLS / VIIRS Black Marble · Copernicus DEM · MTI / MARENA / INETER / INIDE',
    },
    viirs: {
      type: 'raster',
      tileSize: 256,
      maxzoom: 8,
      tiles: [NASA_VIIRS_NIGHT],
      attribution: 'NASA GIBS · VIIRS Black Marble',
    },
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#06112b' } },
    { id: 'satellite', type: 'raster', source: 'satellite', paint: { 'raster-brightness-max': 0.84, 'raster-contrast': 0.1 } },
    { id: 'viirs', type: 'raster', source: 'viirs', layout: { visibility: 'visible' }, paint: { 'raster-opacity': 0.65 } },
  ],
}

const COPY = {
  es: {
    brandSub: 'Ingeniería Civil & Industrial · Pacífico Sur, Rivas',
    backHome: '← Constructora Flores Aburto',
    eyebrow: 'CONSTRUCTORA FLORES ABURTO · DEBIDA DILIGENCIA FÍSICA Y DE CAPITAL',
    headline: 'La construcción empírica ignora la física. Nosotros diseñamos sobre evidencia.',
    lead: 'Cruzamos 30 años de luces nocturnas orbitales (DMSP-OLS / NASA VIIRS), elevación del terreno y datos oficiales del MTI, MARENA y SINAPRED en Ostional, San Juan del Sur y Playa Gigante (Tola) para garantizar certeza estructural, logística JIT y preservación de capital.',
    chips: ['Luces nocturnas 1995–2025', 'Sin exposición de obras privadas', 'Logística ECI · Costanera · Peñas Blancas'],
    mapTitle: 'Corredor Costero de Rivas · Ostional → San Juan del Sur → Playa Gigante',
    mapSub: 'Selecciona un polo o hito público para inspeccionar topografía, conectividad vial y consolidación nocturna.',
    allCorridor: 'Corredor completo',
    timeline: 'Horizonte temporal (1995–2035)',
    play: 'Reproducir',
    pause: 'Pausar',
    layers: 'Capas orbitales y oficiales',
    lViirs: 'Luces nocturnas (NASA VIIRS)',
    lUrban: 'Huella construida 3D',
    lCostanera: 'Vector Costanera (MTI)',
    lMarena: 'Refugio La Flor (MARENA)',
    lSinapred: 'Franja de amenaza baja (SINAPRED)',
    connTitle: 'Conectividad y cadena de suministro',
    connCostanera: 'Carretera Costanera (MTI)',
    connEci: 'Aeropuerto Costa Esmeralda (ECI)',
    connBorder: 'Frontera Peñas Blancas (CR)',
    kNtl: 'Índice de consolidación nocturna',
    kBuilt: 'Huella construida 2025 → 2035',
    kAir: 'Acceso aéreo (ECI · Tola)',
    kSafe: 'Cota segura + Vivienda INIDE',
    chartTitle: 'Volumen de capital y expansión física',
    chartSub: 'Consolidación nocturna (VIIRS/DMSP-OLS) frente a área construida (ha) · 1995–2035',
    ddTitle: 'Certeza jurídica, ambiental y geotécnica',
    engTitle: 'Estándar de Ingeniería de Valor CFA para este entorno',
    engSub: 'Sin revelar ubicaciones privadas de proyectos: así neutraliza nuestra ingeniería las fuerzas físicas y operativas de este polo.',
    tableTitle: 'Matriz comparativa del corredor Pacífico Sur (1995–2035)',
    tableSub: 'Haz clic en cualquier polo para enfocar la cámara 3D o exporta el dossier técnico en CSV.',
    csvBtn: 'Exportar dossier CSV',
    methodTitle: 'Nota metodológica y resguardo de seguridad',
    methodBody: 'Por seguridad de proyectos y propietarios, CFA no publica coordenadas de obras privadas. Los marcadores corresponden exclusivamente a hitos geográficos públicos. La serie 1995–2012 proviene de DMSP-OLS (~1 km) y 2012–2025 de NASA VIIRS Black Marble (~500 m); en producción las capas oficiales (MTI, MARENA, INETER/SINAPRED) se sirven mediante proxy seguro en servidor.',
    footerLeft: 'Constructora Flores Aburto (CFA) · San Juan del Sur, Rivas, Nicaragua',
    footerRight: 'Fuentes: NASA DMSP-OLS / VIIRS · Esri · Copernicus DEM · MTI · MARENA · INETER / SINAPRED · INIDE',
  },
  en: {
    brandSub: 'Civil & Industrial Engineering · Rivas South Pacific',
    backHome: '← Constructora Flores Aburto',
    eyebrow: 'CONSTRUCTORA FLORES ABURTO · PHYSICAL & CAPITAL DUE DILIGENCE',
    headline: 'Empirical construction ignores physics. We engineer on hard evidence.',
    lead: 'We cross-reference 30 years of orbital night-lights (DMSP-OLS / NASA VIIRS), terrain elevation, and official MTI, MARENA, and SINAPRED data across Ostional, San Juan del Sur, and Playa Gigante (Tola) to deliver structural survival, JIT supply certainty, and asset longevity.',
    chips: ['Nighttime lights 1995–2025', 'Zero private project coordinates', 'ECI Airport · Coastal Highway · Peñas Blancas'],
    mapTitle: 'Rivas Coastal Corridor · Ostional → San Juan del Sur → Playa Gigante',
    mapSub: 'Select a public hub or landmark to inspect elevation, highway access, and nighttime consolidation.',
    allCorridor: 'Full corridor',
    timeline: 'Time horizon (1995–2035)',
    play: 'Play',
    pause: 'Pause',
    layers: 'Orbital & official layers',
    lViirs: 'Nighttime lights (NASA VIIRS)',
    lUrban: '3D built-up footprint',
    lCostanera: 'Costanera Highway Vector (MTI)',
    lMarena: 'La Flor Refuge (MARENA)',
    lSinapred: 'Low coastal hazard zone (SINAPRED)',
    connTitle: 'Logistics & supply chain access',
    connCostanera: 'Coastal Highway (MTI)',
    connEci: 'Costa Esmeralda Airport (ECI)',
    connBorder: 'Peñas Blancas Border (CR)',
    kNtl: 'Nighttime Consolidation Index',
    kBuilt: 'Built-up footprint 2025 → 2035',
    kAir: 'Air access (ECI · Tola)',
    kSafe: 'Safe elevation + INIDE housing',
    chartTitle: 'Capital volume & physical expansion',
    chartSub: 'Nighttime light consolidation (VIIRS/DMSP-OLS) vs. built-up area (ha) · 1995–2035',
    ddTitle: 'Geotechnical, environmental & market certainty',
    engTitle: 'CFA Value Engineering standard for this environment',
    engSub: 'Without disclosing private project coordinates: how our engineering neutralizes physical and operational risks in this hub.',
    tableTitle: 'South Pacific Corridor comparative matrix (1995–2035)',
    tableSub: 'Click any hub to fly the 3D camera or export the technical dossier as CSV.',
    csvBtn: 'Export CSV dossier',
    methodTitle: 'Methodology & security protocol',
    methodBody: 'For project and owner security, CFA never publishes coordinates of private builds. Map pins represent public geographic landmarks only. 1995–2012 reflects historical DMSP-OLS (~1 km) and 2012–2025 reflects NASA VIIRS Black Marble (~500 m); in production, official GIS layers and API keys are routed through a secure server-side proxy.',
    footerLeft: 'Constructora Flores Aburto (CFA) · San Juan del Sur, Rivas, Nicaragua',
    footerRight: 'Sources: NASA DMSP-OLS / VIIRS · Esri · Copernicus DEM · MTI · MARENA · INETER / SINAPRED · INIDE',
  },
} as const

function initialLang(): Lang {
  const q = new URLSearchParams(window.location.search).get('lang')
  if (q === 'en' || q === 'es') return q
  return 'es'
}

export default function App() {
  const [lang, setLang] = useState<Lang>(initialLang)
  const [zoneId, setZoneId] = useState<ZoneId>('sjds')
  const [yearIdx, setYearIdx] = useState<number>(CORRIDOR_YEARS.indexOf(2025))
  const [playing, setPlaying] = useState(false)

  const [showViirs, setShowViirs] = useState(true)
  const [showUrban3d, setShowUrban3d] = useState(true)
  const [showCostanera, setShowCostanera] = useState(true)
  const [showMarena, setShowMarena] = useState(true)
  const [showSinapred, setShowSinapred] = useState(true)

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const mapReadyRef = useRef(false)
  const markersRef = useRef<Map<ZoneId, HTMLButtonElement>>(new Map())

  const t = COPY[lang]
  const year: CorridorYear = CORRIDOR_YEARS[yearIdx]
  const zone = CORRIDOR_ZONES.find((z) => z.id === zoneId) ?? CORRIDOR_ZONES[1]
  const cellsGeoJson = useMemo(() => buildCorridorCells(), [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setYearIdx((prev) => (prev + 1) % CORRIDOR_YEARS.length)
    }, 1250)
    return () => window.clearInterval(timer)
  }, [playing])

  useEffect(() => {
    const el = mapContainerRef.current
    if (!el) return

    const map = new maplibregl.Map({
      container: el,
      style: BASE_STYLE,
      center: CORRIDOR_OVERVIEW.center,
      zoom: CORRIDOR_OVERVIEW.zoom,
      pitch: CORRIDOR_OVERVIEW.pitch,
      bearing: CORRIDOR_OVERVIEW.bearing,
      maxPitch: 68,
    })

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')
    mapRef.current = map

    const createdMarkers: maplibregl.Marker[] = []
    const markerButtons = new Map<ZoneId, HTMLButtonElement>()

    map.on('load', () => {
      mapReadyRef.current = true

      map.addSource('marena', { type: 'geojson', data: MARENA_PROTECTED_GEOJSON })
      map.addLayer({ id: 'marena-fill', type: 'fill', source: 'marena', paint: { 'fill-color': '#10b981', 'fill-opacity': 0.28 } })
      map.addLayer({ id: 'marena-line', type: 'line', source: 'marena', paint: { 'line-color': '#34d399', 'line-width': 2, 'line-dasharray': [3, 2] } })

      map.addSource('sinapred', { type: 'geojson', data: SINAPRED_HAZARD_GEOJSON })
      map.addLayer({ id: 'sinapred-fill', type: 'fill', source: 'sinapred', paint: { 'fill-color': '#ef4444', 'fill-opacity': 0.34 } })
      map.addLayer({ id: 'sinapred-line', type: 'line', source: 'sinapred', paint: { 'line-color': '#f87171', 'line-width': 1.5 } })

      map.addSource('costanera', { type: 'geojson', data: COSTANERA_MTI_GEOJSON })
      map.addLayer({ id: 'costanera-glow', type: 'line', source: 'costanera', paint: { 'line-color': '#f59e0b', 'line-width': 7, 'line-opacity': 0.28 } })
      map.addLayer({ id: 'costanera-line', type: 'line', source: 'costanera', paint: { 'line-color': '#fbbf24', 'line-width': 3 } })

      map.addSource('corridor-cells', { type: 'geojson', data: cellsGeoJson })
      map.addLayer({
        id: 'urban-3d',
        type: 'fill-extrusion',
        source: 'corridor-cells',
        filter: ['<=', ['get', 'year'], 2025],
        paint: {
          'fill-extrusion-color': ['case', ['>', ['get', 'year'], 2025], '#56e1e8', '#3b82f6'],
          'fill-extrusion-height': ['*', ['get', 'height'], 9],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.88,
        },
      })

      CORRIDOR_ZONES.forEach((z) => {
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.className = `cfa-marker${z.id === zoneId ? ' active' : ''}`
        btn.textContent = z.name
        btn.addEventListener('click', () => {
          setZoneId(z.id)
          map.flyTo({ center: [z.lon, z.lat], zoom: z.zoom, pitch: z.pitch, bearing: z.bearing, duration: 1000 })
        })
        markerButtons.set(z.id, btn)
        createdMarkers.push(new maplibregl.Marker({ element: btn, anchor: 'bottom' }).setLngLat([z.lon, z.lat]).addTo(map))
      })
      markersRef.current = markerButtons

      PUBLIC_LANDMARKS.forEach((lm) => {
        const tag = document.createElement('span')
        tag.className = 'cfa-marker landmark'
        tag.textContent = lm.name.es
        createdMarkers.push(new maplibregl.Marker({ element: tag, anchor: 'bottom' }).setLngLat([lm.lon, lm.lat]).addTo(map))
      })
    })

    return () => {
      mapReadyRef.current = false
      createdMarkers.forEach((m) => m.remove())
      markersRef.current.clear()
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cellsGeoJson])

  useEffect(() => {
    markersRef.current.forEach((btn, id) => btn.classList.toggle('active', id === zoneId))
  }, [zoneId])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReadyRef.current) return
    const vis = (on: boolean) => (on ? 'visible' : 'none')

    if (map.getLayer('urban-3d')) {
      map.setLayoutProperty('urban-3d', 'visibility', vis(showUrban3d))
      map.setFilter('urban-3d', ['<=', ['get', 'year'], year])
      map.setPaintProperty('urban-3d', 'fill-extrusion-color', [
        'case',
        ['==', ['get', 'year'], year], '#f4ffff',
        ['>', ['get', 'year'], 2025], '#56e1e8',
        '#3b82f6',
      ])
    }
    if (map.getLayer('costanera-line')) {
      map.setLayoutProperty('costanera-line', 'visibility', vis(showCostanera))
      map.setLayoutProperty('costanera-glow', 'visibility', vis(showCostanera))
    }
    if (map.getLayer('marena-fill')) {
      map.setLayoutProperty('marena-fill', 'visibility', vis(showMarena))
      map.setLayoutProperty('marena-line', 'visibility', vis(showMarena))
    }
    if (map.getLayer('sinapred-fill')) {
      map.setLayoutProperty('sinapred-fill', 'visibility', vis(showSinapred))
      map.setLayoutProperty('sinapred-line', 'visibility', vis(showSinapred))
    }
    if (map.getLayer('viirs')) {
      map.setLayoutProperty('viirs', 'visibility', vis(showViirs))
    }
  }, [year, showUrban3d, showCostanera, showMarena, showSinapred, showViirs])

  function focusZone(target: ZoneId | 'all') {
    const map = mapRef.current
    if (target === 'all') {
      map?.flyTo({ ...CORRIDOR_OVERVIEW, duration: 1000 })
      return
    }
    setZoneId(target)
    const z = CORRIDOR_ZONES.find((item) => item.id === target)
    if (z && map) {
      map.flyTo({ center: [z.lon, z.lat], zoom: z.zoom, pitch: z.pitch, bearing: z.bearing, duration: 1000 })
    }
  }

  const activePoint = zone.series.find((s) => s.year === year) ?? zone.series[5]

  const columns: Column<CorridorZone>[] = [
    {
      id: 'name',
      header: lang === 'es' ? 'Hito del corredor' : 'Corridor hub',
      cell: (r) => (
        <button type="button" className="link" onClick={() => focusZone(r.id)}>
          <strong>{r.name}</strong>
          <span className="muted small" style={{ display: 'block' }}>{r.municipality}</span>
        </button>
      ),
      csv: (r) => `${r.name} (${r.municipality})`,
    },
    {
      id: 'ntl',
      header: lang === 'es' ? 'Luces 1995→2025' : 'Lights 1995→2025',
      align: 'right',
      cell: (r) => <strong className="num">+{r.ntlGrowth1995_2025Pct}%</strong>,
      csv: (r) => `+${r.ntlGrowth1995_2025Pct}%`,
    },
    {
      id: 'built',
      header: lang === 'es' ? 'Huella 2025→2035' : 'Footprint 2025→2035',
      align: 'right',
      cell: (r) => <span className="num">{r.built2025Ha} → {r.built2035Ha} ha</span>,
      csv: (r) => `${r.built2025Ha} -> ${r.built2035Ha} ha`,
    },
    {
      id: 'eci',
      header: lang === 'es' ? 'Aeropuerto ECI' : 'ECI Airport',
      align: 'right',
      cell: (r) => <span className="num">{r.eciAirportMin} min</span>,
      csv: (r) => `${r.eciAirportMin} min`,
    },
    {
      id: 'costanera',
      header: 'Costanera (MTI)',
      align: 'right',
      cell: (r) => <span className="num">{r.costaneraKm.toFixed(1)} km</span>,
      csv: (r) => `${r.costaneraKm.toFixed(1)} km`,
    },
    {
      id: 'inide',
      header: 'INIDE',
      align: 'right',
      cell: (r) => <span className="num">+{r.inideHousingGrowthPct}%</span>,
      csv: (r) => `+${r.inideHousingGrowthPct}%`,
    },
    {
      id: 'safe',
      header: 'MARENA / SINAPRED',
      cell: (r) => <span className="small">{r.sinapredStatus[lang]}</span>,
      csv: (r) => `${r.marenaStatus[lang]} | ${r.sinapredStatus[lang]}`,
    },
  ]

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
            <a className="back-link" href="https://constructorafloresaburto.com" rel="noopener">
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
          <Card as="section" className="cfa-hero">
            <span className="cfa-eyebrow">{t.eyebrow}</span>
            <h1>{t.headline}</h1>
            <p className="cfa-hero-lead">{t.lead}</p>
            <div className="cfa-hero-meta">
              {t.chips.map((c) => (
                <span key={c} className="cfa-chip">{c}</span>
              ))}
            </div>
          </Card>

          <Card as="section">
            <div className="row">
              <div>
                <h2>{t.mapTitle}</h2>
                <p className="muted small" style={{ margin: '4px 0 0' }}>{t.mapSub}</p>
              </div>
              <div className="cfa-zone-pills">
                <button
                  type="button"
                  className="cfa-zone-pill"
                  onClick={() => mapRef.current?.flyTo({ center: [-85.8, 12.2], zoom: 2.2, pitch: 0, bearing: 0, duration: 1200 })}
                >
                  {lang === 'es' ? 'Globo 3D' : '3D Globe'}
                </button>
                <button type="button" className="cfa-zone-pill" onClick={() => focusZone('all')}>{t.allCorridor}</button>
                {CORRIDOR_ZONES.map((z) => (
                  <button key={z.id} type="button" className={`cfa-zone-pill${zoneId === z.id ? ' on' : ''}`} onClick={() => focusZone(z.id)}>
                    {z.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="cfa-map-layout">
              <div className="cfa-map-stage">
                <div ref={mapContainerRef} className="cfa-map-canvas" />
                <div className="cfa-map-overlay-badge">
                  <strong>{zone.name} · {year}</strong>
                  <span className="cfa-sensor-pill">{sensorForYear(year, lang)}</span>
                  <span className="num">NTL {activePoint.nightLightIdx}/100 · {activePoint.builtHa} ha</span>
                </div>
                <div className="cfa-map-legend">
                  <span className="cfa-legend-item"><i className="cfa-swatch" style={{ background: '#fbbf24' }} /> VIIRS / DMSP-OLS</span>
                  <span className="cfa-legend-item"><i className="cfa-swatch" style={{ background: '#3b82f6' }} /> ≤ 2025</span>
                  <span className="cfa-legend-item"><i className="cfa-swatch" style={{ background: '#56e1e8' }} /> 2030–2035</span>
                  <span className="cfa-legend-item"><i className="cfa-swatch line" style={{ background: '#fbbf24' }} /> Costanera (MTI)</span>
                  <span className="cfa-legend-item"><i className="cfa-swatch" style={{ background: '#10b981' }} /> MARENA</span>
                  <span className="cfa-legend-item"><i className="cfa-swatch" style={{ background: '#ef4444' }} /> SINAPRED</span>
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
                  <Switch checked={showViirs} onChange={setShowViirs}>{t.lViirs}</Switch>
                  <Switch checked={showUrban3d} onChange={setShowUrban3d}>{t.lUrban}</Switch>
                  <Switch checked={showCostanera} onChange={setShowCostanera}>{t.lCostanera}</Switch>
                  <Switch checked={showMarena} onChange={setShowMarena}>{t.lMarena}</Switch>
                  <Switch checked={showSinapred} onChange={setShowSinapred}>{t.lSinapred}</Switch>
                </div>

                <div className="cfa-sidebar-section">
                  <span className="cfa-sidebar-kicker">{t.connTitle}</span>
                  <div className="cfa-conn-box">
                    <div className="cfa-conn-row"><span>{t.connCostanera}</span><strong>{zone.costaneraKm.toFixed(1)} km</strong></div>
                    <div className="cfa-conn-row"><span>{t.connEci}</span><strong>{zone.eciAirportMin} min</strong></div>
                    <div className="cfa-conn-row"><span>{t.connBorder}</span><strong>{zone.penasBlancasMin} min</strong></div>
                  </div>
                </div>
              </aside>
            </div>
          </Card>

          <section className="cfa-kpi-grid">
            <Kpi label={t.kNtl} value={`${zone.ntl2025}/100`} num color="var(--accent-deep)">
              <span className="muted small">+{zone.ntlGrowth1995_2025Pct}% (1995 → 2025)</span>
            </Kpi>
            <Kpi label={t.kBuilt} value={`${zone.built2025Ha} → ${zone.built2035Ha} ha`} num>
              <span className="muted small">{zone.tag[lang]}</span>
            </Kpi>
            <Kpi label={t.kAir} value={`${zone.eciAirportMin} min`} num>
              <span className="muted small">Costanera {zone.costaneraKm.toFixed(1)} km</span>
            </Kpi>
            <Kpi label={t.kSafe} value={`+${zone.elevationM} m`} num color="var(--emerald)">
              <span className="muted small">+{zone.inideHousingGrowthPct}% INIDE</span>
            </Kpi>
          </section>

          <div className="cfa-two-col">
            <Card as="section">
              <h3>{t.chartTitle} · {zone.name}</h3>
              <p className="muted small" style={{ margin: '4px 0 0' }}>{t.chartSub}</p>
              <div style={{ width: '100%', height: 280, marginTop: 16 }}>
                <ResponsiveContainer>
                  <ComposedChart data={zone.series}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,2,61,0.08)" />
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
                      stroke="#0a7c84"
                      fill="rgba(86, 225, 232, 0.35)"
                      strokeWidth={2.5}
                    />
                    <Line
                      yAxisId="ntl"
                      type="monotone"
                      dataKey="nightLightIdx"
                      name={lang === 'es' ? 'Índice luces nocturnas (0–100)' : 'Nighttime Light Index (0–100)'}
                      stroke="#d97706"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card as="section">
              <h3>{t.ddTitle}</h3>
              <p className="muted small" style={{ margin: '4px 0 0' }}>{zone.summary[lang]}</p>
              <div className="cfa-dd-list">
                <div className="cfa-dd-row">
                  <div className="cfa-dd-head"><strong>{lang === 'es' ? 'Perfil de mercado' : 'Market profile'}</strong><span className="cfa-gov-tag">INIDE · ECI</span></div>
                  <span className="small muted">{zone.marketProfile[lang]}</span>
                </div>
                <div className="cfa-dd-row">
                  <div className="cfa-dd-head"><strong>{lang === 'es' ? 'Resguardo ambiental' : 'Environmental compliance'}</strong><span className="cfa-gov-tag">MARENA</span></div>
                  <span className="small muted">{zone.marenaStatus[lang]}</span>
                </div>
                <div className="cfa-dd-row">
                  <div className="cfa-dd-head"><strong>{lang === 'es' ? 'Seguridad ante amenazas' : 'Hazard & elevation'}</strong><span className="cfa-gov-tag">INETER · SINAPRED</span></div>
                  <span className="small muted">{zone.sinapredStatus[lang]}</span>
                </div>
              </div>
            </Card>
          </div>

          <Card as="section">
            <h2>{t.engTitle}</h2>
            <p className="muted small" style={{ margin: '4px 0 0' }}>{t.engSub}</p>
            <div className="cfa-eng-grid">
              {zone.standards.map((s) => (
                <article key={s.id} className="cfa-eng-card">
                  <div className="row">
                    <strong>{s.condition[lang]}</strong>
                    <span className="cfa-gov-tag">{s.metric}</span>
                  </div>
                  <div className="cfa-eng-solution">
                    <strong>{s.solutionTitle[lang]}</strong>
                    <p>{s.solutionDesc[lang]}</p>
                  </div>
                </article>
              ))}
            </div>
          </Card>

          <Card as="section">
            <h3 style={{ marginBottom: 4 }}>{t.tableTitle}</h3>
            <p className="muted small" style={{ marginTop: 0, marginBottom: 14 }}>{t.tableSub}</p>
            <DataTable
              columns={columns}
              rows={CORRIDOR_ZONES}
              rowKey={(r) => r.id}
              ariaLabel={t.tableTitle}
              csvName={`cfa-pacific-south-${lang}`}
              csvLabel={t.csvBtn}
            />
            <Disclosure title={t.methodTitle} className="spaced">
              <p className="small muted" style={{ margin: 0 }}>{t.methodBody}</p>
            </Disclosure>
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

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
  sensorForYear,
  type CorridorYear,
  type Lang,
  type ZoneId,
} from './corridorData'
import { Button, Card, Kpi, Switch } from './ui'

type AppTab = 'globe' | 'corridor'

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
    tabGlobe: 'Globo Terráqueo',
    tabCorridor: 'Visor 3D · Corredor Costero',
    globeEyebrow: 'CONTEXTO GLOBAL Y CONECTIVIDAD REGIONAL',
    globeTitle: 'El Corredor Pacífico Sur de Rivas en escala continental',
    globeLead: 'Posición estratégica entre Norteamérica y Sudamérica, con acceso aéreo directo al Aeropuerto Costa Esmeralda (ECI) y conexión terrestre por la Carretera Costanera hacia Costa Rica.',
    globeNight: 'Modo noche orbital (NASA VIIRS)',
    globeEnter: 'Entrar al Visor 3D Ostional – SJDS – Tola →',
    corridorEyebrow: 'CONSTRUCTORA FLORES ABURTO · EVOLUCIÓN CONTINUA 1995–2035',
    corridorTitle: 'Corredor Costero Continuo · Ostional → San Juan del Sur → Tola',
    corridorSub: 'Observa cómo se encienden y conectan las luces nocturnas y la huella construida a lo largo de los 45 km costeros desde 1995 hasta 2035.',
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
    footerRight: 'Visualización continua sobre eje costero Ostional – San Juan del Sur – Playa Gigante / Tola',
  },
  en: {
    brandSub: 'Civil & Industrial Engineering · Rivas South Pacific',
    backHome: '← Constructora Flores Aburto',
    tabGlobe: '3D Globe',
    tabCorridor: '3D Corridor Viewer',
    globeEyebrow: 'GLOBAL CONTEXT & REGIONAL CONNECTIVITY',
    globeTitle: 'The Rivas South Pacific Corridor at continental scale',
    globeLead: 'Strategic positioning between North and South America, with direct air access via Costa Esmeralda Airport (ECI) and coastal highway connectivity toward Costa Rica.',
    globeNight: 'Orbital night mode (NASA VIIRS)',
    globeEnter: 'Open 3D Corridor Ostional – SJDS – Tola →',
    corridorEyebrow: 'CONSTRUCTORA FLORES ABURTO · CONTINUOUS EVOLUTION 1995–2035',
    corridorTitle: 'Continuous Coastal Corridor · Ostional → San Juan del Sur → Tola',
    corridorSub: 'Watch nighttime lights and built-up footprint ignite and connect continuously across the 45 km coastline from 1995 to 2035.',
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
    footerRight: 'Continuous coastal visualization: Ostional – San Juan del Sur – Playa Gigante / Tola',
  },
} as const

function initialLang(): Lang {
  const q = new URLSearchParams(window.location.search).get('lang')
  return q === 'en' || q === 'es' ? q : 'es'
}

function GlobeTab({ lang, onEnterCorridor }: { lang: Lang; onEnterCorridor: () => void }) {
  const [nightMode, setNightMode] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const readyRef = useRef(false)
  const t = COPY[lang]

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const map = new maplibregl.Map({
      container: el,
      style: GLOBE_STYLE,
      center: [-85.8, 13.5],
      zoom: 2.35,
      pitch: 10,
    })
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'top-right')
    mapRef.current = map

    const markerEl = document.createElement('button')
    markerEl.type = 'button'
    markerEl.className = 'cfa-globe-pin'
    markerEl.innerHTML = '<span>Rivas · Ostional – SJDS – Tola</span>'
    markerEl.addEventListener('click', onEnterCorridor)

    const marker = new maplibregl.Marker({ element: markerEl, anchor: 'center' })
      .setLngLat([-85.89, 11.25])
      .addTo(map)

    map.on('load', () => {
      readyRef.current = true
      map.setLayoutProperty('night', 'visibility', nightMode ? 'visible' : 'none')
    })

    return () => {
      readyRef.current = false
      marker.remove()
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !readyRef.current) return
    map.setLayoutProperty('night', 'visibility', nightMode ? 'visible' : 'none')
  }, [nightMode])

  return (
    <div className="cfa-stack">
      <Card as="section" className="cfa-hero">
        <span className="cfa-eyebrow">{t.globeEyebrow}</span>
        <h1>{t.globeTitle}</h1>
        <p className="cfa-hero-lead">{t.globeLead}</p>
        <div className="cfa-hero-actions">
          <Button variant="primary" className="btn-brass" onClick={onEnterCorridor}>
            {t.globeEnter}
          </Button>
          <Switch checked={nightMode} onChange={setNightMode}>
            <span style={{ color: '#fff' }}>{t.globeNight}</span>
          </Switch>
        </div>
      </Card>

      <Card as="section" className="cfa-globe-card">
        <div ref={containerRef} className="cfa-globe-canvas" />
      </Card>
    </div>
  )
}

function CorridorTab({ lang }: { lang: Lang }) {
  const [zoneId, setZoneId] = useState<ZoneId>('corridor')
  const [yearIdx, setYearIdx] = useState<number>(CORRIDOR_YEARS.indexOf(2025))
  const [playing, setPlaying] = useState(false)

  const [showLights, setShowLights] = useState(true)
  const [showUrban, setShowUrban] = useState(true)
  const [showCostanera, setShowCostanera] = useState(true)

  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const readyRef = useRef(false)
  const markersRef = useRef<Map<string, HTMLButtonElement>>(new Map())

  const t = COPY[lang]
  const year: CorridorYear = CORRIDOR_YEARS[yearIdx]
  const { cells, lights } = useMemo(() => buildContinuousCorridor(), [])

  const activeHub = CORRIDOR_HUBS.find((h) => h.id === zoneId) ?? null
  const activeSeries = activeHub ? activeHub.series : CORRIDOR_TOTAL_SERIES
  const activePoint = activeSeries.find((s) => s.year === year) ?? activeSeries[5]

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setYearIdx((prev) => (prev + 1) % CORRIDOR_YEARS.length)
    }, 1150)
    return () => window.clearInterval(timer)
  }, [playing])

  useEffect(() => {
    const el = containerRef.current
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
    mapRef.current = map

    const createdMarkers: maplibregl.Marker[] = []
    const btns = new Map<string, HTMLButtonElement>()

    map.on('load', () => {
      readyRef.current = true

      // 1. Vector Costanera continuo
      map.addSource('costanera', { type: 'geojson', data: COSTANERA_MTI_GEOJSON })
      map.addLayer({ id: 'costanera-glow', type: 'line', source: 'costanera', paint: { 'line-color': '#a87e41', 'line-width': 8, 'line-opacity': 0.35 } })
      map.addLayer({ id: 'costanera-line', type: 'line', source: 'costanera', paint: { 'line-color': '#e2bd82', 'line-width': 2.5 } })

      // 2. Luces nocturnas dinámicas (heatmap + núcleos brillantes que cambian con el timeline)
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

      // 3. Crecimiento 3D continuo a lo largo del tramo costero
      map.addSource('corridor-cells', { type: 'geojson', data: cells })
      map.addLayer({
        id: 'urban-3d',
        type: 'fill-extrusion',
        source: 'corridor-cells',
        filter: ['<=', ['get', 'year'], 2025],
        paint: {
          'fill-extrusion-color': ['case', ['>', ['get', 'year'], 2025], '#e2bd82', '#38bdf8'],
          'fill-extrusion-height': ['*', ['get', 'height'], 8],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.78,
        },
      })

      // Marcadores de los 3 polos principales
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
        createdMarkers.push(new maplibregl.Marker({ element: btn, anchor: 'bottom' }).setLngLat([h.lon, h.lat]).addTo(map))
      })
      markersRef.current = btns
    })

    return () => {
      readyRef.current = false
      createdMarkers.forEach((m) => m.remove())
      markersRef.current.clear()
      map.remove()
      mapRef.current = null
    }
  }, [cells, lights])

  useEffect(() => {
    markersRef.current.forEach((btn, id) => btn.classList.toggle('active', id === zoneId))
  }, [zoneId])

  // Sincronización dinámica del timeline (1995 -> 2035) en luces nocturnas + bloques 3D
  useEffect(() => {
    const map = mapRef.current
    if (!map || !readyRef.current) return
    const vis = (on: boolean) => (on ? 'visible' : 'none')
    const progress = (year - 1995) / (2035 - 1995) // 0.0 -> 1.0

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
        ['==', ['get', 'year'], year], '#fffbeb',
        ['>', ['get', 'year'], 2025], '#d4aa6a',
        '#38bdf8',
      ])
    }

    if (map.getLayer('costanera-line')) {
      map.setLayoutProperty('costanera-line', 'visibility', vis(showCostanera))
      map.setLayoutProperty('costanera-glow', 'visibility', vis(showCostanera))
    }
  }, [year, showLights, showUrban, showCostanera])

  function focusTarget(target: ZoneId) {
    setZoneId(target)
    const map = mapRef.current
    if (!map) return
    if (target === 'corridor') {
      map.flyTo({ ...CORRIDOR_OVERVIEW, duration: 1000 })
      return
    }
    const h = CORRIDOR_HUBS.find((x) => x.id === target)
    if (h) map.flyTo({ center: [h.lon, h.lat], zoom: h.zoom, pitch: h.pitch, bearing: h.bearing, duration: 1000 })
  }

  return (
    <div className="cfa-stack">
      <Card as="section" className="cfa-map-card">
        <div className="row">
          <div>
            <span className="cfa-eyebrow" style={{ color: 'var(--brass)', marginBottom: 4 }}>{t.corridorEyebrow}</span>
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
            <div ref={containerRef} className="cfa-map-canvas" />
            <div className="cfa-map-overlay-badge">
              <strong>{activeHub ? activeHub.name : t.allCorridor} · {year}</strong>
              <span className="cfa-sensor-pill">{sensorForYear(year, lang)}</span>
              <span className="num">NTL {activePoint.nightLightIdx}/100 · {activePoint.builtHa} ha</span>
            </div>
            <div className="cfa-map-legend">
              <span className="cfa-legend-item"><i className="cfa-swatch" style={{ background: '#fde047' }} /> {t.lLights}</span>
              <span className="cfa-legend-item"><i className="cfa-swatch" style={{ background: '#38bdf8' }} /> ≤ 2025</span>
              <span className="cfa-legend-item"><i className="cfa-swatch" style={{ background: '#d4aa6a' }} /> 2030–2035</span>
              <span className="cfa-legend-item"><i className="cfa-swatch line" style={{ background: '#e2bd82' }} /> {t.lCostanera}</span>
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

      <section className="cfa-kpi-grid">
        <Kpi label={t.kNtl} value={`${activePoint.nightLightIdx}/100`} num color="var(--brass)">
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
                stroke="#a87e41"
                strokeWidth={2.5}
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}

export default function App() {
  const [lang, setLang] = useState<Lang>(initialLang)
  const [tab, setTab] = useState<AppTab>('corridor')
  const t = COPY[lang]

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

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

          <nav className="segmented" aria-label="Views">
            <button type="button" className={tab === 'globe' ? 'on' : ''} onClick={() => setTab('globe')}>
              {t.tabGlobe}
            </button>
            <button type="button" className={tab === 'corridor' ? 'on' : ''} onClick={() => setTab('corridor')}>
              {t.tabCorridor}
            </button>
          </nav>

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
        {tab === 'globe' ? (
          <GlobeTab lang={lang} onEnterCorridor={() => setTab('corridor')} />
        ) : (
          <CorridorTab lang={lang} />
        )}
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

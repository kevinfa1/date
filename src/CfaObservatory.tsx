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
  PERSONAS,
  SINAPRED_HAZARD_GEOJSON,
  type CorridorYear,
  type CorridorZone,
  type PersonaId,
  type ZoneId,
} from './cfaCorridorData'
import { DataTable, type Column } from './DataTable'
import { Button, Card, Disclosure, Kpi, Switch } from './ui'
import './cfa.css'

const ESRI_IMAGERY = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const NASA_VIIRS_NIGHT =
  'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png'

const CORRIDOR_OVERVIEW = {
  center: [-85.895, 11.245] as [number, number],
  zoom: 10.6,
  pitch: 46,
  bearing: -24,
}

const BASE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: 'raster',
      tileSize: 256,
      maxzoom: 17,
      tiles: [ESRI_IMAGERY],
      attribution: 'Esri World Imagery · NASA GIBS VIIRS · Copernicus DEM · GHSL/Sentinel-2 · MTI / MARENA / INETER / INIDE (referencial)',
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
    {
      id: 'satellite',
      type: 'raster',
      source: 'satellite',
      paint: { 'raster-brightness-max': 0.85, 'raster-contrast': 0.1 },
    },
    {
      id: 'viirs',
      type: 'raster',
      source: 'viirs',
      layout: { visibility: 'none' },
      paint: { 'raster-opacity': 0.72 },
    },
  ],
}

export function CfaObservatory() {
  const [personaId, setPersonaId] = useState<PersonaId>('investor')
  const [zoneId, setZoneId] = useState<ZoneId>('sjds')
  const [yearIdx, setYearIdx] = useState<number>(CORRIDOR_YEARS.indexOf(2025))
  const [playing, setPlaying] = useState(false)

  // Capas del visor territorial
  const [showUrban3d, setShowUrban3d] = useState(true)
  const [showCostanera, setShowCostanera] = useState(true)
  const [showMarena, setShowMarena] = useState(true)
  const [showSinapred, setShowSinapred] = useState(true)
  const [showViirs, setShowViirs] = useState(false)

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const mapReadyRef = useRef(false)
  const markersRef = useRef<Map<ZoneId, HTMLButtonElement>>(new Map())

  const year: CorridorYear = CORRIDOR_YEARS[yearIdx]
  const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0]
  const zone = CORRIDOR_ZONES.find((z) => z.id === zoneId) ?? CORRIDOR_ZONES[1]
  const cellsGeoJson = useMemo(() => buildCorridorCells(), [])

  // Animación de la línea de tiempo 2015 → 2035
  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setYearIdx((prev) => (prev + 1) % CORRIDOR_YEARS.length)
    }, 1400)
    return () => window.clearInterval(timer)
  }, [playing])

  // Inicialización del mapa MapLibre GL
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

      // 1. Área protegida MARENA (Refugio La Flor)
      map.addSource('marena', { type: 'geojson', data: MARENA_PROTECTED_GEOJSON })
      map.addLayer({
        id: 'marena-fill',
        type: 'fill',
        source: 'marena',
        paint: { 'fill-color': '#10b981', 'fill-opacity': 0.28 },
      })
      map.addLayer({
        id: 'marena-line',
        type: 'line',
        source: 'marena',
        paint: { 'line-color': '#34d399', 'line-width': 2, 'line-dasharray': [3, 2] },
      })

      // 2. Franjas de amenaza costera (INETER / SINAPRED)
      map.addSource('sinapred', { type: 'geojson', data: SINAPRED_HAZARD_GEOJSON })
      map.addLayer({
        id: 'sinapred-fill',
        type: 'fill',
        source: 'sinapred',
        paint: { 'fill-color': '#ef4444', 'fill-opacity': 0.34 },
      })
      map.addLayer({
        id: 'sinapred-line',
        type: 'line',
        source: 'sinapred',
        paint: { 'line-color': '#f87171', 'line-width': 1.5 },
      })

      // 3. Trazado Carretera Costanera (MTI)
      map.addSource('costanera', { type: 'geojson', data: COSTANERA_MTI_GEOJSON })
      map.addLayer({
        id: 'costanera-glow',
        type: 'line',
        source: 'costanera',
        paint: { 'line-color': '#f59e0b', 'line-width': 7, 'line-opacity': 0.28 },
      })
      map.addLayer({
        id: 'costanera-line',
        type: 'line',
        source: 'costanera',
        paint: { 'line-color': '#fbbf24', 'line-width': 3 },
      })

      // 4. Crecimiento urbano 3D (celdas satelitales + proyección)
      map.addSource('corridor-cells', { type: 'geojson', data: cellsGeoJson })
      map.addLayer({
        id: 'urban-3d',
        type: 'fill-extrusion',
        source: 'corridor-cells',
        filter: ['<=', ['get', 'year'], 2025],
        paint: {
          'fill-extrusion-color': [
            'case',
            ['>', ['get', 'year'], 2025],
            '#56e1e8',
            '#3b82f6',
          ],
          'fill-extrusion-height': ['*', ['get', 'height'], 9],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.88,
        },
      })

      // Marcadores clicables de los 3 polos del corredor
      CORRIDOR_ZONES.forEach((z) => {
        const btn = document.createElement('button')
        btn.type = 'button'
        btn.className = `cfa-marker${z.id === zoneId ? ' active' : ''}`
        btn.textContent = z.name
        btn.addEventListener('click', () => {
          setZoneId(z.id)
          map.flyTo({
            center: [z.lon, z.lat],
            zoom: z.zoom,
            pitch: z.pitch,
            bearing: z.bearing,
            duration: 1100,
          })
        })
        markerButtons.set(z.id, btn)
        const m = new maplibregl.Marker({ element: btn, anchor: 'bottom' })
          .setLngLat([z.lon, z.lat])
          .addTo(map)
        createdMarkers.push(m)
      })
      markersRef.current = markerButtons
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

  // Sincroniza estado visual de marcadores activos
  useEffect(() => {
    markersRef.current.forEach((btn, id) => {
      btn.classList.toggle('active', id === zoneId)
    })
  }, [zoneId])

  // Sincroniza año y visibilidad de capas en MapLibre
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReadyRef.current) return

    const vis = (on: boolean) => (on ? 'visible' : 'none')

    if (map.getLayer('urban-3d')) {
      map.setLayoutProperty('urban-3d', 'visibility', vis(showUrban3d))
      map.setFilter('urban-3d', ['<=', ['get', 'year'], year])
      map.setPaintProperty('urban-3d', 'fill-extrusion-color', [
        'case',
        ['==', ['get', 'year'], year],
        '#f4ffff',
        ['>', ['get', 'year'], 2025],
        '#56e1e8',
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
      map.flyTo({
        center: [z.lon, z.lat],
        zoom: z.zoom,
        pitch: z.pitch,
        bearing: z.bearing,
        duration: 1000,
      })
    }
  }

  const activePoint = zone.series.find((s) => s.year === year) ?? zone.series[2]

  const auditColumns: Column<CorridorZone>[] = [
    {
      id: 'name',
      header: 'Polo del corredor',
      cell: (r) => (
        <button type="button" className="link" onClick={() => focusZone(r.id)}>
          <strong>{r.name}</strong>
          <span className="muted small" style={{ display: 'block' }}>{r.municipality}</span>
        </button>
      ),
      csv: (r) => `${r.name} (${r.municipality})`,
    },
    {
      id: 'built2025',
      header: 'Huella 2025 (ha)',
      align: 'right',
      cell: (r) => <span className="num">{r.built2025Ha} ha</span>,
      csv: (r) => r.built2025Ha,
    },
    {
      id: 'growth',
      header: 'Expansión 2015–2035',
      align: 'right',
      cell: (r) => <strong className="num">+{r.growthPct2015_2035}%</strong>,
      csv: (r) => `${r.growthPct2015_2035}%`,
    },
    {
      id: 'costanera',
      header: 'Distancia Costanera (MTI)',
      align: 'right',
      cell: (r) => <span className="num">{r.costaneraKm.toFixed(1)} km</span>,
      csv: (r) => r.costaneraKm,
    },
    {
      id: 'elevation',
      header: 'Cota CFA (Copernicus DEM)',
      align: 'right',
      cell: (r) => <span className="num">+{r.elevationM} m</span>,
      csv: (r) => r.elevationM,
    },
    {
      id: 'inide',
      header: 'Vivienda municipal (INIDE)',
      align: 'right',
      cell: (r) => <span className="num">+{r.inideHousingGrowthPct}%</span>,
      csv: (r) => `${r.inideHousingGrowthPct}%`,
    },
    {
      id: 'marena',
      header: 'Resguardo MARENA / SINAPRED',
      cell: (r) => <span className="small">{r.sinapredStatus}</span>,
      csv: (r) => `${r.marenaStatus} | ${r.sinapredStatus}`,
    },
  ]

  return (
    <div className="cfa-stack">
      {/* 1. Hero narrativo + selector de Buyer Persona */}
      <Card as="section" className="cfa-hero">
        <span className="cfa-eyebrow">Observatorio Territorial CFA · Pacífico Sur, Nicaragua</span>
        <h1>{persona.headline}</h1>
        <p className="cfa-hero-lead">{persona.thesis}</p>

        <div className="cfa-persona-bar" role="tablist" aria-label="Perfil de visitante">
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={personaId === p.id}
              className={`cfa-persona-btn${personaId === p.id ? ' on' : ''}`}
              onClick={() => setPersonaId(p.id)}
            >
              <strong>{p.label}</strong>
              <span>{p.subtitle}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* 2. Visor geoespacial 3D del corredor Ostional → SJDS → Playa Gigante */}
      <Card as="section" className="cfa-map-card">
        <div className="cfa-map-header">
          <div>
            <h2>Corredor Ostional · San Juan del Sur · Playa Gigante (Tola)</h2>
            <p className="muted small" style={{ margin: '6px 0 0' }}>
              Crecimiento urbano satelital cruzado con capas públicas de Nicaragua (MTI, MARENA, INETER/SINAPRED).
            </p>
          </div>
          <div className="cfa-zone-pills">
            <button type="button" className="cfa-zone-pill" onClick={() => focusZone('all')}>
              Ver corredor completo
            </button>
            {CORRIDOR_ZONES.map((z) => (
              <button
                key={z.id}
                type="button"
                className={`cfa-zone-pill${zoneId === z.id ? ' on' : ''}`}
                onClick={() => focusZone(z.id)}
              >
                {z.name}
              </button>
            ))}
          </div>
        </div>

        <div className="cfa-map-layout">
          <div className="cfa-map-stage">
            <div ref={mapContainerRef} className="cfa-map-canvas" />
            <div className="cfa-map-overlay-badge">
              <span><strong>{zone.name}</strong> · {year}</span>
              <span style={{ opacity: 0.75 }}>|</span>
              <span>{activePoint.builtHa} ha construidas</span>
            </div>
            <div className="cfa-map-legend" aria-label="Leyenda de capas">
              <span className="cfa-legend-item">
                <i className="cfa-swatch" style={{ background: '#3b82f6' }} /> Construido (≤ 2025)
              </span>
              <span className="cfa-legend-item">
                <i className="cfa-swatch" style={{ background: '#56e1e8' }} /> Proyectado (2030–2035)
              </span>
              <span className="cfa-legend-item">
                <i className="cfa-swatch line" style={{ background: '#fbbf24' }} /> Costanera (MTI)
              </span>
              <span className="cfa-legend-item">
                <i className="cfa-swatch" style={{ background: '#10b981' }} /> Refugio La Flor (MARENA)
              </span>
              <span className="cfa-legend-item">
                <i className="cfa-swatch" style={{ background: '#ef4444' }} /> Cota baja (SINAPRED)
              </span>
            </div>
          </div>

          <aside className="cfa-map-sidebar">
            <div className="cfa-sidebar-section">
              <span className="cfa-sidebar-kicker">Línea de tiempo urbana</span>
              <div className="cfa-year-row">
                <span className="cfa-year-big">{year}</span>
                <Button variant="secondary" onClick={() => setPlaying((v) => !v)}>
                  {playing ? 'Pausar' : 'Reproducir'}
                </Button>
              </div>
              <input
                type="range"
                min={0}
                max={CORRIDOR_YEARS.length - 1}
                step={1}
                value={yearIdx}
                aria-label="Año del escenario urbano"
                onChange={(e) => {
                  setPlaying(false)
                  setYearIdx(Number(e.target.value))
                }}
              />
              <div className="cfa-year-ticks">
                {CORRIDOR_YEARS.map((y) => (
                  <span key={y}>{y}</span>
                ))}
              </div>
            </div>

            <div className="cfa-sidebar-section">
              <span className="cfa-sidebar-kicker">Capas satelitales y Gobierno</span>
              <div className="cfa-switches">
                <Switch checked={showUrban3d} onChange={setShowUrban3d}>
                  Crecimiento urbano 3D
                </Switch>
                <Switch checked={showCostanera} onChange={setShowCostanera}>
                  Carretera Costanera (MTI)
                </Switch>
                <Switch checked={showMarena} onChange={setShowMarena}>
                  Área protegida (MARENA)
                </Switch>
                <Switch checked={showSinapred} onChange={setShowSinapred}>
                  Amenaza costera (SINAPRED)
                </Switch>
                <Switch checked={showViirs} onChange={setShowViirs}>
                  Luces nocturnas (NASA VIIRS)
                </Switch>
              </div>
            </div>

            <div className="cfa-sidebar-section">
              <div className="cfa-persona-callout">
                <strong>Lectura para {persona.label}</strong>
                {zone.personaHighlight[personaId]}
              </div>
            </div>
          </aside>
        </div>
      </Card>

      {/* 3. KPIs del polo seleccionado */}
      <section className="cfa-kpi-grid" aria-label={`Indicadores clave de ${zone.name}`}>
        <Kpi label="Huella construida 2025 → 2035" value={`${zone.built2025Ha} → ${zone.built2035Ha} ha`} num>
          <span className="muted small">+{zone.growthPct2015_2035}% desde 2015 (satélite)</span>
        </Kpi>
        <Kpi label="Conectividad Costanera (MTI)" value={`${zone.costaneraKm.toFixed(1)} km`} num color="var(--accent-deep)">
          <span className="muted small">−{zone.travelGainMin} min de traslado estimado</span>
        </Kpi>
        <Kpi label="Cota segura CFA (DEM)" value={`+${zone.elevationM} m s.n.m.`} num color="var(--emerald)">
          <span className="muted small">Fuera de cota baja SINAPRED</span>
        </Kpi>
        <Kpi label="Cobertura verde (Sentinel-2)" value={`${zone.vegetation2025Pct}%`} num>
          <span className="muted small">+{zone.inideHousingGrowthPct}% vivienda municipal (INIDE)</span>
        </Kpi>
      </section>

      {/* 4. Gráfica de expansión vs vegetación + Cruce con datos públicos de Nicaragua */}
      <div className="cfa-two-col">
        <Card as="section">
          <div className="row">
            <div>
              <h3>Expansión urbana vs. cobertura vegetal · {zone.name}</h3>
              <p className="muted small" style={{ margin: '4px 0 0' }}>
                Serie histórica satelital (2015–2025) y escenario de consolidación (2030–2035).
              </p>
            </div>
            <span className="badge not_yet">{zone.tag}</span>
          </div>

          <div style={{ width: '100%', height: 270, marginTop: 18 }}>
            <ResponsiveContainer>
              <ComposedChart data={zone.series} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,2,61,0.08)" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="ha" tick={{ fontSize: 12 }} unit=" ha" />
                <YAxis yAxisId="pct" orientation="right" domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                <Tooltip />
                <Legend />
                <Area
                  yAxisId="ha"
                  type="monotone"
                  dataKey="builtHa"
                  name="Área construida (ha)"
                  stroke="#0a7c84"
                  fill="rgba(86, 225, 232, 0.35)"
                  strokeWidth={2.5}
                />
                <Line
                  yAxisId="pct"
                  type="monotone"
                  dataKey="vegetationPct"
                  name="Cobertura verde (%)"
                  stroke="#0f8a5f"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card as="section">
          <h3>Cruce con fuentes públicas de Nicaragua</h3>
          <p className="muted small" style={{ margin: '4px 0 0' }}>
            {zone.summary}
          </p>

          <div className="cfa-gov-list">
            <div className="cfa-gov-row">
              <div className="cfa-gov-row-head">
                <strong>Carretera Costanera Pacífico Sur</strong>
                <span className="cfa-gov-tag">MTI</span>
              </div>
              <span className="small muted">
                Acceso a {zone.costaneraKm.toFixed(1)} km del eje costero; ahorro estimado de {zone.travelGainMin} min frente a rutas anteriores.
              </span>
            </div>

            <div className="cfa-gov-row">
              <div className="cfa-gov-row-head">
                <strong>Resguardo ambiental y áreas protegidas</strong>
                <span className="cfa-gov-tag">MARENA</span>
              </div>
              <span className="small muted">{zone.marenaStatus}</span>
            </div>

            <div className="cfa-gov-row">
              <div className="cfa-gov-row-head">
                <strong>Amenaza costera y drenaje</strong>
                <span className="cfa-gov-tag">INETER · SINAPRED</span>
              </div>
              <span className="small muted">{zone.sinapredStatus}</span>
            </div>

            <div className="cfa-gov-row">
              <div className="cfa-gov-row-head">
                <strong>Dinámica demográfica y vivienda</strong>
                <span className="cfa-gov-tag">INIDE</span>
              </div>
              <span className="small muted">
                Municipio {zone.municipality}: +{zone.inideHousingGrowthPct}% en parque habitacional y demanda residencial sostenida.
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* 5. Matriz Clima -> Respuesta Constructiva CFA */}
      <Card as="section">
        <div className="row">
          <div>
            <h2>Cómo responde la ingeniería de CFA en {zone.name}</h2>
            <p className="muted small" style={{ margin: '6px 0 0' }}>
              Cada tendencia climática y territorial (NASA POWER · Copernicus DEM) se traduce en una especificación constructiva verificable.
            </p>
          </div>
          <Button variant="primary" onClick={() => focusZone(zone.id)}>
            {persona.ctaLabel}
          </Button>
        </div>

        <div className="cfa-eng-grid">
          {zone.engineering.map((item) => (
            <article key={item.id} className="cfa-eng-card">
              <div className="cfa-eng-top">
                <div>
                  <span className="muted small">{item.source}</span>
                  <div className="cfa-eng-metric">{item.variable}</div>
                </div>
                <span className={`cfa-risk-pill ${item.riskLevel}`}>{item.riskLevel}</span>
              </div>
              <div className="small">
                <strong>Tendencia:</strong> {item.trend} · <span className="muted">{item.horizon}</span>
              </div>
              <div className="cfa-eng-solution">
                <strong>Respuesta CFA · {item.cfaSolutionTitle}</strong>
                <p>{item.cfaSolution}</p>
              </div>
            </article>
          ))}
        </div>
      </Card>

      {/* 6. Tabla comparativa del corredor con exportación CSV lista para Excel */}
      <Card as="section">
        <h3 style={{ marginBottom: 6 }}>Matriz comparativa del corredor Pacífico Sur</h3>
        <p className="muted small" style={{ marginTop: 0, marginBottom: 16 }}>
          Haz clic en cualquier polo para enfocarlo en el mapa 3D o descarga la tabla completa en CSV para revisión técnica.
        </p>
        <DataTable
          columns={auditColumns}
          rows={CORRIDOR_ZONES}
          rowKey={(r) => r.id}
          ariaLabel="Comparativa del corredor Ostional, San Juan del Sur y Playa Gigante"
          csvName="corredor-cfa-rivas-sur"
          csvLabel="Descargar auditoría CSV"
        />

        <Disclosure title="Nota metodológica y estado de los datos (Prototipo v1)" className="spaced">
          <p className="small muted" style={{ marginTop: 0 }}>
            Este prototipo reutiliza el motor cartográfico 3D (<code>MapLibre GL</code>), los gráficos (<code>Recharts</code>) y el exportador
            CSV (<code>DataTable</code>) de DATEX, junto con teselas satelitales en vivo de <strong>Esri World Imagery</strong> y{' '}
            <strong>NASA GIBS VIIRS Black Marble</strong>.
          </p>
          <p className="small muted" style={{ marginBottom: 0 }}>
            <strong>Alcance del prototipo v1:</strong> las geometrías del trazado de la Costanera (MTI), el polígono del Refugio La Flor
            (MARENA), las franjas de amenaza costera (INETER/SINAPRED) y las series 2015–2035 de Ostional, San Juan del Sur y Playa Gigante
            son valores base estructurados para validar la narrativa y la arquitectura. En producción se sustituyen directamente en{' '}
            <code>src/cfaCorridorData.ts</code> (o archivos GeoJSON en <code>public/static-api/</code>) por las capas digitalizadas oficiales
            y las extracciones precalculadas de GHSL/Sentinel-2 y NASA POWER.
          </p>
        </Disclosure>
      </Card>
    </div>
  )
}

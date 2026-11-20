import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import {
  api,
  API_BASE,
  apiPost,
  type AskResponse,
  type Catalog,
  type EarthForecastResponse,
  type Forecast,
  hasBackend,
  type Location,
  paced,
  type Place,
  type RegionTrend,
  type ScanResponse,
  type TrendResponse,
  type Variable,
} from './api'
import { ComparePlaces } from './ComparePlaces'
import { DemographyView } from './DemographyView'
import { GlobeSection, type SecondSpot, type Spot } from './GlobeSection'
import { CONCERNS_EN, fmtNum, PLACE_TYPES_EN, tRegion, tVariable, UI, type Lang, type Phase } from './i18n'
import { RelateView } from './RelateView'
import { SatelliteView } from './SatelliteView'
import { Button, Card, Loader, Shard } from './ui'
import { Briefing } from './Briefing'
import { ScanAndRegionsView } from './ScanView'
import { TrendView } from './TrendView'

const CfaObservatory = lazy(() => import('./CfaObservatory').then((m) => ({ default: m.CfaObservatory })))

function withTransition(update: () => void) {
  if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return update()
  document.startViewTransition(() => flushSync(update))
}

type Tab = 'trend' | 'scan' | 'compare' | 'satellite' | 'population' | 'relate'
type Query = { variable: string; start: number; spot: Spot }

const TAB_ORDER: Tab[] = ['trend', 'scan', 'compare', 'satellite', 'population', 'relate']


export default function App() {
  const [phase, setPhase] = useState<Phase>(() => (window.location.hash === '#cfa' ? 'cfa' : 'briefing'))
  const [lang, setLang] = useState<Lang>('es')
  const [weatherNow, setWeatherNow] = useState<{ key: string; tempC: number; uv?: number } | null>(null)

  const [cat, setCat] = useState<Catalog | null>(null)
  const [spot, setSpot] = useState<Spot>({ lat: 12.13, lon: -86.25, label: 'Managua, Nicaragua', iso3: 'NIC', country: 'Nicaragua' })
  const [second, setSecond] = useState<SecondSpot | null>(null)
  const [pickSecond, setPickSecond] = useState(false)
  const [search, setSearch] = useState('')
  const [found, setFound] = useState<Place[]>([])
  const [question, setQuestion] = useState('')
  const [askInfo, setAskInfo] = useState<string | null>(null)
  const [concern, setConcern] = useState('heat')
  const [placeType, setPlaceType] = useState<string | null>('city')
  // Al llegar desde 'Ver la ciudad en 3D' del planeta, Satélite se desplaza a la sección de crecimiento urbano
  const [growthScroll, setGrowthScroll] = useState(false)
  const [recommended, setRecommended] = useState<Variable[]>([])
  const [variable, setVariable] = useState('T2M_MIN')
  const [start, setStart] = useState(1990)

  const [query, setQuery] = useState<Query | null>(null)
  const [tab, setTab] = useState<Tab>('trend')
  const [trend, setTrend] = useState<TrendResponse | null>(null)
  const [scenario, setScenario] = useState<Forecast | null>(null)
  const [scan, setScan] = useState<ScanResponse | null>(null)
  const [regions, setRegions] = useState<RegionTrend[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const run = useRef(0)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  useEffect(() => {
    api<Catalog>('/api/catalog').then(setCat).catch((e: Error) => setError(e.message))
  }, [])

  const queryCoordKey = query ? `${query.spot.lat},${query.spot.lon}` : null
  useEffect(() => {
    if (!queryCoordKey || !hasBackend) return
    const ctrl = new AbortController()
    const [latStr, lonStr] = queryCoordKey.split(',')
    fetch(`${API_BASE}/api/weather?lat=${latStr}&lon=${lonStr}&parameters=t_2m:C,uv:idx`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((payload) => {
        const series = payload?.data as { parameter: string; coordinates: { dates: { value: number }[] }[] }[] | undefined
        if (!Array.isArray(series)) return setWeatherNow(null)
        const getVal = (p: string) => series.find((s) => s.parameter === p)?.coordinates?.[0]?.dates?.[0]?.value
        const tempC = getVal('t_2m:C')
        const uv = getVal('uv:idx')
        setWeatherNow(tempC !== undefined ? { key: queryCoordKey, tempC, uv } : null)
      })
      .catch(() => setWeatherNow(null))
    return () => ctrl.abort()
  }, [queryCoordKey])

  useEffect(() => {
    const qs = `concern=${concern}${placeType ? `&place_type=${placeType}` : ''}`
    api<{ variables: Variable[] }>(`/api/recommend?${qs}`)
      .then((r) => {
        setRecommended(r.variables)
        if (r.variables.length) setVariable(r.variables[0].key)
      })
      .catch(() => setRecommended([]))
  }, [concern, placeType])

  async function resolveSpot(p: { lat: number; lon: number }, label?: string): Promise<Spot> {
    try {
      const loc = await api<Location>(`/api/places/locate?lat=${p.lat}&lon=${p.lon}`)
      const openOcean = lang === 'es' ? 'mar abierto' : 'open ocean'
      return {
        ...p,
        iso3: loc.iso3,
        country: loc.country,
        label: label ?? (
          loc.nearest_place
            ? `${loc.nearest_place}${loc.country ? `, ${loc.country}` : ''}`
            : `${p.lat.toFixed(2)}, ${p.lon.toFixed(2)} (${openOcean})`
        ),
      }
    } catch {
      return { ...p, iso3: null, country: null, label: label ?? `${p.lat.toFixed(2)}, ${p.lon.toFixed(2)}` }
    }
  }

  async function pickPoint(p: { lat: number; lon: number }, label?: string, fromGlobeClick = false) {
    if (pickSecond && fromGlobeClick) {
      const resolved = await resolveSpot(p, label)
      setSecond({ lat: resolved.lat, lon: resolved.lon, label: resolved.label })
      setPickSecond(false)
      return
    }
    setFound([])
    setSpot(await resolveSpot(p, label))
  }

  async function doSearch(text = search) {
    setError(null)
    try {
      setFound(await api<Place[]>(`/api/places/search?q=${encodeURIComponent(text)}`))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function ask() {
    setError(null)
    setAskInfo(lang === 'es' ? 'Interpretando…' : 'Interpreting…')
    try {
      const r = await apiPost<AskResponse>('/api/ask', { question })
      setConcern(r.interpretation.concern)
      setPlaceType(r.interpretation.place_type)
      if (r.places.length) {
        setFound(r.places)
        const top = r.places[0]
        await pickPoint({ lat: top.lat, lon: top.lon }, `${top.name}${top.country ? `, ${top.country}` : ''}`)
      }
      const concernText = lang === 'en'
        ? (CONCERNS_EN[r.interpretation.concern] ?? r.interpretation.concern)
        : (cat?.concerns[r.interpretation.concern] ?? r.interpretation.concern)
      const ptRaw = r.interpretation.place_type
      const ptText = ptRaw
        ? (lang === 'en' ? (PLACE_TYPES_EN[ptRaw] ?? ptRaw) : (cat?.place_types[ptRaw] ?? '')).toLowerCase()
        : ''
      if (lang === 'es') {
        const src = r.interpretation.source === 'claude' ? 'La IA detectó' : 'Las reglas detectaron'
        setAskInfo(`${src}: ${concernText}${ptText ? ` en ${ptText}` : ''}${r.places.length ? ` · lugar “${r.places[0].name}” centrado en el planeta.` : '.'}`)
      } else {
        const src = r.interpretation.source === 'claude' ? 'AI detected' : 'Rules matched'
        setAskInfo(`${src}: ${concernText}${ptText ? ` (${ptText})` : ''}${r.places.length ? ` · centered "${r.places[0].name}" on the globe.` : '.'}`)
      }
    } catch (e) {
      setAskInfo(null)
      setError((e as Error).message)
    }
  }

  const investigate = useCallback(async (q: Query, targetTab: Tab = 'trend') => {
    const id = ++run.current
    withTransition(() => {
      setQuery(q)
      setTab(targetTab)
      setPhase('studio')
    })
    setBusy(true)
    setError(null)
    setTrend(null)
    setScenario(null)
    setScan(null)
    setRegions(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    try {
      const t = await paced(api<TrendResponse>(
        `/api/trend?variable=${q.variable}&lat=${q.spot.lat}&lon=${q.spot.lon}&start=${q.start}`,
      ))
      if (id === run.current) setTrend(t)
    } catch (e) {
      if (id === run.current) setError((e as Error).message)
    } finally {
      if (id === run.current) setBusy(false)
    }
  }, [])

  async function openTab(next: Tab) {
    withTransition(() => setTab(next))
    if (!query) return
    const id = run.current
    setError(null)
    try {
      if (next === 'scan' && (!scan || !regions)) {
        setBusy(true)
        const [s, c] = await paced(Promise.all([
          scan ? Promise.resolve(scan) : api<ScanResponse>(`/api/scan?lat=${query.spot.lat}&lon=${query.spot.lon}&start=${query.start}`),
          regions ? Promise.resolve(regions) : api<RegionTrend[]>(`/api/compare?variable=${query.variable}&start=${query.start}`),
        ]))
        if (id === run.current) {
          setScan(s)
          setRegions(c)
        }
      }
    } catch (e) {
      if (id === run.current) setError((e as Error).message)
    } finally {
      if (id === run.current) setBusy(false)
    }
  }

  async function loadScenario(toYear: number) {
    if (!query) return
    try {
      const r = await api<EarthForecastResponse>(
        `/api/forecast?variable=${query.variable}&lat=${query.spot.lat}&lon=${query.spot.lon}&start=${query.start}&to_year=${toYear}`,
      )
      setScenario(r.forecast)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function openDemo(d: Catalog['demos'][number], goPlanet = false) {
    const rawR = cat?.regions.find((x) => x.id === d.region)
    if (!rawR) return
    const r = tRegion(rawR, lang)
    const s: Spot = {
      lat: r.lat,
      lon: r.lon,
      label: r.label,
      iso3: r.country,
      country: r.country ? cat?.countries[r.country] ?? null : null,
    }
    setSpot(s)
    setVariable(d.variable)
    setStart(1990)
    if (goPlanet) {
      withTransition(() => setPhase('planet'))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      investigate({ variable: d.variable, start: 1990, spot: s })
    }
  }

  function switchPhase(next: Phase) {
    if (next === 'studio' && !query) {
      investigate({ variable, start, spot })
      return
    }
    withTransition(() => setPhase(next))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openVariableInStudio(key: string) {
    if (!query) return
    setVariable(key)
    investigate({ ...query, variable: key })
  }

  const years = useMemo(
    () => (cat ? Array.from({ length: cat.last_year - 15 - cat.first_year + 2 }, (_, i) => cat.first_year + i) : []),
    [cat],
  )

  const relateQuery = query
    ? {
        variable: query.variable,
        lat: query.spot.lat,
        lon: query.spot.lon,
        start: query.start,
        label: query.spot.label,
        country: query.spot.iso3,
      }
    : null

  const t = UI[lang]
  const activeVarRaw = cat?.variables.find((v) => v.key === (query?.variable ?? variable))
  const activeVar = activeVarRaw ? tVariable(activeVarRaw, lang) : null

  return (
    <div className="app-shell">

      <header className="topbar">
        <div className="topbar-inner">
          <button type="button" className="brand-btn" onClick={() => switchPhase('briefing')}>
            <img className="brand-mark" src="./logo.png" alt="" />
            <span className="brand-logo">DATEX</span>
          </button>

          <nav className="phase-nav" aria-label="Phases">
            {(['briefing', 'planet', 'studio', 'cfa'] as Phase[]).map((p) => {
              const item = t.phases[p]
              const active = phase === p
              return (
                <button
                  key={p}
                  type="button"
                  className={`phase-pill ${active ? 'on' : ''}`}
                  aria-current={active ? 'step' : undefined}
                  onClick={() => switchPhase(p)}
                >
                  <span>{item.label}</span>
                  {p === 'studio' && query && <span className="phase-dot" title={query.spot.label} />}
                </button>
              )
            })}
          </nav>

          <div className="topbar-controls">
            <div className="segmented">
              <button type="button" className={lang === 'es' ? 'on' : ''} onClick={() => setLang('es')}>ES</button>
              <button type="button" className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
            </div>
          </div>
        </div>
      </header>

      <main>
        {error && <p className="error" role="alert">{error}</p>}
        {!cat && !error && phase !== 'cfa' && (
          <p className="muted">{lang === 'es' ? 'Cargando catálogo NASA…' : 'Loading NASA catalog…'}</p>
        )}

        {phase === 'cfa' && (
          <Suspense fallback={<Loader label={lang === 'es' ? 'Cargando observatorio CFA…' : 'Loading CFA observatory…'} />}>
            <CfaObservatory lang={lang} />
          </Suspense>
        )}

        {phase === 'briefing' && (
          <Briefing lang={lang} cat={cat} onExplore={() => switchPhase('planet')} onDemo={openDemo} />
        )}

        {phase === 'planet' && (
          <GlobeSection
            cat={cat}
            lang={lang}
            spot={spot}
            second={second}
            pickSecond={pickSecond}
            onPickSecondChange={setPickSecond}
            onClearSecond={() => setSecond(null)}
            search={search}
            onSearchChange={setSearch}
            found={found}
            onSearch={doSearch}
            onPickPlace={pickPoint}
            question={question}
            onQuestionChange={setQuestion}
            askInfo={askInfo}
            onAsk={ask}
            concern={concern}
            onConcernChange={setConcern}
            placeType={placeType}
            onPlaceTypeChange={setPlaceType}
            recommended={recommended}
            variable={variable}
            onVariableChange={setVariable}
            start={start}
            onStartChange={setStart}
            years={years}
            busy={busy}
            onLaunchStudio={() => investigate({ variable, start, spot })}
            onOpenCity={() => {
              setGrowthScroll(true)
              investigate({ variable, start, spot }, 'satellite')
            }}
          />
        )}

        {phase === 'studio' && query && cat && (
          <div className="phase-stack" aria-live="polite">

            <Card as="section" className="studio-context-bar">
              <div className="studio-context-left">
                <div className="studio-place-row">
                  <h2>{query.spot.label}</h2>
                  <span className="num muted small">
                    {query.spot.lat.toFixed(2)}°, {query.spot.lon.toFixed(2)}°
                  </span>
                  {weatherNow && weatherNow.key === queryCoordKey && (
                    <span className="badge not_yet" title="Meteomatics live">
                      {fmtNum(weatherNow.tempC, lang, 3)} °C
                      {weatherNow.uv !== undefined ? ` · UV ${fmtNum(weatherNow.uv, lang, 2)}` : ''}
                    </span>
                  )}
                </div>
              </div>

              <div className="studio-quick-controls">
                <select
                  aria-label="Variable"
                  value={query.variable}
                  onChange={(e) => openVariableInStudio(e.target.value)}
                >
                  {cat.variables.map((rawV) => {
                    const v = tVariable(rawV, lang)
                    return <option key={v.key} value={v.key}>{v.label}</option>
                  })}
                </select>
                <select
                  aria-label="Start Year"
                  value={query.start}
                  onChange={(e) => {
                    const y = Number(e.target.value)
                    setStart(y)
                    investigate({ ...query, start: y })
                  }}
                >
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <Button variant="secondary" onClick={() => switchPhase('planet')}>
                  {t.phase3.backToPlanet}
                </Button>
                <Button variant="secondary" onClick={() => openTab('compare')}>
                  {t.phase3.compareShortcut}
                </Button>
              </div>
            </Card>

            <div className="tabs" role="tablist">
              {TAB_ORDER.map((k) => (
                <button
                  key={k}
                  role="tab"
                  aria-selected={tab === k}
                  onClick={() => openTab(k)}
                >
                  {t.phase3.tabs[k]}
                </button>
              ))}
            </div>

            {busy && !['relate', 'population', 'satellite', 'compare'].includes(tab) && (
              <Loader label={lang === 'es' ? 'Analizando…' : 'Analyzing…'} />
            )}

            {tab === 'trend' && trend && (
              <TrendView
                data={trend}
                where={query.spot.label}
                varLabel={activeVar?.label ?? trend.result.label}
                reliability={activeVar?.reliability ?? ''}
                scenario={scenario}
                onScenario={loadScenario}
                start={query.start}
                lang={lang}
              />
            )}

            {tab === 'scan' && scan && regions && (
              <ScanAndRegionsView
                scan={scan}
                regions={regions}
                where={query.spot.label}
                varLabel={activeVar?.label ?? query.variable}
                cat={cat}
                lang={lang}
                onOpen={openVariableInStudio}
              />
            )}

            {tab === 'compare' && (
              <ComparePlaces
                variable={query.variable}
                start={query.start}
                a={query.spot}
                second={second}
                onSecond={(s) => setSecond(s)}
                regions={cat.regions}
                lang={lang}
                onPickOnGlobe={() => {
                  setPickSecond(true)
                  switchPhase('planet')
                }}
              />
            )}

            {tab === 'satellite' && (
              <SatelliteView
                lat={query.spot.lat}
                lon={query.spot.lon}
                label={query.spot.label}
                lang={lang}
                scrollToGrowth={growthScroll}
                onGrowthScrolled={() => setGrowthScroll(false)}
              />
            )}

            {tab === 'population' && (
              <DemographyView
                key={query.spot.iso3 ?? 'NIC'}
                cat={cat}
                country={query.spot.iso3}
                start={query.start}
                lang={lang}
              />
            )}

            {tab === 'relate' && relateQuery && (
              <RelateView
                key={`${query.variable}-${query.spot.lat}-${query.spot.lon}-${query.start}`}
                cat={cat}
                query={relateQuery}
                lang={lang}
              />
            )}
          </div>
        )}

      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <Shard part="bottom" className="deco" />
          <div>
            <p className="footer-team">{t.team}</p>
            {cat && (
              <p className="footer-note">
                {lang === 'es'
                  ? cat.data_note
                  : 'Data source: NASA POWER (MERRA-2 reanalysis & CERES satellite observations), Microsoft Planetary Computer (Landsat/Sentinel-2), UN World Population Prospects (OWID), and World Bank. Each POWER point represents a ~50 × 60 km grid cell — confirm local findings with independent station or satellite sensors.'}
              </p>
            )}
          </div>
          <div className="footer-by">
            <span>{t.madeBy}</span>
            <img src="./boreal-labs.png" alt="Boreal Labs" />
          </div>
        </div>
      </footer>
    </div>
  )
}

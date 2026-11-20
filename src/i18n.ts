import type {
  Demo, DemographicIndicator, Forecast, Indicator, Region, Relation, Trend, Variable, Verdict,
} from './api'

export type Lang = 'es' | 'en'
export type Phase = 'briefing' | 'planet' | 'studio' | 'cfa'

export function localeOf(lang: Lang): string {
  return lang === 'es' ? 'es' : 'en-US'
}

export function fmtNum(x: number, lang: Lang, digits = 3): string {
  const s = x.toLocaleString(localeOf(lang), { maximumSignificantDigits: digits })
  return /^-0([,.]0*)?$/.test(s) ? '0' : s
}

export function compactNum(x: number, lang: Lang): string {
  return Math.abs(x) >= 10000
    ? x.toLocaleString(localeOf(lang), { notation: 'compact', maximumSignificantDigits: 3 })
    : fmtNum(x, lang, 3)
}

export function fmtProb(p: number, lang: Lang): string {
  const sep = lang === 'es' ? ',' : '.'
  if (p < 0.0001) return `< 0${sep}0001`
  return p.toFixed(4).replace('.', sep)
}

export function pTextLang(p: number, lang: Lang): string {
  const sep = lang === 'es' ? ',' : '.'
  return p < 0.0001 ? `p < 0${sep}0001` : `p = ${fmtProb(p, lang)}`
}

type VarTranslation = { label: string; unit?: string; definition: string; reliability: string }

const VAR_EN: Record<string, VarTranslation> = {
  T2M: {
    label: 'Air temperature (mean)',
    definition: 'Average air temperature at 2 meters above the ground — what we feel day to day.',
    reliability: 'Reliable for long-term trends; represents a ~50 km grid cell, not a single weather station. Can be cross-checked with AIRS.',
  },
  T2M_MAX: {
    label: 'Daily maximum temperature',
    definition: 'Average daily peak temperature. Rises during heatwaves and hot afternoons.',
    reliability: 'Daily extremes from reanalysis are slightly less certain than long-term mean temperature.',
  },
  T2M_MIN: {
    label: 'Daily minimum temperature',
    definition: 'Average daily lowest temperature (nighttime warmth). Often reveals urban heat islands.',
    reliability: 'Daily extremes from reanalysis are slightly less certain than long-term mean temperature.',
  },
  TS: {
    label: 'Surface skin temperature',
    definition: 'Temperature of the ground or sea surface itself, rather than the air above it.',
    reliability: 'Modeled surface temperature; MODIS observes it directly since 2000 (clear skies only).',
  },
  PRECTOTCORR: {
    label: 'Precipitation',
    unit: 'mm/day',
    definition: 'Average daily rainfall (and snow). 1 mm equals 1 liter of water per square meter.',
    reliability: 'Reanalysis rainfall can show artificial jumps or trends when satellite sensors change (known shift around 1987). Best cross-checked with GPM IMERG.',
  },
  EVLAND: {
    label: 'Land evaporation',
    unit: 'mm/day',
    definition: 'Water moving from soil and vegetation into the air per day. Driven by heat and moisture availability.',
    reliability: 'Modeled variable depending on reanalysis rainfall; inherits any assimilation jumps.',
  },
  GWETROOT: {
    label: 'Root-zone soil moisture',
    unit: '0–1',
    definition: 'How wet the soil is at root depth: 0 = completely dry, 1 = saturated. Crucial for crops and forests.',
    reliability: 'Modeled soil moisture; GLDAS or SMOS/SMAP satellite sensors serve as independent cross-checks.',
  },
  GWETTOP: {
    label: 'Surface soil moisture',
    unit: '0–1',
    definition: 'How wet the top few centimeters of soil are: 0 = dry, 1 = saturated.',
    reliability: 'Modeled surface moisture; SMOS/SMAP measure it directly from space since 2010/2015.',
  },
  RH2M: {
    label: 'Relative humidity',
    definition: 'How much water vapor the air holds compared to the maximum possible at that temperature.',
    reliability: 'Reanalysis humidity is sensitive to changes in assimilated satellite sounders.',
  },
  T2MDEW: {
    label: 'Dew point temperature',
    definition: 'Temperature at which water vapor condenses. Higher values mean muggier, heavier air.',
    reliability: 'Reanalysis humidity is sensitive to changes in assimilated satellite sounders.',
  },
  CLOUD_AMT: {
    label: 'Cloud cover',
    definition: 'Percentage of the sky covered by clouds.',
    reliability: 'Cloud cover is difficult to measure homogeneously across multi-decade satellite transitions.',
  },
  ALLSKY_SFC_SW_DWN: {
    label: 'Surface solar radiation',
    unit: 'MJ/m²/day',
    definition: 'Solar energy reaching the ground each day — fuels solar panels and plant photosynthesis.',
    reliability: 'Long satellite-based radiation record (CERES); well-suited for trend analysis.',
  },
  WS2M: {
    label: 'Wind speed',
    definition: 'Average wind speed at 2 meters above the surface.',
    reliability: 'Near-surface wind depends strongly on local terrain and roughness.',
  },
  PS: {
    label: 'Surface pressure',
    definition: 'Weight of the air column above the ground. Tracks air masses and storm systems.',
    reliability: 'Very stable and well-observed atmospheric variable.',
  },
  VPD: {
    label: 'Vapor pressure deficit (VPD)',
    definition: 'How "thirsty" the air is compared to saturation. High VPD rapidly dries leaves and soil.',
    reliability: 'Derived from reanalysis temperature and humidity; highly sensitive for crop stress and fire risk.',
  },
  DTR: {
    label: 'Diurnal temperature range (DTR)',
    definition: 'Difference between daily high and nighttime low temperature (T2M_MAX − T2M_MIN).',
    reliability: 'Shrinks when nights warm faster than daytime highs.',
  },
  WBGT: {
    label: 'Wet-bulb globe temp (WBGT approx.)',
    definition: 'Combined heat-and-humidity index in shade reflecting thermal strain on the human body.',
    reliability: 'Shade approximation without direct solar load or local wind; useful for heat-stress trends.',
  },
}

const SHORT_VAR_LABEL: Record<Lang, Record<string, string>> = {
  es: {
    T2M: 'Temperatura',
    PRECTOTCORR: 'Lluvia',
    GWETROOT: 'Humedad del suelo',
    RH2M: 'Humedad del aire',
    WS2M: 'Viento',
  },
  en: {
    T2M: 'Temperature',
    PRECTOTCORR: 'Rainfall',
    GWETROOT: 'Soil Moisture',
    RH2M: 'Air Humidity',
    WS2M: 'Wind Speed',
  },
}

export function shortVarName(key: string, lang: Lang, fallback: string): string {
  return SHORT_VAR_LABEL[lang][key] ?? fallback
}

export function tVariable(v: Variable, lang: Lang): Variable {
  if (lang === 'es') return v
  const tr = VAR_EN[v.key]
  if (!tr) return v
  return {
    ...v,
    label: tr.label,
    unit: tr.unit ?? v.unit,
    definition: tr.definition,
    reliability: tr.reliability,
  }
}

export function tUnit(unit: string, lang: Lang): string {
  if (lang === 'es') return unit
  return unit
    .replace('mm/día', 'mm/day')
    .replace('MJ/m²/día', 'MJ/m²/day')
    .replace('habitantes', 'people')
    .replace('% anual', '% / yr')
    .replace('hijos por mujer', 'births/woman')
    .replace('por 1000 habitantes', 'per 1,000')
    .replace('% de la población', '% of population')
    .replace('% del PIB', '% of GDP')
    .replace('% del empleo', '% of jobs')
    .replace('US$ constantes', 'constant US$')
    .replace('años', 'years')
    .replace('índice', 'index')
}

export const CONCERNS_EN: Record<string, string> = {
  heat: 'Heat & warming',
  water: 'Rain & water',
  drought: 'Drought & crops',
  sun: 'Sun & energy',
  wind: 'Wind & storms',
}

export const PLACE_TYPES_EN: Record<string, string> = {
  city: 'A city',
  farmland: 'Farmland',
  forest: 'Forest or jungle',
  coast: 'Coastal zone',
  dry: 'Dryland or desert',
  cold: 'Mountain or cold zone',
}

const REGIONS_EN: Record<string, { label: string; biome: string }> = {
  managua: { label: 'Managua, Nicaragua', biome: 'Tropical city' },
  corredor_seco: { label: 'Dry Corridor (Somoto), Nicaragua', biome: 'Tropical dry forest' },
  bluefields: { label: 'Bluefields, Caribbean Nicaragua', biome: 'Humid coastal rainforest' },
  amazonas: { label: 'Central Amazon (Manaus), Brazil', biome: 'Tropical rainforest' },
  sahara: { label: 'Central Sahara, Algeria', biome: 'Desert' },
  artico: { label: 'Svalbard, Arctic', biome: 'Arctic tundra' },
  cdmx: { label: 'Mexico City, Mexico', biome: 'High-altitude megacity' },
}

export function tRegion(r: Region, lang: Lang): Region {
  if (lang === 'es') return r
  const tr = REGIONS_EN[r.id]
  return tr ? { ...r, ...tr } : r
}

const DEMOS_EN: Record<string, { title: string; why: string }> = {
  'managua:T2M': {
    title: 'Is Managua getting warmer?',
    why: 'Mean air temperature is the clearest baseline — and reveals why autocorrelation matters.',
  },
  'corredor_seco:GWETROOT': {
    title: 'Is the Dry Corridor soil drying out?',
    why: 'Root-zone moisture directly governs local crops and drought stress.',
  },
  'amazonas:PRECTOTCORR': {
    title: 'Is rainfall changing in the Amazon?',
    why: 'Rainfall fluctuates wildly year to year — a classic test for false trends.',
  },
  'artico:T2M': {
    title: 'Does the Arctic warm faster than the tropics?',
    why: 'Compare Svalbard with Managua: the same variable tells opposite stories.',
  },
}

export function tDemo(d: Demo, lang: Lang): Demo {
  if (lang === 'es') return d
  const tr = DEMOS_EN[`${d.region}:${d.variable}`]
  return tr ? { ...d, ...tr } : d
}

const DEMOGRAPHY_EN: Record<string, { label: string; unit: string; definition: string }> = {
  population: { label: 'Population', unit: 'people', definition: 'Total number of inhabitants in the country.' },
  growth: { label: 'Population growth', unit: '% / yr', definition: 'Annual percentage change in population (births + immigration minus deaths + emigration).' },
  fertility: { label: 'Fertility rate', unit: 'births/woman', definition: 'Average children born per woman. Around 2.1 maintains long-term population stability.' },
  birth_rate: { label: 'Birth rate', unit: 'per 1,000', definition: 'Live births per 1,000 inhabitants per year.' },
  death_rate: { label: 'Death rate', unit: 'per 1,000', definition: 'Deaths per 1,000 inhabitants per year.' },
  urban: { label: 'Urban population', unit: '% of population', definition: 'Share of people living in cities and towns.' },
  life_expectancy: { label: 'Life expectancy', unit: 'years', definition: 'Expected lifespan of a newborn under current mortality conditions.' },
}

export function tDemography(d: DemographicIndicator, lang: Lang): DemographicIndicator {
  if (lang === 'es') return d
  const tr = DEMOGRAPHY_EN[d.key]
  return tr ? { ...d, ...tr } : d
}

const INDICATORS_EN: Record<string, { label: string; unit: string; definition: string }> = {
  'AG.YLD.CREL.KG': { label: 'Cereal yield', unit: 'kg/ha', definition: 'Kilograms of cereal (corn, rice, wheat, sorghum) harvested per hectare.' },
  'AG.PRD.CROP.XD': { label: 'Crop production index', unit: 'index', definition: 'Total crop output compared to a baseline period (= 100).' },
  'AG.PRD.FOOD.XD': { label: 'Food production index', unit: 'index', definition: 'Food crop and livestock output compared to baseline (= 100).' },
  'NV.AGR.TOTL.ZS': { label: 'Agriculture share of GDP', unit: '% of GDP', definition: 'Share of national economic output from farming, forestry, and fishing.' },
  'SL.AGR.EMPL.ZS': { label: 'Agricultural employment', unit: '% of jobs', definition: 'Share of total workers employed in agriculture (ILO modeled estimate).' },
  'SN.ITK.DEFC.ZS': { label: 'Undernourishment', unit: '% of population', definition: 'Share of the population with habitual insufficient caloric intake.' },
  'SP.RUR.TOTL.ZS': { label: 'Rural population', unit: '% of population', definition: 'Share of the population living outside urban areas.' },
  'NY.GDP.PCAP.KD': { label: 'GDP per capita', unit: 'constant US$', definition: 'Inflation-adjusted economic output per person.' },
  'EG.ELC.ACCS.ZS': { label: 'Electricity access', unit: '% of population', definition: 'Share of households with access to electricity.' },
  'SP.POP.TOTL': { label: 'Population', unit: 'people', definition: 'Total national population.' },
}

export function tIndicator(i: Indicator, lang: Lang): Indicator {
  if (lang === 'es') return i
  const tr = INDICATORS_EN[i.key]
  return tr ? { ...i, ...tr } : i
}

export const LANDCOVER_LABEL: Record<Lang, Record<string, string>> = {
  es: {
    'Zona construida': 'Zona construida',
    Cultivos: 'Cultivos',
    'Árboles': 'Árboles',
    Agua: 'Agua',
    'Pastizal y matorral': 'Pastizal y matorral',
    'Suelo desnudo': 'Suelo desnudo',
    'Vegetación inundada': 'Vegetación inundada',
    'Nieve y hielo': 'Nieve y hielo',
  },
  en: {
    'Zona construida': 'Built-up area',
    Cultivos: 'Crops',
    'Árboles': 'Trees',
    Agua: 'Water',
    'Pastizal y matorral': 'Grassland & scrub',
    'Suelo desnudo': 'Bare ground',
    'Vegetación inundada': 'Flooded vegetation',
    'Nieve y hielo': 'Snow & ice',
  },
}

export function verdictLabel(verdict: Verdict, lang: Lang): string {
  if (lang === 'es') {
    return {
      significant: 'Cambio Confirmado',
      not_yet: 'En Observación (Todavía no)',
      no_trend: 'Estable / Variación Natural',
    }[verdict]
  }
  return {
    significant: 'Confirmed Change',
    not_yet: 'Under Observation (Not Yet)',
    no_trend: 'Stable / Natural Swings',
  }[verdict]
}

export function certaintyInfo(mkP: number, verdict: Verdict, lang: Lang): {
  pct: number
  headline: string
  detail: string
  tone: 'high' | 'mid' | 'low'
} {
  const pct = Math.max(5, Math.min(99.9, (1 - mkP) * 100))
  const pctStr = fmtNum(pct, lang, 3)
  if (verdict === 'significant') {
    return {
      pct,
      tone: 'high',
      headline: lang === 'es' ? `${pctStr} % de certeza` : `${pctStr}% certainty`,
      detail: lang === 'es'
        ? 'Muy improbable que sea pura suerte o ruido del clima.'
        : 'Very unlikely to be random luck or natural climate noise.',
    }
  }
  if (verdict === 'not_yet') {
    return {
      pct,
      tone: 'mid',
      headline: lang === 'es' ? `${pctStr} % de certeza (en prueba)` : `${pctStr}% certainty (testing)`,
      detail: lang === 'es'
        ? 'Hay una señal visible, pero aún no alcanza el 95 % de rigor tras corregir la memoria climática.'
        : 'There is a visible signal, but it does not yet pass the 95% threshold after autocorrelation filtering.',
    }
  }
  return {
    pct: Math.min(pct, 79),
    tone: 'low',
    headline: lang === 'es' ? 'Señal compatible con azar' : 'Matches normal background noise',
    detail: lang === 'es'
      ? 'Las subidas y bajadas entran dentro de lo normal en este periodo.'
      : 'Year-to-year swings stay within normal natural variability for this window.',
  }
}

export function humanVerdictSummary(
  t: Trend,
  where: string,
  varLabel: string,
  lang: Lang,
): string {
  const unit = tUnit(t.unit, lang)
  const sign = t.slope_per_decade > 0 ? '+' : ''
  const totSign = t.total_change > 0 ? '+' : ''
  const rate = `${sign}${fmtNum(t.slope_per_decade, lang)} ${unit}`
  const tot = `${totSign}${fmtNum(t.total_change, lang)} ${unit}`
  const pctPart = t.percent_change !== null
    ? ` (${t.percent_change > 0 ? '+' : ''}${t.percent_change.toFixed(1)}%)`
    : ''
  const period = `${t.first_year}–${t.last_year}`

  if (lang === 'es') {
    const dirWord = t.direction === 'up' ? 'está subiendo' : t.direction === 'down' ? 'está bajando' : 'se mantiene sin cambio claro'
    if (t.verdict === 'significant') {
      return `${varLabel} en ${where} ${dirWord} de forma real y sostenida (${rate} cada década entre ${period}, un cambio acumulado de ${tot}${pctPart}). Ambas pruebas anti-falsas-alarmas coinciden: esto no parece casualidad.`
    }
    if (t.verdict === 'not_yet') {
      const needPart = t.years_needed
        ? (t.years_needed > t.n_years
          ? `Con este nivel de variación natural harían falta ~${t.years_needed} años de registro para confirmarlo (actualmente tenemos ${t.n_years}).`
          : `Aunque hay ${t.n_years} años, las dos pruebas estadísticas no coinciden todavía, por eso el veredicto es prudente.`)
        : ''
      return `Aunque la línea parece moverse (${rate} por década en ${period}), todavía NO podemos afirmarlo con seguridad: el clima varía mucho año con año. ${needPart}`
    }
    const extra = t.years_needed
      ? ` Si existiera un cambio de este tamaño (${rate}/década), necesitaríamos unos ${t.years_needed} años de datos para distinguirlo del ruido.`
      : ''
    return `En ${period}, ${varLabel.toLowerCase()} en ${where} no muestra una tendencia clara: los altibajos son compatibles con la variación natural normal.${extra}`
  }

  const dirWord = t.direction === 'up' ? 'rising' : t.direction === 'down' ? 'falling' : 'flat'
  if (t.verdict === 'significant') {
    return `${varLabel} in ${where} is ${dirWord} steadily (${rate} per decade across ${period}, totaling ${tot}${pctPart}). Both false-alarm-resistant statistical tests agree: this shift is very unlikely to be luck.`
  }
  if (t.verdict === 'not_yet') {
    const needPart = t.years_needed
      ? (t.years_needed > t.n_years
        ? `At this pace and noise level, ~${t.years_needed} years of data are needed to confirm it (we currently have ${t.n_years}).`
        : `We have ${t.n_years} years, but the two independent tests disagree, so DATEX stays cautious.`)
      : ''
    return `The chart tilts (${rate} per decade in ${period}), but it is NOT YET confirmed: natural year-to-year climate swings are still large enough to mimic this slope. ${needPart}`
  }
  const extra = t.years_needed
    ? ` If a shift this size (${rate}/decade) were actually happening, we would need ~${t.years_needed} years of data to spot it clearly.`
    : ''
  return `Across ${period}, ${varLabel.toLowerCase()} in ${where} shows no clear trend: year-to-year ups and downs look like normal natural variability.${extra}`
}

export function translateWarning(w: string, lang: Lang): string {
  if (w.startsWith('Autocorrelación alta')) {
    const m = w.match(/\(([^)]+)\)/)
    const rVal = m ? m[1] : ''
    if (lang === 'es') {
      return `El clima aquí tiene "memoria fuerte" entre años seguidos (${rVal}): un año cálido o seco suele seguir a otro igual, lo que hace más fácil confundir rachas con cambios reales.`
    }
    return `Strong year-to-year climate "memory" (${rVal}): warm or dry years tend to cluster together, making natural streaks look like long-term trends.`
  }

  if (w.startsWith('Las dos pruebas')) {
    if (lang === 'es') return 'Nuestros dos detectores matemáticos no se ponen de acuerdo todavía: por seguridad marcamos el resultado como "En observación".'
    return 'Our two statistical detectors disagree on this time series, so we conservatively mark it as "Not Yet Confirmed".'
  }

  if (w.startsWith('El veredicto cambia')) {
    if (lang === 'es') return 'Cuidado: si movemos el año de inicio o fin por apenas 1 a 3 años, la conclusión cambia. Depende bastante del tramo elegido.'
    return 'Heads up: shifting the start or end date by just 1–3 years changes the verdict. The result is sensitive to the chosen time window.'
  }

  if (w.startsWith('Parece un salto brusco')) {
    const yearMatch = w.match(/hacia (\d{4})/)
    const yr = yearMatch ? yearMatch[1] : ''
    if (lang === 'es') {
      return `¡Ojo! Los datos saltaron de golpe alrededor de ${yr} en lugar de cambiar poco a poco. Esto suele pasar cuando cambian los satélites de la NASA, no por el clima real.`
    }
    return `Watch out! The data jumped abruptly around ${yr} rather than changing gradually. This often signals a satellite sensor upgrade rather than real climate change.`
  }

  if (w.startsWith('La previsión mira')) {
    const nums = w.match(/\d+/g) ?? []
    if (lang === 'es') return `El escenario mira ${nums[0] ?? ''} años al futuro usando solo ${nums[1] ?? ''} años de historia: úsalo como una referencia visual, no como predicción exacta.`
    return `This scenario projects ${nums[0] ?? ''} years ahead from ${nums[1] ?? ''} years of history: use it as a "what-if" scenario, never as a deterministic forecast.`
  }
  if (w.startsWith('Los años consecutivos')) {
    if (lang === 'es') return 'Como años cercanos se parecen entre sí, el margen real del futuro podría ser más ancho que la banda morada.'
    return 'Consecutive years are correlated: the true future uncertainty band is likely wider than shown.'
  }
  if (w.startsWith('La tendencia de base no es significativa')) {
    if (lang === 'es') return 'Como la tendencia actual aún no está confirmada, la línea central vale casi igual que el promedio actual; mira sobre todo la banda ancha.'
    return 'Baseline trend is not statistically significant: focus on the wide uncertainty band rather than the center line.'
  }
  if (w.startsWith('La recta llega a un límite físico')) {
    if (lang === 'es') return 'La recta matemática choca con un límite físico imposible (ej. 0 % o 100 %); en la realidad se frenaría antes.'
    return 'The linear path hits a physical boundary (e.g. 0% or 100%); real-world change would saturate earlier.'
  }

  if (w.includes('clasificador') || w.includes('modelo automático')) {
    if (lang === 'es') return w
    return 'Land cover is classified automatically at 10 m resolution. A sharp 1-year jump usually reflects classifier calibration rather than real terrain change.'
  }
  if (w.includes('salto de más de 5 puntos')) {
    if (lang === 'es') return w
    return 'Built-up or cover share jumps by >5 percentage points in a single year here: interpret cautiously.'
  }

  if (w.startsWith('Se compara un punto')) {
    const parts = w.match(/\(([^,]+), celda.*?\(([^)]+)\)/)
    const pl = parts?.[1] ?? 'this point'
    const co = parts?.[2] ?? 'country'
    if (lang === 'es') return w
    return `Compares one ~50 × 60 km grid cell (${pl}) against a national indicator for ${co}. Local anomalies may not represent the entire country.`
  }
  if (w.startsWith('Pocos años en común')) {
    if (lang === 'es') return w
    return 'Few overlapping years: a real correlation may fail to reach significance.'
  }
  if (w.startsWith('Pearson y Spearman')) {
    if (lang === 'es') return w
    return 'Pearson and Spearman disagree: one or two extreme outlier years may dominate the correlation.'
  }
  return w
}

export function formatForecastText(fc: Forecast, varLabel: string, unit: string, lang: Lang): string {
  const u = tUnit(unit, lang)
  const end = fc.points[fc.points.length - 1]
  if (!end) return fc.text
  const rate = fc.slope_per_year * 10
  const sign = rate > 0 ? '+' : ''
  if (lang === 'es') {
    return `Si el ritmo de ${fc.base_first_year}–${fc.base_last_year} continuara (${sign}${fmtNum(rate, 'es')} ${u}/década), en ${fc.to_year} ${varLabel.toLowerCase()} rondaría ${fmtNum(end.value, 'es')} ${u} (rango del 95 %: ${fmtNum(end.low, 'es')} a ${fmtNum(end.high, 'es')}).`
  }
  return `If the ${fc.base_first_year}–${fc.base_last_year} pace continued (${sign}${fmtNum(rate, 'en')} ${u}/decade), by ${fc.to_year} ${varLabel.toLowerCase()} would be around ${fmtNum(end.value, 'en')} ${u} (95% interval: ${fmtNum(end.low, 'en')} to ${fmtNum(end.high, 'en')}). Remember: this is a linear scenario, not a climate prediction.`
}

export function formatRelationText(
  rel: Relation,
  varLabel: string,
  indLabel: string,
  place: string,
  country: string,
  lang: Lang,
): string {
  const strengthMap = {
    es: { débil: 'débil', moderada: 'moderada', fuerte: 'fuerte' },
    en: { débil: 'weak', moderada: 'moderate', fuerte: 'strong' },
  }
  const str = strengthMap[lang][rel.strength] ?? rel.strength
  if (lang === 'es') {
    const base = rel.significant
      ? `Cuando ${varLabel.toLowerCase()} en ${place} sube por encima de su tendencia en un año cualquiera, ${indLabel.toLowerCase()} en ${country} suele moverse ${rel.detrended_r > 0 ? 'en la misma dirección' : 'en dirección contraria'} (relación ${str}, r = ${fmtNum(rel.detrended_r, 'es', 2)}).`
      : `Al quitar las tendencias de largo plazo, no hay una conexión clara año a año entre ${varLabel.toLowerCase()} en ${place} y ${indLabel.toLowerCase()} en ${country} (r = ${fmtNum(rel.detrended_r, 'es', 2)}).`
    const trap = rel.trend_driven
      ? ` ¡Cuidado con la trampa estadística! Sin filtrar las tendencias parecía haber relación (r = ${fmtNum(rel.raw_r, 'es', 2)}), pero solo era coincidencia porque ambas cambian con el tiempo.`
      : ''
    return `${base}${trap} Recuerda: coincidir en el tiempo no demuestra causa directa.`
  }
  const base = rel.significant
    ? `Year-to-year, whenever ${varLabel.toLowerCase()} in ${place} deviates from its trend, ${indLabel.toLowerCase()} in ${country} tends to move in the ${rel.detrended_r > 0 ? 'same' : 'opposite'} direction (${str} link, r = ${fmtNum(rel.detrended_r, 'en', 2)}, ${pTextLang(rel.detrended_p, 'en')}).`
    : `Once long-term trends are removed, no clear year-to-year link appears between ${varLabel.toLowerCase()} in ${place} and ${indLabel.toLowerCase()} in ${country} (r = ${fmtNum(rel.detrended_r, 'en', 2)}, ${pTextLang(rel.detrended_p, 'en')}).`
  const trap = rel.trend_driven
    ? ` Beware the trend trap: raw values looked correlated (r = ${fmtNum(rel.raw_r, 'en', 2)}), only because both series drift over time independently.`
    : ''
  return `${base}${trap} Correlation shows association, not proof of causation.`
}

export const UI = {
  es: {
    madeBy: 'Desarrollado por',
    team: 'NASA Space Apps Challenge 2026',
    phases: {
      briefing: { label: 'Inicio' },
      planet: { label: 'Planeta' },
      studio: { label: 'Análisis' },
      cfa: { label: 'CFA · Pacífico Sur' },
    },
    phase1: {
      headline: '¿El clima está cambiando',
      headlineMark: 'de verdad?',
      sub: 'DATEX separa el cambio real de las falsas alarmas con 40 años de datos de la NASA.',
      ctaPlanet: 'Explorar el planeta',
      stats: {
        vars: 'variables',
        years: 'años de datos',
        cells: 'celdas globales',
        countries: 'países',
      },
      trapTitle: '¿Por qué las gráficas normales engañan? El filtro anti-falsas-alarmas',
      trapDesc: 'Los datos de la Tierra "tienen memoria": un año caliente suele arrastrar al siguiente. Si aplicas una línea de tendencia común sin corregir eso, declaras alarmas falsas casi la mitad de las veces cuando no pasa nada.',
      trapCols: ['Memoria del clima (φ)', 'Regresión común (Falsas alarmas)', 'DATEX (Ambas pruebas + corrección)', 'Mejora'],
      semaforoTitle: 'Cómo leer el Veredicto Honesto',
      semaforo: [
        { tone: 'significant', badge: 'Confirmado', title: 'Tendencia Significativa', desc: 'Supera dos pruebas independientes (Mann-Kendall preblanqueado y regresión con tamaño efectivo). Muy improbable que sea azar.' },
        { tone: 'not_yet', badge: 'En observación', title: 'Todavía NO Significativa', desc: 'La gráfica parece moverse, pero la variación natural aún es fuerte. Te decimos exactamente cuántos años de datos faltan para confirmarlo.' },
        { tone: 'no_trend', badge: 'Estable', title: 'Sin Tendencia Clara', desc: 'Los altibajos observados entran dentro del comportamiento normal de la naturaleza en ese periodo.' },
      ],
      demosTitle: 'Empieza con un caso real',
    },
    phase2: {
      title: 'Explora el planeta',
      globalBtn: 'Vista Global',
      zoomZoneBtn: 'Zoom a la Zona',
      legendHelp: 'Opaco = tendencia confirmada que pasa el control global FDR (q = 0,10). Al hacer zoom hacia tu ciudad, la capa se vuelve transparente para mostrarte la imagen satelital real.',
      dockStep1: 'Lugar',
      dockStep2: 'Variable',
      searchPlaceholder: 'Ciudad, pueblo o región',
      searchBtn: 'Buscar',
      compareToggle: 'Comparar con un segundo lugar',
      secondHint: 'Haz clic en el planeta para marcar el segundo lugar.',
      secondChange: 'Cambiar',
      helpChoose: 'Ayúdame a elegir',
      legendTitle: 'Cómo leer el mapa',
      askPlaceholder: 'Pregunta libre: "¿se está secando el suelo en Somoto?"',
      askBtn: 'Interpretar',
      concernTitle: '¿Qué te preocupa?',
      placeTypeTitle: '¿Qué tipo de lugar es?',
      recTitle: 'Variables recomendadas para tu caso',
      allVarsLabel: 'Variable NASA',
      startYearLabel: 'Desde',
      launchBtn: 'Analizar esta zona',
      busyBtn: 'Calculando veredicto…',
    },
    phase3: {
      backToPlanet: 'Cambiar zona',
      compareShortcut: 'Comparar',
      tabs: {
        trend: 'Veredicto',
        scan: 'Radar',
        compare: 'Comparar',
        satellite: 'Satélite',
        population: 'Población',
        relate: 'Sociedad',
      },
      kpi: {
        what: '¿Qué cambia y dirección?',
        pace: 'Ritmo de cambio',
        certainty: 'Certeza estadística',
        data: 'Suficiencia de datos',
        yearsHave: 'años analizados',
        yearsNeed: 'años necesarios (~90 % detección)',
        enoughData: 'Registro suficiente para concluir',
        missingYearsPrefix: 'Faltan aprox.',
        missingYearsSuffix: 'años más a este ritmo',
        plausibleRange: 'Rango razonable (95 %):',
        perDecade: '/ década',
        totalOver: 'acumulado en',
        yearsWord: 'años',
      },
      chart: {
        title: 'Evolución Histórica y Tendencia',
        simpleBtn: 'Vista Simple (Anual)',
        fullBtn: 'Vista Completa (+ Meses)',
        guideSimple: 'Cada punto es el promedio anual respecto a la media histórica. La línea naranja marca el ritmo sostenido (Theil–Sen).',
        guideFull: 'Incluye en gris oscuro las anomalías mensuales desestacionalizadas para ver el ruido de corto plazo junto al promedio anual.',
        yAxis: 'Anomalía',
        monthlyName: 'Meses (sin estación)',
        annualName: 'Promedio anual',
        trendName: 'Tendencia (Theil–Sen)',
        bandName: 'Escenario: rango 95 %',
        scenarioName: 'Escenario si el ritmo sigue',
        todayLabel: 'hoy',
      },
      scenario: {
        title: 'Proyección de Escenario ("¿Qué pasaría si el ritmo continúa?")',
        note: 'Etiquetado como escenario lineal hipotético, no como predicción climática.',
        btnPrefix: 'Calcular escenario al año',
      },
      rigor: {
        summaryStudent: 'Ver detalles técnicos y validación estadística (Para investigadores)',
        summaryResearcher: 'Motor Estadístico Dual y Validación Monte Carlo',
        methodTitle: 'Comparativa de los 2 métodos independientes',
        cols: ['Método', 'Pendiente / década', 'IC 95 %', 'Valor p / Estadístico'],
        row1: 'Theil–Sen + Mann-Kendall (preblanqueado)',
        row2: 'Regresión OLS (n efectivo) + t-test',
        agreeYes: 'Ambos métodos coinciden en la conclusión.',
        agreeNo: 'Los métodos no coinciden: el veredicto se mantiene prudente.',
        sourceLive: 'Fuente: NASA POWER en vivo (MERRA-2 / CERES).',
        sourceLocal: 'Fuente: muestra local verificada de NASA POWER (modo sin conexión).',
      },
      scan: {
        title: 'Radar completo en',
        sub: 'Las 14 variables satelitales ordenadas de evidencia más fuerte a más débil. Haz clic en cualquier variable para abrir su Veredicto.',
        bonferroniNote: 'Al probar múltiples variables a la vez, algunas pueden parecer significativas por azar. El p ajustado (Bonferroni) protege contra falsos descubrimientos.',
        regionsTitle: 'Misma variable en las 7 regiones de referencia mundial',
        regionsSub: 'Demuestra que un mismo indicador puede subir fuertemente en un bioma y bajar o mantenerse estable en otro.',
        colsScan: ['Variable', 'Dir.', 'Ritmo / década', 'Certeza / p', 'Veredicto'],
        colsReg: ['Región y Bioma', 'Dir.', 'Ritmo / década', 'p', 'Veredicto'],
      },
    },
  },
  en: {
    madeBy: 'Built by',
    team: 'NASA Space Apps Challenge 2026',
    phases: {
      briefing: { label: 'Home' },
      planet: { label: 'Planet' },
      studio: { label: 'Analysis' },
      cfa: { label: 'CFA · South Pacific' },
    },
    phase1: {
      headline: 'Is the climate changing',
      headlineMark: 'for real?',
      sub: 'DATEX separates real change from false alarms using 40 years of NASA data.',
      ctaPlanet: 'Explore the planet',
      stats: {
        vars: 'variables',
        years: 'years of data',
        cells: 'global cells',
        countries: 'countries',
      },
      trapTitle: 'Why ordinary trend lines lie: our Anti-False-Alarm Filter',
      trapDesc: 'Environmental data has "memory": a hot or dry year tends to follow another. Standard trend tests ignore this and raise false alarms up to 49% of the time when nothing is actually changing.',
      trapCols: ['Climate Memory (φ)', 'Ordinary Regression (False Alarms)', 'DATEX (Dual Test + Bias Fix)', 'Protection'],
      semaforoTitle: 'How to read an Honest Verdict',
      semaforo: [
        { tone: 'significant', badge: 'Confirmed', title: 'Statistically Significant', desc: 'Passes two independent tests (prewhitened Mann-Kendall & effective-N regression). Very unlikely to be luck.' },
        { tone: 'not_yet', badge: 'Watching', title: 'Not Yet Significant', desc: 'A slope appears, but natural swings are still too loud. We estimate exactly how many years of data are needed.' },
        { tone: 'no_trend', badge: 'Stable', title: 'No Clear Trend', desc: 'Observed fluctuations fall well inside normal natural variability over this period.' },
      ],
      demosTitle: 'Start with a real case',
    },
    phase2: {
      title: 'Explore the planet',
      globalBtn: 'Global View',
      zoomZoneBtn: 'Zoom to Zone',
      legendHelp: 'Opaque = confirmed trend passing global FDR control (q = 0.10). As you zoom into a region, cell shading fades so real satellite imagery shines through.',
      dockStep1: 'Place',
      dockStep2: 'Variable',
      searchPlaceholder: 'City, town or region',
      searchBtn: 'Search',
      compareToggle: 'Compare with a second place',
      secondHint: 'Click the planet to mark the second place.',
      secondChange: 'Change',
      helpChoose: 'Help me choose',
      legendTitle: 'How to read the map',
      askPlaceholder: 'Ask freely: "is soil drying out in Somoto?"',
      askBtn: 'Interpret',
      concernTitle: 'What is your concern?',
      placeTypeTitle: 'What kind of place is this?',
      recTitle: 'Recommended variables for your case',
      allVarsLabel: 'NASA variable',
      startYearLabel: 'Since',
      launchBtn: 'Analyze this zone',
      busyBtn: 'Computing verdict…',
    },
    phase3: {
      backToPlanet: 'Change zone',
      compareShortcut: 'Compare',
      tabs: {
        trend: 'Verdict',
        scan: 'Radar',
        compare: 'Compare',
        satellite: 'Satellite',
        population: 'Population',
        relate: 'Society',
      },
      kpi: {
        what: 'What & Direction',
        pace: 'Pace of Change',
        certainty: 'Statistical Certainty',
        data: 'Data Sufficiency',
        yearsHave: 'years observed',
        yearsNeed: 'years needed (~90% detection)',
        enoughData: 'Enough record length to conclude',
        missingYearsPrefix: 'Approx.',
        missingYearsSuffix: 'more years needed at this pace',
        plausibleRange: 'Plausible 95% range:',
        perDecade: '/ decade',
        totalOver: 'total over',
        yearsWord: 'years',
      },
      chart: {
        title: 'Historical Series & Trend',
        simpleBtn: 'Simple View (Annual)',
        fullBtn: 'Full View (+ Monthly)',
        guideSimple: 'Dots show annual averages relative to the period mean. The orange dashed line is the outlier-resistant Theil–Sen trend.',
        guideFull: 'Adds deseasonalized monthly anomalies in dark slate so you can inspect short-term noise around the annual trend.',
        yAxis: 'Anomaly',
        monthlyName: 'Monthly (deseasonalized)',
        annualName: 'Annual mean',
        trendName: 'Trend (Theil–Sen)',
        bandName: 'Scenario: 95% range',
        scenarioName: 'Scenario if pace continues',
        todayLabel: 'today',
      },
      scenario: {
        title: 'Future Scenario Explorer ("What if today\'s pace continues?")',
        note: 'Explicitly labeled as a linear scenario — not a climate forecast.',
        btnPrefix: 'Project scenario to',
      },
      rigor: {
        summaryStudent: 'View full statistical test details & validation (For Researchers)',
        summaryResearcher: 'Dual Statistical Engine & Monte Carlo Rigor',
        methodTitle: 'Side-by-side results from both independent tests',
        cols: ['Method', 'Slope / decade', '95% CI', 'p-value / Statistic'],
        row1: 'Theil–Sen + Prewhitened Mann-Kendall',
        row2: 'Effective-N OLS Regression + t-test',
        agreeYes: 'Both statistical engines agree on the conclusion.',
        agreeNo: 'The two engines disagree: verdict remains conservative.',
        sourceLive: 'Source: Live NASA POWER API (MERRA-2 / CERES).',
        sourceLocal: 'Source: Verified offline NASA POWER sample.',
      },
      scan: {
        title: 'Full 14-variable radar at',
        sub: 'All NASA POWER variables ranked from strongest to weakest evidence. Click any row to open its full Verdict.',
        bonferroniNote: 'Testing 14 variables simultaneously increases random hits. Adjusted p (Bonferroni) guards against false discoveries.',
        regionsTitle: 'Same variable across 7 global reference biomes',
        regionsSub: 'Shows how the exact same Earth variable can climb rapidly in one region while staying flat or dropping elsewhere.',
        colsScan: ['Variable', 'Dir.', 'Pace / decade', 'Certainty / p', 'Verdict'],
        colsReg: ['Region & Biome', 'Dir.', 'Pace / decade', 'p', 'Verdict'],
      },
    },
  },
} as const

/** Vista 'Ciudad 3D': escenario de crecimiento urbano (ES/EN). */
export const CITY = {
  es: {
    title: 'Cómo se verá la ciudad',
    badge: 'Escenario de crecimiento urbano, no una predicción',
    intro: 'Cada bloque es una celda de unos 100 m. En azul marino lo construido hoy, con la altura real de sus edificios; en cian, las celdas nuevas (crecimiento horizontal); en blanco, los pisos que se suman encima de lo existente (crecimiento vertical). Arrastra para inclinar y girar la vista.',
    loading: 'Cargando la ciudad…',
    error: 'No se pudo cargar el escenario de esta ciudad.',
    mapLabel: 'Vista 3D inclinada de la ciudad con lo construido, el crecimiento horizontal y el crecimiento vertical',
    year: 'Año',
    yearAria: 'Año del escenario',
    play: 'Reproducir',
    pause: 'Pausar',
    onlyProjected: 'Solo lo proyectado',
    legendBase: 'Construido en',
    legendProjected: 'Escenario proyectado',
    legendHorizontal: 'Crecimiento horizontal (celdas nuevas)',
    legendVertical: 'Crecimiento vertical (más pisos)',
    legendPulse: 'Nuevo en este paso',
    legendHeight: 'Altura media por celda (GHSL, 100 m)',
    sectionTitle: 'Crecimiento urbano proyectado: horizontal y vertical',
    exagLabel: 'Exageración vertical',
    exagNote: 'Las alturas se exageran para que se aprecien; las cifras mostradas son reales.',
    rotate: 'Girar la vista',
    rotateStop: 'Detener el giro',
    kpiHeight: 'Altura media de lo existente',
    kpiHeightBase: (y: number) => `Punto de partida (${y})`,
    kpiMax: 'Celda con mayor altura media',
    kpiMaxNote: 'Promedio de una celda de 100 m, no un edificio individual',
    heightsNote: 'Las alturas vienen de GHSL (100 m): son promedios por celda, no edificios individuales; las torres aisladas aparecen suavizadas.',
    kpiVolume: 'Volumen construido',
    kpiVolumeUnit: 'millones de m³',
    kpiVolumeVertical: (v: string) => `de los cuales ${v} millones de m³ por crecimiento vertical`,
    kpiVolumeHorizontal: 'En «Solo población» todo el crecimiento es horizontal',
    verticalTitle: 'Efecto vertical: más pisos',
    verticalNote: (theta: string) => `La altura de lo existente crece con el ingreso por habitante: m = (PIB / PIB 2023)^θ, con θ = ${theta}. Es un supuesto explícito, no un coeficiente ajustado, y se aplica sobre todo en el núcleo denso.`,
    colMult: 'Multiplicador de altura (×)',
    colHeightExisting: 'Altura media de lo existente (m)',
    colVolume: 'Volumen construido (millones de m³)',
    colVolumeVertical: 'Del cual vertical (millones de m³)',
    sensTheta: 'Elasticidad de la altura al ingreso (θ)',
    methodVertical: (y: number) => `Las alturas de partida son reales: vienen de la capa GHSL de altura media de edificación (100 m, ${y}, estimada desde satélite). Cada año, los edificios existentes ganan pisos en proporción al ingreso por habitante y, sobre todo, en el núcleo denso de la ciudad; las celdas nuevas nacen con la altura típica de su entorno. El escenario «Solo población» crece solo en horizontal.`,
    built: 'Superficie construida',
    change: 'frente a',
    urbanPop: 'Población urbana',
    urbanPopUnit: 'millones',
    summary: (year: number, km2: string, pct: string, base: number) =>
      year === base
        ? `En ${year}: ${km2} km² construidos en la zona estudiada.`
        : `En ${year} el escenario añade hasta ${km2} km² construidos (${pct} frente a ${base}).`,
    how: 'Cómo se calcula y qué tan fiable es',
    methodTitle: 'Método',
    method: 'Se parte de lo construido en 2023 según la cobertura del suelo de 10 m. Un modelo aprende, con las transiciones de 2017 a 2023, qué celdas libres tienden a urbanizarse (cercanía a lo construido, densidad vecina, pendiente del terreno). La superficie total sigue la población urbana de la ONU, y año a año se construyen las celdas más probables.',
    reliabilityTitle: 'Fiabilidad',
    reliability: (fit: string, test: string, auc: string, times: string, vsNear: string) =>
      `Se ajustó con ${fit} y se probó en ${test}, un periodo que el modelo no había visto. Acierta dónde crece la ciudad ${times} veces más que elegir al azar y ${vsNear} veces más que construir siempre junto a lo ya construido (AUC ${auc}; 0,5 sería azar y 1 la perfección).`,
    caveatsTitle: 'Límites',
    caveats: [
      'Es un escenario: prolonga la tendencia de 2017–2023 y no conoce planes urbanísticos ni decisiones políticas.',
      'Con 10 m de resolución se distinguen manzanas, no edificios sueltos; las alturas de partida (GHSL, 100 m, 2018) son una estimación y el crecimiento vertical sigue un supuesto de ingreso, no un dato.',
      'Las alturas vienen de GHSL (100 m): son promedios por celda, no edificios individuales; las torres aisladas aparecen suavizadas.',
      'La zona estudiada es un cuadrado de unos 24 km alrededor del centro.',
    ],
    sources: 'Fuentes',
    openFromMap: 'Ver la ciudad en 3D',
    scenarioAria: 'Escenario: clima y sociedad, o solo población',
    scenIntegrated: 'Clima + sociedad',
    scenPopulation: 'Solo población',
    scenIn2050: (km2: string) => `${km2} km² en 2050`,
    driversTitle: 'Variables que se tuvieron en cuenta',
    driversTable: 'Variables por año',
    colYear: 'Año',
    colUrbanPop: 'Población urbana (millones)',
    colGdp: 'PIB por habitante (USD)',
    colAgr: 'Empleo agrario (%)',
    colClimate: 'Estrés climático (0–1)',
    colPush: 'Empuje migratorio (×)',
    colBuilt: 'km² construidos',
    colBuiltPop: 'km² solo población',
    climateTitle: 'Tendencias climáticas usadas',
    climateItem: (label: string, full: string, used: string, from: number, weight: string, brk: string) =>
      `${label}: ${full} en todo el periodo; se usa ${used} desde ${from} (${brk}). Peso de evidencia: ${weight}.`,
    climateBreak: (year: number) => `salto brusco detectado en ${year}`,
    climateNoBreak: 'sin salto brusco',
    driversNotice: 'Si en el clima se detecta un salto brusco, solo se usa la tendencia posterior; una tendencia no concluyente pesa la mitad y una sin tendencia no pesa.',
    driversNoStress: (city: string) => `En ${city} no hay estrés climático confirmado, así que la diferencia entre escenarios viene del ingreso.`,
    driversStress: (city: string) => `En ${city} el clima añade presión migratoria; la diferencia entre escenarios combina clima e ingreso.`,
    sensTitle: 'Qué pasaría si',
    sensNote: 'Son supuestos del escenario, no predicciones: muestran cuánto cambia el resultado si se cambian los supuestos (km² construidos en 2050).',
    sensStress: 'Estrés climático en 2050',
    sensPush: 'Empuje migratorio',
    sensIncome: 'Elasticidad del ingreso',
    sensCurrent: 'supuesto usado',
  },
  en: {
    title: 'How the city will look',
    badge: 'Urban growth scenario, not a forecast',
    intro: 'Each block is a cell of about 100 m. Navy shows what is built today, with its real building heights; cyan shows new cells (horizontal growth); white shows the floors added on top of existing buildings (vertical growth). Drag to tilt and rotate the view.',
    loading: 'Loading the city…',
    error: 'Could not load the scenario for this city.',
    mapLabel: 'Tilted 3D view of the city with what is built, horizontal growth and vertical growth',
    year: 'Year',
    yearAria: 'Scenario year',
    play: 'Play',
    pause: 'Pause',
    onlyProjected: 'Projected only',
    legendBase: 'Built in',
    legendProjected: 'Projected scenario',
    legendHorizontal: 'Horizontal growth (new cells)',
    legendVertical: 'Vertical growth (more floors)',
    legendPulse: 'New in this step',
    legendHeight: 'Average height per cell (GHSL, 100 m)',
    sectionTitle: 'Projected urban growth: horizontal and vertical',
    exagLabel: 'Vertical exaggeration',
    exagNote: 'Heights are exaggerated so they can be seen; the figures shown are real.',
    rotate: 'Rotate the view',
    rotateStop: 'Stop rotating',
    kpiHeight: 'Average height of existing buildings',
    kpiHeightBase: (y: number) => `Starting point (${y})`,
    kpiMax: 'Cell with the highest average height',
    kpiMaxNote: 'Average of a 100 m cell, not an individual building',
    heightsNote: 'Heights come from GHSL (100 m): they are per-cell averages, not individual buildings; isolated towers appear smoothed out.',
    kpiVolume: 'Built volume',
    kpiVolumeUnit: 'million m³',
    kpiVolumeVertical: (v: string) => `of which ${v} million m³ from vertical growth`,
    kpiVolumeHorizontal: 'In "Population only" all growth is horizontal',
    verticalTitle: 'Vertical effect: more floors',
    verticalNote: (theta: string) => `The height of existing buildings grows with income per person: m = (GDP / GDP 2023)^θ, with θ = ${theta}. It is an explicit assumption, not a fitted coefficient, and it applies mostly in the dense core.`,
    colMult: 'Height multiplier (×)',
    colHeightExisting: 'Average height of existing buildings (m)',
    colVolume: 'Built volume (million m³)',
    colVolumeVertical: 'Of which vertical (million m³)',
    sensTheta: 'Height elasticity to income (θ)',
    methodVertical: (y: number) => `Starting heights are real: they come from the GHSL average building height layer (100 m, ${y}, estimated from satellite data). Each year existing buildings gain floors in proportion to income per person and, above all, in the dense core of the city; new cells start at the typical height of their surroundings. The "Population only" scenario grows only horizontally.`,
    built: 'Built-up area',
    change: 'vs',
    urbanPop: 'Urban population',
    urbanPopUnit: 'million',
    summary: (year: number, km2: string, pct: string, base: number) =>
      year === base
        ? `In ${year}: ${km2} km² built up in the study area.`
        : `In ${year} the scenario adds up to ${km2} km² built up (${pct} vs ${base}).`,
    how: 'How it is calculated and how reliable it is',
    methodTitle: 'Method',
    method: 'We start from what was built in 2023 according to 10 m land cover. A model learns, from the 2017–2023 transitions, which free cells tend to urbanise (closeness to built-up land, neighbouring density, terrain slope). Total built area follows the UN urban population, and each year the most likely cells are built.',
    reliabilityTitle: 'Reliability',
    reliability: (fit: string, test: string, auc: string, times: string, vsNear: string) =>
      `It was fitted on ${fit} and tested on ${test}, a period the model had not seen. It finds where the city grows ${times} times better than picking at random and ${vsNear} times better than always building next to existing built-up land (AUC ${auc}; 0.5 would be chance and 1 perfect).`,
    caveatsTitle: 'Limits',
    caveats: [
      'It is a scenario: it extends the 2017–2023 trend and knows nothing of urban plans or policy decisions.',
      'At 10 m resolution you can tell city blocks, not single buildings; starting heights (GHSL, 100 m, 2018) are an estimate and vertical growth follows an income assumption, not data.',
      'Heights come from GHSL (100 m): they are per-cell averages, not individual buildings; isolated towers appear smoothed out.',
      'The study area is a square of about 24 km around the centre.',
    ],
    sources: 'Sources',
    openFromMap: 'See the city in 3D',
    scenarioAria: 'Scenario: climate and society, or population only',
    scenIntegrated: 'Climate + society',
    scenPopulation: 'Population only',
    scenIn2050: (km2: string) => `${km2} km² in 2050`,
    driversTitle: 'Variables taken into account',
    driversTable: 'Variables by year',
    colYear: 'Year',
    colUrbanPop: 'Urban population (million)',
    colGdp: 'GDP per capita (USD)',
    colAgr: 'Agricultural employment (%)',
    colClimate: 'Climate stress (0–1)',
    colPush: 'Migration push (×)',
    colBuilt: 'Built-up km²',
    colBuiltPop: 'Population-only km²',
    climateTitle: 'Climate trends used',
    climateItem: (label: string, full: string, used: string, from: number, weight: string, brk: string) =>
      `${label}: ${full} over the full period; ${used} is used from ${from} (${brk}). Evidence weight: ${weight}.`,
    climateBreak: (year: number) => `abrupt shift detected in ${year}`,
    climateNoBreak: 'no abrupt shift',
    driversNotice: 'If the climate record shows an abrupt shift, only the trend after it is used; an inconclusive trend counts half and a no-trend result counts for nothing.',
    driversNoStress: (city: string) => `In ${city} there is no confirmed climate stress, so the difference between scenarios comes from income.`,
    driversStress: (city: string) => `In ${city} the climate adds migration pressure; the difference between scenarios combines climate and income.`,
    sensTitle: 'What if',
    sensNote: 'These are scenario assumptions, not forecasts: they show how much the result changes when the assumptions change (built-up km² in 2050).',
    sensStress: 'Climate stress in 2050',
    sensPush: 'Migration push',
    sensIncome: 'Income elasticity',
    sensCurrent: 'assumption used',
  },
} as const

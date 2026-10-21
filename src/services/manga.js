// Combines both APIs: AniList for the series, MangaDex for its volumes and their covers.
import { getPopularSeries, getSeriesInfo, getVolumeCounts } from './anilist'
import { getVolumeCovers, getVolumeFirstChapter } from './mangadex'

export { searchSeries, getRandomTitle } from './anilist'

// A volume id is "<AniList series id>-<volume number>", e.g. "30011-12"
export const volumeId = (seriesId, volume) => `${seriesId}-${volume}`

export function parseVolumeId(id) {
  const match = /^(\d+)-(.+)$/.exec(id)
  if (!match) throw new Error('Volume not found')
  return { seriesId: match[1], volume: match[2] }
}

// Regular volumes only: MangaDex also lists extras as "1.1", "2.1"… (Kaguya-sama: Love is War)
export const isMainVolume = (volume) => /^\d+$/.test(String(volume ?? ''))

const toVolume = (series, volume, cover) => ({
  id: volumeId(series.id, volume),
  seriesId: series.id,
  seriesTitle: series.title,
  volume,
  title: `${series.title}, Vol. ${volume}`,
  author: series.author,
  year: series.year,
  cover: cover ?? series.cover
})

// Series already loaded during this visit (going back to a series page, suggestions…)
const seriesCache = new Map()

export function getSeries(id) {
  if (!seriesCache.has(id)) {
    // Forget failed requests so "Retry" really retries
    seriesCache.set(id, loadSeries(id).catch((err) => {
      seriesCache.delete(id)
      throw err
    }))
  }
  return seriesCache.get(id)
}

async function loadSeries(id) {
  const series = await getSeriesInfo(id)

  // MangaDex is a bonus (real volume list + covers): if it fails, use AniList's volume count.
  let covers = {}
  try {
    covers = await getVolumeCovers(id, [series.romajiTitle, series.title])
  } catch (err) {
    console.warn('Could not load volumes from MangaDex', err)
  }

  const numbers = new Set(Object.keys(covers).filter(isMainVolume))
  for (let n = 1; n <= (series.volumeCount ?? 0); n++) numbers.add(String(n))
  // A finished series has a known number of volumes: MangaDex extras beyond it are not volumes
  if (series.status === 'FINISHED' && series.volumeCount) {
    for (const n of numbers) if (Number(n) > series.volumeCount) numbers.delete(n)
  }

  const volumes = [...numbers]
    .sort((a, b) => parseFloat(a) - parseFloat(b))
    .map((volume) => toVolume(series, volume, covers[volume]))

  return { ...series, volumes }
}

export async function getVolume(id) {
  const { seriesId, volume } = parseVolumeId(id)
  const series = await getSeries(seriesId)
  const found = series.volumes.find((v) => v.volume === volume)
  if (!found) throw new Error('Volume not found')
  return { ...found, series }
}

// Total number of regular volumes of each series, for the library progress bars.
// Finished series: AniList knows it (one request for all of them).
// Ongoing series: count the volumes MangaDex knows, one series at a time (rate limit).
// `onTotal(seriesId, total)` is called as soon as each total is known.
const volumeTotals = new Map()

export async function loadVolumeTotals(seriesIds, onTotal) {
  const missing = seriesIds.filter((id) => {
    if (!volumeTotals.has(id)) return true
    onTotal(id, volumeTotals.get(id))
    return false
  })
  if (!missing.length) return

  const found = (id, total) => {
    volumeTotals.set(id, total)
    onTotal(id, total)
  }
  let counts = new Map()
  try {
    counts = await getVolumeCounts(missing)
  } catch (err) {
    console.warn('Could not load volume counts from AniList', err)
  }
  const unknown = []
  for (const id of missing) {
    if (counts.get(id)?.finished && counts.get(id).volumes) found(id, counts.get(id).volumes)
    else unknown.push(id)
  }
  for (const id of unknown) {
    try {
      const series = await getSeries(id)
      if (series.volumes.length) found(id, series.volumes.length)
    } catch (err) {
      console.warn('Could not load the volumes of', id, err)
    }
  }
}

// Same order as the platform links of a series (see anilist.js)
const PREFERRED_CHAPTER_LANGUAGES = ['fr', 'en']
const hostOf = (url) => {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

// Where to read one volume: the series' platforms, each pointing to the volume's first chapter
// when MangaDex knows that chapter's official link on this platform, else to the series page.
// [{ site, icon, color, languages, url, chapter: '9' | null }]
export async function getVolumePlatforms(series, volume) {
  let first = { chapter: null, links: [] }
  try {
    first = await getVolumeFirstChapter(series.id, [series.romajiTitle, series.title], volume)
  } catch (err) {
    console.warn('Could not load the chapters of this volume from MangaDex', err)
  }
  const rank = (link) => {
    const i = PREFERRED_CHAPTER_LANGUAGES.indexOf(link.language)
    return i === -1 ? PREFERRED_CHAPTER_LANGUAGES.length : i
  }
  return series.platforms
    .map((platform) => {
      const chapterLink = first.links
        .filter((link) => hostOf(link.url) === hostOf(platform.url))
        .sort((a, b) => rank(a) - rank(b))[0]
      return chapterLink
        ? { ...platform, url: chapterLink.url, chapter: first.chapter }
        : { ...platform, chapter: null }
    })
    .sort((a, b) => Boolean(b.chapter) - Boolean(a.chapter)) // direct chapter links first
}

const shuffle = (list) => [...list].sort(() => Math.random() - 0.5)

// Series of the library, most recently added first (items saved before series existed have no seriesId)
const followedSeries = (library) =>
  [...new Set([...library].sort((a, b) => b.addedAt - a.addedAt).map((m) => m.seriesId))].filter(Boolean)

const byVolumeNumber = (a, b) => parseFloat(a.volume) - parseFloat(b.volume)

// "Continue reading": for each series you follow, the first volume you haven't read.
// If you own an unread volume, it's that one (no request needed). Otherwise it's the next volume
// you don't have yet, which needs the series' volume list.
export async function getContinueReading(library, count = 10) {
  const owned = new Set(library.map((m) => m.id))
  const results = []
  for (const seriesId of followedSeries(library).slice(0, count)) {
    const volumes = library.filter((m) => m.seriesId === seriesId).sort(byVolumeNumber)
    const unread = volumes.find((v) => !v.read)
    if (unread) {
      results.push(unread)
      continue
    }
    // One series at a time: MangaDex allows ~5 requests per second
    try {
      const series = await getSeries(seriesId)
      const next = series.volumes.find((v) => !owned.has(v.id))
      if (next) results.push(next)
    } catch (err) {
      console.warn('Could not load the next volume of', seriesId, err)
    }
  }
  return results
}

// "Suggested for you": Vol. 1 of popular series that are not in the library at all.
export async function getSuggestedSeries(library, count = 10) {
  const followed = new Set(followedSeries(library))
  const popular = await getPopularSeries()
  return shuffle(popular.filter((s) => !followed.has(s.id)))
    .slice(0, count)
    .map((series) => toVolume(series, '1'))
}

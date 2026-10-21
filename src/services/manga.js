// Combines both APIs: AniList for the series, MangaDex for its volumes and their covers.
import { getPopularSeries, getSeriesInfo } from './anilist'
import { getVolumeCovers } from './mangadex'

export { searchSeries } from './anilist'

// A volume id is "<AniList series id>-<volume number>", e.g. "30011-12"
export const volumeId = (seriesId, volume) => `${seriesId}-${volume}`

export function parseVolumeId(id) {
  const match = /^(\d+)-(.+)$/.exec(id)
  if (!match) throw new Error('Volume not found')
  return { seriesId: match[1], volume: match[2] }
}

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

  const numbers = new Set(Object.keys(covers))
  for (let n = 1; n <= (series.volumeCount ?? 0); n++) numbers.add(String(n))

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

const shuffle = (list) => [...list].sort(() => Math.random() - 0.5)

// Volumes that are not in the library yet:
// first the next volume of the series you follow (most recently added first),
// then Vol. 1 of popular series you don't have.
export async function getSuggestions(library, count = 4) {
  const owned = new Set(library.map((m) => m.id))
  const followed = [...new Set([...library].sort((a, b) => b.addedAt - a.addedAt).map((m) => m.seriesId))]
    .filter(Boolean) // items saved before the series pages existed have no seriesId

  const nextVolumes = await Promise.all(
    followed.slice(0, count).map((id) =>
      getSeries(id)
        .then((series) => series.volumes.find((v) => !owned.has(v.id)))
        .catch(() => null)
    )
  )
  const suggestions = nextVolumes.filter(Boolean)
  if (suggestions.length >= count) return suggestions

  const popular = await getPopularSeries()
  const newSeries = shuffle(popular.filter((s) => !followed.includes(s.id)))
    .map((series) => toVolume(series, '1'))
    .filter((v) => !owned.has(v.id))
  return [...suggestions, ...newSeries].slice(0, count)
}

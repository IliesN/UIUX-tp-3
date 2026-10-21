// Combines both APIs: AniList for the series, MangaDex for its volumes and their covers.
import { getSeriesInfo } from './anilist'
import { getVolumeCovers } from './mangadex'

export { searchSeries } from './anilist'

// A volume id is "<AniList series id>-<volume number>", e.g. "30011-12"
export const volumeId = (seriesId, volume) => `${seriesId}-${volume}`

export function parseVolumeId(id) {
  const match = /^(\d+)-(.+)$/.exec(id)
  if (!match) throw new Error('Volume not found')
  return { seriesId: match[1], volume: match[2] }
}

export async function getSeries(id) {
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
    .map((volume) => ({
      id: volumeId(series.id, volume),
      seriesId: series.id,
      seriesTitle: series.title,
      volume,
      title: `${series.title}, Vol. ${volume}`,
      author: series.author,
      year: series.year,
      cover: covers[volume] ?? series.cover
    }))

  return { ...series, volumes }
}

export async function getVolume(id) {
  const { seriesId, volume } = parseVolumeId(id)
  const series = await getSeries(seriesId)
  const found = series.volumes.find((v) => v.volume === volume)
  if (!found) throw new Error('Volume not found')
  return { ...found, series }
}

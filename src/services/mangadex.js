// MangaDex — free API that knows the volumes of a series and their covers. No API key required.
// Docs: https://api.mangadex.org/docs
import { requestJson } from './http'

const BASE_URL = 'https://api.mangadex.org'
const COVERS_URL = 'https://uploads.mangadex.org/covers'
const MAX_LIMIT = 100 // MangaDex refuses bigger pages

// Find the MangaDex entry linked to an AniList series (MangaDex stores the AniList id in `links.al`).
async function findMangaId(anilistId, titles) {
  for (const title of new Set(titles.filter(Boolean))) {
    const params = new URLSearchParams({ title, limit: 20 })
    const json = await requestJson(`${BASE_URL}/manga?${params}`)
    const match = json.data.find((m) => m.attributes.links?.al === String(anilistId))
    if (match) return match.id
  }
  return null
}

// { "1": "https://…/cover.256.jpg", "2": … } — one cover per volume number, Japanese edition first.
export async function getVolumeCovers(anilistId, titles) {
  const mangaId = await findMangaId(anilistId, titles)
  if (!mangaId) return {}

  const covers = []
  let total = Infinity
  while (covers.length < total) {
    const params = new URLSearchParams({ 'manga[]': mangaId, limit: MAX_LIMIT, offset: covers.length })
    const json = await requestJson(`${BASE_URL}/cover?${params}`)
    covers.push(...json.data)
    total = json.total
    if (!json.data.length) break
  }

  const byVolume = {}
  for (const { attributes } of covers) {
    const { volume, locale, fileName } = attributes
    if (!volume || (byVolume[volume] && locale !== 'ja')) continue
    byVolume[volume] = `${COVERS_URL}/${mangaId}/${fileName}.256.jpg`
  }
  return byVolume
}

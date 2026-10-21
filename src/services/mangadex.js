// MangaDex — free API that knows the volumes of a series and their covers. No API key required.
// Docs: https://api.mangadex.org/docs
import { requestJson } from './http'

const BASE_URL = 'https://api.mangadex.org'
const COVERS_URL = 'https://uploads.mangadex.org/covers'
const MAX_LIMIT = 100 // MangaDex refuses bigger pages

// Find the MangaDex entry linked to an AniList series (MangaDex stores the AniList id in `links.al`).
// Remembered during the visit: the covers and the chapter links both need it.
const mangaIds = new Map()
function findMangaId(anilistId, titles) {
  if (!mangaIds.has(anilistId)) {
    const search = searchMangaId(anilistId, titles).catch((err) => {
      mangaIds.delete(anilistId) // retry next time
      throw err
    })
    mangaIds.set(anilistId, search)
  }
  return mangaIds.get(anilistId)
}
async function searchMangaId(anilistId, titles) {
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

// First chapter of a volume, and the official links MangaDex knows for that chapter
// (mostly MANGA Plus, one per language): { chapter: '9', links: [{ url, language: 'en' }] }.
// chapter is null when MangaDex doesn't know which chapters the volume contains.
export async function getVolumeFirstChapter(anilistId, titles, volume) {
  const mangaId = await findMangaId(anilistId, titles)
  if (!mangaId) return { chapter: null, links: [] }

  const aggregate = await requestJson(`${BASE_URL}/manga/${mangaId}/aggregate`)
  const chapters = Object.keys(aggregate.volumes?.[volume]?.chapters ?? {})
  if (!chapters.length) return { chapter: null, links: [] }
  const chapter = chapters.sort((a, b) => parseFloat(a) - parseFloat(b))[0]

  const params = new URLSearchParams({ manga: mangaId, chapter, limit: MAX_LIMIT, includeExternalUrl: 1 })
  const json = await requestJson(`${BASE_URL}/chapter?${params}`)
  const links = json.data
    .filter((c) => c.attributes.externalUrl)
    .map((c) => ({ url: c.attributes.externalUrl, language: c.attributes.translatedLanguage }))
  return { chapter, links }
}

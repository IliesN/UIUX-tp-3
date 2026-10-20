// Jikan v4 — unofficial MyAnimeList API. No API key required.
// Docs: https://docs.api.jikan.moe/  (rate limit: ~3 req/s, 60 req/min)
const BASE_URL = 'https://api.jikan.moe/v4'

// Normalize a raw Jikan manga object into the shape the app uses everywhere.
export function normalizeManga(raw) {
  return {
    id: raw.mal_id,
    title: raw.title_english || raw.title,
    author: raw.authors?.map((a) => a.name).join(', ') || 'Unknown',
    year: raw.published?.prop?.from?.year ?? null,
    cover: raw.images?.webp?.image_url || raw.images?.jpg?.image_url || '',
    synopsis: raw.synopsis || '',
    chapters: raw.chapters,
    volumes: raw.volumes,
    publishingStatus: raw.status,
    score: raw.score,
    genres: raw.genres?.map((g) => g.name) ?? []
  }
}

async function request(path) {
  const res = await fetch(`${BASE_URL}${path}`)
  if (res.status === 429) throw new Error('Too many requests, wait a second and try again.')
  if (!res.ok) throw new Error(`Jikan API error (${res.status})`)
  return res.json()
}

export async function searchManga(query, page = 1) {
  const params = new URLSearchParams({ q: query, page, limit: 20, sfw: 'true' })
  const json = await request(`/manga?${params}`)
  return {
    results: json.data.map(normalizeManga),
    hasNextPage: json.pagination?.has_next_page ?? false
  }
}

export async function getMangaById(id) {
  const json = await request(`/manga/${id}/full`)
  return normalizeManga(json.data)
}

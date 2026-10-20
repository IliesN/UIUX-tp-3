// Open Library — free books API (manga are books). No API key required.
// Docs: https://openlibrary.org/developers/api
const BASE_URL = 'https://openlibrary.org'
const COVERS_URL = 'https://covers.openlibrary.org/b/id'
const PAGE_SIZE = 20
const TIMEOUT_MS = 10000

// Only ask for the fields we display, keeps responses small.
const SEARCH_FIELDS = [
  'key',
  'title',
  'author_name',
  'first_publish_year',
  'cover_i',
  'number_of_pages_median',
  'edition_count',
  'ratings_average'
].join(',')

// Normalize a raw Open Library search result into the shape the app uses everywhere.
export function normalizeManga(raw) {
  return {
    id: raw.key.replace('/works/', ''), // "/works/OL82563W" -> "OL82563W"
    title: raw.title,
    author: raw.author_name?.join(', ') || 'Unknown',
    year: raw.first_publish_year ?? null,
    cover: raw.cover_i ? `${COVERS_URL}/${raw.cover_i}-M.jpg` : '',
    pages: raw.number_of_pages_median ?? null,
    editions: raw.edition_count ?? null,
    communityRating: raw.ratings_average ? raw.ratings_average.toFixed(1) : null
  }
}

async function request(path) {
  // Abort if the API hangs, so the user gets an error instead of waiting forever.
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${BASE_URL}${path}`, { signal: controller.signal })
    if (res.status === 429) throw new Error('Too many requests, wait a second and try again.')
    if (!res.ok) throw new Error(`Open Library API error (${res.status})`)
    return await res.json()
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('The API took too long to answer. Try again.')
    throw err
  } finally {
    clearTimeout(timer)
  }
}

export async function searchManga(query, page = 1) {
  const params = new URLSearchParams({
    q: query,
    subject: 'manga', // keep results to manga only
    page,
    limit: PAGE_SIZE,
    fields: SEARCH_FIELDS
  })
  const json = await request(`/search.json?${params}`)
  return {
    results: json.docs.map(normalizeManga),
    hasNextPage: page * PAGE_SIZE < json.numFound
  }
}

export async function getMangaById(id) {
  // The search endpoint gives author names; the work endpoint gives description + subjects.
  const params = new URLSearchParams({ q: `key:/works/${id}`, fields: SEARCH_FIELDS })
  const [search, work] = await Promise.all([
    request(`/search.json?${params}`),
    request(`/works/${id}.json`)
  ])
  if (!search.docs.length) throw new Error('Manga not found')

  // `description` is either a string or { value: string }
  const description = typeof work.description === 'string' ? work.description : work.description?.value

  return {
    ...normalizeManga(search.docs[0]),
    synopsis: description || '',
    genres: (work.subjects ?? []).slice(0, 8)
  }
}

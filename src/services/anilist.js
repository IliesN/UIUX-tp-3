// AniList — free GraphQL API with one entry per series. No API key required.
// Docs: https://docs.anilist.co
import { requestJson } from './http'

const API_URL = 'https://graphql.anilist.co'
const PAGE_SIZE = 30

const SERIES_FIELDS = `
  id
  title { romaji english }
  coverImage { large }
  startDate { year }
  volumes
  status
  averageScore
  popularity
  genres
  description(asHtml: false)
  staff(perPage: 6, sort: [RELEVANCE]) { edges { role node { name { full } } } }
  relations { edges { relationType node { id format } } }
`

// Only manga series: Japanese comics (no manhwa/manhua), no novels, no one-shots, no adult titles.
const SEARCH_QUERY = `
  query ($search: String, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { hasNextPage }
      media(search: $search, type: MANGA, format: MANGA, countryOfOrigin: "JP", isAdult: false, sort: [SEARCH_MATCH]) {
        ${SERIES_FIELDS}
      }
    }
  }
`

const POPULAR_QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: MANGA, format: MANGA, countryOfOrigin: "JP", isAdult: false, sort: [POPULARITY_DESC]) {
        ${SERIES_FIELDS}
      }
    }
  }
`

// Titles only, for the search bar placeholder
const TITLES_QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: MANGA, format: MANGA, countryOfOrigin: "JP", isAdult: false, sort: [POPULARITY_DESC]) {
        title { romaji english }
      }
    }
  }
`

const SERIES_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: MANGA) {
      ${SERIES_FIELDS}
      externalLinks { site url type language icon color isDisabled }
    }
  }
`

async function graphql(query, variables) {
  const json = await requestJson(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query, variables })
  })
  if (json.errors?.length) throw new Error(json.errors[0].message)
  return json.data
}

// Authors are the "Story" / "Art" staff (not translators, editors…)
const authorsOf = (media) => {
  const names = media.staff.edges
    .filter((e) => /^(story|art|original)/i.test(e.role))
    .map((e) => e.node.name.full)
  return [...new Set(names)].join(', ') || 'Unknown'
}

// AniList descriptions contain a bit of HTML (<br>, <i>…)
const cleanDescription = (text) =>
  (text ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

// A spin-off or side story points to its main story with a PARENT relation.
// (The main story can itself have a PARENT one-shot, like One Piece and Romance Dawn: only a MANGA parent counts.)
// "Gaiden" literally means side story; some of them have no relation set.
const hasMangaParent = (media) =>
  media.relations.edges.some((e) => e.relationType === 'PARENT' && e.node.format === 'MANGA') ||
  /\bgaiden\b/i.test(media.title.romaji)

// Sequels (Boruto, Dragon Ball Super) are main series too, every other link is a derived work.
const CONTINUATIONS = ['SEQUEL', 'PREQUEL']
const linkType = (from, to) => from.relations.edges.find((e) => e.node.id === to.id)?.relationType

// X is derived from a more popular result Y (spin-off, alternative version, "Attack on Titan: Lost Girls"…)
// when they are linked by anything other than a sequel, or when X's title is "<Y's title>: …" / "<Y's title> 1000…".
// ("Berserk of Gluttony" is not derived from "Berserk")
function isDerivedFrom(x, y) {
  if (x === y || x.popularity >= y.popularity) return false
  const link = linkType(x, y) ?? linkType(y, x)
  if (link) return !CONTINUATIONS.includes(link)
  const [title, base] = [x.title.romaji.toLowerCase(), y.title.romaji.toLowerCase()]
  return title.startsWith(base) && /^\s*[:\-–—~!(\d]/.test(title.slice(base.length))
}

// Below this share of the most popular result, a title is noise ("Boku no One Piece" next to One Piece)
const MIN_POPULARITY_RATIO = 0.02

function isMainSeries(media, all) {
  const maxPopularity = Math.max(...all.map((m) => m.popularity))
  return (
    media.popularity >= maxPopularity * MIN_POPULARITY_RATIO &&
    !hasMangaParent(media) &&
    !all.some((other) => isDerivedFrom(media, other))
  )
}

const LANGUAGE_CODES = {
  English: 'EN',
  French: 'FR',
  Japanese: 'JP',
  Spanish: 'ES',
  German: 'DE',
  Italian: 'IT',
  Portuguese: 'PT',
  Korean: 'KR',
  Chinese: 'CN',
  Thai: 'TH',
  Indonesian: 'ID',
  Vietnamese: 'VN'
}
// Which link to open when a platform has one per language
const PREFERRED_LANGUAGES = ['French', 'English']

// Official platforms where the series can be read (AniList "STREAMING" links), one entry per site:
// { site, url, icon, color, languages: ['EN', 'FR'] }
function platformsOf(media) {
  const bySite = new Map()
  for (const link of media.externalLinks ?? []) {
    if (link.type !== 'STREAMING' || link.isDisabled) continue
    if (!bySite.has(link.site)) bySite.set(link.site, [])
    bySite.get(link.site).push(link)
  }
  return [...bySite.entries()].map(([site, links]) => {
    const rank = (l) => {
      const i = PREFERRED_LANGUAGES.indexOf(l.language)
      return i === -1 ? PREFERRED_LANGUAGES.length : i
    }
    const main = [...links].sort((a, b) => rank(a) - rank(b))[0]
    const languages = [...new Set(links.map((l) => LANGUAGE_CODES[l.language] ?? l.language).filter(Boolean))]
    return { site, url: main.url, icon: links.find((l) => l.icon)?.icon ?? '', color: main.color ?? null, languages }
  })
}

// Normalize an AniList media into the shape the app uses for a series.
export function normalizeSeries(media) {
  return {
    id: String(media.id),
    title: media.title.english || media.title.romaji,
    romajiTitle: media.title.romaji,
    author: authorsOf(media),
    year: media.startDate.year ?? null,
    cover: media.coverImage.large ?? '',
    volumeCount: media.volumes ?? null, // null while the series is still running
    status: media.status, // FINISHED, RELEASING, HIATUS…
    score: media.averageScore ? (media.averageScore / 10).toFixed(1) : null,
    genres: media.genres ?? [],
    synopsis: cleanDescription(media.description),
    platforms: platformsOf(media) // only filled on a series page (Media query)
  }
}

export async function searchSeries(query, page = 1) {
  const data = await graphql(SEARCH_QUERY, { search: query, page, perPage: PAGE_SIZE })
  const media = data.Page.media
  return {
    results: media.filter((m) => isMainSeries(m, media)).map(normalizeSeries),
    hasNextPage: data.Page.pageInfo.hasNextPage
  }
}

// The most popular main series, used for suggestions
// AniList pages hold 50 entries at most: several pages are loaded in parallel
export async function getPopularSeries(count = 100) {
  const PER_PAGE = 50
  const pages = await Promise.all(
    Array.from({ length: Math.ceil(count / PER_PAGE) }, (_, i) =>
      graphql(POPULAR_QUERY, { page: i + 1, perPage: PER_PAGE })
    )
  )
  return pages
    .flatMap((data) => data.Page.media)
    .filter((m) => !hasMangaParent(m))
    .map(normalizeSeries)
}

// A random title among the 500 most popular manga ("e.g. Vinland Saga" in the search bar)
export async function getRandomTitle() {
  const PER_PAGE = 50
  const page = 1 + Math.floor(Math.random() * 10)
  const data = await graphql(TITLES_QUERY, { page, perPage: PER_PAGE })
  const titles = data.Page.media.map((m) => m.title.english || m.title.romaji)
  return titles[Math.floor(Math.random() * titles.length)]
}

export async function getSeriesInfo(id) {
  const data = await graphql(SERIES_QUERY, { id: Number(id) })
  if (!data.Media) throw new Error('Series not found')
  return normalizeSeries(data.Media)
}

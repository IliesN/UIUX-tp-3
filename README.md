# 読 yomu

A Vue.js app to **search manga, build a personal library, and track what you've read and what's left to read**.

Built for the UI/UX + Vue.js project: Vue 3, Vue Router, Vuex, an external API and localStorage.

- **Persona & problem statement:** [docs/persona.md](docs/persona.md)
- **Wireframes:** [docs/wireframes/](docs/wireframes/)
- **Figma prototype:** [Mangashelf Prototype](https://www.figma.com/design/v24GmVeO3An48HHtHM6oHO/Mangashelf-Prototype)

## APIs used

Two free APIs, no API key required. Requests time out after 10 seconds with an error message instead of hanging.

**[AniList GraphQL API](https://docs.anilist.co)** — one entry per series, used for search and series info.

- `POST https://graphql.anilist.co` — `Page.media(search, type: MANGA, format: MANGA, countryOfOrigin: "JP", isAdult: false)`
  - `format: MANGA` + `countryOfOrigin: "JP"`: only Japanese manga (no novels, one-shots, manhwa, manhua, adult titles)
- `POST https://graphql.anilist.co` — `Media(id)` for a series page, with its `externalLinks` of type `STREAMING` (official digital platforms: MANGA Plus, VIZ, K MANGA…)
- `POST https://graphql.anilist.co` — `Page.media(sort: POPULARITY_DESC)` for home page suggestions, and a random title among the 500 most popular for the search bar placeholder

Only **main series** are kept in search results ([src/services/anilist.js](src/services/anilist.js)). A result is removed when:

- it has a `PARENT` relation to another manga (spin-offs, side stories), or its title contains "Gaiden" ("side story");
- it is derived from a more popular result: linked to it by any relation other than `SEQUEL` / `PREQUEL`, or titled like it followed by `:` / a number (e.g. "Attack on Titan: Lost Girls");
- its popularity is below 2% of the most popular result (homonyms like "Boku no One Piece" next to One Piece).

Sequels stay, as they are main series too (Boruto, Dragon Ball Super).

**[MangaDex API](https://api.mangadex.org/docs)** — the list of volumes of a series and their covers.

- `GET https://api.mangadex.org/manga?title={title}` — find the series (matched with its AniList id, `links.al`)
- `GET https://api.mangadex.org/cover?manga[]={id}&limit=100&offset={n}` — one cover per volume
- `GET https://uploads.mangadex.org/covers/{id}/{file}.256.jpg` — cover images (Japanese edition preferred)
- `GET https://api.mangadex.org/manga/{id}/aggregate` — chapters of each volume (to find the first chapter of a volume)
- `GET https://api.mangadex.org/chapter?manga={id}&chapter={n}&includeExternalUrl=1` — official links of that chapter (mostly MANGA Plus)
- If MangaDex has nothing, the volume list falls back to AniList's volume count, with the series cover
- Only regular volumes are kept: MangaDex extras numbered "1.1", "2.1"… (e.g. Kaguya-sama: Love is War) are ignored, and a finished series never has more volumes than AniList's count

A volume is identified by `<AniList series id>-<volume number>` (e.g. `30011-12` = Naruto, Vol. 12).

Data displayed: title, author(s), year, status, cover per volume, synopsis, genres, AniList score, volume count, digital platforms (icon, languages, link).

## Installation

Requirements: [Node.js](https://nodejs.org/) 18+

```bash
git clone https://github.com/IliesN/UIUX-tp-3.git
cd UIUX-tp-3
npm install
npm run dev
```

Then open http://localhost:5173.

Build for production:

```bash
npm run build
npm run preview
```

## Project structure

```
src/
├── main.js                  # App entry: registers router + store
├── App.vue                  # Layout: header, <RouterView>, toasts
├── assets/main.css          # Theme tokens + base styles (Yu Gothic font)
├── router/index.js          # Routes: /, /library, /favorites, /series/:id, /manga/:id
├── services/
│   ├── http.js              # fetch + timeout + error messages
│   ├── anilist.js           # Series search/info + main-series filter (AniList GraphQL)
│   ├── mangadex.js          # Volume list + covers (MangaDex)
│   └── manga.js             # Combines both: series + its volumes
├── store/
│   ├── index.js             # Vuex: state, getters, mutations, actions
│   └── persist.js           # localStorage load/save plugin
├── components/
│   ├── AppHeader.vue        # Logo (読 behind "yomu") + navigation
│   ├── SearchBar.vue
│   ├── MangaCard.vue        # Cover/title/author/year + action slot
│   ├── PlatformLinks.vue    # "Read it on" list of a volume (icon, languages, link)
│   ├── SeriesProgress.vue   # Read / owned / total volumes bar of a series
│   ├── VolumeCarousel.vue   # Sliding row of volumes (home page: Continue reading, Suggested for you)
│   ├── CoverImage.vue       # Cover <img> with placeholder fallback
│   ├── LibraryItemActions.vue  # Read, favorite, rating, delete
│   ├── LibraryStats.vue
│   ├── RatingStars.vue
│   ├── EmptyState.vue
│   └── ToastContainer.vue
└── views/
    ├── SearchView.vue       # / — search + suggestions
    ├── LibraryView.vue      # /library — by series or by volume; /library?series=<id> opens one series
    ├── FavoritesView.vue    # /favorites
    ├── SeriesView.vue       # /series/:id — all volumes of a series
    ├── MangaDetailView.vue  # /manga/:id — one volume
    └── NotFoundView.vue
```

## Features

### Core
- [x] Search manga series (AniList), one result per main series, volumes listed on the series page (MangaDex)
- [x] Add to library (one volume, or every volume of a series at once), view collection, delete item (one volume, or a whole series from My library)
- [x] Library displayed **by series** (one card per series, click to see its volumes) or **by volume** (Series / Volumes toggle, remembered on the browser)
- [x] Mark as read / to read, one volume at a time or for a whole series at once ("I've read up to Vol. N" on the series page)
- [x] Favorites (`favorite` property, `TOGGLE_FAVORITE` mutation, `favorites` getter, `/favorites` page)
- [x] Vuex store with state, getters, mutations, actions
- [x] Library saved to and loaded from localStorage

### Advanced (Part 6)
- [x] Filters & sorting (status, favorites, title/year/date/rating, search inside library; Vol. 2 sorts before Vol. 10; "Series" sort in the volume view groups volumes by series, in reading order)
- [x] Series page (`/series/:id`) and volume details page (`/manga/:id`) with route params
- [x] "Read it on": under the cover of a volume page, the official digital platforms with their icon and languages. The link opens the volume's first chapter when MangaDex knows its official URL on that platform (mostly MANGA Plus, French then English), otherwise the series page on the platform
- [x] Rating system (1–5 stars, persisted)
- [x] Personal notes (persisted)
- [x] Library statistics
- [x] Series progress bar measured against the **whole series**, not the library: "2/72 read · 3 owned", read volumes in green, owned ones lighter. Totals come from AniList for finished series (one request for all) and from MangaDex for running ones
- [x] Home page with two sliding rows (arrows or swipe):
  - **Continue reading**: the next volume to read in each of your series (an unread volume you own, or the next one you don't have yet)
  - **Suggested for you**: Vol. 1 of 10 popular series that are not in your library
- [x] Search bar placeholder "e.g. <title>" with a random manga title from the API
- [x] Better API experience (loading, error, no results, load more, no duplicates)
- [x] UI/UX: responsive, empty states, delete confirmation, toasts

## Team

- Valentin GONCALVES
- Ilies NASR

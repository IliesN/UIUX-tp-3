# 📚 MangaShelf

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
- `POST https://graphql.anilist.co` — `Media(id)` for a series page
- `POST https://graphql.anilist.co` — `Page.media(sort: POPULARITY_DESC)` for home page suggestions

Only **main series** are kept in search results ([src/services/anilist.js](src/services/anilist.js)). A result is removed when:

- it has a `PARENT` relation to another manga (spin-offs, side stories), or its title contains "Gaiden" ("side story");
- it is derived from a more popular result: linked to it by any relation other than `SEQUEL` / `PREQUEL`, or titled like it followed by `:` / a number (e.g. "Attack on Titan: Lost Girls");
- its popularity is below 2% of the most popular result (homonyms like "Boku no One Piece" next to One Piece).

Sequels stay, as they are main series too (Boruto, Dragon Ball Super).

**[MangaDex API](https://api.mangadex.org/docs)** — the list of volumes of a series and their covers.

- `GET https://api.mangadex.org/manga?title={title}` — find the series (matched with its AniList id, `links.al`)
- `GET https://api.mangadex.org/cover?manga[]={id}&limit=100&offset={n}` — one cover per volume
- `GET https://uploads.mangadex.org/covers/{id}/{file}.256.jpg` — cover images (Japanese edition preferred)
- If MangaDex has nothing, the volume list falls back to AniList's volume count, with the series cover

A volume is identified by `<AniList series id>-<volume number>` (e.g. `30011-12` = Naruto, Vol. 12).

Data displayed: title, author(s), year, status, cover per volume, synopsis, genres, AniList score, volume count.

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
├── assets/main.css          # Theme tokens (light/dark) + base styles
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
│   ├── AppHeader.vue        # Nav + dark/light toggle
│   ├── SearchBar.vue
│   ├── MangaCard.vue        # Cover/title/author/year + action slot
│   ├── SuggestedVolumes.vue # Home page: 4 volumes not in the library yet
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
- [x] Add to library (one volume, or every volume of a series at once), view collection, delete item
- [x] Library displayed **by series** (one card per series with a read progress bar, click to see its volumes) or **by volume** (Series / Volumes toggle, remembered on the browser)
- [x] Mark as read / to read, one volume at a time or for a whole series at once ("I've read up to Vol. N" on the series page)
- [x] Favorites (`favorite` property, `TOGGLE_FAVORITE` mutation, `favorites` getter, `/favorites` page)
- [x] Vuex store with state, getters, mutations, actions
- [x] Library saved to and loaded from localStorage

### Advanced (Part 6)
- [x] Filters & sorting (status, favorites, title/year/date/rating, search inside library; Vol. 2 sorts before Vol. 10; "Series" sort in the volume view groups volumes by series, in reading order)
- [x] Series page (`/series/:id`) and volume details page (`/manga/:id`) with route params
- [x] Rating system (1–5 stars, persisted)
- [x] Personal notes (persisted)
- [x] Library statistics
- [x] Home page suggestions: 4 volumes not in the library yet — the next volume of the series you follow first, then Vol. 1 of popular series
- [x] Better API experience (loading, error, no results, load more, no duplicates)
- [x] UI/UX: responsive, dark/light mode, empty states, delete confirmation, toasts

## Team

- Valentin GONCALVES
- Ilies NASR

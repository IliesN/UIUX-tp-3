# 📚 MangaShelf

A Vue.js app to **search manga, build a personal library, and track what you've read and what's left to read**.

Built for the UI/UX + Vue.js project: Vue 3, Vue Router, Vuex, an external API and localStorage.

- **Persona & problem statement:** [docs/persona.md](docs/persona.md)
- **Wireframes:** [docs/wireframes/](docs/wireframes/)
- **Figma prototype:** _TODO: add link_

## API used

**[Jikan API v4](https://docs.api.jikan.moe/)** — an unofficial, free REST API for MyAnimeList data.

- No API key required
- Endpoints used:
  - `GET https://api.jikan.moe/v4/manga?q={query}&page={n}` — search
  - `GET https://api.jikan.moe/v4/manga/{id}/full` — details
- Rate limit: ~3 requests/second, 60/minute

Data displayed: title, author(s), year, cover, synopsis, chapters, volumes, genres, score.

## Installation

Requirements: [Node.js](https://nodejs.org/) 18+

```bash
git clone <repo-url>
cd mangashelf
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
├── router/index.js          # Routes: /, /library, /favorites, /manga/:id
├── services/jikan.js        # API calls + data normalization
├── store/
│   ├── index.js             # Vuex: state, getters, mutations, actions
│   └── persist.js           # localStorage load/save plugin
├── components/
│   ├── AppHeader.vue        # Nav + dark/light toggle
│   ├── SearchBar.vue
│   ├── MangaCard.vue        # Cover/title/author/year + action slot
│   ├── LibraryItemActions.vue  # Read, favorite, rating, delete
│   ├── LibraryStats.vue
│   ├── RatingStars.vue
│   ├── EmptyState.vue
│   └── ToastContainer.vue
└── views/
    ├── SearchView.vue       # /
    ├── LibraryView.vue      # /library
    ├── FavoritesView.vue    # /favorites
    ├── MangaDetailView.vue  # /manga/:id
    └── NotFoundView.vue
```

## Features

### Core
- [x] Search manga via the Jikan API, results displayed dynamically
- [x] Add to library, view collection, delete item
- [x] Mark as read / to read
- [x] Favorites (`favorite` property, `TOGGLE_FAVORITE` mutation, `favorites` getter, `/favorites` page)
- [x] Vuex store with state, getters, mutations, actions
- [x] Library saved to and loaded from localStorage

### Advanced (Part 6)
- [x] Filters & sorting (status, favorites, title/year/date/rating, search inside library)
- [x] Item details page (`/manga/:id` with route params)
- [x] Rating system (1–5 stars, persisted)
- [x] Personal notes (persisted)
- [x] Library statistics
- [x] Better API experience (loading, error, no results, load more, no duplicates)
- [x] UI/UX: responsive, dark/light mode, empty states, delete confirmation, toasts

## Team

- _Names here_

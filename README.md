# 📚 MangaShelf

A Vue.js app to **search manga, build a personal library, and track what you've read and what's left to read**.

Built for the UI/UX + Vue.js project: Vue 3, Vue Router, Vuex, an external API and localStorage.

- **Persona & problem statement:** [docs/persona.md](docs/persona.md)
- **Wireframes:** [docs/wireframes/](docs/wireframes/)
- **Figma prototype:** [Mangashelf Prototype](https://www.figma.com/design/v24GmVeO3An48HHtHM6oHO/Mangashelf-Prototype)

## API used

**[Open Library API](https://openlibrary.org/developers/api)** — a free, open books API run by the Internet Archive (manga are searched as books with the `manga` subject).

- No API key required
- Endpoints used:
  - `GET https://openlibrary.org/search.json?q={query}&subject=manga&page={n}` — search
  - `GET https://openlibrary.org/works/{id}.json` — details (description, subjects)
  - `GET https://covers.openlibrary.org/b/id/{cover_id}-M.jpg` — covers
- Requests time out after 10 seconds with an error message instead of hanging

Data displayed: title, author(s), year, cover, description, subjects, page count, editions, community rating.

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
├── router/index.js          # Routes: /, /library, /favorites, /manga/:id
├── services/openLibrary.js  # API calls + data normalization
├── store/
│   ├── index.js             # Vuex: state, getters, mutations, actions
│   └── persist.js           # localStorage load/save plugin
├── components/
│   ├── AppHeader.vue        # Nav + dark/light toggle
│   ├── SearchBar.vue
│   ├── MangaCard.vue        # Cover/title/author/year + action slot
│   ├── CoverImage.vue       # Cover <img> with placeholder fallback
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
- [x] Search manga via the Open Library API, results displayed dynamically
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

- Valentin GONCALVES
- Ilies NASR

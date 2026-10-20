import { createStore } from 'vuex'
import { searchManga } from '@/services/openLibrary'
import { loadLibrary, persistPlugin } from './persist'

const findItem = (state, id) => state.library.find((m) => m.id === id)

export default createStore({
  state: () => ({
    // Personal collection (persisted in localStorage)
    library: loadLibrary(),

    // Search state (not persisted)
    search: {
      query: '',
      results: [],
      page: 1,
      hasNextPage: false,
      loading: false,
      error: null
    },

    toasts: []
  }),

  getters: {
    libraryItems: (state) => state.library,
    favorites: (state) => state.library.filter((m) => m.favorite),
    readItems: (state) => state.library.filter((m) => m.read),
    toReadItems: (state) => state.library.filter((m) => !m.read),
    isInLibrary: (state) => (id) => state.library.some((m) => m.id === id),
    getItemById: (state) => (id) => findItem(state, id),
    stats: (state, getters) => {
      const rated = state.library.filter((m) => m.rating > 0)
      return {
        total: state.library.length,
        read: getters.readItems.length,
        remaining: getters.toReadItems.length,
        favorites: getters.favorites.length,
        averageRating: rated.length
          ? (rated.reduce((sum, m) => sum + m.rating, 0) / rated.length).toFixed(1)
          : '–'
      }
    }
  },

  mutations: {
    // --- Library ---
    ADD_ITEM(state, manga) {
      state.library.push({
        ...manga,
        read: false,
        favorite: false,
        rating: 0,
        note: '',
        addedAt: Date.now()
      })
    },
    REMOVE_ITEM(state, id) {
      state.library = state.library.filter((m) => m.id !== id)
    },
    TOGGLE_READ(state, id) {
      const item = findItem(state, id)
      if (item) item.read = !item.read
    },
    TOGGLE_FAVORITE(state, id) {
      const item = findItem(state, id)
      if (item) item.favorite = !item.favorite
    },
    SET_RATING(state, { id, rating }) {
      const item = findItem(state, id)
      if (item) item.rating = rating
    },
    SET_NOTE(state, { id, note }) {
      const item = findItem(state, id)
      if (item) item.note = note
    },

    // --- Search ---
    SEARCH_START(state, { query, page }) {
      // Save the query right away, so "Retry" re-runs the search that was typed
      state.search.query = query
      state.search.loading = true
      state.search.error = null
      // A new search clears the previous results instead of showing them next to it
      if (page === 1) {
        state.search.results = []
        state.search.hasNextPage = false
      }
    },
    SEARCH_LOADING(state, loading) {
      state.search.loading = loading
    },
    SEARCH_ERROR(state, error) {
      state.search.error = error
    },
    SEARCH_RESULTS(state, { results, page, hasNextPage }) {
      state.search.page = page
      state.search.hasNextPage = hasNextPage
      state.search.results = page === 1 ? results : [...state.search.results, ...results]
    },

    // --- Toasts ---
    PUSH_TOAST(state, toast) {
      state.toasts.push(toast)
    },
    DISMISS_TOAST(state, id) {
      state.toasts = state.toasts.filter((t) => t.id !== id)
    }
  },

  actions: {
    async search({ commit, state }, { query, page = 1 }) {
      if (!query.trim()) return
      commit('SEARCH_START', { query, page })
      try {
        const { results, hasNextPage } = await searchManga(query, page)
        // Ignore the answer if the user started another search in the meantime
        if (state.search.query !== query) return
        commit('SEARCH_RESULTS', { results, page, hasNextPage })
      } catch (err) {
        if (state.search.query !== query) return
        commit('SEARCH_ERROR', err.message || 'Something went wrong')
      } finally {
        if (state.search.query === query) commit('SEARCH_LOADING', false)
      }
    },
    loadMore({ dispatch, state }) {
      return dispatch('search', { query: state.search.query, page: state.search.page + 1 })
    },

    addToLibrary({ commit, getters, dispatch }, manga) {
      if (getters.isInLibrary(manga.id)) {
        dispatch('notify', { message: `"${manga.title}" is already in your library`, type: 'info' })
        return
      }
      commit('ADD_ITEM', manga)
      dispatch('notify', { message: `Added "${manga.title}" to your library` })
    },
    removeFromLibrary({ commit, getters, dispatch }, id) {
      const item = getters.getItemById(id)
      commit('REMOVE_ITEM', id)
      if (item) dispatch('notify', { message: `Removed "${item.title}"`, type: 'warning' })
    },
    toggleRead({ commit }, id) {
      commit('TOGGLE_READ', id)
    },
    toggleFavorite({ commit }, id) {
      commit('TOGGLE_FAVORITE', id)
    },
    setRating({ commit }, payload) {
      commit('SET_RATING', payload)
    },
    setNote({ commit }, payload) {
      commit('SET_NOTE', payload)
    },

    notify({ commit }, { message, type = 'success', duration = 2500 }) {
      const id = Date.now() + Math.random()
      commit('PUSH_TOAST', { id, message, type })
      setTimeout(() => commit('DISMISS_TOAST', id), duration)
    }
  },

  plugins: [persistPlugin]
})

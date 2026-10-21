// localStorage persistence for the Vuex library (Exercise 4).
// Key kept from the app's former name (MangaShelf) so saved libraries are not lost
const STORAGE_KEY = 'mangashelf:library'

// Called once when the store is created.
export function loadLibrary() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// Vuex plugin: save the library after every mutation that touches it.
export function persistPlugin(store) {
  store.subscribe((mutation, state) => {
    if (mutation.type.startsWith('SEARCH_') || mutation.type.endsWith('_TOAST')) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.library))
    } catch (err) {
      console.warn('Could not save library to localStorage', err)
    }
  })
}

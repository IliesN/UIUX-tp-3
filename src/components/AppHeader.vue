<template>
  <header class="header">
    <div class="header-inner">
      <RouterLink to="/" class="logo">📚 MangaShelf</RouterLink>
      <nav class="nav">
        <RouterLink to="/">Search</RouterLink>
        <RouterLink to="/library">Library ({{ libraryCount }})</RouterLink>
        <RouterLink to="/favorites">Favorites</RouterLink>
      </nav>
      <button class="btn" :aria-label="`Switch to ${isDark ? 'light' : 'dark'} mode`" @click="toggleTheme">
        {{ isDark ? '☀️' : '🌙' }}
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed, ref, watchEffect } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const libraryCount = computed(() => store.getters.libraryItems.length)

// Dark/light mode — preference kept in localStorage
const THEME_KEY = 'mangashelf:theme'
const isDark = ref(
  localStorage.getItem(THEME_KEY)
    ? localStorage.getItem(THEME_KEY) === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches
)
watchEffect(() => {
  document.documentElement.dataset.theme = isDark.value ? 'dark' : 'light'
  localStorage.setItem(THEME_KEY, isDark.value ? 'dark' : 'light')
})
const toggleTheme = () => (isDark.value = !isDark.value)
</script>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}
.header-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.logo {
  font-weight: 700;
  text-decoration: none;
}
.nav {
  display: flex;
  gap: 16px;
  margin-left: auto;
}
.nav a {
  text-decoration: none;
  color: var(--muted);
}
.nav a.router-link-exact-active {
  color: var(--accent);
  font-weight: 600;
}
</style>

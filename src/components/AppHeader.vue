<template>
  <header class="header">
    <div class="header-inner">
      <RouterLink to="/" class="logo">📚 MangaShelf</RouterLink>
      <nav class="nav">
        <RouterLink to="/">Search</RouterLink>
        <RouterLink to="/library">Library ({{ libraryCount }})</RouterLink>
        <RouterLink to="/favorites">Favorites</RouterLink>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const libraryCount = computed(() => store.getters.libraryItems.length)
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

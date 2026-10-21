<template>
  <header class="header">
    <div class="header-inner">
      <RouterLink to="/" class="logo">
        <!-- 読 (yomu, "to read") drawn behind the name -->
        <span class="kanji" aria-hidden="true">読</span>
        <span class="name">yomu</span>
      </RouterLink>
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
  position: relative;
  isolation: isolate; /* keeps the kanji (z-index -1) above the header background */
  display: inline-grid;
  place-items: center;
  font-weight: 700;
  font-size: 1.25rem;
  text-decoration: none;
}
.kanji {
  position: absolute;
  z-index: -1;
  font-size: 2.4em;
  line-height: 1;
  color: #fff;
  -webkit-text-stroke: 0.35px #000; /* very thin black outline */
  opacity: 0.7;
  pointer-events: none;
}
.name {
  position: relative;
  font-size: 1.2em; /* the kanji keeps its size: it depends on .logo, not on .name */
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

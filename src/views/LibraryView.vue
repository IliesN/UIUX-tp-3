<template>
  <section>
    <h1 class="page-title">My library</h1>

    <EmptyState
      v-if="!library.length"
      icon="📚"
      title="Your library is empty"
      message="Search for a manga and add it to start tracking your reading."
    >
      <RouterLink to="/" class="btn btn-primary">Search manga</RouterLink>
    </EmptyState>

    <template v-else>
      <LibraryStats />

      <!-- Filters & sorting (advanced feature) -->
      <div class="toolbar">
        <input v-model="filterText" class="input" type="search" placeholder="Search in my library…" />
        <select v-model="statusFilter" class="input" aria-label="Filter by status">
          <option value="all">All</option>
          <option value="toread">To read</option>
          <option value="read">Read</option>
          <option value="favorites">Favorites</option>
        </select>
        <select v-model="sortBy" class="input" aria-label="Sort by">
          <option value="addedAt">Date added</option>
          <option value="title">Title</option>
          <option value="year">Year</option>
          <option value="rating">Rating</option>
        </select>
      </div>

      <p v-if="!visibleItems.length" class="muted">No manga match these filters.</p>

      <div class="grid">
        <MangaCard v-for="item in visibleItems" :key="item.id" :manga="item">
          <LibraryItemActions :item="item" />
        </MangaCard>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import MangaCard from '@/components/MangaCard.vue'
import LibraryItemActions from '@/components/LibraryItemActions.vue'
import LibraryStats from '@/components/LibraryStats.vue'
import EmptyState from '@/components/EmptyState.vue'

const store = useStore()
const library = computed(() => store.getters.libraryItems)

const filterText = ref('')
const statusFilter = ref('all')
const sortBy = ref('addedAt')

const sorters = {
  addedAt: (a, b) => b.addedAt - a.addedAt,
  title: (a, b) => a.title.localeCompare(b.title),
  year: (a, b) => (b.year ?? 0) - (a.year ?? 0),
  rating: (a, b) => b.rating - a.rating
}

const visibleItems = computed(() => {
  const text = filterText.value.toLowerCase()
  return library.value
    .filter((m) => m.title.toLowerCase().includes(text))
    .filter((m) => {
      if (statusFilter.value === 'read') return m.read
      if (statusFilter.value === 'toread') return !m.read
      if (statusFilter.value === 'favorites') return m.favorite
      return true
    })
    .slice()
    .sort(sorters[sortBy.value])
})
</script>

<style scoped>
.toolbar {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 8px;
  margin-bottom: 16px;
}
@media (max-width: 600px) {
  .toolbar {
    grid-template-columns: 1fr 1fr;
  }
  .toolbar input {
    grid-column: 1 / -1;
  }
}
</style>

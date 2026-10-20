<template>
  <section>
    <h1 class="page-title">Find your next manga</h1>
    <SearchBar :model-value="search.query" @search="onSearch" />

    <p v-if="search.error" class="error" role="alert">
      ⚠️ {{ search.error }}
      <button class="btn" @click="onSearch(search.query)">Retry</button>
    </p>

    <p v-if="search.loading && !search.results.length" class="muted" aria-live="polite">Searching…</p>

    <EmptyState
      v-else-if="search.query && !search.loading && !search.error && !search.results.length"
      icon="🔍"
      title="No results found"
      :message="`Nothing matched “${search.query}”. Try another title.`"
    />

    <div v-if="search.results.length" class="grid">
      <MangaCard v-for="manga in search.results" :key="manga.id" :manga="manga">
        <button
          class="btn btn-primary"
          :disabled="isInLibrary(manga.id)"
          @click="store.dispatch('addToLibrary', manga)"
        >
          {{ isInLibrary(manga.id) ? '✓ In library' : '+ Add' }}
        </button>
      </MangaCard>
    </div>

    <div v-if="search.hasNextPage" class="load-more">
      <button class="btn" :disabled="search.loading" @click="store.dispatch('loadMore')">
        {{ search.loading ? 'Loading…' : 'Load more' }}
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import SearchBar from '@/components/SearchBar.vue'
import MangaCard from '@/components/MangaCard.vue'
import EmptyState from '@/components/EmptyState.vue'

const store = useStore()
const search = computed(() => store.state.search)
const isInLibrary = (id) => store.getters.isInLibrary(id)

const onSearch = (query) => store.dispatch('search', { query, page: 1 })
</script>

<style scoped>
.error {
  color: var(--accent);
  display: flex;
  align-items: center;
  gap: 12px;
}
.load-more {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>

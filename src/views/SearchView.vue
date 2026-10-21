<template>
  <section>
    <h1 class="page-title">Find your next manga</h1>
    <SearchBar :model-value="search.query" :placeholder="placeholder" @search="onSearch" />

    <!-- Home page (no search yet) -->
    <template v-if="!search.query">
      <VolumeCarousel
        title="Continue reading"
        hint="The next volume to read in each of your series."
        :fetch-volumes="getContinueReading"
      />
      <VolumeCarousel
        title="Suggested for you"
        hint="Popular series that are not in your library yet."
        :fetch-volumes="getSuggestedSeries"
      />
    </template>

    <p v-if="search.error" class="error" role="alert">
      ⚠️ {{ search.error }}
      <button class="btn" @click="retry">Retry</button>
    </p>

    <p v-if="search.loading && !search.results.length" class="muted" aria-live="polite">Searching…</p>

    <EmptyState
      v-else-if="search.query && !search.loading && !search.error && !search.results.length"
      icon="🔍"
      title="No results found"
      :message="`Nothing matched “${search.query}”. Try another title.`"
    />

    <div v-if="search.results.length" class="grid">
      <!-- One card per series, its volumes are on the series page -->
      <MangaCard v-for="series in search.results" :key="series.id" :manga="series" :to="seriesRoute(series)">
        <RouterLink class="btn btn-primary" :to="seriesRoute(series)">
          {{ series.volumeCount ? `${series.volumeCount} volumes` : 'See volumes' }} →
        </RouterLink>
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
import { computed, onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import SearchBar from '@/components/SearchBar.vue'
import MangaCard from '@/components/MangaCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import VolumeCarousel from '@/components/VolumeCarousel.vue'
import { getContinueReading, getRandomTitle, getSuggestedSeries } from '@/services/manga'

const store = useStore()

// "e.g. <random manga title>", picked from the API on each visit
const placeholder = ref('e.g. …')
onMounted(async () => {
  try {
    placeholder.value = `e.g. ${await getRandomTitle()}`
  } catch {
    placeholder.value = 'e.g. One Piece' // API unreachable: a safe example
  }
})
const search = computed(() => store.state.search)
const seriesRoute = (series) => ({ name: 'series', params: { id: series.id } })

const onSearch = (query) => store.dispatch('search', { query, page: 1 })

// If "Load more" failed, results are still there: retry the next page, not the whole search
const retry = () => (search.value.results.length ? store.dispatch('loadMore') : onSearch(search.value.query))
</script>

<style scoped>
.error {
  color: var(--accent);
  display: flex;
  align-items: center;
  gap: 12px;
}
.grid .btn {
  text-decoration: none;
}
.load-more {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>

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
        <select v-if="!openSeries" v-model="sortBy" class="input" aria-label="Sort by">
          <option value="addedAt">Date added</option>
          <option value="title">Title</option>
          <option v-if="viewMode === 'volumes'" value="series">Series</option>
          <option value="year">Year</option>
          <option value="rating">Rating</option>
        </select>
        <div v-if="!openSeries" class="view-toggle" role="group" aria-label="Display">
          <button
            v-for="mode in VIEW_MODES"
            :key="mode.value"
            class="btn"
            :class="{ 'btn-primary': viewMode === mode.value }"
            :aria-pressed="viewMode === mode.value"
            @click="setViewMode(mode.value)"
          >
            {{ mode.label }}
          </button>
        </div>
      </div>

      <!-- Inside one series: its volumes in the library -->
      <template v-if="openSeries">
        <div class="series-bar">
          <RouterLink class="btn" :to="{ name: 'library' }">← All series</RouterLink>
          <div class="series-name">
            <h2>{{ openSeries.title }}</h2>
            <p class="muted">{{ openSeries.readCount }}/{{ openSeries.volumes.length }} read</p>
          </div>
          <RouterLink v-if="openSeries.seriesId" class="btn" :to="{ name: 'series', params: { id: openSeries.seriesId } }">
            All volumes of the series →
          </RouterLink>
        </div>

        <p v-if="!openSeriesVolumes.length" class="muted">No volume match these filters.</p>
        <div class="grid">
          <MangaCard v-for="item in openSeriesVolumes" :key="item.id" :manga="item">
            <LibraryItemActions :item="item" />
          </MangaCard>
        </div>
      </template>

      <!-- One card per series -->
      <template v-else-if="viewMode === 'series'">
        <p v-if="!visibleSeries.length" class="muted">No series match these filters.</p>
        <div class="grid">
          <MangaCard v-for="series in visibleSeries" :key="series.id" :manga="series" :to="seriesRoute(series)">
            <div class="progress">
              <span class="muted">
                {{ series.readCount }}/{{ series.volumes.length }} read
                <template v-if="series.favorite"> · ❤️</template>
              </span>
              <span class="bar" aria-hidden="true">
                <span :style="{ width: `${(series.readCount / series.volumes.length) * 100}%` }" />
              </span>
            </div>
            <RouterLink class="btn btn-primary" :to="seriesRoute(series)">
              {{ series.volumes.length }} volume{{ series.volumes.length > 1 ? 's' : '' }} →
            </RouterLink>
          </MangaCard>
        </div>
      </template>

      <!-- One card per volume -->
      <template v-else>
        <p v-if="!visibleItems.length" class="muted">No manga match these filters.</p>
        <div class="grid">
          <MangaCard v-for="item in visibleItems" :key="item.id" :manga="item">
            <LibraryItemActions :item="item" />
          </MangaCard>
        </div>
      </template>
    </template>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import MangaCard from '@/components/MangaCard.vue'
import LibraryItemActions from '@/components/LibraryItemActions.vue'
import LibraryStats from '@/components/LibraryStats.vue'
import EmptyState from '@/components/EmptyState.vue'

const VIEW_MODES = [
  { value: 'series', label: 'Series' },
  { value: 'volumes', label: 'Volumes' }
]
const VIEW_MODE_KEY = 'mangashelf:libraryView'

const store = useStore()
const route = useRoute()
const library = computed(() => store.getters.libraryItems)

const filterText = ref('')
const statusFilter = ref('all')
const sortBy = ref('addedAt')

// The chosen display is remembered on this browser (storage can be unavailable: default to series)
const readViewMode = () => {
  try {
    return localStorage.getItem(VIEW_MODE_KEY) === 'volumes' ? 'volumes' : 'series'
  } catch {
    return 'series'
  }
}
const viewMode = ref(readViewMode())
const setViewMode = (mode) => {
  viewMode.value = mode
  if (mode === 'series' && sortBy.value === 'series') sortBy.value = 'title'
  try {
    localStorage.setItem(VIEW_MODE_KEY, mode)
  } catch {
    // not saved, the display still changes
  }
}

const byVolume = (a, b) => parseFloat(a.volume) - parseFloat(b.volume)
const sorters = {
  addedAt: (a, b) => b.addedAt - a.addedAt,
  title: (a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }), // Vol. 2 before Vol. 10
  // Volumes grouped by series, in reading order inside each series
  series: (a, b) => (a.seriesTitle ?? a.title).localeCompare(b.seriesTitle ?? b.title) || byVolume(a, b),
  year: (a, b) => (b.year ?? 0) - (a.year ?? 0),
  rating: (a, b) => b.rating - a.rating
}

const matchesFilters = (m) => {
  if (!m.title.toLowerCase().includes(filterText.value.toLowerCase())) return false
  if (statusFilter.value === 'read') return m.read
  if (statusFilter.value === 'toread') return !m.read
  if (statusFilter.value === 'favorites') return m.favorite
  return true
}

const visibleItems = computed(() => library.value.filter(matchesFilters).sort(sorters[sortBy.value]))

// Library volumes grouped by series. Items saved before series existed (no seriesId) are their own group.
const allSeries = computed(() => {
  const groups = new Map()
  for (const item of library.value) {
    const key = item.seriesId ?? item.id
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(item)
  }
  return [...groups.entries()].map(([id, volumes]) => {
    volumes.sort(byVolume)
    const rated = volumes.filter((v) => v.rating > 0)
    return {
      id,
      seriesId: volumes[0].seriesId ?? null,
      title: volumes[0].seriesTitle ?? volumes[0].title,
      author: volumes[0].author,
      year: volumes[0].year,
      cover: volumes[0].cover,
      volumes,
      readCount: volumes.filter((v) => v.read).length,
      favorite: volumes.some((v) => v.favorite),
      addedAt: Math.max(...volumes.map((v) => v.addedAt)),
      rating: rated.length ? rated.reduce((sum, v) => sum + v.rating, 0) / rated.length : 0
    }
  })
})

// A series is shown when at least one of its volumes matches the filters
const visibleSeries = computed(() =>
  allSeries.value.filter((s) => s.volumes.some(matchesFilters)).sort(sorters[sortBy.value])
)

const seriesRoute = (series) =>
  series.seriesId ? { name: 'library', query: { series: series.id } } : { name: 'manga-detail', params: { id: series.id } }

// /library?series=<id> opens one series
const openSeries = computed(() => allSeries.value.find((s) => s.id === route.query.series) ?? null)
const openSeriesVolumes = computed(() => openSeries.value?.volumes.filter(matchesFilters) ?? [])
</script>

<style scoped>
.toolbar {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: 8px;
  margin-bottom: 16px;
}
@media (max-width: 600px) {
  .toolbar {
    grid-template-columns: 1fr 1fr;
  }
  .toolbar input,
  .view-toggle {
    grid-column: 1 / -1;
  }
}
.view-toggle {
  display: flex;
}
.view-toggle .btn {
  flex: 1;
  justify-content: center;
}
.view-toggle .btn:first-child {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
.view-toggle .btn:last-child {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
.series-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.series-name {
  flex: 1;
}
.series-name h2,
.series-name p {
  margin: 0;
}
.progress {
  width: 100%;
  font-size: 0.8rem;
}
.bar {
  display: block;
  height: 6px;
  border-radius: 999px;
  background: var(--border);
  overflow: hidden;
  margin-top: 4px;
}
.bar span {
  display: block;
  height: 100%;
  background: var(--success);
}
.grid .btn,
.series-bar .btn {
  text-decoration: none;
}
</style>

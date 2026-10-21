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
            <SeriesProgress
              class="series-progress"
              :read="openSeries.readCount"
              :owned="openSeries.ownedCount"
              :total="openSeries.total"
            />
          </div>
          <RouterLink v-if="openSeries.seriesId" class="btn" :to="{ name: 'series', params: { id: openSeries.seriesId } }">
            All volumes of the series →
          </RouterLink>
          <button class="btn" @click="removeSeries(openSeries)">Remove series</button>
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
            <SeriesProgress :read="series.readCount" :owned="series.ownedCount" :total="series.total" />
            <span v-if="series.favorite" class="favorite" aria-label="Has favorite volumes">❤️</span>
            <RouterLink class="btn btn-primary" :to="seriesRoute(series)">
              My volumes →
            </RouterLink>
            <button class="btn" :aria-label="`Remove ${series.title} from library`" @click="removeSeries(series)">
              Remove
            </button>
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
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import MangaCard from '@/components/MangaCard.vue'
import LibraryItemActions from '@/components/LibraryItemActions.vue'
import LibraryStats from '@/components/LibraryStats.vue'
import EmptyState from '@/components/EmptyState.vue'
import SeriesProgress from '@/components/SeriesProgress.vue'
import { isMainVolume, loadVolumeTotals } from '@/services/manga'

const VIEW_MODES = [
  { value: 'series', label: 'Series' },
  { value: 'volumes', label: 'Volumes' }
]
const VIEW_MODE_KEY = 'mangashelf:libraryView'

const store = useStore()
const route = useRoute()
const router = useRouter()
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

// Total number of volumes of each series (from the APIs, filled in as they arrive)
const totals = ref({})
watch(
  () => [...new Set(library.value.map((m) => m.seriesId).filter(Boolean))].join(),
  (ids) => {
    if (!ids) return
    loadVolumeTotals(ids.split(','), (id, total) => (totals.value = { ...totals.value, [id]: total }))
  },
  { immediate: true }
)

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
    // Progress counts regular volumes only (not extras like "1.1"), see isMainVolume
    const main = volumes.filter((v) => !v.seriesId || isMainVolume(v.volume))
    const seriesId = volumes[0].seriesId ?? null
    const total = seriesId ? totals.value[seriesId] : main.length
    return {
      id,
      seriesId,
      title: volumes[0].seriesTitle ?? volumes[0].title,
      author: volumes[0].author,
      year: volumes[0].year,
      cover: volumes[0].cover,
      volumes,
      readCount: main.filter((v) => v.read).length,
      ownedCount: main.length,
      // Never less than what you own (the API can be behind on a running series)
      total: total ? Math.max(total, main.length) : null,
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
// TODO: replace window.confirm with a custom ConfirmDialog component (same as LibraryItemActions)
function removeSeries(series) {
  const count = series.volumes.length
  if (!window.confirm(`Remove "${series.title}" (${count} volume${count > 1 ? 's' : ''}) from your library?`)) return
  // Items saved before series existed have no seriesId: they are a single volume
  if (series.seriesId) store.dispatch('removeSeriesFromLibrary', series)
  else store.dispatch('removeFromLibrary', series.id)
  if (route.query.series) router.replace({ name: 'library' })
}

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
.series-progress {
  max-width: 260px;
}
.favorite {
  font-size: 0.8rem;
}
.grid .btn,
.series-bar .btn {
  text-decoration: none;
}
</style>

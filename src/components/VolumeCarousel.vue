<template>
  <!-- Hidden when there is nothing to show (e.g. "Continue reading" with an empty library) -->
  <section v-if="loading || error || volumes.length" class="carousel" :aria-labelledby="titleId">
    <div class="head">
      <h2 :id="titleId">{{ title }}</h2>
      <div v-if="volumes.length" class="arrows">
        <button class="btn" :aria-label="`Previous: ${title}`" :disabled="atStart" @click="slide(-1)">‹</button>
        <button class="btn" :aria-label="`Next: ${title}`" :disabled="atEnd" @click="slide(1)">›</button>
      </div>
    </div>
    <p v-if="hint" class="muted hint">{{ hint }}</p>

    <p v-if="loading" class="muted" aria-live="polite">Loading…</p>
    <p v-else-if="error" class="muted" role="alert">
      ⚠️ {{ error }}
      <button class="btn" @click="load">Retry</button>
    </p>

    <!-- One row that slides sideways (arrows, swipe or trackpad) -->
    <div v-else ref="track" class="track" @scroll="updateArrows">
      <MangaCard v-for="volume in volumes" :key="volume.id" :manga="volume">
        <button v-if="!isInLibrary(volume.id)" class="btn btn-primary" @click="store.dispatch('addToLibrary', volume)">
          + Add
        </button>
        <button
          v-else
          class="btn btn-primary"
          :disabled="isRead(volume.id)"
          @click="store.dispatch('toggleRead', volume.id)"
        >
          {{ isRead(volume.id) ? '✅ Read' : 'Mark as read' }}
        </button>
        <RouterLink class="btn" :to="{ name: 'series', params: { id: volume.seriesId } }">Series</RouterLink>
      </MangaCard>
    </div>
  </section>
</template>

<script setup>
// A titled row of volume cards that slides sideways. `fetchVolumes(library)` gives the volumes to show.
import { nextTick, onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import MangaCard from './MangaCard.vue'

const props = defineProps({
  title: { type: String, required: true },
  hint: { type: String, default: '' },
  fetchVolumes: { type: Function, required: true }
})

const titleId = `carousel-${props.title.toLowerCase().replace(/\W+/g, '-')}`
const store = useStore()
const volumes = ref([])
const loading = ref(false)
const error = ref(null)
const isInLibrary = (id) => store.getters.isInLibrary(id)
const isRead = (id) => store.getters.getItemById(id)?.read ?? false

// Slider: arrows move by about one screen of cards, and are disabled at each end
const track = ref(null)
const atStart = ref(true)
const atEnd = ref(false)
function updateArrows() {
  const el = track.value
  if (!el) return
  atStart.value = el.scrollLeft <= 1
  atEnd.value = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1
}
const slide = (direction) => track.value?.scrollBy({ left: direction * track.value.clientWidth * 0.8, behavior: 'smooth' })

// Computed once per visit: adding or reading a volume updates its button instead of replacing the card
async function load() {
  loading.value = true
  error.value = null
  try {
    volumes.value = await props.fetchVolumes(store.getters.libraryItems)
    loading.value = false
    await nextTick() // the track exists only once loading is over
    updateArrows()
  } catch (err) {
    error.value = err.message || 'Could not load these volumes'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.carousel {
  margin-top: 32px;
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.head h2 {
  font-size: 1.2rem;
  margin: 0 0 4px;
}
.arrows {
  display: flex;
  gap: 6px;
}
.arrows .btn {
  padding: 4px 12px;
  font-size: 1.2rem;
  line-height: 1;
}
.hint {
  margin: 0 0 12px;
  font-size: 0.9rem;
}
.track {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  padding-bottom: 8px; /* room for the scrollbar under the shadows */
}
.track > * {
  flex: 0 0 160px;
  scroll-snap-align: start;
}
.track .btn {
  text-decoration: none;
}
</style>

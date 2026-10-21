<template>
  <section class="suggestions" aria-labelledby="suggestions-title">
    <h2 id="suggestions-title">Suggested for you</h2>
    <p class="muted hint">Volumes you don't have yet: the next ones in your series, then popular manga.</p>

    <p v-if="loading" class="muted" aria-live="polite">Finding volumes for you…</p>
    <p v-else-if="error" class="muted" role="alert">
      ⚠️ {{ error }}
      <button class="btn" @click="load">Retry</button>
    </p>

    <div v-else class="grid">
      <MangaCard v-for="volume in volumes" :key="volume.id" :manga="volume">
        <button
          class="btn btn-primary"
          :disabled="isInLibrary(volume.id)"
          @click="store.dispatch('addToLibrary', volume)"
        >
          {{ isInLibrary(volume.id) ? '✓ In library' : '+ Add' }}
        </button>
        <RouterLink class="btn" :to="{ name: 'series', params: { id: volume.seriesId } }">Series</RouterLink>
      </MangaCard>
    </div>
  </section>
</template>

<script setup>
// 4 volumes that are not in the library yet: next volumes of followed series, then popular series.
import { onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import { getSuggestions } from '@/services/manga'
import MangaCard from './MangaCard.vue'

const store = useStore()
const volumes = ref([])
const loading = ref(false)
const error = ref(null)
const isInLibrary = (id) => store.getters.isInLibrary(id)

// Computed once per visit: adding a suggestion shows "✓ In library" instead of replacing the card
async function load() {
  loading.value = true
  error.value = null
  try {
    volumes.value = await getSuggestions(store.getters.libraryItems)
  } catch (err) {
    error.value = err.message || 'Could not load suggestions'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.suggestions {
  margin-top: 32px;
}
.suggestions h2 {
  font-size: 1.2rem;
  margin: 0 0 4px;
}
.hint {
  margin: 0 0 12px;
  font-size: 0.9rem;
}
.grid .btn {
  text-decoration: none;
}
</style>

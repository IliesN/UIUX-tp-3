<template>
  <section>
    <button class="btn back" @click="router.back()">← Back</button>

    <p v-if="loading" class="muted" aria-live="polite">Loading volumes…</p>
    <p v-else-if="error" class="error" role="alert">
      ⚠️ {{ error }}
      <button class="btn" @click="load">Retry</button>
    </p>

    <template v-else-if="series">
      <header class="series-header">
        <CoverImage :src="series.cover" :alt="`Cover of ${series.title}`" class="cover" />
        <div class="info">
          <h1 class="page-title">{{ series.title }}</h1>
          <p class="muted">
            {{ series.author }} · {{ series.year ?? '—' }} · {{ STATUS_LABELS[series.status] ?? series.status }}
            <template v-if="series.score"> · ★ {{ series.score }}/10</template>
          </p>
          <p v-if="series.genres.length" class="genres">
            <span v-for="g in series.genres" :key="g" class="tag">{{ g }}</span>
          </p>
          <p v-if="series.synopsis" class="synopsis">{{ series.synopsis }}</p>
          <div v-if="series.volumes.length" class="add-all">
            <button
              class="btn btn-primary"
              :disabled="ownedCount === series.volumes.length"
              @click="store.dispatch('addSeriesToLibrary', series)"
            >
              {{ ownedCount === series.volumes.length ? '✓ All in library' : '+ Add all volumes' }}
            </button>
            <span class="muted">
              {{ series.volumes.length }} volume{{ series.volumes.length > 1 ? 's' : '' }} ·
              {{ ownedCount }} in your library
            </span>
          </div>
          <!-- Set reading progress in one go instead of marking each volume as read -->
          <label v-if="series.volumes.length" class="progress">
            <span>I've read up to</span>
            <select class="input" :value="readUpTo" @change="setReadUpTo($event.target.value)">
              <option value="">Not started</option>
              <option v-for="v in series.volumes" :key="v.id" :value="v.volume">Vol. {{ v.volume }}</option>
            </select>
          </label>
        </div>
      </header>

      <EmptyState
        v-if="!series.volumes.length"
        icon="📚"
        title="No volume list yet"
        message="This series has no volume information available for now."
      />

      <div v-else class="grid">
        <MangaCard v-for="volume in series.volumes" :key="volume.id" :manga="volume">
          <button
            class="btn btn-primary"
            :disabled="isInLibrary(volume.id)"
            @click="store.dispatch('addToLibrary', volume)"
          >
            {{ isRead(volume.id) ? '✅ Read' : isInLibrary(volume.id) ? '✓ In library' : '+ Add' }}
          </button>
        </MangaCard>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { getSeries } from '@/services/manga'
import MangaCard from '@/components/MangaCard.vue'
import CoverImage from '@/components/CoverImage.vue'
import EmptyState from '@/components/EmptyState.vue'

const STATUS_LABELS = {
  FINISHED: 'Finished',
  RELEASING: 'Ongoing',
  HIATUS: 'On hiatus',
  NOT_YET_RELEASED: 'Not yet released',
  CANCELLED: 'Cancelled'
}

// `id` comes from the route param /series/:id (AniList id, see router props)
const props = defineProps({
  id: { type: String, required: true }
})

const router = useRouter()
const store = useStore()

const series = ref(null)
const loading = ref(false)
const error = ref(null)
const isInLibrary = (id) => store.getters.isInLibrary(id)
const isRead = (id) => store.getters.getItemById(id)?.read ?? false
// Current progress: the last volume of the unbroken run of read volumes from Vol. 1
const readUpTo = computed(() => {
  const volumes = series.value?.volumes ?? []
  const firstUnread = volumes.findIndex((v) => !isRead(v.id))
  const last = firstUnread === -1 ? volumes.at(-1) : volumes[firstUnread - 1]
  return last?.volume ?? ''
})
const setReadUpTo = (upTo) => store.dispatch('markReadUpTo', { ...series.value, upTo })
const ownedCount = computed(() => series.value?.volumes.filter((v) => isInLibrary(v.id)).length ?? 0)

async function load() {
  loading.value = true
  error.value = null
  try {
    series.value = await getSeries(props.id)
  } catch (err) {
    series.value = null
    error.value = err.message || 'Something went wrong'
  } finally {
    loading.value = false
  }
}

watch(() => props.id, load, { immediate: true })
</script>

<style scoped>
.back {
  margin-bottom: 16px;
}
.series-header {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 20px;
  margin-bottom: 24px;
}
@media (max-width: 640px) {
  .series-header {
    grid-template-columns: 1fr;
  }
  .cover {
    max-width: 160px;
  }
}
.cover {
  width: 100%;
  border-radius: var(--radius);
}
.info .page-title,
.info p {
  margin: 0 0 8px;
}
.genres {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.tag {
  font-size: 0.8rem;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--border);
}
/* Long synopses are cut after a few lines, the volumes are what matters here */
.synopsis {
  white-space: pre-line;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.add-all {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}
.progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}
.progress select {
  width: auto;
}
.error {
  color: var(--accent);
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>

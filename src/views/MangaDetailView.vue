<template>
  <section>
    <button class="btn back" @click="router.back()">← Back</button>

    <p v-if="loading" class="muted">Loading…</p>
    <p v-else-if="error" class="muted" role="alert">⚠️ {{ error }}</p>

    <article v-else-if="manga" class="detail">
      <aside>
        <CoverImage :src="manga.cover" :alt="`Cover of ${manga.title}`" class="cover" />
        <PlatformLinks v-if="manga.series" :platforms="platforms" :loading="platformsLoading" />
      </aside>
      <div class="info">
        <h1>{{ manga.title }}</h1>
        <p class="muted">{{ manga.author }} · {{ manga.year ?? '—' }}</p>
        <ul class="facts">
          <li><strong>Volume:</strong> {{ manga.volume ?? '?' }}</li>
          <li v-if="manga.seriesId">
            <strong>Series:</strong>&nbsp;<RouterLink :to="{ name: 'series', params: { id: manga.seriesId } }">{{ manga.seriesTitle }}</RouterLink>
          </li>
          <li v-if="manga.series?.score"><strong>AniList score:</strong> {{ manga.series.score }}/10</li>
        </ul>
        <p v-if="manga.series?.genres.length" class="genres">
          <span v-for="g in manga.series.genres" :key="g" class="tag">{{ g }}</span>
        </p>
        <p class="synopsis">{{ manga.series?.synopsis || 'No description available.' }}</p>

        <template v-if="libraryItem">
          <LibraryItemActions :item="libraryItem" />
          <label class="note">
            <strong>My note</strong>
            <textarea
              class="input"
              rows="4"
              :value="libraryItem.note"
              placeholder="What did you think? Where did you stop?"
              @change="(e) => store.dispatch('setNote', { id, note: e.target.value })"
            />
          </label>
        </template>
        <button v-else class="btn btn-primary" @click="store.dispatch('addToLibrary', manga)">
          + Add to library
        </button>
      </div>
    </article>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { getVolume, getVolumePlatforms } from '@/services/manga'
import LibraryItemActions from '@/components/LibraryItemActions.vue'
import CoverImage from '@/components/CoverImage.vue'
import PlatformLinks from '@/components/PlatformLinks.vue'

// `id` comes from the route param /manga/:id, a volume id like "30011-12" (see router props)
const props = defineProps({
  id: { type: String, required: true }
})

const router = useRouter()
const store = useStore()

const manga = ref(null)
const loading = ref(false)
const error = ref(null)
const libraryItem = computed(() => store.getters.getItemById(props.id))

// Platforms are loaded after the volume, so the page shows up without waiting for MangaDex
const platforms = ref([])
const platformsLoading = ref(false)
async function loadPlatforms(volume) {
  platformsLoading.value = true
  platforms.value = await getVolumePlatforms(volume.series, volume.volume)
  platformsLoading.value = false
}

watch(
  () => props.id,
  async (id) => {
    loading.value = true
    error.value = null
    try {
      manga.value = await getVolume(id)
      loadPlatforms(manga.value)
    } catch (err) {
      // Offline / API down: fall back to the copy saved in the library
      manga.value = store.getters.getItemById(id) ?? null
      if (!manga.value) error.value = err.message
    } finally {
      loading.value = false
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.back {
  margin-bottom: 16px;
}
.detail {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 24px;
}
@media (max-width: 640px) {
  .detail {
    grid-template-columns: 1fr;
  }
  aside {
    max-width: 240px;
  }
  .cover {
    max-width: 200px;
  }
}
.cover {
  width: 100%;
  border-radius: var(--radius);
}
.info h1 {
  margin: 0;
}
.facts {
  list-style: none;
  padding: 0;
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
.synopsis {
  white-space: pre-line;
}
.note {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 16px;
}
</style>

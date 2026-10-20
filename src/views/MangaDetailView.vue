<template>
  <section>
    <button class="btn back" @click="router.back()">← Back</button>

    <p v-if="loading" class="muted">Loading…</p>
    <p v-else-if="error" class="muted" role="alert">⚠️ {{ error }}</p>

    <article v-else-if="manga" class="detail">
      <img :src="manga.cover" :alt="`Cover of ${manga.title}`" class="cover" />
      <div class="info">
        <h1>{{ manga.title }}</h1>
        <p class="muted">{{ manga.author }} · {{ manga.year ?? '—' }}</p>
        <ul class="facts">
          <li><strong>Status:</strong> {{ manga.publishingStatus }}</li>
          <li><strong>Chapters:</strong> {{ manga.chapters ?? '?' }}</li>
          <li><strong>Volumes:</strong> {{ manga.volumes ?? '?' }}</li>
          <li><strong>MAL score:</strong> {{ manga.score ?? '—' }}</li>
        </ul>
        <p v-if="manga.genres.length" class="genres">
          <span v-for="g in manga.genres" :key="g" class="tag">{{ g }}</span>
        </p>
        <p class="synopsis">{{ manga.synopsis }}</p>

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
import { getMangaById } from '@/services/jikan'
import LibraryItemActions from '@/components/LibraryItemActions.vue'

// `id` comes from the route param /manga/:id (see router props)
const props = defineProps({
  id: { type: Number, required: true }
})

const router = useRouter()
const store = useStore()

const manga = ref(null)
const loading = ref(false)
const error = ref(null)
const libraryItem = computed(() => store.getters.getItemById(props.id))

watch(
  () => props.id,
  async (id) => {
    loading.value = true
    error.value = null
    try {
      manga.value = await getMangaById(id)
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

<template>
  <article class="card">
    <RouterLink :to="to ?? { name: 'manga-detail', params: { id: manga.id } }" class="cover-link">
      <CoverImage :src="manga.cover" :alt="`Cover of ${manga.title}`" class="cover" loading="lazy" />
    </RouterLink>
    <div class="body">
      <h3 class="title" :title="manga.title">{{ manga.title }}</h3>
      <p class="meta muted">{{ manga.author }}</p>
      <p class="meta muted">{{ manga.year ?? '—' }}</p>
      <!-- Slot for actions: "Add" on search results, read/fav/delete in library -->
      <div class="actions">
        <slot />
      </div>
    </div>
  </article>
</template>

<script setup>
import CoverImage from './CoverImage.vue'

defineProps({
  manga: { type: Object, required: true },
  // Where the cover links to (a series card links to the series page instead of the detail)
  to: { type: [Object, String], default: null }
})
</script>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow);
}
.cover {
  width: 100%;
  aspect-ratio: 2 / 3;
  object-fit: cover;
  background: var(--border);
}
.body {
  padding: 10px;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.title {
  font-size: 0.95rem;
  margin: 0 0 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.meta {
  font-size: 0.8rem;
  margin: 0;
}
.actions {
  margin-top: auto;
  padding-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>

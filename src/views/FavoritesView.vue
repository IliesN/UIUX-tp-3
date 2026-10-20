<template>
  <section>
    <h1 class="page-title">Favorites</h1>

    <EmptyState
      v-if="!favorites.length"
      icon="🤍"
      title="No favorites yet"
      message="Tap the heart on a manga in your library to see it here."
    >
      <RouterLink to="/library" class="btn">Go to my library</RouterLink>
    </EmptyState>

    <div v-else class="grid">
      <MangaCard v-for="item in favorites" :key="item.id" :manga="item">
        <LibraryItemActions :item="item" />
      </MangaCard>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import MangaCard from '@/components/MangaCard.vue'
import LibraryItemActions from '@/components/LibraryItemActions.vue'
import EmptyState from '@/components/EmptyState.vue'

const store = useStore()
// Exercise 3: favorites come from a Vuex getter
const favorites = computed(() => store.getters.favorites)
</script>

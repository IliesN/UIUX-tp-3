<template>
  <section class="stats" aria-label="Library statistics">
    <div class="stat"><strong>{{ stats.total }}</strong><span>Total</span></div>
    <div class="stat"><strong>{{ stats.read }}</strong><span>Read</span></div>
    <div class="stat"><strong>{{ stats.remaining }}</strong><span>To read</span></div>
    <div class="stat"><strong>{{ stats.favorites }}</strong><span>Favorites</span></div>
    <div class="stat"><strong>{{ stats.averageRating }}</strong><span>Avg. rating</span></div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const stats = computed(() => store.getters.stats)
</script>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}
.stat {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.stat strong {
  font-size: 1.4rem;
}
.stat span {
  font-size: 0.8rem;
  color: var(--muted);
}
</style>

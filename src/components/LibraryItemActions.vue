<template>
  <div class="item-actions">
    <RatingStars :model-value="item.rating" @update:model-value="setRating" />
    <div class="row">
      <button class="btn" :aria-pressed="item.read" @click="store.dispatch('toggleRead', item.id)">
        {{ item.read ? '✅ Read' : '📖 To read' }}
      </button>
      <button
        class="btn"
        :aria-pressed="item.favorite"
        :aria-label="item.favorite ? 'Remove from favorites' : 'Add to favorites'"
        @click="store.dispatch('toggleFavorite', item.id)"
      >
        {{ item.favorite ? '❤️' : '🤍' }}
      </button>
      <button class="btn" aria-label="Remove from library" @click="remove">Remove</button>
    </div>
  </div>
</template>

<script setup>
import { useStore } from 'vuex'
import RatingStars from './RatingStars.vue'

const props = defineProps({
  item: { type: Object, required: true }
})
const store = useStore()

const setRating = (rating) => store.dispatch('setRating', { id: props.item.id, rating })

// TODO: replace window.confirm with a custom ConfirmDialog component matching the Figma design
const remove = () => {
  if (window.confirm(`Remove "${props.item.title}" from your library?`)) {
    store.dispatch('removeFromLibrary', props.item.id)
  }
}
</script>

<style scoped>
.item-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}
.row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.row .btn {
  padding: 6px 10px;
  font-size: 0.85rem;
}
</style>

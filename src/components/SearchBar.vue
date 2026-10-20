<template>
  <form class="search-bar" role="search" @submit.prevent="submit">
    <input
      v-model="query"
      class="input"
      type="search"
      :placeholder="placeholder"
      aria-label="Search manga"
    />
    <button class="btn btn-primary" type="submit" :disabled="!query.trim()">Search</button>
  </form>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Search a manga… (e.g. One Piece)' }
})
const emit = defineEmits(['search'])

const query = ref(props.modelValue)
watch(() => props.modelValue, (v) => (query.value = v))

const submit = () => emit('search', query.value.trim())
</script>

<style scoped>
.search-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}
</style>

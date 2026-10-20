<template>
  <div class="stars" role="radiogroup" aria-label="Personal rating">
    <button
      v-for="n in 5"
      :key="n"
      type="button"
      class="star"
      :class="{ on: n <= modelValue }"
      role="radio"
      :aria-checked="n === modelValue"
      :aria-label="`${n} star${n > 1 ? 's' : ''}`"
      :disabled="readonly"
      @click="emit('update:modelValue', n === modelValue ? 0 : n)"
    >
      ★
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: Number, default: 0 },
  readonly: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])
</script>

<style scoped>
.stars {
  display: inline-flex;
}
.star {
  background: none;
  border: none;
  padding: 0 1px;
  font-size: 1.1rem;
  color: var(--border);
  cursor: pointer;
}
.star.on {
  color: #f5b301;
}
.star:disabled {
  cursor: default;
}
</style>

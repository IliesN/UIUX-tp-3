<template>
  <img :src="displayedSrc" :alt="alt" @error="failed = true" />
</template>

<script setup>
// Used instead of <img> for covers. Attributes like class or loading="lazy" land on the <img>.
import { computed, ref, watch } from 'vue'
import placeholder from '@/assets/cover-placeholder.png'

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, required: true }
})

// Show the placeholder when there is no cover URL, or when the image fails to load
const failed = ref(false)
watch(() => props.src, () => (failed.value = false))

const displayedSrc = computed(() => (!props.src || failed.value ? placeholder : props.src))
</script>

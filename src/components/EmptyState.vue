<template>
  <div class="empty">
    <div class="icon" aria-hidden="true">{{ icon }}</div>
    <h2>{{ title }}</h2>
    <p class="muted">{{ message }}</p>
    <slot />
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, default: '📭' },
  title: { type: String, required: true },
  message: { type: String, default: '' }
})
</script>

<style scoped>
.empty {
  text-align: center;
  padding: 48px 16px;
}
.icon {
  font-size: 3rem;
}
</style>

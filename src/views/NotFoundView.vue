<template>
  <EmptyState icon="🧭" title="Page not found" message="This page doesn't exist.">
    <RouterLink to="/" class="btn btn-primary">Back to search</RouterLink>
  </EmptyState>
</template>

<script setup>
import EmptyState from '@/components/EmptyState.vue'
</script>

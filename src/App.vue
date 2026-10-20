<template>
  <AppHeader />
  <main class="container">
    <RouterView />
  </main>
  <ToastContainer />
</template>

<script setup>
import AppHeader from '@/components/AppHeader.vue'
import ToastContainer from '@/components/ToastContainer.vue'
</script>

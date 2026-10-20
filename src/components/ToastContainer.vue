<template>
  <div class="toasts" aria-live="polite">
    <TransitionGroup name="toast">
      <div v-for="t in toasts" :key="t.id" class="toast" :class="t.type" @click="dismiss(t.id)">
        {{ t.message }}
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const toasts = computed(() => store.state.toasts)
const dismiss = (id) => store.commit('DISMISS_TOAST', id)
</script>

<style scoped>
.toasts {
  position: fixed;
  bottom: 16px;
  right: 16px;
  left: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  pointer-events: none;
}
.toast {
  pointer-events: auto;
  padding: 10px 14px;
  border-radius: var(--radius);
  background: var(--surface);
  border-left: 4px solid var(--success);
  box-shadow: var(--shadow);
  cursor: pointer;
}
.toast.warning {
  border-left-color: var(--warning);
}
.toast.info {
  border-left-color: var(--muted);
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>

<template>
  <!-- Reading progress against the whole series, not just the volumes in the library -->
  <div class="progress">
    <span class="muted">
      <template v-if="total">{{ read }}/{{ total }} read · {{ owned }} owned</template>
      <template v-else>{{ read }} read · {{ owned }} owned · total unknown</template>
    </span>
    <span
      class="bar"
      role="img"
      :aria-label="total ? `${read} of ${total} volumes read, ${owned} owned` : `${read} volumes read, ${owned} owned`"
    >
      <template v-if="total">
        <span class="read" :style="{ width: percent(read) }" />
        <span class="owned" :style="{ width: percent(owned - read) }" />
      </template>
    </span>
  </div>
</template>

<script setup>
const props = defineProps({
  read: { type: Number, required: true },
  owned: { type: Number, required: true },
  // Regular volumes of the series (null while loading or unknown)
  total: { type: Number, default: null }
})

const percent = (count) => `${(Math.max(count, 0) / props.total) * 100}%`
</script>

<style scoped>
.progress {
  width: 100%;
  font-size: 0.8rem;
}
.bar {
  display: flex;
  height: 6px;
  border-radius: 999px;
  background: var(--border);
  overflow: hidden;
  margin-top: 4px;
}
.read {
  background: var(--success);
}
/* Owned but not read yet: lighter than "read" */
.owned {
  background: color-mix(in srgb, var(--success) 35%, var(--surface));
}
</style>

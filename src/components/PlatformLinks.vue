<template>
  <!-- Official digital platforms where the volume can be read -->
  <div class="platforms">
    <h2 class="platforms-title">Read it on</h2>
    <p v-if="loading" class="muted none">Looking for platforms…</p>
    <ul v-else-if="platforms.length">
      <li v-for="p in platforms" :key="p.site">
        <a :href="p.url" target="_blank" rel="noopener noreferrer" class="platform">
          <!-- AniList icons are white: shown on the platform's color (first letter when there is no icon) -->
          <span class="platform-icon" :style="{ background: p.color ?? 'var(--muted)' }" aria-hidden="true">
            <img v-if="p.icon" :src="p.icon" alt="" />
            <template v-else>{{ p.site[0] }}</template>
          </span>
          <span class="platform-name">
            {{ p.site }}
            <span class="muted">
              {{ p.chapter ? `Chapter ${p.chapter}` : 'Series page' }}<template v-if="p.languages.length">
                · {{ p.languages.join(', ') }}</template>
            </span>
          </span>
          <svg class="external" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
            <path
              d="M9 2h5v5M14 2 7 9M12 10v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="sr-only">(opens in a new tab)</span>
        </a>
      </li>
    </ul>
    <p v-else class="muted none">No official digital release listed.</p>
  </div>
</template>

<script setup>
// platforms: [{ site, url, icon, color, languages, chapter }] — see getVolumePlatforms() in services/manga.js
defineProps({
  platforms: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})
</script>

<style scoped>
.platforms {
  margin-top: 12px;
}
.platforms-title {
  font-size: 0.85rem;
  margin: 0 0 6px;
}
.platforms ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.platform {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  border-radius: 6px;
  font-size: 0.85rem;
  text-decoration: none;
}
.platform:hover {
  background: var(--border);
}
.platform-icon {
  flex: none;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
}
.platform-icon img {
  width: 14px;
  height: 14px;
}
.platform-name {
  flex: 1;
  min-width: 0;
  line-height: 1.2;
}
.platform-name .muted {
  display: block;
  font-size: 0.75rem;
}
.external {
  flex: none;
  color: var(--muted);
}
.none {
  font-size: 0.8rem;
  margin: 0;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>

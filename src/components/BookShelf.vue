<template>
  <!-- Hidden when there is nothing to show (e.g. "Continue reading" with an empty library) -->
  <section
    v-if="loading || error || volumes.length"
    class="shelf-section"
    :class="{ untitled: !title }"
    :aria-labelledby="title ? titleId : undefined"
    :aria-label="title ? undefined : 'Bookshelf'"
  >
    <div class="head">
      <h2 v-if="title" :id="titleId">{{ title }}</h2>
      <!-- One volume at a time -->
      <div v-if="volumes.length > 1" class="arrows">
        <button class="btn" :aria-label="`Previous volume${title ? `: ${title}` : ''}`" :disabled="selected === 0" @click="stepSelection(-1)">
          ‹
        </button>
        <button
          class="btn"
          :aria-label="`Next volume${title ? `: ${title}` : ''}`"
          :disabled="selected === volumes.length - 1"
          @click="stepSelection(1)"
        >
          ›
        </button>
      </div>
    </div>
    <p v-if="hint" class="muted hint">{{ hint }}</p>

    <p v-if="loading" class="muted" aria-live="polite">Loading…</p>
    <p v-else-if="error" class="muted" role="alert">
      ⚠️ {{ error }}
      <button class="btn" @click="load">Retry</button>
    </p>

    <!-- Volumes standing on a shelf, seen from the spine. The selected one is pulled out (its cover).
         Hover a book to select it. One sliding row (hover its edges to scroll), or with `wrap`
         as many rows as needed, like a bookcase. Click: see `linkTo`. -->
    <div
      v-else
      ref="shelf"
      class="shelf"
      :class="{ wrap }"
      @mousemove="wrap ? null : edgeScroll($event)"
      @mouseleave="leaveShelf"
    >
      <ul v-for="(row, r) in rows" :key="r" class="books">
        <template v-for="entry in row" :key="entry.key">
          <!-- Divider, like the letter tabs of a bookshop: a new letter / year starts here -->
          <li v-if="entry.divider" class="divider" aria-hidden="true">
            <span :class="{ long: entry.label.length > 1 }">{{ entry.label }}</span>
          </li>
          <li v-else>
            <RouterLink
              class="book"
              :class="{ 'is-selected': entry.index === selected }"
              :to="linkTo(entry.volume)"
              :aria-label="`${entry.volume.title}${entry.volume.read ? ' (read)' : ''} — ${linkLabel}`"
              @mouseenter="hover(entry.index)"
              @focus="selected = entry.index"
              @keydown.left.prevent="select(entry.index - 1, true)"
              @keydown.right.prevent="select(entry.index + 1, true)"
            >
              <!-- Lazy: covers further along the shelf load only when scrolled to -->
              <img v-if="entry.volume.cover" class="cover" :src="entry.volume.cover" alt="" loading="lazy" />
              <!-- Spine: only the volume number. Pulled out: the series title takes its place. -->
              <span class="spine" aria-hidden="true">
                <!-- Green label: already read -->
                <span class="label" :class="{ 'is-read': entry.volume.read }">{{ entry.volume.volume ?? '•' }}</span>
              </span>
              <span class="caption" aria-hidden="true">
                <span class="label">{{ entry.volume.seriesTitle }}</span>
              </span>
            </RouterLink>
          </li>
        </template>
      </ul>
    </div>
  </section>
</template>

<script setup>
// A shelf of volume spines. The volumes are either given (`items`, e.g. the library)
// or loaded once (`fetchVolumes(library)`, e.g. the home page suggestions).
// No API provides real spines: they are drawn from a vertical strip of each volume's cover.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useStore } from 'vuex'

const props = defineProps({
  title: { type: String, default: '' },
  hint: { type: String, default: '' },
  items: { type: Array, default: null },
  fetchVolumes: { type: Function, default: null },
  // Where a book leads, and how screen readers announce it
  linkTo: { type: Function, default: (volume) => ({ name: 'series', params: { id: volume.seriesId } }) },
  linkLabel: { type: String, default: 'open the series' },
  // Several rows (a bookcase) instead of one sliding row
  wrap: { type: Boolean, default: false },
  // Optional: (volume) => label of its group ("A", "2016"…). A divider is placed where the label changes.
  dividerOf: { type: Function, default: null }
})

const titleId = `shelf-${props.title.toLowerCase().replace(/\W+/g, '-')}`
const store = useStore()
const fetched = ref([])
const volumes = computed(() => props.items ?? fetched.value)
const loading = ref(false)
const error = ref(null)

// Book sizes, same as the CSS below (.books padding and gap, .book widths)
const SHELF_PADDING = 4
const SPINE_WIDTH = 44
const GAP = 3
const COVER_WIDTH = 144 // pulled out: 216px high, 2:3
const DIVIDER_WIDTH = 34
const MARGIN = 24 // keep the selected book this far from the edges

const shelf = ref(null)

// Books (with their index among the volumes) and the dividers placed before each new group
const entries = computed(() => {
  const list = []
  let previous = null
  volumes.value.forEach((volume, index) => {
    const label = props.dividerOf?.(volume) ?? null
    if (label !== null && label !== previous) list.push({ divider: true, key: `divider-${index}`, label: String(label) })
    previous = label
    list.push({ key: volume.id, volume, index })
  })
  return list
})

// Rows. With `wrap`, each row is filled with as many books / dividers as fit, keeping room for one
// pulled-out book, so pulling a book out never pushes another one to the next row.
const rowWidth = ref(null)
const rows = computed(() => {
  if (!props.wrap || !rowWidth.value) return [entries.value]
  const result = []
  let row = []
  let used = 0
  for (const entry of entries.value) {
    const own = entry.divider ? DIVIDER_WIDTH : SPINE_WIDTH
    // A divider never ends a row: it needs room for its first book too
    const needed = (row.length ? GAP : 0) + own + (entry.divider ? GAP + SPINE_WIDTH : 0)
    if (row.length && used + needed > rowWidth.value) {
      result.push(row)
      row = []
      used = 0
    }
    used += (row.length ? GAP : 0) + own
    row.push(entry)
  }
  if (row.length) result.push(row)
  return result
})

function measure() {
  const el = shelf.value
  if (!props.wrap || !el) return
  // shelf and row paddings (4px each side, twice), minus the extra width of a pulled-out book
  rowWidth.value = el.clientWidth - 4 * SHELF_PADDING - (COVER_WIDTH - SPINE_WIDTH)
}
const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
// The shelf element comes and goes (loading, no matching volume): watch it to keep measuring
watch(shelf, (el, old) => {
  if (old) resizeObserver?.unobserve(old)
  if (el) {
    resizeObserver?.observe(el)
    measure()
  }
})

// Selection: one book pulled out at a time. Nothing is pulled out at first:
// hovering a book pulls it out while the mouse is on the shelf, and the arrow buttons start
// from the first volume (or from the hovered one), then move one volume at a time.
const selected = ref(null)
let selectedByHover = false
function hover(index) {
  selected.value = index
  selectedByHover = true
}
function stepSelection(direction) {
  select(selected.value === null ? 0 : selected.value + direction)
}
function select(index, focus = false) {
  selectedByHover = false
  if (index < 0 || index >= volumes.value.length) return
  selected.value = index
  const el = shelf.value
  if (!el) return
  if (props.wrap) {
    // Bookcase: the page scrolls, not the shelf
    const book = el.querySelectorAll('.book')[index]
    book?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    if (focus) book?.focus({ preventScroll: true })
    return
  }
  // Where the book will be once pulled out (every book before it is a narrow spine)
  const left = SHELF_PADDING + index * (SPINE_WIDTH + GAP)
  const right = left + COVER_WIDTH
  if (left - MARGIN < el.scrollLeft) el.scrollTo({ left: left - MARGIN, behavior: 'smooth' })
  else if (right + MARGIN > el.scrollLeft + el.clientWidth)
    el.scrollTo({ left: right + MARGIN - el.clientWidth, behavior: 'smooth' })
  if (focus) el.querySelectorAll('.book')[index]?.focus({ preventScroll: true })
}

// Hovering near an edge of the shelf scrolls it, faster closer to the edge
const EDGE = 80 // px
const MAX_SPEED = 14 // px per frame
let speed = 0
let frame = null
function edgeScroll(event) {
  const rect = shelf.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  if (x < EDGE) speed = -MAX_SPEED * (1 - x / EDGE)
  else if (x > rect.width - EDGE) speed = MAX_SPEED * (1 - (rect.width - x) / EDGE)
  else speed = 0
  if (speed && !frame) frame = requestAnimationFrame(step)
}
function step() {
  if (!speed || !shelf.value) return stopEdgeScroll()
  shelf.value.scrollLeft += speed
  frame = requestAnimationFrame(step)
}
function leaveShelf() {
  stopEdgeScroll()
  if (selectedByHover) selected.value = null // the mouse is gone: put the book back
}
function stopEdgeScroll() {
  speed = 0
  if (frame) cancelAnimationFrame(frame)
  frame = null
}

async function load() {
  if (!props.fetchVolumes) return
  loading.value = true
  error.value = null
  try {
    fetched.value = await props.fetchVolumes(store.getters.libraryItems)
    selected.value = null
  } catch (err) {
    error.value = err.message || 'Could not load these volumes'
  } finally {
    loading.value = false
  }
}

onMounted(load)
// Given items change (filters, sorting, removal): a selection past the end goes away
watch(
  () => volumes.value.length,
  (length) => {
    if (selected.value !== null && selected.value >= length) selected.value = null
  }
)
onBeforeUnmount(() => {
  stopEdgeScroll()
  resizeObserver?.disconnect()
})
</script>

<style scoped>
.shelf-section {
  margin-top: 32px;
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.shelf-section.untitled {
  margin-top: 0;
}
.untitled .head {
  justify-content: flex-end;
}
.shelf-section h2 {
  font-size: 1.2rem;
  margin: 0 0 4px;
}
.arrows {
  display: flex;
  gap: 6px;
}
.arrows .btn {
  padding: 4px 12px;
  font-size: 1.2rem;
  line-height: 1;
}
.hint {
  margin: 0 0 12px;
  font-size: 0.9rem;
}

/* The shelf: books in a row, standing on a plank */
.shelf {
  overflow-x: auto;
  padding: 0 4px;
}
.shelf.wrap {
  overflow: visible;
  display: flex;
  flex-direction: column;
  gap: 28px; /* space above each lower shelf */
}
.books {
  list-style: none;
  margin: 0;
  padding: 0 4px;
  display: flex;
  align-items: flex-end;
  gap: 3px;
  min-height: 240px;
  width: max-content;
  min-width: 100%;
  border-bottom: 12px solid #8a8580; /* the plank */
  box-shadow: 0 8px 10px -6px rgb(0 0 0 / 0.35);
}

/* A book seen from its spine: a strip from the middle of its cover. All books have the same size. */
.book {
  --spine-width: 44px;
  --height: 216px;
  display: block;
  position: relative;
  width: var(--spine-width);
  height: var(--height);
  border-radius: 3px 3px 0 0;
  background: var(--muted); /* while the cover loads, or when there is none */
  box-shadow:
    inset 3px 0 4px rgb(255 255 255 / 0.25),
    inset -3px 0 5px rgb(0 0 0 / 0.35);
  text-decoration: none;
  overflow: hidden;
  transition: width 0.25s ease;
}
/* Selected (hovered, focused or chosen with the arrows): pulled out, the whole cover (2:3) */
.book.is-selected {
  width: calc(var(--height) * 2 / 3);
}
/* Narrow: the middle strip of the cover. Pulled out (2:3): the whole cover. */
.cover {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}
.book:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}

/* Spine (darkened like the side of a book) and pulled-out cover share the bottom label spot */
.spine,
.caption {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0 4px 6px;
  transition: opacity 0.2s ease;
}
.spine {
  background: linear-gradient(90deg, rgb(0 0 0 / 0.45), rgb(0 0 0 / 0.2) 50%, rgb(0 0 0 / 0.45));
}
.caption {
  opacity: 0;
}
.book.is-selected .spine {
  opacity: 0;
}
.book.is-selected .caption {
  opacity: 1;
}
/* Divider: a shorter block standing between two groups of books, its letter / year on top */
.divider {
  flex: none;
  width: 34px; /* DIVIDER_WIDTH */
  height: 168px;
  padding-top: 8px;
  display: flex;
  justify-content: center;
  border: 1px solid var(--border);
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  background: var(--surface);
  box-shadow: var(--shadow);
}
.divider span {
  font-size: 1.2rem;
  font-weight: 800;
  line-height: 1;
}
/* Years (or anything longer than a letter) are written vertically */
.divider span.long {
  writing-mode: vertical-rl;
  font-size: 0.95rem;
  letter-spacing: 0.05em;
}
.label.is-read {
  background: var(--success);
  color: #fff;
}
.label {
  min-width: 26px;
  max-width: 100%;
  padding: 2px 6px;
  border-radius: 3px;
  background: #fff;
  color: #1c1b1f;
  font-size: 0.75rem;
  font-weight: 700;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.3);
}

@media (prefers-reduced-motion: reduce) {
  .book,
  .spine,
  .caption {
    transition: none;
  }
}
</style>

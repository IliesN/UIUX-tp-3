# Part 1 — UX Research

## Persona

**Yanis, 20 — university student & manga reader**

> "I know I was reading something good last month… but I can't remember the title or which chapter I stopped at."

| | |
|---|---|
| **Age** | 20 |
| **Occupation** | 2nd-year Computer Science student |
| **Devices** | Phone (on the bus, in bed), laptop (at home) |
| **Reading habits** | 5–10 manga in parallel, reads online in short sessions, mostly shōnen & seinen |
| **Tech level** | Comfortable — uses apps daily, hates slow or cluttered UIs |

### Goals
- Find a manga **quickly** by its title, even with a half-remembered name.
- Keep **one list** of everything he is reading, has finished, and wants to read next.
- Know at a glance **what is still left to read**.
- Remember his favorites and what he thought of each series.

### Frustrations
- Reading sites are full of ads, pop-ups and slow search.
- He juggles notes, browser bookmarks and screenshots to track progress — and loses them.
- He forgets titles that friends recommended.
- Existing trackers (MAL, AniList) feel heavy: too many fields, account required, not fast on mobile.

### Needs
- A fast search with covers, so he recognises the manga visually.
- One-tap "add to library" and "mark as read".
- A clear split between **Read** and **To read**.
- Works on mobile, no account, data that stays after closing the browser.
- A dark mode for late-night reading.

## Problem statement

> **How might we help** a busy student who reads many manga online **find titles quickly and keep track of what he has read and what is left to read**, without the clutter and friction of existing tools?

## Main user flow

```
Search  →  Results  →  Add  →  Library
  │           │          │        ├── mark read / to read
  │           │          │        ├── favorite ❤️
  │           │          │        ├── rate ★ / note
  │           │          │        └── delete
  │           └── click cover → Manga detail (/manga/:id)
  └── "No results" / error / loading states
```

## Deliverables checklist

- [x] Persona
- [x] Problem statement
- [ ] 2–3 low-fidelity wireframes → `docs/wireframes/` (Search, Library, Detail)
- [ ] Clickable Figma prototype → link: _TODO_

import { createRouter, createWebHistory } from 'vue-router'
import SearchView from '@/views/SearchView.vue'

const routes = [
  { path: '/', name: 'search', component: SearchView },
  { path: '/library', name: 'library', component: () => import('@/views/LibraryView.vue') },
  { path: '/favorites', name: 'favorites', component: () => import('@/views/FavoritesView.vue') },
  {
    path: '/manga/:id',
    name: 'manga-detail',
    component: () => import('@/views/MangaDetailView.vue'),
    props: (route) => ({ id: Number(route.params.id) })
  },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') }
]

export default createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

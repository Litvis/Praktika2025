import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../pages/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/adminLanding',
    name: 'AdminLanding',
    component: () => import('../pages/AdminLanding.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../pages/Dashboard.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/emails/:id',
    name: 'EmailDetail',
    component: () => import('../pages/EmailDetail.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/irankis',
    name: 'Irankis',
    component: () => import('../pages/Irankis.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/usersManagement',
    name: 'usersManagement',
    component: () => import('../pages/UserManagement.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/authorising',
    name: 'Authorising',
    component: () => import('../pages/Authorising.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/unauthorized',
    name: 'Unauthorized',
    component: () => import('../pages/Unauthorized.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  // Disable component caching to prevent security issues when switching routes
  sensitive: true, // Case sensitive routes
  strict: true // Strict path matching
});

// Global navigation guard
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();
  
  // If store is empty but we're not loading, fetch user data
  if (!userStore.user && !userStore.isLoading) {
    await userStore.fetchUserProfile();
  }
  
  // Wait for loading to complete
  if (userStore.isLoading) {
    // You could implement a loading spinner here
    await userStore.fetchUserProfile();
  }
  
  // Handle route access
  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    // Redirect to login if not authenticated
    return next('/login');
  }
  
  // Redirect pending users to authorising page
  if (userStore.isPending && to.path !== '/authorising' && to.path !== '/login') {
    return next('/authorising');
  }
  
  if (to.meta.requiresAdmin && !userStore.isAdmin) {
    // Redirect to unauthorized page if not admin
    return next('/unauthorized');
  }
  
  // Continue with navigation
  next();
});

export default router;
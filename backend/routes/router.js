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
    path: '/csv-management',
    name: 'CsvManagement',
    component: () => import('../pages/CsvManagement.vue'),
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
  sensitive: true,
  strict: true
});

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();

  if (!userStore.user && !userStore.isLoading) {
    await userStore.fetchUserProfile();
  }

  if (userStore.isLoading) {
    await userStore.fetchUserProfile();
  }

  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    return next('/login');
  }

  if (userStore.isPending && to.path !== '/authorising' && to.path !== '/login') {
    return next('/authorising');
  }

  if (to.meta.requiresAdmin && !userStore.isAdmin) {
    return next('/unauthorized');
  }
  next();
});

export default router;
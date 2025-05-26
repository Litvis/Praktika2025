export default defineNuxtPlugin(({ $router }) => {
  $router.beforeEach(async (to, from, next) => {
    const userStore = useUserStore();

    if (to.path === '/login') {
      return next();
    }

    if (!userStore.user && !userStore.isLoading) {
      await userStore.fetchUserProfile();
    }

    if (userStore.isLoading) {
      await userStore.fetchUserProfile();
    }

    if (to.meta.requiresAuth && !userStore.isAuthenticated) {
      return next('/login');
    }

    if (to.meta.requiresAdmin && !userStore.isAdmin) {
      return next('/unauthorized');
    }

    next();
  });
});
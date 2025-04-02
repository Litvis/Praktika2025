// plugins/navigation-guard.js
export default defineNuxtPlugin(({ $router }) => {
  // Global navigation guard
  $router.beforeEach(async (to, from, next) => {
    const userStore = useUserStore();
    
    // Skip middleware for login page
    if (to.path === '/login') {
      return next();
    }
    
    // Wait for user data to load if necessary
    if (!userStore.user && !userStore.isLoading) {
      await userStore.fetchUserProfile();
    }
    
    // Wait for loading to complete
    if (userStore.isLoading) {
      // You might implement a loading spinner here
      await userStore.fetchUserProfile();
    }
    
    // Check authentication
    if (to.meta.requiresAuth && !userStore.isAuthenticated) {
      return next('/login');
    }
    
    // Check admin role for restricted pages
    if (to.meta.requiresAdmin && !userStore.isAdmin) {
      return next('/unauthorized');
    }
    
    // Continue with navigation
    next();
  });
});
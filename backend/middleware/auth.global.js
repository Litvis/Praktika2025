// middleware/auth.js
export default defineNuxtRouteMiddleware((to, from) => {
    const userStore = useUserStore();
    
    // Skip middleware if we're going to login page
    if (to.path === '/login') {
      return;
    }
    
    // Wait for user data to load if it's not already loaded
    if (userStore.isLoading) {
      return;
    }
    
    // If user is not authenticated, redirect to login
    if (!userStore.isAuthenticated) {
      return navigateTo('/login');
    }
    
    // Check admin-only routes
    const adminOnlyRoutes = ['/dashboard', '/admin', '/admin/dashboard', '/emails', '/emails/'];
    
    // Check if the current route is an admin route or matches the pattern /emails/{id}
    const isEmailDetailPage = to.path.match(/^\/emails\/\d+$/);
    const isAdminRoute = adminOnlyRoutes.some(route => to.path.startsWith(route)) || isEmailDetailPage;
    
    // If this is an admin route and user is not admin, redirect to unauthorized
    if (isAdminRoute && !userStore.isAdmin) {
      return navigateTo('/unauthorized');
    }
  });
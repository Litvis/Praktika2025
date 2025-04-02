// middleware/auth.global.js
export default defineNuxtRouteMiddleware((to, from) => {
  const userStore = useUserStore();
  
  // Skip middleware for login and unauthorized pages
  if (to.path === '/login' || to.path === '/unauthorized') {
    console.log('Skipping auth check for login/unauthorized page');
    return;
  }
  
  console.log('Auth middleware running for path:', to.path);
  console.log('Auth state:', {
    isLoading: userStore.isLoading,
    isAuthenticated: userStore.isAuthenticated,
    isAdmin: userStore.isAdmin,
    user: userStore.user
  });
  
  // If still loading, don't make navigation decisions yet
  if (userStore.isLoading) {
    console.log('Still loading user data, deferring navigation check');
    // You might want to show a loading indicator here
    return;
  }
  
  // If user is not authenticated, redirect to login
  if (!userStore.isAuthenticated) {
    console.log('User not authenticated, redirecting to login');
    return navigateTo('/login');
  }
  
  // List of paths that require admin access
  const adminOnlyPaths = [
    '/dashboard',
    '/admin',
    '/admin/dashboard',
    '/emails'
  ];
  
  // Check if current path is admin-only
  const isAdminPath = adminOnlyPaths.some(path => to.path.startsWith(path));
  
  // Also check for email detail pages that follow pattern /emails/123
  const isEmailDetailPage = /^\/emails\/\d+$/.test(to.path);
  
  // If this is an admin path and user is not admin, redirect to unauthorized
  if ((isAdminPath || isEmailDetailPage) && !userStore.isAdmin) {
    console.log('Non-admin attempting to access admin path, redirecting to unauthorized');
    return navigateTo('/unauthorized');
  }
  
  console.log('Auth check passed, allowing navigation');
});
// middleware/auth.global.js
export default defineNuxtRouteMiddleware(async (to, from) => {
  const userStore = useUserStore();

  // Skip middleware for login, unauthorized, and authorising pages
  if (to.path === '/login' || to.path === '/unauthorized' || to.path === '/authorising') {
    console.log('Skipping auth check for login/unauthorized/authorising page');
    return;
  }

  console.log('Auth middleware running for path:', to.path);

  // If user data isn't loaded yet, fetch it
  if (!userStore.user && !userStore.isLoading) {
    console.log('User data not loaded, fetching profile...');
    await userStore.fetchUserProfile();
  }

  // Wait if currently loading
  if (userStore.isLoading) {
    console.log('Waiting for user data to load...');
    // Could implement a loading spinner here
  }

  console.log('Auth state:', {
    isAuthenticated: userStore.isAuthenticated,
    isAdmin: userStore.isAdmin,
    isPending: userStore.isPending,
    user: userStore.user
  });

  // IMPORTANT: If user is not authenticated, always redirect to login
  if (!userStore.isAuthenticated) {
    console.log('User not authenticated, redirecting to login');
    return navigateTo('/login');
  }

  // Check if user is pending approval and redirect to authorising page
  if (userStore.isPending && to.path !== '/authorising') {
    console.log('User is pending approval, redirecting to authorising page');
    return navigateTo('/authorising');
  }

  // List ALL admin-only paths - be comprehensive
  const adminOnlyPaths = [
    '/dashboard',
    '/admin',
    '/admin/dashboard',
    '/emails',
    '/adminLanding', 
    '/admin/users',
    '/admin/settings',
    '/user-management'
  ];

  // Check for EXACT path matches first
  if (adminOnlyPaths.includes(to.path) && !userStore.isAdmin) {
    console.log(`Non-admin attempting to access admin path: ${to.path}`);
    return navigateTo('/unauthorized');
  }

  // Then check for path patterns
  const isAdminPath = adminOnlyPaths.some(path => to.path.startsWith(path));
  const isEmailDetailPage = /^\/emails\/\d+$/.test(to.path);
  const isAdminRoute = isAdminPath || isEmailDetailPage;

  // If this is an admin path and user is not admin, ALWAYS redirect to unauthorized
  if (isAdminRoute && !userStore.isAdmin) {
    console.log(`Non-admin attempting to access admin path pattern: ${to.path}`);
    return navigateTo('/unauthorized');
  }

  // Allow navigation for authenticated users to non-admin pages
  // Or for admin users to any page
  console.log('Auth check passed, allowing navigation');
});
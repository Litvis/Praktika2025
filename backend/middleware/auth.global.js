export default defineNuxtRouteMiddleware(async (to, from) => {
  if (to.path === '/debug') {
    console.log('Skipping auth middleware for debug page');
    return;
  }
  
  console.log('Auth middleware running for path:', to.path);
  const userStore = useUserStore();
  
  if (to.path === '/login' || to.path === '/unauthorized' || to.path === '/authorising') {
    console.log('Skipping auth check for public page:', to.path);
    return;
  }

  console.log('Initial auth state:', {
    isAuthenticated: userStore.isAuthenticated,
    isAdmin: userStore.isAdmin,
    isPending: userStore.isPending,
    isLoading: userStore.isLoading
  });

  try {
    console.log('Fetching user profile in middleware');
    await userStore.fetchUserProfile();
  } catch (error) {
    console.error('Error fetching profile:', error);
  }

  console.log('Auth state after fetch:', {
    isAuthenticated: userStore.isAuthenticated,
    isAdmin: userStore.isAdmin,
    isPending: userStore.isPending
  });

  if (!userStore.isAuthenticated) {
    console.log('User not authenticated, redirecting to login');
    return navigateTo('/login');
  }

  if (userStore.isPending && to.path !== '/authorising') {
    console.log('User is pending approval, redirecting to authorising page');
    return navigateTo('/authorising');
  }

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

  if (adminOnlyPaths.includes(to.path) && !userStore.isAdmin) {
    console.log(`Non-admin attempting to access admin path: ${to.path}`);
    return navigateTo('/unauthorized');
  }

  const isAdminPath = adminOnlyPaths.some(path => to.path.startsWith(path));
  const isEmailDetailPage = /^\/emails\/\d+$/.test(to.path);
  const isAdminRoute = isAdminPath || isEmailDetailPage;

  if (isAdminRoute && !userStore.isAdmin) {
    console.log(`Non-admin attempting to access admin path pattern: ${to.path}`);
    return navigateTo('/unauthorized');
  }

  console.log('Auth check passed, allowing navigation');
});
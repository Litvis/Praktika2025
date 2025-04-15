// tests/middleware/auth.logic.test.js
import { jest } from '@jest/globals';

// Mockuojame navigateTo funkciją
const navigateTo = jest.fn();

// Apibrėžiame tiesioginę auth middleware logiką be Nuxt priklausomybių
function authMiddleware(to, from, userStore) {
  // Skip middleware for login and unauthorized pages
  if (to.path === '/login' || to.path === '/unauthorized') {
    return;
  }
  
  // If user is not authenticated, always redirect to login
  if (!userStore.isAuthenticated) {
    return navigateTo('/login');
  }
  
  // List ALL admin-only paths
  const adminOnlyPaths = [
    '/dashboard',
    '/admin',
    '/admin/dashboard',
    '/emails',
    '/adminLanding',
    '/admin/users',
    '/admin/settings'
  ];
  
  // Check for EXACT path matches first
  if (adminOnlyPaths.includes(to.path) && !userStore.isAdmin) {
    return navigateTo('/unauthorized');
  }
  
  // Then check for path patterns
  const isAdminPath = adminOnlyPaths.some(path => to.path.startsWith(path));
  const isEmailDetailPage = /^\/emails\/\d+$/.test(to.path);
  const isAdminRoute = isAdminPath || isEmailDetailPage;
  
  // If this is an admin path and user is not admin, redirect to unauthorized
  if (isAdminRoute && !userStore.isAdmin) {
    return navigateTo('/unauthorized');
  }
  
  // Allow navigation otherwise
  return;
}

describe('Auth Middleware Logic Tests', () => {
  // Prieš kiekvieną testą išvalome mockus
  beforeEach(() => {
    jest.clearAllMocks();
    navigateTo.mockReset();
  });

  // Test 1: Skip middleware for login page
  test('should skip middleware for login page', () => {
    const mockUserStore = {
      isAuthenticated: false,
      isAdmin: false
    };
    
    const to = { path: '/login' };
    const from = { path: '/' };
    
    authMiddleware(to, from, mockUserStore);
    
    expect(navigateTo).not.toHaveBeenCalled();
  });

  // Test 2: Skip middleware for unauthorized page
  test('should skip middleware for unauthorized page', () => {
    const mockUserStore = {
      isAuthenticated: false,
      isAdmin: false
    };
    
    const to = { path: '/unauthorized' };
    const from = { path: '/' };
    
    authMiddleware(to, from, mockUserStore);
    
    expect(navigateTo).not.toHaveBeenCalled();
  });

  // Test 3: Redirect to login if not authenticated
  test('should redirect to login if user is not authenticated', () => {
    const mockUserStore = {
      isAuthenticated: false,
      isAdmin: false
    };
    
    const to = { path: '/irankis' };
    const from = { path: '/' };
    
    authMiddleware(to, from, mockUserStore);
    
    expect(navigateTo).toHaveBeenCalledWith('/login');
  });

  // Test 4: Redirect to unauthorized for non-admin on admin page
  test('should redirect to unauthorized if non-admin tries to access admin page', () => {
    const mockUserStore = {
      isAuthenticated: true,
      isAdmin: false
    };
    
    const to = { path: '/dashboard' };
    const from = { path: '/' };
    
    authMiddleware(to, from, mockUserStore);
    
    expect(navigateTo).toHaveBeenCalledWith('/unauthorized');
  });

  // Test 5: Allow admin access to admin pages
  test('should allow admin to access admin pages', () => {
    const mockUserStore = {
      isAuthenticated: true,
      isAdmin: true
    };
    
    const to = { path: '/dashboard' };
    const from = { path: '/' };
    
    authMiddleware(to, from, mockUserStore);
    
    expect(navigateTo).not.toHaveBeenCalled();
  });

  // Test 6: Redirect on email detail page for non-admin
  test('should redirect non-admin from email detail page', () => {
    const mockUserStore = {
      isAuthenticated: true,
      isAdmin: false
    };
    
    const to = { path: '/emails/123' };
    const from = { path: '/' };
    
    authMiddleware(to, from, mockUserStore);
    
    expect(navigateTo).toHaveBeenCalledWith('/unauthorized');
  });

  // Test 7: Allow authenticated non-admin access to non-admin pages
  test('should allow authenticated non-admin to access non-admin pages', () => {
    const mockUserStore = {
      isAuthenticated: true,
      isAdmin: false
    };
    
    const to = { path: '/irankis' };
    const from = { path: '/' };
    
    authMiddleware(to, from, mockUserStore);
    
    expect(navigateTo).not.toHaveBeenCalled();
  });

  // Test 8: Check admin path patterns
  test('should redirect non-admin from paths with admin patterns', () => {
    const mockUserStore = {
      isAuthenticated: true,
      isAdmin: false
    };
    
    const to = { path: '/admin/some-new-path' };
    const from = { path: '/' };
    
    authMiddleware(to, from, mockUserStore);
    
    expect(navigateTo).toHaveBeenCalledWith('/unauthorized');
  });
});
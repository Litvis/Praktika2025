import { jest } from '@jest/globals';

const navigateTo = jest.fn();

function authMiddleware(to, from, userStore) {
  if (to.path === '/login' || to.path === '/unauthorized') {
    return;
  }
  
  if (!userStore.isAuthenticated) {
    return navigateTo('/login');
  }
  
  const adminOnlyPaths = [
    '/dashboard',
    '/admin',
    '/admin/dashboard',
    '/emails',
    '/adminLanding',
    '/admin/users',
    '/admin/settings'
  ];
  
  if (adminOnlyPaths.includes(to.path) && !userStore.isAdmin) {
    return navigateTo('/unauthorized');
  }
  
  const isAdminPath = adminOnlyPaths.some(path => to.path.startsWith(path));
  const isEmailDetailPage = /^\/emails\/\d+$/.test(to.path);
  const isAdminRoute = isAdminPath || isEmailDetailPage;
  
  if (isAdminRoute && !userStore.isAdmin) {
    return navigateTo('/unauthorized');
  }
  
  return;
}

describe('Auth Middleware Logic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    navigateTo.mockReset();
  });

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
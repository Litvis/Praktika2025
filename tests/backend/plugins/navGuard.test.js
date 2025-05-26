import { jest } from '@jest/globals';

function createNavGuardLogic(userStore) {
  return async (to, from, next) => {
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
  };
}

describe('Navigation Guard Logic Tests', () => {

  let mockUserStore;
  let mockNext;
  let guardFn;
  
  beforeEach(() => {
    mockNext = jest.fn();
    mockUserStore = {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      isAdmin: false,
      fetchUserProfile: jest.fn(async () => {
        mockUserStore.isLoading = false;
        return Promise.resolve();
      })
    };
  
    guardFn = createNavGuardLogic(mockUserStore);
  });

  test('should allow navigation to login page without checks', async () => {
    const to = { path: '/login', meta: {} };
    const from = { path: '/' };
    
    await guardFn(to, from, mockNext);
    
    expect(mockNext).toHaveBeenCalledWith();
    expect(mockUserStore.fetchUserProfile).not.toHaveBeenCalled();
  });

  test('should fetch user profile if not loaded', async () => {
    const to = { path: '/dashboard', meta: { requiresAuth: true } };
    const from = { path: '/' };
    
    await guardFn(to, from, mockNext);
    
    expect(mockUserStore.fetchUserProfile).toHaveBeenCalled();
  });

  test('should wait for loading to complete', async () => {
    mockUserStore.isLoading = true;
    
    const to = { path: '/dashboard', meta: { requiresAuth: true } };
    const from = { path: '/' };
    
    await guardFn(to, from, mockNext);
    
    expect(mockUserStore.fetchUserProfile).toHaveBeenCalled();
  });

  test('should redirect to login if not authenticated for auth required pages', async () => {
    const to = { path: '/dashboard', meta: { requiresAuth: true } };
    const from = { path: '/' };
    
    mockUserStore.isAuthenticated = false;
    
    await guardFn(to, from, mockNext);
    
    expect(mockNext).toHaveBeenCalledWith('/login');
  });

  test('should redirect to unauthorized if not admin for admin pages', async () => {
    const to = { path: '/admin/dashboard', meta: { requiresAdmin: true } };
    const from = { path: '/' };
    
    mockUserStore.isAuthenticated = true;
    mockUserStore.isAdmin = false;
    
    await guardFn(to, from, mockNext);
    
    expect(mockNext).toHaveBeenCalledWith('/unauthorized');
  });

  test('should allow admin to access admin pages', async () => {
    const to = { path: '/admin/dashboard', meta: { requiresAdmin: true } };
    const from = { path: '/' };
    
    mockUserStore.isAuthenticated = true;
    mockUserStore.isAdmin = true;
    
    await guardFn(to, from, mockNext);
    
    expect(mockNext).toHaveBeenCalledWith();
  });

  test('should allow authenticated users to access public pages', async () => {
    const to = { path: '/public', meta: {} };
    const from = { path: '/' };
    
    mockUserStore.isAuthenticated = true;
    
    await guardFn(to, from, mockNext);
    
    expect(mockNext).toHaveBeenCalledWith();
  });
});
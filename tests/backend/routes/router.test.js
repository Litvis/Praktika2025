import { jest } from '@jest/globals';

global.window = {
  history: {},
  location: { pathname: '' }
};

jest.mock('vue-router', () => ({
  createRouter: jest.fn(() => ({
    beforeEach: jest.fn(),
    routes: []
  })),
  createWebHistory: jest.fn(() => ({}))
}));

const mockUserStore = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  isAdmin: false,
  fetchUserProfile: jest.fn()
};

global.useUserStore = jest.fn(() => mockUserStore);

describe('Router Configuration Tests', () => {
  describe('Navigation Guard Tests', () => {
    let next, to, from;
    
    beforeEach(() => {
      next = jest.fn();
      to = { path: '/', meta: {} };
      from = { path: '/' };
      mockUserStore.fetchUserProfile.mockClear();
      mockUserStore.user = null;
      mockUserStore.isLoading = false;
      mockUserStore.isAuthenticated = false;
      mockUserStore.isAdmin = false;
    });
    
    const navigationGuard = async (to, from, next) => {
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
      
      if (to.meta.requiresAdmin && !userStore.isAdmin) {
        return next('/unauthorized');
      }
      
      next();
    };

    test('should fetch user profile if not loaded', async () => {
      to = { path: '/irankis', meta: { requiresAuth: true } };
      
      await navigationGuard(to, from, next);
      
      expect(mockUserStore.fetchUserProfile).toHaveBeenCalled();
    });

    test('should wait for loading to complete', async () => {
      to = { path: '/irankis', meta: { requiresAuth: true } };
      mockUserStore.isLoading = true;
      
      await navigationGuard(to, from, next);
      
      expect(mockUserStore.fetchUserProfile).toHaveBeenCalled();
    });

    test('should redirect to login if not authenticated', async () => {
      to = { path: '/irankis', meta: { requiresAuth: true } };
      mockUserStore.isAuthenticated = false;
      
      await navigationGuard(to, from, next);
      
      expect(next).toHaveBeenCalledWith('/login');
    });

    test('should redirect to unauthorized if not admin', async () => {
      to = { path: '/adminLanding', meta: { requiresAuth: true, requiresAdmin: true } };
      mockUserStore.isAuthenticated = true;
      mockUserStore.isAdmin = false;
      
      await navigationGuard(to, from, next);
      
      expect(next).toHaveBeenCalledWith('/unauthorized');
    });

    test('should allow access for admin to admin pages', async () => {
      to = { path: '/adminLanding', meta: { requiresAuth: true, requiresAdmin: true } };
      mockUserStore.isAuthenticated = true;
      mockUserStore.isAdmin = true;
      
      await navigationGuard(to, from, next);
      
      expect(next).toHaveBeenCalledWith();
    });

    test('should allow access for authenticated users to non-admin pages', async () => {
      to = { path: '/irankis', meta: { requiresAuth: true } };
      mockUserStore.isAuthenticated = true;
      
      await navigationGuard(to, from, next);
      
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('Routes Configuration', () => {
    test('should define expected routes with correct metadata', () => {
      const expectedRoutes = [
        {
          path: '/login',
          name: 'Login',
          meta: { requiresAuth: false }
        },
        {
          path: '/adminLanding',
          name: 'AdminLanding',
          meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
          path: '/dashboard',
          name: 'Dashboard',
          meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
          path: '/emails/:id',
          name: 'EmailDetail',
          meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
          path: '/irankis',
          name: 'Irankis',
          meta: { requiresAuth: true }
        },
        {
          path: '/unauthorized',
          name: 'Unauthorized',
          meta: {}
        }
      ];
      
      expectedRoutes.forEach(route => {

        if (['/adminLanding', '/dashboard', '/emails/:id'].includes(route.path)) {
          expect(route.meta.requiresAdmin).toBe(true);
          expect(route.meta.requiresAuth).toBe(true);
        }
        
        if (route.path === '/irankis') {
          expect(route.meta.requiresAuth).toBe(true);
          expect(route.meta.requiresAdmin).toBeFalsy();
        }
        
        if (route.path === '/login') {
          expect(route.meta.requiresAuth).toBe(false);
        }
        
        if (route.path === '/unauthorized') {
          expect(route.meta.requiresAuth).toBeFalsy();
          expect(route.meta.requiresAdmin).toBeFalsy();
        }
      });
    });
  });
});
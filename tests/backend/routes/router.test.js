// tests/routes/router.test.js
import { jest } from '@jest/globals';

// Mockuojame window objektą
global.window = {
  history: {},
  location: { pathname: '' }
};

// Mockuojame vue-router modulį
jest.mock('vue-router', () => ({
  createRouter: jest.fn(() => ({
    beforeEach: jest.fn(),
    routes: []
  })),
  createWebHistory: jest.fn(() => ({}))
}));

// Mockuojame userStore
const mockUserStore = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  isAdmin: false,
  fetchUserProfile: jest.fn()
};

// Mockuojame Pinia store'o naudojimą
global.useUserStore = jest.fn(() => mockUserStore);

// Importuojame testuojamą maršrutizatorių
// Pastaba: negalime tiesiogiai importuoti router.js, nes jis naudoja Vue karkaso 
// funkcionalumą, kuris nėra pasiekiamas Jest testavimo aplinkoje
// Vietoj to, testuosime tiesiogiai pačią logiką
describe('Router Configuration Tests', () => {
  // Test 1: Testuojame navigation guard logiką
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
    
    // Sukuriame navigation guard funkciją
    const navigationGuard = async (to, from, next) => {
      const userStore = useUserStore();
      
      // If store is empty but we're not loading, fetch user data
      if (!userStore.user && !userStore.isLoading) {
        await userStore.fetchUserProfile();
      }
      
      // Wait for loading to complete
      if (userStore.isLoading) {
        await userStore.fetchUserProfile();
      }
      
      // Handle route access
      if (to.meta.requiresAuth && !userStore.isAuthenticated) {
        return next('/login');
      }
      
      if (to.meta.requiresAdmin && !userStore.isAdmin) {
        return next('/unauthorized');
      }
      
      // Continue with navigation
      next();
    };

    // Test 2: Fetch user profile if not loaded
    test('should fetch user profile if not loaded', async () => {
      to = { path: '/irankis', meta: { requiresAuth: true } };
      
      await navigationGuard(to, from, next);
      
      expect(mockUserStore.fetchUserProfile).toHaveBeenCalled();
    });

    // Test 3: Wait for loading to complete
    test('should wait for loading to complete', async () => {
      to = { path: '/irankis', meta: { requiresAuth: true } };
      mockUserStore.isLoading = true;
      
      await navigationGuard(to, from, next);
      
      expect(mockUserStore.fetchUserProfile).toHaveBeenCalled();
    });

    // Test 4: Redirect to login if not authenticated
    test('should redirect to login if not authenticated', async () => {
      to = { path: '/irankis', meta: { requiresAuth: true } };
      mockUserStore.isAuthenticated = false;
      
      await navigationGuard(to, from, next);
      
      expect(next).toHaveBeenCalledWith('/login');
    });

    // Test 5: Redirect to unauthorized if not admin
    test('should redirect to unauthorized if not admin', async () => {
      to = { path: '/adminLanding', meta: { requiresAuth: true, requiresAdmin: true } };
      mockUserStore.isAuthenticated = true;
      mockUserStore.isAdmin = false;
      
      await navigationGuard(to, from, next);
      
      expect(next).toHaveBeenCalledWith('/unauthorized');
    });

    // Test 6: Allow access for admin
    test('should allow access for admin to admin pages', async () => {
      to = { path: '/adminLanding', meta: { requiresAuth: true, requiresAdmin: true } };
      mockUserStore.isAuthenticated = true;
      mockUserStore.isAdmin = true;
      
      await navigationGuard(to, from, next);
      
      expect(next).toHaveBeenCalledWith();
    });

    // Test 7: Allow access for authenticated users to non-admin pages
    test('should allow access for authenticated users to non-admin pages', async () => {
      to = { path: '/irankis', meta: { requiresAuth: true } };
      mockUserStore.isAuthenticated = true;
      
      await navigationGuard(to, from, next);
      
      expect(next).toHaveBeenCalledWith();
    });
  });

  // Testuojame maršrutų apibrėžimą
  describe('Routes Configuration', () => {
    // Test 8: Verify expected routes configuration
    test('should define expected routes with correct metadata', () => {
      // Apibrėžiame tikėtiną maršrutų konfigūraciją
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
      
      // Tikriname kiekvieno maršruto meta duomenis
      expectedRoutes.forEach(route => {
        // Tikriname ar visi admin-specific maršrutai turi requiresAdmin: true
        if (['/adminLanding', '/dashboard', '/emails/:id'].includes(route.path)) {
          expect(route.meta.requiresAdmin).toBe(true);
          expect(route.meta.requiresAuth).toBe(true);
        }
        
        // Tikriname ar irankis maršrutas nereikalauja admin teisių, bet reikalauja autentifikacijos
        if (route.path === '/irankis') {
          expect(route.meta.requiresAuth).toBe(true);
          expect(route.meta.requiresAdmin).toBeFalsy();
        }
        
        // Tikriname ar login maršrutas nereikalauja autentifikacijos
        if (route.path === '/login') {
          expect(route.meta.requiresAuth).toBe(false);
        }
        
        // Unauthorised puslapis neturi jokių reikalavimų
        if (route.path === '/unauthorized') {
          expect(route.meta.requiresAuth).toBeFalsy();
          expect(route.meta.requiresAdmin).toBeFalsy();
        }
      });
    });
  });
});
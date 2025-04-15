// tests/plugins/navGuard.test.js
import { jest } from '@jest/globals';

// Sukuriame navGuard logiką be priklausomybės nuo Nuxt API
function createNavGuardLogic(userStore) {
  return async (to, from, next) => {
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
  };
}

describe('Navigation Guard Logic Tests', () => {
  // Mockuojame userStore
  let mockUserStore;
  // Mockuojame next funkciją
  let mockNext;
  // Navigation guard funkcija
  let guardFn;
  
  beforeEach(() => {
    // Inicializuojame mockus
    mockNext = jest.fn();
    mockUserStore = {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      isAdmin: false,
      fetchUserProfile: jest.fn(async () => {
        mockUserStore.isLoading = false;
        // Simuliuojame, kad funkcija kažką daro
        return Promise.resolve();
      })
    };
    
    // Sukuriame guardFn su mockuotu userStore
    guardFn = createNavGuardLogic(mockUserStore);
  });

  // Test 1: Testuojame navigaciją į login puslapį
  test('should allow navigation to login page without checks', async () => {
    const to = { path: '/login', meta: {} };
    const from = { path: '/' };
    
    await guardFn(to, from, mockNext);
    
    expect(mockNext).toHaveBeenCalledWith();
    expect(mockUserStore.fetchUserProfile).not.toHaveBeenCalled();
  });

  // Test 2: Testuojame, ar kraunami vartotojo duomenys, jei jų nėra
  test('should fetch user profile if not loaded', async () => {
    const to = { path: '/dashboard', meta: { requiresAuth: true } };
    const from = { path: '/' };
    
    await guardFn(to, from, mockNext);
    
    expect(mockUserStore.fetchUserProfile).toHaveBeenCalled();
  });

  // Test 3: Testuojame, ar užkraunami vartotojo duomenys, jei kraunasi
  test('should wait for loading to complete', async () => {
    mockUserStore.isLoading = true;
    
    const to = { path: '/dashboard', meta: { requiresAuth: true } };
    const from = { path: '/' };
    
    await guardFn(to, from, mockNext);
    
    expect(mockUserStore.fetchUserProfile).toHaveBeenCalled();
  });

  // Test 4: Testuojame nukreipimą į login, jei vartotojas neprisijungęs
  test('should redirect to login if not authenticated for auth required pages', async () => {
    const to = { path: '/dashboard', meta: { requiresAuth: true } };
    const from = { path: '/' };
    
    mockUserStore.isAuthenticated = false;
    
    await guardFn(to, from, mockNext);
    
    expect(mockNext).toHaveBeenCalledWith('/login');
  });

  // Test 5: Testuojame nukreipimą į unauthorized, jei vartotojas ne admin
  test('should redirect to unauthorized if not admin for admin pages', async () => {
    const to = { path: '/admin/dashboard', meta: { requiresAdmin: true } };
    const from = { path: '/' };
    
    mockUserStore.isAuthenticated = true;
    mockUserStore.isAdmin = false;
    
    await guardFn(to, from, mockNext);
    
    expect(mockNext).toHaveBeenCalledWith('/unauthorized');
  });

  // Test 6: Testuojame, kad admin gali pasiekti admin puslapius
  test('should allow admin to access admin pages', async () => {
    const to = { path: '/admin/dashboard', meta: { requiresAdmin: true } };
    const from = { path: '/' };
    
    mockUserStore.isAuthenticated = true;
    mockUserStore.isAdmin = true;
    
    await guardFn(to, from, mockNext);
    
    expect(mockNext).toHaveBeenCalledWith();
  });

  // Test 7: Testuojame, kad autentifikuoti vartotojai gali pasiekti public puslapius
  test('should allow authenticated users to access public pages', async () => {
    const to = { path: '/public', meta: {} };
    const from = { path: '/' };
    
    mockUserStore.isAuthenticated = true;
    
    await guardFn(to, from, mockNext);
    
    expect(mockNext).toHaveBeenCalledWith();
  });
});
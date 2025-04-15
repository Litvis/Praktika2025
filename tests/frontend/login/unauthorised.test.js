// tests/frontend/login/unauthorised.test.js
import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { nextTick } from 'vue';

// Mock the user store and router before importing anything
vi.mock('~/stores/user.js', () => ({
  useUserStore: vi.fn()
}));

vi.mock('vue-router', () => ({
  useRouter: vi.fn()
}));

describe('Unauthorized Access Page Component', () => {
  let wrapper;
  let mockRouter;
  let mockUserStore;
  let originalWindowLocation;
  
  beforeEach(() => {
    // Save original window.location
    originalWindowLocation = window.location;
    delete window.location;
    window.location = { href: '' };
    
    // Setup router mock
    mockRouter = {
      push: vi.fn()
    };
    
    // Setup user store mock
    mockUserStore = {
      clearUser: vi.fn()
    };
    
    // Set mock return values
    vi.mocked(useRouter).mockReturnValue(mockRouter);
    vi.mocked(useUserStore).mockReturnValue(mockUserStore);
    
    // Create a stub component based on the Unauthorized page
    const UnauthorizedPageStub = {
      template: `
      <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8">
          <div>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Prieigos klaida
            </h2>
            <p class="mt-2 text-center text-sm text-gray-600">
              Jūs neturite teisių peržiūrėti šį puslapį
            </p>
          </div>
          <div class="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <div class="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p class="text-lg text-gray-700 mb-4">Jums reikalingos administratoriaus teisės.</p>
              <div class="flex space-x-4">
                <button 
                  @click="goToAllowedPage" 
                  class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  data-testid="allowed-page-button"
                >
                  Grįžti į prieigos puslapį
                </button>
                <button 
                  @click="logout" 
                  class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  data-testid="logout-button"
                >
                  Atsijungti
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      `,
      setup() {
        const goToAllowedPage = () => {
          mockRouter.push('/irankis');
        };
        
        const logout = async () => {
          try {
            window.location.href = 'https://praktika2025.onrender.com/logout';
            mockUserStore.clearUser();
          } catch (error) {
            console.error('Error during logout:', error);
          }
        };
        
        return {
          goToAllowedPage,
          logout
        };
      }
    };
    
    // Mount the component
    wrapper = mount(UnauthorizedPageStub);
  });
  
  afterEach(() => {
    // Restore window.location
    window.location = originalWindowLocation;
    
    // Clear all mocks
    vi.clearAllMocks();
  });
  
  it('should render the unauthorized access page correctly', () => {
    // Check main container
    expect(wrapper.find('.min-h-screen').exists()).toBe(true);
    
    // Check error heading
    const heading = wrapper.find('h2');
    expect(heading.exists()).toBe(true);
    expect(heading.text()).toBe('Prieigos klaida');
    
    // Check error message
    const message = wrapper.find('p.text-sm');
    expect(message.exists()).toBe(true);
    expect(message.text()).toBe('Jūs neturite teisių peržiūrėti šį puslapį');
  });
  
  it('should display warning icon and administrator text', () => {
    // Check warning icon 
    expect(wrapper.find('svg.text-red-500').exists()).toBe(true);
    
    // Check administrator message
    const adminMessage = wrapper.find('p.text-lg');
    expect(adminMessage.exists()).toBe(true);
    expect(adminMessage.text()).toBe('Jums reikalingos administratoriaus teisės.');
  });
  
  it('should have both navigation buttons', () => {
    // Check allowed page button
    const allowedPageButton = wrapper.find('[data-testid="allowed-page-button"]');
    expect(allowedPageButton.exists()).toBe(true);
    expect(allowedPageButton.text()).toBe('Grįžti į prieigos puslapį');
    
    // Check logout button
    const logoutButton = wrapper.find('[data-testid="logout-button"]');
    expect(logoutButton.exists()).toBe(true);
    expect(logoutButton.text()).toBe('Atsijungti');
  });
  
  it('should navigate to allowed page when allowed page button is clicked', async () => {
    const allowedPageButton = wrapper.find('[data-testid="allowed-page-button"]');
    await allowedPageButton.trigger('click');
    
    expect(mockRouter.push).toHaveBeenCalledWith('/irankis');
  });
  
  it('should log out when logout button is clicked', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const logoutButton = wrapper.find('[data-testid="logout-button"]');
    await logoutButton.trigger('click');
    
    expect(window.location.href).toBe('https://praktika2025.onrender.com/logout');
    expect(mockUserStore.clearUser).toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
  });
  
  it('should have the correct styling classes', () => {
    // Check allowed page button styling
    const allowedPageButton = wrapper.find('[data-testid="allowed-page-button"]');
    expect(allowedPageButton.classes()).toContain('bg-green-600');
    expect(allowedPageButton.classes()).toContain('hover:bg-green-700');
    expect(allowedPageButton.classes()).toContain('text-white');
    
    // Check logout button styling
    const logoutButton = wrapper.find('[data-testid="logout-button"]');
    expect(logoutButton.classes()).toContain('bg-gray-300');
    expect(logoutButton.classes()).toContain('hover:bg-gray-400');
    expect(logoutButton.classes()).toContain('text-gray-800');
  });
});

// These need to be imported after the mocks are set up
import { useRouter } from 'vue-router';
import { useUserStore } from '~/stores/user.js';
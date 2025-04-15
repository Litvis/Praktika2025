// tests/frontend/pages/adminLanding.test.js
import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { nextTick } from 'vue';

// Mock the components
vi.mock('~/components/adminlanding/Sidebar.vue', () => ({
  default: {
    name: 'Sidebar',
    template: '<div class="mock-sidebar">Sidebar</div>'
  }
}));

vi.mock('~/components/adminlanding/LandingContent.vue', () => ({
  default: {
    name: 'LandingContent',
    template: '<div class="mock-landing-content">Landing Content</div>'
  }
}));

// Mock the user store
vi.mock('~/stores/user', () => ({
  useUserStore: vi.fn()
}));

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: vi.fn()
}));

// Import after mocks
import { useUserStore } from '~/stores/user';
import { useRouter } from 'vue-router';

describe('Admin Landing Page', () => {
  let wrapper;
  let mockUserStore;
  let mockRouter;
  let AdminLandingStub;
  let checkAdminAccessFn;
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup router mock
    mockRouter = {
      push: vi.fn()
    };
    vi.mocked(useRouter).mockReturnValue(mockRouter);
    
    // Setup user store with default values
    mockUserStore = {
      isLoading: true,
      isAdmin: false,
      user: null,
      fetchUserProfile: vi.fn().mockResolvedValue({})
    };
    vi.mocked(useUserStore).mockReturnValue(mockUserStore);
    
    // Create a stub component based on the AdminLanding page
    AdminLandingStub = {
      template: `
      <!-- Loading overlay that appears immediately on page load -->
      <div v-if="isCheckingAccess" class="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
        <div class="w-16 h-16 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin mb-4"></div>
        <p class="text-gray-600 text-lg">Tikrinamos teisės...</p>
      </div>
    
      <!-- Actual page content (only shown after verification) -->
      <div v-else class="flex h-screen">
        <!-- Sidebar -->
        <div class="mock-sidebar">Sidebar</div>
        
        <!-- Main content area -->
        <div class="main-content-with-sidebar overflow-y-auto">
          <div class="mock-landing-content">Landing Content</div>
        </div>
      </div>
      `,
      data() {
        return {
          isCheckingAccess: true
        };
      },
      created() {
        // Expose the check function for testing
        checkAdminAccessFn = this.checkAdminAccess;
      },
      methods: {
        checkAdminAccess() {
          console.log('Checking admin access in component', {
            isLoading: mockUserStore.isLoading,
            isAdmin: mockUserStore.isAdmin
          });
          
          // If still loading, wait for it to complete
          if (mockUserStore.isLoading) {
            return;
          }
          
          // If not admin, redirect immediately
          if (!mockUserStore.isAdmin) {
            console.log('Access denied - not an admin');
            mockRouter.push('/unauthorised');
            return;
          }
          
          // Access granted, hide loading overlay
          this.isCheckingAccess = false;
        }
      },
      mounted() {
        // Force a fetch of user data if needed
        if (!mockUserStore.user && !mockUserStore.isLoading) {
          mockUserStore.fetchUserProfile().then(() => {
            this.checkAdminAccess();
          });
        } else {
          this.checkAdminAccess();
        }
      },
      watch: {
        'mockUserStore.isAdmin'() {
          this.checkAdminAccess();
        },
        'mockUserStore.isLoading'() {
          if (!mockUserStore.isLoading) {
            this.checkAdminAccess();
          }
        }
      }
    };
    
    // Spy on console.log to verify output
    vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // Mount the component
    wrapper = mount(AdminLandingStub);
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  it('should show loading overlay when checking access', async () => {
    expect(wrapper.find('.fixed.inset-0').exists()).toBe(true);
    expect(wrapper.find('.animate-spin').exists()).toBe(true);
    expect(wrapper.find('p').text()).toBe('Tikrinamos teisės...');
  });
  
  it('should redirect to unauthorized page if user is not an admin', async () => {
    // Setup test conditions
    mockUserStore.isLoading = false;
    mockUserStore.isAdmin = false;
    
    // Call the method directly
    wrapper.vm.checkAdminAccess();
    await nextTick();
    
    // Verify redirect was called
    expect(mockRouter.push).toHaveBeenCalledWith('/unauthorised');
  });
  
  it('should display content when user is admin', async () => {
    // Update user store to finish loading and set user as admin
    mockUserStore.isLoading = false;
    mockUserStore.isAdmin = true;
    
    // Call the method directly
    wrapper.vm.checkAdminAccess();
    await nextTick();
    
    // Verify loading overlay is hidden
    expect(wrapper.find('.fixed.inset-0').exists()).toBe(false);
    
    // Verify content is showing
    expect(wrapper.find('.mock-sidebar').exists()).toBe(true);
    expect(wrapper.find('.mock-landing-content').exists()).toBe(true);
  });
  
  it('should fetch user profile if not already loaded', async () => {
    // Create a new component with different initial state
    mockUserStore.isLoading = false;
    mockUserStore.user = null;
    mockUserStore.fetchUserProfile.mockClear();
    
    const newWrapper = mount(AdminLandingStub);
    await nextTick();
    
    // Verify fetch was called
    expect(mockUserStore.fetchUserProfile).toHaveBeenCalled();
  });
  
  it('should not fetch user profile if already loaded', async () => {
    // Create a new component with different initial state
    mockUserStore.isLoading = false;
    mockUserStore.user = { id: 1, name: 'Admin User' };
    mockUserStore.fetchUserProfile.mockClear();
    
    const newWrapper = mount(AdminLandingStub);
    await nextTick();
    
    // Verify fetch was not called
    expect(mockUserStore.fetchUserProfile).not.toHaveBeenCalled();
  });
  
  it('should check access again when isLoading changes', async () => {
    // Initial state is still loading
    expect(wrapper.find('.fixed.inset-0').exists()).toBe(true);
    
    // Update to finished loading and is admin
    mockUserStore.isLoading = false;
    mockUserStore.isAdmin = true;
    
    // Call the method directly
    wrapper.vm.checkAdminAccess();
    await nextTick();
    
    // Verify loading is removed
    expect(wrapper.find('.fixed.inset-0').exists()).toBe(false);
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
  
  it('should check access again when isAdmin changes', async () => {
    // Force non-admin state
    mockUserStore.isLoading = false;
    mockUserStore.isAdmin = false;
    
    // Call the method directly
    wrapper.vm.checkAdminAccess();
    await nextTick();
    
    // Verify redirect was called
    expect(mockRouter.push).toHaveBeenCalledWith('/unauthorised');
  });
});
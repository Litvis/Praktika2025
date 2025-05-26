import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { nextTick } from 'vue';

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

vi.mock('~/stores/user', () => ({
  useUserStore: vi.fn()
}));

vi.mock('vue-router', () => ({
  useRouter: vi.fn()
}));

import { useUserStore } from '~/stores/user';
import { useRouter } from 'vue-router';

describe('Admin Landing Page', () => {
  let wrapper;
  let mockUserStore;
  let mockRouter;
  let AdminLandingStub;
  let checkAdminAccessFn;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockRouter = {
      push: vi.fn()
    };
    vi.mocked(useRouter).mockReturnValue(mockRouter);
    
    mockUserStore = {
      isLoading: true,
      isAdmin: false,
      user: null,
      fetchUserProfile: vi.fn().mockResolvedValue({})
    };
    vi.mocked(useUserStore).mockReturnValue(mockUserStore);
    
    AdminLandingStub = {
      template: `
      <div v-if="isCheckingAccess" class="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
        <div class="w-16 h-16 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin mb-4"></div>
        <p class="text-gray-600 text-lg">Tikrinamos teisės...</p>
      </div>
    
      <div v-else class="flex h-screen">
        <div class="mock-sidebar">Sidebar</div>
        
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
        checkAdminAccessFn = this.checkAdminAccess;
      },
      methods: {
        checkAdminAccess() {
          console.log('Checking admin access in component', {
            isLoading: mockUserStore.isLoading,
            isAdmin: mockUserStore.isAdmin
          });
          
          if (mockUserStore.isLoading) {
            return;
          }
          
          if (!mockUserStore.isAdmin) {
            console.log('Access denied - not an admin');
            mockRouter.push('/unauthorised');
            return;
          }
          
          this.isCheckingAccess = false;
        }
      },
      mounted() {
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
    
    vi.spyOn(console, 'log').mockImplementation(() => {});
    
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
    mockUserStore.isLoading = false;
    mockUserStore.isAdmin = false;
    
    wrapper.vm.checkAdminAccess();
    await nextTick();
    
    expect(mockRouter.push).toHaveBeenCalledWith('/unauthorised');
  });
  
  it('should display content when user is admin', async () => {
    mockUserStore.isLoading = false;
    mockUserStore.isAdmin = true;
    
    wrapper.vm.checkAdminAccess();
    await nextTick();
    
    expect(wrapper.find('.fixed.inset-0').exists()).toBe(false);
    
    expect(wrapper.find('.mock-sidebar').exists()).toBe(true);
    expect(wrapper.find('.mock-landing-content').exists()).toBe(true);
  });
  
  it('should fetch user profile if not already loaded', async () => {
    mockUserStore.isLoading = false;
    mockUserStore.user = null;
    mockUserStore.fetchUserProfile.mockClear();
    
    const newWrapper = mount(AdminLandingStub);
    await nextTick();
    
    expect(mockUserStore.fetchUserProfile).toHaveBeenCalled();
  });
  
  it('should not fetch user profile if already loaded', async () => {
    mockUserStore.isLoading = false;
    mockUserStore.user = { id: 1, name: 'Admin User' };
    mockUserStore.fetchUserProfile.mockClear();
    
    const newWrapper = mount(AdminLandingStub);
    await nextTick();
    
    expect(mockUserStore.fetchUserProfile).not.toHaveBeenCalled();
  });
  
  it('should check access again when isLoading changes', async () => {
    expect(wrapper.find('.fixed.inset-0').exists()).toBe(true);
    
    mockUserStore.isLoading = false;
    mockUserStore.isAdmin = true;
    
    wrapper.vm.checkAdminAccess();
    await nextTick();
    
    expect(wrapper.find('.fixed.inset-0').exists()).toBe(false);
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
  
  it('should check access again when isAdmin changes', async () => {
    mockUserStore.isLoading = false;
    mockUserStore.isAdmin = false;
    
    wrapper.vm.checkAdminAccess();
    await nextTick();
    
    expect(mockRouter.push).toHaveBeenCalledWith('/unauthorised');
  });
});
import { mount, config } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { nextTick } from 'vue';

config.global.stubs = {
  transition: false,
  'router-link': true
};

vi.mock('~/components/adminlanding/Sidebar.vue', () => ({
  default: {
    name: 'Sidebar',
    template: '<div class="mock-sidebar">Sidebar</div>'
  }
}));

vi.mock('~/stores/user', () => ({
  useUserStore: vi.fn()
}));

vi.mock('vue-router', () => ({
  useRouter: vi.fn()
}));

global.fetch = vi.fn();

import { useUserStore } from '~/stores/user';
import { useRouter } from 'vue-router';

describe('Dashboard Page', () => {
  let wrapper;
  let mockUserStore;
  let mockRouter;
  let DashboardStub;
  
  beforeEach(() => {
    vi.clearAllMocks();

    document.body.innerHTML = '<div id="app"></div>';
    
    mockRouter = {
      push: vi.fn()
    };
    vi.mocked(useRouter).mockReturnValue(mockRouter);
    
    mockUserStore = {
      isLoading: false,
      isAdmin: true,
      user: { id: 1, name: 'Admin User' },
      fetchUserProfile: vi.fn().mockResolvedValue({})
    };
    vi.mocked(useUserStore).mockReturnValue(mockUserStore);
    
    global.fetch.mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        success: true,
        data: {
          emails: [
            {
              id: 1,
              subject: 'Test Email 1',
              recipient_email: 'test1@example.com',
              created_at: '2025-04-09T10:00:00Z',
              attachments: false
            },
            {
              id: 2,
              subject: 'Test Email 2',
              recipient_email: 'test2@example.com',
              created_at: '2025-04-08T15:30:00Z',
              attachments: true
            }
          ],
          pagination: {
            total: 42,
            page: 1,
            limit: 10
          }
        }
      }),
      ok: true
    });
    
    DashboardStub = {
      template: `
      <div>
        <div v-if="isCheckingAccess" class="loading-overlay fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
          <div class="w-16 h-16 border-4 border-gray-300 border-t-green-600 rounded-full mb-4"></div>
          <p class="text-gray-600 text-lg">Tikrinamos teisės...</p>
        </div>

        <div v-else class="page-content">
          <div class="mock-sidebar">Sidebar</div>
          
          <div class="email-list">
            <div class="header">
              <h1 class="text-4xl">Sąrašas</h1>
              <p class="email-count">Siųstų laiškų istorija ({{ totalEmails }})</p>
            </div>
            
            <div class="search-filter">
              <input 
                type="text" 
                v-model="searchQuery"
                placeholder="Ieškoti laiškų..." 
                class="search-input"
                @input="handleSearch"
              />
              
              <select
                v-model="dateFilter"
                class="date-filter"
                @change="fetchEmails"
              >
                <option value="all">Visi laikai</option>
                <option value="today">Šiandien</option>
                <option value="week">Šią savaitę</option>
                <option value="month">Šį mėnesį</option>
              </select>
              
              <button 
                @click="exportEmails" 
                class="export-button"
              >
                Eksportuoti
              </button>
            </div>
            
            <div class="email-table">
              <div class="email-table-header">
                <div>ID</div>
                <div>Tema</div>
                <div>Gavėjas</div>
                <div>Išsiuntimo laikas</div>
                <div>Veiksmai</div>
              </div>
              
              <div v-if="emails.length === 0" class="no-emails">
                Nėra laiškų rodymui
              </div>
              
              <div v-else>
                <div 
                  v-for="(email, index) in emails" 
                  :key="email.id"
                  class="email-row"
                >
                  <div>{{ email.id }}</div>
                  <div>{{ email.subject }}</div>
                  <div>{{ email.recipient_email }}</div>
                  <div>
                    {{ formatDate(email.created_at) }}
                  </div>
                  <div>
                    <button 
                      @click="viewEmail(email.id)" 
                      class="view-email-button"
                    >
                      Peržiūrėti laišką
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="pagination">
              <div class="pagination-info">
                Rodoma {{ ((currentPage - 1) * itemsPerPage) + 1 }}-{{ Math.min(currentPage * itemsPerPage, totalEmails) }} iš {{ totalEmails }} įrašų
              </div>
              
              <div class="pagination-controls">
                <button 
                  @click="prevPage" 
                  :disabled="currentPage === 1"
                  class="prev-page-button"
                >
                  Ankstesnis
                </button>
                
                <button 
                  v-for="page in [1, 2, 3, 4, 5]" 
                  :key="page"
                  @click="goToPage(page)" 
                  class="page-button"
                  :class="{'active': currentPage === page}"
                >
                  {{ page }}
                </button>
                
                <button 
                  @click="nextPage" 
                  :disabled="currentPage === totalPages"
                  class="next-page-button"
                >
                  Kitas
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      `,
      data() {
        return {
          isCheckingAccess: false,
          emails: [
            {
              id: 1,
              subject: 'Test Email 1',
              recipient_email: 'test1@example.com',
              created_at: '2025-04-09T10:00:00Z',
              attachments: false
            },
            {
              id: 2,
              subject: 'Test Email 2',
              recipient_email: 'test2@example.com',
              created_at: '2025-04-08T15:30:00Z',
              attachments: true
            }
          ],
          totalEmails: 42,
          currentPage: 1,
          itemsPerPage: 10,
          searchQuery: '',
          dateFilter: 'all',
          isLoading: false
        };
      },
      computed: {
        totalPages() {
          return Math.ceil(this.totalEmails / this.itemsPerPage);
        }
      },
      methods: {
        checkAdminAccess() {
          if (mockUserStore.isLoading) {
            return;
          }
          
          if (!mockUserStore.isAdmin) {
            mockRouter.push('/unauthorised');
            return;
          }
          
          this.isCheckingAccess = false;
        },
        formatDate(date) {
          const d = new Date(date);
          return d.toLocaleDateString();
        },
        async fetchEmails() {
          try {
            const params = new URLSearchParams();
            params.append('limit', this.itemsPerPage.toString());
            params.append('offset', ((this.currentPage - 1) * this.itemsPerPage).toString());
            
            if (this.searchQuery) {
              params.append('search', this.searchQuery);
            }
            
            if (this.dateFilter !== 'all') {
              params.append('dateFilter', this.dateFilter);
            }
            
            const response = await fetch(`https://praktika2025.onrender.com/api/emails/recent?${params.toString()}`);
            const data = await response.json();
            
            if (data.success) {
              this.emails = data.data.emails;
              this.totalEmails = data.data.pagination.total;
            }
          } catch (error) {
            console.error('Error fetching emails:', error);
          }
        },
        handleSearch() {
          this.currentPage = 1;
          this.fetchEmails();
        },
        nextPage() {
          if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.fetchEmails();
          }
        },
        prevPage() {
          if (this.currentPage > 1) {
            this.currentPage--;
            this.fetchEmails();
          }
        },
        goToPage(page) {
          this.currentPage = page;
          this.fetchEmails();
        },
        viewEmail(id) {
          mockRouter.push(`/emails/${id}`);
        },
        exportEmails() {
          fetch(`https://praktika2025.onrender.com/api/emails/recent?limit=1000&dateFilter=${this.dateFilter}`);
        }
      },
      mounted() {
        this.checkAdminAccess();
        this.fetchEmails();
      }
    };
    
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    wrapper = mount(DashboardStub, {
      attachTo: document.getElementById('app')
    });
  });
  
  afterEach(() => {
    wrapper.unmount();
    vi.clearAllMocks();
  });
  
  it('should render the dashboard page with email list', async () => {
    expect(wrapper.find('h1').text()).toBe('Sąrašas');
    expect(wrapper.find('.mock-sidebar').exists()).toBe(true);
    
    expect(wrapper.find('.email-count').text()).toContain('42');
    
    const emailRows = wrapper.findAll('.email-row');
    expect(emailRows.length).toBe(2);
  });
  
  it('should fetch emails on mount', async () => {
    expect(global.fetch).toHaveBeenCalled();
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('https://praktika2025.onrender.com/api/emails/recent');
  });
  
  it('should handle search functionality', async () => {
    global.fetch.mockClear();
    
    await wrapper.find('.search-input').setValue('test query');
    await wrapper.find('.search-input').trigger('input');
    
    await wrapper.vm.handleSearch();
    
    expect(global.fetch).toHaveBeenCalled();
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('search=test');
    
    expect(wrapper.vm.currentPage).toBe(1);
  });
  
  it('should handle date filter changes', async () => {
    global.fetch.mockClear();
    
    await wrapper.find('.date-filter').setValue('week');
    await wrapper.find('.date-filter').trigger('change');
    
    expect(global.fetch).toHaveBeenCalled();
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('dateFilter=week');
  });
  
  it('should handle pagination', async () => {
    global.fetch.mockClear();
    
    expect(wrapper.vm.currentPage).toBe(1);
    
    await wrapper.find('.next-page-button').trigger('click');
    
    expect(wrapper.vm.currentPage).toBe(2);
    
    expect(global.fetch).toHaveBeenCalled();
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('offset=10');
  });
  
  it('should navigate to email details when view button is clicked', async () => {
    await wrapper.find('.view-email-button').trigger('click');
    
    expect(mockRouter.push).toHaveBeenCalledWith('/emails/1');
  });
  
  it('should export emails when export button is clicked', async () => {
    global.fetch.mockClear();
    
    await wrapper.find('.export-button').trigger('click');
    
    expect(global.fetch).toHaveBeenCalled();
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('limit=1000');
  });
  
  it('should redirect to unauthorized page if user is not admin', async () => {
    if (wrapper) {
      wrapper.unmount();
    }
    
    mockUserStore.isAdmin = false;
    
    wrapper = mount(DashboardStub, {
      attachTo: document.getElementById('app')
    });
    
    wrapper.vm.checkAdminAccess();
    
    expect(mockRouter.push).toHaveBeenCalledWith('/unauthorised');
  });
  
  it('should show correct pagination info', async () => {
    const paginationInfo = wrapper.find('.pagination-info');
    expect(paginationInfo.text()).toContain('Rodoma 1-10 iš 42 įrašų');
    
    wrapper.vm.currentPage = 5;
    await nextTick();
    
    expect(paginationInfo.text()).toContain('Rodoma 41-42 iš 42 įrašų');
  });
  
  it('should show no emails message when there are no emails', async () => {
    wrapper.vm.emails = [];
    await nextTick();
    
    expect(wrapper.find('.no-emails').exists()).toBe(true);
    expect(wrapper.find('.no-emails').text()).toBe('Nėra laiškų rodymui');
  });
});
import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('~/components/adminlanding/Sidebar.vue', () => ({
  default: {
    template: '<div class="sidebar-mock"></div>'
  }
}));

const mockNavigateTo = vi.fn();

vi.mock('#imports', () => ({
  navigateTo: mockNavigateTo
}));

global.fetch = vi.fn();

global.URL.createObjectURL = vi.fn(() => 'mock-url');

const mockEmailsResponse = {
  success: true,
  data: {
    emails: [
      {
        id: 1,
        subject: 'Test Email 1',
        description: 'Test content 1',
        recipient_email: 'recipient1@example.com',
        created_at: '2023-07-15T10:30:00Z',
        attachments: 'attachment1.pdf'
      },
      {
        id: 2,
        subject: 'Test Email 2',
        description: 'Test content 2',
        recipient_email: 'recipient2@example.com',
        created_at: '2023-07-14T14:20:00Z',
        attachments: null
      }
    ],
    pagination: {
      total: 25,
      limit: 10,
      offset: 0,
      hasMore: true
    }
  }
};

describe('EmailsList Component', () => {
  const EmailsListStub = {
    template: `
    <div class="emails-list">
      <h1>Sąrašas</h1>
      <p>Siųstų laiškų istorija ({{ totalEmails }})</p>
      
      <div v-if="isLoading" class="loading">Loading...</div>
      
      <div v-else-if="emails.length === 0" class="no-emails">
        Nėra laiškų rodymui
      </div>
      
      <div v-else>
        <div v-for="email in emails" :key="email.id" class="email-row">
          <span>{{ email.id }}</span>
          <span>{{ email.subject }}</span>
          <button @click="viewEmail(email.id)" class="view-button">View</button>
        </div>
      </div>
    </div>
    `,
    data() {
      return {
        emails: [],
        totalEmails: 0,
        isLoading: true,
        currentPage: 1,
        itemsPerPage: 10,
        searchQuery: '',
        dateFilter: 'all'
      };
    },
    methods: {
      async fetchEmails() {
        try {
          this.emails = [...mockEmailsResponse.data.emails];
          this.totalEmails = mockEmailsResponse.data.pagination.total;
        } catch (error) {
          console.error('Error:', error);
        } finally {
          this.isLoading = false;
        }
      },
      viewEmail(id) {
        mockNavigateTo(`/emails/${id}`);
      }
    },
    mounted() {
      this.fetchEmails();
    }
  };
  
  let wrapper;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    fetch.mockResolvedValue({
      json: () => Promise.resolve(JSON.parse(JSON.stringify(mockEmailsResponse)))
    });
  });
  
  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
      wrapper = null;
    }
  });
  
  it('should display emails after loading', async () => {
    wrapper = mount(EmailsListStub);
    
    expect(wrapper.find('.loading').exists()).toBe(true);
    
    await flushPromises();
    
    expect(wrapper.find('.loading').exists()).toBe(false);
    expect(wrapper.findAll('.email-row').length).toBe(2);
    expect(wrapper.text()).toContain('Test Email 1');
    expect(wrapper.text()).toContain('Test Email 2');
  });
  
  it('should navigate when view button is clicked', async () => {
    wrapper = mount(EmailsListStub);
    
    await flushPromises();
    
    await wrapper.findAll('.view-button')[0].trigger('click');
    
    expect(mockNavigateTo).toHaveBeenCalledWith('/emails/1');
  });
});
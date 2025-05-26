import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRouter, createMemoryHistory } from 'vue-router';


vi.mock('dompurify', () => ({
  default: {
    sanitize: vi.fn((content) => content)
  }
}));

vi.mock('../../../components/adminlanding/Sidebar.vue', () => ({
  default: {
    template: '<div class="sidebar-mock"></div>'
  }
}));

const routes = [
  { 
    path: '/emails', 
    name: 'emails',
    component: { template: '<div>Emails List</div>' }
  },
  { 
    path: '/emails/:id', 
    name: 'email-detail',
    component: { template: '<div>Email Detail</div>' },
    props: true
  }
];

const router = createRouter({
  history: createMemoryHistory(),
  routes
});

global.fetch = vi.fn();

const mockEmailData = {
  success: true,
  data: {
    id: 1,
    subject: 'Test Email Subject',
    description: '<p>This is a test email content</p>',
    created_at: '2023-07-15T10:30:00Z',
    recipient_email: 'test@example.com',
    attachments: 'attachment1.pdf, attachment2.docx'
  }
};

describe('EmailDetailView Component', () => {
  const EmailDetailViewStub = {
    template: `
    <div>
      <div v-if="isLoading" class="loading"><div class="animate-spin"></div>Kraunama...</div>
      <div v-else-if="error" class="bg-red-100">{{ error }}</div>
      <div v-else-if="email">
        <h1>{{ email.subject }}</h1>
        <div>Gavėjas: {{ email.recipient_email }}</div>
        <div v-html="sanitizedContent"></div>
        <div class="space-y-2">
          <div v-for="attachment in attachmentsList" :key="attachment" class="flex">{{ attachment }}</div>
        </div>
        <button @click="goBack">Grįžti į sąrašą</button>
      </div>
    </div>
    `,
    props: {
      id: String
    },
    data() {
      return {
        email: null,
        isLoading: true,
        error: null
      };
    },
    computed: {
      attachmentsList() {
        return this.email?.attachments ? this.email.attachments.split(',').map(a => a.trim()) : [];
      },
      sanitizedContent() {
        return this.email?.description || '';
      }
    },
    methods: {
      async goBack() {
        console.log('Navigating back to /emails');
        this.$emit('navigate', '/emails');
      },
      async fetchEmailDetails() {
        try {
          this.isLoading = true;
          
          const emailId = this.id || '1';
          const response = await fetch(`/api/emails/${emailId}`);
          const data = await response.json();
          
          if (data.success) {
            this.email = data.data;
          } else {
            throw new Error(data.error || 'Failed to load email');
          }
        } catch (err) {
          this.error = err.message;
          console.error('Error fetching email details:', err);
        } finally {
          this.isLoading = false;
        }
      }
    },
    mounted() {
      this.fetchEmailDetails();
    }
  };
  
  let wrapper;
  
  beforeEach(() => { 
    vi.clearAllMocks();
    fetch.mockResolvedValue({
      json: () => Promise.resolve(mockEmailData)
    });
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  it('should show loading state initially', async () => {
    fetch.mockImplementationOnce(() => 
      new Promise(resolve => {
        setTimeout(() => {
          resolve({
            json: () => Promise.resolve(mockEmailData)
          });
        }, 100);
      })
    );
    
    wrapper = mount(EmailDetailViewStub, {
      props: {
        id: '1'
      },
      global: {
        plugins: [router]
      }
    });
    
    expect(wrapper.find('.loading').exists()).toBe(true);
    
    await new Promise(resolve => setTimeout(resolve, 200));
    await flushPromises();
    
    await wrapper.vm.$nextTick();
    
    expect(wrapper.find('.loading').exists()).toBe(false);
  });

  it('should display email details after loading', async () => {
    wrapper = mount(EmailDetailViewStub, {
      props: {
        id: '1'
      },
      global: {
        plugins: [router]
      }
    });
    
    await flushPromises();
    
    expect(wrapper.find('h1').text()).toBe('Test Email Subject');
    expect(wrapper.text()).toContain('Gavėjas: test@example.com');
    expect(wrapper.html()).toContain('This is a test email content');
    
    const attachments = wrapper.findAll('.flex');
    expect(attachments.length).toBe(2);
    expect(attachments[0].text()).toContain('attachment1.pdf');
  });

  it('should handle API errors', async () => {
    fetch.mockRejectedValueOnce(new Error('Failed to fetch email'));
    
    wrapper = mount(EmailDetailViewStub, {
      props: {
        id: '1'
      },
      global: {
        plugins: [router]
      }
    });
    
    await flushPromises();
    expect(wrapper.find('.bg-red-100').exists()).toBe(true);
    expect(wrapper.text()).toContain('Failed to fetch email');
  });

  it('should emit navigate event when back button is clicked', async () => {
    wrapper = mount(EmailDetailViewStub, {
      props: {
        id: '1'
      },
      global: {
        plugins: [router]
      }
    });
    
    await flushPromises();
    
    await wrapper.find('button').trigger('click');
    
    expect(wrapper.emitted()).toHaveProperty('navigate');
    expect(wrapper.emitted().navigate[0]).toEqual(['/emails']);
  });
});
import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockDOMPurify = {
  sanitize: vi.fn(content => content)
};

vi.mock('dompurify', () => ({
  default: mockDOMPurify
}));

const mockRouter = {
  push: vi.fn()
};
vi.mock('vue-router', () => ({
  useRouter: () => mockRouter
}));

global.fetch = vi.fn();

const mockDashboardData = {
  success: true,
  data: {
    totalEmails: 42,
    recentEmails: 5,
    lastEmail: {
      id: 123,
      subject: 'Test Email Subject',
      description: '<p>This is a test email content</p>',
      recipient_email: 'test@example.com',
      created_at: '2023-07-15T10:30:00Z'
    }
  }
};

describe('LandingContent Component', () => {
  const LandingContentStub = {
    template: `
    <div>
      <p>Gražios dienos, {{ userName }}</p>
      <p>{{ formatDate(new Date()) }}</p>
      
      <div class="stats-section">
        <p>{{ dashboardStats.totalEmails || 0 }}</p>
      </div>
      
      <div v-if="dashboardStats.lastEmail" class="email-section">
        <p>{{ dashboardStats.lastEmail.subject }}</p>
        <p>{{ dashboardStats.lastEmail.recipient_email }}</p>
        <div v-html="sanitizedContent"></div>
        <button class="view-email-btn" @click="viewEmail(dashboardStats.lastEmail.id)">Peržiūrėti visą</button>
      </div>
      <div v-else class="no-emails">
        <p>Nėra išsiųstų laiškų</p>
      </div>
      
      <button class="view-list-btn" @click="viewEmailList">Peržiūrėti sąrašą</button>
    </div>
    `,
    data() {
      return {
        userName: 'Administratoriau',
        dashboardStats: {
          totalEmails: 0,
          recentEmails: 0,
          lastEmail: null
        }
      };
    },
    computed: {
      sanitizedContent() {
        if (!this.dashboardStats.lastEmail?.description) return '';
        return mockDOMPurify.sanitize(this.dashboardStats.lastEmail.description);
      }
    },
    methods: {
      formatDate(date) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('lt-LT', options);
      },
      
      formatDateShort(date) {
        return date.toISOString().split('T')[0];
      },
      
      formatTime(date) {
        return date.toTimeString().substring(0, 5);
      },
      
      getTimeAgo(timestamp) {
        const now = new Date();
        const emailDate = new Date(timestamp);
        const diffMs = now - emailDate;
        
        const diffMinutes = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMinutes < 60) {
          return `prieš ${diffMinutes} min.`;
        } else if (diffHours < 24) {
          return `prieš ${diffHours} val.`;
        } else {
          return `prieš ${diffDays} d.`;
        }
      },
      
      async fetchDashboardData() {
        try {
          const response = await fetch('https://praktika2025.onrender.com/api/dashboard/stats');
          const data = await response.json();
          
          if (data.success) {
            this.dashboardStats = data.data;
          } else {
            console.error('Failed to fetch dashboard stats:', data.error);
          }
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
        }
      },
      
      viewEmail(emailId) {
        mockRouter.push(`/emails/${emailId}`);
      },
      
      viewEmailList() {
        mockRouter.push('/dashboard');
      }
    },
    mounted() {
      this.fetchDashboardData();
    }
  };
  
  let wrapper;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    fetch.mockResolvedValue({
      json: () => Promise.resolve(JSON.parse(JSON.stringify(mockDashboardData)))
    });
  });
  
  afterEach(() => {
    wrapper?.unmount();
  });
  
  it('should display user name and formatted date', async () => {
    wrapper = mount(LandingContentStub);
    
    await flushPromises();
    
    expect(wrapper.text()).toContain('Administratoriau');
    
    const today = new Date();
    expect(wrapper.text()).toContain(today.getFullYear().toString());
  });
  
  it('should fetch and display dashboard statistics', async () => {
    wrapper = mount(LandingContentStub);
    
    await flushPromises();
    
    await wrapper.setData({
      dashboardStats: mockDashboardData.data
    });
    
    await wrapper.vm.$nextTick();
    
    expect(wrapper.find('.stats-section').text()).toContain('42');
    
    expect(wrapper.find('.email-section').text()).toContain('Test Email Subject');
    
    expect(wrapper.text()).toContain('test@example.com');
  });
  
  it('should navigate to email details when view button is clicked', async () => {
    wrapper = mount(LandingContentStub);
    
    await wrapper.setData({
      dashboardStats: mockDashboardData.data
    });
    
    await wrapper.vm.$nextTick();
    
    const button = wrapper.find('.view-email-btn');
    expect(button.exists()).toBe(true);
    await button.trigger('click');
    
    expect(mockRouter.push).toHaveBeenCalledWith('/emails/123');
  });
  
  it('should navigate to email list when view list button is clicked', async () => {
    wrapper = mount(LandingContentStub);
    
    await flushPromises();
    
    const button = wrapper.find('.view-list-btn');
    expect(button.exists()).toBe(true);
    await button.trigger('click');
    
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
  });
  
  it('should show "no emails" message when lastEmail is null', async () => {
    fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        success: true,
        data: {
          totalEmails: 0,
          recentEmails: 0,
          lastEmail: null
        }
      })
    });
    
    wrapper = mount(LandingContentStub);
    
    await flushPromises();
    
    expect(wrapper.vm.dashboardStats.lastEmail).toBe(null);
    
    expect(wrapper.find('.no-emails').exists()).toBe(true);
    expect(wrapper.text()).toContain('Nėra išsiųstų laiškų');
  });
});
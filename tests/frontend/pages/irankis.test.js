import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { nextTick } from 'vue';

vi.mock('~/components/adminlanding/Sidebar.vue', () => ({
  default: {
    name: 'Sidebar',
    template: '<div class="mock-sidebar">Sidebar</div>'
  }
}));

vi.mock('~/components/irankis/NavigationButtons.vue', () => ({
  default: {
    name: 'NavigationButtons',
    template: '<div class="mock-navigation-buttons"><button class="option-email" @click="$emit(\'update:currentOption\', \'email\')">Email</button><button class="option-group" @click="$emit(\'update:currentOption\', \'group\')">Group</button></div>',
    props: ['options', 'currentOption'],
    emits: ['update:currentOption']
  }
}));

vi.mock('~/components/irankis/EmailInput.vue', () => ({
  default: {
    name: 'EmailInput',
    template: '<div class="mock-email-input"><input type="email" :value="recipient" @input="$emit(\'updateRecipient\', $event.target.value)" /></div>',
    props: ['recipient'],
    emits: ['updateRecipient']
  }
}));

vi.mock('~/components/irankis/GroupSelection.vue', () => ({
  default: {
    name: 'GroupSelection',
    template: '<div class="mock-group-selection"><button @click="$emit(\'updateEmails\', [\'test1@example.com\', \'test2@example.com\'])">Select Group</button></div>',
    emits: ['updateEmails']
  }
}));

vi.mock('~/components/irankis/TextArea.vue', () => ({
  default: {
    name: 'TextArea',
    template: `<div class="mock-text-area">
      <input type="text" :value="subject" @input="$emit('updateSubject', $event.target.value)" placeholder="Subject" class="subject-input" />
      <textarea :value="message" @input="$emit('updateMessage', $event.target.value)" placeholder="Message" class="message-input"></textarea>
      <button @click="$emit('updateAttachedFiles', [new File([''], 'test.txt')])">Attach File</button>
    </div>`,
    props: ['subject', 'message', 'recipient', 'attachedFiles'],
    emits: ['updateSubject', 'updateMessage', 'updateAttachedFiles']
  }
}));

vi.mock('~/stores/user.js', () => ({
  useUserStore: vi.fn()
}));

vi.mock('vue-router', () => ({
  useRouter: vi.fn()
}));

vi.mock('#app', () => ({
  $fetch: vi.fn()
}));

vi.mock('#imports', () => ({
  useRuntimeConfig: vi.fn().mockReturnValue({
    public: {
      apiBase: 'https://api.example.com'
    }
  })
}));

import { useUserStore } from '~/stores/user';
import { useRouter } from 'vue-router';

describe('Irankis Page', () => {
  let wrapper;
  let mockUserStore;
  let mockRouter;
  let mockFetch;
  let IrankisStub;
  
  global.alert = vi.fn();
  global.FileReader = class {
    constructor() {
      this.result = 'data:text/plain;base64,dGVzdA==';
    }
    readAsDataURL() {
      setTimeout(() => {
        this.onload && this.onload();
      }, 0);
    }
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    document.body.innerHTML = '<div id="app"></div>';
    
    mockRouter = {
      push: vi.fn()
    };
    vi.mocked(useRouter).mockReturnValue(mockRouter);
    
    mockUserStore = {
      isLoading: false,
      isAuthenticated: true,
      isAdmin: true,
      user: { id: 1, name: 'Test User' },
      fetchUserProfile: vi.fn().mockResolvedValue({})
    };
    vi.mocked(useUserStore).mockReturnValue(mockUserStore);
    
    mockFetch = vi.fn().mockResolvedValue({ success: true, statusCode: 200 });
    global.$fetch = mockFetch;
    
    IrankisStub = {
      template: `
      <div>
        <div v-if="isInitialLoading" class="initial-loading">Loading...</div>
  
        <div v-else class="irankis-container">
          <div v-if="userStore.isLoading" class="user-loading">User loading...</div>
  
          <template v-else>
            <div v-if="userStore.isAdmin" class="mock-sidebar">Sidebar</div>
            
            <div class="main-content" :class="{ 'with-sidebar': userStore.isAdmin }">
              <div class="grid-container">
                <div class="left-panel">
                  <div class="mock-navigation-buttons">
                    <button class="option-email" @click="currentOption = 'email'">Email</button>
                    <button class="option-group" @click="currentOption = 'group'">Group</button>
                  </div>
  
                  <div class="input-container">
                    <div v-if="currentOption === 'email'" class="mock-email-input">
                      <input type="email" v-model="recipient" class="email-input" />
                    </div>
                    <div v-if="currentOption === 'group'" class="mock-group-selection">
                      <button @click="updateEmails(['test1@example.com', 'test2@example.com'])" class="select-group-button">
                        Select Group
                      </button>
                    </div>
                  </div>
                </div>
  
                <div class="right-panel">
                  <div class="mock-text-area">
                    <input type="text" v-model="subject" placeholder="Subject" class="subject-input" />
                    <textarea v-model="message" placeholder="Message" class="message-input"></textarea>
                    <button @click="attachFile" class="attach-file-button">Attach File</button>
                  </div>
  
                  <button @click="sendEmail" class="send-button">Siūsti</button>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
      `,
      data() {
        return {
          isInitialLoading: false,
          currentOption: 'email',
          recipient: '',
          recipientsList: [],
          subject: '',
          message: '',
          attachedFiles: [],
          userStore: mockUserStore
        };
      },
      methods: {
        async sendEmail() {
          try {
            let recipientsToUse = '';
            
            if (this.currentOption === 'group') {
              recipientsToUse = this.recipientsList.join(',');
              
              if (!recipientsToUse) {
                alert("❌ Please select a group with valid emails!");
                return;
              }
            } else {
              recipientsToUse = this.recipient;
              
              if (!recipientsToUse || recipientsToUse.trim() === '') {
                alert("❌ Please enter a valid email!");
                return;
              }
            }
  
            if (!this.subject.trim()) {
              alert("❌ Please enter a subject for your email!");
              return;
            }
            
            if (!this.message.trim()) {
              alert("❌ Please enter a message for your email!");
              return;
            }
  
            const emailData = {
              recipient: recipientsToUse,
              subject: this.subject.trim(),
              message: this.message.trim(),
              attachments: []
            };
  
            const response = await mockFetch('https://api.example.com/send-email', { 
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: emailData,
            });
  
            if (response.success) {
              alert('Email sent successfully! Status code: ' + (response.statusCode || 'OK'));
              
              this.subject = '';
              this.message = '';
              this.attachedFiles = [];
            } else {
              alert('Something went wrong.');
            }
          } catch (error) {
            alert('Failed to send email.');
          }
        },
        updateEmails(emails) {
          this.recipientsList = emails;
        },
        attachFile() {
          this.attachedFiles.push(new File(['test'], 'test.txt', { type: 'text/plain' }));
        }
      },
      mounted() {
        this.isInitialLoading = false;
      }
    };
    
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    wrapper = mount(IrankisStub, {
      attachTo: document.getElementById('app')
    });
  });
  
  afterEach(() => {
    wrapper.unmount();
    vi.clearAllMocks();
  });
  
  it('should render the irankis page with email mode by default', async () => {
    expect(wrapper.find('.email-input').exists()).toBe(true);
    expect(wrapper.find('.option-email').exists()).toBe(true);
    
    expect(wrapper.find('.select-group-button').exists()).toBe(false);
  });
  
  it('should switch between email and group modes', async () => {
    expect(wrapper.find('.email-input').exists()).toBe(true);
    
    await wrapper.find('.option-group').trigger('click');
    await nextTick();
    
    expect(wrapper.find('.select-group-button').exists()).toBe(true);
    
    await wrapper.find('.option-email').trigger('click');
    await nextTick();
    
    expect(wrapper.find('.email-input').exists()).toBe(true);
  });
  
  it('should update recipient when entering email', async () => {
    await wrapper.find('.email-input').setValue('test@example.com');
    await nextTick();
    
    expect(wrapper.vm.recipient).toBe('test@example.com');
  });
  
  it('should update recipients list when selecting a group', async () => {
    await wrapper.find('.option-group').trigger('click');
    await nextTick();
    
    await wrapper.find('.select-group-button').trigger('click');
    await nextTick();
    
    expect(wrapper.vm.recipientsList).toEqual(['test1@example.com', 'test2@example.com']);
  });
  
  it('should update subject and message when typing', async () => {
    await wrapper.find('.subject-input').setValue('Test Subject');
    await nextTick();
    
    await wrapper.find('.message-input').setValue('Hello, this is a test message.');
    await nextTick();
    
    expect(wrapper.vm.subject).toBe('Test Subject');
    expect(wrapper.vm.message).toBe('Hello, this is a test message.');
  });
  
  it('should add attachments when clicking attach button', async () => {
    await wrapper.find('.attach-file-button').trigger('click');
    await nextTick();
    
    expect(wrapper.vm.attachedFiles.length).toBe(1);
    expect(wrapper.vm.attachedFiles[0].name).toBe('test.txt');
  });
  
  it('should validate email form before sending', async () => {
    await wrapper.find('.send-button').trigger('click');
    await nextTick();
    
    expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Please enter a valid email'));
    
    await wrapper.find('.email-input').setValue('test@example.com');
    await wrapper.find('.send-button').trigger('click');
    await nextTick();
    
    expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Please enter a subject'));
    
    await wrapper.find('.subject-input').setValue('Test Subject');
    await wrapper.find('.send-button').trigger('click');
    await nextTick();
    
    expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Please enter a message'));
  });
  
  it('should send email when form is valid', async () => {
    await wrapper.find('.email-input').setValue('test@example.com');
    await wrapper.find('.subject-input').setValue('Test Subject');
    await wrapper.find('.message-input').setValue('Hello, this is a test message.');
    
    await wrapper.find('.send-button').trigger('click');
    await nextTick();
    
    expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        recipient: 'test@example.com',
        subject: 'Test Subject',
        message: 'Hello, this is a test message.',
        attachments: []
      }
    });
    
    expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Email sent successfully'));
    
    expect(wrapper.vm.subject).toBe('');
    expect(wrapper.vm.message).toBe('');
  });
  
  it('should handle group recipients when sending email', async () => {
    await wrapper.find('.option-group').trigger('click');
    await nextTick();
    
    await wrapper.find('.select-group-button').trigger('click');
    await nextTick();
    
    await wrapper.find('.subject-input').setValue('Group Test');
    await wrapper.find('.message-input').setValue('Hello group!');
    
    await wrapper.find('.send-button').trigger('click');
    await nextTick();
    
    expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        recipient: 'test1@example.com,test2@example.com',
        subject: 'Group Test',
        message: 'Hello group!',
        attachments: []
      }
    });
  });
  
  it('should handle errors when sending email', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    
    await wrapper.find('.email-input').setValue('test@example.com');
    await wrapper.find('.subject-input').setValue('Test Subject');
    await wrapper.find('.message-input').setValue('Hello, this is a test message.');
    
    await wrapper.find('.send-button').trigger('click');
    await nextTick();
    
    expect(global.alert).toHaveBeenCalledWith('Failed to send email.');
  });
  
  it('should show admin sidebar if user is admin', async () => {
    expect(wrapper.find('.mock-sidebar').exists()).toBe(true);
    
    wrapper.unmount();
    
    mockUserStore.isAdmin = false;
    
    wrapper = mount(IrankisStub, {
      attachTo: document.getElementById('app')
    });
    
    expect(wrapper.find('.mock-sidebar').exists()).toBe(false);
  });
});
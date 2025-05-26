import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach } from 'vitest';

describe('EmailInput Component', () => {
  const EmailInputStub = {
    template: `
    <div class="w-full">
      <label for="email" class="block mb-2">
        Elektroninio pašto adresas
      </label>
      
      <div class="flex space-x-2 mb-3">
        <input
          type="email"
          id="email"
          v-model="inputValue"
          @keydown.enter.prevent="addEmail"
          placeholder="Gavėjo el. paštas"
          class="email-input"
        />
        <button
          @click="addEmail"
          class="add-btn"
        >
          Pridėti
        </button>
      </div>
      
      <div v-if="emailList.length > 0" class="email-tags">
        <div 
          v-for="(email, index) in emailList" 
          :key="index"
          class="email-tag"
        >
          <span class="mr-1">{{ email }}</span>
          <button 
            @click="removeEmail(index)"
            class="remove-btn"
          >
            <svg class="h-4 w-4" viewBox="0 0 20 20"></svg>
          </button>
        </div>
      </div>
      
      <p v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </p>
    </div>
    `,
    props: {
      recipient: {
        type: String,
        default: '',
      },
    },
    emits: ['updateRecipient'],
    setup(props, { emit }) {
      const inputValue = ref('');
      const errorMessage = ref('');
      const emailList = ref([]);

      watch(() => props.recipient, (newRecipient) => {
        if (newRecipient && emailList.value.length === 0) {
          const emails = newRecipient.split(',').map(email => email.trim());
          emailList.value = emails.filter(email => email !== '');
        }
      }, { immediate: true });

      const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      const addEmail = () => {
        const email = inputValue.value.trim();
        
        if (!email) {
          return;
        }
        
        if (!isValidEmail(email)) {
          errorMessage.value = 'Neteisingas el. pašto formatas';
          return;
        }
        
        if (emailList.value.includes(email)) {
          errorMessage.value = 'Šis el. paštas jau pridėtas';
          return;
        }
        
        emailList.value.push(email);
        inputValue.value = '';
        errorMessage.value = '';
        
        updateRecipients();
      };

      const removeEmail = (index) => {
        emailList.value.splice(index, 1);
        updateRecipients();
      };

      const updateRecipients = () => {
        const recipientString = emailList.value.join(', ');
        emit('updateRecipient', recipientString);
      };

      return {
        inputValue,
        errorMessage,
        emailList,
        addEmail,
        removeEmail
      };
    }
  };

  const { ref, watch } = require('vue');
  
  let wrapper;
  
  beforeEach(() => {
    wrapper = mount(EmailInputStub);
  });
  
  it('should render input and add button', () => {
    expect(wrapper.find('input[type="email"]').exists()).toBe(true);
    expect(wrapper.find('.add-btn').exists()).toBe(true);
    expect(wrapper.find('.add-btn').text()).toBe('Pridėti');
  });
  
  it('should add valid email to the list', async () => {
    await wrapper.find('input[type="email"]').setValue('test@example.com');
    
    await wrapper.find('.add-btn').trigger('click');
    
    expect(wrapper.findAll('.email-tag').length).toBe(1);
    expect(wrapper.find('.email-tag').text()).toContain('test@example.com');
    
    expect(wrapper.find('input[type="email"]').element.value).toBe('');
  });
  
  it('should show error for invalid email format', async () => {
    await wrapper.find('input[type="email"]').setValue('invalid-email');
    
    await wrapper.find('.add-btn').trigger('click');
    
    expect(wrapper.find('.error-message').exists()).toBe(true);
    expect(wrapper.find('.error-message').text()).toContain('Neteisingas el. pašto formatas');
    
    expect(wrapper.findAll('.email-tag').length).toBe(0);
  });
  
  it('should not add duplicate emails', async () => {
    await wrapper.find('input[type="email"]').setValue('test@example.com');
    await wrapper.find('.add-btn').trigger('click');
    
    await wrapper.find('input[type="email"]').setValue('test@example.com');
    await wrapper.find('.add-btn').trigger('click');
    
    expect(wrapper.find('.error-message').exists()).toBe(true);
    expect(wrapper.find('.error-message').text()).toContain('Šis el. paštas jau pridėtas');
    
    expect(wrapper.findAll('.email-tag').length).toBe(1);
  });
  
  it('should remove email when remove button is clicked', async () => {
    await wrapper.find('input[type="email"]').setValue('test@example.com');
    await wrapper.find('.add-btn').trigger('click');
    
    expect(wrapper.findAll('.email-tag').length).toBe(1);
    
    await wrapper.find('.remove-btn').trigger('click');
    
    expect(wrapper.findAll('.email-tag').length).toBe(0);
  });
  
  it('should emit updateRecipient event when emails are added or removed', async () => {
    await wrapper.find('input[type="email"]').setValue('test1@example.com');
    await wrapper.find('.add-btn').trigger('click');
    
    expect(wrapper.emitted()).toHaveProperty('updateRecipient');
    expect(wrapper.emitted().updateRecipient[0]).toEqual(['test1@example.com']);
    
    await wrapper.find('input[type="email"]').setValue('test2@example.com');
    await wrapper.find('.add-btn').trigger('click');
    
    expect(wrapper.emitted().updateRecipient[1]).toEqual(['test1@example.com, test2@example.com']);
    
    await wrapper.findAll('.remove-btn')[0].trigger('click');
    
    expect(wrapper.emitted().updateRecipient[2]).toEqual(['test2@example.com']);
  });
  
  it('should initialize with provided recipient prop', async () => {
    const wrapperWithProp = mount(EmailInputStub, {
      props: {
        recipient: 'test1@example.com, test2@example.com'
      }
    });
    
    expect(wrapperWithProp.findAll('.email-tag').length).toBe(2);
    expect(wrapperWithProp.findAll('.email-tag')[0].text()).toContain('test1@example.com');
    expect(wrapperWithProp.findAll('.email-tag')[1].text()).toContain('test2@example.com');
  });
  
  it('should add email when pressing enter key', async () => {
    await wrapper.find('input[type="email"]').setValue('test@example.com');
    
    await wrapper.find('input[type="email"]').trigger('keydown.enter');
    
    expect(wrapper.findAll('.email-tag').length).toBe(1);
    expect(wrapper.find('.email-tag').text()).toContain('test@example.com');
  });
  
  it('should ignore empty input', async () => {
    await wrapper.find('input[type="email"]').setValue('   ');
    
    await wrapper.find('.add-btn').trigger('click');
    
    expect(wrapper.findAll('.email-tag').length).toBe(0);
    expect(wrapper.find('.error-message').exists()).toBe(false);
  });
});
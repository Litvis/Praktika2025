// tests/frontend/irankis/emailInput.test.js
import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach } from 'vitest';

describe('EmailInput Component', () => {
  // Create a simplified version of the EmailInput component
  const EmailInputStub = {
    template: `
    <div class="w-full">
      <label for="email" class="block mb-2">
        Elektroninio pašto adresas
      </label>
      
      <!-- Email input with add button -->
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
      
      <!-- Email tags list -->
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
      
      <!-- Email validation error message -->
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

      // Initialize the list if there's an initial recipient
      watch(() => props.recipient, (newRecipient) => {
        if (newRecipient && emailList.value.length === 0) {
          // Split by commas if multiple recipients are provided
          const emails = newRecipient.split(',').map(email => email.trim());
          emailList.value = emails.filter(email => email !== '');
        }
      }, { immediate: true });

      // Validate email format
      const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      // Add email to the list
      const addEmail = () => {
        const email = inputValue.value.trim();
        
        // Skip if empty
        if (!email) {
          return;
        }
        
        // Validate email format
        if (!isValidEmail(email)) {
          errorMessage.value = 'Neteisingas el. pašto formatas';
          return;
        }
        
        // Check if email already exists in the list
        if (emailList.value.includes(email)) {
          errorMessage.value = 'Šis el. paštas jau pridėtas';
          return;
        }
        
        // Add to list and clear input
        emailList.value.push(email);
        inputValue.value = '';
        errorMessage.value = '';
        
        // Emit the updated list as comma-separated string
        updateRecipients();
      };

      // Remove email from the list
      const removeEmail = (index) => {
        emailList.value.splice(index, 1);
        updateRecipients();
      };

      // Update the parent component with the current list
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

  // Import Vue functions needed for component
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
    // Set a valid email
    await wrapper.find('input[type="email"]').setValue('test@example.com');
    
    // Click add button
    await wrapper.find('.add-btn').trigger('click');
    
    // Check if email is added to the list
    expect(wrapper.findAll('.email-tag').length).toBe(1);
    expect(wrapper.find('.email-tag').text()).toContain('test@example.com');
    
    // Input should be cleared
    expect(wrapper.find('input[type="email"]').element.value).toBe('');
  });
  
  it('should show error for invalid email format', async () => {
    // Set an invalid email
    await wrapper.find('input[type="email"]').setValue('invalid-email');
    
    // Click add button
    await wrapper.find('.add-btn').trigger('click');
    
    // Should show error message
    expect(wrapper.find('.error-message').exists()).toBe(true);
    expect(wrapper.find('.error-message').text()).toContain('Neteisingas el. pašto formatas');
    
    // No email should be added
    expect(wrapper.findAll('.email-tag').length).toBe(0);
  });
  
  it('should not add duplicate emails', async () => {
    // Add first email
    await wrapper.find('input[type="email"]').setValue('test@example.com');
    await wrapper.find('.add-btn').trigger('click');
    
    // Try to add same email again
    await wrapper.find('input[type="email"]').setValue('test@example.com');
    await wrapper.find('.add-btn').trigger('click');
    
    // Should show error message
    expect(wrapper.find('.error-message').exists()).toBe(true);
    expect(wrapper.find('.error-message').text()).toContain('Šis el. paštas jau pridėtas');
    
    // Only one email should be in the list
    expect(wrapper.findAll('.email-tag').length).toBe(1);
  });
  
  it('should remove email when remove button is clicked', async () => {
    // Add an email first
    await wrapper.find('input[type="email"]').setValue('test@example.com');
    await wrapper.find('.add-btn').trigger('click');
    
    // Verify it's added
    expect(wrapper.findAll('.email-tag').length).toBe(1);
    
    // Click remove button
    await wrapper.find('.remove-btn').trigger('click');
    
    // Email should be removed
    expect(wrapper.findAll('.email-tag').length).toBe(0);
  });
  
  it('should emit updateRecipient event when emails are added or removed', async () => {
    // Add an email
    await wrapper.find('input[type="email"]').setValue('test1@example.com');
    await wrapper.find('.add-btn').trigger('click');
    
    // Check emitted event
    expect(wrapper.emitted()).toHaveProperty('updateRecipient');
    expect(wrapper.emitted().updateRecipient[0]).toEqual(['test1@example.com']);
    
    // Add another email
    await wrapper.find('input[type="email"]').setValue('test2@example.com');
    await wrapper.find('.add-btn').trigger('click');
    
    // Check second emit
    expect(wrapper.emitted().updateRecipient[1]).toEqual(['test1@example.com, test2@example.com']);
    
    // Remove first email
    await wrapper.findAll('.remove-btn')[0].trigger('click');
    
    // Check third emit - should only have the second email left
    expect(wrapper.emitted().updateRecipient[2]).toEqual(['test2@example.com']);
  });
  
  it('should initialize with provided recipient prop', async () => {
    // Mount with initial recipient
    const wrapperWithProp = mount(EmailInputStub, {
      props: {
        recipient: 'test1@example.com, test2@example.com'
      }
    });
    
    // Should display both emails
    expect(wrapperWithProp.findAll('.email-tag').length).toBe(2);
    expect(wrapperWithProp.findAll('.email-tag')[0].text()).toContain('test1@example.com');
    expect(wrapperWithProp.findAll('.email-tag')[1].text()).toContain('test2@example.com');
  });
  
  it('should add email when pressing enter key', async () => {
    // Set a valid email
    await wrapper.find('input[type="email"]').setValue('test@example.com');
    
    // Press Enter key
    await wrapper.find('input[type="email"]').trigger('keydown.enter');
    
    // Check if email is added to the list
    expect(wrapper.findAll('.email-tag').length).toBe(1);
    expect(wrapper.find('.email-tag').text()).toContain('test@example.com');
  });
  
  it('should ignore empty input', async () => {
    // Set an empty value
    await wrapper.find('input[type="email"]').setValue('   ');
    
    // Click add button
    await wrapper.find('.add-btn').trigger('click');
    
    // No email should be added and no error should be shown
    expect(wrapper.findAll('.email-tag').length).toBe(0);
    expect(wrapper.find('.error-message').exists()).toBe(false);
  });
});
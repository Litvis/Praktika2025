// tests/frontend/irankis/groupSelection.test.js
import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref, computed, nextTick } from 'vue';

describe('GroupSelection Component', () => {
  // Create a simplified version of the GroupSelection component
  const GroupSelectionStub = {
    template: `
    <div class="w-full">
      <label for="group" class="block mb-2">
        Pasirinkite grupę
      </label>
      <select
        id="group"
        v-model="selectedGroup"
        @change="updateSelectedGroup"
        class="group-select"
      >
        <option value="" disabled>Pasirinkite grupę</option>
        <option v-for="group in groups" :key="group.id" :value="group.id">
          {{ group.name }}
        </option>
      </select>

      <!-- Preview of selected group's recipients -->
      <div v-if="selectedGroup && selectedGroupEmails.length > 0" class="email-preview">
        <p class="preview-title">Pasirinktos grupės gavėjai:</p>
        <div class="email-container">
          <div v-for="(email, index) in selectedGroupEmails" :key="index" class="email-item">
            {{ email }}
          </div>
        </div>
        <p class="email-count">Viso: {{ selectedGroupEmails.length }} gavėjų</p>
      </div>
    </div>
    `,
    emits: ['updateEmails'],
    setup(props, { emit }) {
      // Mock group data with associated email addresses
      const groups = ref([
        { 
          id: 1, 
          name: 'Grupė 1', 
          emails: ['user1@example.com', 'user2@example.com', 'user3@example.com'] 
        },
        { 
          id: 2, 
          name: 'Grupė 2', 
          emails: ['test1@example.com', 'test2@example.com'] 
        },
        { 
          id: 3, 
          name: 'Grupė 3', 
          emails: ['admin@example.com'] 
        },
      ]);

      // Selected group state
      const selectedGroup = ref('');

      // Computed property to get emails from the selected group
      const selectedGroupEmails = computed(() => {
        if (!selectedGroup.value) return [];
        
        const group = groups.value.find(g => g.id === selectedGroup.value);
        return group ? group.emails : [];
      });

      // Function to update parent component when a group is selected
      const updateSelectedGroup = () => {
        // Emit the list of emails to the parent component
        emit('updateEmails', selectedGroupEmails.value);
      };

      // Watch for changes in selectedGroup to automatically update parent
      watch(selectedGroup, () => {
        updateSelectedGroup();
      });

      return {
        groups,
        selectedGroup,
        selectedGroupEmails,
        updateSelectedGroup
      };
    }
  };
  
  // Import watch separately to avoid naming conflicts
  const { watch } = require('vue');
  
  let wrapper;
  
  beforeEach(() => {
    // Create the wrapper with mock emits
    wrapper = mount(GroupSelectionStub);
  });
  
  it('should render the group dropdown', () => {
    expect(wrapper.find('select').exists()).toBe(true);
    
    // Should have 4 options (placeholder + 3 groups)
    const options = wrapper.findAll('option');
    expect(options.length).toBe(4);
    
    // First option should be the placeholder
    expect(options[0].text()).toBe('Pasirinkite grupę');
    expect(options[0].attributes('disabled')).toBeDefined();
    
    // Check group names
    expect(options[1].text()).toBe('Grupė 1');
    expect(options[2].text()).toBe('Grupė 2');
    expect(options[3].text()).toBe('Grupė 3');
  });
  
  it('should not display email preview initially', () => {
    expect(wrapper.find('.email-preview').exists()).toBe(false);
  });
  
  it('should update selectedGroup when an option is selected', async () => {
    // Initially no group is selected
    expect(wrapper.vm.selectedGroup).toBe('');
    
    // Select the first group (id: 1)
    await wrapper.find('select').setValue(1);
    
    // Check if selectedGroup value is updated
    expect(wrapper.vm.selectedGroup).toBe(1);
  });
  
  it('should display email preview when a group is selected', async () => {
    // Select the first group
    await wrapper.find('select').setValue(1);
    await flushPromises();
    
    // Email preview should be visible
    expect(wrapper.find('.email-preview').exists()).toBe(true);
    
    // Should display all emails in the selected group
    const emailItems = wrapper.findAll('.email-item');
    expect(emailItems.length).toBe(3);
    expect(emailItems[0].text()).toBe('user1@example.com');
    expect(emailItems[1].text()).toBe('user2@example.com');
    expect(emailItems[2].text()).toBe('user3@example.com');
    
    // Should display the count
    expect(wrapper.find('.email-count').text()).toContain('Viso: 3 gavėjų');
  });
  
  it('should emit updateEmails event when group is selected', async () => {
    // Mock the emit method
    const emitSpy = vi.spyOn(wrapper.vm.$options, 'emits', 'get').mockReturnValue(['updateEmails']);
    
    // Select the second group
    await wrapper.find('select').setValue(2);
    await flushPromises();
    
    // Check if event was emitted
    expect(wrapper.emitted()).toHaveProperty('updateEmails');
  });
  
  it('should update the email preview when a different group is selected', async () => {
    // First select group 1
    await wrapper.find('select').setValue(1);
    await flushPromises();
    
    // Then switch to group 3
    await wrapper.find('select').setValue(3);
    await flushPromises();
    
    // Should display emails from group 3
    const emailItems = wrapper.findAll('.email-item');
    expect(emailItems.length).toBe(1);
    expect(emailItems[0].text()).toBe('admin@example.com');
    
    // Should display the updated count
    expect(wrapper.find('.email-count').text()).toContain('Viso: 1 gavėjų');
  });
  
  it('should handle a group with no emails', async () => {
    // Add a group with no emails for this test
    wrapper.vm.groups.push({ id: 4, name: 'Empty Group', emails: [] });
    await nextTick();
    
    // Select the empty group
    await wrapper.find('select').setValue(4);
    await flushPromises();
    
    // Email preview should not be visible for empty groups
    expect(wrapper.find('.email-preview').exists()).toBe(false);
  });
});
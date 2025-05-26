import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref, computed, nextTick } from 'vue';

describe('GroupSelection Component', () => {
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

      const selectedGroup = ref('');
      const selectedGroupEmails = computed(() => {
        if (!selectedGroup.value) return [];
        
        const group = groups.value.find(g => g.id === selectedGroup.value);
        return group ? group.emails : [];
      });

      const updateSelectedGroup = () => {
        emit('updateEmails', selectedGroupEmails.value);
      };

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
  
  const { watch } = require('vue');
  
  let wrapper;
  
  beforeEach(() => {
    wrapper = mount(GroupSelectionStub);
  });
  
  it('should render the group dropdown', () => {
    expect(wrapper.find('select').exists()).toBe(true);
    const options = wrapper.findAll('option');
    expect(options.length).toBe(4);
    expect(options[0].text()).toBe('Pasirinkite grupę');
    expect(options[0].attributes('disabled')).toBeDefined();
    expect(options[1].text()).toBe('Grupė 1');
    expect(options[2].text()).toBe('Grupė 2');
    expect(options[3].text()).toBe('Grupė 3');
  });
  
  it('should not display email preview initially', () => {
    expect(wrapper.find('.email-preview').exists()).toBe(false);
  });
  
  it('should update selectedGroup when an option is selected', async () => {
    expect(wrapper.vm.selectedGroup).toBe('');
    
    await wrapper.find('select').setValue(1);

    expect(wrapper.vm.selectedGroup).toBe(1);
  });
  
  it('should display email preview when a group is selected', async () => {
    await wrapper.find('select').setValue(1);
    await flushPromises();
    
    expect(wrapper.find('.email-preview').exists()).toBe(true);

    const emailItems = wrapper.findAll('.email-item');
    expect(emailItems.length).toBe(3);
    expect(emailItems[0].text()).toBe('user1@example.com');
    expect(emailItems[1].text()).toBe('user2@example.com');
    expect(emailItems[2].text()).toBe('user3@example.com');

    expect(wrapper.find('.email-count').text()).toContain('Viso: 3 gavėjų');
  });
  
  it('should emit updateEmails event when group is selected', async () => {
    const emitSpy = vi.spyOn(wrapper.vm.$options, 'emits', 'get').mockReturnValue(['updateEmails']);
    
    await wrapper.find('select').setValue(2);
    await flushPromises();
    
    expect(wrapper.emitted()).toHaveProperty('updateEmails');
  });
  
  it('should update the email preview when a different group is selected', async () => {
    await wrapper.find('select').setValue(1);
    await flushPromises();
    
    await wrapper.find('select').setValue(3);
    await flushPromises();
    

    const emailItems = wrapper.findAll('.email-item');
    expect(emailItems.length).toBe(1);
    expect(emailItems[0].text()).toBe('admin@example.com');
    
    expect(wrapper.find('.email-count').text()).toContain('Viso: 1 gavėjų');
  });
  
  it('should handle a group with no emails', async () => {
    wrapper.vm.groups.push({ id: 4, name: 'Empty Group', emails: [] });
    await nextTick();
    await wrapper.find('select').setValue(4);
    await flushPromises();
    
    expect(wrapper.find('.email-preview').exists()).toBe(false);
  });
});
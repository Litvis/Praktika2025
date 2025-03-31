<template>
  <div class="w-full">
    <label for="group" class="block text-sm md:text-md font-medium text-gray-700 mb-2">
      Pasirinkite grupę
    </label>
    <select
      id="group"
      v-model="selectedGroup"
      @change="updateSelectedGroup"
      class="w-full px-3 py-2 md:px-4 md:py-2 text-sm md:text-base text-gray-700 
             border-2 border-green-600 rounded-md shadow-lg 
             focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-green-800"
    >
      <option value="" disabled>Pasirinkite grupę</option>
      <option v-for="group in groups" :key="group.id" :value="group.id">
        {{ group.name }}
      </option>
    </select>

    <!-- Preview of selected group's recipients -->
    <div v-if="selectedGroup && selectedGroupEmails.length > 0" class="mt-3 md:mt-4">
      <p class="text-xs md:text-sm font-medium text-gray-700">Pasirinktos grupės gavėjai:</p>
      <div class="mt-1 md:mt-2 p-2 border rounded-md bg-gray-50 max-h-32 overflow-y-auto">
        <div v-for="(email, index) in selectedGroupEmails" :key="index" class="text-xs md:text-sm text-gray-600">
          {{ email }}
        </div>
      </div>
      <p class="text-[10px] md:text-xs text-gray-500 mt-1">Viso: {{ selectedGroupEmails.length }} gavėjų</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';

const emit = defineEmits(['updateEmails']);

// Mock group data with associated email addresses
const groups = [
  { 
    id: 1, 
    name: 'Grupė 1', 
    emails: ['deividaslita@gmail.com', 'deividasnebutina9@gmail.com', 'deividaslitvis@gmail.com'] 
  },
  { 
    id: 2, 
    name: 'Grupė 2', 
    emails: ['deividaslita@gmail.com', 'deividasnebutina9@gmail.com', 'deividaslitvis@gmail.com']
  },
  { 
    id: 3, 
    name: 'Grupė 3', 
    emails: ['deividaslita@gmail.com', 'deividasnebutina9@gmail.com', 'deividaslitvis@gmail.com'] 
  },
];

// Selected group state
const selectedGroup = ref('');

// Computed property to get emails from the selected group
const selectedGroupEmails = computed(() => {
  if (!selectedGroup.value) return [];
  
  const group = groups.find(g => g.id === selectedGroup.value);
  return group ? group.emails : [];
});

// Function to update parent component when a group is selected
const updateSelectedGroup = () => {
  console.log('🔄 Group selected:', selectedGroup.value);
  console.log('📧 Emails to send:', selectedGroupEmails.value);
  
  // Emit the list of emails to the parent component
  emit('updateEmails', selectedGroupEmails.value);
};

// Watch for changes in selectedGroup to automatically update parent
watch(selectedGroup, () => {
  updateSelectedGroup();
});
</script>
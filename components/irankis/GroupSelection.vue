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
      :disabled="isLoading"
    >
      <option value="" disabled>{{ isLoading ? 'Kraunama...' : 'Pasirinkite grupę' }}</option>
      <option v-for="group in groups" :key="group.id" :value="group.id">
        {{ group.name }}
      </option>
    </select>

    <div v-if="isLoading" class="mt-2 flex items-center">
      <div class="w-4 h-4 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin mr-2"></div>
      <span class="text-xs text-gray-500">Kraunamos grupės...</span>
    </div>

    <div v-if="error" class="mt-2 text-xs text-red-500">
      {{ error }}
    </div>

    <div v-if="selectedGroup && selectedGroupEmails.length > 0" class="mt-3 md:mt-4">
      <div class="flex justify-between items-center">
        <p class="text-xs md:text-sm font-medium text-gray-700">Pasirinktos grupės gavėjai:</p>
        <p class="text-[10px] md:text-xs text-gray-500">Viso: {{ selectedGroupEmails.length }} gavėjų</p>
      </div>
      
      <div v-if="isLoadingEmails" class="mt-2 flex items-center justify-center p-4">
        <div class="w-4 h-4 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin mr-2"></div>
        <span class="text-xs text-gray-500">Kraunami gavėjų adresai...</span>
      </div>
      
      <div v-else class="mt-1 md:mt-2 p-2 border rounded-md bg-gray-50 max-h-32 overflow-y-auto">
        <div v-for="(email, index) in selectedGroupEmails" :key="index" class="text-xs md:text-sm text-gray-600">
          {{ email }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';

const emit = defineEmits(['updateEmails']);

const groups = ref([]);
const selectedGroup = ref('');
const selectedGroupEmails = ref([]);
const isLoading = ref(true);
const isLoadingEmails = ref(false);
const error = ref(null);
const config = useRuntimeConfig();
const apiBase = config.public.apiBase;

const fetchGroups = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    const response = await fetch(`${apiBase.value}/api/groups`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      groups.value = data.groups;
      console.log('Loaded groups:', groups.value);
    } else {
      throw new Error(data.error || 'Nepavyko užkrauti grupių');
    }
  } catch (err) {
    console.error('Error fetching groups:', err);
    error.value = 'Nepavyko užkrauti grupių. Bandykite dar kartą vėliau.';
  } finally {
    isLoading.value = false;
  }
};

const fetchGroupEmails = async (groupId) => {
  if (!groupId) {
    selectedGroupEmails.value = [];
    emit('updateEmails', []);
    return;
  }
  
  try {
    isLoadingEmails.value = true;
    error.value = null;
    
    const response = await fetch(`${apiBase.value}/api/groups/${groupId}/emails`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      selectedGroupEmails.value = data.emails;
      console.log('Loaded emails:', selectedGroupEmails.value);
      emit('updateEmails', data.emails);
    } else {
      throw new Error(data.error || 'Nepavyko užkrauti gavėjų adresų');
    }
  } catch (err) {
    console.error('Error fetching group emails:', err);
    error.value = 'Nepavyko užkrauti gavėjų adresų. Bandykite dar kartą vėliau.';
    selectedGroupEmails.value = [];
    emit('updateEmails', []);
  } finally {
    isLoadingEmails.value = false;
  }
};

const updateSelectedGroup = () => {
  console.log('🔄 Group selected:', selectedGroup.value);
  fetchGroupEmails(selectedGroup.value);
};

watch(selectedGroup, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    updateSelectedGroup();
  }
});

onMounted(() => {
  fetchGroups();
});
</script>

<style scoped>
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
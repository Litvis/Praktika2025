<template>
  <div v-if="isCheckingAccess" class="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
    <div class="w-16 h-16 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin mb-4"></div>
    <p class="text-gray-600 text-lg">Tikrinamos teisės...</p>
  </div>

  <div v-else class="flex h-screen bg-gray-50">
    <Sidebar />
    <div class="main-content-with-sidebar flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-y-auto">
      <div v-if="isLoading" class="flex-grow flex items-center justify-center">
        <div class="inline-block w-8 h-8 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
        <p class="ml-3 text-gray-500">Kraunama...</p>
      </div>

      <div v-else-if="error" class="flex-grow flex items-center justify-center">
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {{ error }}
        </div>
      </div>

      <div v-else-if="email" class="px-8 py-6">
        <div class="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h1 class="font-bold text-2xl text-gray-800">{{ email.subject }}</h1>
            <div class="mt-2 text-sm text-gray-600 flex flex-col space-y-1">
              <div class="flex justify-between items-center">
                <span>
                  <span class="font-medium">Siuntėjas:</span> 
                  {{ formatSender(email) }}
                </span>
                <span>
                  Išsiųsta: 
                  {{ formatDay(new Date(email.created_at)) }} 
                  {{ formatTime(new Date(email.created_at)) }}
                </span>
              </div>
              
              <div>
                <span class="font-medium">Gavėjas:</span>
                <span v-if="recipientCount > 2" class="relative">
                  <span>{{ recipientCount }} gavėjai</span>
                  <span 
                    @mouseover="showTooltip = true" 
                    @mouseleave="showTooltip = false"
                    class="ml-1 cursor-pointer text-gray-500 hover:text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <div 
                    v-if="showTooltip" 
                    class="absolute z-10 w-64 px-3 py-2 bg-gray-800 text-white text-xs rounded shadow-lg"
                    style="bottom: 20px; left: 0;"
                  >
                    <div class="mb-1 font-medium">Visi gavėjai:</div>
                    <div v-for="(recipient, index) in recipientsList" :key="index" class="truncate">
                      {{ recipient }}
                    </div>
                  </div>
                </span>
                <span v-else>{{ email.recipient_email }}</span>
              </div>
            </div>
          </div>

          <div class="p-6">
            <div 
              class="text-gray-700" 
              v-html="formatEmailContent(email.description)"
            ></div>
          </div>

          <div v-if="email.attachments" class="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <h3 class="text-lg font-semibold text-gray-700 mb-3">Priedai</h3>
            <div class="space-y-2">
              <div 
                v-for="(attachment, index) in attachmentsList" 
                :key="index" 
                class="flex items-center text-sm text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                {{ attachment }}
              </div>
            </div>
          </div>

          <div class="px-6 py-4 bg-white border-t border-gray-200 flex justify-between items-center">
            <button 
              @click="goBack" 
              class="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Grįžti į sąrašą
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import Sidebar from '~/components/adminlanding/Sidebar.vue';
import { useUserStore } from '~/stores/user';
import { useRouter, useRoute } from 'vue-router';
import DOMPurify from 'dompurify';

const userStore = useUserStore();
const router = useRouter();
const route = useRoute();
const config = useRuntimeConfig();
const apiBase = config.public.apiBase;
const isCheckingAccess = ref(true);
const showTooltip = ref(false);

async function checkAdminAccess() {
  console.log('Checking admin access in component', {
    isLoading: userStore.isLoading,
    isAdmin: userStore.isAdmin
  });
  
  if (userStore.isLoading) {
    return;
  }
  
  if (!userStore.isAdmin) {
    console.log('Access denied - not an admin');
    router.push('/unauthorised');
    return;
  }
  isCheckingAccess.value = false;
}

onMounted(() => {
  if (!userStore.user && !userStore.isLoading) {
    userStore.fetchUserProfile().then(() => {
      checkAdminAccess();
      if (!isCheckingAccess.value) {
        fetchEmailDetails();
      }
    });
  } else {
    checkAdminAccess();
    if (!isCheckingAccess.value) {
      fetchEmailDetails();
    }
  }
});

watch(() => isCheckingAccess.value, (newValue, oldValue) => {
  if (oldValue === true && newValue === false) {
    fetchEmailDetails();
  }
});

const email = ref(null);
const isLoading = ref(true);
const error = ref(null);

const recipientsList = computed(() => {
  if (!email.value || !email.value.recipient_email) return [];
  return email.value.recipient_email.split(',').map(email => email.trim());
});

const recipientCount = computed(() => {
  return recipientsList.value.length;
});

const formatSender = (email) => {
  if (email.sender_name && email.sender_email) {
    return `${email.sender_name} (${email.sender_email})`;
  } else if (email.sender_name) {
    return email.sender_name;
  } else if (email.sender_email) {
    return email.sender_email;
  } else {
    return 'Sistema';
  }
};

const fetchEmailDetails = async () => {
  try {
    isLoading.value = true;
    const emailId = route.params.id;
    
    console.log('Fetching email details for ID:', emailId);
    
    const response = await $fetch(`${apiBase}/api/emails/${emailId}`);
    
    console.log('Received response:', response);
    
    if (response.success) {
      email.value = response.data;
    } else {
      throw new Error(response.error || 'Nepavyko gauti laiško duomenų');
    }
  } catch (err) {
    console.error('Error fetching email details:', err);
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

const attachmentsList = computed(() => {
  return email.value?.attachments ? email.value.attachments.split(',').map(a => a.trim()) : [];
});

const formatDay = (date) => {
  return date.toLocaleDateString('lt-LT', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const formatTime = (date) => {
  return date.toLocaleTimeString('lt-LT', { hour: '2-digit', minute: '2-digit' });
};

const formatEmailContent = (content) => {
  if (!content) return '';
  return DOMPurify.sanitize(content);
};

const goBack = () => {
  router.push('/dashboard');
};
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
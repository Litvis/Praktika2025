<template>
    <div class="flex flex-row h-screen bg-gray-50">
      <Sidebar />
      <div class="w-3/4 flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-y-auto">
        <!-- Header Section -->
        <div class="px-8 py-6">
          <h1 class="font-bold text-4xl text-gray-800">Laiško Informacija</h1>
        </div>
  
        <!-- Loading State -->
        <div v-if="isLoading" class="flex-grow flex items-center justify-center">
          <div class="text-gray-500">Kraunama...</div>
        </div>
  
        <!-- Error State -->
        <div v-else-if="error" class="flex-grow flex items-center justify-center">
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {{ error }}
          </div>
        </div>
  
        <!-- Email Details -->
        <div v-else-if="email" class="px-8 pb-8">
          <div class="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <!-- Email Header -->
            <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 class="text-2xl font-bold text-gray-800">{{ email.subject }}</h2>
              <div class="mt-2 text-sm text-gray-600 flex justify-between items-center">
                <span>Gavėjas: {{ email.recipient_email }}</span>
                <span>
                  Išsiųsta: 
                  {{ formatDay(new Date(email.created_at)) }} 
                  {{ formatTime(new Date(email.created_at)) }}
                </span>
              </div>
            </div>
  
            <!-- Email Body -->
            <div class="p-6">
              <div 
                class="prose max-w-none" 
                v-html="formatEmailContent(email.description)"
              ></div>
            </div>
  
            <!-- Attachments Section -->
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
  
            <!-- Navigation -->
            <div class="px-6 py-4 bg-white border-t border-gray-200">
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
  import { ref, computed, onMounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import Sidebar from '~/components/adminlanding/Sidebar.vue';
  
  // Reactive state
  const email = ref(null);
  const isLoading = ref(true);
  const error = ref(null);
  
  // Router and route
  const route = useRoute();
  const router = useRouter();
  
  // Fetch email details
  const fetchEmailDetails = async () => {
    try {
      isLoading.value = true;
      const emailId = route.params.id;
      
      const response = await fetch(`https://praktika2025.onrender.com/api/emails/${emailId}`);
      const data = await response.json();
      
      if (data.success) {
        email.value = data.data;
      } else {
        throw new Error(data.error || 'Nepavyko gauti laiško duomenų');
      }
    } catch (err) {
      error.value = err.message;
      console.error('Error fetching email details:', err);
    } finally {
      isLoading.value = false;
    }
  };
  
  // Computed list of attachments
  const attachmentsList = computed(() => {
    return email.value?.attachments ? email.value.attachments.split(',').map(a => a.trim()) : [];
  });
  
  // Format date
  const formatDay = (date) => {
    return date.toLocaleDateString('lt-LT', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };
  
  // Format time
  const formatTime = (date) => {
    return date.toLocaleTimeString('lt-LT', { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format email content (optional: remove potential XSS)
  const formatEmailContent = (content) => {
    // Basic XSS prevention and line break conversion
    return content
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
  };
  
  // Navigation
  const goBack = () => {
    router.push('/emails');
  };
  
  // Fetch email details when component mounts
  onMounted(() => {
    fetchEmailDetails();
  });
  </script>
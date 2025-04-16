<template>
  <div class="w-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
    <!-- Greeting Header -->
    <div class="p-8">
      <p class="font-bold text-5xl text-gray-800 leading-tight">
        Gražios dienos,<br> 
        <span class="text-gray-800">{{ userName }}</span>
      </p>
      <p class="text-gray-500 mt-2">{{ formatDate(new Date()) }}</p>
    </div>
    
    <!-- Dashboard Content -->
    <div class="flex flex-col flex-1 px-8 pb-8">
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Left Column - Statistics -->
        <div class="w-full lg:w-1/4 space-y-8">
          <!-- Emails Sent Card -->
          <div class="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg">
            <div class="p-6">
              <div class="flex items-center mb-4">
                <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 class="font-semibold text-lg text-gray-800">Išsiųsta</h3>
              </div>
              <p class="font-bold text-3xl text-gray-800">{{ dashboardStats.totalEmails || 0 }}</p>
              <p class="text-gray-500 text-sm mt-1">laiškai</p>
            </div>
            <div class="h-2 bg-gradient-to-r from-green-400 to-green-600"></div>
          </div>
          
          <!-- Last Sent By Card -->
          <div class="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg">
            <div class="p-6">
              <div class="flex items-center mb-4">
                <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 class="font-semibold text-lg text-gray-800">Paskutinį laišką siuntė</h3>
              </div>
              
              <div class="flex items-center mt-4">
                <div class="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                  <span class="text-xl font-bold text-gray-700">DL</span>
                </div>
                <div>
                  <p class="font-bold text-xl text-gray-800">Deividas Litvinenko</p>
                  <p class="text-gray-500 text-sm">administratorius</p>
                </div>
              </div>
            </div>
            <div class="h-2 bg-gradient-to-r from-blue-400 to-blue-600"></div>
          </div>
        </div>
        
        <!-- Right Column - Last Email and Time -->
        <div class="w-full lg:w-3/4 space-y-8">
          <!-- Last Email Card -->
          <div class="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div class="p-6">
              <div class="flex justify-between items-center mb-4">
                <div class="flex items-center">
                  <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 class="font-semibold text-lg text-gray-800">Paskutinis laiškas</h3>
                </div>
                <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full" v-if="dashboardStats.lastEmail">
                  {{ formatDateShort(new Date(dashboardStats.lastEmail.created_at)) }}
                </span>
              </div>
              
              <div v-if="dashboardStats.lastEmail" class="bg-gray-50 border border-gray-100 rounded-lg p-4 min-h-40 mb-4">
                <div class="flex justify-between mb-3">
                  <div>
                    <p class="text-sm text-gray-500">Kam: {{ dashboardStats.lastEmail.recipient_email }}</p>
                    <p class="font-medium">{{ dashboardStats.lastEmail.subject }}</p>
                  </div>
                  <div class="text-right text-gray-500 text-sm">
                    {{ formatTime(new Date(dashboardStats.lastEmail.created_at)) }}
                  </div>
                </div>
                <div 
  class="text-gray-600 line-clamp-3" 
  v-html="formatEmailContent(dashboardStats.lastEmail.description)"
></div>
              </div>
              <div v-else class="bg-gray-50 border border-gray-100 rounded-lg p-4 min-h-40 mb-4 flex items-center justify-center">
                <p class="text-gray-400">Nėra išsiųstų laiškų</p>
              </div>
              
              <div class="flex justify-end" v-if="dashboardStats.lastEmail">
                <button @click="viewEmail(dashboardStats.lastEmail.id)" class="bg-green-600 hover:bg-green-700 text-white font-medium px-5 py-2 rounded-lg flex items-center transition-colors duration-300">
                  <span>Peržiūrėti visą</span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Last Sent Time Card -->
          <div class="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div class="p-6">
              <div class="flex justify-between items-center">
                <div class="flex items-center">
                  <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 class="font-semibold text-lg text-gray-800">Paskutinis laiškas išsiųstas</h3>
                    <p class="text-gray-500 text-sm">Laikas nuo paskutinio siuntimo</p>
                  </div>
                </div>
                
                <div class="text-right" v-if="dashboardStats.lastEmail">
                  <p class="font-bold text-2xl text-gray-800">{{ formatDateShort(new Date(dashboardStats.lastEmail.created_at)) }}</p>
                  <p class="font-bold text-xl text-gray-800">{{ formatTime(new Date(dashboardStats.lastEmail.created_at)) }}</p>
                  <p class="text-sm text-gray-500">{{ getTimeAgo(dashboardStats.lastEmail.created_at) }}</p>
                </div>
                <div class="text-right" v-else>
                  <p class="text-gray-400">Nėra duomenų</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- View List Button -->
      <div class="flex justify-end mt-8">
        <button @click="viewEmailList" class="bg-gray-800 hover:bg-gray-900 text-white font-medium px-6 py-3 rounded-lg flex items-center transition-colors duration-300">
          <span>Peržiūrėti sąrašą</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import DOMPurify from 'dompurify';

const config = useRuntimeConfig();
const apiBase = config.public.apiBase;
const router = useRouter();
const userName = ref('Administratoriau');
const dashboardStats = ref({
  totalEmails: 0,
  recentEmails: 0,
  lastEmail: null
});

// Function to safely display HTML content
const formatEmailContent = (content) => {
  if (!content) return '';
  return DOMPurify.sanitize(content);
};

// Function to format current date
const formatDate = (date) => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('lt-LT', options);
};

// Function to format date as YYYY-MM-DD
const formatDateShort = (date) => {
  return date.toISOString().split('T')[0];
};

// Function to format time as HH:MM
const formatTime = (date) => {
  return date.toTimeString().substring(0, 5);
};

// Function to calculate time ago
const getTimeAgo = (timestamp) => {
  const now = new Date();
  const emailDate = new Date(timestamp);
  const diffMs = now - emailDate;
  
  // Convert to minutes, hours, days
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
};

// Function to fetch dashboard data
const fetchDashboardData = async () => {
  try {
    const response = await fetch(`${apiBase.value}/api/dashboard/stats`);
    const data = await response.json();
    
    if (data.success) {
      dashboardStats.value = data.data;
    } else {
      console.error('Failed to fetch dashboard stats:', data.error);
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  }
};

// View specific email
const viewEmail = (emailId) => {
  router.push(`/emails/${emailId}`);
};

// View email list
const viewEmailList = () => {
  router.push('/dashboard');
};

// Fetch data when component mounts
onMounted(() => {
  fetchDashboardData();
});
</script>

<style scoped>
.min-h-40 {
  min-height: 10rem;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
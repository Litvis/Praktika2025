<template>
  <!-- Loading overlay that appears immediately on page load -->
  <div v-if="isCheckingAccess" class="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
    <div class="w-16 h-16 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin mb-4"></div>
    <p class="text-gray-600 text-lg">Tikrinamos teisės...</p>
  </div>

  <!-- Actual page content (only shown after verification) -->
  <div v-else class="flex flex-row h-screen bg-gray-50">
    <Sidebar />
    <div class="w-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-y-auto">
      <!-- Header Section -->
      <div class="px-8 py-6">
        <h1 class="font-bold text-4xl text-gray-800">Sąrašas</h1>
        <p class="text-gray-500 mt-2">Siųstų laiškų istorija ({{ totalEmails }})</p>
      </div>
      
      <!-- Table Container -->
      <div class="px-8 pb-8">
        <!-- Search and Filter -->
        <div class="flex justify-between items-center mb-6">
          <div class="relative w-64">
            <input 
              type="text" 
              v-model="searchQuery"
              placeholder="Ieškoti laiškų..." 
              class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              @input="handleSearch"
            />
            <div class="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div class="flex space-x-2">
            <select
              v-model="dateFilter"
              class="px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
              @change="fetchEmails"
            >
              <option value="all">Visi laikai</option>
              <option value="today">Šiandien</option>
              <option value="week">Šią savaitę</option>
              <option value="month">Šį mėnesį</option>
            </select>
            
            <button 
              @click="exportEmails" 
              class="flex items-center px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Eksportuoti
            </button>
          </div>
        </div>
        
        <!-- Table Header -->
        <div class="bg-white rounded-t-lg border border-gray-200 shadow-sm overflow-hidden">
          <div class="grid grid-cols-5 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div class="font-semibold text-gray-600">ID</div>
            <div class="font-semibold text-gray-600">Tema</div>
            <div class="font-semibold text-gray-600">Gavėjas</div>
            <div class="font-semibold text-gray-600">Išsiuntimo laikas</div>
            <div class="font-semibold text-gray-600 text-center">Veiksmai</div>
          </div>
          
          <!-- Table Body -->
          <div v-if="emails.length === 0" class="p-8 text-center text-gray-500">
            Nėra laiškų rodymui
          </div>
          
          <div v-else>
            <div 
              v-for="(email, index) in emails" 
              :key="email.id"
              class="grid grid-cols-5 gap-4 px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
              :class="{'bg-gray-50': index % 2 === 1}"
            >
              <div class="flex items-center">
                <span class="font-medium text-gray-500">{{ email.id }}</span>
              </div>
              
              <div class="truncate font-medium text-gray-800">
                {{ email.subject }}
              </div>
              
              <div class="truncate text-gray-600">
                {{ email.recipient_email }}
              </div>
              
              <div class="text-gray-600">
                <span class="font-medium">{{ formatDay(new Date(email.created_at)) }}</span>
                <div class="text-sm text-gray-500">{{ formatTime(new Date(email.created_at)) }}</div>
              </div>
              
              <div class="flex justify-center">
                <button 
                  @click="viewEmail(email.id)" 
                  class="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Peržiūrėti laišką
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Pagination -->
        <div class="flex justify-between items-center mt-6">
          <div class="text-sm text-gray-600">
            Rodoma {{ ((currentPage - 1) * itemsPerPage) + 1 }}-{{ Math.min(currentPage * itemsPerPage, totalEmails) }} iš {{ totalEmails }} įrašų
          </div>
          
          <div class="flex space-x-1">
            <button 
              @click="prevPage" 
              :disabled="currentPage === 1"
              class="flex items-center justify-center w-9 h-9 rounded-lg border" 
              :class="currentPage === 1 ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-gray-600 border-gray-300 hover:bg-gray-50'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <template v-for="page in displayedPages" :key="page">
              <button 
                v-if="page !== '...'"
                @click="goToPage(page)" 
                class="flex items-center justify-center w-9 h-9 rounded-lg border" 
                :class="currentPage === page ? 'bg-green-600 text-white border-green-600' : 'text-gray-600 border-gray-300 hover:bg-gray-50'"
              >
                {{ page }}
              </button>
              <span 
                v-else
                class="flex items-center justify-center w-9 h-9 text-gray-400"
              >
                ...
              </span>
            </template>
            
            <button 
              @click="nextPage" 
              :disabled="currentPage === totalPages"
              class="flex items-center justify-center w-9 h-9 rounded-lg border" 
              :class="currentPage === totalPages ? 'text-gray-400 border-gray-200 cursor-not-allowed' : 'text-gray-600 border-gray-300 hover:bg-gray-50'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import Sidebar from '~/components/adminlanding/Sidebar.vue';
import { useUserStore } from '~/stores/user';
import { onMounted, watch, ref, computed } from 'vue';

const userStore = useUserStore();
const router = useRouter();

// Add state for access checking
const isCheckingAccess = ref(true);

// Enhanced admin access check function
async function checkAdminAccess() {
  console.log('Checking admin access in component', {
    isLoading: userStore.isLoading,
    isAdmin: userStore.isAdmin
  });
  
  // If still loading, wait for it to complete
  if (userStore.isLoading) {
    return;
  }
  
  // If not admin, redirect immediately
  if (!userStore.isAdmin) {
    console.log('Access denied - not an admin');
    router.push('/unauthorised');
    return;
  }
  
  // Access granted, hide loading overlay
  isCheckingAccess.value = false;
}

// This will run on component mount
onMounted(() => {
  // Force a fetch of user data if needed
  if (!userStore.user && !userStore.isLoading) {
    userStore.fetchUserProfile().then(() => {
      checkAdminAccess();
    });
  } else {
    checkAdminAccess();
  }
});

// This will run whenever the isAdmin state changes
watch(() => userStore.isAdmin, () => {
  checkAdminAccess();
});

// This will run whenever the isLoading state changes
watch(() => userStore.isLoading, () => {
  if (!userStore.isLoading) {
    checkAdminAccess();
  }
});

// Reactive state
const emails = ref([]);
const totalEmails = ref(0);
const currentPage = ref(1);
const itemsPerPage = 10;
const searchQuery = ref('');
const dateFilter = ref('all');
const isLoading = ref(false);

// Fetch emails from the backend
const fetchEmails = async () => {
  try {
    isLoading.value = true;
    
    // Calculate offset for pagination
    const offset = (currentPage.value - 1) * itemsPerPage;
    
    // Build query parameters
    const params = new URLSearchParams();
    params.append('limit', itemsPerPage.toString());
    params.append('offset', offset.toString());
    
    if (searchQuery.value) {
      params.append('search', searchQuery.value);
    }
    
    if (dateFilter.value !== 'all') {
      params.append('dateFilter', dateFilter.value);
    }
    
    // Fetch data from API
    const response = await fetch(`https://praktika2025.onrender.com/api/emails/recent?${params.toString()}`);
    const data = await response.json();
    
    if (data.success) {
      emails.value = data.data.emails;
      totalEmails.value = data.data.pagination.total;
    } else {
      console.error('Failed to fetch emails:', data.error);
    }
  } catch (error) {
    console.error('Error fetching emails:', error);
  } finally {
    isLoading.value = false;
  }
};

// Handle search with debounce
let searchTimeout;
const handleSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1; // Reset to first page when searching
    fetchEmails();
  }, 300);
};

// Format date and time
const formatDay = (date) => {
  return date.toLocaleDateString('lt-LT', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const formatTime = (date) => {
  return date.toLocaleTimeString('lt-LT', { hour: '2-digit', minute: '2-digit' });
};

// Pagination logic
const totalPages = computed(() => Math.ceil(totalEmails.value / itemsPerPage));

// Enhanced pagination controls with ellipsis for many pages
const displayedPages = computed(() => {
  if (totalPages.value <= 7) {
    return Array.from({ length: totalPages.value }, (_, i) => i + 1);
  }
  
  if (currentPage.value <= 3) {
    return [1, 2, 3, 4, 5, '...', totalPages.value];
  }
  
  if (currentPage.value >= totalPages.value - 2) {
    return [1, '...', totalPages.value - 4, totalPages.value - 3, totalPages.value - 2, totalPages.value - 1, totalPages.value];
  }
  
  return [1, '...', currentPage.value - 1, currentPage.value, currentPage.value + 1, '...', totalPages.value];
});

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchEmails();
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchEmails();
  }
};

const goToPage = (page) => {
  currentPage.value = page;
  fetchEmails();
};

// View email details
const viewEmail = (id) => {
  router.push(`/emails/${id}`);
};

// Export emails as CSV
const exportEmails = async () => {
  try {
    // Fetch all emails for export (without pagination)
    const response = await fetch(`https://praktika2025.onrender.com/api/emails/recent?limit=1000&dateFilter=${dateFilter.value}`);
    const data = await response.json();
    
    if (data.success) {
      // Convert to CSV format
      const headers = ['ID', 'Tema', 'Gavėjas', 'Išsiuntimo laikas', 'Priedai'];
      const csvRows = [headers.join(',')];
      
      data.data.emails.forEach(email => {
        const row = [
          email.id,
          `"${email.subject.replace(/"/g, '""')}"`, // Escape quotes
          email.recipient_email,
          new Date(email.created_at).toLocaleString('lt-LT'),
          email.attachments ? 'Taip' : 'Ne'
        ];
        csvRows.push(row.join(','));
      });
      
      const csvContent = csvRows.join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `issiusti-laiskai-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (error) {
    console.error('Error exporting emails:', error);
    alert('Nepavyko eksportuoti laiškų.');
  }
};

// Load data when component mounts
onMounted(() => {
  fetchEmails();
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
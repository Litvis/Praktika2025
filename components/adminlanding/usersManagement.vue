<template>
    <div class="main-content-with-sidebar flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-y-auto min-h-screen">
      <!-- Header Section -->
      <div class="px-8 py-6">
        <h1 class="font-bold text-4xl text-gray-800">Vartotojai</h1>
        <p class="text-gray-500 mt-2">Vartotojų valdymas ({{ totalUsers }})</p>
      </div>
      
      <!-- Table Container -->
      <div class="px-8 pb-8">
        <!-- Search and Filter -->
        <div class="flex justify-between items-center mb-6">
          <div class="relative w-64">
            <input 
              type="text" 
              v-model="searchQuery"
              placeholder="Ieškoti vartotojų..." 
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
              v-model="roleFilter"
              class="px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
              @change="fetchUsers"
            >
              <option value="all">Visi vartotojai</option>
              <option value="admin">Administratoriai</option>
              <option value="worker">Darbuotojai</option>
              <option value="pending">Laukiantys patvirtinimo</option>
            </select>
          </div>
        </div>
        
        <!-- Table Header -->
        <div class="bg-white rounded-t-lg border border-gray-200 shadow-sm overflow-hidden">
          <div class="grid grid-cols-5 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div class="font-semibold text-gray-600">ID</div>
            <div class="font-semibold text-gray-600">El. paštas</div>
            <div class="font-semibold text-gray-600">Vardas</div>
            <div class="font-semibold text-gray-600">Rolė</div>
            <div class="font-semibold text-gray-600 text-center">Veiksmai</div>
          </div>
          
          <!-- Table Body -->
          <div v-if="isLoading" class="p-8 text-center">
            <div class="inline-block w-8 h-8 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
            <p class="mt-2 text-gray-500">Kraunami duomenys...</p>
          </div>
          
          <div v-else-if="users.length === 0" class="p-8 text-center text-gray-500">
            Nėra vartotojų rodymui
          </div>
          
          <div v-else>
            <div 
              v-for="(user, index) in users" 
              :key="user.id"
              class="grid grid-cols-5 gap-4 px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
              :class="{'bg-gray-50': index % 2 === 1}"
            >
              <div class="flex items-center">
                <span class="font-medium text-gray-500">{{ user.id }}</span>
              </div>
              
              <div class="truncate font-medium text-gray-800">
                {{ user.email }}
              </div>
              
              <div class="truncate text-gray-600">
                {{ user.name }}
              </div>
              
              <div class="text-gray-600">
                <span 
                  class="px-2 py-1 rounded-full text-xs font-semibold"
                  :class="{
                    'bg-green-100 text-green-800': user.role === 'admin',
                    'bg-blue-100 text-blue-800': user.role === 'worker',
                    'bg-yellow-100 text-yellow-800': user.role === 'pending'
                  }"
                >
                  {{ translateRole(user.role) }}
                </span>
              </div>
              
              <div class="flex justify-center space-x-2">
                <button 
                  v-if="user.role === 'pending'"
                  @click="approveUser(user.id)" 
                  class="flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Patvirtinti
                </button>
                
                <button 
                  v-if="user.role === 'worker'"
                  @click="promoteUser(user.id)" 
                  class="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" />
                  </svg>
                  Paaukštinti
                </button>
                
                <button 
                  v-if="user.role === 'admin' && user.email !== currentUserEmail"
                  @click="demoteUser(user.id)" 
                  class="flex items-center px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z" />
                  </svg>
                  Pažeminti
                </button>
                
                <button 
                  v-if="user.email !== currentUserEmail"
                  @click="deleteUser(user.id)" 
                  class="flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Ištrinti
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Pagination -->
        <div class="flex justify-between items-center mt-6">
          <div class="text-sm text-gray-600">
            Rodoma {{ users.length ? ((currentPage - 1) * itemsPerPage) + 1 : 0 }}-{{ Math.min(currentPage * itemsPerPage, totalUsers) }} iš {{ totalUsers }} įrašų
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
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  import { useUserStore } from '~/stores/user';
  
  // Reactive state
  const users = ref([]);
  const totalUsers = ref(0);
  const currentPage = ref(1);
  const itemsPerPage = 10;
  const searchQuery = ref('');
  const roleFilter = ref('all');
  const isLoading = ref(false);
  const userStore = useUserStore();
  const currentUserEmail = computed(() => userStore.user?.email || '');
  
  // Fetch users from the backend
  const fetchUsers = async () => {
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
      
      if (roleFilter.value !== 'all') {
        params.append('role', roleFilter.value);
      }
      
      // Fetch data from API
      const response = await fetch(`https://praktika2025.onrender.com/api/admin/users?${params.toString()}`, {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        users.value = data.users;
        totalUsers.value = data.pagination.total;
      } else {
        console.error('Failed to fetch users:', data.error);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
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
      fetchUsers();
    }, 300);
  };
  
  // Translate role to Lithuanian
  const translateRole = (role) => {
    switch (role) {
      case 'admin':
        return 'Administratorius';
      case 'worker':
        return 'Darbuotojas';
      case 'pending':
        return 'Laukiantis patvirtinimo';
      default:
        return role;
    }
  };
  
  // User actions
  const approveUser = async (userId) => {
    try {
      const response = await fetch('https://praktika2025.onrender.com/api/admin/approve-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ id: userId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the user in the list
        const index = users.value.findIndex(user => user.id === userId);
        if (index !== -1) {
          users.value[index].role = 'worker';
        }
      } else {
        alert(`Klaida: ${data.error}`);
      }
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Įvyko klaida tvirtinant vartotoją');
    }
  };
  
  const promoteUser = async (userId) => {
    try {
      const response = await fetch('https://praktika2025.onrender.com/api/admin/promote-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ id: userId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the user in the list
        const index = users.value.findIndex(user => user.id === userId);
        if (index !== -1) {
          users.value[index].role = 'admin';
        }
      } else {
        alert(`Klaida: ${data.error}`);
      }
    } catch (error) {
      console.error('Error promoting user:', error);
      alert('Įvyko klaida paaukštinant vartotoją');
    }
  };
  
  const demoteUser = async (userId) => {
    try {
      const response = await fetch('https://praktika2025.onrender.com/api/admin/demote-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ id: userId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the user in the list
        const index = users.value.findIndex(user => user.id === userId);
        if (index !== -1) {
          users.value[index].role = 'worker';
        }
      } else {
        alert(`Klaida: ${data.error}`);
      }
    } catch (error) {
      console.error('Error demoting user:', error);
      alert('Įvyko klaida pažeminant vartotoją');
    }
  };
  
  const deleteUser = async (userId) => {
    if (!confirm('Ar tikrai norite ištrinti šį vartotoją?')) return;
    
    try {
      const response = await fetch('https://praktika2025.onrender.com/api/admin/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ id: userId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Remove the user from the list
        users.value = users.value.filter(user => user.id !== userId);
        totalUsers.value -= 1;
      } else {
        alert(`Klaida: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Įvyko klaida ištrinant vartotoją');
    }
  };
  
  // Pagination logic
  const totalPages = computed(() => Math.ceil(totalUsers.value / itemsPerPage));
  
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
      fetchUsers();
    }
  };
  
  const prevPage = () => {
    if (currentPage.value > 1) {
      currentPage.value--;
      fetchUsers();
    }
  };
  
  const goToPage = (page) => {
    currentPage.value = page;
    fetchUsers();
  };
  
  // Load data when component mounts
  onMounted(() => {
    fetchUsers();
  });
  </script>
  
  <style scoped>
  .truncate {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
  </style>
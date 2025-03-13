<template>
  <div class="flex flex-row h-screen bg-gray-50">
    <Sidebar />
    <div class="w-3/4 flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-y-auto">
      <!-- Header Section -->
      <div class="px-8 py-6">
        <h1 class="font-bold text-4xl text-gray-800">Sąrašas</h1>
        <p class="text-gray-500 mt-2">Siųstų laiškų istorija</p>
      </div>
      
      <!-- Table Container -->
      <div class="px-8 pb-8">
        <!-- Search and Filter -->
        <div class="flex justify-between items-center mb-6">
          <div class="relative w-64">
            <input 
              type="text" 
              placeholder="Ieškoti pagal vardą..." 
              class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <div class="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div class="flex space-x-2">
            <button class="flex items-center px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtruoti
            </button>
            <button class="flex items-center px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Eksportuoti
            </button>
          </div>
        </div>
        
        <!-- Table Header -->
        <div class="bg-white rounded-t-lg border border-gray-200 shadow-sm overflow-hidden">
          <div class="grid grid-cols-3 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div class="font-semibold text-gray-600">Pilnas vardas</div>
            <div class="font-semibold text-gray-600 text-center">Laiškas</div>
            <div class="font-semibold text-gray-600 text-right">Išsiuntimo laikas</div>
          </div>
          
          <!-- Table Body -->
          <div v-if="paginatedMessages.length === 0" class="p-8 text-center text-gray-500">
            Nėra laiškų rodymui
          </div>
          
          <div v-else>
            <div 
              v-for="(msg, index) in paginatedMessages" 
              :key="index"
              class="grid grid-cols-3 gap-4 px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
              :class="{'bg-gray-50': index % 2 === 1}"
            >
              <div class="flex items-center">
                <div class="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center mr-3 font-medium">
                  {{ getInitials(msg.name) }}
                </div>
                <span class="font-medium text-gray-800">{{ msg.name }}</span>
              </div>
              
              <div class="flex justify-center">
                <button class="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Peržiūrėti laišką
                </button>
              </div>
              
              <div class="flex items-center justify-end">
                <div class="text-right">
                  <span class="font-medium text-gray-800">{{ formatDay(msg.timestamp) }}</span>
                  <div class="text-sm text-gray-500">{{ formatTime(msg.timestamp) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Pagination -->
        <div class="flex justify-between items-center mt-6">
          <div class="text-sm text-gray-600">
            Rodoma {{ ((currentPage - 1) * itemsPerPage) + 1 }}-{{ Math.min(currentPage * itemsPerPage, messages.length) }} iš {{ messages.length }} įrašų
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
                @click="goToPage(page as number)" 
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

<script setup lang="ts">
import Sidebar from '~/components/adminlanding/Sidebar.vue';
import { ref, computed, onMounted } from 'vue';

// Define message structure using an interface
interface Message {
  name: string;
  timestamp: string;
}

// Reactive state
const messages = ref<Message[]>([]);  // Store the list of messages
const currentPage = ref(1);  // Current page
const itemsPerPage = 5; // Number of items per page

// User data state
const user = ref(null); // Store user data

// Dummy messages
const generateDummyMessages = (): Message[] => {
  return [
    { name: "Jonas Jonaitis", timestamp: "2025-03-03T08:15:00Z" },
    { name: "Ona Petraitė", timestamp: "2025-03-03T09:00:00Z" },
    { name: "Petras Kazlauskas", timestamp: "2025-03-03T10:30:00Z" },
    { name: "Laura Vilkaitė", timestamp: "2025-03-03T11:45:00Z" },
    { name: "Marius Stankevičius", timestamp: "2025-03-03T13:10:00Z" },
    { name: "Eglė Jakštaitė", timestamp: "2025-03-03T14:00:00Z" },
    { name: "Rokas Mažeika", timestamp: "2025-03-03T15:20:00Z" },
    { name: "Indrė Žemaitė", timestamp: "2025-03-03T16:35:00Z" },
    { name: "Tadas Pocius", timestamp: "2025-03-03T17:50:00Z" },
    { name: "Lina Jankauskaitė", timestamp: "2025-03-03T19:05:00Z" },
    { name: "Karolis Butkus", timestamp: "2025-03-04T08:30:00Z" },
    { name: "Aistė Vaitkutė", timestamp: "2025-03-04T09:45:00Z" },
    { name: "Dovydas Balsys", timestamp: "2025-03-04T11:00:00Z" },
    { name: "Ieva Rimaitė", timestamp: "2025-03-04T12:15:00Z" },
    { name: "Vytautas Jankauskas", timestamp: "2025-03-04T13:30:00Z" }
  ];
};

// Fetch user data from backend and messages
onMounted(async () => {
  try {
    // Simulate fetching messages (using dummy data here)
    messages.value = generateDummyMessages();
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
});

// Pagination logic
const paginatedMessages = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const paginated = messages.value.slice(start, start + itemsPerPage);
  return paginated;
});

const totalPages = computed(() => Math.ceil(messages.value.length / itemsPerPage));

// Format date and time separately for better layout
const formatDay = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('lt-LT', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('lt-LT', { hour: '2-digit', minute: '2-digit' });
};

// Get initials from a person's name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Enhanced pagination controls with ellipsis for many pages
// Define a type for pagination items that can be numbers or ellipsis
type PaginationItem = number | '...';

const displayedPages = computed((): PaginationItem[] => {
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
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const goToPage = (page: number) => {
  currentPage.value = page;
};
</script>
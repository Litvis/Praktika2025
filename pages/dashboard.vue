<template>
  <div class="flex flex-row h-screen">
    <Sidebar />
    <div class="w-3/4 flex flex-col bg-gray-200">
      <div class="h-1/6">
        <p class="font-bold text-5xl ml-14 mt-10">Sąrašas</p>
        <!-- Display the user information if available -->
      </div>
      <div class="flex flex-col ml-14 mr-10 mt-8">
        <!-- Table Header -->
        <div class="flex items-center justify-between border-2 w-full rounded-lg h-16 border-black bg-gray-300">
          <p class="ml-4 font-bold text-xl">Pilnas vardas</p>
          <p class="font-bold text-xl">Laiškas</p>
          <p class="mr-4 font-bold text-xl">Išsiuntimo laikas</p>
        </div>

        <!-- Messages List -->
        <div v-for="(msg, index) in paginatedMessages" :key="index"
          class="flex my-4 items-center justify-between border-2 w-full rounded-lg h-16 border-black bg-gray-300">
          <p class="ml-4 font-bold text-lg">{{ msg.name }}</p>
          <button class="bg-green-700 text-white text-center font-semibold w-48 h-12 border-2 border-black rounded-xl flex items-center justify-center">Peržiūrėti pilną laišką</button>
          <p class="mr-4 font-bold text-lg">{{ formatDate(msg.timestamp) }}</p>
        </div>

        <!-- Pagination Controls -->
        <div class="flex justify-center mt-4 space-x-4">
          <button @click="prevPage" :disabled="currentPage === 1"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-400">
            Previous
          </button>
          <span class="font-bold text-lg">Page {{ currentPage }} of {{ totalPages }}</span>
          <button @click="nextPage" :disabled="currentPage === totalPages"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-400">
            Next
          </button>
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
    { name: "Lina Jankauskaitė", timestamp: "2025-03-03T19:05:00Z" }
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

const formatDate = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString();
};

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
</script>

<template>
    <div class="flex flex-row h-screen">
        <Sidebar />
        <div class="w-3/4 flex flex-col bg-gray-200">
            <div class="h-1/6">
                <p class="font-bold text-5xl ml-14 mt-10">Sąrašas</p>
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
const messages = ref<Message[]>([]);
const currentPage = ref(1);
const itemsPerPage = 5; // Show 5 items per page

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

// Compute paginated messages
const paginatedMessages = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return messages.value.slice(start, start + itemsPerPage);
});

// Compute total pages
const totalPages = computed(() => Math.ceil(messages.value.length / itemsPerPage));

// Format timestamp
const formatDate = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString();
};

// Pagination functions
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

// Fetch dummy messages on component mount
onMounted(() => {
  messages.value = generateDummyMessages();
});
</script>

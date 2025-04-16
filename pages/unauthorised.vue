<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Prieigos klaida
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Jūs neturite teisių peržiūrėti šį puslapį
          </p>
        </div>
        <div class="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <div class="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p class="text-lg text-gray-700 mb-4">Jums reikalingos administratoriaus teisės.</p>
            <div class="flex space-x-4">
              <button 
                @click="goToAllowedPage" 
                class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Grįžti į prieigos puslapį
              </button>
              <button 
                @click="logout" 
                class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Atsijungti
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { useUserStore } from '~/stores/user.js';
  import { useRouter } from 'vue-router';
  
  const userStore = useUserStore();
  const router = useRouter();
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;
  
  const goToAllowedPage = () => {
    // Redirect to irankis page, which is accessible for all authenticated users
    router.push('/irankis');
  };
  
  const logout = async () => {
    try {
      // Redirect to the backend logout endpoint
      window.location.href = `${apiBase}/logout`;
      
      // Clear local user state
      userStore.clearUser();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };
  </script>
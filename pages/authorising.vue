<template>
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div class="mb-6">
          <!-- Logo or icon could go here -->
          <div class="w-20 h-20 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
        
        <h1 class="text-2xl font-bold text-gray-800 mb-4">Laukiama patvirtinimo</h1>
        
        <p class="text-gray-600 mb-6">
          Jūsų paskyra netrukus bus patvirtinta svetainės administratoriaus.
        </p>
        
        <p class="text-gray-500 text-sm">
          Patvirtinus paskyrą, galėsite prisijungti ir naudotis sistema. Apie patvirtinimą būsite informuoti el. paštu.
        </p>
        
        <div class="mt-8">
          <button 
            @click="checkStatus" 
            class="px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center mx-auto"
          >
            <svg 
              v-if="isChecking" 
              class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Tikrinti būseną
          </button>
        </div>
        
        <div class="mt-6">
          <button 
            @click="logout" 
            class="text-green-600 hover:text-green-800 text-sm font-medium"
          >
            Atsijungti
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  
  const router = useRouter();
  const isChecking = ref(false);
  
  
  // Check if user status has changed
  const checkStatus = async () => {
    try {
      isChecking.value = true;
      
      // Call the API to check user status
      const response = await fetch(`${apiBase.value}/api/user/profile`, {
      credentials: 'include'
    });
      
      const data = await response.json();
      
      if (data.success && data.user) {
        // If user is now approved (not pending)
        if (data.user.role !== 'pending') {
          // Redirect to the appropriate page based on role
          if (data.user.role === 'admin') {
            router.push('/adminLanding');
          } else {
            router.push('/irankis');
          }
        } else {
          alert('Jūsų paskyra dar nepatvirtinta. Bandykite vėliau.');
        }
      } else {
        console.error('Failed to fetch user profile:', data.error);
      }
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      isChecking.value = false;
    }
  };
  
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;

  const logout = async () => {
    try {
      // Redirect to the backend logout endpoint
      window.location.href = `${apiBase.value}/logout`;
      
      // Clear local user state
      userStore.clearUser();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };
  
  // Check status on page load (in case user was approved)
  onMounted(() => {
    checkStatus();
  });
  </script>
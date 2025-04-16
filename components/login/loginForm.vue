<template>
  <div class="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-gray-50 to-gray-100 p-6">
    <div class="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
      <!-- Top wave decoration -->
      <div class="h-8 bg-green-600 relative">
        <svg class="absolute bottom-0 w-full" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" fill="#ffffff"></path>
        </svg>
      </div>
      
      <!-- Error Alert -->
      <div 
        v-if="errorMessage" 
        class="mx-8 mt-6 bg-red-50 border-l-4 border-red-500 p-4 relative"
      >
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-700 font-medium">{{ errorTitle }}</p>
            <p class="text-sm text-red-600 mt-1">{{ errorMessage }}</p>
          </div>
          <button
            @click="errorMessage = ''"
            class="absolute top-4 right-4 text-red-500 hover:text-red-700"
          >
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Logo and Content Container -->
      <div class="px-8 pt-8 pb-12 flex flex-col items-center">
        <!-- Logo with subtle shadow -->
        <div class="w-32 h-32 flex items-center justify-center mb-8">
          <img src="public/uzt.jpg" class="w-full object-contain rounded-lg shadow-sm" alt="Company Logo">
        </div>
        
        <!-- Welcome Text -->
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-2">Sveiki atvykę</h1>
        <p class="text-gray-600 text-center mb-8 max-w-sm">
          Srautinio laiškų siuntimo įrankis
        </p>
        
        <!-- Google Sign-in Buttons -->
        <div class="w-full space-y-4">
          <!-- Company Email Login -->
          <a 
  :href="`${apiBase.value}/auth/google`" 
  class="flex items-center justify-center w-full py-3 px-4 rounded-lg border border-gray-300 bg-white text-gray-800 font-medium shadow-sm hover:shadow transition-all duration-200 group"
>
            <svg class="w-5 h-5 mr-2 text-gray-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
            <span>Prisijungti su įmonės el. paštu (@uzt.lt)</span>
          </a>
          
          <!-- Divider -->
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500">Arba</span>
            </div>
          </div>
          
          <!-- Personal Email Login -->
          <a 
  :href="`${apiBase}/auth/google-alt`" 
  class="flex items-center justify-center w-full py-3 px-4 rounded-lg border border-gray-300 bg-gray-50 text-gray-700 font-medium shadow-sm hover:shadow transition-all duration-200 group"
>
            <svg class="w-5 h-5 mr-2 text-gray-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
            <span>Prisijungti su patvirtintu asmeniniu el. paštu</span>
          </a>
        </div>
        
        <p class="text-xs text-gray-500 text-center mt-6">
          Prisijungimas galimas tik su įmonės (@uzt.lt) el. paštu arba administratoriaus patvirtintais asmeniniais el. paštais.
        </p>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="mt-8 text-center text-gray-500 text-sm">
      © 2025 UŽT. Visos teisės saugomos.
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

// Error handling
const errorTitle = ref('Klaida');
const errorMessage = ref('');
const route = useRoute();
const config = useRuntimeConfig();
const apiBase = ref(config.public.apiBase);

// Check for error parameter in URL on mount
onMounted(() => {
  const error = route.query.error;
  
  if (error) {
    switch (error) {
      case 'domain_not_allowed':
        errorTitle.value = 'Neleidžiamas el. pašto domenas';
        errorMessage.value = 'Prisijungti galima tik su įmonės el. pašto adresu (@uzt.lt) arba patvirtintu asmeninių el. pašto adresu.';
        break;
      case 'unauthorized':
        errorTitle.value = 'Prieigos klaida';
        errorMessage.value = 'Neturite prieigos prie šios sistemos. Susisiekite su administratoriumi.';
        break;
      case 'server':
        errorTitle.value = 'Serverio klaida';
        errorMessage.value = 'Įvyko serverio klaida. Bandykite vėliau arba susisiekite su administracija.';
        break;
      default:
        errorTitle.value = 'Prisijungimo klaida';
        errorMessage.value = 'Įvyko klaida bandant prisijungti. Bandykite dar kartą.';
    }
  }
});
</script>

<style scoped>
/* Optional: Add custom styles for smoother wave animation */
@keyframes wave {
  0% { transform: translateX(0) translateZ(0); }
  50% { transform: translateX(-25%) translateZ(0); }
  100% { transform: translateX(0) translateZ(0); }
}

.wave-animation {
  animation: wave 15s ease-in-out infinite;
}
</style>
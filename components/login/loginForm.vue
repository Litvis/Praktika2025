<template>
  <div class="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-gray-50 to-gray-100 p-6">
    <div class="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
      <div class="h-8 bg-green-600 relative">
        <svg class="absolute bottom-0 w-full" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" fill="#ffffff"></path>
        </svg>
      </div>
      
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
      
      <div class="px-8 pt-8 pb-12 flex flex-col items-center">
        <div class="w-32 h-32 flex items-center justify-center mb-8">
          <img src="public/uzt.jpg" class="w-full object-contain rounded-lg shadow-sm" alt="Company Logo">
        </div>
        
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-2">Sveiki atvykę</h1>
        <p class="text-gray-600 text-center mb-8 max-w-sm">
          Srautinio laiškų siuntimo įrankis
        </p>
        <button 
      @click="loginWithGoogle" 
      class="flex items-center justify-center w-full py-3 px-4 rounded-lg border border-gray-300 bg-gray-50 text-gray-700 font-medium shadow-sm hover:shadow transition-all duration-200 group"
    >
      <span>Prisijungti</span>
    </button>
        </div>
      
      </div>
    </div>
    
    <div class="mt-8 text-center text-gray-500 text-sm">
      © 2025 UŽT. Visos teisės saugomos.
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const errorTitle = ref('Klaida');
const errorMessage = ref('');
const route = useRoute();
const config = useRuntimeConfig();
const apiBase = ref(config.public.apiBase);

function loginWithGoogle() {
  const backendUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3001' 
    : apiBase.value;
  
  console.log('Starting Google login, redirecting to:', `${backendUrl}/auth/google-alt`);
  
  window.location.href = `${backendUrl}/auth/google-alt`;
}

onMounted(() => {
  const error = route.query.error;
  
  console.log('Backend API base URL:', apiBase.value);
  console.log('Current environment:', process.env.NODE_ENV);
  
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
@keyframes wave {
  0% { transform: translateX(0) translateZ(0); }
  50% { transform: translateX(-25%) translateZ(0); }
  100% { transform: translateX(0) translateZ(0); }
}

.wave-animation {
  animation: wave 15s ease-in-out infinite;
}
</style>
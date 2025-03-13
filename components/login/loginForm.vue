<template>
    <div class="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-gray-50 to-gray-100 p-6">
      <div class="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <!-- Top wave decoration -->
        <div class="h-8 bg-green-600 relative">
          <svg class="absolute bottom-0 w-full" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" fill="#ffffff"></path>
          </svg>
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
            Prisijunkite su įmonės Google paskyra, kad galėtumėte tęsti
          </p>
          
          <!-- Google Sign-in Button -->
          <a 
            href="https://praktika2025.onrender.com/auth/google" 
            class="flex items-center justify-center w-full py-3 px-4 rounded-lg border border-gray-300 bg-white text-gray-800 font-medium shadow-sm hover:shadow transition-all duration-200 group"
          >
            <Icon 
              icon="flat-color-icons:google" 
              class="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-200" 
            />
            <span>Tęskite su Google</span>
          </a>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="mt-8 text-center text-gray-500 text-sm">
        © 2025 UŽT. Visos teisės saugomos.
      </div>
    </div>
  </template>
  
  <script setup>
  import { Icon } from "@iconify/vue";
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
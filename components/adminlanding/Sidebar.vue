<template>
  <div class="bg-white border-r border-gray-200 fixed z-10 sidebar-width flex flex-col shadow-sm overflow-y-auto h-screen">
    <!-- Logo Section -->
    <div class="p-6 flex justify-center border-b border-gray-100">
      <div class="max-w-32">
        <img src="/public/uzt.jpg" alt="Logo" class="w-full h-auto rounded">
      </div>
    </div>
    
    <!-- Navigation Menu -->
    <nav class="flex-1 pt-6 px-4">
      <p class="text-xs font-medium text-gray-400 uppercase tracking-wider px-4 mb-2">Pagrindinis</p>
      
      <!-- Dashboard Link -->
      <RouterLink 
        to="/adminLanding" 
        class="flex items-center px-4 py-3 mb-3 rounded-lg transition-all duration-200 group"
        :class="{ 
          'bg-green-600 text-white shadow-md': $route.path === '/adminLanding',
          'text-gray-700 hover:bg-gray-100': $route.path !== '/adminLanding'
        }"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          class="h-5 w-5 mr-3" 
          :class="{ 'text-white': $route.path === '/adminLanding', 'text-gray-500 group-hover:text-gray-700': $route.path !== '/adminLanding' }"
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        <span class="font-medium">Prietaisų skydelis</span>
      </RouterLink>
      
      <!-- List Link -->
      <RouterLink 
        to="/dashboard" 
        class="flex items-center px-4 py-3 mb-3 rounded-lg transition-all duration-200 group"
        :class="{ 
          'bg-green-600 text-white shadow-md': $route.path === '/dashboard',
          'text-gray-700 hover:bg-gray-100': $route.path !== '/dashboard'
        }"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          class="h-5 w-5 mr-3" 
          :class="{ 'text-white': $route.path === '/dashboard', 'text-gray-500 group-hover:text-gray-700': $route.path !== '/dashboard' }"
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <span class="font-medium">Sąrašas</span>
      </RouterLink>
      
      <!-- User Management Link (NEW) -->
      <RouterLink 
        v-if="userStore.isAdmin"
        to="/UserManagement" 
        class="flex items-center px-4 py-3 mb-3 rounded-lg transition-all duration-200 group"
        :class="{ 
          'bg-green-600 text-white shadow-md': $route.path === '/UserManagement',
          'text-gray-700 hover:bg-gray-100': $route.path !== '/UserManagement'
        }"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          class="h-5 w-5 mr-3" 
          :class="{ 'text-white': $route.path === '/UserManagement', 'text-gray-500 group-hover:text-gray-700': $route.path !== '/user-management' }"
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <span class="font-medium">Vartotojų valdymas</span>
      </RouterLink>
      
      <!-- Tools Link -->
      <RouterLink 
        to="/irankis" 
        class="flex items-center px-4 py-3 mb-3 rounded-lg transition-all duration-200 group"
        :class="{ 
          'bg-green-600 text-white shadow-md': $route.path === '/irankis',
          'text-gray-700 hover:bg-gray-100': $route.path !== '/irankis'
        }"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          class="h-5 w-5 mr-3" 
          :class="{ 'text-white': $route.path === '/irankis', 'text-gray-500 group-hover:text-gray-700': $route.path !== '/irankis' }"
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span class="font-medium">Įrankis</span>
      </RouterLink>
    </nav>
    
    <!-- User Section -->
    <div class="p-4 border-t border-gray-100 mt-auto">
      <div class="flex items-center px-4 py-3">
        <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
          <span class="text-sm font-medium text-gray-700">{{ userInitials }}</span>
        </div>
        <div>
          <p class="font-medium text-gray-800">{{ userStore.user?.displayName || 'Vartotojas' }}</p>
          <p class="text-xs text-gray-500">{{ userStore.user?.email || 'user@example.com' }}</p>
        </div>
      </div>
      
      <!-- Logout Button -->
      <button 
        @click="logout"
        class="w-full mt-4 flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Atsijungti
      </button>
    </div>
  </div>
</template>
  
<script setup>
import { useRoute } from 'vue-router';
import { useUserStore } from '~/stores/user';
import { computed } from 'vue';

// Get current route for active link styling
const $route = useRoute();
const userStore = useUserStore();

// Compute user initials for the avatar
const userInitials = computed(() => {
  if (!userStore.user || !userStore.user.displayName) return 'U';
  
  const nameParts = userStore.user.displayName.split(' ');
  if (nameParts.length >= 2) {
    return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
  }
  
  return userStore.user.displayName[0].toUpperCase();
});

// Logout function
const logout = () => {
  userStore.logout();
};
</script>
  
<style>
/* Global CSS variables for consistent sidebar spacing across all components */
:root {
  --sidebar-width: 16rem; /* 64px (w-64) */
}

.sidebar-width {
  width: var(--sidebar-width);
}

/* Add a class that all main content containers can use */
.main-content-with-sidebar {
  margin-left: var(--sidebar-width);
  width: calc(100% - var(--sidebar-width));
}
</style>
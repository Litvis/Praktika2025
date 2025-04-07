<template>
  <!-- Loading overlay that appears immediately on page load -->
  <div v-if="isCheckingAccess" class="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
    <div class="w-16 h-16 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin mb-4"></div>
    <p class="text-gray-600 text-lg">Tikrinamos teisės...</p>
  </div>

  <!-- Actual page content (only shown after verification) -->
  <div v-else class="flex h-screen">
    <!-- Sidebar -->
    <Sidebar />
    
    <!-- Main content area -->
    <div class="main-content-with-sidebar overflow-y-auto">
      <LandingContent />
    </div>
  </div>
</template>

<script setup lang="ts">
import Sidebar from '~/components/adminlanding/Sidebar.vue';
import LandingContent from '~/components/adminlanding/LandingContent.vue';
import { useUserStore } from '~/stores/user';
import { onMounted, watch, ref } from 'vue';
import { useRouter } from 'vue-router';

const userStore = useUserStore();
const router = useRouter();

// Add state for access checking
const isCheckingAccess = ref(true);

// Enhanced admin access check function
async function checkAdminAccess() {
  console.log('Checking admin access in component', {
    isLoading: userStore.isLoading,
    isAdmin: userStore.isAdmin
  });
  
  // If still loading, wait for it to complete
  if (userStore.isLoading) {
    return;
  }
  
  // If not admin, redirect immediately
  if (!userStore.isAdmin) {
    console.log('Access denied - not an admin');
    router.push('/unauthorised');
    return;
  }
  
  // Access granted, hide loading overlay
  isCheckingAccess.value = false;
}

// This will run on component mount
onMounted(() => {
  // Force a fetch of user data if needed
  if (!userStore.user && !userStore.isLoading) {
    userStore.fetchUserProfile().then(() => {
      checkAdminAccess();
    });
  } else {
    checkAdminAccess();
  }
});

// This will run whenever the isAdmin state changes
watch(() => userStore.isAdmin, () => {
  checkAdminAccess();
});

// This will run whenever the isLoading state changes
watch(() => userStore.isLoading, () => {
  if (!userStore.isLoading) {
    checkAdminAccess();
  }
});
</script>

<style scoped>
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
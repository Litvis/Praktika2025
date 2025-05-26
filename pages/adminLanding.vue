<template>
  <div v-if="isCheckingAccess" class="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
    <div class="w-16 h-16 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin mb-4"></div>
    <p class="text-gray-600 text-lg">Tikrinamos teisės...</p>
  </div>

  <div v-else class="flex h-screen">
    <Sidebar />
    
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

const isCheckingAccess = ref(true);

async function checkAdminAccess() {
  console.log('Checking admin access in component', {
    isLoading: userStore.isLoading,
    isAdmin: userStore.isAdmin
  });
  
  if (userStore.isLoading) {
    return;
  }
  
  if (!userStore.isAdmin) {
    console.log('Access denied - not an admin');
    router.push('/unauthorised');
    return;
  }
  
  isCheckingAccess.value = false;
}

onMounted(() => {
  if (!userStore.user && !userStore.isLoading) {
    userStore.fetchUserProfile().then(() => {
      checkAdminAccess();
    });
  } else {
    checkAdminAccess();
  }
});

watch(() => userStore.isAdmin, () => {
  checkAdminAccess();
});

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
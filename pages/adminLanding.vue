<script setup lang="ts">
import Sidebar from '~/components/adminlanding/Sidebar.vue';
import LandingContent from '~/components/adminlanding/LandingContent.vue';
import { useUserStore } from '~/stores/user';
import { onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';

const userStore = useUserStore();
const router = useRouter();

// This will run on component mount
onMounted(() => {
  checkAdminAccess();
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

function checkAdminAccess() {
  console.log('Checking admin access in component', {
    isLoading: userStore.isLoading,
    isAdmin: userStore.isAdmin
  });
  
  // If not loading and not admin, redirect immediately
  if (!userStore.isLoading && !userStore.isAdmin) {
    console.log('Access denied - not an admin');
    router.push('/unauthorized');
  }
}
</script>

<template>
    <div class="flex flex-row h-screen">
        <Sidebar/>
        <LandingContent/>
    </div>
</template>
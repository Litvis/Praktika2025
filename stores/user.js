// stores/user.js
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', () => {
  // Reactive state
  const user = ref(null);
  const isAdmin = ref(false);
  const isAuthenticated = ref(false);
  const isLoading = ref(true);
  const lastCheck = ref(0);

  // Actions
  function setUser(userData) {
    user.value = userData;
    isAdmin.value = userData?.role === 'admin';
    isAuthenticated.value = true;
    isLoading.value = false;
    lastCheck.value = Date.now();
  }

  function clearUser() {
    user.value = null;
    isAdmin.value = false;
    isAuthenticated.value = false;
    isLoading.value = false;
    lastCheck.value = Date.now();
  }

  async function fetchUserProfile() {
    try {
      // Avoid frequent refetching (cache for 5 minutes)
      const cacheTime = 5 * 60 * 1000; // 5 minutes
      if (Date.now() - lastCheck.value < cacheTime && user.value) {
        return user.value;
      }

      isLoading.value = true;
      const config = useRuntimeConfig();
      const response = await $fetch(`${config.public.apiBase}/api/user/profile`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.success) {
        setUser(response.user);
        return response.user;
      }
      
      clearUser();
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      clearUser();
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function logout() {
    try {
      const config = useRuntimeConfig();
      await $fetch(`${config.public.apiBase}/logout`, {
        credentials: 'include'
      });
      clearUser();
      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      return false;
    }
  }

  // Return the reactive state and actions
  return {
    user,
    isAdmin,
    isAuthenticated,
    isLoading,
    setUser,
    clearUser,
    fetchUserProfile,
    logout
  };
});

// Optional composable for easier access
export const useUser = () => {
  const userStore = useUserStore();
  
  // Additional computed properties
  const isLoggedIn = computed(() => userStore.isAuthenticated);
  const userRole = computed(() => userStore.isAdmin ? 'admin' : 'worker');
  
  return {
    ...toRefs(userStore),
    isLoggedIn,
    userRole
  };
};
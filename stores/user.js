// stores/user.js
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', () => {
  // Reactive state
  const user = ref(null);
  const isAdmin = ref(false);
  const isAuthenticated = ref(false);
  const isLoading = ref(true);
  const lastCheck = ref(0);
  const error = ref(null);

  // Actions
  function setUser(userData) {
    console.log('Setting user data:', userData);
    user.value = userData;
    isAdmin.value = userData?.role === 'admin';
    isAuthenticated.value = true;
    isLoading.value = false;
    lastCheck.value = Date.now();
    error.value = null;
  }

  function clearUser() {
    console.log('Clearing user data');
    user.value = null;
    isAdmin.value = false;
    isAuthenticated.value = false;
    isLoading.value = false; // Make sure to set loading to false
    lastCheck.value = Date.now();
  }

  async function fetchUserProfile() {
    try {
      // Avoid frequent refetching (cache for 5 minutes)
      const cacheTime = 5 * 60 * 1000; // 5 minutes
      if (Date.now() - lastCheck.value < cacheTime && user.value) {
        console.log('Using cached user profile');
        return user.value;
      }

      console.log('Fetching user profile from API');
      isLoading.value = true;
      error.value = null;
      
      const config = useRuntimeConfig();
      const apiUrl = `${config.public.apiBase}/api/user/profile`;
      
      console.log('API URL:', apiUrl);
      
      const response = await $fetch(apiUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log('API response:', response);
      
      if (response.success) {
        console.log('User profile fetched successfully:', response.user);
        setUser(response.user);
        return response.user;
      } else {
        console.log('User profile fetch unsuccessful');
        clearUser();
        return null;
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      error.value = err.message || 'Failed to fetch user profile';
      clearUser();
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function logout() {
    try {
      console.log('Logging out user');
      const config = useRuntimeConfig();
      
      // Redirect to the backend logout endpoint instead of fetching it
      window.location.href = `${config.public.apiBase}/logout`;
      
      clearUser();
      return true;
    } catch (err) {
      console.error('Error during logout:', err);
      error.value = err.message || 'Failed to logout';
      return false;
    }
  }

  // Check for authentication immediately
  onMounted(() => {
    console.log('User store mounted, checking authentication');
    fetchUserProfile();
  });

  // Return the reactive state and actions
  return {
    user,
    isAdmin,
    isAuthenticated,
    isLoading,
    error,
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
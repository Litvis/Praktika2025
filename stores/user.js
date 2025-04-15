// stores/user.js
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', () => {
  // Reactive state
  const user = ref(null);
  const isAdmin = ref(false);
  const isPending = ref(false); // New state for pending status
  const isAuthenticated = ref(false);
  const isLoading = ref(true);
  const lastCheck = ref(0);
  const error = ref(null);

  // Actions
  function setUser(userData) {
    console.log('Setting user data:', userData);
    user.value = userData;
    isAdmin.value = userData?.role === 'admin';
    isPending.value = userData?.role === 'pending'; // Set pending status
    isAuthenticated.value = true;
    isLoading.value = false;
    lastCheck.value = Date.now();
    error.value = null;
  }

  function clearUser() {
    console.log('Clearing user data');
    user.value = null;
    isAdmin.value = false;
    isPending.value = false; // Reset pending status
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
  
  // Check user approval status
  async function checkApprovalStatus() {
    try {
      console.log('Checking user approval status');
      const config = useRuntimeConfig();
      const apiUrl = `${config.public.apiBase}/api/check-approval-status`;
      
      const response = await $fetch(apiUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.success) {
        if (response.approved && user.value) {
          console.log('User is approved with role:', response.role);
          // Update user role if it's changed
          if (user.value.role !== response.role) {
            user.value.role = response.role;
            isAdmin.value = response.role === 'admin';
            isPending.value = false;
          }
        }
        return response.approved;
      }
      return false;
    } catch (err) {
      console.error('Error checking approval status:', err);
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
    isPending,
    isAuthenticated,
    isLoading,
    error,
    setUser,
    clearUser,
    fetchUserProfile,
    logout,
    checkApprovalStatus
  };
});

// Optional composable for easier access
export const useUser = () => {
  const userStore = useUserStore();
  
  // Additional computed properties
  const isLoggedIn = computed(() => userStore.isAuthenticated);
  const userRole = computed(() => {
    if (userStore.isAdmin) return 'admin';
    if (userStore.isPending) return 'pending';
    return 'worker';
  });
  
  return {
    ...toRefs(userStore),
    isLoggedIn,
    userRole
  };
};
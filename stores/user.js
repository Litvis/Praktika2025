// stores/user.js
import { defineStore } from 'pinia';
import { ref, computed, onMounted } from 'vue';

export const useUserStore = defineStore('user', () => {
  // Reactive state
  const user = ref(null);
  const isAdmin = ref(false);
  const isPending = ref(false);
  const isAuthenticated = ref(false);
  const isLoading = ref(true);
  const lastCheck = ref(0);
  const error = ref(null);
  const debugMessages = ref([]);

  // Helper for debugging
  function log(message, data = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      message,
      data: data ? JSON.stringify(data) : null
    };
    console.log(`[UserStore] ${message}`, data || '');
    debugMessages.value.push(logEntry);
    // Keep only the last 50 messages
    if (debugMessages.value.length > 50) {
      debugMessages.value.shift();
    }
  }

  function setUser(userData) {
    log('Setting user data', userData);
    user.value = userData;
    isAdmin.value = userData?.role === 'admin';
    isPending.value = userData?.role === 'pending';
    isAuthenticated.value = true;
    lastCheck.value = Date.now();
    error.value = null;
  }

  function clearUser() {
    log('Clearing user data');
    user.value = null;
    isAdmin.value = false;
    isPending.value = false;
    isAuthenticated.value = false;
    lastCheck.value = Date.now();
    error.value = null;
  }

  async function fetchUserProfile() {
    try {
      // Avoid frequent refetching (cache for 30 seconds during development)
      const cacheTime = 30 * 1000; // 30 seconds
      if (Date.now() - lastCheck.value < cacheTime && user.value) {
        log('Using cached user profile');
        return user.value;
      }

      log('Fetching user profile from API');
      isLoading.value = true;
      error.value = null;
      
      const config = useRuntimeConfig();
      const apiUrl = `${config.public.apiBase}/api/user/profile`;
      
      log('API URL', apiUrl);
      
      // Use the standard fetch API instead of $fetch
      const response = await fetch(apiUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      log('API response status', response.status);
      
      if (response.ok) {
        const data = await response.json();
        log('API response data', data);
        
        if (data.success && data.user) {
          setUser(data.user);
          return data.user;
        } else {
          log('API returned success=false or no user data', data);
          clearUser();
          error.value = 'Invalid user data received';
          return null;
        }
      } else {
        const errorText = await response.text();
        log('API error', { status: response.status, text: errorText });
        clearUser();
        error.value = `API error: ${response.status}`;
        return null;
      }
    } catch (err) {
      log('Error fetching user profile', err);
      error.value = err.message || 'Failed to fetch user profile';
      clearUser();
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function logout() {
    try {
      log('Logging out user');
      const config = useRuntimeConfig();
      
      // Redirect to the backend logout endpoint instead of fetching it
      window.location.href = `${config.public.apiBase}/logout`;
      
      clearUser();
      return true;
    } catch (err) {
      log('Error during logout', err);
      error.value = err.message || 'Failed to logout';
      return false;
    }
  }
  
  // Check user approval status
  async function checkApprovalStatus() {
    try {
      log('Checking user approval status');
      const config = useRuntimeConfig();
      const apiUrl = `${config.public.apiBase}/api/check-approval-status`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        log('Approval status response', data);
        
        if (data.success) {
          if (data.approved && user.value) {
            log('User is approved with role', data.role);
            // Update user role if it's changed
            if (user.value.role !== data.role) {
              user.value.role = data.role;
              isAdmin.value = data.role === 'admin';
              isPending.value = false;
            }
          }
          return data.approved;
        }
      }
      return false;
    } catch (err) {
      log('Error checking approval status', err);
      return false;
    }
  }

  // Return the reactive state and actions
  return {
    user,
    isAdmin,
    isPending,
    isAuthenticated,
    isLoading,
    error,
    debugMessages,
    setUser,
    clearUser,
    fetchUserProfile,
    logout,
    checkApprovalStatus
  };
});
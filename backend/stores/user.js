// stores/user.js
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    isAdmin: false,
    isAuthenticated: false,
    isLoading: true
  }),
  
  actions: {
    setUser(userData) {
      this.user = userData;
      this.isAdmin = userData?.role === 'admin';
      this.isAuthenticated = true;
      this.isLoading = false;
    },
    
    clearUser() {
      this.user = null;
      this.isAdmin = false;
      this.isAuthenticated = false;
    },
    
    async fetchUserProfile() {
      try {
        this.isLoading = true;
        const response = await fetch('https://praktika2025.onrender.com/api/user/profile', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            this.setUser(data.user);
            return data.user;
          }
        }
        
        this.clearUser();
        this.isLoading = false;
        return null;
      } catch (error) {
        console.error('Error fetching user profile:', error);
        this.clearUser();
        this.isLoading = false;
        return null;
      }
    }
  }
});
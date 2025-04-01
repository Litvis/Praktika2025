// plugins/pinia.js
import { createPinia } from 'pinia'

export default defineNuxtPlugin((nuxtApp) => {
  const pinia = createPinia()
  nuxtApp.vueApp.use(pinia)
  
  // Optional: Add any global store configurations here
  return {
    provide: {
      pinia
    }
  }
})

// stores/user.js (Updated)
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  // Reactive state using Composition API
  const user = ref(null)
  const isAdmin = ref(false)
  const isAuthenticated = ref(false)
  const isLoading = ref(true)

  // Actions using methods
  function setUser(userData) {
    user.value = userData
    isAdmin.value = userData?.role === 'admin'
    isAuthenticated.value = true
    isLoading.value = false
  }

  function clearUser() {
    user.value = null
    isAdmin.value = false
    isAuthenticated.value = false
  }

  async function fetchUserProfile() {
    try {
      isLoading.value = true
      const response = await $fetch('/api/user/profile', {
        credentials: 'include'
      })
      
      if (response.success) {
        setUser(response.user)
        return response.user
      }
      
      clearUser()
      return null
    } catch (error) {
      console.error('Error fetching user profile:', error)
      clearUser()
      return null
    } finally {
      isLoading.value = false
    }
  }

  // Return the reactive state and methods
  return {
    user,
    isAdmin,
    isAuthenticated,
    isLoading,
    setUser,
    clearUser,
    fetchUserProfile
  }
})

// composables/useUser.js (Optional helper)
export const useUser = () => {
  const userStore = useUserStore()
  
  // Optional: Add any additional helper methods or computeds
  const isLoggedIn = computed(() => userStore.isAuthenticated)
  
  return {
    ...userStore,
    isLoggedIn
  }
}
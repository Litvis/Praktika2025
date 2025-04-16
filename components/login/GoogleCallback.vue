<template>
    <div>
      <h1>Authenticating...</h1>
    </div>
  </template>
  
  <script>
  export default {
    async mounted() {
      // Get the code from the query parameters
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (code) {
        try {

        const config = useRuntimeConfig();
        const apiBase = config.public.apiBase;

        // Send the code to the backend to complete the authentication
        const response = await fetch(`${apiBase.value}/auth/google/callback`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies (for session management)
        });
  
          // If successful, redirect to the dashboard
          if (response.ok) {
            window.location.href = '/dashboard'; // Redirect to the dashboard
          } else {
            alert('Authentication failed');
          }
        } catch (error) {
          console.error('Error during authentication:', error);
        }
      }
    },
  };
  </script>
  
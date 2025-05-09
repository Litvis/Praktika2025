// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:3001'
    }
  },
  routeRules: {
    '/': { redirect: '/login' }
  },
  css: ["@/assets/css/global.css"],
    postcss: {
      plugins: {
        tailwindcss: {},
        autoprefixer: {},
      },
    }, 
    modules: [
      '@pinia/nuxt',
    ],
    router: {
      options: {
        linkActiveClass: 'active',
        linkExactActiveClass: 'exact-active',
      }
    },
    components: [
      {
        path: '~/components',
        pathPrefix: false,
      },
    ],
    
})

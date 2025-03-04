// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      apiBase: process.env.BACKEND_URL || "https://praktika2025.onrender.com", // Make sure this is correct!
    }},
  routeRules: {
    '/': { redirect: '/irankis' }
  },
  css: ["@/assets/css/global.css"],
    postcss: {
      plugins: {
        tailwindcss: {},
        autoprefixer: {},
      },
    }, 
    components: [
      {
        path: '~/components',
        pathPrefix: false,
      },
    ],
})

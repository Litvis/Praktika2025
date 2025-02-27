// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
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

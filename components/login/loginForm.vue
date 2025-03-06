<template>

    <div class="flex flex-col justify-center items-center h-screen">
        <img src="public/uzt.jpg" class="w-32 mb-32">
        <p class="font-semibold  text-3xl">Sveiki, prisijunkite su įmonės Google paskyra</p>
        <div class="mt-48 border-4 border-black h-16 w-56 flex justify-center items-center rounded-lg">
            <a href="http://localhost:3001/auth/google" class=" h-full w-full text-center justify-center items-center flex bg-gray-100 font-semibold"><Icon icon="flat-color-icons:google" class="w-8 h-8 mr-4" />Teskite su Google</a>
        </div>
    </div>
</template>

<script setup>
import { Icon } from "@iconify/vue";
</script>
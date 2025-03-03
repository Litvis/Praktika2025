<template>
            <div class="w-1/4 border-r-2 border-black">
            <div class="flex flex-col">
            <a class="flex justify-center mt-2"><img src="public/uzt.jpg" class="w-32"></a>
            <hr class="mt-3 border-black border-1 ">
            </div>
            <div class="flex justify-center mt-6">
            <RouterLink to="/adminLanding" class="bg-green-700 text-white text-center font-semibold w-48 h-12 border-2 border-black rounded-xl flex items-center justify-center">
            Prietaisų skydelis
            </RouterLink>
            </div>
            <div class="flex justify-center mt-6">
            <RouterLink to="/dashboard" class="bg-white text-black text-center font-semibold w-48 h-12 border-2 border-black rounded-xl flex items-center justify-center">
            Sąrašas
            </RouterLink>
            </div>
            <div class="flex justify-center mt-6">
            <RouterLink to="/irankis" class="bg-white text-black text-center font-semibold w-48 h-12 border-2 border-black rounded-xl flex items-center justify-center">
            Įrankis
            </RouterLink>
            </div>

        </div>
</template>
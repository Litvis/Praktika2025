<template>
  <div class="flex justify-center space-x-2 md:space-x-4">
    <button
      v-for="option in options"
      :key="option.id"
      :class="[
        'px-3 py-1 md:px-4 md:py-2 rounded shadow text-xs md:text-sm font-semibold', 
        currentOption === option.id ? 'bg-green-700 text-white' : 'bg-gray-200 text-gray-700'
      ]"
      @click="changeOption(option.id)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
  
  <script setup>
  import { defineProps, defineEmits } from 'vue';
  
  // Props
  const props = defineProps({
    options: {
      type: Array,
      required: true,
    },
    currentOption: {
      type: String,
      required: true,
    },
  });
  
  // Emits
  const emit = defineEmits(['update:currentOption']);
  
  // Method to change the active option
  const changeOption = (optionId) => {
    emit('update:currentOption', optionId);
  };
  </script>
  
  <style scoped>
  button {
    transition: background-color 0.3s, color 0.3s;
  }
  button:hover {
    background-color: #047857; /* Green shade */
    color: white;
  }
  </style>
  
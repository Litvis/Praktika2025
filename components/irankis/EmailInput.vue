<template>
  <div class="flex flex-col">
    <label for="email" class="text-md font-medium text-gray-700 ml-2">
      Elektroninio pašto adresas
    </label>
    <input
      type="text"
      id="email"
      v-model="inputValue" 
      placeholder="Recipient Email"
      class="mt-2 block w-full px-4 py-2 text-gray-700 border-2 border-green-600 rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-green-800 placeholder-gray-400"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);

const inputValue = ref(props.modelValue);

// Watch for external updates from the parent
watch(() => props.modelValue, (newVal) => {
  inputValue.value = newVal;
});

// Emit updates when user types
watch(inputValue, (newVal) => {
  emit('update:modelValue', newVal);
});
</script>

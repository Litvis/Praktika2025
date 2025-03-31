<template>
  <div class="w-full">
    <label for="email" class="block text-sm md:text-md font-medium text-gray-700 mb-2">
      Elektroninio pašto adresas
    </label>
    <input
      type="text"
      id="email"
      v-model="inputValue"
      placeholder="Recipient Email"
      class="w-full px-3 py-2 md:px-4 md:py-2 text-sm md:text-base text-gray-700 
             border-2 border-green-600 rounded-md shadow-lg 
             focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-green-800 
             placeholder-gray-400"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  recipient: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['updateRecipient']);

const inputValue = ref(props.recipient);

// Ensure two-way binding
watch(inputValue, (newValue) => {
  console.log("🔄 Updating recipient:", newValue);
  emit('updateRecipient', newValue);
});

watch(() => props.recipient, (newRecipient) => {
  inputValue.value = newRecipient;
});
</script>

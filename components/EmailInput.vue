<template>
  <div class="flex flex-col">
    <label for="email" class="text-md font-medium text-gray-700 ml-2">
      Elektroninio pašto adresas
    </label>
    <input
      type="text"
      id="email"
      :value="recipient"
      @input="updateRecipient($event.target.value)"
      placeholder="Recipient Email"
      class="mt-2 block w-full px-4 py-2 text-gray-700 border-2 border-green-600 rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-green-800 placeholder-gray-400"
    />
  </div>
</template>

<script setup>
// Define the 'recipient' prop that will be passed from the parent component
const props = defineProps({
  recipient: {
    type: String,
    required: true,
  },
});

// Define the emit function to emit the updateRecipient event
const emit = defineEmits(['updateRecipient']);

// Function to emit the updated recipient value to the parent component
const updateRecipient = (newRecipient) => {
  emit('updateRecipient', newRecipient);  // Emit the new recipient value
};
</script>

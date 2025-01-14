<template>
  
  <div class="w-auto flex flex-col justify-evenly">
    <div class="">
    <NavigationButtons
      :options="options"
      v-model:currentOption="currentOption"
    />
  </div>
  <div class="">
    <p class="font-bold text-3xl text-center">Pildymas</p>
    <hr class="mt-2" />

    <!-- Conditional Rendering of Interfaces -->
    <div class="mb-8">
      <EmailInput
        v-if="currentOption === 'email'"
        :recipient="recipient"
        @updateRecipient="updateRecipient"
      />
      <FileUpload v-if="currentOption === 'csv'" />
      <GroupSelection v-if="currentOption === 'group'" />
    </div>
  </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';


// Props
const props = defineProps({
  recipient: {
    type: String,
    required: true,
  },
});


// Update recipient value
const updateRecipient = (value) => {
  emit('updateRecipient', value);
};

// State for current option
const currentOption = ref('email');

// Options for navigation
const options = [
  { id: 'email', label: 'Vienam' },
  { id: 'csv', label: 'CSV' },
  { id: 'group', label: 'Grupei' },
];
</script>

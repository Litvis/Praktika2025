<template>
  <div class="w-full">
    <label for="email" class="block text-sm md:text-md font-medium text-gray-700 mb-2">
      Elektroninio pašto adresas
    </label>
    
    <div class="flex space-x-2 mb-3">
      <input
        type="email"
        id="email"
        v-model="inputValue"
        @keydown.enter.prevent="addEmail"
        placeholder="Gavėjo el. paštas"
        class="flex-grow px-3 py-2 md:px-4 md:py-2 text-sm md:text-base text-gray-700 
               border-2 border-green-600 rounded-md shadow-lg 
               focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-green-800 
               placeholder-gray-400"
      />
      <button
        @click="addEmail"
        class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 
               transition-colors duration-200 shadow-lg focus:outline-none 
               focus:ring-2 focus:ring-green-800"
      >
        Pridėti
      </button>
    </div>
    
    <div v-if="emailList.length > 0" class="flex flex-wrap gap-2 mb-2">
      <div 
        v-for="(email, index) in emailList" 
        :key="index"
        class="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full"
      >
        <span class="mr-1">{{ email }}</span>
        <button 
          @click="removeEmail(index)"
          class="text-green-600 hover:text-green-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
    
    <p v-if="errorMessage" class="text-red-500 text-sm mt-1">
      {{ errorMessage }}
    </p>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  recipient: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['updateRecipient']);

const inputValue = ref('');
const errorMessage = ref('');
const emailList = ref([]);

watch(() => props.recipient, (newRecipient) => {
  if (newRecipient && emailList.value.length === 0) {
    const emails = newRecipient.split(',').map(email => email.trim());
    emailList.value = emails.filter(email => email !== '');
  }
}, { immediate: true });

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const addEmail = () => {
  const email = inputValue.value.trim();
  
  if (!email) {
    return;
  }
  
  if (!isValidEmail(email)) {
    errorMessage.value = 'Neteisingas el. pašto formatas';
    return;
  }
  
  if (emailList.value.includes(email)) {
    errorMessage.value = 'Šis el. paštas jau pridėtas';
    return;
  }
  
  emailList.value.push(email);
  inputValue.value = '';
  errorMessage.value = '';
  
  updateRecipients();
};

const removeEmail = (index) => {
  emailList.value.splice(index, 1);
  updateRecipients();
};

const updateRecipients = () => {
  const recipientString = emailList.value.join(', ');
  emit('updateRecipient', recipientString);
};
</script>
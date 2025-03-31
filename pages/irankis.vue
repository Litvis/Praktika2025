<template>
  <div class="flex flex-col md:flex-row h-screen">
    <!-- Loading overlay while checking authentication -->
    <div v-if="userStore.isLoading" class="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
      <div class="w-12 h-12 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
    </div>

    <template v-else>
      <Sidebar class="md:w-1/5 lg:w-1/6" />
      <div class="p-4 w-full ml-64">
        <div>
          <!-- User role indicator -->
          <div class="mb-4">
            <div class="flex items-center">
              <h1 class="text-2xl font-bold text-gray-800">
                Sveiki, {{ userStore.user?.displayName || 'Vartotojau' }}
              </h1>
              <span 
                v-if="userStore.isAdmin" 
                class="ml-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full"
              >
                Administratorius
              </span>
              <span 
                v-else 
                class="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
              >
                Darbuotojas
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-8">
            <div class="flex items-center justify-center">
              <div class="w-full max-w-md bg-white rounded-xl border-2 p-6">
                <div class="mb-4 md:mb-6">
                  <NavigationButtons
                    :options="options"
                    v-model:currentOption="currentOption"
                  />
                </div>
                <div>
                  <p class="font-bold text-xl md:text-3xl text-center mb-2 md:mb-4">Pildymas</p>
                  <hr class="mb-2 md:mb-4" />

                  <div class="mb-4 md:mb-8">
                    <EmailInput
                      v-if="currentOption === 'email'"
                      :recipient="recipient"
                      @updateRecipient="recipient = $event"
                    />
                    <GroupSelection 
                      v-if="currentOption === 'group'" 
                      @updateEmails="updateEmails" 
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div class="flex items-center justify-center w-full">
              <div class="w-full flex flex-col ">
                <TextArea 
                  class="flex-grow"
                  :subject="subject" 
                  :message="message"
                  :recipient="recipient"
                  :attachedFiles="attachedFiles"
                  @updateSubject="updateSubject" 
                  @updateMessage="updateMessage"
                  @updateAttachedFiles="updateAttachedFiles"
                />
                
                <div class="flex justify-end mt-2 md:mt-4 self-end">
                  <button 
                    @click="sendEmail" 
                    class="w-full md:w-48 p-2 md:p-4 rounded-xl bg-green-700 text-white font-bold text-sm md:text-xl"
                  >
                    Siųsti
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '~/backend/stores/user.js';
import Sidebar from '~/components/adminlanding/Sidebar.vue';
import NavigationButtons from '~/components/irankis/NavigationButtons.vue';
import EmailInput from '~/components/irankis/EmailInput.vue';
import GroupSelection from '~/components/irankis/GroupSelection.vue';
import TextArea from '~/components/irankis/TextArea.vue';

// User store for authentication and role checking
const userStore = useUserStore();

// State for current option and recipient
const currentOption = ref('email');
const recipient = ref('');
const recipientsList = ref([]);

// Options for navigation
const options = [
  { id: 'email', label: 'Vienam' },
  { id: 'group', label: 'Grupei' },
];

// State to hold form data
const subject = ref('');
const message = ref('');

// Add state for attachments
const attachedFiles = ref([]);

// Check authentication and user role
onMounted(async () => {
  // If user is not loaded, fetch user data
  if (!userStore.user && !userStore.isLoading) {
    await userStore.fetchUserProfile();
  }
});

// Update handlers for email, subject, and message
const updateRecipient = (newRecipient) => {
  recipient.value = newRecipient;
  recipientsList.value = [newRecipient];
};

const updateEmails = (newEmails) => {
  if (newEmails.length === 1 && newEmails[0]) {
    recipientsList.value = [newEmails[0].trim()];
  } else {
    recipientsList.value = newEmails;
  }
};

const updateSubject = (newSubject) => {
  subject.value = newSubject;
};

const updateMessage = (newMessage) => {
  message.value = newMessage;
};

const updateAttachedFiles = (files) => {
  attachedFiles.value = files;
};

const sendEmail = async () => {
  let recipientsToUse = '';
  
  if (currentOption.value === 'group' || currentOption.value === 'csv') {
    recipientsToUse = recipientsList.value.join(',');
    
    if (!recipientsToUse) {
      alert("❌ Please select a group with valid emails!");
      return;
    }
  } else {
    recipientsToUse = recipient.value;
    
    if (!recipientsToUse || recipientsToUse.trim() === '') {
      alert("❌ Please enter a valid email!");
      return;
    }
  }

  const attachments = [];
  for (const file of attachedFiles.value) {
    const base64Content = await fileToBase64(file);
    attachments.push({
      content: base64Content.split(',')[1],
      filename: file.name,
      type: file.type,
      disposition: 'attachment'
    });
  }

  const emailData = {
    recipient: recipientsToUse,
    subject: subject.value.trim(),
    message: message.value.trim(),
    attachments: attachments
  };

  console.log("📤 Sending email data:", JSON.stringify(emailData, null, 2));

  try {
    const config = useRuntimeConfig();

    const response = await $fetch(`${config.public.apiBase}/send-email`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: emailData,
    });

    console.log("✅ Email sent successfully:", response);
    alert('Email sent successfully!');
    
    attachedFiles.value = [];
  } catch (error) {
    console.error('❌ Error sending email:', error);
    alert('Failed to send email.');
  }
};

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};
</script>
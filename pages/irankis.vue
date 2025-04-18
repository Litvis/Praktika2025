<template>
  <!-- Immediate loading overlay that appears before any authentication check -->
  <div v-if="isInitialLoading" class="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
    <div class="w-16 h-16 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin mb-4"></div>
    <p class="text-gray-600 text-lg">Tikrinama prisijungimo informacija...</p>
  </div>

  <div v-else class="flex h-screen">
    <!-- Secondary loading overlay for user data loading -->
    <div v-if="userStore.isLoading" class="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
      <div class="w-12 h-12 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
    </div>

    <template v-else>
      <!-- Show Sidebar only for admin users -->
      <Sidebar v-if="userStore.isAdmin" />
      
      <!-- Content area with proper spacing for sidebar -->
      <div class="p-4 w-full min-h-screen overflow-y-auto" :class="{ 'main-content-with-sidebar': userStore.isAdmin }">
        <div>
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
                    Siūsti
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
import { useUserStore } from '~/stores/user.js';
import { useRouter } from 'vue-router';
import Sidebar from '~/components/adminlanding/Sidebar.vue';
import NavigationButtons from '~/components/irankis/NavigationButtons.vue';
import EmailInput from '~/components/irankis/EmailInput.vue';
import GroupSelection from '~/components/irankis/GroupSelection.vue';
import TextArea from '~/components/irankis/TextArea.vue';

// Add state for initial loading screen
const isInitialLoading = ref(true);

// User store for authentication and role checking
const router = useRouter();
const userStore = useUserStore();

// State for current option and recipient
const currentOption = ref('email');
const recipient = ref('');
const recipientsList = ref([]);

// Options for navigation
const options = [
  { id: 'email', label: 'Vienam ar keliems gavėjams' },
  { id: 'group', label: 'Grupei gavėjų' },
];

// State to hold form data
const subject = ref('');
const message = ref('');

// Add state for attachments
const attachedFiles = ref([]);

// Enhanced authentication check with loading
onMounted(async () => {
  console.log("Component mounted, checking authentication...");
  
  try {
    // Show loading screen immediately
    isInitialLoading.value = true;
    
    // Fetch user profile data
    await userStore.fetchUserProfile();
    
    // Check if user is authenticated after profile is loaded
    if (!userStore.isAuthenticated) {
      console.log("User not authenticated, redirecting to login");
      router.push('/login');
      return;
    }
    
    console.log("Authentication check complete, user is authenticated");
  } catch (error) {
    console.error("Error during authentication check:", error);
    router.push('/login');
  } finally {
    // Hide initial loading screen only if user is authenticated
    if (userStore.isAuthenticated) {
      isInitialLoading.value = false;
    }
  }
});

const forceLogout = () => {
  // Clear all cookies
  document.cookie.split(";").forEach(function(c) {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
  
  // Clear local storage
  localStorage.clear();
  
  // Clear session storage
  sessionStorage.clear();
  
  // Redirect to Google logout URL and then to your login page
  window.location.href = "https://accounts.google.com/logout";
  
  // You could also add a timeout to redirect to your login page
  setTimeout(() => {
    window.location.href = "/login";
  }, 1000);
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

// Enhanced sendEmail function for your frontend
const sendEmail = async () => {
  // Show loading indicator
  const isLoading = ref(true);
  let statusMessage = ref('Sending email...');

  try {
    let recipientsToUse = '';
    
    if (currentOption.value === 'group' || currentOption.value === 'csv') {
      recipientsToUse = recipientsList.value.join(',');
      
      if (!recipientsToUse) {
        alert("❌ Please select a group with valid emails!");
        isLoading.value = false;
        return;
      }
    } else {
      recipientsToUse = recipient.value;
      
      if (!recipientsToUse || recipientsToUse.trim() === '') {
        alert("❌ Please enter a valid email!");
        isLoading.value = false;
        return;
      }
    }

    // Validate subject and message
    if (!subject.value.trim()) {
      alert("❌ Please enter a subject for your email!");
      isLoading.value = false;
      return;
    }
    
    if (!message.value.trim()) {
      alert("❌ Please enter a message for your email!");
      isLoading.value = false;
      return;
    }

    statusMessage.value = 'Processing attachments...';
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

    console.log("📤 Sending email data:", JSON.stringify({
      recipient: emailData.recipient,
      subject: emailData.subject,
      attachmentsCount: emailData.attachments.length
    }, null, 2));

    statusMessage.value = 'Sending to server...';
    const config = useRuntimeConfig();

    const response = await $fetch(`${config.public.apiBase}/send-email`, { 
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-User-Email': userStore.user?.email || '',
      'X-User-Name': userStore.user?.displayName || ''
    },
    body: emailData,
  });

    console.log("✅ Server response:", response);
    
    if (response.success) {
      alert('Email sent successfully! Status code: ' + (response.statusCode || 'OK'));
      
      // Clear form fields after successful sending
      subject.value = '';
      message.value = '';
      attachedFiles.value = [];
      
      // You could also clear recipient if needed
      // recipient.value = '';
    } else {
      alert('Something went wrong. Server reported success but with errors: ' + JSON.stringify(response.error || {}));
    }
  } catch (error) {
    console.error('❌ Error sending email:', error);
    let errorMessage = 'Failed to send email.';
    
    if (error.data && error.data.sendGridError) {
      errorMessage += ' SendGrid error: ' + JSON.stringify(error.data.sendGridError);
    } else if (error.message) {
      errorMessage += ' Error: ' + error.message;
    }
    
    alert(errorMessage);
  } finally {
    isLoading.value = false;
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

<style scoped>
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
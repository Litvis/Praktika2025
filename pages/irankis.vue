<template>
  <div class="flex justify-center place-items-center h-screen ">
    <div class="w-full grid grid-cols-2 bg-gray-100 mx-8 py-24 items-center border rounded-xl">
      <div class="h-2/5 flex justify-center">
        <div class="w-1/2 flex justify-center rounded-xl border-2 bg-white">
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
                <EmailInput v-model="recipient" />

                <FileUpload
                  v-if="currentOption === 'csv'"
                  @updateEmails="updateEmails"
                />
                <GroupSelection v-if="currentOption === 'group'" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="w-full p-16">
        <TextArea 
          :subject="subject" 
          :message="message" 
          @updateSubject="updateSubject" 
          @updateMessage="updateMessage" 
        />
        <button @click="sendEmail" class="border-2 p-4 w-48 rounded-xl bg-green-700 text-white font-bold text-xl ml-2">Siusti</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// State for current option and recipient
const currentOption = ref('email');
const recipient = ref('');
const recipientsList = ref([]); // Holds the list of email recipients (can be single or multiple)

// Options for navigation
const options = [
  { id: 'email', label: 'Vienam' },
  { id: 'csv', label: 'CSV' },
  { id: 'group', label: 'Grupei' },
];

// State to hold form data
const subject = ref('');
const message = ref('');

// Update handlers for email, subject, and message
const updateRecipient = (newRecipient) => {
  recipient.value = newRecipient;
  recipientsList.value = [newRecipient];  // Update recipientsList to contain just the single email
};

const updateEmails = (newEmails) => {
  // If the newEmails array contains only one email, ensure it's a valid email
  if (newEmails.length === 1 && newEmails[0]) {
    recipientsList.value = [newEmails[0].trim()]; // Ensure trimming any whitespace
  } else {
    recipientsList.value = newEmails; // Otherwise, use all the emails
  }
};


const updateSubject = (newSubject) => {
  subject.value = newSubject;
};

const updateMessage = (newMessage) => {
  message.value = newMessage;
};

const sendEmail = async () => {
  const config = useRuntimeConfig(); // ✅ Load Nuxt runtime config
  console.log("🔍 API Base URL:", config.public?.apiBase || "❌ Not Found"); // Debugging

  const emailData = {
    recipient: recipientsList.value.join(', '),
    subject: subject.value,
    message: message.value,
  };

  console.log("📤 Sending email data:", emailData); // Debugging

  try {
    await $fetch('/send-email', {
      baseURL: config.public?.apiBase || "https://praktika2025.onrender.com", // ✅ Default to Render backend if undefined
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: emailData,
    });

    alert('✅ Email sent successfully!');
  } catch (error) {
    console.error('❌ Error sending email:', error);
    alert('Failed to send email.');
  }
};


</script>

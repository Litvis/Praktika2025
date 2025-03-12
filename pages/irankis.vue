<template>
  <div class="flex justify-center place-items-center h-screen">
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
                <EmailInput
                  v-if="currentOption === 'email'"
                  :recipient="recipient"
                  @updateRecipient="recipient = $event"
                />

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
          :recipient="recipient"
          :attachedFiles="attachedFiles"
          @updateSubject="updateSubject" 
          @updateMessage="updateMessage" 
        />
        <input 
          type="file" 
          multiple 
          @change="handleFileUpload" 
          class="mt-4"
        />
        <!-- Show attached files -->
        <div v-if="attachedFiles.length > 0" class="mt-4">
          <p>Pridėti failai:</p>
          <ul>
            <li v-for="(file, index) in attachedFiles" :key="index" class="flex items-center">
              {{ file.name }} ({{ formatFileSize(file.size) }})
              <button @click="removeFile(index)" class="text-red-500 ml-2">Pašalinti</button>
            </li>
          </ul>
        </div>
        <button 
          @click="sendEmail" 
          class="border-2 p-4 w-48 rounded-xl bg-green-700 text-white font-bold text-xl ml-2"
        >
          Siųsti
        </button>
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

// Add state for attachments
const attachedFiles = ref([]);

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

// Function to handle file uploads
const handleFileUpload = (event) => {
  const files = event.target.files;
  attachedFiles.value = [...attachedFiles.value, ...files];
};

// Function to remove a file
const removeFile = (index) => {
  attachedFiles.value.splice(index, 1);
};

// Format file size for display
const formatFileSize = (bytes) => {
  if (bytes < 1024) {
    return bytes + ' B';
  } else if (bytes < 1048576) {
    return (bytes / 1024).toFixed(2) + ' KB';
  } else {
    return (bytes / 1048576).toFixed(2) + ' MB';
  }
};

const sendEmail = async () => {
  console.log("📩 Debugging recipient before sending:", recipient.value);

  if (!recipient.value || recipient.value.trim() === '') {
    alert("❌ Please enter a valid email!");
    return;
  }

  // Prepare attachments
  const attachments = [];
  for (const file of attachedFiles.value) {
    const base64Content = await fileToBase64(file);
    attachments.push({
      content: base64Content.split(',')[1], // Remove data URL prefix
      filename: file.name,
      type: file.type,
      disposition: 'attachment'
    });
  }

  const emailData = {
    recipient: recipient.value.trim(),
    subject: subject.value.trim(),
    message: message.value.trim(),
    attachments: attachments  // Add attachments to email data
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
    
    // Clear files after sending
    attachedFiles.value = [];
  } catch (error) {
    console.error('❌ Error sending email:', error);
    alert('Failed to send email.');
  }
};

// Helper function to convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};
</script>
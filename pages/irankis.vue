<template>
  <div class="flex justify-center place-items-center h-screen">
    <div class="w-full grid grid-cols-2 bg-gray-100 mx-8 py-24 items-center border rounded-xl">
      <div class="h-2/5 flex justify-center">
        <div class="w-1/2 flex justify-center rounded-xl border-2 bg-white">
          <div class="w-auto flex flex-col justify-evenly">
            <div>
              <NavigationButtons
                :options="options"
                v-model:currentOption="currentOption"
              />
            </div>
            <div>
              <p class="font-bold text-3xl text-center">Pildymas</p>
              <hr class="mt-2" />

              <div class="mb-8">
                <EmailInput
                  v-if="currentOption === 'email'"
                  :recipient="recipient"
                  @updateRecipient="updateRecipient"
                />

                <FileUpload
                  v-if="currentOption === 'csv'"
                  @updateEmails="updateEmails"
                />
                
                <GroupSelection 
                  v-if="currentOption === 'group'" 
                />
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
        <button 
          @click="sendEmail" 
          :disabled="isLoading"
          class="border-2 p-4 w-48 rounded-xl bg-green-700 text-white font-bold text-xl ml-2 disabled:opacity-50"
        >
          {{ isLoading ? 'Siunčiama...' : 'Siusti' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'

// Interfaces and Types
const currentOption = ref('email')
const recipient = ref('')
const recipientsList = ref([])
const subject = ref('')
const message = ref('')
const isLoading = ref(false)
const error = ref(null)

// Options for navigation
const options = [
  { id: 'email', label: 'Vienam' },
  { id: 'csv', label: 'CSV' },
  { id: 'group', label: 'Grupei' },
]

// Validation Utilities
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

// Update Handlers
const updateRecipient = (newRecipient) => {
  recipient.value = newRecipient
  recipientsList.value = [newRecipient]
}

const updateEmails = (newEmails) => {
  recipientsList.value = newEmails.length === 1 && newEmails[0] 
    ? [newEmails[0].trim()] 
    : newEmails
}

const updateSubject = (newSubject) => {
  subject.value = newSubject
}

const updateMessage = (newMessage) => {
  message.value = newMessage
}

// Computed Properties for Validation
const isFormValid = computed(() => {
  return isValidEmail(recipient.value) && 
         subject.value.trim() !== '' && 
         message.value.trim() !== ''
})

// Email Sending Method
const sendEmail = async () => {
  // Reset previous error
  error.value = null

  // Validation
  if (!isValidEmail(recipient.value)) {
    error.value = 'Invalid email address'
    alert('Please enter a valid email address!')
    return
  }

  if (!subject.value.trim()) {
    error.value = 'Subject is required'
    alert('Please enter a subject!')
    return
  }

  if (!message.value.trim()) {
    error.value = 'Message is required'
    alert('Please enter a message!')
    return
  }

  // Prepare email data
  const emailData = {
    recipient: recipient.value.trim(),
    subject: subject.value.trim(),
    message: message.value.trim(),
  }

  // Loading state
  isLoading.value = true

  try {
    // Use your backend URL here
    const response = await axios.post(
      'https://praktika2025.onrender.com', 
      emailData
    )

    // Success handling
    console.log("✅ Email sent successfully:", response.data)
    alert('Email sent successfully!')

    // Reset form
    recipient.value = ''
    subject.value = ''
    message.value = ''
  } catch (err) {
    // Error handling
    console.error('❌ Error sending email:', err)
    
    const errorMessage = err.response?.data?.error 
      || err.message 
      || 'Failed to send email'
    
    error.value = errorMessage
    alert(errorMessage)
  } finally {
    // Always reset loading state
    isLoading.value = false
  }
}
</script>

<style scoped>
.disabled:opacity-50 {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
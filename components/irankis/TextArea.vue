<template>
  <div class="flex flex-col items-center justify-center w-full p-4">
    <div class="w-full border p-4 rounded-lg shadow-lg bg-white text-gray-700 font-arial text-base leading-6">
      <div>
        <p class="font-bold text-lg ml-2 mb-2">Žinutės tema</p>
        <input
          id="inputField"
          type="text"
          :value="subject"
          @input="updateSubject" 
          class="font-bold text-gray-900 text-lg border-2 rounded-lg w-full p-2"
          placeholder="Tekstas..."
          onfocus="this.placeholder = ''"
          onblur="this.placeholder = 'Tekstas...'"
        />
      </div>
      <div class="my-2">
        <p class="font-bold ml-2 text-lg">Aprašymas</p>
      </div>
      <div
          id="editor" 
          class="w-full p-2 rounded-lg bg-white border-2 text-gray-400 font-arial overflow-auto"
          contenteditable="true"
          style="height: 500px; white-space: pre-wrap; word-wrap: break-word;"
          @input="onEditorInput"
          @focus="isEditorFocused = true"
          @blur="isEditorFocused = false"
      >
      </div>

      <!-- Controls -->
      <div class="flex gap-4 items-center justify-center mt-4">
        <!-- Bold Button -->
        <button @click="execCommand('bold')" class="text-xl font-bold text-gray-700 hover:text-blue-500">B</button>

        <!-- Italic Button -->
        <button @click="execCommand('italic')" class="text-xl text-gray-700 hover:text-blue-500">I</button>

        <!-- Underline Button -->
        <button @click="execCommand('underline')" class="text-xl text-gray-700 hover:text-blue-500">U</button>

        <!-- Font Color Button -->
        <input type="color" @input="changeFontColor" class="w-8 h-8 border border-gray-300 rounded-md" />

        <!-- Font Size Dropdown -->
        <select @change="changeFontSize($event)" class="p-2 border rounded-md">
          <option value="small">Mažas</option>
          <option value="medium">Normalus</option>
          <option value="large">Didelis</option>
          <option value="huge">Masyvus</option>
        </select>

        <!-- Add Hyperlink Button -->
        <button @click="addHyperlink" class="text-xl text-gray-700 hover:text-blue-500">
          🔗
        </button>

        <button @click="addImageBelowText" class="text-xl text-gray-700 hover:text-blue-500">
  🖼️
</button>
        <!-- Attachments Section -->
        <div class="relative">
          <button @click="triggerFileUpload" class="text-xl text-gray-700 hover:text-blue-500">
            📎
          </button>
          <input 
            type="file" 
            id="fileInput" 
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" 
            class="hidden" 
            @change="handleFileUpload"
            multiple
          />
        </div>

        <!-- Alignment Controls -->
        <button @click="execCommand('justifyLeft')" class="text-xl text-gray-700 hover:text-blue-500">
          <Icon icon="material-symbols:format-align-left" />
        </button>
        <button @click="execCommand('justifyCenter')" class="text-xl text-gray-700 hover:text-blue-500">
          <Icon icon="material-symbols:format-align-justify" />
        </button>
        <button @click="execCommand('justifyRight')" class="text-xl text-gray-700 hover:text-blue-500">
          <Icon icon="material-symbols:format-align-right" />
        </button>
        <!-- Alignment Controls for Images -->
        <button v-if="selectedImage" @click="alignImageLeft" class="text-xl text-gray-700 hover:text-blue-500">
          <Icon icon="material-symbols:format-align-left" />
        </button>
        <button v-if="selectedImage" @click="alignImageCenter" class="text-xl text-gray-700 hover:text-blue-500">
          <Icon icon="material-symbols:format-align-center" />
        </button>
        <button v-if="selectedImage" @click="alignImageRight" class="text-xl text-gray-700 hover:text-blue-500">
          <Icon icon="material-symbols:format-align-right" />
        </button>
      </div>

      <!-- Attachment List -->
      <div v-if="attachedFiles.length > 0" class="mt-4 border-t pt-2">
        <p class="font-bold ml-2 text-lg">Pridėti failai:</p>
        <ul class="list-disc pl-6">
          <li v-for="(file, index) in attachedFiles" :key="index" class="flex items-center gap-2">
            <span>{{ file.name }} ({{ formatFileSize(file.size) }})</span>
            <button @click="removeAttachment(index)" class="text-red-500 hover:text-red-700">
              ❌
            </button>
          </li>
        </ul>
      </div>

      <!-- Send Button -->
<!-- Add the test button inside your TextArea component's template -->
<div class="mt-4 flex justify-end">
  <button @click="sendEmail" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
    Siųsti laišką
  </button>
  <button @click="sendTestEmail" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 ml-2 rounded">
    Test Email
  </button>
  <button @click="() => alert('Regular button clicked')" class="bg-red-500 text-white px-4 py-2 rounded">
  Debug Button
</button>
</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { Icon } from "@iconify/vue";
import interact from "interactjs";  // Import interact.js

const isEditorFocused = ref(false); // Track if editor is focused
const selectedImage = ref(null); // Track the selected image for alignment
const attachedFiles = ref([]); // Store attached files
const inlineImages = ref([]); // Track images displayed in the editor

// Function to handle the editor focus
const focusEditor = () => {
  document.getElementById('editor').focus();
  isEditorFocused.value = true;
};

const execCommand = (command) => {
  document.execCommand(command, false, null);
};

const changeFontColor = (event) => {
  document.execCommand('foreColor', false, event.target.value);
};

const changeFontSize = (event) => {
  const sizes = {
    small: '12px',
    medium: '16px',
    large: '20px',
    huge: '24px',
  };

  const size = sizes[event.target.value];
  document.execCommand('fontSize', false, '7'); // Temporary size
  const spans = document.querySelectorAll('font[size="7"]');
  spans.forEach((span) => {
    span.removeAttribute('size');
    span.style.fontSize = size;
  });
};

// Function to turn selected text into a hyperlink
const addHyperlink = () => {
  let url = prompt('Įveskite nuorodą:'); // Prompt user for URL
  if (url) {
    // Ensure URL starts with "http://" or "https://"
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    document.execCommand('createLink', false, url);
    document.execCommand('foreColor', false, '#1E90FF'); // Color the link blue
  }
};

// Function to trigger the file input for file uploads
const triggerFileUpload = () => {
  document.getElementById('fileInput').click();
};

// Function to handle file uploads
const handleFileUpload = (event) => {
  const files = event.target.files;
  
  if (files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check if it's an image
      if (file.type.startsWith('image/')) {
        // Option to embed in editor or attach
        if (confirm(`Ar norite įterpti ${file.name} į tekstą? Pasirinkite "Atmesti" jei norite pridėti kaip priedą.`)) {
          insertImageIntoEditor(file);
        } else {
          // Add as attachment
          attachedFiles.value.push(file);
        }
      } else {
        // Non-image files can only be attachments
        attachedFiles.value.push(file);
      }
    }
  }
  
  // Reset the file input to allow the same file to be selected again
  event.target.value = '';
};

const insertImageIntoEditor = (file) => {
  const reader = new FileReader();
  
  reader.onload = (e) => {
    const img = document.createElement('img');
    
    // Use base64 directly in the src attribute
    img.src = e.target.result; // This is already base64
    
    // Add important email-friendly attributes
    img.setAttribute('alt', file.name || 'Embedded Image');
    
    // Inline styles for email compatibility
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.display = 'block';
    img.style.marginLeft = 'auto';
    img.style.marginRight = 'auto';
    
    // Insert into editor
    const editor = document.getElementById('editor');
    editor.appendChild(img);
  };
  
  reader.readAsDataURL(file);
};
// Resizing logic with interact.js
const makeImageResizable = (img) => {
  interact(img)
    .resizable({
      edges: { top: false, left: false, bottom: true, right: true },
      inertia: true,
      modifiers: [
        interact.modifiers.restrictSize({
          min: { width: 50, height: 50 },
        })
      ],
      onmove(event) {
        img.style.width = `${event.rect.width}px`;
        img.style.height = `${event.rect.height}px`;
      },
      onstart() {
        img.style.pointerEvents = 'none';
      },
      onend() {
        img.style.pointerEvents = 'auto';
      },
      ondragstart(event) {
        event.preventDefault();
      }
    });
};

// Function to remove an attachment
const removeAttachment = (index) => {
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

// Set selected image for alignment
const selectImage = (imgElement) => {
  if (selectedImage.value) {
    selectedImage.value.style.border = 'none';
  }
  
  imgElement.style.border = '1px solid blue';
  selectedImage.value = imgElement;
};

// Handle image click inside the editor
const handleImageClick = (event) => {
  if (event.target.tagName === 'IMG') {
    selectImage(event.target);
  }
};

// Alignment functions for images
const alignImageLeft = () => {
  if (selectedImage.value) {
    selectedImage.value.style.display = 'block';
    selectedImage.value.style.marginLeft = '0';
    selectedImage.value.style.marginRight = 'auto';
  }
};

const alignImageCenter = () => {
  if (selectedImage.value) {
    selectedImage.value.style.display = 'block';
    selectedImage.value.style.marginLeft = 'auto';
    selectedImage.value.style.marginRight = 'auto';
  }
};

const alignImageRight = () => {
  if (selectedImage.value) {
    selectedImage.value.style.display = 'block';
    selectedImage.value.style.marginLeft = 'auto';
    selectedImage.value.style.marginRight = '0';
  }
};

const processImagesForEmail = (htmlContent) => {
  // Create a temporary div to work with the HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  // Process all images in the HTML
  const images = tempDiv.querySelectorAll('img');
  const imageAttachments = [];
  
  // Check each image
  images.forEach((img, index) => {
    // Skip images that don't have a src or have an external URL
    if (!img.src || !img.src.trim() || img.src.startsWith('http')) {
      // Remove images with no src to prevent empty <img> tags
      if (!img.src || !img.src.trim()) {
        img.remove();
      }
      return;
    }
    
    // Now we know it's either a data URL or a CID reference
    if (img.src.startsWith('data:')) {
      // Generate a unique content ID
      const contentId = `img_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Add to image attachments array
      imageAttachments.push({
        content: img.src.split(',')[1], // Remove data URL prefix
        filename: `inline_image_${index}.jpg`, // Generate a filename
        type: img.src.split(';')[0].split(':')[1] || 'image/jpeg', // Extract MIME type or default to JPEG
        disposition: 'inline',
        content_id: contentId
      });
      
      // Replace the data URL with the content ID reference
      img.src = `cid:${contentId}`;
      
      // Add important attributes for proper display in email clients
      img.setAttribute('width', img.width || '600');
      img.setAttribute('height', img.height || 'auto');
      img.setAttribute('alt', img.alt || 'Embedded Image');
      
      // Add more styling for better email client compatibility
      img.style.display = 'block';
      img.style.marginLeft = 'auto';
      img.style.marginRight = 'auto';
      img.style.border = 'none';
    }
  });
  
  return {
    processedHtml: tempDiv.innerHTML,
    imageAttachments: imageAttachments
  };
};

const sendEmail = async () => {
  try {
    console.log("📩 sendEmail function called in TextArea");
  console.log("Current recipient:", props.recipient);
  console.log("Current subject:", document.getElementById('inputField').value);
    const emailContent = document.getElementById('editor').innerHTML;
    const emailSubject = document.getElementById('inputField').value;
    
    // Make sure we have a subject
    if (!emailSubject.trim()) {
      alert('Prašome įvesti laiško temą');
      return;
    }
    
    // Make sure we have either content or attachments
    if (!emailContent.trim() && attachedFiles.value.length === 0) {
      alert('Prašome įvesti laišką arba pridėti priedų');
      return;
    }
    
    // Log the recipient from props for debugging
    console.log("📧 Using recipient from props:", props.recipient);
    
    // If no recipient is provided, show an error
    if (!props.recipient || props.recipient.trim() === '') {
      alert('Prašome įvesti gavėjo el. paštą');
      return;
    }
    
    // Create a new div for processing the content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = emailContent;
    
    // Get all image elements
    const images = tempDiv.querySelectorAll('img');
    const attachments = [];
    
    // Show loading state
    const sendButton = document.querySelector('button.bg-blue-500');
    let buttonOriginalText = 'Siųsti laišką'; // Default value
    
    if (sendButton) {
      buttonOriginalText = sendButton.textContent;
      sendButton.textContent = 'Siunčiama...';
      sendButton.disabled = true;
    }
    
    // First add regular file attachments
    for (const file of attachedFiles.value) {
      const base64Content = await fileToBase64(file);
      attachments.push({
        content: base64Content.split(',')[1],
        filename: file.name,
        type: file.type,
        disposition: 'attachment'
      });
    }
    
    // Process each image
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      
      // Only process data URLs (embedded images)
      if (img.src && img.src.startsWith('data:')) {
        // Simple, sequential content IDs
        const contentId = `image_${i}`;
        
        // Extract the base64 data and MIME type
        const matches = img.src.match(/^data:(.+?);base64,(.+)$/);
        
        if (matches && matches.length === 3) {
          const mimeType = matches[1] || 'image/jpeg';
          const base64Data = matches[2];
          
          // Add as an attachment with inline disposition
          attachments.push({
            content: base64Data,
            filename: `image_${i}.jpg`,
            type: mimeType,
            disposition: 'inline',
            content_id: contentId
          });
          
          // Replace with CID reference
          img.src = `cid:${contentId}`;
          
          // Ensure proper attributes
          if (!img.hasAttribute('width')) img.setAttribute('width', '600');
          if (!img.hasAttribute('alt')) img.setAttribute('alt', 'Email Image');
          img.setAttribute('border', '0');
        }
      }
    }
    
    // Prepare email data
    const emailData = {
      recipient: props.recipient.trim(),
      subject: emailSubject,
      message: tempDiv.innerHTML,
      attachments: attachments
    };
    
    console.log("📤 Sending email to:", emailData.recipient);
    
    // Make API call to your backend
    const response = await fetch('https://praktika2025.onrender.com/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData)
    });
    
    // Reset button
    if (sendButton) {
      sendButton.textContent = buttonOriginalText;
      sendButton.disabled = false;
    }
    
    const result = await response.json();
    
    if (response.ok) {
      alert('Laiškas išsiųstas sėkmingai!');
      // Clear the form
      document.getElementById('inputField').value = '';
      document.getElementById('editor').innerHTML = '';
      attachedFiles.value = [];
      inlineImages.value = [];
      
      // Emit an event to notify the parent component of successful sending
      emit('emailSent', true);
    } else {
      alert(`Klaida: ${result.error || 'Nepavyko išsiųsti laiško'}`);
    }
  } catch (error) {
    console.error('Klaida siunčiant laišką:', error);
    alert('Klaida siunčiant laišką: ' + error.message);
    
    // Reset button in case of error
    const sendButton = document.querySelector('button.bg-blue-500');
    if (sendButton) {
      sendButton.textContent = 'Siųsti laišką';
      sendButton.disabled = false;
    }
  }
};

// Add test function
const sendTestEmail = async () => {
  try {
    // Create a unique content ID that works reliably
    const uniqueId = `img_${Date.now()}`;
    
    // Create HTML with proper image reference
    const simpleHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
        <h2 style="color: #333;">Test Email with Image</h2>
        <p style="color: #666; line-height: 1.5;">This is a test email to verify image handling. You should see a colored rectangle below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <img src="cid:${uniqueId}" width="300" height="200" alt="Test Image" 
               style="border: 1px solid #ddd; max-width: 100%;">
        </div>
        
        <p style="color: #666; line-height: 1.5;">If you don't see the image above, there might be an issue with how inline images are being processed.</p>
      </div>
    `;

    // Red rectangle image
    const testImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAASwAAADICAYAAABS39xVAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAP0SURBVHhe7dUxAQAwDMCwUfqXNZHOHgjg5ws4IQgkCIFEgkCAEEgkCAQIgUSCQIAQSCQIBAiBRIJAgBBIJAgECIFEgkCAEEgkCAQIgUSCQIAQSCQIBAiBRIJAgBBIJAgECIFEgkCAEEgkCAQIgUSCQIAQSCQIBAiBRIJAgBBIJAgECIFEgkCAEEgkCAQIgUSCQIAQSCQIBAiBRIJAgBBIJAgECIFEgkCAEEgkCAQIgUSCQIAQSCQIBAiBRIJAgBBIJAgECIFEgkCAEEgkCAQIgUSCQIAQSCQIBAiBRIJAgBBIJAgECIFEgkCAEEgkCAQIgUSCQIAQSCQIBAiBRIJAgBBIJAgECIFEgkCAEEgkCAQIgUSCQIAQSCQIBAiBRIJAgBBIJAgECIFEgkCAEEgkCAQIgUSCQIAQSCQIBAiBRIJAgBBIJAgECIFEgkCAEEgkCAQIgUSCQIAQSCQIBAiBRIJAgBBIJAgECIFEgkCAEEgkCAQIgUSCQIAQSCQIBAiBRIJAgBBIJAgECIFEgkCAEEgkCAQIgUSCQIAQSCQIBAiBRIJAgBBIJAgECIFEgkCAEEgkCAQIgUSCQIAQSCQIBAiBRIJAgBBIJAgECIFEgkCAEEgkCAQIgUSCQIAQSCQIBAiBRIJAgBBIJAgECIFEgkCAEEgkCAQIgUSCQIAQSCQIBAiBRIJAgBBIJAgECIFEgkCAEEgkCAQIgUSCQIAQSCQIBAiBRIJAgBBIJAgECIFEgkCAEEgkCAQIgUSCQIAQSCQIBAiBRIJAgBBIJAgECIFEgkCAEEgkCAQIgUSCQIAQSCQIBAiBRIJAgBBIJAgECIFEgkCAEEgkCAQIgUSCQIAQSCQIBAiBRIJAgBBIJAgECIFEgkCAEEgkCAQIgUSCQIAQSCQIBAiBRIJAgBBIJAgECIFEgkCAEEgkCAQIgUSCQIAQSCQIBAiBRIJAgBBIJAgECIFEgkCAEEgkCAQIgUSCQIAQSCQIBAiBRIJAgBBIJAgECIFEgkCAEEgkCAQIgUSCQIAQSCQIBAiBRIJAgBBIJAgECIFEgkCAEEgkCAQIgUSCQIAQSCQIBAiBRIJAgBBIJAgECIFEgkCAEEgkCAQIgUSCQIAQSCQIBAiBRIJAgBBIJAgECIFEgkCAEEgkCAQIgUSCQIAQSCQIBAiBRIJAgBBIJAgECIFEgkCAEEgkCAQIgUSCQIAQSCQIBAiBRIJAgBBIJAgECIFEgkCAEEgkCAQIgUSCQIAQSCQIBAiBRIJAgBBIJAgECIFEgkCAEEgkCAQIgUSCQIAQSCQIBAiBRIJAgBBIJAgECIFEgkCAEEgkCAQIgUSCQIAQSLTdWNdGXJnblAAAAABJRU5ErkJggg==";

    // Prepare email data
    const testEmailData = {
      recipient: props.recipient.trim(),
      subject: "Test Email with Image - " + new Date().toISOString(),
      message: simpleHtml,
      attachments: [{
        content: testImageBase64,
        filename: "test-red-rectangle.png",
        type: "image/png",
        disposition: "inline",
        content_id: uniqueId // Important: match this to the img src
      }]
    };

    console.log("📧 Sending test email with following data:", {
      recipient: testEmailData.recipient,
      subject: testEmailData.subject,
      attachments: testEmailData.attachments.length
    });
    
    // Send email
    const response = await fetch('https://praktika2025.onrender.com/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testEmailData)
    });

    const result = await response.json();
    
    if (response.ok) {
      window.alert('Test email sent successfully!'); 
      console.log("✅ Test email sent result:", result);
    } else {
      window.alert(`Error: ${result.error || 'Failed to send test email'}`);
      console.error("❌ Error sending test email:", result);
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    window.alert('Error sending test email: ' + error.message);
  }
};
// Add image click event listener after mounting
onMounted(() => {
  const editor = document.getElementById('editor');
  editor.addEventListener('click', handleImageClick);
  
  // Listen for clicks outside to unfocus the image
  document.addEventListener('click', handleOutsideClick);
});

onBeforeUnmount(() => {
  // Cleanup the event listener when the component is destroyed
  document.removeEventListener('click', handleOutsideClick);
});

// Function to handle clicks outside the editor or alignment buttons
const handleOutsideClick = (event) => {
  const editor = document.getElementById('editor');
  const alignmentButtons = document.querySelectorAll('.text-xl');
  const isClickInsideEditor = editor.contains(event.target);
  const isClickOnAlignmentButton = Array.from(alignmentButtons).some(button => button.contains(event.target));

  if (!isClickInsideEditor && !isClickOnAlignmentButton) {
    if (selectedImage.value) {
      selectedImage.value.style.border = 'none';
      selectedImage.value = null;
    }
  }
};

const addImageBelowText = () => {
  // Get the current editor
  const editor = document.getElementById('editor');
  
  // Create a line break to ensure the image appears on a new line
  const br = document.createElement('br');
  editor.appendChild(br);
  
  // Now trigger the normal image upload/insertion process
  triggerFileUpload();
};

const props = defineProps({
  subject: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  recipient: {
    type: String,
    required: true,
  }
});

// Define emits for updating subject and message
const emit = defineEmits(['updateSubject', 'updateMessage']);

// Emit updates for subject
const updateSubject = (event) => {
  emit('updateSubject', event.target.value);
};

const updateMessage = (content) => {
  emit('updateMessage', content);
};

const onEditorInput = (event) => {
  const content = event.target.innerHTML;
  updateMessage(content);
};


</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Arimo:wght@400;700&display=swap');

input::placeholder {
  color: #9e9e9e;
}

#editor {
  font-family: 'Arimo', sans-serif;
  font-size: 16px;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f8fafc;
}

#editor::-webkit-scrollbar {
  width: 8px;
}

#editor::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 4px;
}

#editor::-webkit-scrollbar-track {
  background-color: #f8fafc;
}

#editor:empty::before {
  content: "Tekstas...";
  color: #9e9e9e;
  font-size: 18px;
  font-weight: bold;
  pointer-events: none;
}

#editor {
  color: black;
}

#editor:empty {
  color: transparent;
}

#editor:focus:empty::before {
  content: '';
}

#editor:empty {
  min-height: 1em;
}

#editor:focus {
  caret-color: blue;
}

.hidden {
  display: none;
}

img {
  max-width: 100%; /* Make the image responsive */
  height: auto;
  position: relative;
  pointer-events: auto;  /* Ensure the image is interactive */
}

a {
  color: #1E90FF; /* Set hyperlink color to blue */
  text-decoration: none;
}
</style>
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
      </div>

      <!-- Attachment List -->
      <div v-if="attachedFilesInternal.length > 0" class="mt-4 border-t pt-2">
        <p class="font-bold ml-2 text-lg">Pridėti failai:</p>
        <ul class="list-disc pl-6">
          <li v-for="(file, index) in attachedFilesInternal" :key="index" class="flex items-center gap-2">
            <span>{{ file.name }} ({{ formatFileSize(file.size) }})</span>
            <button @click="removeAttachment(index)" class="text-red-500 hover:text-red-700">
              ❌
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { Icon } from "@iconify/vue";
import interact from "interactjs";  // Import interact.js

const isEditorFocused = ref(false); // Track if editor is focused
const selectedImage = ref(null); // Track the selected image for alignment
const inlineImages = ref([]); // Track images displayed in the editor

// NEW: Internal state for attached files
const attachedFilesInternal = ref([]);

// Props from parent
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
  },
  // MODIFIED: Accept attachedFiles from parent
  attachedFiles: {
    type: Array,
    default: () => []
  }
});

// NEW: Watch for changes in props.attachedFiles and sync with internal state
watch(() => props.attachedFiles, (newFiles) => {
  attachedFilesInternal.value = [...newFiles];
}, { immediate: true });

// MODIFIED: Add emit for file updates
const emit = defineEmits(['updateSubject', 'updateMessage', 'updateAttachedFiles']);

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

const handleFileUpload = (event) => {
  const files = event.target.files;
  
  if (files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Add all files (including images) directly as attachments
      attachedFilesInternal.value.push(file);
      // Emit update to parent
      emit('updateAttachedFiles', attachedFilesInternal.value);
    }
  }
  
  // Reset the file input to allow the same file to be selected again
  event.target.value = '';
};

// MODIFIED: Function to remove an attachment with emit
const removeAttachment = (index) => {
  attachedFilesInternal.value.splice(index, 1);
  // NEW: Emit update to parent
  emit('updateAttachedFiles', attachedFilesInternal.value);
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
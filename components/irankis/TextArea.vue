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

        <button @click="addImageFromURL" class="text-xl text-gray-700 hover:text-blue-500">
  🖼️
</button>
        <input 
          type="file" 
          id="fileInput" 
          accept="image/*" 
          class="hidden" 
          @change="handleFileUpload"
        />

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
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { Icon } from "@iconify/vue";
import interact from "interactjs";  // Import interact.js

const isEditorFocused = ref(false); // Track if editor is focused
const selectedImage = ref(null); // Track the selected image for alignment

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

// Function to trigger the file input for image upload
const triggerFileUpload = () => {
  // Focus the editor field first to make sure the image is inserted in the editor
  focusEditor();
  document.getElementById('fileInput').click();
};

// Function to add an image via URL
const addImageFromURL = () => {
  focusEditor(); // Ensure the editor is focused
  let url = prompt('Įveskite nuotraukos URL:'); // Prompt user for an image URL
  if (url) {
    const img = document.createElement('img');
    img.src = url;
    img.style.minWidth = '400px'; // Ensure the image fits within the editor
    img.style.height = '400px';
    img.style.cursor = 'move'; // Image movement cursor
    img.contentEditable = "false"; // Make image uneditable to allow resizing

    const editor = document.getElementById('editor');
    if (editor) {
      const selection = window.getSelection();
      const range = selection.rangeCount ? selection.getRangeAt(0) : null;

      if (range) {
        range.deleteContents(); // Remove any selected content
        range.insertNode(img); // Insert the image at the cursor position
      } else {
        editor.appendChild(img); // Append if no range is selected
      }

      // Make the image resizable using interact.js
      makeImageResizable(img);
    }
  }
};


// Resizing logic with interact.js
const makeImageResizable = (img) => {
  interact(img)
    .resizable({
      edges: { top: false, left: false, bottom: true, right: true },  // Enable resizing only from bottom-right corner
      inertia: true,
      modifiers: [
        interact.modifiers.restrictSize({
          min: { width: 50, height: 50 }, // Minimum size for the image
        })
      ],
      onmove(event) {
        img.style.width = `${event.rect.width}px`;
        img.style.height = `${event.rect.height}px`;
      },
      // Disable dragging while resizing
      onstart() {
        img.style.pointerEvents = 'none';  // Disable pointer events during resize to prevent dragging
      },
      onend() {
        img.style.pointerEvents = 'auto';  // Re-enable pointer events after resize
      },
      // Prevent dragging behavior by disabling the move cursor during resizing
      ondragstart(event) {
        event.preventDefault();  // Prevent the default drag behavior
      }
    });
};

// Set selected image for alignment
const selectImage = (imgElement) => {
  // Deselect any previously selected image
  if (selectedImage.value) {
    selectedImage.value.style.border = 'none';
  }
  
  // Select the new image and add a border
  imgElement.style.border = '1px solid blue';
  selectedImage.value = imgElement;
};

// Handle image click inside the editor
const handleImageClick = (event) => {
  if (event.target.tagName === 'IMG') {
    selectImage(event.target);
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
  const alignmentButtons = document.querySelectorAll('.text-xl'); // Adjust selector to match your alignment buttons
  const isClickInsideEditor = editor.contains(event.target);
  const isClickOnAlignmentButton = Array.from(alignmentButtons).some(button => button.contains(event.target));

  // If the click is outside the editor and alignment buttons, unfocus the image
  if (!isClickInsideEditor && !isClickOnAlignmentButton) {
    if (selectedImage.value) {
      selectedImage.value.style.border = 'none'; // Deselect the image
      selectedImage.value = null;
    }
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

// Define props
const props = defineProps({
  subject: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
});

// Define emits for updating subject and message
const emit = defineEmits(['updateSubject', 'updateMessage']);

// Emit updates for subject
const updateSubject = (event) => {
  emit('updateSubject', event.target.value);
};

const updateMessage = (content) => {
  emit('updateMessage', content); // Send the updated content to the parent component
};

const onEditorInput = (event) => {
  const content = event.target.innerHTML; // Get the updated content from the editor
  updateMessage(content); // Emit the updated message
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

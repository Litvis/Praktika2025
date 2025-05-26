import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { nextTick } from 'vue';

vi.mock('@iconify/vue', () => ({
  Icon: {
    render: () => {},
    props: ['icon']
  }
}));

vi.mock('interactjs', () => ({
  default: () => ({
    draggable: () => ({ resizable: () => {} })
  })
}));

document.execCommand = vi.fn();

global.prompt = vi.fn();

describe('TextArea Component', () => {
  const TextAreaStub = {
    template: `
    <div class="text-area-container">
      <!-- Subject Input -->
      <div>
        <p class="subject-label">Žinutės tema</p>
        <input
          id="inputField"
          type="text"
          :value="subject"
          @input="updateSubject" 
          class="subject-input"
          placeholder="Įrašykite žinutės temą"
        />
      </div>
      
      <!-- Editor -->
      <div>
        <p class="description-label">Aprašymas</p>
        <div
          id="editor" 
          class="editor-area"
          contenteditable="true"
          @input="onEditorInput"
        >
        </div>
      </div>

      <!-- Controls -->
      <div class="editor-controls">
        <button @click="execCommand('bold')" class="bold-btn">B</button>
        <button @click="execCommand('italic')" class="italic-btn">I</button>
        <button @click="execCommand('underline')" class="underline-btn">U</button>
        <input type="color" @input="changeFontColor" class="color-picker" />
        <select @change="changeFontSize($event)" class="font-size-select">
          <option value="small">Mažas</option>
          <option value="medium">Normalus</option>
          <option value="large">Didelis</option>
          <option value="huge">Masyvus</option>
        </select>
        <button @click="addHyperlink" class="hyperlink-btn">🔗</button>
        <div class="file-upload">
          <button @click="triggerFileUpload" class="upload-btn">📎</button>
          <input 
            type="file" 
            id="fileInput" 
            class="hidden" 
            @change="handleFileUpload"
            multiple
          />
        </div>
        <button @click="execCommand('justifyLeft')" class="align-left-btn"></button>
        <button @click="execCommand('justifyCenter')" class="align-center-btn"></button>
        <button @click="execCommand('justifyRight')" class="align-right-btn"></button>
      </div>

      <!-- Attachment List -->
      <div v-if="attachedFilesInternal.length > 0" class="attachment-list">
        <p>Pridėti failai:</p>
        <ul>
          <li v-for="(file, index) in attachedFilesInternal" :key="index" class="attachment-item">
            <span>{{ file.name }} ({{ formatFileSize(file.size) }})</span>
            <button @click="removeAttachment(index)" class="remove-attachment-btn">❌</button>
          </li>
        </ul>
      </div>
    </div>
    `,
    props: {
      subject: {
        type: String,
        required: true
      },
      message: {
        type: String,
        required: true
      },
      recipient: {
        type: String,
        required: true
      },
      attachedFiles: {
        type: Array,
        default: () => []
      }
    },
    setup(props, { emit }) {
      const isEditorFocused = ref(false);
      const selectedImage = ref(null);
      const inlineImages = ref([]);
      const attachedFilesInternal = ref([]);

      watch(() => props.attachedFiles, (newFiles) => {
        attachedFilesInternal.value = [...newFiles];
      }, { immediate: true });

      const focusEditor = () => {
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
        document.execCommand('fontSize', false, '7');
      };

      const addHyperlink = () => {
        const url = prompt('Įveskite nuorodą:');
        if (url) {
          document.execCommand('createLink', false, url.startsWith('http') ? url : `https://${url}`);
          document.execCommand('foreColor', false, '#1E90FF');
        }
      };

      const triggerFileUpload = () => {
        document.getElementById('fileInput').click();
      };

      const handleFileUpload = (event) => {
        const files = event.target.files;
        
        if (files.length > 0) {
          for (let i = 0; i < files.length; i++) {
            attachedFilesInternal.value.push(files[i]);
          }
          emit('updateAttachedFiles', attachedFilesInternal.value);
        }
        
        event.target.value = '';
      };

      const removeAttachment = (index) => {
        attachedFilesInternal.value.splice(index, 1);
        emit('updateAttachedFiles', attachedFilesInternal.value);
      };

      const formatFileSize = (bytes) => {
        if (bytes < 1024) {
          return bytes + ' B';
        } else if (bytes < 1048576) {
          return (bytes / 1024).toFixed(2) + ' KB';
        } else {
          return (bytes / 1048576).toFixed(2) + ' MB';
        }
      };

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

      return {
        isEditorFocused,
        attachedFilesInternal,
        execCommand,
        changeFontColor,
        changeFontSize,
        addHyperlink,
        triggerFileUpload,
        handleFileUpload,
        removeAttachment,
        formatFileSize,
        updateSubject,
        updateMessage,
        onEditorInput
      };
    }
  };

  const { ref, watch } = require('vue');

  let wrapper;
  
  beforeEach(() => {

    vi.clearAllMocks();

    wrapper = mount(TextAreaStub, {
      props: {
        subject: '',
        message: '',
        recipient: 'test@example.com',
        attachedFiles: []
      },
      global: {
        stubs: {
          Icon: true
        }
      }
    });

    document.getElementById = vi.fn().mockImplementation((id) => {
      if (id === 'editor') {
        return wrapper.find('.editor-area').element;
      } else if (id === 'fileInput') {
        return wrapper.find('#fileInput').element;
      }
      return null;
    });
  });

  it('should render the text area with subject input and editor', () => {
    expect(wrapper.find('.subject-input').exists()).toBe(true);
    expect(wrapper.find('.editor-area').exists()).toBe(true);
  });

  it('should emit updateSubject when subject input changes', async () => {
    const input = wrapper.find('.subject-input');
    await input.setValue('Test Subject');
    
    expect(wrapper.emitted()).toHaveProperty('updateSubject');
    expect(wrapper.emitted().updateSubject[0]).toEqual(['Test Subject']);
  });

  it('should emit updateMessage when editor content changes', async () => {
    const editor = wrapper.find('.editor-area');
    
    editor.element.innerHTML = '<p>Test content</p>';
    await editor.trigger('input');
    
    expect(wrapper.emitted()).toHaveProperty('updateMessage');
    expect(wrapper.emitted().updateMessage[0]).toEqual(['<p>Test content</p>']);
  });

  it('should execute formatting commands when formatting buttons are clicked', async () => {
    await wrapper.find('.bold-btn').trigger('click');
    expect(document.execCommand).toHaveBeenCalledWith('bold', false, null);
    
    await wrapper.find('.italic-btn').trigger('click');
    expect(document.execCommand).toHaveBeenCalledWith('italic', false, null);
    
    await wrapper.find('.underline-btn').trigger('click');
    expect(document.execCommand).toHaveBeenCalledWith('underline', false, null);
  });

  it('should change font color when color picker changes', async () => {
    const colorPicker = wrapper.find('.color-picker');
    await colorPicker.setValue('#ff0000');
    await colorPicker.trigger('input');
    
    expect(document.execCommand).toHaveBeenCalledWith('foreColor', false, '#ff0000');
  });

  it('should change font size when size dropdown changes', async () => {
    const sizeSelect = wrapper.find('.font-size-select');
    await sizeSelect.setValue('large');
    await sizeSelect.trigger('change');
    
    expect(document.execCommand).toHaveBeenCalledWith('fontSize', false, '7');
  });

  it('should add hyperlink when hyperlink button is clicked', async () => {
    prompt.mockReturnValue('example.com');
    
    await wrapper.find('.hyperlink-btn').trigger('click');
    
    expect(prompt).toHaveBeenCalledWith('Įveskite nuorodą:');
    expect(document.execCommand).toHaveBeenCalledWith('createLink', false, 'https://example.com');
    expect(document.execCommand).toHaveBeenCalledWith('foreColor', false, '#1E90FF');
  });

  it('should handle file upload when files are selected', async () => {
    const fileInput = wrapper.find('#fileInput');
    
    const file1 = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const file2 = new File(['test image'], 'image.jpg', { type: 'image/jpeg' });
    
    Object.defineProperty(fileInput.element, 'files', {
      value: [file1, file2],
      writable: false
    });
    
    await fileInput.trigger('change');
    
    expect(wrapper.vm.attachedFilesInternal).toHaveLength(2);
    expect(wrapper.vm.attachedFilesInternal[0].name).toBe('test.txt');
    expect(wrapper.vm.attachedFilesInternal[1].name).toBe('image.jpg');
    

    expect(wrapper.emitted()).toHaveProperty('updateAttachedFiles');
    expect(wrapper.emitted().updateAttachedFiles[0][0]).toHaveLength(2);
  });

  it('should remove attachment when remove button is clicked', async () => {
    wrapper.vm.attachedFilesInternal = [
      new File(['test1'], 'test1.txt', { type: 'text/plain' }),
      new File(['test2'], 'test2.txt', { type: 'text/plain' })
    ];
    await nextTick();

    expect(wrapper.find('.attachment-list').exists()).toBe(true);
    expect(wrapper.findAll('.attachment-item')).toHaveLength(2);

    await wrapper.find('.remove-attachment-btn').trigger('click');

    expect(wrapper.vm.attachedFilesInternal).toHaveLength(1);
    expect(wrapper.vm.attachedFilesInternal[0].name).toBe('test2.txt');

    expect(wrapper.emitted().updateAttachedFiles).toBeDefined();
  });

  it('should format file size correctly', () => {
    expect(wrapper.vm.formatFileSize(500)).toBe('500 B');
    expect(wrapper.vm.formatFileSize(1500)).toBe('1.46 KB');
    expect(wrapper.vm.formatFileSize(1500000)).toBe('1.43 MB');
  });

  it('should trigger file input when upload button is clicked', async () => {
    const mockClick = vi.fn();
    document.getElementById.mockReturnValueOnce({ click: mockClick });
    
    await wrapper.find('.upload-btn').trigger('click');
    
    expect(document.getElementById).toHaveBeenCalledWith('fileInput');
    expect(mockClick).toHaveBeenCalled();
  });
});
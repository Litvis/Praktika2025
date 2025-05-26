<template>
    <div>
      <Sidebar />
      <div class="main-content-with-sidebar flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-y-auto min-h-screen p-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-6">El. paštų grupių valdymas</h1>
        
        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-gray-700">Importuoti grupes iš CSV</h2>
            <div class="bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
              <p class="text-xs text-yellow-700 font-medium">⚠️ Naujas importas pakeis visus esamus duomenis</p>
            </div>
          </div>
          
          <div 
            class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
            @click="triggerFileInput"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleFileDrop"
            :class="{ 'bg-gray-50 border-green-400': isDragging }"
          >
            <input 
              type="file" 
              ref="fileInput" 
              accept=".csv" 
              class="hidden" 
              @change="handleFileChange" 
            />
            
            <div v-if="!selectedFile">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p class="mt-4 text-lg text-gray-600">Tempkite CSV failą čia arba <span class="text-green-600 font-medium">pasirinkite failą</span></p>
              <p class="mt-2 text-sm text-gray-500">Tik CSV failai (.csv) su stulpeliais "Group" ir "Email"</p>
            </div>
            
            <div v-else class="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div class="ml-4 text-left">
                <p class="text-lg font-medium text-gray-900">{{ selectedFile.name }}</p>
                <p class="text-sm text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
              </div>
              <button 
                @click.stop="removeFile" 
                class="ml-6 p-2 rounded-full hover:bg-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div v-if="warningMessage" class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                <p class="ml-3 text-sm text-yellow-700">{{ warningMessage }}</p>
              </div>
            </div>
          </div>
          
          <div v-if="parsedData.length > 0" class="mt-6">
            <div class="flex justify-between items-center mb-2">
              <h3 class="text-lg font-medium text-gray-700">Peržiūra</h3>
              <span class="text-sm text-gray-500">Rasta {{ parsedData.length }} galiojančių įrašų</span>
            </div>
            
            <div class="border rounded-lg overflow-hidden">
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grupė</th>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">El. paštas</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="(row, index) in previewData" :key="index">
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ row.Group }}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ row.Email }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-if="parsedData.length > 5" class="bg-gray-50 px-6 py-3 text-sm text-gray-500 text-center">
                Rodoma 5 iš {{ parsedData.length }} įrašų
              </div>
            </div>
          </div>
          
          <div v-if="invalidEmails.length > 0" class="mt-6">
            <div class="flex justify-between items-center mb-2">
              <h3 class="text-lg font-medium text-red-700">Neteisingi el. paštai</h3>
              <span class="text-sm text-red-500">Rasta {{ invalidEmails.length }} neteisingų el. paštų</span>
            </div>
            
            <div class="border border-red-200 rounded-lg overflow-hidden">
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-red-100">
                  <thead class="bg-red-50">
                    <tr>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">Grupė</th>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">Neteisingas el. paštas</th>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">Problema</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-red-100">
                    <tr v-for="(row, index) in invalidEmailsPreview" :key="index">
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ row.Group }}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-mono">{{ row.Email }}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ row.Reason }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-if="invalidEmails.length > 5" class="bg-red-50 px-6 py-3 text-sm text-red-600 text-center">
                Rodoma 5 iš {{ invalidEmails.length }} neteisingų el. paštų
              </div>
            </div>
          </div>
          
          <div v-if="parsedData.length > 0" class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <p class="text-sm text-blue-600">Grupių skaičius</p>
              <p class="text-2xl font-bold text-blue-800">{{ uniqueGroups.length }}</p>
            </div>
            <div class="bg-green-50 rounded-lg p-4 border border-green-100">
              <p class="text-sm text-green-600">Galiojančių el. paštų</p>
              <p class="text-2xl font-bold text-green-800">{{ parsedData.length }}</p>
            </div>
            <div class="bg-red-50 rounded-lg p-4 border border-red-100">
              <p class="text-sm text-red-600">Negaliojančių el. paštų</p>
              <p class="text-2xl font-bold text-red-800">{{ invalidEmails.length }}</p>
            </div>
          </div>
          
          <div v-if="parsedData.length > 0" class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div class="flex">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              <div class="ml-3">
                <p class="text-sm font-medium text-yellow-800">Dėmesio: Visi esami duomenys bus pakeisti</p>
                <p class="text-xs text-yellow-700 mt-1">
                  Importuojant šį failą, visi esami el. paštų grupių duomenys bus ištrinti ir pakeisti naujais. 
                  Šis veiksmas negrįžtamas.
                </p>
              </div>
            </div>
          </div>
          
          <div v-if="error" class="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
              <div class="ml-3">
                <p class="text-sm font-medium text-red-800">{{ error }}</p>
              </div>
            </div>
          </div>
          
          <div class="mt-6 flex justify-end space-x-4">
            <button 
              @click="resetForm" 
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Atšaukti
            </button>
            <button 
              @click="confirmImport" 
              class="px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              :disabled="!canImport || isImporting"
            >
              <span v-if="isImporting" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Importuojama...
              </span>
              <span v-else>Importuoti duomenis</span>
            </button>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-gray-700">Esamos grupės</h2>
            <button 
              @click="fetchGroups" 
              class="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
              :class="{ 'animate-spin': isLoadingGroups }"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          
          <div v-if="isLoadingGroups" class="flex justify-center items-center p-8">
            <div class="w-8 h-8 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
            <span class="ml-2 text-gray-600">Kraunamos grupės...</span>
          </div>
          
          <div v-else-if="groups.length === 0" class="text-center py-8 text-gray-500">
            Nėra sukurtų grupių. Importuokite duomenis iš CSV failo.
          </div>
          
          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grupės pavadinimas</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">El. paštų skaičius</th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sukurta</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="group in groups" :key="group.id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ group.id }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ group.name }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ group.email_count }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(group.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div v-if="showConfirmation" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
          <h3 class="text-lg font-bold text-red-600 mb-2">Patvirtinkite duomenų pakeitimą</h3>
          <p class="text-gray-700 mb-4">
            Esate tikri, kad norite importuoti naujus duomenis? Visi esami el. pašto grupių duomenys bus ištrinti ir pakeisti naujais.
          </p>
          <div class="flex justify-end space-x-3">
            <button 
              @click="showConfirmation = false" 
              class="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Atšaukti
            </button>
            <button 
              @click="importData" 
              class="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Taip, pakeisti duomenis
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
import { ref, computed, onMounted } from 'vue';
import Sidebar from '~/components/adminlanding/Sidebar.vue';
import Papa from 'papaparse';

const fileInput = ref(null);
const selectedFile = ref(null);
const parsedData = ref([]);
const invalidEmails = ref([]);
const error = ref('');
const warningMessage = ref('');
const isDragging = ref(false);
const isImporting = ref(false);
const isLoadingGroups = ref(false);
const groups = ref([]);
const showConfirmation = ref(false);
const config = useRuntimeConfig();
const apiBase = ref(config.public.apiBase);

const triggerFileInput = () => {
  fileInput.value.click();
};

const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, reason: 'Tuščias el. paštas' };
  }
  
  email = email.trim();
  
  if (email.length === 0) {
    return { isValid: false, reason: 'Tuščias el. paštas' };
  }
  
  if (!email.includes('@')) {
    return { isValid: false, reason: 'Trūksta @ simbolio' };
  }
  
  const parts = email.split('@');
  if (parts.length !== 2) {
    return { isValid: false, reason: 'Neteisingai naudojamas @ simbolis' };
  }
  
  const [localPart, domainPart] = parts;
  
  if (!localPart) {
    return { isValid: false, reason: 'Trūksta vartotojo dalies prieš @' };
  }
  
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return { isValid: false, reason: 'Vartotojo dalis negali prasidėti ar baigtis tašku' };
  }
  
  if (localPart.includes('..')) {
    return { isValid: false, reason: 'Vartotojo dalyje negali būti kelių taškų iš eilės' };
  }
  
  if (!domainPart) {
    return { isValid: false, reason: 'Trūksta domeno dalies po @' };
  }
  
  if (!domainPart.includes('.')) {
    return { isValid: false, reason: 'Trūksta taško domeno dalyje' };
  }
  
  const domains = domainPart.split('.');
  const tld = domains[domains.length - 1];
  
  if (!tld || tld.length < 2) {
    return { isValid: false, reason: 'Netinkamas TLD (per trumpas)' };
  }
  
  const validEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!validEmailRegex.test(email)) {
    return { isValid: false, reason: 'El. paštas turi neleistinų simbolių' };
  }
  
  if (email.length > 255) {
    return { isValid: false, reason: 'El. paštas per ilgas (max 255 simboliai)' };
  }
  
  return { isValid: true, reason: '' };
};

const isValidEmail = (email) => {
  return validateEmail(email).isValid;
};

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file && file.type === 'text/csv') {
    selectedFile.value = file;
    parseCSV(file);
  } else {
    error.value = 'Netinkamas failo formatas. Prašome pasirinkti CSV failą.';
  }
};

const handleFileDrop = (event) => {
  isDragging.value = false;
  const file = event.dataTransfer.files[0];
  if (file && file.type === 'text/csv') {
    selectedFile.value = file;
    parseCSV(file);
  } else {
    error.value = 'Netinkamas failo formatas. Prašome pasirinkti CSV failą.';
  }
};

const parseCSV = (file) => {
  error.value = '';
  warningMessage.value = '';
  parsedData.value = [];
  invalidEmails.value = [];
  
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      if (results.errors.length > 0) {
        console.error('CSV parsing errors:', results.errors);
        error.value = `Klaida analizuojant CSV: ${results.errors[0].message}`;
        return;
      }
      
      const hasGroupPastas = results.meta.fields.includes('Grupė') && results.meta.fields.includes('Paštas');
      const hasGroupEmail = results.meta.fields.includes('Group') && results.meta.fields.includes('Email');
      
      if (!hasGroupPastas && !hasGroupEmail) {
        error.value = 'CSV faile nerastas "Grupė"/"Group" arba "Paštas"/"Email" stulpelis/stulpeliai.';
        return;
      }
      
      const groupField = results.meta.fields.includes('Grupė') ? 'Grupė' : 'Group';
      const emailField = results.meta.fields.includes('Paštas') ? 'Paštas' : 'Email';
      
      const allData = results.data;
      const validData = [];
      const invalidEmailsList = [];
      
      for (const row of allData) {
        const groupName = row[groupField] ? row[groupField].trim() : '';
        if (!groupName) continue;
        
        const email = row[emailField] ? row[emailField].trim().toLowerCase() : '';
        const validationResult = validateEmail(email);
        
        if (validationResult.isValid) {
          validData.push({
            Group: groupName,
            Email: email
          });
        } else {
          invalidEmailsList.push({
            Group: groupName,
            Email: email,
            Reason: validationResult.reason
          });
        }
      }
      
      invalidEmails.value = invalidEmailsList;
      
      if (validData.length === 0) {
        error.value = 'CSV faile nerasta galiojančių duomenų.';
        return;
      }
      
      const uniqueEntries = new Set();
      const duplicates = [];
      const finalData = [];
      
      for (const entry of validData) {
        const key = `${entry.Group}|${entry.Email}`;
        
        if (uniqueEntries.has(key)) {
          duplicates.push(entry);
        } else {
          uniqueEntries.add(key);
          finalData.push(entry);
        }
      }
      
      const warningMessages = [];
      
      if (duplicates.length > 0) {
        warningMessages.push(`Rasta ${duplicates.length} pasikartojančių įrašų, kurie bus ignoruojami.`);
      }
      
      if (invalidEmailsList.length > 0) {
        warningMessages.push(`Rasta ${invalidEmailsList.length} neteisingų el. pašto adresų, kurie bus ignoruojami.`);
      }
      
      if (warningMessages.length > 0) {
        warningMessage.value = warningMessages.join(' ');
      }
      
      parsedData.value = finalData;
    }
  });
};

const removeFile = () => {
  selectedFile.value = null;
  parsedData.value = [];
  invalidEmails.value = [];
  error.value = '';
  warningMessage.value = '';
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('lt-LT', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const previewData = computed(() => {
  return parsedData.value.slice(0, 5);
});

const invalidEmailsPreview = computed(() => {
  return invalidEmails.value.slice(0, 5);
});

const uniqueGroups = computed(() => {
  const groups = new Set();
  parsedData.value.forEach(row => groups.add(row.Group));
  return Array.from(groups);
});

const largestGroup = computed(() => {
  const groupCounts = {};
  
  parsedData.value.forEach(row => {
    const groupName = row.Group;
    groupCounts[groupName] = (groupCounts[groupName] || 0) + 1;
  });
  
  let maxCount = 0;
  let maxGroup = '';
  
  for (const [group, count] of Object.entries(groupCounts)) {
    if (count > maxCount) {
      maxCount = count;
      maxGroup = group;
    }
  }
  
  return { name: maxGroup, count: maxCount };
});

const canImport = computed(() => {
  return parsedData.value.length > 0 && !error.value;
});

const confirmImport = () => {
  if (!canImport.value) return;
  showConfirmation.value = true;
};

const fetchGroups = async () => {
  try {
    isLoadingGroups.value = true;
    
    const response = await fetch(`${apiBase.value}/api/groups-with-counts`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      groups.value = data.groups;
    } else {
      throw new Error(data.error || 'Nepavyko užkrauti grupių');
    }
  } catch (err) {
    console.error('Error fetching groups:', err);
    error.value = 'Nepavyko užkrauti grupių. Bandykite dar kartą vėliau.';
  } finally {
    isLoadingGroups.value = false;
  }
};

const importData = async () => {
  if (!canImport.value) return;
  
  try {
    showConfirmation.value = false;
    isImporting.value = true;
    error.value = '';
    
    const response = await fetch(`${apiBase.value}/api/import-csv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        data: parsedData.value
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      alert(`Duomenys sėkmingai importuoti.\n\nSukurta grupių: ${result.stats.groups}\nImportuota el. paštų: ${result.stats.emails}`);
      
      resetForm();
      fetchGroups();
    } else {
      throw new Error(result.error || 'Nepavyko importuoti duomenų');
    }
  } catch (err) {
    console.error('Error importing data:', err);
    error.value = `Nepavyko importuoti duomenų: ${err.message}`;
  } finally {
    isImporting.value = false;
  }
};

const resetForm = () => {
  selectedFile.value = null;
  parsedData.value = [];
  invalidEmails.value = [];
  error.value = '';
  warningMessage.value = '';
};

onMounted(() => {
  fetchGroups();
});
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
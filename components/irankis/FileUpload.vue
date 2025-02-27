<template>
  <div>
    <input type="file" accept=".csv" @change="handleFileUpload" />
    <table v-if="emails.length > 0">
      <thead>
        <tr>
          <th>Email</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(email, index) in emails" :key="index">
          <td>{{ email }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, defineEmits } from 'vue';

const emit = defineEmits(); // Define emit function to send events back to parent
const emails = ref([]); // Store the emails extracted from the CSV file

// Function to handle file upload and parse CSV
const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file && file.type === 'text/csv') {
    const reader = new FileReader();

    reader.onload = function (e) {
      const fileContent = e.target.result;
      parseCSV(fileContent); // Parse the CSV content once it's read
    };

    reader.readAsText(file); // Read the CSV file as text
  } else {
    alert('Please upload a valid CSV file.');
  }
};

// Function to parse the CSV data and extract emails
const parseCSV = (csvData) => {
  const lines = csvData.split('\n');
  const emailList = [];

  lines.forEach(line => {
    const columns = line.split(',');

    // Ensure the line contains more than one column and extract the second column (emails)
    if (columns.length > 1) {
      emailList.push(columns[1].trim()); // Assuming emails are in the second column
    }
  });

  // Emit the emails array back to the parent component
  emit('updateEmails', emailList);

  // If there are no emails, handle the case where we might get an empty CSV file or no emails
  if (emailList.length === 0) {
    alert("No valid emails found in the CSV file.");
  }
};
</script>

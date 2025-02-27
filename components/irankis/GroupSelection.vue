<template>
  <div class="flex flex-col">
    <label for="group" class="text-md font-medium text-gray-700 ml-2">
      Pasirinkite grupę
    </label>
    <select
      id="group"
      v-model="selectedGroup"
      class="mt-2 block w-full px-4 py-2 text-gray-700 border-2 border-green-600 rounded-md shadow-lg focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-green-800"
    >
      <option value="" disabled>Pasirinkite grupę</option>
      <option v-for="group in groups" :key="group.id" :value="group.id">
        {{ group.name }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// Mocked group data
const groups = [
  { id: 1, name: 'Grupė 1' },
  { id: 2, name: 'Grupė 2' },
  { id: 3, name: 'Grupė 3' },
];

// Selected group state
const selectedGroup = ref('');
</script>

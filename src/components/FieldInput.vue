<script setup>

defineProps({ column: { type: Object, required: true } })
const model = defineModel()
</script>

<template>
  <input v-if="column.type === 'boolean'" v-model="model" type="checkbox" />
  <input
    v-else-if="column.type === 'integer' || column.type === 'numeric'"
    v-model="model"
    type="number"
    :step="column.type === 'numeric' ? '0.01' : '1'"
    :required="column.required"
  />
  <input v-else-if="column.type === 'date'" v-model="model" type="date" :required="column.required" />
  <input v-else v-model="model" type="text" :required="column.required" />
</template>

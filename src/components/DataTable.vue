<script setup>
import { ref, computed, watch } from 'vue'
import { api } from '../api.js'
import FieldInput from './FieldInput.vue'

const props = defineProps({
  db: { type: String, required: true },
  table: { type: Object, required: true },
})

const rows = ref([])
const loading = ref(false)
const error = ref('')
const search = ref('')
const editingId = ref(null)
const editRow = ref({})
const newRow = ref({})

function emptyRow() {
  return Object.fromEntries(props.table.columns.map((c) => [c.name, c.type === 'boolean' ? false : '']))
}

function label(name) {
  return name.replace(/_/g, ' ')
}

function display(row, col) {
  const v = row[col.name]
  if (v === null || v === undefined) return '—'
  if (col.type === 'boolean') return v ? 'Yes' : 'No'
  if (col.type === 'numeric') return Number(v).toFixed(2)
  return v
}

const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return rows.value
  return rows.value.filter((r) => Object.values(r).some((v) => String(v ?? '').toLowerCase().includes(q)))
})

async function run(action) {
  error.value = ''
  try {
    await action()
  } catch (e) {
    error.value = e.message
  }
}

async function load() {
  loading.value = true
  await run(async () => {
    rows.value = await api.list(props.db, props.table.name)
  })
  loading.value = false
}

function addRow() {
  run(async () => {
    const created = await api.create(props.db, props.table.name, newRow.value)
    rows.value.push(created)
    newRow.value = emptyRow()
  })
}

function startEdit(row) {
  editingId.value = row.id
  editRow.value = Object.fromEntries(props.table.columns.map((c) => [c.name, row[c.name] ?? '']))
}

function cancelEdit() {
  editingId.value = null
}

function saveEdit(id) {
  run(async () => {
    const updated = await api.update(props.db, props.table.name, id, editRow.value)
    rows.value = rows.value.map((r) => (r.id === id ? updated : r))
    editingId.value = null
  })
}

function deleteRow(row) {
  if (!confirm(`Delete row #${row.id} from ${props.table.label}?`)) return
  run(async () => {
    await api.remove(props.db, props.table.name, row.id)
    rows.value = rows.value.filter((r) => r.id !== row.id)
  })
}


watch(
  () => [props.db, props.table.name],
  () => {
    editingId.value = null
    search.value = ''
    newRow.value = emptyRow()
    load()
  },
  { immediate: true },
)
</script>

<template>
  <section class="panel">
    <div class="toolbar">
      <input v-model="search" type="search" placeholder="Search rows…" class="search" />
      <span class="count">{{ filteredRows.length }} of {{ rows.length }} rows</span>
      <button class="secondary" @click="load">Refresh</button>
    </div>

    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>id</th>
            <th v-for="col in table.columns" :key="col.name">
              {{ label(col.name) }}<span v-if="col.required" class="req">*</span>
            </th>
            <th class="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="table.columns.length + 2" class="muted">Loading…</td>
          </tr>
          <tr v-else-if="!filteredRows.length">
            <td :colspan="table.columns.length + 2" class="muted">No rows</td>
          </tr>
          <tr v-for="row in filteredRows" v-else :key="row.id" :class="{ editing: editingId === row.id }">
            <td class="muted">{{ row.id }}</td>
            <template v-if="editingId === row.id">
              <td v-for="col in table.columns" :key="col.name">
                <FieldInput v-model="editRow[col.name]" :column="col" @keyup.enter="saveEdit(row.id)" />
              </td>
              <td class="actions">
                <button @click="saveEdit(row.id)">Save</button>
                <button class="secondary" @click="cancelEdit">Cancel</button>
              </td>
            </template>
            <template v-else>
              <td v-for="col in table.columns" :key="col.name">{{ display(row, col) }}</td>
              <td class="actions">
                <button class="secondary" @click="startEdit(row)">Edit</button>
                <button class="danger" @click="deleteRow(row)">Delete</button>
              </td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>

    <form class="add-form" @submit.prevent="addRow">
      <h3>Add a row to {{ table.label }}</h3>
      <div class="fields">
        <label v-for="col in table.columns" :key="col.name" :class="{ check: col.type === 'boolean' }">
          <span>{{ label(col.name) }}<span v-if="col.required" class="req">*</span></span>
          <FieldInput v-model="newRow[col.name]" :column="col" />
        </label>
      </div>
      <button type="submit">Add row</button>
    </form>
  </section>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.search {
  flex: 1;
  min-width: 12rem;
}
.count {
  color: var(--muted);
  font-size: 0.9rem;
}
.error {
  background: var(--danger-bg);
  color: var(--danger);
  border: 1px solid var(--danger);
  padding: 0.6rem 0.8rem;
  border-radius: 6px;
}
.table-wrap {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: 8px;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  text-align: left;
  padding: 0.55rem 0.75rem;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}
th {
  background: var(--surface-2);
  text-transform: capitalize;
  font-weight: 600;
  font-size: 0.85rem;
}
tbody tr:last-child td {
  border-bottom: none;
}
tbody tr:hover {
  background: var(--surface-2);
}
tr.editing {
  background: var(--accent-bg);
}
td input:not([type='checkbox']) {
  width: 100%;
  min-width: 7rem;
}
.actions {
  display: flex;
  gap: 0.4rem;
}
.actions-col {
  width: 1%;
}
.muted {
  color: var(--muted);
}
.req {
  color: var(--danger);
  margin-left: 2px;
}
.add-form {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1rem;
  background: var(--surface);
}
.add-form h3 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
}
.fields {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
  gap: 0.75rem;
  margin-bottom: 0.9rem;
}
.fields label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
  text-transform: capitalize;
}
.fields label.check {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  align-self: end;
  padding-bottom: 0.4rem;
}
</style>

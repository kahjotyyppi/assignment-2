<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from './api.js'
import DataTable from './components/DataTable.vue'

const databases = ref([])
const selectedDb = ref('')
const selectedTable = ref('')
const error = ref('')

const currentDb = computed(() => databases.value.find((d) => d.name === selectedDb.value))
const currentTable = computed(() => currentDb.value?.tables.find((t) => t.name === selectedTable.value))

function selectDb(name) {
  selectedDb.value = name
  selectedTable.value = currentDb.value.tables[0]?.name ?? ''
}

onMounted(async () => {
  try {
    databases.value = await api.databases()
    if (databases.value.length) selectDb(databases.value[0].name)
  } catch (e) {
    error.value = `Could not reach the API: ${e.message}`
  }
})
</script>

<template>
  <div class="layout">
    <aside class="sidebar">
      <h1>DB Manager</h1>
      <p class="hint">Select a database</p>
      <nav>
        <button
          v-for="db in databases"
          :key="db.name"
          class="db-btn"
          :class="{ active: db.name === selectedDb }"
          @click="selectDb(db.name)"
        >
          <strong>{{ db.label }}</strong>
          <small>{{ db.name }}</small>
        </button>
      </nav>
    </aside>

    <main class="content">
      <p v-if="error" class="error">{{ error }}</p>

      <template v-if="currentDb">
        <header class="content-head">
          <h2>{{ currentDb.label }}</h2>
          <p class="muted">{{ currentDb.description }} · PostgreSQL database <code>{{ currentDb.name }}</code></p>
        </header>

        <div class="tabs" role="tablist">
          <button
            v-for="t in currentDb.tables"
            :key="t.name"
            role="tab"
            :aria-selected="t.name === selectedTable"
            :class="{ active: t.name === selectedTable }"
            @click="selectedTable = t.name"
          >
            {{ t.label }}
          </button>
        </div>

        <DataTable v-if="currentTable" :db="currentDb.name" :table="currentTable" />
      </template>
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
}
.sidebar {
  background: var(--surface);
  border-right: 1px solid var(--border);
  padding: 1.5rem 1rem;
}
.sidebar h1 {
  font-size: 1.25rem;
  margin: 0 0 1.25rem;
}
.hint {
  color: var(--muted);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 0.5rem;
}
nav {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.db-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  background: transparent;
  color: var(--text);
  border: 1px solid transparent;
  padding: 0.6rem 0.75rem;
}
.db-btn small {
  color: var(--muted);
  font-family: ui-monospace, monospace;
}
.db-btn:hover {
  background: var(--surface-2);
}
.db-btn.active {
  background: var(--accent-bg);
  border-color: var(--accent);
}
.content {
  padding: 1.5rem 2rem;
  min-width: 0;
}
.content-head h2 {
  margin: 0;
}
.content-head p {
  margin: 0.25rem 0 1rem;
}
.muted {
  color: var(--muted);
}
.tabs {
  display: flex;
  gap: 0.25rem;
  border-bottom: 1px solid var(--border);
  margin-bottom: 1rem;
}
.tabs button {
  background: transparent;
  color: var(--muted);
  border: none;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  padding: 0.6rem 1rem;
}
.tabs button.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
  font-weight: 600;
}
.error {
  background: var(--danger-bg);
  color: var(--danger);
  border: 1px solid var(--danger);
  padding: 0.6rem 0.8rem;
  border-radius: 6px;
}

@media (max-width: 720px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .sidebar {
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
  nav {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .content {
    padding: 1rem;
  }
}
</style>

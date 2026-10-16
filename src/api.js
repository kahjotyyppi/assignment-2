async function request(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

export const api = {
  databases: () => request('GET', '/api/databases'),
  list: (db, table) => request('GET', `/api/${db}/${table}`),
  create: (db, table, row) => request('POST', `/api/${db}/${table}`, row),
  update: (db, table, id, row) => request('PUT', `/api/${db}/${table}/${id}`, row),
  remove: (db, table, id) => request('DELETE', `/api/${db}/${table}/${id}`),
}

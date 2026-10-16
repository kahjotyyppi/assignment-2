import express from 'express'
import { databases } from './schema.js'
import { getPool, ensureDatabases } from './db.js'

const app = express()
app.use(express.json())

function resolveTable(req, res, next) {
  const db = databases[req.params.db]
  const table = db?.tables[req.params.table]
  if (!table) return res.status(404).json({ error: 'Unknown database or table' })
  req.table = table
  req.pool = getPool(req.params.db)
  next()
}

function pickValues(table, body) {
  const values = {}
  for (const col of table.columns) {
    if (!(col.name in body)) continue
    let v = body[col.name]
    if (v === '' || v === undefined) v = null
    else if (col.type === 'integer') v = parseInt(v, 10)
    else if (col.type === 'numeric') v = Number(v)
    else if (col.type === 'boolean') v = v === true || v === 'true'
    if (typeof v === 'number' && Number.isNaN(v)) {
      throw Object.assign(new Error(`"${col.name}" must be a number`), { status: 400 })
    }
    values[col.name] = v
  }
  return values
}

function parseId(req) {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) throw Object.assign(new Error('Invalid id'), { status: 400 })
  return id
}

app.get('/api/databases', (req, res) => {
  res.json(
    Object.entries(databases).map(([name, db]) => ({
      name,
      label: db.label,
      description: db.description,
      tables: Object.entries(db.tables).map(([tname, t]) => ({
        name: tname,
        label: t.label,
        columns: t.columns.map(({ name, type, required }) => ({ name, type, required: !!required })),
      })),
    })),
  )
})

app.get('/api/:db/:table', resolveTable, async (req, res, next) => {
  try {
    const { rows } = await req.pool.query(`SELECT * FROM "${req.params.table}" ORDER BY id`)
    res.json(rows)
  } catch (err) {
    next(err)
  }
})

app.post('/api/:db/:table', resolveTable, async (req, res, next) => {
  try {
    const values = pickValues(req.table, req.body)
    const names = Object.keys(values)
    const sql = names.length
      ? `INSERT INTO "${req.params.table}" (${names.map((n) => `"${n}"`).join(', ')})
         VALUES (${names.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`
      : `INSERT INTO "${req.params.table}" DEFAULT VALUES RETURNING *`
    const { rows } = await req.pool.query(sql, Object.values(values))
    res.status(201).json(rows[0])
  } catch (err) {
    next(err)
  }
})

app.put('/api/:db/:table/:id', resolveTable, async (req, res, next) => {
  try {
    const id = parseId(req)
    const values = pickValues(req.table, req.body)
    const names = Object.keys(values)
    if (!names.length) return res.status(400).json({ error: 'No fields to update' })
    const set = names.map((n, i) => `"${n}" = $${i + 1}`).join(', ')
    const { rows } = await req.pool.query(
      `UPDATE "${req.params.table}" SET ${set} WHERE id = $${names.length + 1} RETURNING *`,
      [...Object.values(values), id],
    )
    if (!rows.length) return res.status(404).json({ error: 'Row not found' })
    res.json(rows[0])
  } catch (err) {
    next(err)
  }
})

app.delete('/api/:db/:table/:id', resolveTable, async (req, res, next) => {
  try {
    const id = parseId(req)
    const { rowCount } = await req.pool.query(`DELETE FROM "${req.params.table}" WHERE id = $1`, [id])
    if (!rowCount) return res.status(404).json({ error: 'Row not found' })
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

app.use((err, req, res, next) => {
  const clientError = err.status === 400 || /^2[23]/.test(err.code ?? '')
  if (!clientError) console.error(err)
  res.status(clientError ? 400 : 500).json({ error: err.message })
})

const port = Number(process.env.PORT || 3000)

try {
  if (process.env.PGLOCAL === 'true') {
    const { startLocalPostgres } = await import('./local-postgres.js')
    await startLocalPostgres()
  }
  await ensureDatabases()
} catch (err) {
  console.error('Could not set up PostgreSQL databases:')
  console.error('Check that PostgreSQL is running and the PG* settings in .env are correct.')
  process.exit(1)
}

app.listen(port, () => console.log(`API listening on http://localhost:${port}`))

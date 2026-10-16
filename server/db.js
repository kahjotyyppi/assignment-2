import pg from 'pg'
import { databases, createTableSql } from './schema.js'

// Return DATE columns as plain 'YYYY-MM-DD' strings and NUMERIC as numbers
pg.types.setTypeParser(1082, (v) => v)
pg.types.setTypeParser(1700, (v) => (v === null ? null : parseFloat(v)))

const connection = {
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
}

const pools = {}

export function getPool(dbName) {
  if (!databases[dbName]) throw new Error(`Unknown database ${dbName}`)
  pools[dbName] ??= new pg.Pool({ ...connection, database: dbName })
  return pools[dbName]
}

export async function ensureDatabases() {
  const admin = new pg.Client({ ...connection, database: process.env.PGADMINDB || 'postgres' })
  await admin.connect()
  try {
    for (const dbName of Object.keys(databases)) {
      const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName])
      if (rowCount === 0) {
        await admin.query(`CREATE DATABASE "${dbName}" ENCODING 'UTF8' TEMPLATE template0`)
        console.log(`Created database ${dbName}`)
      }
    }
  } finally {
    await admin.end()
  }

  for (const [dbName, db] of Object.entries(databases)) {
    const pool = getPool(dbName)
    for (const [tableName, table] of Object.entries(db.tables)) {
      await pool.query(createTableSql(tableName, table))
      const { rows } = await pool.query(`SELECT COUNT(*)::int AS n FROM "${tableName}"`)
      if (rows[0].n === 0 && table.seed) {
        const names = table.columns.map((c) => `"${c.name}"`).join(', ')
        const params = table.columns.map((_, i) => `$${i + 1}`).join(', ')
        for (const row of table.seed) {
          await pool.query(`INSERT INTO "${tableName}" (${names}) VALUES (${params})`, row)
        }
        console.log(`Seeded ${dbName}.${tableName}`)
      }
    }
  }
}

export async function closePools() {
  await Promise.all(Object.values(pools).map((p) => p.end()))
}

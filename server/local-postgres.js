import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import EmbeddedPostgres from 'embedded-postgres'

const dataDir = fileURLToPath(new URL('../pgdata', import.meta.url))

export async function startLocalPostgres() {
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    persistent: true,
    initdbFlags: ['--encoding=UTF8', '--locale=C'],
    onLog: () => {},
  })

  if (!existsSync(`${dataDir}/PG_VERSION`)) {
    console.log('Initialising local PostgreSQL in pgdata/ …')
    await pg.initialise()
  }
  await pg.start()
  console.log(`Local PostgreSQL running on port ${process.env.PGPORT || 5432}`)

  const stop = async () => {
    await pg.stop()
    process.exit(0)
  }
  process.once('SIGINT', stop)
  process.once('SIGTERM', stop)
}

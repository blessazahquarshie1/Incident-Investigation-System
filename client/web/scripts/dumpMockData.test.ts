// One-off: dumps the TypeScript mock data to JSON so the Rust API can seed the database.
// Skipped unless DUMP_MOCK is set, so it does nothing during a normal `npm test`.
// Delete this file together with src/data/ once the frontend reads from the API.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'vitest'
import { mockData } from '../src/data/index'

test.skipIf(!process.env.DUMP_MOCK)('dump mock data to api/seed/mock_data.json', () => {
  const here = dirname(fileURLToPath(import.meta.url))
  const out = resolve(here, '../../../api/seed/mock_data.json')

  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, JSON.stringify(mockData, null, 2))

  console.log('Wrote', out)
  for (const [key, value] of Object.entries(mockData)) {
    console.log(key.padEnd(18), (value as unknown[]).length)
  }
})
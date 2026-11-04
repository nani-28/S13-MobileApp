import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.resolve(root, '../data')
const dbPath = path.join(dataDir, 'salon-lila.sqlite')

fs.mkdirSync(dataDir, { recursive: true })

export const db = new DatabaseSync(dbPath)

db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    test_id TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS slots (
    id TEXT PRIMARY KEY,
    time TEXT NOT NULL,
    test_id TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    service_id TEXT NOT NULL,
    slot_id TEXT NOT NULL UNIQUE,
    FOREIGN KEY (client_id) REFERENCES users(id),
    FOREIGN KEY (service_id) REFERENCES services(id),
    FOREIGN KEY (slot_id) REFERENCES slots(id)
  );
`)

export function resetStore() {
  db.exec('DELETE FROM bookings')
  db.exec('DELETE FROM slots')
  db.exec('DELETE FROM services')
  db.exec('DELETE FROM users')

  const insertUser = db.prepare('INSERT INTO users (id, name, role) VALUES (?, ?, ?)')
  insertUser.run('user-ana', 'Ana', 'client')
  insertUser.run('user-maria', 'María', 'client')
  insertUser.run('pro-lila', 'Lila', 'professional')

  const insertService = db.prepare(
    'INSERT INTO services (id, name, price_cents, test_id) VALUES (?, ?, ?, ?)',
  )
  insertService.run('svc-corte', 'Corte', 12000, 'service-corte')
  insertService.run('svc-color', 'Coloración', 28000, 'service-color')
  insertService.run('svc-manicure', 'Manicure', 9000, 'service-manicure')

  const insertSlot = db.prepare('INSERT INTO slots (id, time, test_id) VALUES (?, ?, ?)')
  insertSlot.run('slot-1000', '10:00', 'slot-1000')
  insertSlot.run('slot-1100', '11:00', 'slot-1100')
  insertSlot.run('slot-1400', '14:00', 'slot-1400')
  insertSlot.run('slot-1600', '16:00', 'slot-1600')

  db.prepare('INSERT INTO bookings (id, client_id, service_id, slot_id) VALUES (?, ?, ?, ?)').run(
    'book-seed',
    'user-maria',
    'svc-corte',
    'slot-1000',
  )
}

resetStore()

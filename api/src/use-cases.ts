import { Effect } from 'effect'
import { db } from './db.js'
import {
  ServiceNotFoundError,
  SlotNotFoundError,
  SlotTakenError,
  UserNotFoundError,
  type Booking,
  type Service,
  type Slot,
} from './domain.js'
import type { CreateBookingInput } from './schema.js'

type ServiceRow = {
  id: string
  name: string
  price_cents: number
  test_id: string
}

type SlotRow = {
  id: string
  time: string
  test_id: string
  booking_id: string | null
}

type BookingRow = {
  id: string
  client_name: string
  service_name: string
  time: string
}

const mapService = (row: ServiceRow): Service => ({
  id: row.id,
  name: row.name,
  priceCents: row.price_cents,
  testId: row.test_id,
})

const mapSlot = (row: SlotRow): Slot => ({
  id: row.id,
  time: row.time,
  testId: row.test_id,
  available: row.booking_id === null,
})

const mapBooking = (row: BookingRow): Booking => ({
  id: row.id,
  clientName: row.client_name,
  serviceName: row.service_name,
  time: row.time,
})

export const listServices = Effect.sync(() =>
  db
    .prepare(`SELECT id, name, price_cents, test_id FROM services
       ORDER BY CASE id WHEN 'svc-corte' THEN 1 WHEN 'svc-color' THEN 2 WHEN 'svc-manicure' THEN 3 ELSE 9 END`)
    .all()
    .map((row) => mapService(row as ServiceRow)),
)

export const listSlots = Effect.sync(() =>
  db
    .prepare(
      `SELECT s.id, s.time, s.test_id, b.id AS booking_id
       FROM slots s
       LEFT JOIN bookings b ON b.slot_id = s.id
       ORDER BY s.time`,
    )
    .all()
    .map((row) => mapSlot(row as SlotRow)),
)

export const listClientBookings = (userId: string) =>
  Effect.sync(() =>
    db
      .prepare(
        `SELECT b.id, u.name AS client_name, sv.name AS service_name, sl.time
         FROM bookings b
         JOIN users u ON u.id = b.client_id
         JOIN services sv ON sv.id = b.service_id
         JOIN slots sl ON sl.id = b.slot_id
         WHERE b.client_id = ?
         ORDER BY sl.time`,
      )
      .all(userId)
      .map((row) => mapBooking(row as BookingRow)),
  )

export const listProfessionalBookings = Effect.sync(() =>
  db
    .prepare(
      `SELECT b.id, u.name AS client_name, sv.name AS service_name, sl.time
       FROM bookings b
       JOIN users u ON u.id = b.client_id
       JOIN services sv ON sv.id = b.service_id
       JOIN slots sl ON sl.id = b.slot_id
       ORDER BY sl.time`,
    )
    .all()
    .map((row) => mapBooking(row as BookingRow)),
)

export const createBooking = (input: CreateBookingInput) =>
  Effect.gen(function* () {
    const client = db.prepare('SELECT id FROM users WHERE id = ? AND role = ?').get(input.clientId, 'client')
    if (!client) {
      return yield* Effect.fail(new UserNotFoundError())
    }

    const service = db.prepare('SELECT id FROM services WHERE id = ?').get(input.serviceId)
    if (!service) {
      return yield* Effect.fail(new ServiceNotFoundError())
    }

    const slot = db.prepare('SELECT id FROM slots WHERE id = ?').get(input.slotId)
    if (!slot) {
      return yield* Effect.fail(new SlotNotFoundError())
    }

    const taken = db.prepare('SELECT id FROM bookings WHERE slot_id = ?').get(input.slotId)
    if (taken) {
      return yield* Effect.fail(new SlotTakenError())
    }

    const id = `book-${input.slotId}-${Date.now()}`
    db.prepare('INSERT INTO bookings (id, client_id, service_id, slot_id) VALUES (?, ?, ?, ?)').run(
      id,
      input.clientId,
      input.serviceId,
      input.slotId,
    )

    const row = db
      .prepare(
        `SELECT b.id, u.name AS client_name, sv.name AS service_name, sl.time
         FROM bookings b
         JOIN users u ON u.id = b.client_id
         JOIN services sv ON sv.id = b.service_id
         JOIN slots sl ON sl.id = b.slot_id
         WHERE b.id = ?`,
      )
      .get(id) as BookingRow

    return mapBooking(row)
  })

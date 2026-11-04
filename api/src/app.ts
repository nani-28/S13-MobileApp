import { Effect } from 'effect'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { resetStore } from './db.js'
import { bookingsQuerySchema, createBookingSchema } from './schema.js'
import {
  createBooking,
  listClientBookings,
  listProfessionalBookings,
  listServices,
  listSlots,
} from './use-cases.js'

export const app = new Hono()

app.use('*', cors())

app.get('/api/health', (c) => c.json({ ok: true }))

app.post('/api/test/reset', (c) => {
  resetStore()
  return c.json({ ok: true })
})

app.get('/api/services', async (c) => {
  const services = await Effect.runPromise(listServices)
  return c.json({ services })
})

app.get('/api/slots', async (c) => {
  const slots = await Effect.runPromise(listSlots)
  return c.json({ slots })
})

app.get('/api/bookings', async (c) => {
  const parsed = bookingsQuerySchema.safeParse({
    role: c.req.query('role'),
    userId: c.req.query('userId'),
  })

  if (!parsed.success) {
    return c.json({ error: 'Parámetros inválidos' }, 400)
  }

  const bookings =
    parsed.data.role === 'professional'
      ? await Effect.runPromise(listProfessionalBookings)
      : await Effect.runPromise(listClientBookings(parsed.data.userId))

  return c.json({ bookings })
})

app.post('/api/bookings', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = createBookingSchema.safeParse(body)

  if (!parsed.success) {
    return c.json({ error: 'Datos incompletos' }, 400)
  }

  const result = await Effect.runPromise(createBooking(parsed.data).pipe(Effect.either))

  if (result._tag === 'Left') {
    const status = result.left._tag === 'SlotTakenError' ? 409 : 400
    return c.json({ error: result.left.message }, status)
  }

  return c.json({ booking: result.right }, 201)
})

import { z } from 'zod'

export const createBookingSchema = z.object({
  clientId: z.string().min(1),
  serviceId: z.string().min(1),
  slotId: z.string().min(1),
})

export const bookingsQuerySchema = z.object({
  role: z.enum(['client', 'professional']),
  userId: z.string().min(1),
})

export type CreateBookingInput = z.infer<typeof createBookingSchema>

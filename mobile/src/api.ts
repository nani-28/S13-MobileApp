import { Platform } from 'react-native'

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://127.0.0.1:3001')

export type Service = {
  id: string
  name: string
  priceCents: number
  testId: string
}

export type Slot = {
  id: string
  time: string
  testId: string
  available: boolean
}

export type Booking = {
  id: string
  clientName: string
  serviceName: string
  time: string
}

async function readJson(response: Response) {
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(typeof body.error === 'string' ? body.error : 'No se pudo completar la acción')
  }
  return body
}

export async function resetData() {
  await readJson(
    await fetch(`${API_URL}/api/test/reset`, {
      method: 'POST',
    }),
  )
}

export async function fetchServices(): Promise<Service[]> {
  const body = await readJson(await fetch(`${API_URL}/api/services`))
  return body.services
}

export async function fetchSlots(): Promise<Slot[]> {
  const body = await readJson(await fetch(`${API_URL}/api/slots`))
  return body.slots
}

export async function fetchBookings(role: 'client' | 'professional', userId: string): Promise<Booking[]> {
  const query = new URLSearchParams({ role, userId })
  const body = await readJson(await fetch(`${API_URL}/api/bookings?${query}`))
  return body.bookings
}

export async function createBooking(input: { clientId: string; serviceId: string; slotId: string }): Promise<Booking> {
  const body = await readJson(
    await fetch(`${API_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  )
  return body.booking
}

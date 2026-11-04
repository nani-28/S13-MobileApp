export class SlotTakenError {
  readonly _tag = 'SlotTakenError'
  readonly message = 'Ese horario ya está ocupado'
}

export class SlotNotFoundError {
  readonly _tag = 'SlotNotFoundError'
  readonly message = 'El horario no existe'
}

export class ServiceNotFoundError {
  readonly _tag = 'ServiceNotFoundError'
  readonly message = 'El servicio no existe'
}

export class UserNotFoundError {
  readonly _tag = 'UserNotFoundError'
  readonly message = 'La persona no existe'
}

export type BookingError =
  | SlotTakenError
  | SlotNotFoundError
  | ServiceNotFoundError
  | UserNotFoundError

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

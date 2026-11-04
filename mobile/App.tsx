import { StatusBar } from 'expo-status-bar'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import {
  createBooking,
  fetchBookings,
  fetchServices,
  fetchSlots,
  resetData,
  type Booking,
  type Service,
  type Slot,
} from './src/api'

type Role = 'user' | 'professional'
type Screen = 'role' | 'services' | 'slots' | 'appointments' | 'agenda'

const CLIENT_ID = 'user-ana'
const PRO_ID = 'pro-lila'

const SERVICE_COPY: Record<string, { minutes: string; blurb: string; mark: string }> = {
  'svc-corte': { minutes: '45 min', blurb: 'Corte y peinado según la forma del rostro', mark: '01' },
  'svc-color': { minutes: '90 min', blurb: 'Coloración completa con tratamiento', mark: '02' },
  'svc-manicure': { minutes: '50 min', blurb: 'Manicure clásico con esmalte del salón', mark: '03' },
}

function todayLabel() {
  const formatted = new Intl.DateTimeFormat('es-GT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function formatPrice(cents: number) {
  return `Q${(cents / 100).toFixed(2)}`
}

function Banner({ kind, testID, children }: { kind: 'error' | 'success'; testID: string; children: string }) {
  return (
    <View style={[styles.banner, kind === 'error' ? styles.bannerError : styles.bannerSuccess]}>
      <Text style={kind === 'error' ? styles.bannerLabelOnDark : styles.bannerLabel}>
        {kind === 'error' ? 'Algo no se pudo' : 'Listo'}
      </Text>
      <Text testID={testID} nativeID={testID} style={kind === 'error' ? styles.bannerErrorText : styles.bannerSuccessText}>
        {children}
      </Text>
    </View>
  )
}

export default function App() {
  const [role, setRole] = useState<Role | null>(null)
  const [screen, setScreen] = useState<Screen>('role')
  const [services, setServices] = useState<Service[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)

  const title = useMemo(() => {
    if (screen === 'role') return 'Salón Lila'
    if (screen === 'services') return 'Servicios'
    if (screen === 'slots') return 'Horarios'
    if (screen === 'appointments') return 'Mis citas'
    return 'Citas entrantes'
  }, [screen])

  async function withBusy(action: () => Promise<void>) {
    setBusy(true)
    setError('')
    try {
      await action()
    } catch (cause) {
      setSuccess('')
      setError(cause instanceof Error ? cause.message : 'Algo salió mal')
    } finally {
      setBusy(false)
    }
  }

  function goToRole() {
    setRole(null)
    setScreen('role')
    setSelectedService(null)
    setSelectedSlot(null)
    setError('')
    setSuccess('')
    setBookings([])
  }

  async function handleReset() {
    await withBusy(async () => {
      await resetData()
      setSelectedService(null)
      setSelectedSlot(null)
      setSuccess('Datos listos')
      setServices([])
      setSlots([])
      setBookings([])
    })
  }

  async function enterAsUser() {
    await withBusy(async () => {
      const next = await fetchServices()
      setSuccess('')
      setRole('user')
      setServices(next)
      setScreen('services')
    })
  }

  async function enterAsProfessional() {
    await withBusy(async () => {
      const next = await fetchBookings('professional', PRO_ID)
      setSuccess('')
      setRole('professional')
      setBookings(next)
      setScreen('agenda')
    })
  }

  async function continueToSlots() {
    if (!selectedService) {
      setSuccess('')
      setError('Elige un servicio')
      return
    }

    await withBusy(async () => {
      const next = await fetchSlots()
      setSlots(next)
      setSelectedSlot(null)
      setSuccess('')
      setScreen('slots')
    })
  }

  async function confirm() {
    if (!selectedService || !selectedSlot) {
      setSuccess('')
      setError('Elige un horario')
      return
    }

    await withBusy(async () => {
      await createBooking({
        clientId: CLIENT_ID,
        serviceId: selectedService.id,
        slotId: selectedSlot.id,
      })
      const nextSlots = await fetchSlots()
      setSlots(nextSlots)
      setError('')
      setSuccess('Reserva confirmada')
    })
  }

  async function openAppointments() {
    await withBusy(async () => {
      const next = await fetchBookings('client', CLIENT_ID)
      setBookings(next)
      setScreen('appointments')
    })
  }

  return (
    <View style={styles.shell}>
      <StatusBar style="dark" />
      <ScrollView style={styles.frame} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {screen === 'role' ? (
          <View style={styles.hero}>
            <View style={styles.monogram}>
              <Text style={styles.monogramText}>SL</Text>
            </View>
            <Text style={styles.kicker}>Salón de belleza</Text>
            <Text style={styles.heroTitle}>Salón Lila</Text>
            <Text style={styles.heroLead}>4a avenida, zona 10 · Guatemala</Text>
            <View style={styles.chipRow}>
              <Text style={styles.chip}>Citas de hoy</Text>
              <Text style={styles.chip}>Sin walk-in</Text>
            </View>
          </View>
        ) : (
          <View style={styles.topBar}>
            <Text style={styles.kicker}>Salón de belleza</Text>
            <Text style={styles.title}>{title}</Text>
            {role === 'user' ? <Text style={styles.subtitle}>Hola, Ana</Text> : null}
            {role === 'professional' ? <Text style={styles.subtitle}>Hola, Lila</Text> : null}
          </View>
        )}

        {error ? <Banner kind="error" testID="error">{error}</Banner> : null}
        {success ? <Banner kind="success" testID="success">{success}</Banner> : null}

        {screen === 'role' ? (
          <View style={styles.stack}>
            <Text style={styles.sectionLabel}>¿Cómo quieres entrar?</Text>
            <Pressable testID="role-user" nativeID="role-user" style={styles.roleCard} onPress={() => void enterAsUser()} disabled={busy}>
              <View style={styles.roleIcon}>
                <Text style={styles.roleIconText}>A</Text>
              </View>
              <View style={styles.roleCopy}>
                <Text style={styles.roleTitle}>Soy cliente</Text>
                <Text style={styles.roleHint}>Reserva corte, color o manicure con Lila</Text>
              </View>
              <Text style={styles.roleArrow}>→</Text>
            </Pressable>
            <Pressable
              testID="role-professional"
              nativeID="role-professional"
              style={[styles.roleCard, styles.roleCardDark]}
              onPress={() => void enterAsProfessional()}
              disabled={busy}
            >
              <View style={[styles.roleIcon, styles.roleIconDark]}>
                <Text style={styles.roleIconTextDark}>L</Text>
              </View>
              <View style={styles.roleCopy}>
                <Text style={[styles.roleTitle, styles.roleTitleLight]}>Soy profesional</Text>
                <Text style={styles.roleHintLight}>Calendario de citas que van llegando</Text>
              </View>
              <Text style={styles.roleArrowLight}>→</Text>
            </Pressable>
            <Pressable testID="reset-data" nativeID="reset-data" style={styles.ghost} onPress={() => void handleReset()} disabled={busy}>
              <Text style={styles.ghostText}>Reiniciar datos</Text>
            </Pressable>
          </View>
        ) : null}

        {screen === 'services' ? (
          <View style={styles.stack}>
            <Text style={styles.sectionLabel}>Menú del salón</Text>
            {services.map((service) => {
              const selected = selectedService?.id === service.id
              const extra = SERVICE_COPY[service.id]
              return (
                <Pressable
                  key={service.id}
                  testID={service.testId}
                  nativeID={service.testId}
                  style={[styles.serviceCard, selected ? styles.serviceCardSelected : null]}
                  onPress={() => {
                    setError('')
                    setSelectedService(service)
                  }}
                >
                  <View style={styles.serviceMark}>
                    <Text style={styles.serviceMarkText}>{extra?.mark ?? '•'}</Text>
                  </View>
                  <View style={styles.serviceBody}>
                    <View style={styles.serviceHead}>
                      <Text style={styles.cardTitle}>{service.name}</Text>
                      <Text style={styles.price}>{formatPrice(service.priceCents)}</Text>
                    </View>
                    <Text style={styles.cardMeta}>{extra?.blurb}</Text>
                    <Text style={styles.duration}>{extra?.minutes}</Text>
                  </View>
                </Pressable>
              )
            })}
            <Pressable
              testID="continue-services"
              nativeID="continue-services"
              style={styles.primary}
              onPress={() => void continueToSlots()}
              disabled={busy}
            >
              <Text style={styles.primaryText}>Continuar</Text>
            </Pressable>
            <View style={styles.footerLinks}>
              <Pressable testID="go-appointments" nativeID="go-appointments" onPress={() => void openAppointments()} disabled={busy}>
                <Text style={styles.ghostText}>Mis citas</Text>
              </Pressable>
              <Text style={styles.dot}>·</Text>
              <Pressable testID="change-role" nativeID="change-role" onPress={goToRole}>
                <Text style={styles.ghostText}>Cambiar rol</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {screen === 'slots' ? (
          <View style={styles.stack}>
            {selectedService ? (
              <View style={styles.summary}>
                <Text style={styles.summaryKicker}>Tu servicio</Text>
                <Text style={styles.summaryTitle}>
                  {selectedService.name} · {formatPrice(selectedService.priceCents)}
                </Text>
                <Text style={styles.cardMeta}>Con Lila · hoy en el salón</Text>
              </View>
            ) : null}
            <Text style={styles.sectionLabel}>Horarios de hoy</Text>
            <View style={styles.slotGrid}>
              {slots.map((slot) => {
                const selected = selectedSlot?.id === slot.id
                return (
                  <Pressable
                    key={slot.id}
                    testID={slot.testId}
                    nativeID={slot.testId}
                    style={[
                      styles.slotCard,
                      selected ? styles.slotCardSelected : null,
                      !slot.available ? styles.slotCardBusy : null,
                    ]}
                    onPress={() => {
                      setError('')
                      setSuccess('')
                      setSelectedSlot(slot)
                    }}
                  >
                    <Text
                      style={[
                        styles.slotTime,
                        selected ? styles.slotTimeSelected : null,
                        !slot.available ? styles.slotTimeBusy : null,
                      ]}
                    >
                      {slot.time}
                    </Text>
                    <Text style={[styles.slotState, !slot.available ? styles.slotStateBusy : null]}>
                      {slot.available ? 'Libre' : 'Ocupado'}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
            <Pressable testID="confirm-booking" nativeID="confirm-booking" style={styles.primary} onPress={() => void confirm()} disabled={busy}>
              <Text style={styles.primaryText}>Confirmar cita</Text>
            </Pressable>
            <View style={styles.footerLinks}>
              <Pressable testID="go-appointments" nativeID="go-appointments" onPress={() => void openAppointments()} disabled={busy}>
                <Text style={styles.ghostText}>Ver mis citas</Text>
              </Pressable>
              <Text style={styles.dot}>·</Text>
              <Pressable testID="change-role" nativeID="change-role" onPress={goToRole}>
                <Text style={styles.ghostText}>Cambiar rol</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {screen === 'appointments' ? (
          <View testID="appointments-list" nativeID="appointments-list" style={styles.stack}>
            {bookings.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Sin citas todavía</Text>
                <Text style={styles.lead}>Aún no tienes citas.</Text>
              </View>
            ) : null}
            {bookings.map((booking) => (
              <View key={booking.id} style={styles.ticket}>
                <View style={styles.ticketTime}>
                  <Text style={styles.ticketHour}>{booking.time}</Text>
                  <Text style={styles.ticketDay}>Hoy</Text>
                </View>
                <View style={styles.ticketBody}>
                  <Text style={styles.ticketBadge}>Confirmada</Text>
                  <Text style={styles.cardTitle}>{booking.serviceName}</Text>
                  <Text style={styles.cardMeta}>Salón Lila · zona 10</Text>
                </View>
              </View>
            ))}
            <Pressable testID="change-role" nativeID="change-role" style={styles.ghost} onPress={goToRole}>
              <Text style={styles.ghostText}>Cambiar rol</Text>
            </Pressable>
          </View>
        ) : null}

        {screen === 'agenda' ? (
          <View testID="agenda-list" nativeID="agenda-list" style={styles.stack}>
            <View style={styles.agendaHead}>
              <Text style={styles.sectionLabel}>{todayLabel()}</Text>
              <Text style={styles.agendaCount}>
                {bookings.length} {bookings.length === 1 ? 'cita' : 'citas'}
              </Text>
            </View>
            {bookings.length === 0 ? <Text style={styles.lead}>No hay citas por ahora.</Text> : null}
            {bookings.map((booking) => (
              <View key={booking.id} style={styles.agendaRow}>
                <Text style={styles.agendaTime}>{booking.time}</Text>
                <View style={styles.agendaCard}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{booking.clientName.slice(0, 1)}</Text>
                  </View>
                  <View style={styles.agendaCopy}>
                    <Text style={styles.cardTitle}>
                      {booking.clientName} · {booking.serviceName}
                    </Text>
                    <Text style={styles.cardMeta}>Silla 1 · pago en recepción</Text>
                  </View>
                </View>
              </View>
            ))}
            <Pressable testID="change-role" nativeID="change-role" style={styles.ghost} onPress={goToRole}>
              <Text style={styles.ghostText}>Cambiar rol</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
  },
  frame: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingBottom: 48,
    flexGrow: 1,
  },
  hero: {
    backgroundColor: '#FBE8EE',
    paddingTop: 72,
    paddingHorizontal: 24,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  monogram: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  monogramText: {
    color: '#111111',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  kicker: {
    color: '#C47B8A',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#111111',
    fontSize: 40,
    fontWeight: '700',
    marginTop: 6,
  },
  heroLead: {
    color: '#6B6B6B',
    fontSize: 15,
    marginTop: 8,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  chip: {
    color: '#111111',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '600',
  },
  topBar: {
    backgroundColor: '#FBE8EE',
    paddingTop: 64,
    paddingHorizontal: 24,
    paddingBottom: 22,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    color: '#111111',
    fontSize: 30,
    fontWeight: '700',
    marginTop: 6,
  },
  subtitle: {
    color: '#6B6B6B',
    fontSize: 16,
    marginTop: 6,
  },
  lead: {
    color: '#6B6B6B',
    fontSize: 15,
    lineHeight: 22,
  },
  stack: {
    paddingHorizontal: 20,
    paddingTop: 22,
    gap: 12,
  },
  sectionLabel: {
    color: '#6B6B6B',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E6E6E6',
  },
  roleCardDark: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E6E6E6',
  },
  roleIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconDark: {
    backgroundColor: '#F2F2F2',
  },
  roleIconText: {
    color: '#111111',
    fontWeight: '800',
    fontSize: 18,
  },
  roleIconTextDark: {
    color: '#111111',
    fontWeight: '800',
    fontSize: 18,
  },
  roleCopy: {
    flex: 1,
  },
  roleTitle: {
    color: '#111111',
    fontSize: 18,
    fontWeight: '700',
  },
  roleTitleLight: {
    color: '#111111',
  },
  roleHint: {
    color: '#6B6B6B',
    marginTop: 4,
    fontSize: 13,
  },
  roleHintLight: {
    color: '#6B6B6B',
    marginTop: 4,
    fontSize: 13,
  },
  roleArrow: {
    color: '#111111',
    fontSize: 20,
    fontWeight: '700',
  },
  roleArrowLight: {
    color: '#111111',
    fontSize: 20,
    fontWeight: '700',
  },
  serviceCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E6E6E6',
  },
  serviceCardSelected: {
    borderColor: '#111111',
    backgroundColor: '#F4F4F4',
  },
  serviceMark: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceMarkText: {
    color: '#111111',
    fontWeight: '800',
    fontSize: 13,
  },
  serviceBody: {
    flex: 1,
  },
  serviceHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
  },
  cardTitle: {
    color: '#111111',
    fontSize: 17,
    fontWeight: '700',
  },
  price: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '700',
  },
  cardMeta: {
    color: '#6B6B6B',
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  duration: {
    marginTop: 8,
    color: '#111111',
    fontSize: 12,
    fontWeight: '700',
  },
  summary: {
    backgroundColor: '#F4F4F4',
    borderRadius: 18,
    padding: 16,
  },
  summaryKicker: {
    color: '#111111',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  summaryTitle: {
    color: '#111111',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: '#E6E6E6',
  },
  slotCardSelected: {
    borderColor: '#111111',
    backgroundColor: '#F4F4F4',
  },
  slotCardBusy: {
    backgroundColor: '#F2F2F2',
  },
  slotTime: {
    color: '#111111',
    fontSize: 22,
    fontWeight: '700',
  },
  slotTimeSelected: {
    color: '#111111',
  },
  slotTimeBusy: {
    color: '#6B6B6B',
  },
  slotState: {
    marginTop: 4,
    color: '#111111',
    fontSize: 12,
    fontWeight: '700',
  },
  slotStateBusy: {
    color: '#6B6B6B',
  },
  ticket: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  ticketTime: {
    width: 88,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  ticketHour: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  ticketDay: {
    color: '#C8C8C8',
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
  },
  ticketBody: {
    flex: 1,
    padding: 16,
  },
  ticketBadge: {
    alignSelf: 'flex-start',
    color: '#111111',
    backgroundColor: '#F2F2F2',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
  },
  empty: {
    backgroundColor: '#F4F4F4',
    borderRadius: 18,
    padding: 20,
  },
  emptyTitle: {
    color: '#111111',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  agendaHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  agendaCount: {
    color: '#111111',
    fontWeight: '700',
    fontSize: 13,
  },
  agendaRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
  },
  agendaTime: {
    width: 52,
    color: '#111111',
    fontSize: 14,
    fontWeight: '700',
    paddingTop: 18,
  },
  agendaCard: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#F4F4F4',
    borderRadius: 18,
    padding: 14,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#111111',
    fontWeight: '800',
  },
  agendaCopy: {
    flex: 1,
  },
  primary: {
    backgroundColor: '#F2F2F2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '800',
  },
  ghost: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  ghostText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '600',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  dot: {
    color: '#6B6B6B',
  },
  banner: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 14,
  },
  bannerError: {
    backgroundColor: '#111111',
  },
  bannerSuccess: {
    backgroundColor: '#F4F4F4',
  },
  bannerLabel: {
    color: '#6B6B6B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  bannerLabelOnDark: {
    color: '#C8C8C8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  bannerErrorText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  bannerSuccessText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '600',
  },
})

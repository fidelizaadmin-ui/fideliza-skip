import pb from '@/lib/pocketbase/client'
import type {
  AppointmentRecord,
  AppointmentStatus,
  BookedSlot,
  BusinessHourRecord,
  ServiceOfferingRecord,
} from '@/types/appointments'
import type { StoreRecord } from '@/types'

// Serviço de agendamentos: leituras direto nas coleções (regras de API) e
// escritas sensíveis (reserva, mudança de status) pelas rotas de pb_hooks.

export function getApiErrorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { message?: string }; message?: string }
  return e?.response?.message || e?.message || fallback
}

// ---- Loja ----

export async function setAppointmentsEnabled(store: StoreRecord, enabled: boolean) {
  return pb.collection('stores').update<StoreRecord>(store.id, { appointments_enabled: enabled })
}

// ---- Serviços ----

export function listServiceOfferings(storeId: string) {
  return pb.collection('service_offerings').getFullList<ServiceOfferingRecord>({
    filter: `store = "${storeId}"`,
    sort: 'name',
  })
}

export function createServiceOffering(data: {
  store: string
  name: string
  duration_minutes: number
  price?: number
  active: boolean
}) {
  return pb.collection('service_offerings').create<ServiceOfferingRecord>(data)
}

export function updateServiceOffering(
  id: string,
  data: Partial<Pick<ServiceOfferingRecord, 'name' | 'duration_minutes' | 'price' | 'active'>>,
) {
  return pb.collection('service_offerings').update<ServiceOfferingRecord>(id, data)
}

export function deleteServiceOffering(id: string) {
  return pb.collection('service_offerings').delete(id)
}

// ---- Períodos de atendimento ----

export function listBusinessHours(storeId: string) {
  return pb.collection('business_hours').getFullList<BusinessHourRecord>({
    filter: `store = "${storeId}"`,
    sort: 'weekday,start_time',
  })
}

// Substitui todos os períodos da loja pelos informados
export async function replaceBusinessHours(
  storeId: string,
  rows: { weekday: number; start_time: string; end_time: string }[],
) {
  const existing = await listBusinessHours(storeId)
  for (const h of existing) {
    await pb.collection('business_hours').delete(h.id)
  }
  for (const r of rows) {
    await pb.collection('business_hours').create({ store: storeId, ...r, active: true })
  }
}

// ---- Disponibilidade e reserva ----

export async function getBookedSlots(storeId: string, from: string, to: string) {
  const url =
    '/backend/v1/appointments/availability?store_id=' +
    encodeURIComponent(storeId) +
    '&from=' +
    from +
    '&to=' +
    to
  const res = await pb.send<{ booked: BookedSlot[] }>(url, { method: 'GET' })
  return res.booked || []
}

export async function bookAppointment(input: {
  store_id: string
  service_id: string
  date: string
  start_time: string
  notes?: string
}) {
  return pb.send<{ message: string }>('/backend/v1/appointments/book', {
    method: 'POST',
    body: input,
  })
}

// ---- Agenda ----

export function listStoreAppointments(storeId: string) {
  return pb.collection('appointments').getFullList<AppointmentRecord>({
    filter: `store = "${storeId}"`,
    sort: '-date,-start_time',
  })
}

export function listMyAppointments() {
  return pb.collection('appointments').getFullList<AppointmentRecord>({
    sort: '-date,-start_time',
    expand: 'store',
  })
}

export function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
  cancelReason?: string,
) {
  return pb.send<{ message: string; emailSent?: boolean }>(
    '/backend/v1/appointments/update-status',
    {
      method: 'POST',
      body: { appointment_id: appointmentId, status, cancel_reason: cancelReason || '' },
    },
  )
}

import pb from '@/lib/pocketbase/client'
import type {
  AppointmentDepositSettings,
  AppointmentPixPayloadData,
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

export interface BookAppointmentResponse {
  message: string
  appointment: {
    id: string
    date: string
    start_time: string
    end_time: string
    status: AppointmentStatus
    deposit_required?: boolean
    deposit_percent?: number
    deposit_amount?: number
    deposit_status?: string
  }
  pix?: AppointmentPixPayloadData | null
}

export async function bookAppointment(input: {
  store_id: string
  service_id: string
  date: string
  start_time: string
  notes?: string
}): Promise<BookAppointmentResponse> {
  return pb.send<BookAppointmentResponse>('/backend/v1/appointments/book', {
    method: 'POST',
    body: input,
  })
}

export async function markDepositPaid(appointmentId: string) {
  return pb.send<{ message: string; appointment: { id: string; deposit_status: string } }>(
    '/backend/v1/appointments/mark-deposit-paid',
    {
      method: 'POST',
      body: { appointment_id: appointmentId },
    },
  )
}

export async function getAppointmentPix(appointmentId: string): Promise<AppointmentPixPayloadData> {
  return pb.send<AppointmentPixPayloadData>(
    '/backend/v1/appointments/pix-payload?appointment_id=' + encodeURIComponent(appointmentId),
    { method: 'GET' },
  )
}

// ---- Configurações de Sinal e Chave Pix do Lojista ----

export async function getAppointmentDepositSettings(
  storeId: string,
): Promise<AppointmentDepositSettings> {
  return pb.send<AppointmentDepositSettings>(
    '/backend/v1/appointments/deposit-settings?store_id=' + encodeURIComponent(storeId),
    { method: 'GET' },
  )
}

export async function saveAppointmentDepositSettings(data: {
  store_id: string
  deposit_enabled: boolean
  deposit_percent: number
  key_type?: string
  pix_key?: string
  receiver_name?: string
  receiver_city?: string
}): Promise<AppointmentDepositSettings & { message: string }> {
  return pb.send<AppointmentDepositSettings & { message: string }>(
    '/backend/v1/appointments/deposit-settings',
    {
      method: 'POST',
      body: data,
    },
  )
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

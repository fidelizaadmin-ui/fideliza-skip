// Tipos do módulo de agendamento de serviços
export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export type AppointmentDepositStatus =
  | 'not_required'
  | 'pending_payment'
  | 'paid_pending_confirmation'
  | 'confirmed'

export type AppointmentPixKeyType = 'cpf' | 'cnpj' | 'telefone' | 'email' | 'aleatoria'

export interface AppointmentDepositSettings {
  deposit_enabled: boolean
  deposit_percent: number
  key_type: AppointmentPixKeyType
  pix_key_masked: string
  receiver_name: string
  receiver_city: string
  has_pix_key: boolean
}

export interface AppointmentPixPayloadData {
  pix_payload: string
  receiver_name: string
  receiver_city: string
  txid: string
  amount: number
  deposit_percent: number
}

export interface ServiceOfferingRecord {
  id: string
  store: string
  name: string
  duration_minutes: number
  price?: number
  active: boolean
  created: string
  updated: string
}

export interface BusinessHourRecord {
  id: string
  store: string
  weekday: number
  start_time: string
  end_time: string
  active: boolean
}

export interface AppointmentRecord {
  id: string
  store: string
  customer: string
  service: string
  service_name?: string
  customer_name?: string
  customer_phone?: string
  date: string
  start_time: string
  end_time: string
  price?: number
  status: AppointmentStatus
  notes?: string
  cancel_reason?: string
  deposit_required?: boolean
  deposit_percent?: number
  deposit_amount?: number
  deposit_status?: AppointmentDepositStatus
  deposit_paid_at?: string
  deposit_confirmed_at?: string
  created: string
  updated: string
  expand?: {
    store?: { name?: string; phone?: string; address?: string }
    customer?: {
      id?: string
      name?: string
      email?: string
      phone?: string
      customer_code?: string
    }
    service?: ServiceOfferingRecord
  }
}

// Intervalo ocupado (sem dados pessoais), vindo da rota de disponibilidade
export interface BookedSlot {
  date: string
  start_time: string
  end_time: string
}

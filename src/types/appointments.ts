// Tipos do módulo de agendamento de serviços
export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

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

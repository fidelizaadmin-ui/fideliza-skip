export type UserRole = 'admin' | 'merchant' | 'customer'

export interface UserRecord {
  id: string
  email: string
  name: string
  role: UserRole
  customer_code?: string
  phone?: string
  document?: string
  avatar?: string
  created: string
  updated: string
}

export type StoreCategory =
  | 'Alimentação'
  | 'Moda & Acessórios'
  | 'Beleza & Estética'
  | 'Saúde & Bem-Estar'
  | 'Pet Shop'
  | 'Serviços'
  | 'Supermercado'
  | 'Outros'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type SubscriptionStatus = 'trial' | 'active' | 'overdue' | 'cancelled'
export type FidelityType = 'stamps' | 'points' | 'cashback'

export interface SubscriptionPlanRecord {
  id: string
  name: string
  slug: string
  price: number
  billing_interval_months: number
  trial_days: number
  description: string
  features: string[] | string
  is_active: boolean
  created: string
  updated: string
}

export interface StoreRecord {
  id: string
  owner_id: string
  name: string
  category: StoreCategory
  description: string
  address: string
  city: string
  phone: string
  logo_url: string
  banner_url: string
  approval_status: ApprovalStatus
  subscription_plan_id?: string
  subscription_status?: SubscriptionStatus
  subscription_expires_at?: string
  created: string
  updated: string
  expand?: {
    owner_id?: UserRecord
    subscription_plan_id?: SubscriptionPlanRecord
    fidelity_plans?: FidelityPlanRecord[]
  }
}

export interface FidelityPlanRecord {
  id: string
  store_id: string
  type: FidelityType
  title: string
  description: string
  target_stamps?: number
  min_purchase_amount?: number
  points_per_currency?: number
  points_to_redeem?: number
  cashback_percentage?: number
  reward_title?: string
  reward_description?: string
  is_active: boolean
  created: string
  updated: string
}

export interface CustomerCardRecord {
  id: string
  customer_id: string
  store_id: string
  stamps_count: number
  points_balance: number
  cashback_balance: number
  total_purchases_count: number
  total_spent: number
  rewards_redeemed_count: number
  created: string
  updated: string
  expand?: {
    store_id?: StoreRecord
    customer_id?: UserRecord
  }
}

export interface PurchaseRecord {
  id: string
  store_id: string
  customer_id: string
  type: 'purchase' | 'redemption'
  amount?: number
  stamps_earned?: number
  points_earned?: number
  cashback_earned?: number
  points_spent?: number
  cashback_spent?: number
  notes?: string
  created: string
  updated: string
  expand?: {
    store_id?: StoreRecord
    customer_id?: UserRecord
  }
}

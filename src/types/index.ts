export type UserRole = 'admin' | 'merchant' | 'customer' | 'collaborator'

export interface UserRecord {
  id: string
  email: string
  name: string
  role: UserRole
  customer_code?: string
  phone?: string
  document?: string
  avatar?: string
  verified?: boolean
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
export type SubscriptionStatus = 'trial' | 'active' | 'overdue' | 'cancelled' | 'pending'
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
  whatsapp?: string
  logo_url: string
  banner_url: string
  logo_file?: string
  banner_file?: string
  approval_status: ApprovalStatus
  subscription_plan_id?: string
  subscription_status?: SubscriptionStatus
  subscription_expires_at?: string
  suspend_public?: boolean
  suspend_merchant?: boolean
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

export type SubscriptionPaymentStatus = 'pending' | 'paid' | 'canceled' | 'refunded' | 'failed'

export interface SubscriptionPaymentRecord {
  id: string
  store: string
  plan: string
  amount: number // centavos
  order_nsu: string
  slug?: string
  transaction_nsu?: string
  status: SubscriptionPaymentStatus
  capture_method?: string
  checkout_url?: string
  paid_at?: string
  metadata?: any
  created: string
  updated: string
  expand?: {
    store?: StoreRecord
    plan?: SubscriptionPlanRecord
  }
}

export interface CheckoutLinkResponse {
  configured: boolean
  checkout_url?: string
  order_nsu?: string
  slug?: string
  amount?: number
  message?: string
  error?: string
  provider?: string
  credential_name?: string
}

export interface PaymentCheckResponse {
  configured?: boolean
  paid: boolean
  status: string
  capture_method?: string
  paid_at?: string
  order_nsu?: string
  slug?: string
  details?: any
  error?: string
}

export interface PaymentCredentialRecord {
  id: string
  provider: string
  name: string
  api_key?: string
  api_key_masked?: string
  extra_config?: Record<string, any>
  is_active: boolean
  created: string
  updated: string
}

export interface PaymentProviderInfoResponse {
  configured: boolean
  provider: string
  provider_name: string
  api_key_masked?: string
  updated_at?: string
  source: 'database' | 'env' | 'none'
  is_simulated: boolean
}

export interface StoreCustomerRecord {
  id: string
  store: string
  customer: string
  notes?: string
  created: string
  updated: string
  expand?: {
    store?: StoreRecord
    customer?: UserRecord
  }
}

export type GiveawayRewardType = 'gift' | 'discount'
export type GiveawayStatus = 'draft' | 'open' | 'drawn' | 'redeemed' | 'expired'

export interface GiveawayRecord {
  id: string
  store: string
  title: string
  reward_type: GiveawayRewardType
  reward_description?: string
  discount_amount?: number
  redemption_days: number
  status: GiveawayStatus
  winner?: string
  drawn_at?: string
  expires_at?: string
  redeemed_at?: string
  total_participants?: number
  notes?: string
  created: string
  updated: string
  expand?: {
    store?: StoreRecord
    winner?: UserRecord
  }
}

export type NotificationType = 'giveaway_won' | 'fidelity_reward' | 'system'

export interface NotificationRecord {
  id: string
  user: string
  store?: string
  type: NotificationType
  title: string
  message: string
  is_read?: boolean
  data?: Record<string, any>
  created: string
  updated: string
  expand?: {
    store?: StoreRecord
    user?: UserRecord
  }
}

import pb from '@/lib/pocketbase/client'
import type {
  StoreRecord,
  FidelityPlanRecord,
  SubscriptionPlanRecord,
  CustomerCardRecord,
  PurchaseRecord,
  UserRecord,
} from '@/types'

// ==========================================
// STORES SERVICE
// ==========================================
export async function getApprovedStores(
  searchTerm?: string,
  category?: string,
): Promise<StoreRecord[]> {
  try {
    const filters: string[] = ['approval_status = "approved"']

    if (category && category !== 'Todas') {
      filters.push(`category = "${category}"`)
    }

    if (searchTerm && searchTerm.trim().length > 0) {
      filters.push(
        `(name ~ "${searchTerm.trim()}" || description ~ "${searchTerm.trim()}" || city ~ "${searchTerm.trim()}")`,
      )
    }

    const records = await pb.collection('stores').getFullList<StoreRecord>({
      filter: filters.join(' && '),
      sort: '-created',
      expand: 'subscription_plan_id',
    })

    return records
  } catch (error) {
    console.error('Error fetching approved stores:', error)
    return []
  }
}

export async function getAllStores(): Promise<StoreRecord[]> {
  try {
    return await pb.collection('stores').getFullList<StoreRecord>({
      sort: '-created',
      expand: 'owner_id,subscription_plan_id',
    })
  } catch (error) {
    console.error('Error fetching all stores:', error)
    return []
  }
}

export async function getStoreById(id: string): Promise<StoreRecord | null> {
  try {
    return await pb.collection('stores').getOne<StoreRecord>(id, {
      expand: 'owner_id,subscription_plan_id',
    })
  } catch (error) {
    console.error('Error fetching store by id:', error)
    return null
  }
}

export async function getMerchantStore(ownerId: string): Promise<StoreRecord | null> {
  try {
    const records = await pb.collection('stores').getList<StoreRecord>(1, 1, {
      filter: `owner_id = "${ownerId}"`,
      sort: '-created',
      expand: 'subscription_plan_id',
    })
    return records.items[0] || null
  } catch (error) {
    console.error('Error fetching merchant store:', error)
    return null
  }
}

export async function createStore(data: Partial<StoreRecord>): Promise<StoreRecord> {
  return await pb.collection('stores').create<StoreRecord>(data)
}

export async function updateStore(id: string, data: Partial<StoreRecord>): Promise<StoreRecord> {
  return await pb.collection('stores').update<StoreRecord>(id, data)
}

// ==========================================
// FIDELITY PLANS SERVICE
// ==========================================
export async function getStoreFidelityPlan(storeId: string): Promise<FidelityPlanRecord | null> {
  try {
    const records = await pb.collection('fidelity_plans').getList<FidelityPlanRecord>(1, 1, {
      filter: `store_id = "${storeId}" && is_active = true`,
      sort: '-created',
    })
    return records.items[0] || null
  } catch (error) {
    console.error('Error fetching store fidelity plan:', error)
    return null
  }
}

export async function saveFidelityPlan(
  storeId: string,
  planData: Partial<FidelityPlanRecord>,
): Promise<FidelityPlanRecord> {
  const existing = await getStoreFidelityPlan(storeId)
  if (existing) {
    return await pb.collection('fidelity_plans').update<FidelityPlanRecord>(existing.id, {
      ...planData,
      store_id: storeId,
      is_active: true,
    })
  }
  return await pb.collection('fidelity_plans').create<FidelityPlanRecord>({
    ...planData,
    store_id: storeId,
    is_active: true,
  })
}

// ==========================================
// SUBSCRIPTION PLANS SERVICE
// ==========================================
export async function getSubscriptionPlans(): Promise<SubscriptionPlanRecord[]> {
  try {
    return await pb.collection('subscription_plans').getFullList<SubscriptionPlanRecord>({
      sort: 'price',
    })
  } catch (error) {
    console.error('Error fetching subscription plans:', error)
    return []
  }
}

export async function updateSubscriptionPlan(
  id: string,
  data: Partial<SubscriptionPlanRecord>,
): Promise<SubscriptionPlanRecord> {
  return await pb.collection('subscription_plans').update<SubscriptionPlanRecord>(id, data)
}

export async function createSubscriptionPlan(
  data: Partial<SubscriptionPlanRecord>,
): Promise<SubscriptionPlanRecord> {
  return await pb.collection('subscription_plans').create<SubscriptionPlanRecord>(data)
}

// ==========================================
// CUSTOMER CARDS SERVICE
// ==========================================
export async function getCustomerCards(customerId: string): Promise<CustomerCardRecord[]> {
  try {
    return await pb.collection('customer_cards').getFullList<CustomerCardRecord>({
      filter: `customer_id = "${customerId}"`,
      sort: '-updated',
      expand: 'store_id',
    })
  } catch (error) {
    console.error('Error fetching customer cards:', error)
    return []
  }
}

export async function getCustomerCardForStore(
  customerId: string,
  storeId: string,
): Promise<CustomerCardRecord | null> {
  try {
    const records = await pb.collection('customer_cards').getList<CustomerCardRecord>(1, 1, {
      filter: `customer_id = "${customerId}" && store_id = "${storeId}"`,
      expand: 'store_id,customer_id',
    })
    return records.items[0] || null
  } catch (error) {
    console.error('Error fetching customer card for store:', error)
    return null
  }
}

export async function findCustomerByCodeOrEmail(identifier: string): Promise<UserRecord | null> {
  try {
    const clean = identifier.trim()
    if (!clean) return null

    // Extract digits in case user typed CPF/CNPJ with or without formatting
    const digitsOnly = clean.replace(/\D/g, '')

    // Build filter list
    const conditions: string[] = [`customer_code = "${clean}"`, `email = "${clean}"`]

    // If identifier has 11 or 14 digits, also search by document (raw digits or formatted)
    if (digitsOnly.length === 11 || digitsOnly.length === 14) {
      conditions.push(`document = "${digitsOnly}"`)
      if (clean !== digitsOnly) {
        conditions.push(`document = "${clean}"`)
      }
    } else if (clean.length > 0) {
      // General document match
      conditions.push(`document = "${clean}"`)
    }

    const records = await pb.collection('users').getList<UserRecord>(1, 1, {
      filter: conditions.join(' || '),
    })
    return records.items[0] || null
  } catch (error) {
    console.error('Error finding customer by code/email/document:', error)
    return null
  }
}

// ==========================================
// PURCHASES & REDEMPTIONS SERVICE
// ==========================================
export async function getStorePurchases(storeId: string): Promise<PurchaseRecord[]> {
  try {
    return await pb.collection('purchases').getFullList<PurchaseRecord>({
      filter: `store_id = "${storeId}"`,
      sort: '-created',
      expand: 'customer_id',
    })
  } catch (error) {
    console.error('Error fetching store purchases:', error)
    return []
  }
}

export async function getCustomerPurchases(customerId: string): Promise<PurchaseRecord[]> {
  try {
    return await pb.collection('purchases').getFullList<PurchaseRecord>({
      filter: `customer_id = "${customerId}"`,
      sort: '-created',
      expand: 'store_id',
    })
  } catch (error) {
    console.error('Error fetching customer purchases:', error)
    return []
  }
}

export async function getAllPurchases(): Promise<PurchaseRecord[]> {
  try {
    return await pb.collection('purchases').getFullList<PurchaseRecord>({
      sort: '-created',
      expand: 'store_id,customer_id',
    })
  } catch (error) {
    console.error('Error fetching all purchases:', error)
    return []
  }
}

export interface RegisterPurchaseParams {
  storeId: string
  customerId: string
  amount: number
  plan: FidelityPlanRecord
  notes?: string
}

export async function registerPurchase(params: RegisterPurchaseParams): Promise<{
  purchase: PurchaseRecord
  card: CustomerCardRecord
}> {
  const { storeId, customerId, amount, plan, notes } = params

  let stampsEarned = 0
  let pointsEarned = 0
  let cashbackEarned = 0

  if (plan.type === 'stamps') {
    const minAmount = plan.min_purchase_amount || 1
    stampsEarned = Math.floor(amount / minAmount)
    if (stampsEarned < 1 && amount > 0 && !plan.min_purchase_amount) {
      stampsEarned = 1
    }
  } else if (plan.type === 'points') {
    const rate = plan.points_per_currency || 1
    pointsEarned = Math.round(amount * rate)
  } else if (plan.type === 'cashback') {
    const pct = plan.cashback_percentage || 5
    cashbackEarned = Math.round(((amount * pct) / 100) * 100) / 100
  }

  // 1. Create Purchase record
  const purchase = await pb.collection('purchases').create<PurchaseRecord>({
    store_id: storeId,
    customer_id: customerId,
    type: 'purchase',
    amount,
    stamps_earned: stampsEarned,
    points_earned: pointsEarned,
    cashback_earned: cashbackEarned,
    notes: notes || '',
  })

  // 2. Find or create customer card
  let card = await getCustomerCardForStore(customerId, storeId)
  if (!card) {
    card = await pb.collection('customer_cards').create<CustomerCardRecord>({
      customer_id: customerId,
      store_id: storeId,
      stamps_count: stampsEarned,
      points_balance: pointsEarned,
      cashback_balance: cashbackEarned,
      total_purchases_count: 1,
      total_spent: amount,
      rewards_redeemed_count: 0,
    })
  } else {
    card = await pb.collection('customer_cards').update<CustomerCardRecord>(card.id, {
      stamps_count: (card.stamps_count || 0) + stampsEarned,
      points_balance: (card.points_balance || 0) + pointsEarned,
      cashback_balance: Math.round(((card.cashback_balance || 0) + cashbackEarned) * 100) / 100,
      total_purchases_count: (card.total_purchases_count || 0) + 1,
      total_spent: Math.round(((card.total_spent || 0) + amount) * 100) / 100,
    })
  }

  return { purchase, card }
}

export interface RedeemRewardParams {
  storeId: string
  customerId: string
  plan: FidelityPlanRecord
  rewardType: 'stamps' | 'points' | 'cashback'
  cashbackAmount?: number
  notes?: string
}

export async function redeemReward(params: RedeemRewardParams): Promise<{
  redemption: PurchaseRecord
  card: CustomerCardRecord
}> {
  const { storeId, customerId, plan, rewardType, cashbackAmount, notes } = params
  const card = await getCustomerCardForStore(customerId, storeId)
  if (!card) throw new Error('Cartão de fidelidade não encontrado para este cliente.')

  let stampsSpent = 0
  let pointsSpent = 0
  let cashbackSpent = 0

  if (rewardType === 'stamps') {
    const target = plan.target_stamps || 10
    if ((card.stamps_count || 0) < target) {
      throw new Error(
        `Saldo insuficiente: o cliente tem ${card.stamps_count || 0} de ${target} selos.`,
      )
    }
    stampsSpent = target
  } else if (rewardType === 'points') {
    const required = plan.points_to_redeem || 100
    if ((card.points_balance || 0) < required) {
      throw new Error(
        `Saldo insuficiente: o cliente tem ${card.points_balance || 0} de ${required} pontos.`,
      )
    }
    pointsSpent = required
  } else if (rewardType === 'cashback') {
    const spent = cashbackAmount || 0
    if (spent <= 0) throw new Error('Valor de cashback a resgatar inválido.')
    if ((card.cashback_balance || 0) < spent) {
      throw new Error(
        `Saldo insuficiente: saldo disponível é R$ ${Number(card.cashback_balance || 0).toFixed(2)}.`,
      )
    }
    cashbackSpent = spent
  }

  // Create redemption record
  const redemption = await pb.collection('purchases').create<PurchaseRecord>({
    store_id: storeId,
    customer_id: customerId,
    type: 'redemption',
    amount: 0,
    points_spent: pointsSpent,
    cashback_spent: cashbackSpent,
    notes: notes || `Resgate: ${plan.reward_title || 'Recompensa de fidelidade'}`,
  })

  // Update card balances
  const updatedCard = await pb.collection('customer_cards').update<CustomerCardRecord>(card.id, {
    stamps_count: Math.max(0, (card.stamps_count || 0) - stampsSpent),
    points_balance: Math.max(0, (card.points_balance || 0) - pointsSpent),
    cashback_balance: Math.max(
      0,
      Math.round(((card.cashback_balance || 0) - cashbackSpent) * 100) / 100,
    ),
    rewards_redeemed_count: (card.rewards_redeemed_count || 0) + 1,
  })

  return { redemption, card: updatedCard }
}

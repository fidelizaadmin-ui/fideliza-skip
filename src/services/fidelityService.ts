import pb from '@/lib/pocketbase/client'
import type {
  StoreRecord,
  FidelityPlanRecord,
  SubscriptionPlanRecord,
  CustomerCardRecord,
  PurchaseRecord,
  UserRecord,
  SubscriptionPaymentRecord,
  CheckoutLinkResponse,
  PaymentCheckResponse,
  PaymentCredentialRecord,
  PaymentProviderInfoResponse,
  PixSettingRecord,
  PixKeyType,
  PixPayloadResponse,
  StoreCustomerRecord,
  GiveawayRecord,
  GiveawayStatus,
  GiveawayRewardType,
  NotificationRecord,
} from '@/types'

// ==========================================
// STORES SERVICE
// ==========================================
export async function getApprovedStores(
  searchTerm?: string,
  category?: string,
): Promise<StoreRecord[]> {
  try {
    // A loja aprovada só é ocultada do portal público se suspend_public for true
    // ou se o status for cancelled (ou overdue com suspend_public != false)
    const filters: string[] = [
      'approval_status = "approved"',
      'suspend_public != true',
      'subscription_status != "cancelled"',
    ]

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

export async function updateStore(
  id: string,
  data: Partial<StoreRecord> | FormData,
): Promise<StoreRecord> {
  return await pb.collection('stores').update<StoreRecord>(id, data)
}

export async function deleteStore(id: string): Promise<boolean> {
  try {
    // Validação extra de segurança no serviço: colaborador não pode excluir loja
    const authRecord = pb.authStore.record
    if (authRecord?.role === 'collaborator') {
      throw new Error(
        'Acesso negado: colaboradores do administrador não têm permissão para excluir lojas.',
      )
    }
    return await pb.collection('stores').delete(id)
  } catch (error) {
    console.error('Error deleting store:', error)
    throw error
  }
}

export function getStoreImageUrl(store: StoreRecord, type: 'logo' | 'banner'): string {
  if (type === 'logo') {
    if (store.logo_file) {
      return pb.files.getURL(store as any, store.logo_file)
    }
    return store.logo_url || ''
  } else {
    if (store.banner_file) {
      return pb.files.getURL(store as any, store.banner_file)
    }
    return store.banner_url || ''
  }
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

// ==========================================
// USERS & COLLABORATORS SERVICE
// ==========================================
export async function getCustomersAndCollaborators(): Promise<{
  customers: UserRecord[]
  collaborators: UserRecord[]
}> {
  try {
    const records = await pb.collection('users').getFullList<UserRecord>({
      filter: 'role = "customer" || role = "collaborator"',
      sort: '-created',
    })

    const customers = records.filter((u) => u.role === 'customer')
    const collaborators = records.filter((u) => u.role === 'collaborator')

    return { customers, collaborators }
  } catch (error) {
    console.error('Error fetching customers and collaborators:', error)
    return { customers: [], collaborators: [] }
  }
}

export async function promoteToCollaborator(userId: string): Promise<UserRecord> {
  const authRecord = pb.authStore.record
  if (authRecord?.role !== 'admin') {
    throw new Error('Apenas administradores podem promover usuários a colaborador.')
  }

  return await pb.collection('users').update<UserRecord>(userId, {
    role: 'collaborator',
  })
}

export async function demoteToCustomer(userId: string): Promise<UserRecord> {
  const authRecord = pb.authStore.record
  if (authRecord?.role !== 'admin') {
    throw new Error('Apenas administradores podem reverter colaboradores para cliente.')
  }

  return await pb.collection('users').update<UserRecord>(userId, {
    role: 'customer',
  })
}

// ==========================================
// INFINITEPAY SUBSCRIPTION PAYMENTS
// ==========================================

/**
 * Cria o link de checkout online da InfinitePay para a assinatura da loja.
 * Caso a chave INFINITEPAY_API_KEY não esteja configurada no backend, retorna { configured: false }.
 */
export async function createInfinitePayCheckoutLink(
  storeId: string,
  planId?: string,
): Promise<CheckoutLinkResponse> {
  const response = await pb.send<CheckoutLinkResponse>('/backend/v1/subscriptions/checkout-link', {
    method: 'POST',
    body: {
      store_id: storeId,
      plan_id: planId,
    },
  })
  return response
}

/**
 * Consulta manual / rechecagem de status de um pagamento na InfinitePay.
 */
export async function checkInfinitePayPayment(params: {
  order_nsu?: string
  slug?: string
  transaction_nsu?: string
}): Promise<PaymentCheckResponse> {
  const response = await pb.send<PaymentCheckResponse>('/backend/v1/subscriptions/payment-check', {
    method: 'POST',
    body: params,
  })
  return response
}

/**
 * Lista o histórico de pagamentos de assinaturas de uma loja.
 */
export async function getStoreSubscriptionPayments(
  storeId: string,
): Promise<SubscriptionPaymentRecord[]> {
  try {
    return await pb.collection('subscription_payments').getFullList<SubscriptionPaymentRecord>({
      filter: `store = "${storeId}"`,
      sort: '-created',
      expand: 'plan',
    })
  } catch (error) {
    console.error('Error fetching subscription payments:', error)
    return []
  }
}

// ==========================================
// PAYMENT CREDENTIALS & PROVIDER INFO (ADMIN & LOJISTA)
// ==========================================

/**
 * Consulta informações do provedor de pagamento ativo (aberto a usuários autenticados).
 */
export async function getPaymentProviderInfo(): Promise<PaymentProviderInfoResponse> {
  try {
    const response = await pb.send<PaymentProviderInfoResponse>(
      '/backend/v1/subscriptions/payment-provider-info',
      {
        method: 'GET',
      },
    )
    return response
  } catch (error) {
    console.error('Error fetching payment provider info:', error)
    return {
      configured: false,
      provider: 'none',
      provider_name: 'Nenhuma forma de pagamento configurada',
      source: 'none',
      is_simulated: false,
    }
  }
}

/**
 * Gera o payload PIX copia e cola real oficial do Banco Central no backend (EMV padrão).
 * Nunca expõe a chave Pix ao frontend.
 */
export async function generatePixSubscriptionPayload(
  storeId: string,
  planId?: string,
): Promise<PixPayloadResponse> {
  return await pb.send<PixPayloadResponse>('/backend/v1/subscriptions/pix-payload', {
    method: 'POST',
    body: {
      store_id: storeId,
      plan_id: planId,
    },
  })
}

// ==========================================
// PIX SETTINGS (EXCLUSIVO ADMIN)
// ==========================================

export async function getPixSettings(): Promise<PixSettingRecord[]> {
  try {
    return await pb.collection('pix_settings').getFullList<PixSettingRecord>({
      sort: '-created',
    })
  } catch (error) {
    console.error('Error fetching pix settings:', error)
    return []
  }
}

export async function createPixSetting(data: {
  pix_key: string
  key_type: PixKeyType
  receiver_name: string
  receiver_city: string
  is_active?: boolean
}): Promise<PixSettingRecord> {
  return await pb.collection('pix_settings').create<PixSettingRecord>(data)
}

export async function updatePixSetting(
  id: string,
  data: {
    pix_key?: string
    key_type?: PixKeyType
    receiver_name?: string
    receiver_city?: string
    is_active?: boolean
  },
): Promise<PixSettingRecord> {
  return await pb.collection('pix_settings').update<PixSettingRecord>(id, data)
}

export async function deletePixSetting(id: string): Promise<boolean> {
  return await pb.collection('pix_settings').delete(id)
}

/**
 * Lista todas as credenciais de pagamento cadastradas (Exclusivo Admin).
 */
export async function getPaymentCredentials(): Promise<PaymentCredentialRecord[]> {
  try {
    return await pb.collection('payment_credentials').getFullList<PaymentCredentialRecord>({
      sort: '-created',
    })
  } catch (error) {
    console.error('Error fetching payment credentials:', error)
    return []
  }
}

/**
 * Cria uma nova credencial de pagamento (Exclusivo Admin).
 */
export async function createPaymentCredential(data: {
  provider: string
  name: string
  api_key: string
  extra_config?: Record<string, any>
  is_active?: boolean
}): Promise<PaymentCredentialRecord> {
  return await pb.collection('payment_credentials').create<PaymentCredentialRecord>(data)
}

/**
 * Atualiza uma credencial de pagamento existente (Exclusivo Admin).
 */
export async function updatePaymentCredential(
  id: string,
  data: {
    provider?: string
    name?: string
    api_key?: string
    extra_config?: Record<string, any>
    is_active?: boolean
  },
): Promise<PaymentCredentialRecord> {
  return await pb.collection('payment_credentials').update<PaymentCredentialRecord>(id, data)
}

/**
 * Exclui uma credencial de pagamento (Exclusivo Admin).
 */
export async function deletePaymentCredential(id: string): Promise<boolean> {
  return await pb.collection('payment_credentials').delete(id)
}

// ==========================================
// STORE CUSTOMERS (FIDELIZAÇÃO DO CLIENTE À LOJA)
// ==========================================

/**
 * Verifica se um cliente está fidelizado a uma loja específica.
 */
export async function isCustomerFidelityEnrolled(
  customerId: string,
  storeId: string,
): Promise<boolean> {
  try {
    const list = await pb.collection('store_customers').getList<StoreCustomerRecord>(1, 1, {
      filter: `store = "${storeId}" && customer = "${customerId}"`,
    })
    return list.items.length > 0
  } catch (error) {
    console.error('Error checking fidelity enrollment:', error)
    return false
  }
}

/**
 * Obtém a fidelização de um cliente para uma loja específica.
 */
export async function getCustomerFidelityEnrollment(
  customerId: string,
  storeId: string,
): Promise<StoreCustomerRecord | null> {
  try {
    const list = await pb.collection('store_customers').getList<StoreCustomerRecord>(1, 1, {
      filter: `store = "${storeId}" && customer = "${customerId}"`,
      expand: 'store,customer',
    })
    return list.items[0] || null
  } catch (error) {
    console.error('Error getting fidelity enrollment:', error)
    return null
  }
}

/**
 * Cliente se fideliza à loja (adiciona aos clientes da loja e garante que exista cartão digital).
 */
export async function enrollCustomerToStore(
  customerId: string,
  storeId: string,
): Promise<StoreCustomerRecord> {
  // 1. Criar registro de store_customers
  let enrollment: StoreCustomerRecord
  try {
    enrollment = await pb.collection('store_customers').create<StoreCustomerRecord>({
      store: storeId,
      customer: customerId,
    })
  } catch (err: any) {
    // Se já existir, busca o registro existente
    const existing = await getCustomerFidelityEnrollment(customerId, storeId)
    if (existing) return existing
    throw err
  }

  // 2. Garantir que exista um customer_card inicial para esta loja
  const card = await getCustomerCardForStore(customerId, storeId)
  if (!card) {
    try {
      await pb.collection('customer_cards').create<CustomerCardRecord>({
        customer_id: customerId,
        store_id: storeId,
        stamps_count: 0,
        points_balance: 0,
        cashback_balance: 0,
        total_purchases_count: 0,
        total_spent: 0,
        rewards_redeemed_count: 0,
      })
    } catch (cardErr) {
      console.warn('Could not auto-create customer card on enroll:', cardErr)
    }
  }

  return enrollment
}

/**
 * Cliente cancela fidelização com a loja.
 */
export async function unenrollCustomerFromStore(
  customerId: string,
  storeId: string,
): Promise<boolean> {
  const existing = await getCustomerFidelityEnrollment(customerId, storeId)
  if (!existing) return true
  return await pb.collection('store_customers').delete(existing.id)
}

/**
 * Lista todos os clientes fidelizados de uma loja (visão do lojista).
 */
export async function getStoreFidelityCustomers(storeId: string): Promise<StoreCustomerRecord[]> {
  try {
    return await pb.collection('store_customers').getFullList<StoreCustomerRecord>({
      filter: `store = "${storeId}"`,
      sort: '-created',
      expand: 'customer',
    })
  } catch (error) {
    console.error('Error fetching store customers:', error)
    return []
  }
}

/**
 * Lista todas as lojas às quais o cliente está fidelizado.
 */
export async function getCustomerEnrolledStores(
  customerId: string,
): Promise<StoreCustomerRecord[]> {
  try {
    return await pb.collection('store_customers').getFullList<StoreCustomerRecord>({
      filter: `customer = "${customerId}"`,
      sort: '-created',
      expand: 'store',
    })
  } catch (error) {
    console.error('Error fetching customer enrolled stores:', error)
    return []
  }
}

// ==========================================
// GIVEAWAYS & MARKETING (SORTEIOS)
// ==========================================

export async function getStoreGiveaways(storeId: string): Promise<GiveawayRecord[]> {
  try {
    return await pb.collection('giveaways').getFullList<GiveawayRecord>({
      filter: `store = "${storeId}"`,
      sort: '-created',
      expand: 'winner,store',
    })
  } catch (error) {
    console.error('Error fetching giveaways:', error)
    return []
  }
}

export async function createGiveaway(data: {
  store: string
  title: string
  reward_type: GiveawayRewardType
  reward_description?: string
  discount_amount?: number
  redemption_days: number
  status?: GiveawayStatus
  notes?: string
}): Promise<GiveawayRecord> {
  return await pb.collection('giveaways').create<GiveawayRecord>({
    ...data,
    status: data.status || 'open',
  })
}

export async function updateGiveaway(
  id: string,
  data: Partial<GiveawayRecord>,
): Promise<GiveawayRecord> {
  return await pb.collection('giveaways').update<GiveawayRecord>(id, data)
}

export async function deleteGiveaway(id: string): Promise<boolean> {
  return await pb.collection('giveaways').delete(id)
}

/**
 * Executa o sorteio de um brinde entre os clientes fidelizados da loja.
 * - Seleciona aleatoriamente um cliente dentre os fidelizados;
 * - Registra o ganhador, data do sorteio e prazo limite de resgate calculado;
 * - Dispara notificação in-app (collection notifications);
 * - Dispara e-mail para o ganhador via backend hook (Gmail do owner).
 */
export async function drawGiveawayWinner(giveawayId: string): Promise<{
  giveaway: GiveawayRecord
  winner: UserRecord
  emailSent?: boolean
}> {
  const giveaway = await pb.collection('giveaways').getOne<GiveawayRecord>(giveawayId, {
    expand: 'store',
  })

  if (!giveaway) {
    throw new Error('Sorteio não encontrado.')
  }

  // Buscar clientes fidelizados da loja
  const customers = await getStoreFidelityCustomers(giveaway.store)
  if (customers.length === 0) {
    throw new Error(
      'Nenhum cliente fidelizado encontrado nesta loja. É necessário ter clientes fidelizados para realizar o sorteio.',
    )
  }

  // Sorteio aleatório
  const randomIndex = Math.floor(Math.random() * customers.length)
  const selectedEnrollment = customers[randomIndex]
  const winnerUser = selectedEnrollment.expand?.customer

  if (!winnerUser) {
    throw new Error('Não foi possível identificar o cliente sorteado.')
  }

  // Calcular data limite de resgate
  const days = Number(giveaway.redemption_days) || 7
  const now = new Date()
  const expiresDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

  // Atualizar o sorteio no banco
  const updatedGiveaway = await pb.collection('giveaways').update<GiveawayRecord>(giveaway.id, {
    winner: winnerUser.id,
    status: 'drawn',
    drawn_at: now.toISOString(),
    expires_at: expiresDate.toISOString(),
    total_participants: customers.length,
  })

  // Criar notificação in-app para o cliente ganhador
  const storeName = giveaway.expand?.store?.name || 'Loja'
  const rewardText =
    giveaway.reward_type === 'discount' && giveaway.discount_amount
      ? `Desconto de R$ ${Number(giveaway.discount_amount).toFixed(2)}`
      : giveaway.reward_description || 'Brinde especial'

  const formattedDate = expiresDate.toLocaleDateString('pt-BR')

  try {
    await pb.collection('notifications').create<NotificationRecord>({
      user: winnerUser.id,
      store: giveaway.store,
      type: 'giveaway_won',
      title: '🎉 Você ganhou um sorteio!',
      message: `Você ganhou o sorteio "${giveaway.title}" da loja ${storeName}! Prêmio: ${rewardText}. Resgate até ${formattedDate} apresentando seu código no caixa.`,
      is_read: false,
      data: {
        giveaway_id: giveaway.id,
        reward_type: giveaway.reward_type,
        reward_description: giveaway.reward_description,
        discount_amount: giveaway.discount_amount,
        expires_at: expiresDate.toISOString(),
      },
    })
  } catch (notifErr) {
    console.warn('Erro ao criar notificação in-app:', notifErr)
  }

  // Disparar e-mail via endpoint backend
  let emailSent = false
  try {
    const notifyRes = await pb.send<{ sent: boolean; message: string }>(
      '/backend/v1/giveaways/notify-winner',
      {
        method: 'POST',
        body: { giveaway_id: giveaway.id },
      },
    )
    emailSent = !!notifyRes.sent
  } catch (emailErr) {
    console.warn('Erro ao disparar envio de e-mail ao ganhador:', emailErr)
  }

  return {
    giveaway: updatedGiveaway,
    winner: winnerUser,
    emailSent,
  }
}

/**
 * Lojista confirma o resgate presencial do prêmio na loja.
 */
export async function confirmGiveawayRedemption(giveawayId: string): Promise<GiveawayRecord> {
  const giveaway = await pb.collection('giveaways').getOne<GiveawayRecord>(giveawayId)
  if (!giveaway) throw new Error('Sorteio não encontrado.')
  if (giveaway.status !== 'drawn') {
    throw new Error('Apenas sorteios realizados podem ter o resgate confirmado.')
  }

  const updated = await pb.collection('giveaways').update<GiveawayRecord>(giveawayId, {
    status: 'redeemed',
    redeemed_at: new Date().toISOString(),
  })

  // Criar notificação in-app informando resgate confirmado
  if (giveaway.winner) {
    try {
      await pb.collection('notifications').create<NotificationRecord>({
        user: giveaway.winner,
        store: giveaway.store,
        type: 'giveaway_won',
        title: 'Prêmio Resgatado com Sucesso! 🎁',
        message: `O resgate do prêmio do sorteio "${giveaway.title}" foi confirmado pela loja. Esperamos que aproveite!`,
        is_read: false,
      })
    } catch {
      /* intentionally ignored */
    }
  }

  return updated
}

// ==========================================
// NOTIFICATIONS SERVICE (NOTIFICAÇÕES DO CLIENTE)
// ==========================================

export async function getCustomerNotifications(userId: string): Promise<NotificationRecord[]> {
  try {
    return await pb.collection('notifications').getFullList<NotificationRecord>({
      filter: `user = "${userId}"`,
      sort: '-created',
      expand: 'store',
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return []
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<NotificationRecord> {
  return await pb.collection('notifications').update<NotificationRecord>(notificationId, {
    is_read: true,
  })
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const list = await pb.collection('notifications').getFullList<NotificationRecord>({
      filter: `user = "${userId}" && is_read != true`,
    })
    for (const item of list) {
      await pb.collection('notifications').update(item.id, { is_read: true })
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
  }
}

/**
 * Busca sorteios ganhos pelo cliente (para exibir seus prêmios a resgatar)
 */
export async function getCustomerWonGiveaways(customerId: string): Promise<GiveawayRecord[]> {
  try {
    return await pb.collection('giveaways').getFullList<GiveawayRecord>({
      filter: `winner = "${customerId}"`,
      sort: '-drawn_at',
      expand: 'store',
    })
  } catch (error) {
    console.error('Error fetching customer won giveaways:', error)
    return []
  }
}

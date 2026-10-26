// pocketbase/hooks/infinitepay.pb.js
// Integração de Checkout, Assinaturas e Gestão Segura de Credenciais de Pagamento (Cloud / PocketBase pb_hooks)
//
// NOTA IMPORTANTE DE ARQUITETURA JSVM POCKETBASE:
// Variáveis e funções no escopo de módulo não persistem de forma confiável entre VM pools.
// Mantenha constantes e lógica de suporte inline dentro de cada handler de rota ou hook.

// 0. Hooks de ciclo de vida em payment_credentials para segurança e integridade
onRecordCreate((e) => {
  const rec = e.record
  const rawKey = rec.getString('api_key')
  if (rawKey && rawKey.trim()) {
    const str = String(rawKey).trim()
    const masked = str.length <= 8 ? '****' + str.slice(-2) : '****...' + str.slice(-4)
    rec.set('api_key_masked', masked)
  }

  // Se estiver marcado como ativo, desativa outras credenciais do mesmo provedor
  if (rec.getBool('is_active')) {
    const provider = rec.getString('provider')
    try {
      const records = e.app.findRecordsByFilter(
        'payment_credentials',
        `provider = "${provider}" && is_active = true`,
      )
      for (let i = 0; i < records.length; i++) {
        records[i].set('is_active', false)
        e.app.save(records[i])
      }
    } catch (_) {}
  }
  e.next()
}, 'payment_credentials')

onRecordUpdate((e) => {
  const rec = e.record
  const rawKey = rec.getString('api_key')
  if (rawKey && rawKey.trim()) {
    const str = String(rawKey).trim()
    const masked = str.length <= 8 ? '****' + str.slice(-2) : '****...' + str.slice(-4)
    rec.set('api_key_masked', masked)
  } else {
    // Se a chave não foi reenviada (ou enviada vazia no update), preserva a chave anterior
    try {
      const original = rec.original()
      if (original) {
        rec.set('api_key', original.getString('api_key'))
        rec.set('api_key_masked', original.getString('api_key_masked'))
      }
    } catch (_) {}
  }

  // Se esta credencial foi ativada, desativa as outras credenciais do mesmo provedor
  if (rec.getBool('is_active')) {
    const provider = rec.getString('provider')
    try {
      const records = e.app.findRecordsByFilter(
        'payment_credentials',
        `provider = "${provider}" && is_active = true && id != "${rec.id}"`,
      )
      for (let i = 0; i < records.length; i++) {
        records[i].set('is_active', false)
        e.app.save(records[i])
      }
    } catch (_) {}
  }
  e.next()
}, 'payment_credentials')

// Rota para consultar o status de configuração do provedor ativo (aberto a usuários autenticados da aplicação)
// GET /backend/v1/subscriptions/payment-provider-info
routerAdd('GET', '/backend/v1/subscriptions/payment-provider-info', (e) => {
  const reqInfo = e.requestInfo()
  const authRecord = reqInfo ? reqInfo.auth : null
  if (!authRecord) {
    return e.json(401, { error: 'Autenticação necessária.' })
  }

  // 1. Busca credencial ativa no banco (InfinitePay prioritária para checkout atual)
  let activeCredential = null
  try {
    const activeList = e.app.findRecordsByFilter(
      'payment_credentials',
      'is_active = true',
      '-updated',
      1,
      0,
    )
    if (activeList && activeList.length > 0) {
      activeCredential = activeList[0]
    }
  } catch (_) {}

  // 2. Se houver credencial ativa na tabela
  if (activeCredential) {
    const provider = activeCredential.getString('provider')
    const name = activeCredential.getString('name')
    const masked = activeCredential.getString('api_key_masked')
    const updated = activeCredential.getString('updated') || activeCredential.getString('created')

    return e.json(200, {
      configured: true,
      provider: provider,
      provider_name: name,
      api_key_masked: masked,
      updated_at: updated,
      source: 'database',
      is_simulated: false,
    })
  }

  // 3. Fallback para chave de ambiente INFINITEPAY_API_KEY
  const envKey = ($os.getenv('INFINITEPAY_API_KEY') || '').trim()
  if (envKey) {
    const str = envKey
    const masked = str.length <= 8 ? '****' + str.slice(-2) : '****...' + str.slice(-4)
    return e.json(200, {
      configured: true,
      provider: 'InfinitePay',
      provider_name: 'Chave de Ambiente (Skip Cloud)',
      api_key_masked: masked,
      source: 'env',
      is_simulated: false,
    })
  }

  // 4. Fallback para configuração direta de PIX do administrador (collection pix_settings)
  let activePix = null
  try {
    const pixList = e.app.findRecordsByFilter('pix_settings', 'is_active = true', '-updated', 1, 0)
    if (pixList && pixList.length > 0) {
      activePix = pixList[0]
    }
  } catch (_) {}

  if (activePix) {
    const receiverName = activePix.getString('receiver_name') || 'Administrador'
    const receiverCity = activePix.getString('receiver_city') || 'BRASIL'
    const keyType = activePix.getString('key_type') || 'aleatoria'
    const masked = activePix.getString('pix_key_masked') || '****'
    const updated = activePix.getString('updated') || activePix.getString('created')

    return e.json(200, {
      configured: true,
      provider: 'PIX',
      provider_name: 'PIX direto (chave Pix do administrador)',
      api_key_masked: masked,
      updated_at: updated,
      source: 'pix_settings',
      is_simulated: false,
      pix_info: {
        receiver_name: receiverName,
        receiver_city: receiverCity,
        key_type: keyType,
        key_masked: masked,
      },
    })
  }

  // 5. Nenhuma via configurada
  return e.json(200, {
    configured: false,
    provider: 'none',
    provider_name: 'Nenhuma forma de pagamento configurada',
    api_key_masked: '',
    source: 'none',
    is_simulated: false,
  })
})

// 1. Rota autenticada para criar link de checkout
// POST /backend/v1/subscriptions/checkout-link
routerAdd('POST', '/backend/v1/subscriptions/checkout-link', (e) => {
  const reqInfo = e.requestInfo()
  const authRecord = reqInfo ? reqInfo.auth : null
  if (!authRecord) {
    return e.json(401, { error: 'Autenticação necessária.' })
  }

  // Resolução da API Key na ordem especificada:
  // (1) Credencial ativa da collection payment_credentials para 'infinitepay'
  // (2) Fallback para $os.getenv('INFINITEPAY_API_KEY')
  // (3) Fallback para PIX simulado se nenhuma existir
  let apiKey = ''
  let credentialName = ''
  try {
    const creds = e.app.findRecordsByFilter(
      'payment_credentials',
      'is_active = true && (provider ~ "infinitepay" || provider ~ "InfinitePay")',
      '-updated',
      1,
      0,
    )
    if (creds && creds.length > 0) {
      apiKey = (creds[0].getString('api_key') || '').trim()
      credentialName = creds[0].getString('name')
    }
  } catch (err) {
    console.warn('[InfinitePay:checkoutLink] Erro ao buscar credenciais ativas: ' + err.message)
  }

  if (!apiKey) {
    apiKey = ($os.getenv('INFINITEPAY_API_KEY') || '').trim()
    if (apiKey) {
      credentialName = 'Chave de Ambiente'
    }
  }

  if (!apiKey) {
    return e.json(200, {
      configured: false,
      message:
        'Nenhuma credencial ativa para InfinitePay foi encontrada nas configurações de pagamento nem nas variáveis de ambiente.',
    })
  }

  const body = (reqInfo && reqInfo.body) || {}
  const storeId = (body.store_id || '').trim()
  const planId = (body.plan_id || '').trim()

  if (!storeId) {
    return e.json(400, { error: 'O parâmetro store_id é obrigatório.' })
  }

  let store = null
  try {
    store = e.app.findRecordById('stores', storeId)
  } catch (_) {
    return e.json(404, { error: 'Loja não encontrada.' })
  }

  // Verifica se o usuário autenticado é o dono da loja ou admin/colaborador
  const userRole = authRecord.getString('role')
  const ownerId = store.getString('owner_id')
  if (authRecord.id !== ownerId && userRole !== 'admin' && userRole !== 'collaborator') {
    return e.json(403, { error: 'Você não tem permissão para pagar a assinatura desta loja.' })
  }

  // Identifica o plano (enviado ou vinculado à loja)
  const effectivePlanId = planId || store.getString('subscription_plan_id')
  if (!effectivePlanId) {
    return e.json(400, { error: 'Nenhum plano de assinatura selecionado para esta loja.' })
  }

  let plan = null
  try {
    plan = e.app.findRecordById('subscription_plans', effectivePlanId)
  } catch (_) {
    return e.json(404, { error: 'Plano de assinatura não encontrado.' })
  }

  const planName = plan.getString('name') || 'Plano Fideliza'
  const planPriceNumber = plan.getFloat('price') || 49.9
  // Converter preço em reais para centavos inteiros (ex: 49.90 -> 4990)
  const priceInCents = Math.round(planPriceNumber * 100)
  if (priceInCents <= 0) {
    return e.json(400, { error: 'Valor da assinatura inválido.' })
  }

  // Gera order_nsu único
  const orderNsu =
    'SUB-' +
    store.id.substring(0, 8) +
    '-' +
    Date.now().toString(36) +
    '-' +
    $security.randomString(6).toUpperCase()

  // Monta redirect_url e webhook_url
  const siteUrl = (
    $os.getenv('SITE_URL') || 'https://fideliza-programa-de-fidelidade-4940d.goskip.app'
  ).replace(/\/+$/, '')
  const redirectUrl = siteUrl + '/pagamento-retorno'

  // Backend URL para webhook
  const pbInstanceUrl = (
    $os.getenv('PB_INSTANCE_URL') ||
    'https://fideliza-programa-de-fidelidade-4940d.shrd01.internal.goskip.dev'
  ).replace(/\/+$/, '')
  const webhookUrl = pbInstanceUrl + '/webhook-infinitepay'

  // Dados do cliente/lojista
  const customerName = authRecord.getString('name') || store.getString('name') || 'Lojista Fideliza'
  const customerEmail = authRecord.email()
  const customerPhone = authRecord.getString('phone') || store.getString('phone') || ''

  const infinitePayPayload = {
    items: [
      {
        quantity: 1,
        price: priceInCents,
        description: 'Assinatura Fideliza — ' + planName,
      },
    ],
    order_nsu: orderNsu,
    redirect_url: redirectUrl,
    customer: {
      name: customerName,
      email: customerEmail,
      phone_number: customerPhone ? customerPhone.replace(/\D/g, '') : undefined,
    },
    options: {
      single_payment: true,
      payment_methods_enabled: ['credit_card', 'pix'],
      discounts: {
        pix: 0,
      },
    },
    webhook: {
      url: webhookUrl,
      events: ['paid', 'canceled', 'refunded', 'payment_failed'],
    },
  }

  console.log(
    '[InfinitePay:checkoutLink] Criando link para order_nsu: ' +
      orderNsu +
      ' com credencial: ' +
      credentialName,
  )

  let res = null
  try {
    res = $http.send({
      url: 'https://api.checkout.infinitepay.io/links',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey.trim(),
      },
      data: JSON.stringify(infinitePayPayload),
      timeout: 30,
    })
  } catch (httpErr) {
    console.error(
      '[InfinitePay:checkoutLink] Erro de rede ao conectar à InfinitePay: ' + httpErr.message,
    )
    return e.json(502, {
      error: 'Não foi possível conectar ao servidor da InfinitePay. Verifique a conexão.',
    })
  }

  if (res.statusCode < 200 || res.statusCode >= 300) {
    console.error(
      '[InfinitePay:checkoutLink] Erro da API InfinitePay (HTTP ' +
        res.statusCode +
        '): ' +
        res.rawText,
    )
    let errorMessage = 'Falha ao gerar link de pagamento na InfinitePay.'
    try {
      const errJson = JSON.parse(res.rawText)
      if (errJson && (errJson.message || errJson.error)) {
        errorMessage = errJson.message || errJson.error
      }
    } catch (_) {}
    return e.json(400, {
      error: errorMessage,
      details: res.rawText,
    })
  }

  let responseData = {}
  try {
    responseData = JSON.parse(res.rawText)
  } catch (parseErr) {
    console.error('[InfinitePay:checkoutLink] Falha ao analisar resposta: ' + res.rawText)
    return e.json(500, { error: 'Resposta inválida recebida da InfinitePay.' })
  }

  const checkoutUrl =
    responseData.url ||
    responseData.checkout_url ||
    responseData.link ||
    (responseData.data && (responseData.data.url || responseData.data.checkout_url)) ||
    ''

  const slug =
    responseData.slug ||
    responseData.id ||
    (responseData.data && (responseData.data.slug || responseData.data.id)) ||
    ''

  // Cria o registro na collection subscription_payments
  try {
    const paymentsCol = e.app.findCollectionByNameOrId('subscription_payments')
    const paymentRecord = new Record(paymentsCol)
    paymentRecord.set('store', store.id)
    paymentRecord.set('plan', plan.id)
    paymentRecord.set('amount', priceInCents)
    paymentRecord.set('order_nsu', orderNsu)
    paymentRecord.set('slug', slug)
    paymentRecord.set('status', 'pending')
    paymentRecord.set('checkout_url', checkoutUrl)
    paymentRecord.set('metadata', JSON.stringify(responseData))
    e.app.save(paymentRecord)
  } catch (dbErr) {
    console.error(
      '[InfinitePay:checkoutLink] Erro ao salvar registro de pagamento: ' + dbErr.message,
    )
  }

  return e.json(200, {
    configured: true,
    provider: 'InfinitePay',
    credential_name: credentialName,
    checkout_url: checkoutUrl,
    order_nsu: orderNsu,
    slug: slug,
    amount: priceInCents,
  })
})

// 2. Webhook público da InfinitePay
// POST /webhook-infinitepay
routerAdd('POST', '/webhook-infinitepay', (e) => {
  let body = {}
  try {
    const reqInfo = e.requestInfo()
    body = (reqInfo && reqInfo.body) || {}
  } catch (_) {
    body = {}
  }

  console.log('[InfinitePay:webhook] Recebido payload: ' + JSON.stringify(body))

  const event = (body.event || (body.data && body.data.event) || '').toLowerCase()
  const orderNsu = (
    body.order_nsu ||
    (body.data && body.data.order_nsu) ||
    body.orderId ||
    ''
  ).trim()
  const slug = (body.slug || (body.data && body.data.slug) || '').trim()
  const transactionNsu = (
    body.transaction_nsu ||
    (body.data && body.data.transaction_nsu) ||
    body.nsu ||
    ''
  ).trim()
  const captureMethod = (
    body.capture_method ||
    (body.data && body.data.capture_method) ||
    body.payment_method ||
    ''
  ).toLowerCase()

  // Localiza o registro de pagamento
  let paymentRecord = null
  if (orderNsu) {
    try {
      paymentRecord = e.app.findFirstRecordByData('subscription_payments', 'order_nsu', orderNsu)
    } catch (_) {}
  }
  if (!paymentRecord && slug) {
    try {
      paymentRecord = e.app.findFirstRecordByData('subscription_payments', 'slug', slug)
    } catch (_) {}
  }

  if (!paymentRecord) {
    console.warn(
      '[InfinitePay:webhook] Registro de pagamento não encontrado para order_nsu="' +
        orderNsu +
        '", slug="' +
        slug +
        '"',
    )
    return e.json(200, { received: true, matched: false })
  }

  if (transactionNsu) {
    paymentRecord.set('transaction_nsu', transactionNsu)
  }
  if (captureMethod) {
    paymentRecord.set('capture_method', captureMethod)
  }

  const nowIso = new Date().toISOString()

  if (event === 'paid' || event === 'settled') {
    paymentRecord.set('status', 'paid')
    paymentRecord.set('paid_at', nowIso)

    try {
      const storeId = paymentRecord.getString('store')
      const planId = paymentRecord.getString('plan')

      if (storeId) {
        const store = e.app.findRecordById('stores', storeId)
        let intervalMonths = 1

        if (planId) {
          try {
            const plan = e.app.findRecordById('subscription_plans', planId)
            intervalMonths = plan.getInt('billing_interval_months') || 1
          } catch (_) {}
        }

        const currentExpiry = store.getString('subscription_expires_at')
        let baseDate = new Date()
        if (currentExpiry) {
          const parsed = new Date(currentExpiry)
          if (!isNaN(parsed.getTime()) && parsed > baseDate) {
            baseDate = parsed
          }
        }
        baseDate.setMonth(baseDate.getMonth() + intervalMonths)
        const nextExpiryFormatted = baseDate.toISOString().split('T')[0]

        store.set('subscription_status', 'active')
        if (planId) {
          store.set('subscription_plan_id', planId)
        }
        store.set('subscription_expires_at', nextExpiryFormatted)
        store.set('suspend_public', false)
        store.set('suspend_merchant', false)

        e.app.save(store)
        console.log(
          '[InfinitePay:webhook] Loja ' +
            storeId +
            ' ativada com sucesso até ' +
            nextExpiryFormatted +
            ' (+ ' +
            intervalMonths +
            ' meses)',
        )
      }
    } catch (storeErr) {
      console.error(
        '[InfinitePay:webhook] Erro ao atualizar status da loja após pagamento: ' +
          storeErr.message,
      )
    }
  } else if (event === 'canceled') {
    paymentRecord.set('status', 'canceled')
  } else if (event === 'refunded') {
    paymentRecord.set('status', 'refunded')
  } else if (event === 'payment_failed') {
    paymentRecord.set('status', 'failed')
  }

  try {
    e.app.save(paymentRecord)
  } catch (saveErr) {
    console.error('[InfinitePay:webhook] Erro ao salvar registro de pagamento: ' + saveErr.message)
  }

  return e.json(200, { received: true, event: event })
})

// 3. Rota de checagem/revalidação de pagamento (payment_check)
// POST /backend/v1/subscriptions/payment-check
routerAdd('POST', '/backend/v1/subscriptions/payment-check', (e) => {
  const reqInfo = e.requestInfo()
  const authRecord = reqInfo ? reqInfo.auth : null
  if (!authRecord) {
    return e.json(401, { error: 'Autenticação necessária.' })
  }

  let apiKey = ''
  try {
    const creds = e.app.findRecordsByFilter(
      'payment_credentials',
      'is_active = true && (provider ~ "infinitepay" || provider ~ "InfinitePay")',
      '-updated',
      1,
      0,
    )
    if (creds && creds.length > 0) {
      apiKey = (creds[0].getString('api_key') || '').trim()
    }
  } catch (_) {}

  if (!apiKey) {
    apiKey = ($os.getenv('INFINITEPAY_API_KEY') || '').trim()
  }

  const body = (reqInfo && reqInfo.body) || {}
  const orderNsu = (body.order_nsu || '').trim()
  const slug = (body.slug || '').trim()
  const transactionNsu = (body.transaction_nsu || '').trim()

  if (!orderNsu && !slug && !transactionNsu) {
    return e.json(400, {
      error: 'Informe order_nsu, slug ou transaction_nsu para realizar a consulta.',
    })
  }

  // Localiza o registro no banco local
  let paymentRecord = null
  if (orderNsu) {
    try {
      paymentRecord = e.app.findFirstRecordByData('subscription_payments', 'order_nsu', orderNsu)
    } catch (_) {}
  }
  if (!paymentRecord && slug) {
    try {
      paymentRecord = e.app.findFirstRecordByData('subscription_payments', 'slug', slug)
    } catch (_) {}
  }

  // Se o registro local já está como 'paid', pode retornar imediatamente
  if (paymentRecord && paymentRecord.getString('status') === 'paid') {
    return e.json(200, {
      paid: true,
      status: 'paid',
      capture_method: paymentRecord.getString('capture_method'),
      paid_at: paymentRecord.getString('paid_at'),
      order_nsu: paymentRecord.getString('order_nsu'),
    })
  }

  // Se não temos API Key configurada, responde o status do banco local
  if (!apiKey) {
    return e.json(200, {
      configured: false,
      paid: paymentRecord ? paymentRecord.getString('status') === 'paid' : false,
      status: paymentRecord ? paymentRecord.getString('status') : 'unknown',
      order_nsu: orderNsu,
    })
  }

  const checkPayload = {}
  if (orderNsu) checkPayload.order_nsu = orderNsu
  if (slug) checkPayload.slug = slug
  if (transactionNsu) checkPayload.transaction_nsu = transactionNsu

  let checkRes = null
  try {
    checkRes = $http.send({
      url: 'https://api.checkout.infinitepay.io/payment_check',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey.trim(),
      },
      data: JSON.stringify(checkPayload),
      timeout: 20,
    })
  } catch (httpErr) {
    console.error('[InfinitePay:paymentCheck] Erro ao consultar InfinitePay: ' + httpErr.message)
    return e.json(200, {
      paid: paymentRecord ? paymentRecord.getString('status') === 'paid' : false,
      status: paymentRecord ? paymentRecord.getString('status') : 'pending',
      order_nsu: orderNsu,
    })
  }

  let resultData = {}
  try {
    resultData = JSON.parse(checkRes.rawText)
  } catch (_) {
    resultData = {}
  }

  const isPaid = Boolean(resultData.paid || resultData.status === 'paid')
  const captureMethod = resultData.capture_method || ''
  const transNsu = resultData.transaction_nsu || ''

  if (isPaid && paymentRecord && paymentRecord.getString('status') !== 'paid') {
    paymentRecord.set('status', 'paid')
    paymentRecord.set('paid_at', new Date().toISOString())
    if (captureMethod) paymentRecord.set('capture_method', captureMethod)
    if (transNsu) paymentRecord.set('transaction_nsu', transNsu)
    try {
      e.app.save(paymentRecord)
    } catch (_) {}

    try {
      const storeId = paymentRecord.getString('store')
      const planId = paymentRecord.getString('plan')
      if (storeId) {
        const store = e.app.findRecordById('stores', storeId)
        let intervalMonths = 1
        if (planId) {
          try {
            const plan = e.app.findRecordById('subscription_plans', planId)
            intervalMonths = plan.getInt('billing_interval_months') || 1
          } catch (_) {}
        }

        const currentExpiry = store.getString('subscription_expires_at')
        let baseDate = new Date()
        if (currentExpiry) {
          const parsed = new Date(currentExpiry)
          if (!isNaN(parsed.getTime()) && parsed > baseDate) {
            baseDate = parsed
          }
        }
        baseDate.setMonth(baseDate.getMonth() + intervalMonths)
        const nextExpiryFormatted = baseDate.toISOString().split('T')[0]

        store.set('subscription_status', 'active')
        if (planId) store.set('subscription_plan_id', planId)
        store.set('subscription_expires_at', nextExpiryFormatted)
        store.set('suspend_public', false)
        store.set('suspend_merchant', false)
        e.app.save(store)
      }
    } catch (err) {
      console.error('[InfinitePay:paymentCheck] Erro ao ativar loja: ' + err.message)
    }
  }

  return e.json(200, {
    paid: isPaid,
    status: isPaid
      ? 'paid'
      : resultData.status || (paymentRecord ? paymentRecord.getString('status') : 'pending'),
    capture_method:
      captureMethod || (paymentRecord ? paymentRecord.getString('capture_method') : ''),
    order_nsu: orderNsu,
    slug: slug,
    details: resultData,
  })
})

// ========================================================
// 4. CICLO DE VIDA E ROTAS PARA PIX_SETTINGS (ADMIN & CHECKOUT)
// ========================================================

// 4.1 Hooks de ciclo de vida em pix_settings para mascaramento da chave e exclusividade de ativo
onRecordCreate((e) => {
  const rec = e.record
  const rawKey = rec.getString('pix_key')
  const keyType = rec.getString('key_type')
  if (rawKey && rawKey.trim()) {
    const str = String(rawKey).trim()
    let masked = '****'
    if (keyType === 'email') {
      const parts = str.split('@')
      if (parts.length === 2) {
        const userPart = parts[0]
        const maskedUser =
          userPart.length <= 2
            ? userPart.charAt(0) + '***'
            : userPart.slice(0, 2) + '***' + userPart.slice(-1)
        masked = maskedUser + '@' + parts[1]
      } else {
        masked = str.slice(0, 2) + '***' + str.slice(-2)
      }
    } else if (keyType === 'telefone') {
      const digits = str.replace(/\D/g, '')
      masked = digits.length >= 4 ? '(**) *****-' + digits.slice(-4) : '****'
    } else if (keyType === 'cpf') {
      const digits = str.replace(/\D/g, '')
      masked =
        digits.length === 11
          ? '***.' + digits.slice(3, 6) + '.***-' + digits.slice(-2)
          : '***.***.***-**'
    } else if (keyType === 'cnpj') {
      const digits = str.replace(/\D/g, '')
      masked =
        digits.length === 14
          ? digits.slice(0, 2) + '.***.***/****-' + digits.slice(-2)
          : '**.***.***/****-**'
    } else {
      masked = str.length > 8 ? str.slice(0, 4) + '...' + str.slice(-4) : '****' + str.slice(-2)
    }
    rec.set('pix_key_masked', masked)
  }

  if (rec.getBool('is_active')) {
    try {
      const records = e.app.findRecordsByFilter('pix_settings', 'is_active = true')
      for (let i = 0; i < records.length; i++) {
        records[i].set('is_active', false)
        e.app.save(records[i])
      }
    } catch (_) {}
  }
  e.next()
}, 'pix_settings')

onRecordUpdate((e) => {
  const rec = e.record
  const rawKey = rec.getString('pix_key')
  const keyType = rec.getString('key_type')

  if (rawKey && rawKey.trim()) {
    const str = String(rawKey).trim()
    let masked = '****'
    if (keyType === 'email') {
      const parts = str.split('@')
      if (parts.length === 2) {
        const userPart = parts[0]
        const maskedUser =
          userPart.length <= 2
            ? userPart.charAt(0) + '***'
            : userPart.slice(0, 2) + '***' + userPart.slice(-1)
        masked = maskedUser + '@' + parts[1]
      } else {
        masked = str.slice(0, 2) + '***' + str.slice(-2)
      }
    } else if (keyType === 'telefone') {
      const digits = str.replace(/\D/g, '')
      masked = digits.length >= 4 ? '(**) *****-' + digits.slice(-4) : '****'
    } else if (keyType === 'cpf') {
      const digits = str.replace(/\D/g, '')
      masked =
        digits.length === 11
          ? '***.' + digits.slice(3, 6) + '.***-' + digits.slice(-2)
          : '***.***.***-**'
    } else if (keyType === 'cnpj') {
      const digits = str.replace(/\D/g, '')
      masked =
        digits.length === 14
          ? digits.slice(0, 2) + '.***.***/****-' + digits.slice(-2)
          : '**.***.***/****-**'
    } else {
      masked = str.length > 8 ? str.slice(0, 4) + '...' + str.slice(-4) : '****' + str.slice(-2)
    }
    rec.set('pix_key_masked', masked)
  } else {
    // Se não reenviou pix_key (ou veio vazio), preserva a chave anterior
    try {
      const original = rec.original()
      if (original) {
        rec.set('pix_key', original.getString('pix_key'))
        rec.set('pix_key_masked', original.getString('pix_key_masked'))
      }
    } catch (_) {}
  }

  if (rec.getBool('is_active')) {
    try {
      const records = e.app.findRecordsByFilter(
        'pix_settings',
        `is_active = true && id != "${rec.id}"`,
      )
      for (let i = 0; i < records.length; i++) {
        records[i].set('is_active', false)
        e.app.save(records[i])
      }
    } catch (_) {}
  }
  e.next()
}, 'pix_settings')

// 4.2 Rota pública autenticada para o checkout gerar o payload EMV completo no SERVIDOR
// POST /backend/v1/subscriptions/pix-payload
routerAdd('POST', '/backend/v1/subscriptions/pix-payload', (e) => {
  const reqInfo = e.requestInfo()
  const authRecord = reqInfo ? reqInfo.auth : null
  if (!authRecord) {
    return e.json(401, { error: 'Autenticação necessária.' })
  }

  const body = (reqInfo && reqInfo.body) || {}
  const storeId = (body.store_id || '').trim()
  const planId = (body.plan_id || '').trim()

  if (!storeId) {
    return e.json(400, { error: 'O parâmetro store_id é obrigatório.' })
  }

  let store = null
  try {
    store = e.app.findRecordById('stores', storeId)
  } catch (_) {
    return e.json(404, { error: 'Loja não encontrada.' })
  }

  const userRole = authRecord.getString('role')
  const ownerId = store.getString('owner_id')
  if (authRecord.id !== ownerId && userRole !== 'admin' && userRole !== 'collaborator') {
    return e.json(403, { error: 'Você não tem permissão para pagar a assinatura desta loja.' })
  }

  const effectivePlanId = planId || store.getString('subscription_plan_id')
  if (!effectivePlanId) {
    return e.json(400, { error: 'Nenhum plano de assinatura selecionado.' })
  }

  let plan = null
  try {
    plan = e.app.findRecordById('subscription_plans', effectivePlanId)
  } catch (_) {
    return e.json(404, { error: 'Plano de assinatura não encontrado.' })
  }

  // 1. Busca chave Pix ativa no banco
  let pixSetting = null
  try {
    const pixList = e.app.findRecordsByFilter('pix_settings', 'is_active = true', '-updated', 1, 0)
    if (pixList && pixList.length > 0) {
      pixSetting = pixList[0]
    }
  } catch (_) {}

  if (!pixSetting) {
    return e.json(400, {
      configured: false,
      error: 'Nenhuma chave Pix configurada pelo administrador.',
    })
  }

  const rawKey = pixSetting.getString('pix_key') || ''
  const keyType = pixSetting.getString('key_type') || 'aleatoria'
  let receiverName = (pixSetting.getString('receiver_name') || 'FIDELIZA').trim()
  let receiverCity = (pixSetting.getString('receiver_city') || 'BRASIL').trim()

  if (!rawKey.trim()) {
    return e.json(400, {
      configured: false,
      error: 'Chave Pix inválida ou não configurada.',
    })
  }

  // Sanitização e formatação da chave Pix
  let formattedPixKey = rawKey.trim()
  if (keyType === 'cpf' || keyType === 'cnpj') {
    formattedPixKey = formattedPixKey.replace(/\D/g, '')
  } else if (keyType === 'telefone') {
    let phoneDigits = formattedPixKey.replace(/\D/g, '')
    if (phoneDigits.startsWith('55') && phoneDigits.length >= 12) {
      formattedPixKey = '+' + phoneDigits
    } else {
      formattedPixKey = '+55' + phoneDigits
    }
  } else if (keyType === 'email') {
    formattedPixKey = formattedPixKey.toLowerCase().trim()
  }

  // Funções inline de sanitização EMV (sem acentos, uppercase, ASCII)
  const sanitizeEmv = (str, maxLen) => {
    let s = String(str || '')
    // Substituição direta de acentos comuns para goja/JS
    const accMap = {
      á: 'a',
      à: 'a',
      ã: 'a',
      â: 'a',
      ä: 'a',
      é: 'e',
      è: 'e',
      ê: 'e',
      ë: 'e',
      í: 'i',
      ì: 'i',
      î: 'i',
      ï: 'i',
      ó: 'o',
      ò: 'o',
      õ: 'o',
      ô: 'o',
      ö: 'o',
      ú: 'u',
      ù: 'u',
      û: 'u',
      ü: 'u',
      ç: 'c',
      ñ: 'n',
      Á: 'A',
      À: 'A',
      Ã: 'A',
      Â: 'A',
      Ä: 'A',
      É: 'E',
      È: 'E',
      Ê: 'E',
      Ë: 'E',
      Í: 'I',
      Ì: 'I',
      Î: 'I',
      Ï: 'I',
      Ó: 'O',
      Ò: 'O',
      Õ: 'O',
      Ô: 'O',
      Ö: 'O',
      Ú: 'U',
      Ù: 'U',
      Û: 'U',
      Ü: 'U',
      Ç: 'C',
      Ñ: 'N',
    }
    for (let k in accMap) {
      while (s.indexOf(k) !== -1) {
        s = s.replace(k, accMap[k])
      }
    }
    s = s
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, '')
      .trim()
      .replace(/\s+/g, ' ')
    if (s.length > maxLen) {
      s = s.slice(0, maxLen)
    }
    return s || 'FIDELIZA'
  }

  const cleanName = sanitizeEmv(receiverName, 25)
  const cleanCity = sanitizeEmv(receiverCity, 15)

  // Valor da assinatura
  const planPrice = plan.getFloat('price') || 49.9
  const amountStr = planPrice.toFixed(2)
  const priceInCents = Math.round(planPrice * 100)

  // Geração de txid único para conciliação (FIDELIZA-<loja curta>-<tempo curto>)
  // Max 25 chars no campo 62.05 [A-Za-z0-9]
  const shortStore = store.id.slice(0, 6).toUpperCase()
  const shortTime = Date.now().toString(36).toUpperCase()
  const txid = ('FDL' + shortStore + shortTime).slice(0, 25)

  // Order NSU para registro em subscription_payments
  const orderNsu = 'PIX-' + txid

  // Montagem EMV TLV
  const tlv = (id, val) => {
    const v = String(val)
    const lenStr = v.length < 10 ? '0' + v.length : String(v.length)
    return id + lenStr + v
  }

  // 26 Merchant Account Info
  const accountInfo = tlv('00', 'BR.GOV.BCB.PIX') + tlv('01', formattedPixKey)

  // Montagem do payload EMV antes do CRC
  const payloadBeforeCrc =
    tlv('00', '01') +
    tlv('01', '12') + // 12 = dinâmico/específico da transação
    tlv('26', accountInfo) +
    tlv('52', '0000') +
    tlv('53', '986') +
    tlv('54', amountStr) +
    tlv('58', 'BR') +
    tlv('59', cleanName) +
    tlv('60', cleanCity) +
    tlv('62', tlv('05', txid)) +
    '6304'

  // Cálculo CRC16-CCITT (Polinômio 0x1021, valor inicial 0xFFFF, sem reflexão, final 0x0000)
  const calcCrc16 = (str) => {
    let crc = 0xffff
    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8
      for (let bit = 0; bit < 8; bit++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ 0x1021) & 0xffff
        } else {
          crc = (crc << 1) & 0xffff
        }
      }
    }
    let hex = crc.toString(16).toUpperCase()
    while (hex.length < 4) {
      hex = '0' + hex
    }
    return hex
  }

  const crcValue = calcCrc16(payloadBeforeCrc)
  const fullPixPayload = payloadBeforeCrc + crcValue

  // Registra a tentativa em subscription_payments com método pix e status pending
  let paymentRecord = null
  try {
    const paymentsCol = e.app.findCollectionByNameOrId('subscription_payments')
    paymentRecord = new Record(paymentsCol)
    paymentRecord.set('store', store.id)
    paymentRecord.set('plan', plan.id)
    paymentRecord.set('amount', priceInCents)
    paymentRecord.set('order_nsu', orderNsu)
    paymentRecord.set('slug', txid)
    paymentRecord.set('status', 'pending')
    paymentRecord.set('capture_method', 'pix')
    paymentRecord.set('checkout_url', '')
    paymentRecord.set(
      'metadata',
      JSON.stringify({
        txid: txid,
        receiver_name: cleanName,
        receiver_city: cleanCity,
        amount: amountStr,
        key_type: keyType,
        source: 'pix_settings',
      }),
    )
    e.app.save(paymentRecord)
  } catch (err) {
    console.error('[PixPayload] Erro ao registrar subscription_payments: ' + err.message)
  }

  // Atualiza status da loja para 'pending' se ainda não estiver ativa ou se vencida
  try {
    if (store.getString('subscription_status') !== 'active') {
      store.set('subscription_status', 'pending')
      e.app.save(store)
    }
  } catch (_) {}

  // A chave Pix bruta NUNCA é enviada ao frontend, apenas dados públicos e o payload montado
  return e.json(200, {
    configured: true,
    pix_payload: fullPixPayload,
    txid: txid,
    order_nsu: orderNsu,
    amount: planPrice,
    amount_formatted: 'R$ ' + planPrice.toFixed(2),
    receiver_name: cleanName,
    receiver_city: cleanCity,
    plan_name: plan.getString('name') || 'Plano Fideliza',
    billing_interval_months: plan.getInt('billing_interval_months') || 1,
    payment_id: paymentRecord ? paymentRecord.id : null,
  })
})

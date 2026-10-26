// pocketbase/hooks/infinitepay.pb.js
// Integração de Checkout e Assinaturas com InfinitePay (Cloud / PocketBase pb_hooks)
//
// NOTA IMPORTANTE DE ARQUITETURA JSVM POCKETBASE:
// Variáveis e funções no escopo de módulo não persistem de forma confiável entre VM pools.
// Mantenha constantes e lógica de suporte inline dentro de cada handler de rota.

// 1. Rota autenticada para criar link de checkout
// POST /backend/v1/subscriptions/checkout-link
routerAdd('POST', '/backend/v1/subscriptions/checkout-link', (e) => {
  const reqInfo = e.requestInfo()
  const authRecord = reqInfo ? reqInfo.auth : null
  if (!authRecord) {
    return e.json(401, { error: 'Autenticação necessária.' })
  }

  const apiKey = $os.getenv('INFINITEPAY_API_KEY') || ''
  if (!apiKey || apiKey.trim() === '') {
    return e.json(200, {
      configured: false,
      message:
        'A chave de API InfinitePay (INFINITEPAY_API_KEY) ainda não foi configurada nas variáveis de ambiente.',
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
  // Frontend URL: usa SITE_URL do ambiente ou fallback conhecido
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

  console.log('[InfinitePay:checkoutLink] Criando link para order_nsu: ' + orderNsu)

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

  // A InfinitePay pode retornar o link nos campos url, checkout_url ou link
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
    // Prossegue se o link já foi criado, para não bloquear o lojista
  }

  return e.json(200, {
    configured: true,
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

  // Eventos esperados: created, paid, settled, canceled, refunded, payment_failed
  // Estruturas possíveis da InfinitePay: { event: "paid", data: { order_nsu, ... } } ou direto { event: "paid", order_nsu, ... }
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

  // Se não encontrar o registro por NSU ou slug, responde 200 para evitar retries desnecessários
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

  // Atualiza dados comuns no registro de pagamento
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

    // Aplica a lógica idêntica à aprovação manual do Admin:
    // Avança o vencimento da loja conforme os meses do plano,
    // define status como 'active' e desativa suspend_public e suspend_merchant
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

        // Calcula a nova data de vencimento
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

  const apiKey = $os.getenv('INFINITEPAY_API_KEY') || ''
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
  if (!apiKey || apiKey.trim() === '') {
    return e.json(200, {
      configured: false,
      paid: paymentRecord ? paymentRecord.getString('status') === 'paid' : false,
      status: paymentRecord ? paymentRecord.getString('status') : 'unknown',
      order_nsu: orderNsu,
    })
  }

  // Chama a API da InfinitePay para conferir o status remoto:
  // POST https://api.checkout.infinitepay.io/payment_check com body {handle, order_nsu, transaction_nsu, slug}
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

  // Se a InfinitePay confirmou que está pago e o registro local ainda não refletiu:
  if (isPaid && paymentRecord && paymentRecord.getString('status') !== 'paid') {
    paymentRecord.set('status', 'paid')
    paymentRecord.set('paid_at', new Date().toISOString())
    if (captureMethod) paymentRecord.set('capture_method', captureMethod)
    if (transNsu) paymentRecord.set('transaction_nsu', transNsu)
    try {
      e.app.save(paymentRecord)
    } catch (_) {}

    // Ativa a loja
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

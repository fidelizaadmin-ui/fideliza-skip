// pocketbase/hooks/paymentCredentials.pb.js
// CRUD server-side das credenciais de pagamento (aba "Credenciais & Pix" do admin).
//
// Contexto de arquitetura PocketBase JSVM:
// Funções e variáveis no escopo do módulo NÃO persistem de forma confiável entre
// VM pools. Toda função auxiliar deve ser inline dentro do callback da rota.
//
// Além disso, campos secretos (api_key, public_key, access_token, client_id, client_secret)
// são hidden na collection. Para garantir segurança total, as rotas gravam os valores
// no servidor via e.app, geram snapshot mascarado e NUNCA retornam o valor em texto limpo.

// 1. Criar credencial
// POST /backend/v1/payment-credentials
routerAdd('POST', '/backend/v1/payment-credentials', (e) => {
  const auth = e.auth
  if (!auth || auth.getString('role') !== 'admin') {
    return e.json(403, { message: 'Apenas administradores podem gerenciar credenciais.' })
  }

  function maskValue(raw) {
    const str = String(raw || '').trim()
    if (!str) return ''
    if (str.length <= 8) return '****' + str.slice(-2)
    return str.slice(0, 2) + '****...' + str.slice(-4)
  }

  const body = (e.requestInfo() && e.requestInfo().body) || {}
  const provider = String(body.provider || '').trim()
  const name = String(body.name || '').trim()

  if (!provider || !name) {
    return e.json(400, { message: 'Informe o provedor e o nome da credencial.' })
  }

  const apiKey = String(body.api_key || '').trim()
  const publicKey = String(body.public_key || '').trim()
  const accessToken = String(body.access_token || '').trim()
  const clientId = String(body.client_id || '').trim()
  const clientSecret = String(body.client_secret || '').trim()

  const isMercadoPago =
    provider.toLowerCase().indexOf('mercado') >= 0 || provider.toLowerCase().indexOf('pago') >= 0

  if (isMercadoPago) {
    if (!publicKey || !accessToken || !clientId || !clientSecret) {
      return e.json(400, {
        message:
          'Para o Mercado Pago, preencha todos os 4 campos: Public Key, Access Token, Client ID e Client Secret.',
      })
    }
  } else if (!apiKey && !publicKey && !accessToken && !clientId && !clientSecret) {
    return e.json(400, {
      message: 'Informe a API Key do provedor de pagamento.',
    })
  }

  let col = null
  try {
    col = e.app.findCollectionByNameOrId('payment_credentials')
  } catch (_) {
    return e.json(500, { message: 'Coleção payment_credentials não encontrada.' })
  }

  const rec = new Record(col)
  rec.set('provider', provider)
  rec.set('name', name)
  if (apiKey) rec.set('api_key', apiKey)
  if (publicKey) rec.set('public_key', publicKey)
  if (accessToken) rec.set('access_token', accessToken)
  if (clientId) rec.set('client_id', clientId)
  if (clientSecret) rec.set('client_secret', clientSecret)
  rec.set('is_active', !!body.is_active)

  // Snapshot mascarado
  const snapshot = {}
  const secretFields = ['api_key', 'public_key', 'access_token', 'client_id', 'client_secret']
  for (let i = 0; i < secretFields.length; i++) {
    const val = String(rec.getString(secretFields[i]) || '').trim()
    if (val) {
      snapshot[secretFields[i]] = maskValue(val)
    }
  }
  const primaryMasked =
    maskValue(rec.getString('api_key')) ||
    maskValue(rec.getString('access_token')) ||
    maskValue(rec.getString('public_key')) ||
    maskValue(rec.getString('client_id'))
  rec.set('api_key_masked', primaryMasked)
  rec.set('credentials_masked', snapshot)

  // Se ativado, desativa as outras credenciais ativas do mesmo provedor
  if (rec.getBool('is_active')) {
    try {
      const siblings = e.app.findRecordsByFilter(
        'payment_credentials',
        'is_active = true && provider = {:p}',
        '-updated',
        0,
        0,
        { p: provider },
      )
      for (let i = 0; i < siblings.length; i++) {
        siblings[i].set('is_active', false)
        e.app.save(siblings[i])
      }
    } catch (_) {}
  }

  try {
    e.app.save(rec)
  } catch (err) {
    console.error('[PaymentCredentials:create] ' + err.message)
    return e.json(500, { message: 'Não foi possível salvar a credencial: ' + err.message })
  }

  return e.json(200, {
    message: 'Credencial cadastrada com sucesso.',
    id: rec.id,
    provider: rec.getString('provider'),
    name: rec.getString('name'),
    api_key_masked: rec.getString('api_key_masked'),
    credentials_masked: rec.get('credentials_masked'),
    is_active: rec.getBool('is_active'),
  })
})

// 2. Atualizar credencial
// PATCH /backend/v1/payment-credentials/{id}
routerAdd('PATCH', '/backend/v1/payment-credentials/{id}', (e) => {
  const auth = e.auth
  if (!auth || auth.getString('role') !== 'admin') {
    return e.json(403, { message: 'Apenas administradores podem gerenciar credenciais.' })
  }

  function maskValue(raw) {
    const str = String(raw || '').trim()
    if (!str) return ''
    if (str.length <= 8) return '****' + str.slice(-2)
    return str.slice(0, 2) + '****...' + str.slice(-4)
  }

  const id = (e.request ? e.request.pathValue('id') : '') || ''
  let rec = null
  try {
    rec = e.app.findRecordById('payment_credentials', id)
  } catch (_) {
    return e.json(404, { message: 'Credencial não encontrada.' })
  }

  const body = (e.requestInfo() && e.requestInfo().body) || {}

  if (body.provider !== undefined) rec.set('provider', String(body.provider).trim())
  if (body.name !== undefined) rec.set('name', String(body.name).trim())
  if (body.is_active !== undefined) rec.set('is_active', !!body.is_active)

  const secretFields = ['api_key', 'public_key', 'access_token', 'client_id', 'client_secret']
  for (let i = 0; i < secretFields.length; i++) {
    const field = secretFields[i]
    if (body[field] !== undefined && String(body[field]).trim() !== '') {
      rec.set(field, String(body[field]).trim())
    }
  }

  // Snapshot mascarado atualizado
  const snapshot = {}
  for (let i = 0; i < secretFields.length; i++) {
    const val = String(rec.getString(secretFields[i]) || '').trim()
    if (val) {
      snapshot[secretFields[i]] = maskValue(val)
    }
  }
  const primaryMasked =
    maskValue(rec.getString('api_key')) ||
    maskValue(rec.getString('access_token')) ||
    maskValue(rec.getString('public_key')) ||
    maskValue(rec.getString('client_id'))
  rec.set('api_key_masked', primaryMasked)
  rec.set('credentials_masked', snapshot)

  if (rec.getBool('is_active')) {
    try {
      const siblings = e.app.findRecordsByFilter(
        'payment_credentials',
        'is_active = true && provider = {:p} && id != {:id}',
        '-updated',
        0,
        0,
        { p: rec.getString('provider'), id: rec.id },
      )
      for (let i = 0; i < siblings.length; i++) {
        siblings[i].set('is_active', false)
        e.app.save(siblings[i])
      }
    } catch (_) {}
  }

  try {
    e.app.save(rec)
  } catch (err) {
    console.error('[PaymentCredentials:update] ' + err.message)
    return e.json(500, { message: 'Não foi possível atualizar a credencial: ' + err.message })
  }

  return e.json(200, {
    message: 'Credencial atualizada com sucesso.',
    id: rec.id,
    provider: rec.getString('provider'),
    name: rec.getString('name'),
    api_key_masked: rec.getString('api_key_masked'),
    credentials_masked: rec.get('credentials_masked'),
    is_active: rec.getBool('is_active'),
  })
})

// 3. Listar credenciais (somente leitura — sem segredos, já mascarados)
// GET /backend/v1/payment-credentials
routerAdd('GET', '/backend/v1/payment-credentials', (e) => {
  const auth = e.auth
  if (!auth || auth.getString('role') !== 'admin') {
    return e.json(403, { message: 'Apenas administradores podem listar credenciais.' })
  }

  let rows = []
  try {
    rows = e.app.findRecordsByFilter('payment_credentials', '1=1', '-created', 0, 0)
  } catch (_) {
    rows = []
  }

  const items = rows.map((r) => {
    let masked = {}
    try {
      const val = r.get('credentials_masked')
      if (val && typeof val === 'object') {
        masked = val
      } else if (typeof val === 'string' && val.trim()) {
        masked = JSON.parse(val)
      }
    } catch (_) {
      masked = {}
    }
    let extra = {}
    try {
      const extraVal = r.get('extra_config')
      if (extraVal && typeof extraVal === 'object') {
        extra = extraVal
      } else if (typeof extraVal === 'string' && extraVal.trim()) {
        extra = JSON.parse(extraVal)
      }
    } catch (_) {
      extra = {}
    }
    return {
      id: r.id,
      provider: r.getString('provider'),
      name: r.getString('name'),
      api_key_masked: r.getString('api_key_masked'),
      credentials_masked: masked,
      extra_config: extra,
      is_active: r.getBool('is_active'),
      created: r.getString('created'),
      updated: r.getString('updated'),
    }
  })

  return e.json(200, { items: items })
})

// 4. Excluir credencial
// DELETE /backend/v1/payment-credentials/{id}
routerAdd('DELETE', '/backend/v1/payment-credentials/{id}', (e) => {
  const auth = e.auth
  if (!auth || auth.getString('role') !== 'admin') {
    return e.json(403, { message: 'Apenas administradores podem gerenciar credenciais.' })
  }

  const id = (e.request ? e.request.pathValue('id') : '') || ''
  try {
    const rec = e.app.findRecordById('payment_credentials', id)
    e.app.delete(rec)
  } catch (_) {
    return e.json(404, { message: 'Credencial não encontrada.' })
  }

  return e.json(200, { message: 'Credencial excluída com sucesso.' })
})

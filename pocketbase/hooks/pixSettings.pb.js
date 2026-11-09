// pocketbase/hooks/pixSettings.pb.js
// Rotas server-side seguras para CRUD de chaves Pix (aba "Credenciais & Pix" do painel de administração).
//
// Contexto de arquitetura PocketBase JSVM:
// Variáveis e funções no escopo do módulo não persistem confiavelmente entre VM pools.
// Mantenha funções auxiliares inline em cada handler.
//
// O campo "pix_key" é hidden na collection pix_settings por segurança.
// A gravação ocorre pelo servidor via e.app, gerando o snapshot mascarado pix_key_masked.

// 1. Criar chave Pix (Exclusivo Admin)
// POST /backend/v1/pix-settings
routerAdd('POST', '/backend/v1/pix-settings', (e) => {
  const auth = e.auth
  if (!auth || auth.getString('role') !== 'admin') {
    return e.json(403, { message: 'Apenas administradores podem gerenciar chaves Pix.' })
  }

  function maskPixKey(raw, keyType) {
    const str = String(raw || '').trim()
    if (!str) return '****'
    if (keyType === 'email') {
      const parts = str.split('@')
      if (parts.length === 2) {
        const userPart = parts[0]
        const maskedUser =
          userPart.length <= 2
            ? userPart.charAt(0) + '***'
            : userPart.slice(0, 2) + '***' + userPart.slice(-1)
        return maskedUser + '@' + parts[1]
      }
      return str.slice(0, 2) + '***' + str.slice(-2)
    }
    if (keyType === 'telefone') {
      const digits = str.replace(/\D/g, '')
      return digits.length >= 4 ? '(**) *****-' + digits.slice(-4) : '****'
    }
    if (keyType === 'cpf') {
      const digits = str.replace(/\D/g, '')
      return digits.length === 11
        ? '***.' + digits.slice(3, 6) + '.***-' + digits.slice(-2)
        : '***.***.***-**'
    }
    if (keyType === 'cnpj') {
      const digits = str.replace(/\D/g, '')
      return digits.length === 14
        ? digits.slice(0, 2) + '.***.***/****-' + digits.slice(-2)
        : '**.***.***/****-**'
    }
    return str.length > 8 ? str.slice(0, 4) + '...' + str.slice(-4) : '****' + str.slice(-2)
  }

  const body = (e.requestInfo() && e.requestInfo().body) || {}
  const pixKey = String(body.pix_key || '').trim()
  const keyType = String(body.key_type || 'aleatoria').trim()
  const receiverName = String(body.receiver_name || '')
    .trim()
    .slice(0, 25)
  const receiverCity = String(body.receiver_city || '')
    .trim()
    .slice(0, 15)
  const isActive = body.is_active !== undefined ? !!body.is_active : true

  if (!pixKey) {
    return e.json(400, { message: 'A chave Pix de recebimento é obrigatória.' })
  }
  if (!receiverName) {
    return e.json(400, { message: 'O nome do recebedor é obrigatório (máximo 25 caracteres).' })
  }
  if (!receiverCity) {
    return e.json(400, { message: 'A cidade do recebedor é obrigatória (máximo 15 caracteres).' })
  }

  const allowedTypes = ['cpf', 'cnpj', 'telefone', 'email', 'aleatoria']
  const validKeyType = allowedTypes.indexOf(keyType) >= 0 ? keyType : 'aleatoria'

  let col = null
  try {
    col = e.app.findCollectionByNameOrId('pix_settings')
  } catch (_) {
    return e.json(500, { message: 'Coleção pix_settings não encontrada.' })
  }

  const rec = new Record(col)
  rec.set('pix_key', pixKey)
  rec.set('key_type', validKeyType)
  rec.set('receiver_name', receiverName)
  rec.set('receiver_city', receiverCity)
  rec.set('is_active', isActive)
  rec.set('pix_key_masked', maskPixKey(pixKey, validKeyType))

  // Se ativada, desativa as outras chaves ativas para manter exclusividade
  if (isActive) {
    try {
      const activeRows = e.app.findRecordsByFilter('pix_settings', 'is_active = true')
      for (let i = 0; i < activeRows.length; i++) {
        activeRows[i].set('is_active', false)
        e.app.save(activeRows[i])
      }
    } catch (_) {}
  }

  try {
    e.app.save(rec)
  } catch (err) {
    console.error('[PixSettings:create] ' + err.message)
    return e.json(500, { message: 'Não foi possível salvar a chave Pix: ' + err.message })
  }

  return e.json(200, {
    message: 'Chave Pix cadastrada com sucesso.',
    id: rec.id,
    key_type: rec.getString('key_type'),
    receiver_name: rec.getString('receiver_name'),
    receiver_city: rec.getString('receiver_city'),
    pix_key_masked: rec.getString('pix_key_masked'),
    is_active: rec.getBool('is_active'),
    created: rec.getString('created'),
    updated: rec.getString('updated'),
  })
})

// 2. Atualizar chave Pix (Exclusivo Admin)
// PATCH /backend/v1/pix-settings/{id}
routerAdd('PATCH', '/backend/v1/pix-settings/{id}', (e) => {
  const auth = e.auth
  if (!auth || auth.getString('role') !== 'admin') {
    return e.json(403, { message: 'Apenas administradores podem gerenciar chaves Pix.' })
  }

  function maskPixKey(raw, keyType) {
    const str = String(raw || '').trim()
    if (!str) return '****'
    if (keyType === 'email') {
      const parts = str.split('@')
      if (parts.length === 2) {
        const userPart = parts[0]
        const maskedUser =
          userPart.length <= 2
            ? userPart.charAt(0) + '***'
            : userPart.slice(0, 2) + '***' + userPart.slice(-1)
        return maskedUser + '@' + parts[1]
      }
      return str.slice(0, 2) + '***' + str.slice(-2)
    }
    if (keyType === 'telefone') {
      const digits = str.replace(/\D/g, '')
      return digits.length >= 4 ? '(**) *****-' + digits.slice(-4) : '****'
    }
    if (keyType === 'cpf') {
      const digits = str.replace(/\D/g, '')
      return digits.length === 11
        ? '***.' + digits.slice(3, 6) + '.***-' + digits.slice(-2)
        : '***.***.***-**'
    }
    if (keyType === 'cnpj') {
      const digits = str.replace(/\D/g, '')
      return digits.length === 14
        ? digits.slice(0, 2) + '.***.***/****-' + digits.slice(-2)
        : '**.***.***/****-**'
    }
    return str.length > 8 ? str.slice(0, 4) + '...' + str.slice(-4) : '****' + str.slice(-2)
  }

  const id = (e.request ? e.request.pathValue('id') : '') || ''
  let rec = null
  try {
    rec = e.app.findRecordById('pix_settings', id)
  } catch (_) {
    return e.json(404, { message: 'Configuração Pix não encontrada.' })
  }

  const body = (e.requestInfo() && e.requestInfo().body) || {}

  if (body.key_type !== undefined) {
    const allowedTypes = ['cpf', 'cnpj', 'telefone', 'email', 'aleatoria']
    const kt = String(body.key_type).trim()
    if (allowedTypes.indexOf(kt) >= 0) {
      rec.set('key_type', kt)
    }
  }

  if (body.receiver_name !== undefined) {
    const rn = String(body.receiver_name).trim().slice(0, 25)
    if (rn) rec.set('receiver_name', rn)
  }

  if (body.receiver_city !== undefined) {
    const rc = String(body.receiver_city).trim().slice(0, 15)
    if (rc) rec.set('receiver_city', rc)
  }

  if (body.is_active !== undefined) {
    rec.set('is_active', !!body.is_active)
  }

  // Se informou nova pix_key, atualiza a chave e o mascarado
  const currentKeyType = rec.getString('key_type') || 'aleatoria'
  if (body.pix_key !== undefined && String(body.pix_key).trim() !== '') {
    const newKey = String(body.pix_key).trim()
    rec.set('pix_key', newKey)
    rec.set('pix_key_masked', maskPixKey(newKey, currentKeyType))
  } else if (body.key_type !== undefined && !rec.getString('pix_key_masked')) {
    // Se mudou o tipo mas não mudou a chave, recalcula máscara da chave existente se houver
    const existingRaw = rec.getString('pix_key')
    if (existingRaw) {
      rec.set('pix_key_masked', maskPixKey(existingRaw, currentKeyType))
    }
  }

  // Se ativada, desativa as outras chaves ativas
  if (rec.getBool('is_active')) {
    try {
      const activeRows = e.app.findRecordsByFilter(
        'pix_settings',
        `is_active = true && id != "${rec.id}"`,
      )
      for (let i = 0; i < activeRows.length; i++) {
        activeRows[i].set('is_active', false)
        e.app.save(activeRows[i])
      }
    } catch (_) {}
  }

  try {
    e.app.save(rec)
  } catch (err) {
    console.error('[PixSettings:update] ' + err.message)
    return e.json(500, { message: 'Não foi possível atualizar a chave Pix: ' + err.message })
  }

  return e.json(200, {
    message: 'Chave Pix atualizada com sucesso.',
    id: rec.id,
    key_type: rec.getString('key_type'),
    receiver_name: rec.getString('receiver_name'),
    receiver_city: rec.getString('receiver_city'),
    pix_key_masked: rec.getString('pix_key_masked'),
    is_active: rec.getBool('is_active'),
    created: rec.getString('created'),
    updated: rec.getString('updated'),
  })
})

// 3. Listar chaves Pix (Exclusivo Admin, sem vazar chaves brutas)
// GET /backend/v1/pix-settings
routerAdd('GET', '/backend/v1/pix-settings', (e) => {
  const auth = e.auth
  if (!auth || auth.getString('role') !== 'admin') {
    return e.json(403, { message: 'Apenas administradores podem listar chaves Pix.' })
  }

  let rows = []
  try {
    rows = e.app.findRecordsByFilter('pix_settings', '1=1', '-created', 0, 0)
  } catch (_) {
    rows = []
  }

  const items = rows.map((r) => ({
    id: r.id,
    key_type: r.getString('key_type'),
    receiver_name: r.getString('receiver_name'),
    receiver_city: r.getString('receiver_city'),
    pix_key_masked: r.getString('pix_key_masked') || '****',
    is_active: r.getBool('is_active'),
    created: r.getString('created'),
    updated: r.getString('updated'),
  }))

  return e.json(200, { items: items })
})

// 4. Excluir chave Pix (Exclusivo Admin)
// DELETE /backend/v1/pix-settings/{id}
routerAdd('DELETE', '/backend/v1/pix-settings/{id}', (e) => {
  const auth = e.auth
  if (!auth || auth.getString('role') !== 'admin') {
    return e.json(403, { message: 'Apenas administradores podem gerenciar chaves Pix.' })
  }

  const id = (e.request ? e.request.pathValue('id') : '') || ''
  try {
    const rec = e.app.findRecordById('pix_settings', id)
    e.app.delete(rec)
  } catch (_) {
    return e.json(404, { message: 'Configuração Pix não encontrada.' })
  }

  return e.json(200, { message: 'Chave Pix excluída com sucesso.' })
})

// pocketbase/hooks/appointments.pb.js
// Agendamento de serviços: disponibilidade pública, reserva pelo cliente,
// cobrança de sinal (% do serviço), chave Pix do lojista e confirmação de pagamento.
//
// NOTA: em pb_hooks, funções de topo de arquivo NÃO são acessíveis dentro dos callbacks.
// Por isso os auxiliares ficam inline em cada rota.

// 1. Disponibilidade pública: horários já ocupados de uma loja em um intervalo de datas.
// Não expõe dados pessoais — apenas data e faixa de horário.
// GET /backend/v1/appointments/availability?store_id=...&from=YYYY-MM-DD&to=YYYY-MM-DD
routerAdd('GET', '/backend/v1/appointments/availability', (e) => {
  const q = e.requestInfo().query || {}
  const storeId = (q.store_id || '').trim()
  const from = (q.from || '').trim()
  const to = (q.to || '').trim()

  if (!storeId || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return e.json(400, { message: 'Parâmetros inválidos.' })
  }
  if (to < from) {
    return e.json(400, { message: 'Intervalo de datas inválido.' })
  }

  let store = null
  try {
    store = e.app.findRecordById('stores', storeId)
  } catch (_) {
    return e.json(404, { message: 'Loja não encontrada.' })
  }
  const storeOpen =
    store.getString('approval_status') === 'approved' &&
    !store.getBool('suspend_public') &&
    store.getString('subscription_status') !== 'cancelled' &&
    store.getBool('appointments_enabled')
  if (!storeOpen) {
    return e.json(404, { message: 'Loja não disponível para agendamentos.' })
  }

  let rows = []
  try {
    rows = e.app.findRecordsByFilter(
      'appointments',
      "store = {:s} && date >= {:d1} && date <= {:d2} && (status = 'pending' || status = 'confirmed')",
      'date',
      500,
      0,
      { s: storeId, d1: from, d2: to },
    )
  } catch (_) {
    rows = []
  }

  const booked = rows.map((r) => ({
    date: r.getString('date').substring(0, 10),
    start_time: r.getString('start_time'),
    end_time: r.getString('end_time'),
  }))
  return e.json(200, { booked: booked })
})

// 2. Reserva do cliente logado. Valida loja aberta, serviço ativo, período de atendimento,
// data/horário futuros e ausência de conflito com outro agendamento ativo.
// Se a loja exigir sinal (appointment_deposit_enabled e % > 0), calcula o valor do sinal,
// define deposit_status = 'pending_payment' e gera o payload Pix copia e cola EMV oficial.
// POST /backend/v1/appointments/book { store_id, service_id, date, start_time, notes }
routerAdd('POST', '/backend/v1/appointments/book', (e) => {
  const authUser = e.auth
  if (!authUser) {
    return e.json(401, { message: 'Faça login para agendar um serviço.' })
  }

  const body = e.requestInfo().body || {}
  const storeId = (body.store_id || '').trim()
  const serviceId = (body.service_id || '').trim()
  const date = (body.date || '').trim()
  const startTime = (body.start_time || '').trim()
  const notes = (body.notes || '').trim().substring(0, 500)

  if (!storeId || !serviceId || !date || !startTime) {
    return e.json(400, { message: 'Selecione o serviço, a data e o horário.' })
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) {
    return e.json(400, { message: 'Data ou horário inválidos.' })
  }

  let store = null
  try {
    store = e.app.findRecordById('stores', storeId)
  } catch (_) {
    return e.json(404, { message: 'Loja não encontrada.' })
  }
  const storeOpen =
    store.getString('approval_status') === 'approved' &&
    !store.getBool('suspend_public') &&
    store.getString('subscription_status') !== 'cancelled' &&
    store.getBool('appointments_enabled')
  if (!storeOpen) {
    return e.json(400, { message: 'Esta loja não está aceitando agendamentos.' })
  }

  let service = null
  try {
    service = e.app.findRecordById('service_offerings', serviceId)
  } catch (_) {
    return e.json(404, { message: 'Serviço não encontrado.' })
  }
  if (service.getString('store') !== storeId || !service.getBool('active')) {
    return e.json(400, { message: 'Este serviço não está disponível.' })
  }

  const duration = service.getInt('duration_minutes')
  const startParts = startTime.split(':')
  const startMin = Number(startParts[0]) * 60 + Number(startParts[1])
  const endMin = startMin + duration
  if (!duration || endMin > 1440) {
    return e.json(400, { message: 'Horário fora do período de atendimento.' })
  }
  const endTime =
    String(Math.floor(endMin / 60)).padStart(2, '0') + ':' + String(endMin % 60).padStart(2, '0')

  // Não agendar no passado (fuso de Brasília)
  const slotDate = new Date(date + 'T' + startTime + ':00-03:00')
  if (slotDate.getTime() < Date.now()) {
    return e.json(400, { message: 'Este horário já passou. Escolha outro horário.' })
  }

  // Período de atendimento que cobre o agendamento inteiro
  const weekday = new Date(date + 'T12:00:00Z').getUTCDay()
  let hours = []
  try {
    hours = e.app.findRecordsByFilter(
      'business_hours',
      'store = {:s} && weekday = {:w} && active = true',
      '',
      50,
      0,
      { s: storeId, w: weekday },
    )
  } catch (_) {
    hours = []
  }
  const inHours = hours.some((h) => {
    const hs = h.getString('start_time').split(':')
    const he = h.getString('end_time').split(':')
    const hStart = Number(hs[0]) * 60 + Number(hs[1])
    const hEnd = Number(he[0]) * 60 + Number(he[1])
    return startMin >= hStart && endMin <= hEnd
  })
  if (!inHours) {
    return e.json(400, { message: 'Horário fora do período de atendimento da loja.' })
  }

  // Conflito com agendamentos ativos no mesmo dia
  let sameDay = []
  try {
    sameDay = e.app.findRecordsByFilter(
      'appointments',
      "store = {:s} && date = {:d} && (status = 'pending' || status = 'confirmed')",
      '',
      500,
      0,
      { s: storeId, d: date },
    )
  } catch (_) {
    sameDay = []
  }
  const conflict = sameDay.some((a) => {
    const as = a.getString('start_time').split(':')
    const ae = a.getString('end_time').split(':')
    const aStart = Number(as[0]) * 60 + Number(as[1])
    const aEnd = Number(ae[0]) * 60 + Number(ae[1])
    return startMin < aEnd && endMin > aStart
  })
  if (conflict) {
    return e.json(409, { message: 'Este horário acabou de ser ocupado. Escolha outro horário.' })
  }

  const servicePrice = service.getFloat('price') || 0
  const depositEnabled = store.getBool('appointment_deposit_enabled')
  const depositPercent = store.getInt('appointment_deposit_percent') || 0
  const pixKey = store.getString('appointment_pix_key') || ''

  const depositRequired = depositEnabled && depositPercent > 0 && servicePrice > 0 && pixKey !== ''
  let depositAmount = 0
  if (depositRequired) {
    depositAmount = Math.round(((servicePrice * depositPercent) / 100) * 100) / 100
  }

  const collection = e.app.findCollectionByNameOrId('appointments')
  const record = new Record(collection)
  record.set('store', storeId)
  record.set('customer', authUser.id)
  record.set('service', serviceId)
  record.set('service_name', service.getString('name'))
  record.set('customer_name', authUser.getString('name'))
  record.set('customer_phone', authUser.getString('phone'))
  record.set('date', date)
  record.set('start_time', startTime)
  record.set('end_time', endTime)
  record.set('status', 'pending')
  record.set('notes', notes)
  record.set('price', servicePrice)

  record.set('deposit_required', depositRequired)
  record.set('deposit_percent', depositRequired ? depositPercent : 0)
  record.set('deposit_amount', depositAmount)
  record.set('deposit_status', depositRequired ? 'pending_payment' : 'not_required')

  e.app.save(record)

  // Se requer sinal, gera o payload Pix copia e cola EMV
  let pixPayloadData = null
  if (depositRequired) {
    function emvField(id, value) {
      if (value === undefined || value === null) return ''
      const s = String(value)
      const len = String(s.length).padStart(2, '0')
      return String(id).padStart(2, '0') + len + s
    }

    function removeAccents(str) {
      if (!str) return ''
      const map = {
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
      return String(str).replace(/[^\u0000-\u007E]/g, (c) => map[c] || '')
    }

    function cleanPixKey(key, type) {
      if (!key) return ''
      const k = String(key).trim()
      if (type === 'cpf' || type === 'cnpj' || type === 'telefone') {
        const digits = k.replace(/\D/g, '')
        if (
          type === 'telefone' &&
          digits &&
          !digits.startsWith('55') &&
          (digits.length === 10 || digits.length === 11)
        ) {
          return '+55' + digits
        }
        if (type === 'telefone' && digits.startsWith('55')) {
          return '+' + digits
        }
        return digits
      }
      return k
    }

    function crc16(str) {
      let crc = 0xffff
      const polynomial = 0x1021
      for (let i = 0; i < str.length; i++) {
        const b = str.charCodeAt(i)
        for (let j = 0; j < 8; j++) {
          const bit = ((b >> (7 - j)) & 1) === 1
          const c15 = ((crc >> 15) & 1) === 1
          crc <<= 1
          if (c15 ^ bit) crc ^= polynomial
        }
      }
      crc &= 0xffff
      return crc.toString(16).toUpperCase().padStart(4, '0')
    }

    const keyType = store.getString('appointment_pix_key_type') || 'aleatoria'
    const formattedKey = cleanPixKey(pixKey, keyType)
    let receiverName = removeAccents(
      store.getString('appointment_pix_receiver_name') || store.getString('name') || 'Lojista',
    )
      .replace(/[^A-Za-z0-9 ]/g, '')
      .substring(0, 25)
      .trim()
    if (!receiverName) receiverName = 'Lojista'

    let receiverCity = removeAccents(
      store.getString('appointment_pix_receiver_city') || store.getString('city') || 'SAO PAULO',
    )
      .replace(/[^A-Za-z0-9 ]/g, '')
      .substring(0, 15)
      .trim()
    if (!receiverCity) receiverCity = 'SAO PAULO'

    const txid = ('AG' + record.id).substring(0, 25)
    const amountStr = depositAmount.toFixed(2)

    const maiPayload = emvField('00', 'br.gov.bcb.pix') + emvField('01', formattedKey)
    const addDataField = emvField('05', txid)

    let payloadWithoutCrc =
      emvField('00', '01') +
      emvField('01', '12') +
      emvField('26', maiPayload) +
      emvField('52', '0000') +
      emvField('53', '986') +
      emvField('54', amountStr) +
      emvField('58', 'BR') +
      emvField('59', receiverName) +
      emvField('60', receiverCity) +
      emvField('62', addDataField) +
      '6304'

    const crc = crc16(payloadWithoutCrc)
    const finalPayload = payloadWithoutCrc + crc

    pixPayloadData = {
      pix_payload: finalPayload,
      receiver_name: receiverName,
      receiver_city: receiverCity,
      txid: txid,
      amount: depositAmount,
      deposit_percent: depositPercent,
    }
  }

  return e.json(200, {
    message: depositRequired
      ? 'Agendamento pré-reservado! Efetue o pagamento do sinal para a loja confirmar.'
      : 'Agendamento solicitado! Aguarde a confirmação da loja.',
    appointment: {
      id: record.id,
      date: date,
      start_time: startTime,
      end_time: endTime,
      status: 'pending',
      deposit_required: depositRequired,
      deposit_percent: depositPercent,
      deposit_amount: depositAmount,
      deposit_status: depositRequired ? 'pending_payment' : 'not_required',
    },
    pix: pixPayloadData,
  })
})

// 3. Cliente marca que pagou o sinal.
// Transiciona deposit_status de 'pending_payment' para 'paid_pending_confirmation'.
// POST /backend/v1/appointments/mark-deposit-paid { appointment_id }
routerAdd('POST', '/backend/v1/appointments/mark-deposit-paid', (e) => {
  const authUser = e.auth
  if (!authUser) {
    return e.json(401, { message: 'Faça login para continuar.' })
  }

  const body = e.requestInfo().body || {}
  const appointmentId = (body.appointment_id || '').trim()
  if (!appointmentId) {
    return e.json(400, { message: 'ID do agendamento não informado.' })
  }

  let appt = null
  try {
    appt = e.app.findRecordById('appointments', appointmentId)
  } catch (_) {
    return e.json(404, { message: 'Agendamento não encontrado.' })
  }

  if (appt.getString('customer') !== authUser.id) {
    return e.json(403, { message: 'Você só pode alterar seus próprios agendamentos.' })
  }

  if (!appt.getBool('deposit_required')) {
    return e.json(400, { message: 'Este agendamento não requer pagamento de sinal.' })
  }

  const currentStatus = appt.getString('deposit_status')
  if (currentStatus === 'confirmed') {
    return e.json(400, { message: 'O sinal deste agendamento já foi confirmado pelo lojista.' })
  }

  appt.set('deposit_status', 'paid_pending_confirmation')
  appt.set('deposit_paid_at', new Date().toISOString())
  e.app.save(appt)

  // Notificação in-app para o lojista
  try {
    let store = e.app.findRecordById('stores', appt.getString('store'))
    const ownerId = store.getString('owner_id')
    if (ownerId) {
      const notifCollection = e.app.findCollectionByNameOrId('notifications')
      const notif = new Record(notifCollection)
      notif.set('user', ownerId)
      notif.set('store', store.id)
      notif.set('type', 'system')
      notif.set('title', 'Sinal de agendamento pago 💳')
      notif.set(
        'message',
        'O cliente ' +
          (appt.getString('customer_name') || 'Cliente') +
          ' informou o pagamento do sinal de R$ ' +
          (appt.getFloat('deposit_amount') || 0).toFixed(2) +
          ' para o serviço ' +
          (appt.getString('service_name') || 'Serviço') +
          '. Confira em sua conta e confirme o agendamento.',
      )
      notif.set('is_read', false)
      notif.set('data', { appointment_id: appt.id })
      e.app.save(notif)
    }
  } catch (err) {
    console.warn('[Appointments] Erro ao notificar lojista sobre sinal:', err.message)
  }

  return e.json(200, {
    message: 'Pagamento informado com sucesso! O lojista irá conferir e confirmar seu horário.',
    appointment: {
      id: appt.id,
      deposit_status: 'paid_pending_confirmation',
    },
  })
})

// 4. Lojista consulta / atualiza configurações de sinal e chave Pix da sua loja.
// GET /backend/v1/appointments/deposit-settings?store_id=...
// Retorna as configurações com a chave mascarada (nunca completa).
routerAdd('GET', '/backend/v1/appointments/deposit-settings', (e) => {
  const authUser = e.auth
  if (!authUser) {
    return e.json(401, { message: 'Autenticação necessária.' })
  }

  const q = e.requestInfo().query || {}
  const storeId = (q.store_id || '').trim()
  if (!storeId) {
    return e.json(400, { message: 'ID da loja não informado.' })
  }

  let store = null
  try {
    store = e.app.findRecordById('stores', storeId)
  } catch (_) {
    return e.json(404, { message: 'Loja não encontrada.' })
  }

  const isAdmin = authUser.getString('role') === 'admin'
  const isOwner = store.getString('owner_id') === authUser.id
  if (!isAdmin && !isOwner) {
    return e.json(403, { message: 'Sem permissão para ver as configurações desta loja.' })
  }

  return e.json(200, {
    deposit_enabled: store.getBool('appointment_deposit_enabled'),
    deposit_percent: store.getInt('appointment_deposit_percent') || 0,
    key_type: store.getString('appointment_pix_key_type') || 'aleatoria',
    pix_key_masked: store.getString('appointment_pix_key_masked') || '',
    receiver_name: store.getString('appointment_pix_receiver_name') || '',
    receiver_city: store.getString('appointment_pix_receiver_city') || '',
    has_pix_key: !!store.getString('appointment_pix_key'),
  })
})

// POST /backend/v1/appointments/deposit-settings
// Salva a chave Pix (mascara no backend e nunca reexibe a completa) e a porcentagem.
routerAdd('POST', '/backend/v1/appointments/deposit-settings', (e) => {
  const authUser = e.auth
  if (!authUser) {
    return e.json(401, { message: 'Autenticação necessária.' })
  }

  const body = e.requestInfo().body || {}
  const storeId = (body.store_id || '').trim()
  const depositEnabled = !!body.deposit_enabled
  let depositPercent = Number(body.deposit_percent) || 0
  const keyType = (body.key_type || 'aleatoria').trim()
  const newPixKey = (body.pix_key || '').trim()
  const receiverName = (body.receiver_name || '').trim().substring(0, 25)
  const receiverCity = (body.receiver_city || '').trim().substring(0, 15)

  if (!storeId) {
    return e.json(400, { message: 'ID da loja não informado.' })
  }
  if (depositPercent < 0) depositPercent = 0
  if (depositPercent > 100) depositPercent = 100

  let store = null
  try {
    store = e.app.findRecordById('stores', storeId)
  } catch (_) {
    return e.json(404, { message: 'Loja não encontrada.' })
  }

  const isAdmin = authUser.getString('role') === 'admin'
  const isOwner = store.getString('owner_id') === authUser.id
  if (!isAdmin && !isOwner) {
    return e.json(403, { message: 'Sem permissão para alterar as configurações desta loja.' })
  }

  function maskKey(key, type) {
    if (!key) return ''
    const clean = String(key).trim()
    if (type === 'email') {
      const parts = clean.split('@')
      if (parts.length === 2) {
        const user = parts[0]
        const domain = parts[1]
        const visible = user.substring(0, Math.min(2, user.length))
        return visible + '***@' + domain
      }
    }
    if (type === 'cpf') {
      const digits = clean.replace(/\D/g, '')
      if (digits.length === 11) {
        return '***.' + digits.substring(3, 6) + '.' + digits.substring(6, 9) + '-**'
      }
    }
    if (type === 'cnpj') {
      const digits = clean.replace(/\D/g, '')
      if (digits.length === 14) {
        return digits.substring(0, 2) + '.***.***/' + digits.substring(8, 12) + '-**'
      }
    }
    if (type === 'telefone') {
      const digits = clean.replace(/\D/g, '')
      if (digits.length >= 10) {
        return '(' + digits.substring(0, 2) + ') *****-' + digits.substring(digits.length - 4)
      }
    }
    if (clean.length > 8) {
      return clean.substring(0, 4) + '...' + clean.substring(clean.length - 4)
    }
    return '********'
  }

  store.set('appointment_deposit_enabled', depositEnabled)
  store.set('appointment_deposit_percent', depositPercent)
  if (keyType) {
    store.set('appointment_pix_key_type', keyType)
  }
  if (receiverName) {
    store.set('appointment_pix_receiver_name', receiverName)
  }
  if (receiverCity) {
    store.set('appointment_pix_receiver_city', receiverCity)
  }

  if (newPixKey) {
    store.set('appointment_pix_key', newPixKey)
    store.set('appointment_pix_key_masked', maskKey(newPixKey, keyType))
  }

  // Validação ao ativar
  if (depositEnabled) {
    const hasKey = !!store.getString('appointment_pix_key')
    if (!hasKey) {
      return e.json(400, {
        message: 'Para ativar a cobrança de sinal, cadastre uma chave Pix de recebimento válida.',
      })
    }
    if (depositPercent <= 0) {
      return e.json(400, {
        message: 'Defina uma porcentagem maior que 0% para a cobrança do sinal.',
      })
    }
  }

  e.app.save(store)

  return e.json(200, {
    message: 'Configurações de sinal salvas com sucesso!',
    deposit_enabled: store.getBool('appointment_deposit_enabled'),
    deposit_percent: store.getInt('appointment_deposit_percent') || 0,
    key_type: store.getString('appointment_pix_key_type') || 'aleatoria',
    pix_key_masked: store.getString('appointment_pix_key_masked') || '',
    receiver_name: store.getString('appointment_pix_receiver_name') || '',
    receiver_city: store.getString('appointment_pix_receiver_city') || '',
    has_pix_key: !!store.getString('appointment_pix_key'),
  })
})

// 5. Mudança de status do agendamento.
// - Lojista dono (sem suspensão do perfil) ou admin: confirmar, concluir ou cancelar.
//   Ao confirmar, se houver sinal, marca deposit_status = 'confirmed' e deposit_confirmed_at.
// - Cliente dono: apenas cancelar o próprio agendamento pendente/confirmado.
// POST /backend/v1/appointments/update-status { appointment_id, status, cancel_reason }
routerAdd('POST', '/backend/v1/appointments/update-status', (e) => {
  const appUrl = 'https://fideliza-programa-de-fidelidade-4940d.goskip.app'
  const authUser = e.auth
  if (!authUser) {
    return e.json(401, { message: 'Autenticação necessária.' })
  }

  const body = e.requestInfo().body || {}
  const appointmentId = (body.appointment_id || '').trim()
  const newStatus = (body.status || '').trim()
  const cancelReason = (body.cancel_reason || '').trim().substring(0, 300)

  if (!appointmentId || !['confirmed', 'completed', 'cancelled'].includes(newStatus)) {
    return e.json(400, { message: 'Dados inválidos.' })
  }

  let appt = null
  try {
    appt = e.app.findRecordById('appointments', appointmentId)
  } catch (_) {
    return e.json(404, { message: 'Agendamento não encontrado.' })
  }

  let store = null
  try {
    store = e.app.findRecordById('stores', appt.getString('store'))
  } catch (_) {
    return e.json(404, { message: 'Loja não encontrada.' })
  }

  const isAdmin = authUser.getString('role') === 'admin'
  const isCustomer = appt.getString('customer') === authUser.id
  const isOwner = store.getString('owner_id') === authUser.id
  if (!isAdmin && !isCustomer && !isOwner) {
    return e.json(403, { message: 'Sem permissão para alterar este agendamento.' })
  }
  if (!isAdmin && isOwner && store.getBool('suspend_merchant')) {
    return e.json(403, {
      message: 'Seu perfil de lojista está suspenso. Não é possível administrar agendamentos.',
    })
  }

  const current = appt.getString('status')
  const isMerchantSide = isAdmin || isOwner

  if (!isMerchantSide) {
    // Cliente só pode cancelar o próprio agendamento ativo
    if (newStatus !== 'cancelled') {
      return e.json(403, { message: 'Clientes só podem cancelar agendamentos.' })
    }
  }

  const allowed =
    (newStatus === 'confirmed' && current === 'pending') ||
    (newStatus === 'completed' && (current === 'pending' || current === 'confirmed')) ||
    (newStatus === 'cancelled' && (current === 'pending' || current === 'confirmed'))
  if (!allowed) {
    return e.json(400, { message: 'Essa mudança de status não é permitida.' })
  }

  appt.set('status', newStatus)
  if (newStatus === 'cancelled' && cancelReason) {
    appt.set('cancel_reason', cancelReason)
  }

  // Se o lojista está confirmando o agendamento e havia sinal requerido, marca o sinal como confirmado
  if (isMerchantSide && newStatus === 'confirmed' && appt.getBool('deposit_required')) {
    appt.set('deposit_status', 'confirmed')
    appt.set('deposit_confirmed_at', new Date().toISOString())
  }

  e.app.save(appt)

  const apptOut = {
    id: appt.id,
    status: newStatus,
    deposit_status: appt.getString('deposit_status'),
    date: appt.getString('date').substring(0, 10),
    start_time: appt.getString('start_time'),
    end_time: appt.getString('end_time'),
  }

  if (!isMerchantSide) {
    return e.json(200, {
      appointment: apptOut,
      emailSent: false,
      message: 'Agendamento cancelado.',
    })
  }

  // Notificação in-app ao cliente
  const storeName = store.getString('name') || 'Loja'
  const serviceName = appt.getString('service_name') || 'Serviço'
  const dateParts = appt.getString('date').substring(0, 10).split('-')
  const dateBr = dateParts[2] + '/' + dateParts[1] + '/' + dateParts[0]
  const timeText = appt.getString('start_time') + ' às ' + appt.getString('end_time')
  const customerId = appt.getString('customer')

  const titles = {
    confirmed: appt.getBool('deposit_required')
      ? 'Sinal recebido e agendamento confirmado! ✅'
      : 'Agendamento confirmado ✅',
    completed: 'Atendimento concluído',
    cancelled: 'Agendamento cancelado',
  }
  let message =
    'Seu agendamento de ' +
    serviceName +
    ' na loja ' +
    storeName +
    ' para ' +
    dateBr +
    ' às ' +
    timeText +
    ' foi ' +
    (newStatus === 'confirmed'
      ? appt.getBool('deposit_required')
        ? 'confirmado após o recebimento do sinal de R$ ' +
          (appt.getFloat('deposit_amount') || 0).toFixed(2) +
          '.'
        : 'confirmado.'
      : newStatus === 'completed'
        ? 'marcado como concluído.'
        : 'cancelado pela loja.')
  if (newStatus === 'cancelled' && cancelReason) {
    message += ' Motivo: ' + cancelReason
  }

  try {
    const notifCollection = e.app.findCollectionByNameOrId('notifications')
    const notif = new Record(notifCollection)
    notif.set('user', customerId)
    notif.set('store', store.id)
    notif.set('type', 'system')
    notif.set('title', titles[newStatus])
    notif.set('message', message)
    notif.set('is_read', false)
    notif.set('data', { appointment_id: appt.id, status: newStatus })
    e.app.save(notif)
  } catch (err) {
    console.warn('[Appointments] Falha ao criar notificação: ' + err.message)
  }

  // E-mail de confirmação (Gmail do owner)
  let emailSent = false
  if (newStatus === 'confirmed') {
    try {
      const customer = e.app.findRecordById('users', customerId)
      const recipient = customer.email()
      const customerName = customer.getString('name') || 'Cliente'
      const subject = 'Seu agendamento foi confirmado - ' + storeName
      const htmlBody =
        '<!DOCTYPE html>' +
        '<html>' +
        '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>' +
        '<body style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px 12px; color: #1e293b;">' +
        '<div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">' +
        '  <div style="background-color: #0f172a; padding: 28px 24px; text-align: center;">' +
        '    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">FIDELIZA</h1>' +
        '    <p style="margin: 6px 0 0 0; color: #cbd5e1; font-size: 13px;">Programa de Fidelidade Inteligente</p>' +
        '  </div>' +
        '  <div style="padding: 32px 24px;">' +
        '    <p style="font-size: 16px; margin: 0 0 16px 0; color: #0f172a; font-weight: 600;">Olá, ' +
        customerName +
        '!</p>' +
        '    <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">' +
        '      Seu agendamento na loja <strong>' +
        storeName +
        '</strong> foi <strong>confirmado</strong>' +
        (appt.getBool('deposit_required')
          ? ' com sinal de R$ ' + (appt.getFloat('deposit_amount') || 0).toFixed(2) + ' recebido.'
          : '.') +
        '    </p>' +
        '    <div style="background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">' +
        '      <p style="font-size: 14px; margin: 0 0 8px 0; color: #0f172a;"><strong>Serviço:</strong> ' +
        serviceName +
        '</p>' +
        '      <p style="font-size: 14px; margin: 0 0 8px 0; color: #0f172a;"><strong>Data:</strong> ' +
        dateBr +
        '</p>' +
        '      <p style="font-size: 14px; margin: 0 0 8px 0; color: #0f172a;"><strong>Horário:</strong> ' +
        timeText +
        '</p>' +
        '      <p style="font-size: 14px; margin: 0; color: #0f172a;"><strong>Loja:</strong> ' +
        storeName +
        '</p>' +
        '    </div>' +
        '    <div style="text-align: center; margin: 28px 0;">' +
        '      <a href="' +
        appUrl +
        '/cliente" style="display: inline-block; padding: 14px 28px; background-color: #e11d48; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; border-radius: 10px;">Ver Meus Agendamentos</a>' +
        '    </div>' +
        '    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />' +
        '    <p style="font-size: 13px; color: #475569; margin: 0;">Atenciosamente,<br/><strong style="color: #0f172a;">Equipe ' +
        storeName +
        ' &amp; Fideliza</strong></p>' +
        '  </div>' +
        '</div>' +
        '</body>' +
        '</html>'

      console.log('[Appointments:confirmation] Disparando para: ' + recipient)
      const res = $connectors.executeAsOwner('GMAIL_SEND_EMAIL', {
        recipient_email: recipient,
        subject: subject,
        body: htmlBody,
        is_html: true,
      })
      emailSent = !!(res && res.successful)
    } catch (err) {
      console.error('[Appointments:confirmation] Erro ao disparar: ' + err.message)
    }
  }

  return e.json(200, {
    appointment: apptOut,
    emailSent: emailSent,
    message: 'Agendamento atualizado.',
  })
})

// pocketbase/hooks/appointments.pb.js
// Agendamento de serviços: disponibilidade pública, reserva pelo cliente e
// mudança de status pelo lojista (ou cancelamento pelo próprio cliente).
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
  record.set('price', service.getFloat('price') || 0)
  e.app.save(record)

  return e.json(200, {
    message: 'Agendamento solicitado! Aguarde a confirmação da loja.',
    appointment: {
      id: record.id,
      date: date,
      start_time: startTime,
      end_time: endTime,
      status: 'pending',
    },
  })
})

// 3. Mudança de status.
// - Lojista dono (sem suspensão do perfil) ou admin: confirmar, concluir ou cancelar.
// - Cliente dono: apenas cancelar o próprio agendamento pendente/confirmado.
// Confirmação, conclusão e cancelamento pelo lojista geram notificação in-app ao cliente;
// confirmação também dispara e-mail via Gmail do owner (mesmo mecanismo do sorteio).
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
  e.app.save(appt)

  const apptOut = {
    id: appt.id,
    status: newStatus,
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
    confirmed: 'Agendamento confirmado ✅',
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
      ? 'confirmado.'
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

  // E-mail de confirmação (Gmail do owner, mesmo padrão de gmail_mailer.pb.js)
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
        '</strong> foi <strong>confirmado</strong>.' +
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
      if (!emailSent) {
        console.warn(
          '[Appointments:confirmation] Falha para ' +
            recipient +
            ': ' +
            (res ? res.error : 'desconhecido'),
        )
      }
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

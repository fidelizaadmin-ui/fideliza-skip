// pocketbase/hooks/gmail_mailer.pb.js
// Envio de e-mails transacionais (Confirmação de cadastro e Redefinição de senha)
// via Gmail conectado do Owner usando $connectors.executeAsOwner('GMAIL_SEND_EMAIL', ...).
//
// NOTA IMPORTANTE DE ARQUITETURA POCKETBASE JSVM:
// Em pb_hooks, funções e constantes de topo de arquivo NÃO são acessíveis dentro dos callbacks
// de hooks (executados em VM pools isoladas). Portanto, todas as funções auxiliares e constantes
// devem residir inline dentro de cada callback ou rota.

// 1. Interceptor de verificação de cadastro nativo do PocketBase
onMailerRecordVerificationSend((e) => {
  const appUrl = 'https://fideliza-programa-de-fidelidade-4940d.goskip.app'
  try {
    const token = (e.meta && e.meta.token) || ''
    if (e.record && token) {
      const recipient = e.record.email()
      const userName = e.record.getString('name')
      const greeting = userName ? 'Olá, ' + userName + '!' : 'Olá,'
      const actionUrl = appUrl + '/confirmar-email?token=' + encodeURIComponent(token)
      const subject = 'Confirme seu cadastro no Fideliza'

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
        '    <p style="font-size: 16px; margin: 0 0 16px 0; color: #0f172a; font-weight: 600;">' +
        greeting +
        '</p>' +
        '    <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">' +
        '      Seja muito bem-vindo ao <strong>Fideliza</strong>! Obrigado por criar sua conta.' +
        '    </p>' +
        '    <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 24px 0;">' +
        '      Para ativar todos os recursos do seu perfil e confirmar a segurança do seu acesso, por favor confirme seu endereço de e-mail clicando no botão abaixo:' +
        '    </p>' +
        '    <div style="text-align: center; margin: 28px 0;">' +
        '      <a href="' +
        actionUrl +
        '" style="display: inline-block; padding: 14px 28px; background-color: #e11d48; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; border-radius: 10px; box-shadow: 0 2px 4px rgba(225, 29, 72, 0.25);">' +
        '        Confirmar meu e-mail' +
        '      </a>' +
        '    </div>' +
        '    <p style="font-size: 12px; line-height: 1.6; color: #64748b; margin: 24px 0 8px 0;">' +
        '      Se o botão acima não funcionar, você também pode copiar e colar o link a seguir no seu navegador:' +
        '    </p>' +
        '    <p style="font-size: 12px; word-break: break-all; color: #2563eb; background: #f1f5f9; padding: 10px; border-radius: 6px; margin: 0 0 24px 0;">' +
        '      <a href="' +
        actionUrl +
        '" style="color: #2563eb; text-decoration: underline;">' +
        actionUrl +
        '</a>' +
        '    </p>' +
        '    <p style="font-size: 12px; color: #94a3b8; margin: 0 0 24px 0; font-style: italic;">' +
        '      Se você não realizou este cadastro, por favor desconsidere esta mensagem.' +
        '    </p>' +
        '    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />' +
        '    <p style="font-size: 13px; color: #475569; margin: 0;">' +
        '      Atenciosamente,<br/><strong style="color: #0f172a;">Equipe Fideliza</strong>' +
        '    </p>' +
        '  </div>' +
        '</div>' +
        '</body>' +
        '</html>'

      console.log('[GmailMailer:onMailerRecordVerificationSend] Disparando para: ' + recipient)
      const res = $connectors.executeAsOwner('GMAIL_SEND_EMAIL', {
        recipient_email: recipient,
        subject: subject,
        body: htmlBody,
        is_html: true,
      })
      if (res && res.successful) {
        console.log(
          '[GmailMailer:onMailerRecordVerificationSend] Sucesso no envio para ' + recipient,
        )
      } else {
        console.warn(
          '[GmailMailer:onMailerRecordVerificationSend] Falha no envio para ' +
            recipient +
            ': ' +
            (res ? res.error : 'desconhecido'),
        )
      }
    }
  } catch (err) {
    console.warn('[GmailMailer:onMailerRecordVerificationSend] Exceção: ' + err.message)
  }
  return e.next()
})

// 2. Interceptor de redefinição de senha nativo do PocketBase
onMailerRecordPasswordResetSend((e) => {
  const appUrl = 'https://fideliza-programa-de-fidelidade-4940d.goskip.app'
  try {
    const token = (e.meta && e.meta.token) || ''
    if (e.record && token) {
      const recipient = e.record.email()
      const userName = e.record.getString('name')
      const greeting = userName ? 'Olá, ' + userName + '!' : 'Olá,'
      const actionUrl = appUrl + '/redefinir-senha?token=' + encodeURIComponent(token)
      const subject = 'Redefina sua senha do Fideliza'

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
        '    <p style="font-size: 16px; margin: 0 0 16px 0; color: #0f172a; font-weight: 600;">' +
        greeting +
        '</p>' +
        '    <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">' +
        '      Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Fideliza</strong>.' +
        '    </p>' +
        '    <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 24px 0;">' +
        '      Clique no botão abaixo para escolher uma nova senha de acesso:' +
        '    </p>' +
        '    <div style="text-align: center; margin: 28px 0;">' +
        '      <a href="' +
        actionUrl +
        '" style="display: inline-block; padding: 14px 28px; background-color: #0f172a; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; border-radius: 10px; box-shadow: 0 2px 4px rgba(15, 23, 42, 0.25);">' +
        '        Redefinir minha senha' +
        '      </a>' +
        '    </div>' +
        '    <p style="font-size: 12px; line-height: 1.6; color: #64748b; margin: 24px 0 8px 0;">' +
        '      Se o botão acima não funcionar, copie e cole o link abaixo em seu navegador:' +
        '    </p>' +
        '    <p style="font-size: 12px; word-break: break-all; color: #2563eb; background: #f1f5f9; padding: 10px; border-radius: 6px; margin: 0 0 24px 0;">' +
        '      <a href="' +
        actionUrl +
        '" style="color: #2563eb; text-decoration: underline;">' +
        actionUrl +
        '</a>' +
        '    </p>' +
        '    <p style="font-size: 12px; color: #94a3b8; margin: 0 0 24px 0; font-style: italic;">' +
        '      Se você não solicitou a alteração de sua senha, ignore este e-mail. Sua senha permanecerá a mesma.' +
        '    </p>' +
        '    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />' +
        '    <p style="font-size: 13px; color: #475569; margin: 0;">' +
        '      Atenciosamente,<br/><strong style="color: #0f172a;">Equipe Fideliza</strong>' +
        '    </p>' +
        '  </div>' +
        '</div>' +
        '</body>' +
        '</html>'

      console.log('[GmailMailer:onMailerRecordPasswordResetSend] Disparando para: ' + recipient)
      const res = $connectors.executeAsOwner('GMAIL_SEND_EMAIL', {
        recipient_email: recipient,
        subject: subject,
        body: htmlBody,
        is_html: true,
      })
      if (res && res.successful) {
        console.log(
          '[GmailMailer:onMailerRecordPasswordResetSend] Sucesso no envio para ' + recipient,
        )
      } else {
        console.warn(
          '[GmailMailer:onMailerRecordPasswordResetSend] Falha no envio para ' +
            recipient +
            ': ' +
            (res ? res.error : 'desconhecido'),
        )
      }
    }
  } catch (err) {
    console.warn('[GmailMailer:onMailerRecordPasswordResetSend] Exceção: ' + err.message)
  }
  return e.next()
})

// 3. Endpoint customizado para verificação de e-mail direta via Gmail do Owner
// POST /backend/v1/auth/request-verification { "email": "usuario@exemplo.com" }
routerAdd('POST', '/backend/v1/auth/request-verification', (e) => {
  const appUrl = 'https://fideliza-programa-de-fidelidade-4940d.goskip.app'
  const body = e.requestInfo().body || {}
  const rawEmail = (body.email || '').trim()

  if (!rawEmail) {
    return e.json(400, { message: 'O campo e-mail é obrigatório.' })
  }

  let userRecord = null
  try {
    userRecord = e.app.findAuthRecordByEmail('_pb_users_auth_', rawEmail)
  } catch (_) {
    return e.json(200, {
      message: 'Se o e-mail estiver cadastrado, as instruções foram enviadas.',
      sent: true,
    })
  }

  if (userRecord.verified()) {
    return e.json(200, {
      message: 'Este e-mail já foi verificado anteriormente.',
      alreadyVerified: true,
      sent: false,
    })
  }

  const token = userRecord.newVerificationToken()
  const recipient = userRecord.email()
  const userName = userRecord.getString('name')
  const greeting = userName ? 'Olá, ' + userName + '!' : 'Olá,'
  const actionUrl = appUrl + '/confirmar-email?token=' + encodeURIComponent(token)
  const subject = 'Confirme seu cadastro no Fideliza'

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
    '    <p style="font-size: 16px; margin: 0 0 16px 0; color: #0f172a; font-weight: 600;">' +
    greeting +
    '</p>' +
    '    <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">' +
    '      Seja muito bem-vindo ao <strong>Fideliza</strong>! Obrigado por criar sua conta.' +
    '    </p>' +
    '    <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 24px 0;">' +
    '      Para ativar todos os recursos do seu perfil e confirmar a segurança do seu acesso, por favor confirme seu endereço de e-mail clicando no botão abaixo:' +
    '    </p>' +
    '    <div style="text-align: center; margin: 28px 0;">' +
    '      <a href="' +
    actionUrl +
    '" style="display: inline-block; padding: 14px 28px; background-color: #e11d48; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; border-radius: 10px; box-shadow: 0 2px 4px rgba(225, 29, 72, 0.25);">' +
    '        Confirmar meu e-mail' +
    '      </a>' +
    '    </div>' +
    '    <p style="font-size: 12px; line-height: 1.6; color: #64748b; margin: 24px 0 8px 0;">' +
    '      Se o botão acima não funcionar, você também pode copiar e colar o link a seguir no seu navegador:' +
    '    </p>' +
    '    <p style="font-size: 12px; word-break: break-all; color: #2563eb; background: #f1f5f9; padding: 10px; border-radius: 6px; margin: 0 0 24px 0;">' +
    '      <a href="' +
    actionUrl +
    '" style="color: #2563eb; text-decoration: underline;">' +
    actionUrl +
    '</a>' +
    '    </p>' +
    '    <p style="font-size: 12px; color: #94a3b8; margin: 0 0 24px 0; font-style: italic;">' +
    '      Se você não realizou este cadastro, por favor desconsidere esta mensagem.' +
    '    </p>' +
    '    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />' +
    '    <p style="font-size: 13px; color: #475569; margin: 0;">' +
    '      Atenciosamente,<br/><strong style="color: #0f172a;">Equipe Fideliza</strong>' +
    '    </p>' +
    '  </div>' +
    '</div>' +
    '</body>' +
    '</html>'

  console.log('[GmailMailer:customVerification] Disparando para: ' + recipient)
  try {
    const res = $connectors.executeAsOwner('GMAIL_SEND_EMAIL', {
      recipient_email: recipient,
      subject: subject,
      body: htmlBody,
      is_html: true,
    })

    if (res && res.successful) {
      console.log('[GmailMailer:customVerification] Sucesso para: ' + recipient)
      return e.json(200, {
        message: 'E-mail de confirmação enviado com sucesso via Gmail!',
        sent: true,
      })
    } else {
      console.warn(
        '[GmailMailer:customVerification] Falha para ' +
          recipient +
          ': ' +
          (res ? res.error : 'desconhecido'),
      )
      return e.json(500, {
        message: 'Falha ao enviar e-mail via Gmail.',
        sent: false,
      })
    }
  } catch (err) {
    console.error('[GmailMailer:customVerification] Erro ao disparar: ' + err.message)
    return e.json(500, {
      message: 'Erro interno ao processar envio de e-mail: ' + err.message,
      sent: false,
    })
  }
})

// 4. Endpoint customizado para envio de notificação de ganhador de sorteio via Gmail do Owner
// POST /backend/v1/giveaways/notify-winner { giveaway_id: "..." }
routerAdd('POST', '/backend/v1/giveaways/notify-winner', (e) => {
  const appUrl = 'https://fideliza-programa-de-fidelidade-4940d.goskip.app'
  const body = e.requestInfo().body || {}
  const giveawayId = (body.giveaway_id || '').trim()

  if (!giveawayId) {
    return e.json(400, { message: 'giveaway_id é obrigatório.' })
  }

  // Apenas usuários autenticados podem acionar
  const authUser = e.auth
  if (!authUser) {
    return e.json(401, { message: 'Autenticação necessária.' })
  }

  let giveawayRecord = null
  try {
    giveawayRecord = e.app.findRecordById('giveaways', giveawayId)
  } catch (_) {
    return e.json(404, { message: 'Sorteio não encontrado.' })
  }

  // Carregar dados da loja
  let storeRecord = null
  try {
    storeRecord = e.app.findRecordById('stores', giveawayRecord.getString('store'))
  } catch (_) {
    return e.json(404, { message: 'Loja não encontrada.' })
  }

  // Verificar permissão: dono da loja ou admin
  const isOwner = storeRecord.getString('owner_id') === authUser.id
  const isAdmin = authUser.getString('role') === 'admin'
  if (!isOwner && !isAdmin) {
    return e.json(403, {
      message: 'Apenas o lojista dono da loja ou administrador podem notificar o ganhador.',
    })
  }

  const winnerId = giveawayRecord.getString('winner')
  if (!winnerId) {
    return e.json(400, { message: 'Este sorteio ainda não tem um ganhador definido.' })
  }

  let winnerRecord = null
  try {
    winnerRecord = e.app.findRecordById('users', winnerId)
  } catch (_) {
    return e.json(404, { message: 'Usuário ganhador não encontrado.' })
  }

  const recipient = winnerRecord.email()
  const customerName = winnerRecord.getString('name') || 'Cliente'
  const storeName = storeRecord.getString('name') || 'Loja'
  const giveawayTitle = giveawayRecord.getString('title')
  const rewardType = giveawayRecord.getString('reward_type')
  const rewardDesc = giveawayRecord.getString('reward_description')
  const discountAmount = giveawayRecord.getFloat('discount_amount')
  const expiresAt = giveawayRecord.getString('expires_at') || ''

  let premioTexto = ''
  if (rewardType === 'discount' && discountAmount > 0) {
    premioTexto = 'Desconto de R$ ' + discountAmount.toFixed(2)
  } else {
    premioTexto = rewardDesc || 'Brinde especial'
  }

  let formattedDate = expiresAt
  try {
    if (expiresAt) {
      const d = new Date(expiresAt)
      formattedDate = d.toLocaleDateString('pt-BR')
    }
  } catch (_) {}

  const subject = '🎉 Parabéns! Você foi o ganhador do sorteio na loja ' + storeName + '!'
  const actionUrl = appUrl + '/cliente'

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
    '    <div style="text-align: center; margin-bottom: 24px;">' +
    '      <span style="display: inline-block; font-size: 40px;">🎁</span>' +
    '      <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 12px 0 4px 0;">VOCÊ FOI SORTEADO!</h2>' +
    '      <p style="font-size: 13px; color: #64748b; margin: 0;">Sorteio exclusivo para clientes fidelizados</p>' +
    '    </div>' +
    '    <p style="font-size: 15px; margin: 0 0 16px 0; color: #0f172a; font-weight: 600;">' +
    '      Olá, ' +
    customerName +
    '!' +
    '    </p>' +
    '    <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">' +
    '      Temos uma excelente notícia! Você participou como cliente fidelizado da loja <strong>' +
    storeName +
    '</strong> e acabou de ser contemplado no sorteio:' +
    '    </p>' +
    '    <div style="background: linear-gradient(135deg, #fff1f2 0%, #fef2f2 100%); border: 1px solid #fecdd3; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">' +
    '      <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; color: #e11d48; margin: 0 0 6px 0;">Sorteio: ' +
    giveawayTitle +
    '</p>' +
    '      <p style="font-size: 20px; font-weight: 900; color: #9f1239; margin: 0 0 10px 0;">' +
    premioTexto +
    '</p>' +
    (formattedDate
      ? '      <p style="font-size: 13px; color: #be123c; margin: 0; font-weight: 600;">⏰ Prazo para resgate: até ' +
        formattedDate +
        '</p>'
      : '') +
    '    </div>' +
    '    <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 20px 0;">' +
    '      Para resgatar seu prêmio, dirija-se à loja <strong>' +
    storeName +
    '</strong> e apresente seu código de cliente ou cartão digital no caixa.' +
    '    </p>' +
    '    <div style="text-align: center; margin: 28px 0;">' +
    '      <a href="' +
    actionUrl +
    '" style="display: inline-block; padding: 14px 28px; background-color: #e11d48; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; border-radius: 10px; box-shadow: 0 2px 4px rgba(225, 29, 72, 0.25);">' +
    '        Acessar Minha Área e Ver Prêmio' +
    '      </a>' +
    '    </div>' +
    '    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />' +
    '    <p style="font-size: 13px; color: #475569; margin: 0;">' +
    '      Parabéns e boas compras,<br/><strong style="color: #0f172a;">Equipe ' +
    storeName +
    ' & Fideliza</strong>' +
    '    </p>' +
    '  </div>' +
    '</div>' +
    '</body>' +
    '</html>'

  console.log('[GmailMailer:giveawayNotification] Disparando para: ' + recipient)
  try {
    const res = $connectors.executeAsOwner('GMAIL_SEND_EMAIL', {
      recipient_email: recipient,
      subject: subject,
      body: htmlBody,
      is_html: true,
    })

    if (res && res.successful) {
      console.log(
        '[GmailMailer:giveawayNotification] E-mail enviado com sucesso para: ' + recipient,
      )
      return e.json(200, {
        message: 'E-mail de notificação enviado ao ganhador!',
        sent: true,
      })
    } else {
      console.warn(
        '[GmailMailer:giveawayNotification] Falha para ' +
          recipient +
          ': ' +
          (res ? res.error : 'desconhecido'),
      )
      return e.json(200, {
        message: 'Sorteio registrado, mas houve falha no envio do e-mail ao cliente.',
        sent: false,
        error: res ? res.error : 'falha no envio',
      })
    }
  } catch (err) {
    console.error('[GmailMailer:giveawayNotification] Erro ao disparar: ' + err.message)
    return e.json(200, {
      message: 'Sorteio registrado, notificação in-app criada, erro no e-mail: ' + err.message,
      sent: false,
    })
  }
})

// 5. Endpoint customizado para redefinição de senha direta via Gmail do Owner
// POST /backend/v1/auth/request-password-reset { "email": "usuario@exemplo.com" }
routerAdd('POST', '/backend/v1/auth/request-password-reset', (e) => {
  const appUrl = 'https://fideliza-programa-de-fidelidade-4940d.goskip.app'
  const body = e.requestInfo().body || {}
  const rawEmail = (body.email || '').trim()

  if (!rawEmail) {
    return e.json(400, { message: 'O campo e-mail é obrigatório.' })
  }

  let userRecord = null
  try {
    userRecord = e.app.findAuthRecordByEmail('_pb_users_auth_', rawEmail)
  } catch (_) {
    return e.json(200, {
      message: 'Se o e-mail estiver cadastrado, as instruções foram enviadas.',
      sent: true,
    })
  }

  const token = userRecord.newPasswordResetToken()
  const recipient = userRecord.email()
  const userName = userRecord.getString('name')
  const greeting = userName ? 'Olá, ' + userName + '!' : 'Olá,'
  const actionUrl = appUrl + '/redefinir-senha?token=' + encodeURIComponent(token)
  const subject = 'Redefina sua senha do Fideliza'

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
    '    <p style="font-size: 16px; margin: 0 0 16px 0; color: #0f172a; font-weight: 600;">' +
    greeting +
    '</p>' +
    '    <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">' +
    '      Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Fideliza</strong>.' +
    '    </p>' +
    '    <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 24px 0;">' +
    '      Clique no botão abaixo para escolher uma nova senha de acesso:' +
    '    </p>' +
    '    <div style="text-align: center; margin: 28px 0;">' +
    '      <a href="' +
    actionUrl +
    '" style="display: inline-block; padding: 14px 28px; background-color: #0f172a; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; border-radius: 10px; box-shadow: 0 2px 4px rgba(15, 23, 42, 0.25);">' +
    '        Redefinir minha senha' +
    '      </a>' +
    '    </div>' +
    '    <p style="font-size: 12px; line-height: 1.6; color: #64748b; margin: 24px 0 8px 0;">' +
    '      Se o botão acima não funcionar, copie e cole o link abaixo em seu navegador:' +
    '    </p>' +
    '    <p style="font-size: 12px; word-break: break-all; color: #2563eb; background: #f1f5f9; padding: 10px; border-radius: 6px; margin: 0 0 24px 0;">' +
    '      <a href="' +
    actionUrl +
    '" style="color: #2563eb; text-decoration: underline;">' +
    actionUrl +
    '</a>' +
    '    </p>' +
    '    <p style="font-size: 12px; color: #94a3b8; margin: 0 0 24px 0; font-style: italic;">' +
    '      Se você não solicitou a alteração de sua senha, ignore este e-mail. Sua senha permanecerá a mesma.' +
    '    </p>' +
    '    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />' +
    '    <p style="font-size: 13px; color: #475569; margin: 0;">' +
    '      Atenciosamente,<br/><strong style="color: #0f172a;">Equipe Fideliza</strong>' +
    '    </p>' +
    '  </div>' +
    '</div>' +
    '</body>' +
    '</html>'

  console.log('[GmailMailer:customPasswordReset] Disparando para: ' + recipient)
  try {
    const res = $connectors.executeAsOwner('GMAIL_SEND_EMAIL', {
      recipient_email: recipient,
      subject: subject,
      body: htmlBody,
      is_html: true,
    })

    if (res && res.successful) {
      console.log('[GmailMailer:customPasswordReset] Sucesso para: ' + recipient)
      return e.json(200, {
        message: 'Instruções para redefinir sua senha foram enviadas para seu e-mail!',
        sent: true,
      })
    } else {
      console.warn(
        '[GmailMailer:customPasswordReset] Falha para ' +
          recipient +
          ': ' +
          (res ? res.error : 'desconhecido'),
      )
      return e.json(500, {
        message: 'Falha ao enviar e-mail via Gmail.',
        sent: false,
      })
    }
  } catch (err) {
    console.error('[GmailMailer:customPasswordReset] Erro ao disparar: ' + err.message)
    return e.json(500, {
      message: 'Erro interno ao processar envio de e-mail: ' + err.message,
      sent: false,
    })
  }
})

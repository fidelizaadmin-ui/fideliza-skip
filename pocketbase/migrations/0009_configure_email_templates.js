migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // Template de verificação de conta
    users.verificationTemplate = {
      subject: 'Confirme seu e-mail — Fideliza',
      body:
        '<p>Olá,</p>' +
        '<p>Seja muito bem-vindo ao <strong>Fideliza</strong>! Obrigado por criar sua conta.</p>' +
        '<p>Para ativar todos os recursos do seu perfil e confirmar a segurança do seu acesso, por favor confirme seu endereço de e-mail clicando no botão abaixo:</p>' +
        '<p style="margin: 24px 0;">' +
        '<a href="{ACTION_URL}" style="display: inline-block; padding: 12px 24px; background-color: #e11d48; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 8px;">Confirmar meu e-mail</a>' +
        '</p>' +
        '<p>Se o botão não funcionar, você também pode copiar e colar o seguinte link em seu navegador:</p>' +
        '<p><a href="{ACTION_URL}">{ACTION_URL}</a></p>' +
        '<p><i>Se você não realizou este cadastro, por favor desconsidere esta mensagem.</i></p>' +
        '<p>Atenciosamente,<br/><strong>Equipe Fideliza</strong></p>',
    }

    // Template de redefinição / recuperação de senha
    users.resetPasswordTemplate = {
      subject: 'Redefinição de senha — Fideliza',
      body:
        '<p>Olá,</p>' +
        '<p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Fideliza</strong>.</p>' +
        '<p>Clique no botão abaixo para escolher uma nova senha de acesso:</p>' +
        '<p style="margin: 24px 0;">' +
        '<a href="{ACTION_URL}" style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 8px;">Redefinir minha senha</a>' +
        '</p>' +
        '<p>Se o botão não funcionar, copie e cole o link abaixo em seu navegador:</p>' +
        '<p><a href="{ACTION_URL}">{ACTION_URL}</a></p>' +
        '<p><i>Se você não solicitou a alteração de sua senha, ignore este e-mail. Sua senha permanecerá a mesma.</i></p>' +
        '<p>Atenciosamente,<br/><strong>Equipe Fideliza</strong></p>',
    }

    // Template de confirmação de alteração de e-mail (caso seja usado futuramente)
    if (users.confirmEmailChangeTemplate) {
      users.confirmEmailChangeTemplate = {
        subject: 'Confirme seu novo e-mail — Fideliza',
        body:
          '<p>Olá,</p>' +
          '<p>Você solicitou a alteração do endereço de e-mail da sua conta no <strong>Fideliza</strong>.</p>' +
          '<p>Clique no botão abaixo para confirmar seu novo e-mail:</p>' +
          '<p style="margin: 24px 0;">' +
          '<a href="{ACTION_URL}" style="display: inline-block; padding: 12px 24px; background-color: #e11d48; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 8px;">Confirmar novo e-mail</a>' +
          '</p>' +
          '<p><a href="{ACTION_URL}">{ACTION_URL}</a></p>' +
          '<p>Atenciosamente,<br/><strong>Equipe Fideliza</strong></p>',
      }
    }

    app.save(users)
  },
  (app) => {
    // Revert/down: manter templates sem lançar erro
  },
)

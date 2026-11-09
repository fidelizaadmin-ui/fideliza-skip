// Migração idempotente para adicionar campos do Mercado Pago e credentials_masked
// na collection payment_credentials se ainda não existirem.
migrate(
  (app) => {
    let col = null
    try {
      col = app.findCollectionByNameOrId('payment_credentials')
    } catch (_) {
      return
    }

    let modified = false

    // 1. Campo api_key deve existir e ser não-obrigatório (pode ser Mercado Pago sem api_key direta)
    if (!col.fields.getByName('api_key')) {
      col.fields.add(new TextField({ name: 'api_key', required: false, hidden: true }))
      modified = true
    } else {
      const f = col.fields.getByName('api_key')
      if (f.required) {
        f.required = false
        modified = true
      }
    }

    // 2. Campos do Mercado Pago: public_key, access_token, client_id, client_secret
    const mpFields = ['public_key', 'access_token', 'client_id', 'client_secret']
    for (let i = 0; i < mpFields.length; i++) {
      if (!col.fields.getByName(mpFields[i])) {
        col.fields.add(new TextField({ name: mpFields[i], required: false, hidden: true }))
        modified = true
      }
    }

    // 3. credentials_masked (JSON público para visualização das chaves mascaradas)
    if (!col.fields.getByName('credentials_masked')) {
      col.fields.add(new JSONField({ name: 'credentials_masked', required: false }))
      modified = true
    }

    if (modified) {
      app.save(col)
    }
  },
  (app) => {
    let col = null
    try {
      col = app.findCollectionByNameOrId('payment_credentials')
    } catch (_) {
      return
    }
    const extras = ['public_key', 'access_token', 'client_id', 'client_secret']
    let modified = false
    for (let i = 0; i < extras.length; i++) {
      if (col.fields.getByName(extras[i])) {
        col.fields.removeByName(extras[i])
        modified = true
      }
    }
    if (modified) {
      app.save(col)
    }
  },
)

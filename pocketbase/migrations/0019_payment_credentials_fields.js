migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('payment_credentials')

    // 1. Garantir o campo api_key oculto e NÃO obrigatório (obrigatoriedade impedia
    //    a criação porque campos hidden só podem ser gravados no servidor)
    try {
      col.fields.removeByName('api_key')
    } catch (_) {}
    col.fields.add(new TextField({ name: 'api_key', required: false, hidden: true }))

    // 2. Campos específicos do Mercado Pago (ocultos, opcionais)
    const mpFields = ['public_key', 'access_token', 'client_id', 'client_secret']
    for (let i = 0; i < mpFields.length; i++) {
      try {
        col.fields.removeByName(mpFields[i])
      } catch (_) {}
      col.fields.add(new TextField({ name: mpFields[i], required: false, hidden: true }))
    }

    // 3. JSON visível com os valores MASCARADOS de cada credencial (nunca o valor bruto)
    try {
      col.fields.removeByName('credentials_masked')
    } catch (_) {}
    col.fields.add(new JsonField({ name: 'credentials_masked', required: false }))

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('payment_credentials')
    const extras = [
      'public_key',
      'access_token',
      'client_id',
      'client_secret',
      'credentials_masked',
    ]
    for (let i = 0; i < extras.length; i++) {
      try {
        col.fields.removeByName(extras[i])
      } catch (_) {}
    }
    app.save(col)
  },
)

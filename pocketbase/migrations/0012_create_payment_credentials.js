migrate(
  (app) => {
    // Idempotência: verificar se a collection payment_credentials já existe
    try {
      app.findCollectionByNameOrId('payment_credentials')
      return // Já existe
    } catch (_) {}

    const paymentCredentials = new Collection({
      name: 'payment_credentials',
      type: 'base',
      // Regras de acesso restritas estritamente para role = 'admin'
      listRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      viewRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      createRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      updateRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      deleteRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      fields: [
        {
          name: 'provider',
          type: 'text',
          required: true,
        },
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'api_key',
          type: 'text',
          required: true,
          hidden: true, // Campo oculto na API para não expor a chave bruta
        },
        {
          name: 'api_key_masked',
          type: 'text',
          required: false,
        },
        {
          name: 'extra_config',
          type: 'json',
          required: false,
        },
        {
          name: 'is_active',
          type: 'bool',
          required: false,
        },
        {
          name: 'created',
          type: 'autodate',
          onCreate: true,
          onUpdate: false,
        },
        {
          name: 'updated',
          type: 'autodate',
          onCreate: true,
          onUpdate: true,
        },
      ],
      indexes: [
        'CREATE INDEX idx_payment_credentials_provider ON payment_credentials (provider)',
        'CREATE INDEX idx_payment_credentials_active ON payment_credentials (is_active)',
      ],
    })

    app.save(paymentCredentials)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('payment_credentials')
      if (col) app.delete(col)
    } catch (_) {}
  },
)

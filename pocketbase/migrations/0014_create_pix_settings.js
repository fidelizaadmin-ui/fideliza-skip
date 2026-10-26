migrate(
  (app) => {
    // Idempotência: verificar se a collection pix_settings já existe
    try {
      app.findCollectionByNameOrId('pix_settings')
      return // Já existe
    } catch (_) {}

    const pixSettings = new Collection({
      name: 'pix_settings',
      type: 'base',
      // Regras de acesso restritas estritamente para role = 'admin'
      listRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      viewRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      createRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      updateRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      deleteRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      fields: [
        {
          name: 'pix_key',
          type: 'text',
          required: true,
          hidden: true, // Chave nunca deve ser exposta diretamente via API pública
        },
        {
          name: 'key_type',
          type: 'select',
          values: ['cpf', 'cnpj', 'telefone', 'email', 'aleatoria'],
          maxSelect: 1,
          required: true,
        },
        {
          name: 'receiver_name',
          type: 'text',
          required: true,
          max: 25,
        },
        {
          name: 'receiver_city',
          type: 'text',
          required: true,
          max: 15,
        },
        {
          name: 'is_active',
          type: 'bool',
          required: false,
        },
        {
          name: 'pix_key_masked',
          type: 'text',
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
      indexes: ['CREATE INDEX idx_pix_settings_active ON pix_settings (is_active)'],
    })

    app.save(pixSettings)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('pix_settings')
      if (col) app.delete(col)
    } catch (_) {}
  },
)

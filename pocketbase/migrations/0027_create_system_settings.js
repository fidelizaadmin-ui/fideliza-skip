migrate(
  (app) => {
    // Idempotência: se a coleção já existe, apenas garante as regras/estrutura esperadas
    let settingsCol = null
    try {
      settingsCol = app.findCollectionByNameOrId('system_settings')
    } catch (_) {}

    if (settingsCol) {
      // Garante que listRule/viewRule permitam leitura pública (nome e tema são dados públicos)
      try {
        if (settingsCol.listRule !== '') {
          settingsCol.set('listRule', '')
          settingsCol.set('viewRule', '')
          app.save(settingsCol)
        }
      } catch (_) {}
      return
    }

    const collection = new Collection({
      name: 'system_settings',
      type: 'base',
      // Nome e tema do sistema são PÚBLICOS (navbar/login/rodapé precisam ler sem login)
      listRule: '',
      viewRule: '',
      // Escrita EXCLUSIVA de administradores (cliente e lojista nunca alteram)
      createRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      updateRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      deleteRule: null,
      fields: [
        {
          name: 'system_name',
          type: 'text',
          required: true,
          max: 60,
        },
        {
          name: 'theme',
          type: 'select',
          values: ['azul', 'verde', 'roxo', 'laranja', 'vermelho', 'grafite'],
          maxSelect: 1,
          required: true,
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
      indexes: ['CREATE UNIQUE INDEX idx_system_settings_singleton ON system_settings (id)'],
    })

    app.save(collection)

    // Registro único padrão: nome "Fideliza" + tema azul (padrão atual)
    try {
      const rec = new Record(app.findCollectionByNameOrId('system_settings'))
      rec.set('system_name', 'Fideliza')
      rec.set('theme', 'azul')
      app.save(rec)
    } catch (_) {}
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('system_settings')
      if (col) app.delete(col)
    } catch (_) {}
  },
)

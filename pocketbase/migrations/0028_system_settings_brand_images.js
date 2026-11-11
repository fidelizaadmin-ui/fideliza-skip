migrate(
  (app) => {
    // Logo (marca horizontal) e ícone (quadrado/favicon) enviados pelo admin.
    // Idempotente: só adiciona o campo se ainda não existir.
    const col = app.findCollectionByNameOrId('system_settings')
    const imageTypes = ['image/png', 'image/jpeg', 'image/svg+xml']
    const maxSize = 5 * 1024 * 1024

    if (!col.fields.getByName('logo')) {
      col.fields.add(
        new FileField({
          name: 'logo',
          maxSelect: 1,
          maxSize: maxSize,
          mimeTypes: imageTypes,
        }),
      )
    }
    if (!col.fields.getByName('icon')) {
      col.fields.add(
        new FileField({
          name: 'icon',
          maxSelect: 1,
          maxSize: maxSize,
          mimeTypes: imageTypes,
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('system_settings')
      col.fields.removeByName('logo')
      col.fields.removeByName('icon')
      app.save(col)
    } catch (_) {}
  },
)

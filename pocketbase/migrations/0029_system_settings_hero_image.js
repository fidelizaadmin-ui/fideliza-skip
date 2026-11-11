migrate(
  (app) => {
    // Imagem de fundo do hero da página inicial, enviada pelo admin.
    // Idempotente: só adiciona o campo se ainda não existir (mesmo padrão da 0028).
    const col = app.findCollectionByNameOrId('system_settings')
    const imageTypes = ['image/png', 'image/jpeg', 'image/webp']
    const maxSize = 5 * 1024 * 1024

    if (!col.fields.getByName('hero_image')) {
      col.fields.add(
        new FileField({
          name: 'hero_image',
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
      col.fields.removeByName('hero_image')
      app.save(col)
    } catch (_) {}
  },
)

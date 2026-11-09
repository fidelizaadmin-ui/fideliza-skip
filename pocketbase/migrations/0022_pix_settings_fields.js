// pocketbase/migrations/0022_pix_settings_fields.js
// Garante que o campo pix_key exista na collection pix_settings com required: false e hidden: true
migrate(
  (app) => {
    let col = null
    try {
      col = app.findCollectionByNameOrId('pix_settings')
    } catch (_) {
      return
    }

    // Se o campo pix_key já existir, remove para recriar com a tipagem correta e required: false
    try {
      col.fields.removeByName('pix_key')
    } catch (_) {}

    col.fields.add(
      new TextField({
        name: 'pix_key',
        required: false,
        hidden: true,
      }),
    )

    app.save(col)
  },
  (app) => {
    let col = null
    try {
      col = app.findCollectionByNameOrId('pix_settings')
    } catch (_) {
      return
    }
    try {
      col.fields.removeByName('pix_key')
      app.save(col)
    } catch (_) {}
  },
)

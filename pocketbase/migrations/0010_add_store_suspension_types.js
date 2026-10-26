migrate(
  (app) => {
    const stores = app.findCollectionByNameOrId('stores')

    // suspend_public: boolean (suspensão no portal público)
    if (!stores.fields.getByName('suspend_public')) {
      stores.fields.add(
        new BoolField({
          name: 'suspend_public',
          required: false,
        }),
      )
    }

    // suspend_merchant: boolean (suspensão nas funcionalidades do perfil do lojista)
    if (!stores.fields.getByName('suspend_merchant')) {
      stores.fields.add(
        new BoolField({
          name: 'suspend_merchant',
          required: false,
        }),
      )
    }

    app.save(stores)

    // Backfill para lojas existentes com overdue ou cancelled:
    // Por padrão sensato, se já estavam suspensas (overdue ou cancelled), marcar ambas como true para manter consistência
    try {
      app
        .db()
        .newQuery(`
        UPDATE stores
        SET suspend_public = true, suspend_merchant = true
        WHERE subscription_status IN ('overdue', 'cancelled')
      `)
        .execute()
    } catch (err) {
      console.log('Error backfilling suspension flags:', err)
    }
  },
  (app) => {
    const stores = app.findCollectionByNameOrId('stores')
    if (stores.fields.getByName('suspend_public')) {
      stores.fields.removeByName('suspend_public')
    }
    if (stores.fields.getByName('suspend_merchant')) {
      stores.fields.removeByName('suspend_merchant')
    }
    app.save(stores)
  },
)

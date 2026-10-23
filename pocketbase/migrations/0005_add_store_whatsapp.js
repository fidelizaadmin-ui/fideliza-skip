migrate(
  (app) => {
    const stores = app.findCollectionByNameOrId('stores')
    if (!stores.fields.getByName('whatsapp')) {
      stores.fields.add(
        new TextField({
          name: 'whatsapp',
          required: false,
        }),
      )
      app.save(stores)
    }
  },
  (app) => {
    const stores = app.findCollectionByNameOrId('stores')
    const field = stores.fields.getByName('whatsapp')
    if (field) {
      stores.fields.removeByName('whatsapp')
      app.save(stores)
    }
  },
)

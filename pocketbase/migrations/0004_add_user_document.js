migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // Add document: CPF (11 digits) for customer or CNPJ (14 digits) for merchant
    if (!users.fields.getByName('document')) {
      users.fields.add(
        new TextField({
          name: 'document',
          required: false,
        }),
      )
    }

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const docField = users.fields.getByName('document')
    if (docField) users.fields.remove(docField)
    app.save(users)
  },
)

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // Add role: 'admin' | 'merchant' | 'customer'
    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          required: false,
          values: ['admin', 'merchant', 'customer'],
          maxSelect: 1,
        }),
      )
    }

    // Add customer_code: unique identifier for customers e.g. "FID-102938"
    if (!users.fields.getByName('customer_code')) {
      users.fields.add(
        new TextField({
          name: 'customer_code',
          required: false,
        }),
      )
    }

    // Add phone
    if (!users.fields.getByName('phone')) {
      users.fields.add(
        new TextField({
          name: 'phone',
          required: false,
        }),
      )
    }

    // Update users API rules so merchants can look up customers by customer_code, and public can view basic store owners
    users.listRule = "@request.auth.id != ''"
    users.viewRule = "@request.auth.id != ''"

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const roleField = users.fields.getByName('role')
    if (roleField) users.fields.remove(roleField)
    const codeField = users.fields.getByName('customer_code')
    if (codeField) users.fields.remove(codeField)
    const phoneField = users.fields.getByName('phone')
    if (phoneField) users.fields.remove(phoneField)
    app.save(users)
  },
)

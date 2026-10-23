migrate(
  (app) => {
    // 1. Atualizar campo role da coleção users para incluir 'collaborator'
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const roleField = users.fields.getByName('role')
    if (roleField) {
      roleField.values = ['admin', 'merchant', 'customer', 'collaborator']
      roleField.maxSelect = 1
    }

    // Regras de atualização em users:
    // Administrador autenticado pode atualizar qualquer usuário (para promover/reverter papel de clientes/colaboradores)
    // O próprio usuário pode atualizar seus dados pessoais, mas não seu papel se não for admin
    users.updateRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || (id = @request.auth.id && @request.body.role:changed = false))"

    app.save(users)

    // 2. Coleção stores:
    // Apenas admin ou dono pode excluir loja. Colaborador NUNCA pode excluir loja!
    const stores = app.findCollectionByNameOrId('stores')
    stores.deleteRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || owner_id = @request.auth.id)"

    // Atualização de lojas:
    // Admin, colaborador ou dono da loja podem atualizar.
    // (O frontend e regras de negócio limitam colaborador estritamente à gestão de assinaturas)
    stores.updateRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'collaborator' || owner_id = @request.auth.id)"

    app.save(stores)

    // 3. Coleção subscription_plans:
    // Admin e colaborador podem atualizar e criar planos de assinatura (parte da gestão de assinaturas)
    const subscriptionPlans = app.findCollectionByNameOrId('subscription_plans')
    subscriptionPlans.createRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'collaborator')"
    subscriptionPlans.updateRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'collaborator')"
    subscriptionPlans.deleteRule = "@request.auth.id != '' && @request.auth.role = 'admin'"

    app.save(subscriptionPlans)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const roleField = users.fields.getByName('role')
    if (roleField) {
      roleField.values = ['admin', 'merchant', 'customer']
      roleField.maxSelect = 1
    }
    users.updateRule = 'id = @request.auth.id'
    app.save(users)

    const stores = app.findCollectionByNameOrId('stores')
    stores.deleteRule = "@request.auth.id != ''"
    stores.updateRule = "@request.auth.id != ''"
    app.save(stores)

    const subscriptionPlans = app.findCollectionByNameOrId('subscription_plans')
    subscriptionPlans.createRule = "@request.auth.id != ''"
    subscriptionPlans.updateRule = "@request.auth.id != ''"
    subscriptionPlans.deleteRule = "@request.auth.id != ''"
    app.save(subscriptionPlans)
  },
)

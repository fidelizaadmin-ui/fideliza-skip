migrate(
  (app) => {
    // Verificar se a collection já existe para garantir idempotência
    try {
      app.findCollectionByNameOrId('subscription_payments')
      return // Já existe
    } catch (_) {}

    const stores = app.findCollectionByNameOrId('stores')
    const subscriptionPlans = app.findCollectionByNameOrId('subscription_plans')

    const subscriptionPayments = new Collection({
      name: 'subscription_payments',
      type: 'base',
      // Permite list/view para admins, colaboradores e o próprio dono da loja
      listRule:
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'collaborator' || store.owner_id = @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'collaborator' || store.owner_id = @request.auth.id)",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.role = 'admin' || @request.auth.role = 'collaborator'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'store',
          type: 'relation',
          collectionId: stores.id,
          required: true,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'plan',
          type: 'relation',
          collectionId: subscriptionPlans.id,
          required: true,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'amount',
          type: 'number',
          required: true, // valor em centavos (ex: 4990 = R$ 49,90)
        },
        {
          name: 'order_nsu',
          type: 'text',
          required: true,
        },
        {
          name: 'slug',
          type: 'text',
        },
        {
          name: 'transaction_nsu',
          type: 'text',
        },
        {
          name: 'status',
          type: 'select',
          values: ['pending', 'paid', 'canceled', 'refunded', 'failed'],
          maxSelect: 1,
          required: true,
        },
        {
          name: 'capture_method',
          type: 'text', // credit_card, pix, etc.
        },
        {
          name: 'checkout_url',
          type: 'text',
        },
        {
          name: 'paid_at',
          type: 'text',
        },
        {
          name: 'metadata',
          type: 'json',
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_sub_payments_order_nsu ON subscription_payments (order_nsu)',
        'CREATE INDEX idx_sub_payments_store ON subscription_payments (store)',
        'CREATE INDEX idx_sub_payments_slug ON subscription_payments (slug)',
        'CREATE INDEX idx_sub_payments_status ON subscription_payments (status)',
      ],
    })

    app.save(subscriptionPayments)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('subscription_payments')
      if (col) app.delete(col)
    } catch (_) {}
  },
)

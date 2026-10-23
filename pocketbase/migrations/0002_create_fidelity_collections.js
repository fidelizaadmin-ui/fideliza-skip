migrate(
  (app) => {
    // 1. Subscription Plans (created/managed by Admin: mensal, semestral, anual + trial days)
    const subscriptionPlans = new Collection({
      name: 'subscription_plans',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'slug', type: 'text', required: true }, // 'mensal', 'semestral', 'anual'
        { name: 'price', type: 'number', required: true },
        { name: 'billing_interval_months', type: 'number', required: true },
        { name: 'trial_days', type: 'number', required: true },
        { name: 'description', type: 'text' },
        { name: 'features', type: 'json' },
        { name: 'is_active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(subscriptionPlans)

    // 2. Stores (created by Merchants, approved by Admin)
    const stores = new Collection({
      name: 'stores',
      type: 'base',
      listRule: '', // public can view approved stores or merchants can view their own
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'owner_id',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          required: true,
          maxSelect: 1,
        },
        { name: 'name', type: 'text', required: true },
        {
          name: 'category',
          type: 'select',
          values: [
            'Alimentação',
            'Moda & Acessórios',
            'Beleza & Estética',
            'Saúde & Bem-Estar',
            'Pet Shop',
            'Serviços',
            'Supermercado',
            'Outros',
          ],
          maxSelect: 1,
          required: true,
        },
        { name: 'description', type: 'text' },
        { name: 'address', type: 'text' },
        { name: 'city', type: 'text' },
        { name: 'phone', type: 'text' },
        { name: 'logo_url', type: 'text' },
        { name: 'banner_url', type: 'text' },
        {
          name: 'approval_status',
          type: 'select',
          values: ['pending', 'approved', 'rejected'],
          maxSelect: 1,
          required: true,
        },
        {
          name: 'subscription_plan_id',
          type: 'relation',
          collectionId: subscriptionPlans.id,
          maxSelect: 1,
        },
        {
          name: 'subscription_status',
          type: 'select',
          values: ['trial', 'active', 'overdue', 'cancelled'],
          maxSelect: 1,
        },
        { name: 'subscription_expires_at', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(stores)

    // 3. Fidelity Plans (created by Merchant for their store: selos, pontos, cashback)
    const fidelityPlans = new Collection({
      name: 'fidelity_plans',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'store_id',
          type: 'relation',
          collectionId: stores.id,
          required: true,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'type',
          type: 'select',
          values: ['stamps', 'points', 'cashback'],
          maxSelect: 1,
          required: true,
        },
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'text' },
        // Configuration details depending on type:
        // Stamps: e.g. target_stamps (10 stamps), stamp_min_purchase (R$ 20 per stamp), reward_title
        // Points: e.g. points_per_currency (1 pt per R$ 1), points_to_redeem (100 pts), reward_title
        // Cashback: e.g. cashback_percentage (5%)
        { name: 'target_stamps', type: 'number' },
        { name: 'min_purchase_amount', type: 'number' },
        { name: 'points_per_currency', type: 'number' },
        { name: 'points_to_redeem', type: 'number' },
        { name: 'cashback_percentage', type: 'number' },
        { name: 'reward_title', type: 'text' },
        { name: 'reward_description', type: 'text' },
        { name: 'is_active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(fidelityPlans)

    // 4. Customer Cards (Loyalty wallet per customer per store)
    const customerCards = new Collection({
      name: 'customer_cards',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'customer_id',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          required: true,
          maxSelect: 1,
        },
        {
          name: 'store_id',
          type: 'relation',
          collectionId: stores.id,
          required: true,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'stamps_count', type: 'number' },
        { name: 'points_balance', type: 'number' },
        { name: 'cashback_balance', type: 'number' },
        { name: 'total_purchases_count', type: 'number' },
        { name: 'total_spent', type: 'number' },
        { name: 'rewards_redeemed_count', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(customerCards)

    // 5. Purchases / Transactions (Registered by merchant or reward redemption)
    const purchases = new Collection({
      name: 'purchases',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'store_id',
          type: 'relation',
          collectionId: stores.id,
          required: true,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'customer_id',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          required: true,
          maxSelect: 1,
        },
        {
          name: 'type',
          type: 'select',
          values: ['purchase', 'redemption'],
          maxSelect: 1,
          required: true,
        },
        { name: 'amount', type: 'number' },
        { name: 'stamps_earned', type: 'number' },
        { name: 'points_earned', type: 'number' },
        { name: 'cashback_earned', type: 'number' },
        { name: 'points_spent', type: 'number' },
        { name: 'cashback_spent', type: 'number' },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(purchases)
  },
  (app) => {
    const purchases = app.findCollectionByNameOrId('purchases')
    if (purchases) app.delete(purchases)
    const customerCards = app.findCollectionByNameOrId('customer_cards')
    if (customerCards) app.delete(customerCards)
    const fidelityPlans = app.findCollectionByNameOrId('fidelity_plans')
    if (fidelityPlans) app.delete(fidelityPlans)
    const stores = app.findCollectionByNameOrId('stores')
    if (stores) app.delete(stores)
    const subscriptionPlans = app.findCollectionByNameOrId('subscription_plans')
    if (subscriptionPlans) app.delete(subscriptionPlans)
  },
)

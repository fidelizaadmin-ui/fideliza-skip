migrate(
  (app) => {
    // 1. Obter referências de collections existentes
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const stores = app.findCollectionByNameOrId('stores')

    // 2. Collection store_customers (Fidelização do cliente à loja)
    try {
      app.findCollectionByNameOrId('store_customers')
    } catch (_) {
      const storeCustomers = new Collection({
        name: 'store_customers',
        type: 'base',
        // Regras: autenticado pode listar/ver suas fidelizações ou o lojista da loja
        listRule:
          "@request.auth.id != '' && (customer = @request.auth.id || store.owner_id = @request.auth.id || @request.auth.role = 'admin')",
        viewRule:
          "@request.auth.id != '' && (customer = @request.auth.id || store.owner_id = @request.auth.id || @request.auth.role = 'admin')",
        createRule: "@request.auth.id != '' && @request.body.customer = @request.auth.id",
        updateRule:
          "@request.auth.id != '' && (customer = @request.auth.id || store.owner_id = @request.auth.id || @request.auth.role = 'admin')",
        deleteRule:
          "@request.auth.id != '' && (customer = @request.auth.id || store.owner_id = @request.auth.id || @request.auth.role = 'admin')",
        fields: [
          {
            name: 'store',
            type: 'relation',
            collectionId: stores.id,
            required: true,
            maxSelect: 1,
            cascadeDelete: true,
          },
          {
            name: 'customer',
            type: 'relation',
            collectionId: users.id,
            required: true,
            maxSelect: 1,
            cascadeDelete: true,
          },
          {
            name: 'notes',
            type: 'text',
          },
          {
            name: 'created',
            type: 'autodate',
            onCreate: true,
            onUpdate: false,
          },
          {
            name: 'updated',
            type: 'autodate',
            onCreate: true,
            onUpdate: true,
          },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_store_customers_unique ON store_customers (store, customer)',
          'CREATE INDEX idx_store_customers_store ON store_customers (store)',
          'CREATE INDEX idx_store_customers_customer ON store_customers (customer)',
        ],
      })
      app.save(storeCustomers)
    }

    // 3. Collection giveaways (Sorteios criados pelo lojista)
    try {
      app.findCollectionByNameOrId('giveaways')
    } catch (_) {
      const giveaways = new Collection({
        name: 'giveaways',
        type: 'base',
        // Lojista dono da loja, ganhador ou admin podem ver/listar
        listRule:
          "@request.auth.id != '' && (store.owner_id = @request.auth.id || winner = @request.auth.id || @request.auth.role = 'admin')",
        viewRule:
          "@request.auth.id != '' && (store.owner_id = @request.auth.id || winner = @request.auth.id || @request.auth.role = 'admin')",
        createRule: "@request.auth.id != '' && store.owner_id = @request.auth.id",
        updateRule:
          "@request.auth.id != '' && (store.owner_id = @request.auth.id || @request.auth.role = 'admin')",
        deleteRule:
          "@request.auth.id != '' && (store.owner_id = @request.auth.id || @request.auth.role = 'admin')",
        fields: [
          {
            name: 'store',
            type: 'relation',
            collectionId: stores.id,
            required: true,
            maxSelect: 1,
            cascadeDelete: true,
          },
          {
            name: 'title',
            type: 'text',
            required: true,
          },
          {
            name: 'reward_type',
            type: 'select',
            values: ['gift', 'discount'],
            maxSelect: 1,
            required: true,
          },
          {
            name: 'reward_description',
            type: 'text',
          },
          {
            name: 'discount_amount',
            type: 'number',
          },
          {
            name: 'redemption_days',
            type: 'number',
            required: true,
          },
          {
            name: 'status',
            type: 'select',
            values: ['draft', 'open', 'drawn', 'redeemed', 'expired'],
            maxSelect: 1,
            required: true,
          },
          {
            name: 'winner',
            type: 'relation',
            collectionId: users.id,
            maxSelect: 1,
          },
          {
            name: 'drawn_at',
            type: 'text',
          },
          {
            name: 'expires_at',
            type: 'text',
          },
          {
            name: 'redeemed_at',
            type: 'text',
          },
          {
            name: 'total_participants',
            type: 'number',
          },
          {
            name: 'notes',
            type: 'text',
          },
          {
            name: 'created',
            type: 'autodate',
            onCreate: true,
            onUpdate: false,
          },
          {
            name: 'updated',
            type: 'autodate',
            onCreate: true,
            onUpdate: true,
          },
        ],
        indexes: [
          'CREATE INDEX idx_giveaways_store ON giveaways (store)',
          'CREATE INDEX idx_giveaways_status ON giveaways (status)',
          'CREATE INDEX idx_giveaways_winner ON giveaways (winner)',
        ],
      })
      app.save(giveaways)
    }

    // 4. Collection notifications (Notificações in-app para os clientes/usuários)
    try {
      app.findCollectionByNameOrId('notifications')
    } catch (_) {
      const notifications = new Collection({
        name: 'notifications',
        type: 'base',
        // Cliente vê e atualiza apenas suas próprias notificações
        listRule: "@request.auth.id != '' && user = @request.auth.id",
        viewRule: "@request.auth.id != '' && user = @request.auth.id",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != '' && user = @request.auth.id",
        deleteRule: "@request.auth.id != '' && user = @request.auth.id",
        fields: [
          {
            name: 'user',
            type: 'relation',
            collectionId: users.id,
            required: true,
            maxSelect: 1,
            cascadeDelete: true,
          },
          {
            name: 'store',
            type: 'relation',
            collectionId: stores.id,
            maxSelect: 1,
            cascadeDelete: true,
          },
          {
            name: 'type',
            type: 'select',
            values: ['giveaway_won', 'fidelity_reward', 'system'],
            maxSelect: 1,
            required: true,
          },
          {
            name: 'title',
            type: 'text',
            required: true,
          },
          {
            name: 'message',
            type: 'text',
            required: true,
          },
          {
            name: 'is_read',
            type: 'bool',
          },
          {
            name: 'data',
            type: 'json',
          },
          {
            name: 'created',
            type: 'autodate',
            onCreate: true,
            onUpdate: false,
          },
          {
            name: 'updated',
            type: 'autodate',
            onCreate: true,
            onUpdate: true,
          },
        ],
        indexes: [
          'CREATE INDEX idx_notifications_user ON notifications (user)',
          'CREATE INDEX idx_notifications_is_read ON notifications (is_read)',
        ],
      })
      app.save(notifications)
    }
  },
  (app) => {
    try {
      const notifs = app.findCollectionByNameOrId('notifications')
      if (notifs) app.delete(notifs)
    } catch (_) {}
    try {
      const giveaways = app.findCollectionByNameOrId('giveaways')
      if (giveaways) app.delete(giveaways)
    } catch (_) {}
    try {
      const storeCustomers = app.findCollectionByNameOrId('store_customers')
      if (storeCustomers) app.delete(storeCustomers)
    } catch (_) {}
  },
)

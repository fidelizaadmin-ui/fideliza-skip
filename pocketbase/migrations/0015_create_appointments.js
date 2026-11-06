// Agendamento de serviços: service_offerings, business_hours, appointments
// e o campo stores.appointments_enabled. Idempotente.
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const stores = app.findCollectionByNameOrId('stores')

    // 1. Campo de ativação na loja
    if (!stores.fields.getByName('appointments_enabled')) {
      stores.fields.add(new BoolField({ name: 'appointments_enabled' }))
      app.save(stores)
    }

    // 2. service_offerings (catálogo de serviços da loja)
    try {
      app.findCollectionByNameOrId('service_offerings')
    } catch (_) {
      const offerings = new Collection({
        name: 'service_offerings',
        type: 'base',
        // Leitura pública só de serviços ativos de lojas com agendamentos e portal ativos
        listRule:
          "(store.appointments_enabled = true && store.suspend_public != true && active = true) || (store.owner_id = @request.auth.id && store.suspend_merchant != true) || @request.auth.role = 'admin'",
        viewRule:
          "(store.appointments_enabled = true && store.suspend_public != true && active = true) || (store.owner_id = @request.auth.id && store.suspend_merchant != true) || @request.auth.role = 'admin'",
        createRule:
          "(store.owner_id = @request.auth.id && store.suspend_merchant != true) || @request.auth.role = 'admin'",
        updateRule:
          "(store.owner_id = @request.auth.id && store.suspend_merchant != true) || @request.auth.role = 'admin'",
        deleteRule:
          "(store.owner_id = @request.auth.id && store.suspend_merchant != true) || @request.auth.role = 'admin'",
        fields: [
          {
            name: 'store',
            type: 'relation',
            collectionId: stores.id,
            required: true,
            maxSelect: 1,
            cascadeDelete: true,
          },
          { name: 'name', type: 'text', required: true },
          { name: 'duration_minutes', type: 'number', required: true, min: 5, max: 480 },
          { name: 'price', type: 'number', min: 0 },
          { name: 'active', type: 'bool' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_service_offerings_store ON service_offerings (store)'],
      })
      app.save(offerings)
    }

    // 3. business_hours (períodos de atendimento da loja)
    try {
      app.findCollectionByNameOrId('business_hours')
    } catch (_) {
      const hours = new Collection({
        name: 'business_hours',
        type: 'base',
        listRule:
          "(store.appointments_enabled = true && store.suspend_public != true && active = true) || (store.owner_id = @request.auth.id && store.suspend_merchant != true) || @request.auth.role = 'admin'",
        viewRule:
          "(store.appointments_enabled = true && store.suspend_public != true && active = true) || (store.owner_id = @request.auth.id && store.suspend_merchant != true) || @request.auth.role = 'admin'",
        createRule:
          "(store.owner_id = @request.auth.id && store.suspend_merchant != true) || @request.auth.role = 'admin'",
        updateRule:
          "(store.owner_id = @request.auth.id && store.suspend_merchant != true) || @request.auth.role = 'admin'",
        deleteRule:
          "(store.owner_id = @request.auth.id && store.suspend_merchant != true) || @request.auth.role = 'admin'",
        fields: [
          {
            name: 'store',
            type: 'relation',
            collectionId: stores.id,
            required: true,
            maxSelect: 1,
            cascadeDelete: true,
          },
          { name: 'weekday', type: 'number', required: false, min: 0, max: 6 },
          { name: 'start_time', type: 'text', required: true },
          { name: 'end_time', type: 'text', required: true },
          { name: 'active', type: 'bool' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_business_hours_store ON business_hours (store)'],
      })
      app.save(hours)
    }

    // 4. appointments (agendamentos). Criação e cancelamento passam pelas rotas de pb_hooks,
    // que validam períodos, duração e conflitos. Por isso createRule e deleteRule ficam fechadas.
    try {
      app.findCollectionByNameOrId('appointments')
    } catch (_) {
      const service = app.findCollectionByNameOrId('service_offerings')
      const appointments = new Collection({
        name: 'appointments',
        type: 'base',
        listRule:
          "@request.auth.id != '' && (customer = @request.auth.id || (store.owner_id = @request.auth.id && store.suspend_merchant != true) || @request.auth.role = 'admin')",
        viewRule:
          "@request.auth.id != '' && (customer = @request.auth.id || (store.owner_id = @request.auth.id && store.suspend_merchant != true) || @request.auth.role = 'admin')",
        createRule: null,
        updateRule:
          "(store.owner_id = @request.auth.id && store.suspend_merchant != true) || @request.auth.role = 'admin'",
        deleteRule: null,
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
            name: 'service',
            type: 'relation',
            collectionId: service.id,
            required: true,
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'service_name', type: 'text' },
          { name: 'customer_name', type: 'text' },
          { name: 'customer_phone', type: 'text' },
          { name: 'date', type: 'text', required: true },
          { name: 'start_time', type: 'text', required: true },
          { name: 'end_time', type: 'text', required: true },
          {
            name: 'status',
            type: 'select',
            values: ['pending', 'confirmed', 'completed', 'cancelled'],
            maxSelect: 1,
            required: true,
          },
          { name: 'notes', type: 'text' },
          { name: 'cancel_reason', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_appointments_store_date ON appointments (store, date)',
          'CREATE INDEX idx_appointments_customer ON appointments (customer)',
        ],
      })
      app.save(appointments)
    }
  },
  (app) => {
    for (const name of ['appointments', 'business_hours', 'service_offerings']) {
      try {
        const c = app.findCollectionByNameOrId(name)
        if (c) app.delete(c)
      } catch (_) {}
    }
  },
)

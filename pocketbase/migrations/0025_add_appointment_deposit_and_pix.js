// pocketbase/migrations/0025_add_appointment_deposit_and_pix.js
// Adiciona campos para cobrança de sinal (%) e chave Pix do lojista na loja e nos agendamentos.

migrate(
  (app) => {
    // 1. Coleção stores: configurações do sinal e chave Pix do lojista
    const stores = app.findCollectionByNameOrId('stores')

    if (!stores.fields.getByName('appointment_deposit_enabled')) {
      stores.fields.add(
        new BoolField({
          name: 'appointment_deposit_enabled',
          required: false,
        }),
      )
    }

    if (!stores.fields.getByName('appointment_deposit_percent')) {
      stores.fields.add(
        new NumberField({
          name: 'appointment_deposit_percent',
          min: 0,
          max: 100,
          onlyInt: true,
          required: false,
        }),
      )
    }

    if (!stores.fields.getByName('appointment_pix_key_type')) {
      stores.fields.add(
        new SelectField({
          name: 'appointment_pix_key_type',
          values: ['cpf', 'cnpj', 'telefone', 'email', 'aleatoria'],
          maxSelect: 1,
          required: false,
        }),
      )
    }

    if (!stores.fields.getByName('appointment_pix_key')) {
      stores.fields.add(
        new TextField({
          name: 'appointment_pix_key',
          hidden: true,
          required: false,
        }),
      )
    }

    if (!stores.fields.getByName('appointment_pix_key_masked')) {
      stores.fields.add(
        new TextField({
          name: 'appointment_pix_key_masked',
          required: false,
        }),
      )
    }

    if (!stores.fields.getByName('appointment_pix_receiver_name')) {
      stores.fields.add(
        new TextField({
          name: 'appointment_pix_receiver_name',
          max: 25,
          required: false,
        }),
      )
    }

    if (!stores.fields.getByName('appointment_pix_receiver_city')) {
      stores.fields.add(
        new TextField({
          name: 'appointment_pix_receiver_city',
          max: 15,
          required: false,
        }),
      )
    }

    app.save(stores)

    // 2. Coleção appointments: campos de sinal e pagamento
    const appointments = app.findCollectionByNameOrId('appointments')

    if (!appointments.fields.getByName('deposit_required')) {
      appointments.fields.add(
        new BoolField({
          name: 'deposit_required',
          required: false,
        }),
      )
    }

    if (!appointments.fields.getByName('deposit_percent')) {
      appointments.fields.add(
        new NumberField({
          name: 'deposit_percent',
          min: 0,
          max: 100,
          onlyInt: true,
          required: false,
        }),
      )
    }

    if (!appointments.fields.getByName('deposit_amount')) {
      appointments.fields.add(
        new NumberField({
          name: 'deposit_amount',
          min: 0,
          required: false,
        }),
      )
    }

    if (!appointments.fields.getByName('deposit_status')) {
      appointments.fields.add(
        new SelectField({
          name: 'deposit_status',
          values: ['not_required', 'pending_payment', 'paid_pending_confirmation', 'confirmed'],
          maxSelect: 1,
          required: false,
        }),
      )
    }

    if (!appointments.fields.getByName('deposit_paid_at')) {
      appointments.fields.add(
        new TextField({
          name: 'deposit_paid_at',
          required: false,
        }),
      )
    }

    if (!appointments.fields.getByName('deposit_confirmed_at')) {
      appointments.fields.add(
        new TextField({
          name: 'deposit_confirmed_at',
          required: false,
        }),
      )
    }

    app.save(appointments)
  },
  (app) => {
    const stores = app.findCollectionByNameOrId('stores')
    const storeFieldsToRemove = [
      'appointment_deposit_enabled',
      'appointment_deposit_percent',
      'appointment_pix_key_type',
      'appointment_pix_key',
      'appointment_pix_key_masked',
      'appointment_pix_receiver_name',
      'appointment_pix_receiver_city',
    ]
    for (const name of storeFieldsToRemove) {
      const f = stores.fields.getByName(name)
      if (f) stores.fields.remove(f)
    }
    app.save(stores)

    const appointments = app.findCollectionByNameOrId('appointments')
    const apptFieldsToRemove = [
      'deposit_required',
      'deposit_percent',
      'deposit_amount',
      'deposit_status',
      'deposit_paid_at',
      'deposit_confirmed_at',
    ]
    for (const name of apptFieldsToRemove) {
      const f = appointments.fields.getByName(name)
      if (f) appointments.fields.remove(f)
    }
    app.save(appointments)
  },
)

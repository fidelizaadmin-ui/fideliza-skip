// Torna as relações com a loja em cascadeDelete nas coleções que não podem
// sobreviver sem a loja pai. Sem isso, excluir uma loja com pagamentos de
// assinatura falha no PocketBase ("cannot unlink relation", pois a relação é
// required) e o handler de exclusão do painel admin recebia o erro 400.
migrate(
  (app) => {
    // 1. subscription_payments.store → cascade (relação required, não pode ser desvinculada)
    const subPayments = app.findCollectionByNameOrId('subscription_payments')
    const spStore = subPayments.fields.getByName('store')
    if (spStore && !spStore.cascadeDelete) {
      spStore.cascadeDelete = true
      app.save(subPayments)
    }

    // 2. service_offerings.store → cascade (appointments/service já dependem da loja)
    const offerings = app.findCollectionByNameOrId('service_offerings')
    const ofStore = offerings.fields.getByName('store')
    if (ofStore && !ofStore.cascadeDelete) {
      ofStore.cascadeDelete = true
      app.save(offerings)
    }

    // 3. business_hours.store → cascade
    const hours = app.findCollectionByNameOrId('business_hours')
    const bhStore = hours.fields.getByName('store')
    if (bhStore && !bhStore.cascadeDelete) {
      bhStore.cascadeDelete = true
      app.save(hours)
    }

    // 4. appointments.store → cascade
    const appts = app.findCollectionByNameOrId('appointments')
    const apStore = appts.fields.getByName('store')
    if (apStore && !apStore.cascadeDelete) {
      apStore.cascadeDelete = true
      app.save(appts)
    }
  },
  (app) => {
    // Reverte apenas o subscription_payments (era o caso bloqueador real);
    // os demais já eram cascade ou ficam melhor com cascade.
    try {
      const subPayments = app.findCollectionByNameOrId('subscription_payments')
      const spStore = subPayments.fields.getByName('store')
      if (spStore) {
        spStore.cascadeDelete = false
        app.save(subPayments)
      }
    } catch (_) {}
  },
)

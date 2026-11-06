// Agendamento de serviços: campo de preço gravado no agendamento (cópia do preço do serviço
// no momento da reserva). Idempotente.
migrate(
  (app) => {
    const appointments = app.findCollectionByNameOrId('appointments')
    if (!appointments.fields.getByName('price')) {
      appointments.fields.add(new NumberField({ name: 'price', min: 0 }))
      app.save(appointments)
    }
  },
  (app) => {
    const appointments = app.findCollectionByNameOrId('appointments')
    if (appointments.fields.getByName('price')) {
      appointments.fields.removeByName('price')
      app.save(appointments)
    }
  },
)

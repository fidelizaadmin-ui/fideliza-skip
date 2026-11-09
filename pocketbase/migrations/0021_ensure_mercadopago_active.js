migrate(
  (app) => {
    try {
      // Localiza a credencial do Mercado Pago
      const mpRecords = app.findRecordsByFilter(
        'payment_credentials',
        'provider ~ "Mercado" || provider ~ "mercado"',
        '-updated',
        1,
        0,
      )
      if (mpRecords && mpRecords.length > 0) {
        const mpRec = mpRecords[0]
        mpRec.set('is_active', true)
        app.save(mpRec)

        // Desativa outras credenciais ativas para garantir um canal único prioritário
        const others = app.findRecordsByFilter(
          'payment_credentials',
          `id != "${mpRec.id}" && is_active = true`,
        )
        for (let i = 0; i < others.length; i++) {
          others[i].set('is_active', false)
          app.save(others[i])
        }
      }
    } catch (err) {
      console.warn('[Migration 0021] Aviso: ' + err.message)
    }
  },
  () => {},
)

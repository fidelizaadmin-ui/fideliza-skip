migrate(
  (app) => {
    const stores = app.findCollectionByNameOrId('stores')

    // 1. Add file fields for logo_file and banner_file if not already present
    if (!stores.fields.getByName('logo_file')) {
      stores.fields.add(
        new FileField({
          name: 'logo_file',
          maxSelect: 1,
          maxSize: 5242880, // 5MB
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        }),
      )
    }

    if (!stores.fields.getByName('banner_file')) {
      stores.fields.add(
        new FileField({
          name: 'banner_file',
          maxSelect: 1,
          maxSize: 10485760, // 10MB
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        }),
      )
    }

    // 2. Expand subscription_status values to include 'pending' (Aguardando confirmação)
    const subStatusField = stores.fields.getByName('subscription_status')
    if (subStatusField) {
      subStatusField.values = ['trial', 'active', 'overdue', 'cancelled', 'pending']
      subStatusField.maxSelect = 1
    }

    app.save(stores)
  },
  (app) => {
    const stores = app.findCollectionByNameOrId('stores')
    const logoFile = stores.fields.getByName('logo_file')
    if (logoFile) stores.fields.removeByName('logo_file')

    const bannerFile = stores.fields.getByName('banner_file')
    if (bannerFile) stores.fields.removeByName('banner_file')

    const subStatusField = stores.fields.getByName('subscription_status')
    if (subStatusField) {
      subStatusField.values = ['trial', 'active', 'overdue', 'cancelled']
      subStatusField.maxSelect = 1
    }

    app.save(stores)
  },
)

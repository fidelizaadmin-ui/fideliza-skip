migrate(
  (app) => {
    const stores = app.findCollectionByNameOrId('stores')

    // 1. Adicionar campo slug se ainda não existir
    if (!stores.fields.getByName('slug')) {
      stores.fields.add(
        new TextField({
          name: 'slug',
          required: false,
        }),
      )
      app.save(stores)
    }

    // 2. Backfill de slugs para lojas existentes que ainda não têm slug
    function sanitizeSlug(raw) {
      if (!raw) return 'loja'
      let s = String(raw)
        .toLowerCase()
        .trim()
        .replace(/[àáâãäå]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõö]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/[ñ]/g, 'n')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      if (!s) s = 'loja'
      return s
    }

    const records = app.findRecordsByFilter('stores', '1=1', 'created', 0, 0)
    const usedSlugs = {}

    for (let i = 0; i < records.length; i++) {
      const rec = records[i]
      const currentSlug = rec.getString('slug')
      if (currentSlug && currentSlug.trim() !== '') {
        usedSlugs[currentSlug.trim()] = true
        continue
      }

      const base = sanitizeSlug(rec.getString('name') || 'loja')
      let candidate = base
      let counter = 2
      while (usedSlugs[candidate]) {
        candidate = base + '-' + counter
        counter++
      }

      rec.set('slug', candidate)
      app.save(rec)
      usedSlugs[candidate] = true
    }

    // 3. Adicionar índice único em slug
    try {
      const reloadedStores = app.findCollectionByNameOrId('stores')
      reloadedStores.addIndex('idx_stores_slug', true, 'slug', '')
      app.save(reloadedStores)
    } catch (err) {
      console.log('Notice adding idx_stores_slug:', err)
    }
  },
  (app) => {
    const stores = app.findCollectionByNameOrId('stores')
    try {
      stores.removeIndex('idx_stores_slug')
    } catch (_) {}
    if (stores.fields.getByName('slug')) {
      stores.fields.removeByName('slug')
    }
    app.save(stores)
  },
)

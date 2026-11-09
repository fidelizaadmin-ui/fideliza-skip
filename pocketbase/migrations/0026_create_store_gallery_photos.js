// pocketbase/migrations/0026_create_store_gallery_photos.js
// Coleção de fotos de galeria das lojas para divulgação de produtos e serviços.
migrate(
  (app) => {
    const stores = app.findCollectionByNameOrId('stores')

    try {
      app.findCollectionByNameOrId('store_gallery_photos')
    } catch (_) {
      const gallery = new Collection({
        name: 'store_gallery_photos',
        type: 'base',
        // Visualização e listagem públicas quando a loja não estiver com suspend_public ativado
        listRule:
          "store.suspend_public != true || store.owner_id = @request.auth.id || @request.auth.role = 'admin'",
        viewRule:
          "store.suspend_public != true || store.owner_id = @request.auth.id || @request.auth.role = 'admin'",
        // Criação, atualização e exclusão permitidas para o lojista dono da loja (e admin)
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
          {
            name: 'photo_file',
            type: 'file',
            maxSelect: 1,
            maxSize: 10485760, // 10MB
            mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
            required: true,
          },
          {
            name: 'title',
            type: 'text',
            max: 120,
            required: false,
          },
          {
            name: 'sort_order',
            type: 'number',
            min: 0,
            required: false,
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
          'CREATE INDEX idx_store_gallery_photos_store ON store_gallery_photos (store)',
          'CREATE INDEX idx_store_gallery_photos_created ON store_gallery_photos (store, created)',
        ],
      })
      app.save(gallery)
    }
  },
  (app) => {
    try {
      const gallery = app.findCollectionByNameOrId('store_gallery_photos')
      app.delete(gallery)
    } catch (_) {}
  },
)

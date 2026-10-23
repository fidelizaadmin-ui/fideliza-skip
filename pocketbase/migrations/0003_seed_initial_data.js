migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const subscriptionPlansCol = app.findCollectionByNameOrId('subscription_plans')
    const storesCol = app.findCollectionByNameOrId('stores')
    const fidelityPlansCol = app.findCollectionByNameOrId('fidelity_plans')
    const customerCardsCol = app.findCollectionByNameOrId('customer_cards')
    const purchasesCol = app.findCollectionByNameOrId('purchases')

    // 1. Seed Subscription Plans (Admin defined)
    const plansData = [
      {
        name: 'Plano Mensal',
        slug: 'mensal',
        price: 69.9,
        billing_interval_months: 1,
        trial_days: 14,
        description: 'Ideal para lojas iniciando programa de fidelidade com flexibilidade.',
        features: JSON.stringify([
          '1 loja inclusa',
          'Selos, pontos ou cashback',
          'Até 500 clientes fidelizados',
          'Suporte padrão',
        ]),
        is_active: true,
      },
      {
        name: 'Plano Semestral',
        slug: 'semestral',
        price: 359.4, // ~59.90/mês
        billing_interval_months: 6,
        trial_days: 14,
        description: 'Economia de 15% para fidelizar clientes no médio prazo.',
        features: JSON.stringify([
          '1 loja inclusa',
          'Módulos completos de fidelidade',
          'Até 2.000 clientes',
          'Relatórios detalhados',
          'Suporte prioritário',
        ]),
        is_active: true,
      },
      {
        name: 'Plano Anual',
        slug: 'anual',
        price: 598.8, // ~49.90/mês
        billing_interval_months: 12,
        trial_days: 30,
        description: 'Melhor custo-benefício com 30 dias de teste grátis e maior desconto.',
        features: JSON.stringify([
          '1 loja inclusa',
          'Clientes ilimitados',
          'Todos os modelos de pontuação',
          'Destaque no portal público',
          'Suporte VIP via WhatsApp',
        ]),
        is_active: true,
      },
    ]

    const createdPlans = []
    for (const p of plansData) {
      try {
        const existing = app.findFirstRecordByData('subscription_plans', 'slug', p.slug)
        createdPlans.push(existing)
      } catch (_) {
        const rec = new Record(subscriptionPlansCol)
        rec.set('name', p.name)
        rec.set('slug', p.slug)
        rec.set('price', p.price)
        rec.set('billing_interval_months', p.billing_interval_months)
        rec.set('trial_days', p.trial_days)
        rec.set('description', p.description)
        rec.set('features', p.features)
        rec.set('is_active', p.is_active)
        app.save(rec)
        createdPlans.push(rec)
      }
    }

    // 2. Seed Admin User: angelo.marcos_silva@hotmail.com
    let adminUser
    try {
      adminUser = app.findAuthRecordByEmail('_pb_users_auth_', 'angelo.marcos_silva@hotmail.com')
      adminUser.set('role', 'admin')
      adminUser.set('name', 'Administrador Fideliza')
      app.save(adminUser)
    } catch (_) {
      adminUser = new Record(users)
      adminUser.setEmail('angelo.marcos_silva@hotmail.com')
      adminUser.setPassword('Skip@Pass')
      adminUser.setVerified(true)
      adminUser.set('name', 'Administrador Fideliza')
      adminUser.set('role', 'admin')
      app.save(adminUser)
    }

    // 3. Seed Merchant User
    let merchantUser
    try {
      merchantUser = app.findAuthRecordByEmail('_pb_users_auth_', 'lojista@fideliza.com')
    } catch (_) {
      merchantUser = new Record(users)
      merchantUser.setEmail('lojista@fideliza.com')
      merchantUser.setPassword('Skip@Pass')
      merchantUser.setVerified(true)
      merchantUser.set('name', 'Carlos Lojista')
      merchantUser.set('role', 'merchant')
      merchantUser.set('phone', '(11) 98765-4321')
      app.save(merchantUser)
    }

    // 3b. Seed 2nd Merchant User
    let merchantUser2
    try {
      merchantUser2 = app.findAuthRecordByEmail('_pb_users_auth_', 'padaria@fideliza.com')
    } catch (_) {
      merchantUser2 = new Record(users)
      merchantUser2.setEmail('padaria@fideliza.com')
      merchantUser2.setPassword('Skip@Pass')
      merchantUser2.setVerified(true)
      merchantUser2.set('name', 'Marina Padaria Artesanal')
      merchantUser2.set('role', 'merchant')
      merchantUser2.set('phone', '(11) 97654-3210')
      app.save(merchantUser2)
    }

    // 4. Seed Customer User
    let customerUser
    try {
      customerUser = app.findAuthRecordByEmail('_pb_users_auth_', 'cliente@fideliza.com')
    } catch (_) {
      customerUser = new Record(users)
      customerUser.setEmail('cliente@fideliza.com')
      customerUser.setPassword('Skip@Pass')
      customerUser.setVerified(true)
      customerUser.set('name', 'Juliana Silva')
      customerUser.set('role', 'customer')
      customerUser.set('customer_code', 'CLI-7842')
      customerUser.set('phone', '(11) 99123-4567')
      app.save(customerUser)
    }

    // 5. Seed Stores
    // Store 1: Burger House (Points) - Approved
    let store1
    try {
      store1 = app.findFirstRecordByData('stores', 'name', 'Burger & Brew House')
    } catch (_) {
      store1 = new Record(storesCol)
      store1.set('owner_id', merchantUser.id)
      store1.set('name', 'Burger & Brew House')
      store1.set('category', 'Alimentação')
      store1.set(
        'description',
        'Hamburgueria artesanal com blends especiais e cervejas selecionadas. Junte pontos e ganhe lanches!',
      )
      store1.set('address', 'Rua Augusta, 1420 - Consolação')
      store1.set('city', 'São Paulo - SP')
      store1.set('phone', '(11) 3255-8900')
      store1.set('logo_url', 'https://img.usecurling.com/p/200/200?q=burger&color=orange')
      store1.set(
        'banner_url',
        'https://img.usecurling.com/p/800/400?q=burger+restaurant&color=black',
      )
      store1.set('approval_status', 'approved')
      store1.set('subscription_plan_id', createdPlans[0].id)
      store1.set('subscription_status', 'active')
      store1.set('subscription_expires_at', '2026-12-31')
      app.save(store1)
    }

    // Fidelity Plan for Store 1: Points
    try {
      app.findFirstRecordByData('fidelity_plans', 'store_id', store1.id)
    } catch (_) {
      const fp1 = new Record(fidelityPlansCol)
      fp1.set('store_id', store1.id)
      fp1.set('type', 'points')
      fp1.set('title', 'Clube Burger Pontos')
      fp1.set(
        'description',
        'Ganhe 1 ponto a cada R$ 1,00 gasto. Com 150 pontos você ganha um Combo Especial!',
      )
      fp1.set('points_per_currency', 1)
      fp1.set('points_to_redeem', 150)
      fp1.set('reward_title', '1 Combo Smash Burger + Batata Rústica')
      fp1.set('reward_description', 'Válido de terça a domingo em qualquer unidade.')
      fp1.set('is_active', true)
      app.save(fp1)
    }

    // Store 2: Bella Cafeteria e Padaria (Stamps) - Approved
    let store2
    try {
      store2 = app.findFirstRecordByData('stores', 'name', 'Bella Cafeteria & Pães')
    } catch (_) {
      store2 = new Record(storesCol)
      store2.set('owner_id', merchantUser2.id)
      store2.set('name', 'Bella Cafeteria & Pães')
      store2.set('category', 'Alimentação')
      store2.set(
        'description',
        'Cafés especiais, pães de fermentação natural e doces finos. Cartão fidelidade de 10 selos!',
      )
      store2.set('address', 'Av. Paulista, 900 - Bela Vista')
      store2.set('city', 'São Paulo - SP')
      store2.set('phone', '(11) 3144-5500')
      store2.set('logo_url', 'https://img.usecurling.com/p/200/200?q=coffee+croissant&color=yellow')
      store2.set('banner_url', 'https://img.usecurling.com/p/800/400?q=bakery+coffee&color=orange')
      store2.set('approval_status', 'approved')
      store2.set('subscription_plan_id', createdPlans[1].id)
      store2.set('subscription_status', 'active')
      store2.set('subscription_expires_at', '2026-11-30')
      app.save(store2)
    }

    // Fidelity Plan for Store 2: Stamps
    try {
      app.findFirstRecordByData('fidelity_plans', 'store_id', store2.id)
    } catch (_) {
      const fp2 = new Record(fidelityPlansCol)
      fp2.set('store_id', store2.id)
      fp2.set('type', 'stamps')
      fp2.set('title', 'Cartão 10 Selos de Café')
      fp2.set(
        'description',
        'A cada R$ 20 em compras ganhe 1 selo no cartão. Junte 10 selos e ganhe café + bolo artesanal!',
      )
      fp2.set('target_stamps', 10)
      fp2.set('min_purchase_amount', 20)
      fp2.set('reward_title', 'Cappuccino Especial + Fatia de Bolo da Casa')
      fp2.set('reward_description', 'Apresente seu cartão digital no caixa.')
      fp2.set('is_active', true)
      app.save(fp2)
    }

    // Store 3: Studio Elegance Cabelo e Estética (Cashback) - Approved
    let store3
    try {
      store3 = app.findFirstRecordByData('stores', 'name', 'Studio Elegance Beleza')
    } catch (_) {
      store3 = new Record(storesCol)
      store3.set('owner_id', merchantUser.id)
      store3.set('name', 'Studio Elegance Beleza')
      store3.set('category', 'Beleza & Estética')
      store3.set(
        'description',
        'Salão de beleza completo, manicure e estética facial. Acumule 8% de volta em todas as sessões!',
      )
      store3.set('address', 'Rua Oscar Freire, 320 - Jardins')
      store3.set('city', 'São Paulo - SP')
      store3.set('phone', '(11) 3081-2200')
      store3.set('logo_url', 'https://img.usecurling.com/p/200/200?q=beauty+salon&color=pink')
      store3.set('banner_url', 'https://img.usecurling.com/p/800/400?q=hair+salon&color=purple')
      store3.set('approval_status', 'approved')
      store3.set('subscription_plan_id', createdPlans[2].id)
      store3.set('subscription_status', 'trial')
      store3.set('subscription_expires_at', '2026-05-15')
      app.save(store3)
    }

    // Fidelity Plan for Store 3: Cashback
    try {
      app.findFirstRecordByData('fidelity_plans', 'store_id', store3.id)
    } catch (_) {
      const fp3 = new Record(fidelityPlansCol)
      fp3.set('store_id', store3.id)
      fp3.set('type', 'cashback')
      fp3.set('title', 'Cashback Studio VIP')
      fp3.set(
        'description',
        'Receba 8% de cashback direto no seu saldo para abater em qualquer serviço futuro.',
      )
      fp3.set('cashback_percentage', 8)
      fp3.set('reward_title', 'Saldo de Cashback acumulado para desconto em serviços')
      fp3.set('is_active', true)
      app.save(fp3)
    }

    // Store 4: Pet Care & Boutique (Pending approval demo)
    try {
      app.findFirstRecordByData('stores', 'name', 'Pet Care & Boutique')
    } catch (_) {
      const store4 = new Record(storesCol)
      store4.set('owner_id', merchantUser2.id)
      store4.set('name', 'Pet Care & Boutique')
      store4.set('category', 'Pet Shop')
      store4.set('description', 'Banho, tosa, veterinário e acessórios premium para seu pet.')
      store4.set('address', 'Alameda dos Anapurus, 800 - Moema')
      store4.set('city', 'São Paulo - SP')
      store4.set('phone', '(11) 5051-7788')
      store4.set('logo_url', 'https://img.usecurling.com/p/200/200?q=dog+pet&color=blue')
      store4.set('approval_status', 'pending')
      store4.set('subscription_plan_id', createdPlans[0].id)
      store4.set('subscription_status', 'trial')
      app.save(store4)
    }

    // 6. Customer Cards for the seeded customer (Juliana)
    let card1
    try {
      const existing = app.findRecordsByFilter(
        'customer_cards',
        `customer_id = "${customerUser.id}" && store_id = "${store1.id}"`,
        '',
        1,
        0,
      )
      if (existing.length > 0) card1 = existing[0]
    } catch (_) {}

    if (!card1) {
      card1 = new Record(customerCardsCol)
      card1.set('customer_id', customerUser.id)
      card1.set('store_id', store1.id)
      card1.set('stamps_count', 0)
      card1.set('points_balance', 120)
      card1.set('cashback_balance', 0)
      card1.set('total_purchases_count', 4)
      card1.set('total_spent', 120.0)
      card1.set('rewards_redeemed_count', 0)
      app.save(card1)
    }

    let card2
    try {
      const existing = app.findRecordsByFilter(
        'customer_cards',
        `customer_id = "${customerUser.id}" && store_id = "${store2.id}"`,
        '',
        1,
        0,
      )
      if (existing.length > 0) card2 = existing[0]
    } catch (_) {}

    if (!card2) {
      card2 = new Record(customerCardsCol)
      card2.set('customer_id', customerUser.id)
      card2.set('store_id', store2.id)
      card2.set('stamps_count', 7)
      card2.set('points_balance', 0)
      card2.set('cashback_balance', 0)
      card2.set('total_purchases_count', 7)
      card2.set('total_spent', 154.0)
      card2.set('rewards_redeemed_count', 0)
      app.save(card2)
    }

    let card3
    try {
      const existing = app.findRecordsByFilter(
        'customer_cards',
        `customer_id = "${customerUser.id}" && store_id = "${store3.id}"`,
        '',
        1,
        0,
      )
      if (existing.length > 0) card3 = existing[0]
    } catch (_) {}

    if (!card3) {
      card3 = new Record(customerCardsCol)
      card3.set('customer_id', customerUser.id)
      card3.set('store_id', store3.id)
      card3.set('stamps_count', 0)
      card3.set('points_balance', 0)
      card3.set('cashback_balance', 24.5)
      card3.set('total_purchases_count', 2)
      card3.set('total_spent', 306.25)
      card3.set('rewards_redeemed_count', 0)
      app.save(card3)
    }

    // 7. Seed Sample Purchases
    try {
      const count = app.countRecords('purchases')
      if (count === 0) {
        const p1 = new Record(purchasesCol)
        p1.set('store_id', store1.id)
        p1.set('customer_id', customerUser.id)
        p1.set('type', 'purchase')
        p1.set('amount', 45.0)
        p1.set('points_earned', 45)
        p1.set('notes', 'Combo Burger duplo + batata')
        app.save(p1)

        const p2 = new Record(purchasesCol)
        p2.set('store_id', store2.id)
        p2.set('customer_id', customerUser.id)
        p2.set('type', 'purchase')
        p2.set('amount', 22.0)
        p2.set('stamps_earned', 1)
        p2.set('notes', 'Café especial + croissant')
        app.save(p2)

        const p3 = new Record(purchasesCol)
        p3.set('store_id', store3.id)
        p3.set('customer_id', customerUser.id)
        p3.set('type', 'purchase')
        p3.set('amount', 180.0)
        p3.set('cashback_earned', 14.4)
        p3.set('notes', 'Corte e hidratação capilar')
        app.save(p3)
      }
    } catch (_) {}
  },
  (app) => {
    // Idempotent down migration
  },
)

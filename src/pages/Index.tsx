import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getApprovedStores,
  getStoreFidelityPlan,
  getCustomerCardForStore,
} from '@/services/fidelityService'
import type { StoreRecord, StoreCategory, FidelityPlanRecord, CustomerCardRecord } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Search,
  MapPin,
  Sparkles,
  Award,
  Coins,
  Percent,
  CheckCircle2,
  Store,
  ArrowRight,
  Gift,
  Phone,
  Clock,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'

const CATEGORIES: ('Todas' | StoreCategory)[] = [
  'Todas',
  'Alimentação',
  'Moda & Acessórios',
  'Beleza & Estética',
  'Saúde & Bem-Estar',
  'Pet Shop',
  'Serviços',
  'Supermercado',
  'Outros',
]

export default function Index() {
  const navigate = useNavigate()
  const { user, isAuthenticated, role } = useAuth()

  const [stores, setStores] = useState<StoreRecord[]>([])
  const [plansMap, setPlansMap] = useState<Record<string, FidelityPlanRecord | null>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'Todas' | StoreCategory>('Todas')
  const [isLoading, setIsLoading] = useState(true)

  // Modal store details
  const [activeStore, setActiveStore] = useState<StoreRecord | null>(null)
  const [activePlan, setActivePlan] = useState<FidelityPlanRecord | null>(null)
  const [activeCustomerCard, setActiveCustomerCard] = useState<CustomerCardRecord | null>(null)
  const [isLoadingModal, setIsLoadingModal] = useState(false)

  useEffect(() => {
    loadStores()
  }, [selectedCategory])

  const loadStores = async (query = searchTerm) => {
    setIsLoading(true)
    try {
      const data = await getApprovedStores(query, selectedCategory)
      setStores(data)

      // Load fidelity plan info for each store in parallel
      const planPromises = data.map(async (st) => {
        const plan = await getStoreFidelityPlan(st.id)
        return { storeId: st.id, plan }
      })

      const plansResults = await Promise.all(planPromises)
      const newPlansMap: Record<string, FidelityPlanRecord | null> = {}
      plansResults.forEach((res) => {
        newPlansMap[res.storeId] = res.plan
      })
      setPlansMap(newPlansMap)
    } catch (err) {
      console.error('Error loading stores:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loadStores(searchTerm)
  }

  const handleOpenStore = async (store: StoreRecord) => {
    setActiveStore(store)
    setIsLoadingModal(true)
    try {
      const plan = await getStoreFidelityPlan(store.id)
      setActivePlan(plan)

      if (user && role === 'customer') {
        const card = await getCustomerCardForStore(user.id, store.id)
        setActiveCustomerCard(card)
      } else {
        setActiveCustomerCard(null)
      }
    } catch (err) {
      console.error('Error fetching details for store:', err)
    } finally {
      setIsLoadingModal(false)
    }
  }

  const renderPlanBadge = (plan: FidelityPlanRecord | null) => {
    if (!plan) {
      return <span className="text-xs text-slate-400 italic">Programa em breve</span>
    }

    if (plan.type === 'stamps') {
      return (
        <Badge className="bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300 gap-1 font-semibold text-xs">
          <Award className="w-3.5 h-3.5 text-amber-600" />
          {plan.target_stamps || 10} Selos = Brinde
        </Badge>
      )
    }

    if (plan.type === 'points') {
      return (
        <Badge className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 border-indigo-300 gap-1 font-semibold text-xs">
          <Coins className="w-3.5 h-3.5 text-indigo-600" />
          {plan.points_per_currency || 1} pt/R$ • Resgate {plan.points_to_redeem} pts
        </Badge>
      )
    }

    return (
      <Badge className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-300 gap-1 font-semibold text-xs">
        <Percent className="w-3.5 h-3.5 text-emerald-600" />
        {plan.cashback_percentage || 5}% de Cashback
      </Badge>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 text-white pt-16 pb-20 px-4">
        {/* Glow effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto max-w-5xl relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-amber-300 mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Fidelize clientes e ganhe recompensas em lojas locais</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight sm:leading-tight mb-5">
            Suas compras valem <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-400 bg-clip-text text-transparent">
              Selos, Pontos e Cashback
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
            Descubra estabelecimentos parceiros pelo nome ou categoria, acumule benefícios a cada
            compra com seu código digital e resgate prêmios incríveis.
          </p>

          {/* SEARCH BAR */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-2xl mx-auto bg-white rounded-2xl p-2 sm:p-2.5 shadow-2xl shadow-rose-950/40 border border-slate-200 flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1 flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5" />
              <Input
                type="text"
                placeholder="Busque por nome da loja, lanches, salão, etc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 pr-4 py-6 text-slate-900 placeholder:text-slate-400 bg-transparent border-0 focus-visible:ring-0 text-sm sm:text-base font-medium shadow-none"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold px-7 rounded-xl shadow-md shadow-rose-600/30"
            >
              Pesquisar
            </Button>
          </form>

          {/* Quick Stats / Highlights */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-xl mx-auto mt-12 pt-8 border-t border-white/10 text-center">
            <div>
              <p className="text-xl sm:text-2xl font-extrabold text-amber-400">100%</p>
              <p className="text-xs text-slate-400">Digital sem cartão de papel</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-extrabold text-rose-400">3 Modelos</p>
              <p className="text-xs text-slate-400">Selos, Pontos ou Cashback</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-extrabold text-indigo-400">Imediato</p>
              <p className="text-xs text-slate-400">Acúmulo no ato da compra</p>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY BAR (iFood-like) */}
      <section className="sticky top-16 z-30 bg-white border-b shadow-xs">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs sm:text-sm">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all duration-200 ${
                  selectedCategory === cat
                    ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* STORES LISTING SECTION */}
      <section className="container mx-auto px-4 py-10 flex-1">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Store className="w-6 h-6 text-rose-600" />
              Lojas Parceiras {selectedCategory !== 'Todas' && `• ${selectedCategory}`}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Acumule benefícios mostrando seu código de cliente no caixa
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
            <span>
              {stores.length} {stores.length === 1 ? 'loja encontrada' : 'lojas encontradas'}
            </span>
          </div>
        </div>

        {/* LOADING STATE */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="h-80 rounded-2xl bg-slate-100 animate-pulse border border-slate-200"
              />
            ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {!isLoading && stores.length === 0 && (
          <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-300 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Nenhuma loja encontrada</h3>
            <p className="text-sm text-slate-500 mb-6">
              Tente alterar o termo de busca ou selecione outra categoria acima.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('Todas')
                loadStores('')
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        )}

        {/* STORES GRID */}
        {!isLoading && stores.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => {
              const plan = plansMap[store.id] || null
              return (
                <Card
                  key={store.id}
                  className="group overflow-hidden rounded-2xl border-slate-200 bg-white hover:shadow-xl hover:border-rose-200 transition-all duration-300 cursor-pointer flex flex-col"
                  onClick={() => handleOpenStore(store)}
                >
                  {/* Banner Image */}
                  <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                    {store.banner_url ? (
                      <img
                        src={store.banner_url}
                        alt={store.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-slate-200 to-slate-100 flex items-center justify-center">
                        <Store className="w-12 h-12 text-slate-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Category pill */}
                    <Badge className="absolute top-3 left-3 bg-white/90 text-slate-800 backdrop-blur-md border-0 text-xs font-semibold">
                      {store.category}
                    </Badge>

                    {/* Logo avatar */}
                    <div className="absolute -bottom-4 left-4 w-14 h-14 rounded-xl border-2 border-white shadow-md overflow-hidden bg-white">
                      {store.logo_url ? (
                        <img src={store.logo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-rose-600 text-white font-bold flex items-center justify-center text-lg">
                          {store.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <CardContent className="pt-6 p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-1">
                          {store.name}
                        </h3>
                      </div>

                      {store.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                          {store.description}
                        </p>
                      )}

                      {store.address && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {store.address} {store.city ? `• ${store.city}` : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Loyalty program highlight footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>{renderPlanBadge(plan)}</div>
                      <span className="text-xs font-bold text-rose-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                        Ver detalhes <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* CALL TO ACTION: FOR MERCHANTS & CUSTOMERS */}
      <section className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <Badge className="bg-amber-400/20 text-amber-300 border-amber-400/30 font-semibold">
                Área do Lojista
              </Badge>
              <h2 className="text-3xl font-black tracking-tight leading-snug">
                Fidelize seus clientes e aumente suas vendas recorrentes
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Crie seu plano de fidelidade digital em minutos. Escolha selos, pontos ou cashback,
                registre compras digitando o código do cliente e gerencie seus resultados com
                relatórios em tempo real.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <Button
                  onClick={() => navigate('/cadastro?tipo=lojista')}
                  className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold shadow-md shadow-rose-500/20"
                >
                  Cadastrar Minha Loja
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/planos')}
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                >
                  Ver Planos de Assinatura
                </Button>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 space-y-4">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Gift className="w-5 h-5 text-rose-400" /> Vantagens para o seu negócio
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    Substitua cartões de papel que os clientes perdem por um cartão digital moderno
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    Flexibilidade total: defina se quer selos de café, pontos ou cashback em %
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Destaque no portal público para atrair novos clientes na sua região</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    Período de teste grátis aprovado pelo administrador sem fidelidade obrigatória
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* STORE DETAILS MODAL */}
      <Dialog open={!!activeStore} onOpenChange={(open) => !open && setActiveStore(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl max-h-[90vh] overflow-y-auto">
          {activeStore && (
            <div>
              {/* Banner */}
              <div className="relative h-44 w-full bg-slate-900">
                {activeStore.banner_url ? (
                  <img src={activeStore.banner_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-slate-900 to-rose-900 flex items-center justify-center">
                    <Store className="w-16 h-16 text-white/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-white p-0.5 shadow-xl shrink-0 overflow-hidden">
                    {activeStore.logo_url ? (
                      <img
                        src={activeStore.logo_url}
                        alt=""
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <div className="w-full h-full bg-rose-600 text-white font-black text-xl flex items-center justify-center rounded-xl">
                        {activeStore.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="text-white">
                    <Badge className="bg-rose-500/80 text-white text-[10px] font-bold mb-1 border-0">
                      {activeStore.category}
                    </Badge>
                    <h2 className="text-xl sm:text-2xl font-black leading-tight drop-shadow-sm">
                      {activeStore.name}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Description */}
                {activeStore.description && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Sobre a Loja
                    </h4>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {activeStore.description}
                    </p>
                  </div>
                )}

                {/* Contact & Location info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs">
                  {activeStore.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-800">Endereço</p>
                        <p className="text-slate-600">{activeStore.address}</p>
                        {activeStore.city && <p className="text-slate-500">{activeStore.city}</p>}
                      </div>
                    </div>
                  )}

                  {activeStore.phone && (
                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-800">Telefone / Contato</p>
                        <p className="text-slate-600">{activeStore.phone}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* FIDELITY PROGRAM SECTION */}
                <div className="border border-rose-100 bg-gradient-to-br from-rose-50/50 to-amber-50/50 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                      <Gift className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-base">
                        Programa de Fidelidade Oficial
                      </h3>
                      <p className="text-xs text-slate-500">Como acumular benefícios nesta loja</p>
                    </div>
                  </div>

                  {isLoadingModal ? (
                    <div className="h-20 bg-white/50 animate-pulse rounded-xl" />
                  ) : activePlan ? (
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-xl border border-rose-200/60 shadow-xs">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-slate-800 text-sm">
                            {activePlan.title}
                          </span>
                          {renderPlanBadge(activePlan)}
                        </div>

                        {activePlan.description && (
                          <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                            {activePlan.description}
                          </p>
                        )}

                        {/* Specific rules preview */}
                        {activePlan.type === 'stamps' && (
                          <div className="text-xs bg-amber-50 text-amber-900 p-3 rounded-lg border border-amber-200 space-y-1">
                            <p className="font-bold">Regra de Acúmulo:</p>
                            <p>
                              • A cada R$ {(activePlan.min_purchase_amount || 1).toFixed(2)} em
                              compras = 1 selo.
                            </p>
                            <p>• Meta para resgatar: {activePlan.target_stamps || 10} selos.</p>
                            {activePlan.reward_title && (
                              <p className="pt-1 font-bold text-amber-800">
                                🎁 Recompensa: {activePlan.reward_title}
                              </p>
                            )}
                          </div>
                        )}

                        {activePlan.type === 'points' && (
                          <div className="text-xs bg-indigo-50 text-indigo-900 p-3 rounded-lg border border-indigo-200 space-y-1">
                            <p className="font-bold">Regra de Acúmulo:</p>
                            <p>• R$ 1,00 gasto = {activePlan.points_per_currency || 1} ponto(s).</p>
                            <p>
                              • Meta para resgatar: {activePlan.points_to_redeem || 100} pontos.
                            </p>
                            {activePlan.reward_title && (
                              <p className="pt-1 font-bold text-indigo-800">
                                🎁 Recompensa: {activePlan.reward_title}
                              </p>
                            )}
                          </div>
                        )}

                        {activePlan.type === 'cashback' && (
                          <div className="text-xs bg-emerald-50 text-emerald-900 p-3 rounded-lg border border-emerald-200 space-y-1">
                            <p className="font-bold">Regra de Acúmulo:</p>
                            <p>
                              • Receba {activePlan.cashback_percentage || 5}% do valor gasto de
                              volta no seu saldo digital.
                            </p>
                            <p>• Use o saldo para abater em qualquer compra futura nesta loja!</p>
                          </div>
                        )}
                      </div>

                      {/* Customer's current balance if logged in */}
                      {isAuthenticated && role === 'customer' && (
                        <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                          <div>
                            <p className="text-xs text-slate-400">Seu saldo atual nesta loja:</p>
                            <p className="text-lg font-black text-amber-400">
                              {activePlan.type === 'stamps' &&
                                `${activeCustomerCard?.stamps_count || 0} / ${activePlan.target_stamps || 10} Selos`}
                              {activePlan.type === 'points' &&
                                `${activeCustomerCard?.points_balance || 0} Pontos`}
                              {activePlan.type === 'cashback' &&
                                `R$ ${(activeCustomerCard?.cashback_balance || 0).toFixed(2)} de Cashback`}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              setActiveStore(null)
                              navigate('/cliente')
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                          >
                            Abrir Meu Cartão
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-white/60 rounded-xl text-xs text-slate-500">
                      Esta loja está cadastrando seu plano de fidelidade. Volte em breve!
                    </div>
                  )}
                </div>

                {/* Action footer in modal */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  {!isAuthenticated ? (
                    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-100 p-3.5 rounded-xl">
                      <span className="text-xs text-slate-600">
                        Crie sua conta gratuita para acumular nesta loja:
                      </span>
                      <Button
                        size="sm"
                        onClick={() => navigate('/cadastro')}
                        className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                      >
                        Criar Conta de Cliente
                      </Button>
                    </div>
                  ) : role === 'customer' ? (
                    <div className="w-full flex items-center justify-between bg-emerald-50 text-emerald-900 p-3 rounded-xl border border-emerald-200">
                      <span className="text-xs font-semibold">
                        Apresente seu código{' '}
                        <span className="font-mono font-bold bg-white px-2 py-0.5 rounded text-emerald-800">
                          {user?.customer_code}
                        </span>{' '}
                        no caixa
                      </span>
                      <Button
                        size="sm"
                        onClick={() => navigate('/cliente')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                      >
                        Ver Cartão
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  getMerchantStore,
  createStore,
  updateStore,
  getStoreFidelityPlan,
  saveFidelityPlan,
  getStorePurchases,
  getSubscriptionPlans,
  findCustomerByCodeOrEmail,
  getCustomerCardForStore,
  registerPurchase,
  redeemReward,
} from '@/services/fidelityService'
import type {
  StoreRecord,
  FidelityPlanRecord,
  PurchaseRecord,
  SubscriptionPlanRecord,
  CustomerCardRecord,
  UserRecord,
  StoreCategory,
  FidelityType,
} from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Store,
  Award,
  Coins,
  Percent,
  PlusCircle,
  TrendingUp,
  ShoppingBag,
  Gift,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  Search,
  UserCheck,
  CreditCard,
  QrCode,
  DollarSign,
  Loader2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const CATEGORIES: StoreCategory[] = [
  'Alimentação',
  'Moda & Acessórios',
  'Beleza & Estética',
  'Saúde & Bem-Estar',
  'Pet Shop',
  'Serviços',
  'Supermercado',
  'Outros',
]

export default function MerchantDashboard() {
  const { user, role, isAuthenticated, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [store, setStore] = useState<StoreRecord | null>(null)
  const [plan, setPlan] = useState<FidelityPlanRecord | null>(null)
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([])
  const [subPlans, setSubPlans] = useState<SubscriptionPlanRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Store form state
  const [storeName, setStoreName] = useState('')
  const [storeCat, setStoreCat] = useState<StoreCategory>('Alimentação')
  const [storeDesc, setStoreDesc] = useState('')
  const [storeAddr, setStoreAddr] = useState('')
  const [storeCity, setStoreCity] = useState('')
  const [storePhone, setStorePhone] = useState('')
  const [storeLogo, setStoreLogo] = useState('')
  const [storeBanner, setStoreBanner] = useState('')
  const [selectedSubPlanId, setSelectedSubPlanId] = useState('')
  const [isSavingStore, setIsSavingStore] = useState(false)

  // Loyalty plan form state
  const [planType, setPlanType] = useState<FidelityType>('stamps')
  const [planTitle, setPlanTitle] = useState('')
  const [planDesc, setPlanDesc] = useState('')
  const [planTargetStamps, setPlanTargetStamps] = useState(10)
  const [planMinAmount, setPlanMinAmount] = useState(20)
  const [planPointsRate, setPlanPointsRate] = useState(1)
  const [planPointsRedeem, setPlanPointsRedeem] = useState(150)
  const [planCashbackPct, setPlanCashbackPct] = useState(5)
  const [planRewardTitle, setPlanRewardTitle] = useState('')
  const [planRewardDesc, setPlanRewardDesc] = useState('')
  const [isSavingPlan, setIsSavingPlan] = useState(false)

  // Register purchase flow state
  const [customerSearchCode, setCustomerSearchCode] = useState('')
  const [foundCustomer, setFoundCustomer] = useState<UserRecord | null>(null)
  const [customerCard, setCustomerCard] = useState<CustomerCardRecord | null>(null)
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false)
  const [purchaseAmount, setPurchaseAmount] = useState<number | ''>('')
  const [purchaseNotes, setPurchaseNotes] = useState('')
  const [isSubmittingPurchase, setIsSubmittingPurchase] = useState(false)

  // Redeem modal state
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false)
  const [cashbackToRedeem, setCashbackToRedeem] = useState<number | ''>('')
  const [isSubmittingRedeem, setIsSubmittingRedeem] = useState(false)

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (role !== 'merchant' && role !== 'admin'))) {
      navigate('/login?tipo=lojista')
      return
    }
    if (isAuthenticated && user) {
      loadMerchantData()
    }
  }, [isAuthenticated, user, authLoading])

  const loadMerchantData = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const plansList = await getSubscriptionPlans()
      setSubPlans(plansList)

      const storeData = await getMerchantStore(user.id)
      if (storeData) {
        setStore(storeData)
        setStoreName(storeData.name)
        setStoreCat(storeData.category)
        setStoreDesc(storeData.description || '')
        setStoreAddr(storeData.address || '')
        setStoreCity(storeData.city || '')
        setStorePhone(storeData.phone || '')
        setStoreLogo(storeData.logo_url || '')
        setStoreBanner(storeData.banner_url || '')
        setSelectedSubPlanId(storeData.subscription_plan_id || plansList[0]?.id || '')

        // Fetch fidelity plan and purchases
        const [planData, purchasesData] = await Promise.all([
          getStoreFidelityPlan(storeData.id),
          getStorePurchases(storeData.id),
        ])

        if (planData) {
          setPlan(planData)
          setPlanType(planData.type)
          setPlanTitle(planData.title)
          setPlanDesc(planData.description || '')
          if (planData.target_stamps) setPlanTargetStamps(planData.target_stamps)
          if (planData.min_purchase_amount) setPlanMinAmount(planData.min_purchase_amount)
          if (planData.points_per_currency) setPlanPointsRate(planData.points_per_currency)
          if (planData.points_to_redeem) setPlanPointsRedeem(planData.points_to_redeem)
          if (planData.cashback_percentage) setPlanCashbackPct(planData.cashback_percentage)
          setPlanRewardTitle(planData.reward_title || '')
          setPlanRewardDesc(planData.reward_description || '')
        } else {
          // Default initial plan setup
          setPlanTitle('Programa de Selos Fideliza')
          setPlanDesc('Junte selos e ganhe recompensas exclusivas')
          setPlanRewardTitle('1 Cortesia da Casa')
        }

        setPurchases(purchasesData)
      } else {
        // No store yet, prepare initial values
        setSelectedSubPlanId(plansList[0]?.id || '')
        setPlanTitle('Programa Fidelidade')
      }
    } catch (err) {
      console.error('Error loading merchant dashboard:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // STORE SAVE HANDLER
  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setIsSavingStore(true)
    try {
      if (store) {
        const updated = await updateStore(store.id, {
          name: storeName,
          category: storeCat,
          description: storeDesc,
          address: storeAddr,
          city: storeCity,
          phone: storePhone,
          logo_url:
            storeLogo ||
            `https://img.usecurling.com/p/200/200?q=${encodeURIComponent(storeCat)}&color=orange`,
          banner_url:
            storeBanner || `https://img.usecurling.com/p/800/400?q=store+shop&color=black`,
          subscription_plan_id: selectedSubPlanId || undefined,
        })
        setStore(updated)
        toast({
          title: 'Loja atualizada!',
          description: 'Os dados da sua loja foram salvos com sucesso.',
        })
      } else {
        const created = await createStore({
          owner_id: user.id,
          name: storeName,
          category: storeCat,
          description: storeDesc,
          address: storeAddr,
          city: storeCity,
          phone: storePhone,
          logo_url:
            storeLogo ||
            `https://img.usecurling.com/p/200/200?q=${encodeURIComponent(storeCat)}&color=orange`,
          banner_url:
            storeBanner || `https://img.usecurling.com/p/800/400?q=store+shop&color=black`,
          approval_status: 'pending', // Requires admin approval
          subscription_plan_id: selectedSubPlanId || undefined,
          subscription_status: 'trial',
        })
        setStore(created)
        toast({
          title: 'Loja cadastrada com sucesso!',
          description:
            'Sua loja foi enviada para aprovação do administrador e já está em período de teste.',
        })
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar loja',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsSavingStore(false)
    }
  }

  // FIDELITY PLAN SAVE HANDLER
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!store) {
      toast({
        title: 'Cadastre sua loja primeiro',
        description: 'Você precisa ter uma loja cadastrada antes de criar seu plano de fidelidade.',
        variant: 'destructive',
      })
      return
    }

    setIsSavingPlan(true)
    try {
      const planPayload: Partial<FidelityPlanRecord> = {
        type: planType,
        title: planTitle,
        description: planDesc,
        target_stamps: planType === 'stamps' ? Number(planTargetStamps) : undefined,
        min_purchase_amount: planType === 'stamps' ? Number(planMinAmount) : undefined,
        points_per_currency: planType === 'points' ? Number(planPointsRate) : undefined,
        points_to_redeem: planType === 'points' ? Number(planPointsRedeem) : undefined,
        cashback_percentage: planType === 'cashback' ? Number(planCashbackPct) : undefined,
        reward_title: planRewardTitle,
        reward_description: planRewardDesc,
      }

      const saved = await saveFidelityPlan(store.id, planPayload)
      setPlan(saved)
      toast({
        title: 'Plano de Fidelidade salvo!',
        description: `Seu plano de ${planType === 'stamps' ? 'Selos' : planType === 'points' ? 'Pontos' : 'Cashback'} está ativo.`,
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar plano',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsSavingPlan(false)
    }
  }

  // SEARCH CUSTOMER BY CODE OR EMAIL
  const handleSearchCustomer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!customerSearchCode.trim() || !store) return

    setIsSearchingCustomer(true)
    setFoundCustomer(null)
    setCustomerCard(null)

    try {
      const cust = await findCustomerByCodeOrEmail(customerSearchCode)
      if (!cust) {
        toast({
          title: 'Cliente não encontrado',
          description: 'Verifique se o código (ex: CLI-7842) ou e-mail foi digitado corretamente.',
          variant: 'destructive',
        })
      } else {
        setFoundCustomer(cust)
        // Load loyalty card for this customer in this store
        const card = await getCustomerCardForStore(cust.id, store.id)
        setCustomerCard(card)
        toast({
          title: 'Cliente localizado!',
          description: `${cust.name} (${cust.customer_code || cust.email})`,
        })
      }
    } catch (err: any) {
      toast({
        title: 'Erro na busca',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsSearchingCustomer(false)
    }
  }

  // REGISTER PURCHASE FOR CUSTOMER
  const handleRegisterPurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!store || !foundCustomer || !plan) {
      toast({
        title: 'Dados incompletos',
        description: 'Selecione o cliente e configure o plano da loja primeiro.',
        variant: 'destructive',
      })
      return
    }

    const val = Number(purchaseAmount)
    if (!val || val <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Informe um valor de compra válido acima de zero.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmittingPurchase(true)
    try {
      const result = await registerPurchase({
        storeId: store.id,
        customerId: foundCustomer.id,
        amount: val,
        plan,
        notes: purchaseNotes,
      })

      // Update local state
      setCustomerCard(result.card)
      setPurchases((prev) => [result.purchase, ...prev])
      setPurchaseAmount('')
      setPurchaseNotes('')

      toast({
        title: 'Compra registrada com sucesso!',
        description: `Benefícios creditados para ${foundCustomer.name}!`,
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar compra',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsSubmittingPurchase(false)
    }
  }

  // REDEEM REWARD HANDLER
  const handleRedeem = async () => {
    if (!store || !foundCustomer || !plan) return

    setIsSubmittingRedeem(true)
    try {
      const result = await redeemReward({
        storeId: store.id,
        customerId: foundCustomer.id,
        plan,
        rewardType: plan.type,
        cashbackAmount: plan.type === 'cashback' ? Number(cashbackToRedeem) : undefined,
      })

      setCustomerCard(result.card)
      setPurchases((prev) => [result.redemption, ...prev])
      setIsRedeemModalOpen(false)
      setCashbackToRedeem('')

      toast({
        title: 'Recompensa resgatada com sucesso!',
        description: `O cliente ${foundCustomer.name} resgatou seu benefício.`,
      })
    } catch (err: any) {
      toast({
        title: 'Erro no resgate',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsSubmittingRedeem(false)
    }
  }

  // Sales metrics
  const totalStoreSales = purchases
    .filter((p) => p.type === 'purchase')
    .reduce((sum, p) => sum + (p.amount || 0), 0)
  const totalPurchasesNum = purchases.filter((p) => p.type === 'purchase').length
  const totalRedeemedNum = purchases.filter((p) => p.type === 'redemption').length

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl flex-1">
      {/* HEADER & STATUS BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-100 text-amber-800 border-amber-300 gap-1 font-bold">
              <Store className="w-3.5 h-3.5" />
              Painel do Lojista
            </Badge>

            {store && store.approval_status === 'approved' && (
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold gap-1">
                <CheckCircle2 className="w-3 h-3" /> Loja Ativa no Portal
              </Badge>
            )}

            {store && store.approval_status === 'pending' && (
              <Badge className="bg-amber-500 text-white font-semibold gap-1">
                <Clock className="w-3 h-3" /> Aguardando Aprovação do Administrador
              </Badge>
            )}

            {store && store.subscription_status === 'trial' && (
              <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                Período de Teste Grátis
              </Badge>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            {store ? store.name : 'Configurar Minha Loja'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Cadastre compras de clientes com código digital, defina regras e acompanhe vendas
          </p>
        </div>

        {/* Quick jump to register sale */}
        {store && plan && (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                const el = document.getElementById('registrar-compra-section')
                el?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold gap-2 text-xs sm:text-sm shadow-md shadow-rose-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              Registrar Compra do Cliente
            </Button>
          </div>
        )}
      </div>

      {/* METRICS ROW */}
      {store && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="rounded-2xl border-slate-200">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Vendas Registradas
                </p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  R$ {totalStoreSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                  {totalPurchasesNum} transações realizadas
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Modelo Ativo
                </p>
                <h3 className="text-xl font-black text-slate-900 mt-1 capitalize">
                  {plan?.type === 'stamps'
                    ? 'Selos Digitais'
                    : plan?.type === 'points'
                      ? 'Pontos'
                      : plan?.type === 'cashback'
                        ? 'Cashback'
                        : 'Não definido'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  {plan ? plan.title : 'Configure abaixo'}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Recompensas Entregues
                </p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{totalRedeemedNum}</h3>
                <p className="text-[11px] text-indigo-600 font-semibold mt-1">Resgates efetuados</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Gift className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Assinatura da Loja
                </p>
                <h3 className="text-lg font-black text-slate-900 mt-1 capitalize">
                  {store.subscription_status === 'active'
                    ? 'Ativa / Paga'
                    : store.subscription_status === 'trial'
                      ? 'Período Teste'
                      : store.subscription_status || 'Trial'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  {store.expand?.subscription_plan_id?.name || 'Plano Fideliza'}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MAIN TABS */}
      <Tabs defaultValue={store ? 'pos' : 'store'} className="space-y-6">
        <TabsList className="bg-slate-200/70 p-1 rounded-xl">
          <TabsTrigger
            value="pos"
            className="gap-2 text-xs sm:text-sm font-semibold"
            id="registrar-compra-section"
          >
            <ShoppingBag className="w-4 h-4" />
            Registrar Compra (PDV Caixa)
          </TabsTrigger>
          <TabsTrigger value="program" className="gap-2 text-xs sm:text-sm font-semibold">
            <Award className="w-4 h-4" />
            Meu Plano de Fidelidade
          </TabsTrigger>
          <TabsTrigger value="store" className="gap-2 text-xs sm:text-sm font-semibold">
            <Store className="w-4 h-4" />
            Dados da Loja
          </TabsTrigger>
          <TabsTrigger value="sales" className="gap-2 text-xs sm:text-sm font-semibold">
            <TrendingUp className="w-4 h-4" />
            Relatório de Vendas
          </TabsTrigger>
        </TabsList>

        {/* ======================================================== */}
        {/* TAB 1: PDV - REGISTRAR COMPRA PELO CÓDIGO DO CLIENTE */}
        {/* ======================================================== */}
        <TabsContent value="pos" className="space-y-6">
          {!store ? (
            <Card className="rounded-3xl p-8 text-center max-w-lg mx-auto">
              <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">Cadastre sua loja primeiro</h3>
              <p className="text-xs text-slate-500 mb-4">
                Preencha os dados da sua loja na aba "Dados da Loja" para habilitar o registro de
                compras.
              </p>
            </Card>
          ) : !plan ? (
            <Card className="rounded-3xl p-8 text-center max-w-lg mx-auto">
              <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Configure o plano de fidelidade
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Vá até a aba "Meu Plano de Fidelidade" e escolha se sua loja acumulará selos, pontos
                ou cashback.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left col: Customer Search & Information */}
              <div className="lg:col-span-5 space-y-6">
                <Card className="rounded-3xl border-slate-200 shadow-xs">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Search className="w-4 h-4 text-rose-600" />
                      1. Identificar Cliente
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Peça ao cliente o código exibido no cartão digital dele (ex: CLI-7842) ou o
                      e-mail
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <form onSubmit={handleSearchCustomer} className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          placeholder="Ex: CLI-7842 ou cliente@email.com"
                          value={customerSearchCode}
                          onChange={(e) => setCustomerSearchCode(e.target.value)}
                          className="font-mono text-sm uppercase rounded-xl border-slate-300"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={isSearchingCustomer || !customerSearchCode.trim()}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl"
                      >
                        {isSearchingCustomer ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Buscar'
                        )}
                      </Button>
                    </form>

                    {/* Quick helper for demo */}
                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Dica para teste rápido:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerSearchCode('CLI-7842')
                        }}
                        className="font-mono font-bold text-rose-600 hover:underline"
                      >
                        Usar CLI-7842
                      </button>
                    </div>

                    {/* Found customer card info */}
                    {foundCustomer && (
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-rose-500 text-white font-bold flex items-center justify-center text-sm">
                              {foundCustomer.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-extrabold text-sm">{foundCustomer.name}</p>
                              <p className="text-[11px] text-slate-300">{foundCustomer.email}</p>
                            </div>
                          </div>
                          <Badge className="bg-white/10 font-mono text-[10px] text-amber-300 border-white/20">
                            {foundCustomer.customer_code || 'ID'}
                          </Badge>
                        </div>

                        {/* Customer Current Balance in this Store */}
                        <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-3 text-xs">
                          <div className="bg-white/5 p-2.5 rounded-xl">
                            <p className="text-slate-400 text-[10px] font-bold uppercase">
                              Saldo Atual
                            </p>
                            <p className="text-base font-black text-amber-400 mt-0.5">
                              {plan.type === 'stamps' &&
                                `${customerCard?.stamps_count || 0} / ${plan.target_stamps || 10} Selos`}
                              {plan.type === 'points' &&
                                `${customerCard?.points_balance || 0} Pontos`}
                              {plan.type === 'cashback' &&
                                `R$ ${(customerCard?.cashback_balance || 0).toFixed(2)}`}
                            </p>
                          </div>

                          <div className="bg-white/5 p-2.5 rounded-xl">
                            <p className="text-slate-400 text-[10px] font-bold uppercase">
                              Total Comprado
                            </p>
                            <p className="text-base font-black text-emerald-400 mt-0.5">
                              R$ {(customerCard?.total_spent || 0).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Eligible for reward button */}
                        {((plan.type === 'stamps' &&
                          (customerCard?.stamps_count || 0) >= (plan.target_stamps || 10)) ||
                          (plan.type === 'points' &&
                            (customerCard?.points_balance || 0) >=
                              (plan.points_to_redeem || 100)) ||
                          (plan.type === 'cashback' &&
                            (customerCard?.cashback_balance || 0) > 0)) && (
                          <Button
                            type="button"
                            onClick={() => setIsRedeemModalOpen(true)}
                            className="w-full bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold text-xs py-2 rounded-xl"
                          >
                            <Gift className="w-4 h-4 mr-1.5" />
                            Cliente pode Resgatar Recompensa!
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Plan rules summary card */}
                <Card className="rounded-3xl border-slate-200 bg-slate-50/50 p-5 text-xs text-slate-600 space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-600" /> Regra do seu Plano (
                    {plan.type.toUpperCase()})
                  </h4>
                  {plan.type === 'stamps' && (
                    <p>
                      A cada R$ {(plan.min_purchase_amount || 1).toFixed(2)} em compras = 1 selo. Ao
                      juntar {plan.target_stamps} selos o cliente ganha:{' '}
                      <strong>{plan.reward_title}</strong>.
                    </p>
                  )}
                  {plan.type === 'points' && (
                    <p>
                      R$ 1,00 gasto = {plan.points_per_currency || 1} ponto(s). Ao juntar{' '}
                      {plan.points_to_redeem} pontos o cliente ganha:{' '}
                      <strong>{plan.reward_title}</strong>.
                    </p>
                  )}
                  {plan.type === 'cashback' && (
                    <p>
                      {plan.cashback_percentage}% do valor da compra volta como saldo para o cliente
                      usar nesta loja.
                    </p>
                  )}
                </Card>
              </div>

              {/* Right col: Register Purchase Form */}
              <div className="lg:col-span-7">
                <Card className="rounded-3xl border-slate-200 shadow-xs h-full flex flex-col justify-between">
                  <CardHeader>
                    <CardTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-rose-600" />
                      2. Registrar Valor da Compra
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      O sistema calcula e credita automaticamente os selos, pontos ou cashback para
                      o cliente
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6 flex-1">
                    {!foundCustomer ? (
                      <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-700">
                          Identifique o cliente ao lado para liberar o registro
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Digite o código de cliente e clique em "Buscar"
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleRegisterPurchase} className="space-y-5">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-700">
                            Valor Total da Compra (R$) *
                          </Label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-base">
                              R$
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              required
                              placeholder="0,00"
                              value={purchaseAmount}
                              onChange={(e) =>
                                setPurchaseAmount(
                                  e.target.value === '' ? '' : Number(e.target.value),
                                )
                              }
                              className="pl-11 text-xl font-black text-slate-900 py-6 rounded-2xl border-slate-300 focus-visible:ring-rose-500"
                            />
                          </div>
                        </div>

                        {/* Real-time simulation of benefit */}
                        {typeof purchaseAmount === 'number' && purchaseAmount > 0 && (
                          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-1 text-xs">
                            <p className="font-bold uppercase tracking-wider text-[10px] text-rose-700">
                              Benefício que o cliente receberá nesta compra:
                            </p>
                            <p className="text-base font-black text-rose-700">
                              {plan.type === 'stamps' && (
                                <>
                                  +{Math.floor(purchaseAmount / (plan.min_purchase_amount || 1))}{' '}
                                  Selo(s)
                                  <span className="text-xs font-normal text-slate-600 block">
                                    (1 selo a cada R$ {(plan.min_purchase_amount || 1).toFixed(2)})
                                  </span>
                                </>
                              )}
                              {plan.type === 'points' && (
                                <>
                                  +{Math.round(purchaseAmount * (plan.points_per_currency || 1))}{' '}
                                  Pontos
                                </>
                              )}
                              {plan.type === 'cashback' && (
                                <>
                                  +R${' '}
                                  {(
                                    (purchaseAmount * (plan.cashback_percentage || 5)) /
                                    100
                                  ).toFixed(2)}{' '}
                                  de Cashback ({plan.cashback_percentage}%)
                                </>
                              )}
                            </p>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-slate-700">
                            Descrição / Itens / Observação (Opcional)
                          </Label>
                          <Input
                            placeholder="Ex: 2 Lanches artesanais, mesa 04"
                            value={purchaseNotes}
                            onChange={(e) => setPurchaseNotes(e.target.value)}
                            className="rounded-xl border-slate-300 text-xs"
                          />
                        </div>

                        <Button
                          type="submit"
                          disabled={isSubmittingPurchase || !purchaseAmount}
                          className="w-full py-6 rounded-2xl font-black text-sm bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white shadow-lg shadow-rose-600/30"
                        >
                          {isSubmittingPurchase ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Registrando no Cartão Digital...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-5 h-5 mr-2" />
                              Confirmar Compra e Creditar Benefício
                            </>
                          )}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 2: MEU PLANO DE FIDELIDADE (SELOS / PONTOS / CASHBACK) */}
        {/* ======================================================== */}
        <TabsContent value="program" className="space-y-6">
          <Card className="rounded-3xl border-slate-200 shadow-xs max-w-3xl">
            <CardHeader>
              <CardTitle className="text-xl font-black text-slate-900">
                Configurar Regras de Fidelidade
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Escolha o modelo que melhor engaja seu público: Selos no cartão, Pontos acumulativos
                ou Cashback em %
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSavePlan} className="space-y-6">
                {/* MODEL SELECTOR */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Tipo de Fidelidade
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setPlanType('stamps')}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        planType === 'stamps'
                          ? 'border-amber-500 bg-amber-50/70 shadow-xs ring-2 ring-amber-500/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Award
                        className={`w-6 h-6 mb-2 ${
                          planType === 'stamps' ? 'text-amber-600' : 'text-slate-400'
                        }`}
                      />
                      <p className="font-extrabold text-sm text-slate-900">Selos Digitais</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Estilo cafeteria: complete 10 selos e ganhe uma cortesia.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPlanType('points')}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        planType === 'points'
                          ? 'border-indigo-500 bg-indigo-50/70 shadow-xs ring-2 ring-indigo-500/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Coins
                        className={`w-6 h-6 mb-2 ${
                          planType === 'points' ? 'text-indigo-600' : 'text-slate-400'
                        }`}
                      />
                      <p className="font-extrabold text-sm text-slate-900">Pontos por R$</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Acumule pontos proporcionais ao gasto e troque por prêmios.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPlanType('cashback')}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        planType === 'cashback'
                          ? 'border-emerald-500 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-500/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Percent
                        className={`w-6 h-6 mb-2 ${
                          planType === 'cashback' ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      />
                      <p className="font-extrabold text-sm text-slate-900">Cashback</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Devolva uma % em reais para abater em compras futuras.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Plan Title & General Description */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Título do Programa</Label>
                    <Input
                      required
                      placeholder="Ex: Cartão 10 Cafés ou Clube VIP"
                      value={planTitle}
                      onChange={(e) => setPlanTitle(e.target.value)}
                      className="text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">
                      Descrição curta para o cliente
                    </Label>
                    <Input
                      placeholder="Ex: A cada R$ 20 ganhe 1 selo"
                      value={planDesc}
                      onChange={(e) => setPlanDesc(e.target.value)}
                      className="text-xs rounded-xl"
                    />
                  </div>
                </div>

                {/* TYPE-SPECIFIC PARAMETERS */}
                {planType === 'stamps' && (
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                      Regras de Selos
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700">
                          Quantidade de Selos para Resgatar (Meta)
                        </Label>
                        <Input
                          type="number"
                          min={2}
                          max={50}
                          required
                          value={planTargetStamps}
                          onChange={(e) => setPlanTargetStamps(Number(e.target.value))}
                          className="text-xs bg-white rounded-xl"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700">
                          Valor Mínimo da Compra por Selo (R$)
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          step="0.50"
                          required
                          value={planMinAmount}
                          onChange={(e) => setPlanMinAmount(Number(e.target.value))}
                          className="text-xs bg-white rounded-xl"
                        />
                        <p className="text-[10px] text-slate-500">
                          Ex: R$ 20,00 significa que uma compra de R$ 60 dá 3 selos.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {planType === 'points' && (
                  <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                      Regras de Pontos
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700">
                          Pontos Gerados por R$ 1,00 Gasto
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          required
                          value={planPointsRate}
                          onChange={(e) => setPlanPointsRate(Number(e.target.value))}
                          className="text-xs bg-white rounded-xl"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700">
                          Pontos Necessários para Resgate
                        </Label>
                        <Input
                          type="number"
                          min={10}
                          required
                          value={planPointsRedeem}
                          onChange={(e) => setPlanPointsRedeem(Number(e.target.value))}
                          className="text-xs bg-white rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {planType === 'cashback' && (
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                      Regras de Cashback
                    </h4>
                    <div className="space-y-1.5 max-w-xs">
                      <Label className="text-xs font-bold text-slate-700">
                        Porcentagem de Devolução (%)
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          min={1}
                          max={50}
                          step="0.5"
                          required
                          value={planCashbackPct}
                          onChange={(e) => setPlanCashbackPct(Number(e.target.value))}
                          className="text-xs bg-white rounded-xl pr-8"
                        />
                        <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                          %
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Ex: 8% em uma compra de R$ 100 credita R$ 8,00 no saldo digital.
                      </p>
                    </div>
                  </div>
                )}

                {/* REWARD DETAILS */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Recompensa Oferecida
                  </h4>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">
                      Nome do Prêmio / Benefício *
                    </Label>
                    <Input
                      required
                      placeholder="Ex: 1 Hambúrguer Smash ou R$ 20 de Desconto"
                      value={planRewardTitle}
                      onChange={(e) => setPlanRewardTitle(e.target.value)}
                      className="text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">
                      Instruções de Resgate no Caixa (Opcional)
                    </Label>
                    <Textarea
                      rows={2}
                      placeholder="Ex: Apresente o cartão digital ao atendente antes de fechar a conta."
                      value={planRewardDesc}
                      onChange={(e) => setPlanRewardDesc(e.target.value)}
                      className="text-xs rounded-xl resize-none"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSavingPlan}
                  className="w-full py-5 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white"
                >
                  {isSavingPlan ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando Plano...
                    </>
                  ) : (
                    'Salvar e Publicar Plano de Fidelidade'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 3: DADOS DA LOJA (NOME, CATEGORIA, ENDEREÇO, ETC) */}
        {/* ======================================================== */}
        <TabsContent value="store" className="space-y-6">
          <Card className="rounded-3xl border-slate-200 shadow-xs max-w-3xl">
            <CardHeader>
              <CardTitle className="text-xl font-black text-slate-900">
                {store ? 'Editar Minha Loja' : 'Cadastrar Nova Loja'}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Informações visíveis para os clientes no portal público do Fideliza
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSaveStore} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">
                      Nome do Estabelecimento *
                    </Label>
                    <Input
                      required
                      placeholder="Ex: Pizzaria Forno & Sabor"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Categoria *</Label>
                    <Select
                      value={storeCat}
                      onValueChange={(val) => setStoreCat(val as StoreCategory)}
                    >
                      <SelectTrigger className="text-xs rounded-xl">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Descrição Comercial</Label>
                  <Textarea
                    rows={3}
                    placeholder="Conte sobre sua loja, especialidades e diferenciais..."
                    value={storeDesc}
                    onChange={(e) => setStoreDesc(e.target.value)}
                    className="text-xs rounded-xl resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Endereço Completo</Label>
                    <Input
                      placeholder="Ex: Rua das Flores, 120 - Centro"
                      value={storeAddr}
                      onChange={(e) => setStoreAddr(e.target.value)}
                      className="text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Cidade / Estado</Label>
                    <Input
                      placeholder="Ex: São Paulo - SP"
                      value={storeCity}
                      onChange={(e) => setStoreCity(e.target.value)}
                      className="text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">WhatsApp / Telefone</Label>
                  <Input
                    placeholder="Ex: (11) 98765-4321"
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    className="text-xs rounded-xl max-w-sm"
                  />
                </div>

                {/* Subscription plan select */}
                <div className="space-y-1.5 pt-2">
                  <Label className="text-xs font-bold text-slate-700">
                    Plano de Assinatura Desejado
                  </Label>
                  <Select value={selectedSubPlanId} onValueChange={setSelectedSubPlanId}>
                    <SelectTrigger className="text-xs rounded-xl">
                      <SelectValue placeholder="Selecione seu plano" />
                    </SelectTrigger>
                    <SelectContent>
                      {subPlans.map((sp) => (
                        <SelectItem key={sp.id} value={sp.id}>
                          {sp.name} - R$ {Number(sp.price).toFixed(2)} ({sp.trial_days} dias de
                          teste)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  disabled={isSavingStore}
                  className="w-full py-5 rounded-xl font-bold bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white shadow-md shadow-rose-600/20"
                >
                  {isSavingStore ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando Loja...
                    </>
                  ) : store ? (
                    'Atualizar Dados da Loja'
                  ) : (
                    'Cadastrar Loja e Iniciar Teste'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 4: RELATÓRIO DE VENDAS */}
        {/* ======================================================== */}
        <TabsContent value="sales" className="space-y-6">
          <Card className="rounded-3xl border-slate-200 shadow-xs">
            <CardHeader>
              <CardTitle className="text-lg font-black text-slate-900">
                Histórico de Vendas e Resgates da Loja
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Todas as operações registradas no caixa com os cartões dos clientes
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Data/Hora</th>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Operação</th>
                      <th className="py-3 px-4">Valor</th>
                      <th className="py-3 px-4">Benefício Gerado / Resgatado</th>
                      <th className="py-3 px-4">Obs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {purchases.map((pc) => (
                      <tr key={pc.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(pc.created).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(pc.created).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {pc.expand?.customer_id?.name || 'Cliente'}
                        </td>
                        <td className="py-3 px-4">
                          {pc.type === 'purchase' ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-0 text-[10px]">
                              Compra
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800 border-0 text-[10px]">
                              Resgate
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {pc.amount ? `R$ ${Number(pc.amount).toFixed(2)}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {pc.stamps_earned ? (
                            <span className="text-amber-700 font-semibold">
                              +{pc.stamps_earned} selo(s)
                            </span>
                          ) : pc.points_earned ? (
                            <span className="text-indigo-700 font-semibold">
                              +{pc.points_earned} pontos
                            </span>
                          ) : pc.cashback_earned ? (
                            <span className="text-emerald-700 font-semibold">
                              +R$ {Number(pc.cashback_earned).toFixed(2)} cashback
                            </span>
                          ) : pc.points_spent ? (
                            <span className="text-rose-600 font-semibold">
                              -{pc.points_spent} pontos resgatados
                            </span>
                          ) : pc.cashback_spent ? (
                            <span className="text-rose-600 font-semibold">
                              -R$ {Number(pc.cashback_spent).toFixed(2)} abatidos
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                          {pc.notes || '-'}
                        </td>
                      </tr>
                    ))}
                    {purchases.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Nenhuma compra registrada ainda. Use a aba "Registrar Compra" quando um
                          cliente comprar na sua loja.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL: RESGATE DE RECOMPENSA PELO CLIENTE */}
      <Dialog open={isRedeemModalOpen} onOpenChange={setIsRedeemModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-500" />
              Resgatar Recompensa
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Cliente: <strong>{foundCustomer?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          {plan && customerCard && (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <p className="font-bold">Recompensa a entregar:</p>
                <p className="text-sm font-black text-amber-800">
                  🎁 {plan.reward_title || 'Recompensa de Fidelidade'}
                </p>
                {plan.reward_description && (
                  <p className="text-slate-600 text-[11px] pt-1">{plan.reward_description}</p>
                )}
              </div>

              {plan.type === 'stamps' && (
                <div className="text-xs text-slate-700">
                  O cliente usará <strong>{plan.target_stamps} selos</strong> acumulados.
                  <p className="text-[11px] text-slate-500 mt-1">
                    Saldo após resgate:{' '}
                    {(customerCard.stamps_count || 0) - (plan.target_stamps || 10)} selos.
                  </p>
                </div>
              )}

              {plan.type === 'points' && (
                <div className="text-xs text-slate-700">
                  O cliente debitará <strong>{plan.points_to_redeem} pontos</strong> acumulados.
                  <p className="text-[11px] text-slate-500 mt-1">
                    Saldo após resgate:{' '}
                    {(customerCard.points_balance || 0) - (plan.points_to_redeem || 100)} pontos.
                  </p>
                </div>
              )}

              {plan.type === 'cashback' && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">
                    Valor de Cashback a Descontar (R$)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    max={customerCard.cashback_balance || 0}
                    value={cashbackToRedeem}
                    placeholder={`Máx: R$ ${(customerCard.cashback_balance || 0).toFixed(2)}`}
                    onChange={(e) =>
                      setCashbackToRedeem(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="text-xs rounded-xl"
                  />
                  <p className="text-[10px] text-slate-500">
                    Saldo disponível para abatimento: R${' '}
                    {(customerCard.cashback_balance || 0).toFixed(2)}
                  </p>
                </div>
              )}

              <DialogFooter className="pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRedeemModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isSubmittingRedeem}
                  onClick={handleRedeem}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  {isSubmittingRedeem ? 'Processando...' : 'Confirmar Entrega do Prêmio'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

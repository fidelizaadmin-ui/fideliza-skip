import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  getAllStores,
  updateStore,
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  getAllPurchases,
} from '@/services/fidelityService'
import type {
  StoreRecord,
  SubscriptionPlanRecord,
  PurchaseRecord,
  ApprovalStatus,
  SubscriptionStatus,
} from '@/types'
import pb from '@/lib/pocketbase/client'
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
import {
  ShieldCheck,
  Store,
  CreditCard,
  Users,
  TrendingUp,
  Check,
  X,
  Clock,
  AlertTriangle,
  Plus,
  Edit2,
  DollarSign,
  Calendar,
  CheckCircle2,
  Layers,
  Search,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function AdminDashboard() {
  const { user, role, isAuthenticated, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [stores, setStores] = useState<StoreRecord[]>([])
  const [plans, setPlans] = useState<SubscriptionPlanRecord[]>([])
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([])
  const [customersCount, setCustomersCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Filters for stores tab
  const [storeStatusFilter, setStoreStatusFilter] = useState<'all' | ApprovalStatus>('all')
  const [searchStoreTerm, setSearchStoreTerm] = useState('')

  // Edit / Create plan modal
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanRecord | null>(null)
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [planFormName, setPlanFormName] = useState('')
  const [planFormSlug, setPlanFormSlug] = useState('')
  const [planFormPrice, setPlanFormPrice] = useState(69.9)
  const [planFormBilling, setPlanFormBilling] = useState(1)
  const [planFormTrial, setPlanFormTrial] = useState(14)
  const [planFormDesc, setPlanFormDesc] = useState('')
  const [planFormFeatures, setPlanFormFeatures] = useState('')
  const [planFormActive, setPlanFormActive] = useState(true)

  // Edit Store Subscription Status Modal
  const [storeToEditSub, setStoreToEditSub] = useState<StoreRecord | null>(null)
  const [subStatusChoice, setSubStatusChoice] = useState<SubscriptionStatus>('active')
  const [subPlanChoice, setSubPlanChoice] = useState<string>('')
  const [subExpiryDate, setSubExpiryDate] = useState<string>('')

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || role !== 'admin')) {
      navigate('/login?tipo=admin')
      return
    }
    if (isAuthenticated && role === 'admin') {
      loadData()
    }
  }, [isAuthenticated, role, authLoading])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [storesData, plansData, purchasesData] = await Promise.all([
        getAllStores(),
        getSubscriptionPlans(),
        getAllPurchases(),
      ])

      setStores(storesData)
      setPlans(plansData)
      setPurchases(purchasesData)

      // Fetch customers count
      try {
        const usersList = await pb.collection('users').getList(1, 1, {
          filter: 'role = "customer"',
        })
        setCustomersCount(usersList.totalItems)
      } catch (_) {
        setCustomersCount(0)
      }
    } catch (err) {
      console.error('Error loading admin data:', err)
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados administrativos.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // STORE APPROVAL HANDLERS
  const handleApproveStore = async (store: StoreRecord) => {
    try {
      const updated = await updateStore(store.id, {
        approval_status: 'approved',
        subscription_status: store.subscription_status || 'trial',
      })
      setStores((prev) => prev.map((s) => (s.id === store.id ? updated : s)))
      toast({
        title: 'Loja aprovada com sucesso!',
        description: `A loja "${store.name}" agora está visível no portal público.`,
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao aprovar loja',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  const handleRejectStore = async (store: StoreRecord) => {
    try {
      const updated = await updateStore(store.id, {
        approval_status: 'rejected',
      })
      setStores((prev) => prev.map((s) => (s.id === store.id ? updated : s)))
      toast({
        title: 'Cadastro recusado',
        description: `A loja "${store.name}" foi recusada.`,
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao recusar loja',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  // STORE SUBSCRIPTION STATUS MODAL HANDLERS
  const openSubscriptionModal = (store: StoreRecord) => {
    setStoreToEditSub(store)
    setSubStatusChoice(store.subscription_status || 'trial')
    setSubPlanChoice(store.subscription_plan_id || plans[0]?.id || '')
    setSubExpiryDate(store.subscription_expires_at || '')
  }

  const handleSaveStoreSubscription = async () => {
    if (!storeToEditSub) return
    try {
      const updated = await updateStore(storeToEditSub.id, {
        subscription_status: subStatusChoice,
        subscription_plan_id: subPlanChoice || undefined,
        subscription_expires_at: subExpiryDate || undefined,
      })
      setStores((prev) => prev.map((s) => (s.id === storeToEditSub.id ? updated : s)))
      setStoreToEditSub(null)
      toast({
        title: 'Assinatura atualizada',
        description: `Status de pagamento e plano da loja atualizados com sucesso.`,
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar assinatura',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  // SUBSCRIPTION PLAN MODAL HANDLERS
  const openPlanModal = (plan?: SubscriptionPlanRecord) => {
    if (plan) {
      setEditingPlan(plan)
      setPlanFormName(plan.name)
      setPlanFormSlug(plan.slug)
      setPlanFormPrice(plan.price)
      setPlanFormBilling(plan.billing_interval_months)
      setPlanFormTrial(plan.trial_days)
      setPlanFormDesc(plan.description || '')
      setPlanFormFeatures(
        Array.isArray(plan.features) ? plan.features.join('\n') : (plan.features as string) || '',
      )
      setPlanFormActive(plan.is_active)
    } else {
      setEditingPlan(null)
      setPlanFormName('')
      setPlanFormSlug('')
      setPlanFormPrice(99.0)
      setPlanFormBilling(1)
      setPlanFormTrial(14)
      setPlanFormDesc('')
      setPlanFormFeatures('1 loja inclusa\nSelos, pontos ou cashback\nSuporte padrão')
      setPlanFormActive(true)
    }
    setIsPlanModalOpen(true)
  }

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const featuresArray = planFormFeatures
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean)

      if (editingPlan) {
        const updated = await updateSubscriptionPlan(editingPlan.id, {
          name: planFormName,
          slug: planFormSlug || planFormName.toLowerCase().replace(/\s+/g, '-'),
          price: Number(planFormPrice),
          billing_interval_months: Number(planFormBilling),
          trial_days: Number(planFormTrial),
          description: planFormDesc,
          features: JSON.stringify(featuresArray),
          is_active: planFormActive,
        })
        setPlans((prev) => prev.map((p) => (p.id === editingPlan.id ? updated : p)))
        toast({ title: 'Plano atualizado com sucesso!' })
      } else {
        const created = await createSubscriptionPlan({
          name: planFormName,
          slug: planFormSlug || planFormName.toLowerCase().replace(/\s+/g, '-'),
          price: Number(planFormPrice),
          billing_interval_months: Number(planFormBilling),
          trial_days: Number(planFormTrial),
          description: planFormDesc,
          features: JSON.stringify(featuresArray),
          is_active: planFormActive,
        })
        setPlans((prev) => [...prev, created])
        toast({ title: 'Plano criado com sucesso!' })
      }
      setIsPlanModalOpen(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar plano',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  // Metrics calculations
  const pendingStores = stores.filter((s) => s.approval_status === 'pending')
  const approvedStores = stores.filter((s) => s.approval_status === 'approved')
  const totalSalesVolume = purchases
    .filter((p) => p.type === 'purchase')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0)
  const totalPurchasesCount = purchases.filter((p) => p.type === 'purchase').length
  const totalRedemptionsCount = purchases.filter((p) => p.type === 'redemption').length

  const filteredStores = stores.filter((s) => {
    const matchesStatus = storeStatusFilter === 'all' || s.approval_status === storeStatusFilter
    const matchesSearch =
      searchStoreTerm.trim() === '' ||
      s.name.toLowerCase().includes(searchStoreTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchStoreTerm.toLowerCase()) ||
      (s.address && s.address.toLowerCase().includes(searchStoreTerm.toLowerCase()))
    return matchesStatus && matchesSearch
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl flex-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-100 text-purple-800 border-purple-200 gap-1 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Painel do Administrador
            </Badge>
            {pendingStores.length > 0 && (
              <Badge className="bg-amber-500 text-white font-bold animate-pulse">
                {pendingStores.length} loja(s) aguardando aprovação
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Gestão Global do Sistema Fideliza
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Aprovação de lojistas, controle de planos e visão analítica das operações
          </p>
        </div>

        <Button
          onClick={() => openPlanModal()}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2 text-xs sm:text-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Plano de Assinatura
        </Button>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Lojas Cadastradas
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {stores.length}
              </h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                {approvedStores.length} ativas no portal
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Store className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Clientes na Base
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {customersCount || 1}
              </h3>
              <p className="text-[11px] text-indigo-600 font-semibold mt-1">
                Com código de fidelidade
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Volume de Vendas
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                R$ {totalSalesVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                {totalPurchasesCount} compras registradas
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Recompensas Resgatadas
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {totalRedemptionsCount}
              </h3>
              <p className="text-[11px] text-amber-600 font-semibold mt-1">
                Brindes ou descontos entregues
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABS: LOJAS, PLANOS, RELATÓRIO GLOBAL */}
      <Tabs defaultValue="stores" className="space-y-6">
        <TabsList className="bg-slate-200/70 p-1 rounded-xl">
          <TabsTrigger value="stores" className="gap-2 text-xs sm:text-sm font-semibold">
            <Store className="w-4 h-4" />
            Lojas & Aprovações
            {pendingStores.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                {pendingStores.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="plans" className="gap-2 text-xs sm:text-sm font-semibold">
            <Layers className="w-4 h-4" />
            Planos de Assinatura ({plans.length})
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2 text-xs sm:text-sm font-semibold">
            <TrendingUp className="w-4 h-4" />
            Relatório Global de Vendas
          </TabsTrigger>
        </TabsList>

        {/* ======================================================== */}
        {/* TAB 1: LOJAS & APROVAÇÃO */}
        {/* ======================================================== */}
        <TabsContent value="stores" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <Input
                placeholder="Buscar por nome, categoria ou endereço..."
                value={searchStoreTerm}
                onChange={(e) => setSearchStoreTerm(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Status:</span>
              <Select
                value={storeStatusFilter}
                onValueChange={(val) => setStoreStatusFilter(val as any)}
              >
                <SelectTrigger className="w-36 text-xs">
                  <SelectValue placeholder="Filtrar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas ({stores.length})</SelectItem>
                  <SelectItem value="pending">Pendentes ({pendingStores.length})</SelectItem>
                  <SelectItem value="approved">Aprovadas ({approvedStores.length})</SelectItem>
                  <SelectItem value="rejected">Recusadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stores Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-4">Loja / Categoria</th>
                    <th className="py-3.5 px-4">Status de Aprovação</th>
                    <th className="py-3.5 px-4">Plano & Pagamento</th>
                    <th className="py-3.5 px-4">Cidade / Contato</th>
                    <th className="py-3.5 px-4 text-right">Ações do Administrador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStores.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Cat */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center font-bold text-slate-700">
                            {st.logo_url ? (
                              <img
                                src={st.logo_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              st.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <p className="font-extrabold text-sm text-slate-900">{st.name}</p>
                            <Badge
                              variant="outline"
                              className="text-[10px] py-0 px-1.5 font-semibold"
                            >
                              {st.category}
                            </Badge>
                          </div>
                        </div>
                      </td>

                      {/* Approval Status */}
                      <td className="py-4 px-4">
                        {st.approval_status === 'approved' && (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 gap-1 font-semibold">
                            <Check className="w-3 h-3" /> Aprovada
                          </Badge>
                        )}
                        {st.approval_status === 'pending' && (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-300 gap-1 font-semibold animate-pulse">
                            <Clock className="w-3 h-3" /> Pendente
                          </Badge>
                        )}
                        {st.approval_status === 'rejected' && (
                          <Badge className="bg-rose-100 text-rose-800 border-rose-200 gap-1 font-semibold">
                            <X className="w-3 h-3" /> Recusada
                          </Badge>
                        )}
                      </td>

                      {/* Subscription Status */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            {st.subscription_status === 'active' && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            )}
                            {st.subscription_status === 'trial' && (
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                            )}
                            {st.subscription_status === 'overdue' && (
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                            )}
                            {st.subscription_status === 'cancelled' && (
                              <span className="w-2 h-2 rounded-full bg-slate-400" />
                            )}
                            <span className="font-bold text-slate-800 capitalize">
                              {st.subscription_status === 'active'
                                ? 'Pago / Ativo'
                                : st.subscription_status === 'trial'
                                  ? 'Período de Teste'
                                  : st.subscription_status === 'overdue'
                                    ? 'Em Atraso'
                                    : 'Cancelado'}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500">
                            {st.expand?.subscription_plan_id?.name || 'Plano Padrão'}
                            {st.subscription_expires_at &&
                              ` • Vence: ${st.subscription_expires_at}`}
                          </p>
                        </div>
                      </td>

                      {/* City / Phone */}
                      <td className="py-4 px-4 text-slate-600">
                        <p>{st.city || 'São Paulo - SP'}</p>
                        <p className="text-[11px] text-slate-400">{st.phone || '-'}</p>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {st.approval_status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApproveStore(st)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-2.5 gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectStore(st)}
                                className="border-rose-300 text-rose-600 hover:bg-rose-50 font-bold text-xs h-8 px-2.5 gap-1"
                              >
                                <X className="w-3.5 h-3.5" />
                                Recusar
                              </Button>
                            </>
                          )}

                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openSubscriptionModal(st)}
                            className="text-xs h-8 px-2.5 gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Gerenciar Assinatura
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredStores.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Nenhuma loja encontrada com os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 2: PLANOS DE ASSINATURA */}
        {/* ======================================================== */}
        <TabsContent value="plans" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">
                Planos de Assinatura para Lojistas
              </h3>
              <p className="text-xs text-slate-500">
                Defina os planos de cobrança (mensal, semestral, anual), valores e prazos de teste
                em dias
              </p>
            </div>
            <Button
              onClick={() => openPlanModal()}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Adicionar Novo Plano
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => {
              const features = Array.isArray(p.features)
                ? p.features
                : typeof p.features === 'string' && p.features.startsWith('[')
                  ? JSON.parse(p.features)
                  : []

              return (
                <Card
                  key={p.id}
                  className="rounded-3xl border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="p-6 bg-slate-50/80 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <Badge className="bg-purple-100 text-purple-800 border-purple-200 font-bold uppercase text-[10px]">
                        {p.slug}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openPlanModal(p)}
                        className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <CardTitle className="text-xl font-black text-slate-900">{p.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-3xl font-black text-slate-900">
                        R$ {Number(p.price).toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-xs text-slate-500 ml-1">
                        /{' '}
                        {p.billing_interval_months === 1
                          ? 'mês'
                          : `${p.billing_interval_months} meses`}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 font-bold">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>{p.trial_days} dias de teste grátis</span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      {p.description && (
                        <p className="text-xs text-slate-600 mb-4">{p.description}</p>
                      )}

                      <div className="space-y-2">
                        <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                          Recursos Inclusos:
                        </p>
                        {features.map((feat: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Status no portal:</span>
                      <Badge variant={p.is_active ? 'default' : 'secondary'}>
                        {p.is_active ? 'Ativo para adesão' : 'Desativado'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 3: RELATÓRIO GLOBAL DE VENDAS */}
        {/* ======================================================== */}
        <TabsContent value="reports" className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <h3 className="font-extrabold text-lg text-slate-900 mb-1">
              Registro Geral de Vendas e Resgates
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Transações geradas pelos lojistas ao cadastrar compras de clientes
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Loja</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Valor da Compra</th>
                    <th className="py-3 px-4">Benefício Gerado / Resgatado</th>
                    <th className="py-3 px-4">Observações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchases.map((pc) => {
                    const storeName =
                      pc.expand?.store_id?.name ||
                      stores.find((s) => s.id === pc.store_id)?.name ||
                      'Loja'
                    const customerName = pc.expand?.customer_id?.name || 'Cliente'

                    return (
                      <tr key={pc.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(pc.created).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(pc.created).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{storeName}</td>
                        <td className="py-3 px-4 text-slate-700">{customerName}</td>
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
                              -{pc.points_spent} pontos gastos
                            </span>
                          ) : pc.cashback_spent ? (
                            <span className="text-rose-600 font-semibold">
                              -R$ {Number(pc.cashback_spent).toFixed(2)} resgatados
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                          {pc.notes || '-'}
                        </td>
                      </tr>
                    )
                  })}
                  {purchases.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Nenhuma transação registrada no sistema até o momento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* MODAL: EDIT/CREATE SUBSCRIPTION PLAN */}
      <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">
              {editingPlan ? 'Editar Plano de Assinatura' : 'Novo Plano de Assinatura'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Configure o preço, período de cobrança e prazo de teste em dias para os lojistas.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePlan} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Nome do Plano</Label>
              <Input
                required
                placeholder="Ex: Plano Mensal Pro"
                value={planFormName}
                onChange={(e) => setPlanFormName(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Preço (R$)</Label>
                <Input
                  type="number"
                  step="0.10"
                  required
                  value={planFormPrice}
                  onChange={(e) => setPlanFormPrice(Number(e.target.value))}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Intervalo (Meses)</Label>
                <Input
                  type="number"
                  required
                  min={1}
                  value={planFormBilling}
                  onChange={(e) => setPlanFormBilling(Number(e.target.value))}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Prazo de Teste Grátis (Dias)
              </Label>
              <Input
                type="number"
                required
                min={0}
                value={planFormTrial}
                onChange={(e) => setPlanFormTrial(Number(e.target.value))}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Descrição Comercial</Label>
              <Textarea
                rows={2}
                placeholder="Breve resumo dos benefícios deste plano..."
                value={planFormDesc}
                onChange={(e) => setPlanFormDesc(e.target.value)}
                className="text-xs resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Benefícios Inclusos (um por linha)
              </Label>
              <Textarea
                rows={3}
                placeholder="1 loja inclusa&#10;Selos e cashback&#10;Suporte prioritário"
                value={planFormFeatures}
                onChange={(e) => setPlanFormFeatures(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPlanModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
              >
                Salvar Plano
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDIT STORE SUBSCRIPTION STATUS */}
      <Dialog open={!!storeToEditSub} onOpenChange={(open) => !open && setStoreToEditSub(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">
              Gerenciar Assinatura da Loja
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Loja: <strong>{storeToEditSub?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Plano Escolhido</Label>
              <Select value={subPlanChoice} onValueChange={setSubPlanChoice}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Selecione o plano" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} - R$ {Number(p.price).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Status de Pagamento da Assinatura
              </Label>
              <Select
                value={subStatusChoice}
                onValueChange={(val) => setSubStatusChoice(val as SubscriptionStatus)}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Em Período de Teste (Trial)</SelectItem>
                  <SelectItem value="active">Pago / Assinatura Ativa</SelectItem>
                  <SelectItem value="overdue">Em Atraso / Pendente de Pagamento</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Data de Validade / Renovação
              </Label>
              <Input
                type="date"
                value={subExpiryDate}
                onChange={(e) => setSubExpiryDate(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStoreToEditSub(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveStoreSubscription}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
              >
                Salvar Alterações
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  getCustomerCards,
  getCustomerPurchases,
  getStoreFidelityPlan,
} from '@/services/fidelityService'
import type { CustomerCardRecord, PurchaseRecord, FidelityPlanRecord } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  CreditCard,
  Award,
  Coins,
  Percent,
  Sparkles,
  QrCode,
  Gift,
  Store,
  Clock,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Copy,
  Check,
  FileText,
  UserCheck,
  Settings,
  Phone,
  Mail,
  User,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatCPF, formatCNPJ, cleanDocument } from '@/lib/documentValidation'
import { LogoSymbol } from '@/components/Logo'
import { EditCustomerProfileDialog } from '@/components/EditCustomerProfileDialog'

export default function CustomerDashboard() {
  const { user, role, isAuthenticated, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [cards, setCards] = useState<CustomerCardRecord[]>([])
  const [plansMap, setPlansMap] = useState<Record<string, FidelityPlanRecord | null>>({})
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Active card for presentation modal
  const [selectedCard, setSelectedCard] = useState<CustomerCardRecord | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login?tipo=cliente')
      return
    }
    if (isAuthenticated && user) {
      loadCustomerData()
    }
  }, [isAuthenticated, user, authLoading])

  const loadCustomerData = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const [cardsData, purchasesData] = await Promise.all([
        getCustomerCards(user.id),
        getCustomerPurchases(user.id),
      ])

      setCards(cardsData)
      setPurchases(purchasesData)

      // Load plans for each store card
      const planPromises = cardsData.map(async (c) => {
        const plan = await getStoreFidelityPlan(c.store_id)
        return { storeId: c.store_id, plan }
      })
      const plansResults = await Promise.all(planPromises)
      const newPlansMap: Record<string, FidelityPlanRecord | null> = {}
      plansResults.forEach((res) => {
        newPlansMap[res.storeId] = res.plan
      })
      setPlansMap(newPlansMap)
    } catch (err) {
      console.error('Error loading customer dashboard:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyCode = () => {
    if (user?.customer_code) {
      navigator.clipboard.writeText(user.customer_code)
      setCopiedCode(true)
      toast({
        title: 'Código copiado!',
        description: `Código ${user.customer_code} copiado para a área de transferência.`,
      })
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  // Totals across all stores
  const totalStamps = cards.reduce((acc, c) => acc + (c.stamps_count || 0), 0)
  const totalPoints = cards.reduce((acc, c) => acc + (c.points_balance || 0), 0)
  const totalCashback = cards.reduce((acc, c) => acc + (c.cashback_balance || 0), 0)
  const totalSpentAll = cards.reduce((acc, c) => acc + (c.total_spent || 0), 0)

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl flex-1">
      {/* HEADER & DIGITAL ID BANNER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 items-center">
        {/* User Welcome */}
        <div className="lg:col-span-7 space-y-2">
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 gap-1 font-bold">
            <CreditCard className="w-3.5 h-3.5" />
            Cartão de Fidelidade do Cliente
          </Badge>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Olá, {user?.name}!
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditProfileOpen(true)}
              className="rounded-full text-xs font-bold border-slate-300 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50/60 gap-1.5 shadow-xs"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              Meus Dados / Alterar Senha
            </Button>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xl">
            Apresente seu código de cliente nas lojas parceiras na hora de pagar para acumular selos
            digitais, pontos ou saldo em cashback.
          </p>
        </div>

        {/* DIGITAL PASS CARD / QR IDENTIFIER */}
        <div className="lg:col-span-5">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 text-white p-6 shadow-2xl shadow-slate-950/40 border border-slate-800">
            {/* Glow light */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-rose-500/15 rounded-full blur-2xl" />

            <div className="relative z-10 flex items-start justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center p-1 shadow-sm">
                  <LogoSymbol size={28} theme="dark" />
                </div>
                <div>
                  <span className="font-extrabold text-base tracking-tight text-white">
                    Cartão Digital
                  </span>
                  <span className="block text-[10px] text-blue-300 font-semibold uppercase tracking-wider">
                    Fideliza Pass
                  </span>
                </div>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-300 font-mono text-xs border-emerald-500/30">
                Ativo
              </Badge>
            </div>
            <div className="space-y-1 mb-4">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Seu Código de Identificação
              </p>
              <div className="flex items-center justify-between bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10">
                <div className="flex items-center gap-2 flex-wrap">
                  <QrCode className="w-6 h-6 text-amber-400 shrink-0" />
                  <span className="text-2xl font-mono font-black tracking-widest text-white">
                    {user?.customer_code || 'CLI-0000'}
                  </span>
                  {user?.document && (
                    <Badge
                      variant="outline"
                      className="border-amber-400/40 text-amber-300 font-mono text-[11px] py-0.5 px-2 bg-amber-400/10 gap-1"
                    >
                      <FileText className="w-3 h-3" />
                      {cleanDocument(user.document).length > 11
                        ? `CNPJ: ${formatCNPJ(cleanDocument(user.document))}`
                        : `CPF: ${formatCPF(cleanDocument(user.document))}`}
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyCode}
                  className="h-8 px-2 text-xs text-slate-200 hover:text-white hover:bg-white/20 shrink-0"
                >
                  {copiedCode ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/10">
              <span>{user?.name}</span>
              <span>{user?.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SUMMARY STATS BAR */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="rounded-2xl border-slate-200 bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Lojas Fidelizadas
              </p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{cards.length}</h3>
              <p className="text-[11px] text-slate-500 mt-1">Cartões em uso</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Store className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total de Selos
              </p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">{totalStamps}</h3>
              <p className="text-[11px] text-amber-700 mt-1 font-semibold">Selos acumulados</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Saldo de Pontos
              </p>
              <h3 className="text-2xl font-black text-indigo-600 mt-1">{totalPoints}</h3>
              <p className="text-[11px] text-indigo-700 mt-1 font-semibold">Pontos válidos</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Coins className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Saldo Cashback
              </p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">
                R$ {totalCashback.toFixed(2)}
              </h3>
              <p className="text-[11px] text-emerald-700 mt-1 font-semibold">
                Disponível p/ abater
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Percent className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABS: MEUS CARTÕES / HISTÓRICO DE COMPRAS */}
      <Tabs defaultValue="cards" className="space-y-6">
        <TabsList className="bg-slate-200/70 p-1 rounded-xl">
          <TabsTrigger value="cards" className="gap-2 text-xs sm:text-sm font-semibold">
            <CreditCard className="w-4 h-4" />
            Meus Cartões de Fidelidade ({cards.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 text-xs sm:text-sm font-semibold">
            <Clock className="w-4 h-4" />
            Histórico de Acúmulos e Resgates
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2 text-xs sm:text-sm font-semibold">
            <User className="w-4 h-4" />
            Meus Dados Cadastrais
          </TabsTrigger>
        </TabsList>

        {/* ======================================================== */}
        {/* TAB 1: CARTÕES DIGITAIS POR LOJA */}
        {/* ======================================================== */}
        <TabsContent value="cards" className="space-y-6">
          {cards.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-300 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
                <Store className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Você ainda não tem cartões de fidelidade
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Explore as lojas parceiras no portal e informe seu código{' '}
                <span className="font-mono font-bold text-slate-700">{user?.customer_code}</span> ao
                pagar a primeira compra.
              </p>
              <Button
                onClick={() => navigate('/')}
                className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-xs"
              >
                Explorar Lojas Parceiras
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cards.map((card) => {
                const store = card.expand?.store_id
                const plan = plansMap[card.store_id]
                const storeName = store?.name || 'Loja Parceira'
                const isReadyToRedeem =
                  (plan?.type === 'stamps' &&
                    (card.stamps_count || 0) >= (plan.target_stamps || 10)) ||
                  (plan?.type === 'points' &&
                    (card.points_balance || 0) >= (plan.points_to_redeem || 100)) ||
                  (plan?.type === 'cashback' && (card.cashback_balance || 0) > 0)

                return (
                  <Card
                    key={card.id}
                    className="rounded-3xl border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between bg-white"
                  >
                    {/* Header with store info */}
                    <div className="p-5 pb-4 border-b border-slate-100 bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-700 shrink-0">
                          {store?.logo_url ? (
                            <img
                              src={store.logo_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            storeName.charAt(0)
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <h3 className="font-extrabold text-base text-slate-900 truncate">
                            {storeName}
                          </h3>
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0 px-1.5 font-semibold"
                          >
                            {store?.category || 'Parceiro'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Loyalty Progress Card Body */}
                    <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      {/* TYPE: STAMPS */}
                      {plan?.type === 'stamps' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                              <Award className="w-4 h-4 text-amber-600" />
                              Cartão de Selos
                            </span>
                            <span className="text-xs font-black text-amber-700">
                              {card.stamps_count || 0} / {plan.target_stamps || 10}
                            </span>
                          </div>

                          {/* Visual stamp grid (e.g. 10 slots) */}
                          <div className="grid grid-cols-5 gap-2 pt-1">
                            {Array.from({ length: plan.target_stamps || 10 }).map((_, idx) => {
                              const filled = idx < (card.stamps_count || 0)
                              return (
                                <div
                                  key={idx}
                                  className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                                    filled
                                      ? 'bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-xs'
                                      : 'bg-slate-100 text-slate-300 border border-dashed border-slate-300'
                                  }`}
                                >
                                  {filled ? <Sparkles className="w-3.5 h-3.5" /> : idx + 1}
                                </div>
                              )
                            })}
                          </div>

                          {plan.reward_title && (
                            <p className="text-[11px] text-slate-600 bg-amber-50 p-2 rounded-xl border border-amber-200">
                              🎁 <strong>Meta:</strong> {plan.reward_title}
                            </p>
                          )}
                        </div>
                      )}

                      {/* TYPE: POINTS */}
                      {plan?.type === 'points' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                              <Coins className="w-4 h-4 text-indigo-600" />
                              Pontos Acumulados
                            </span>
                            <span className="text-base font-black text-indigo-600">
                              {card.points_balance || 0} pts
                            </span>
                          </div>

                          {/* Progress bar towards reward */}
                          <div className="space-y-1">
                            <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-rose-500 rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    ((card.points_balance || 0) / (plan.points_to_redeem || 100)) *
                                      100,
                                  )}%`,
                                }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span>0 pts</span>
                              <span>Meta: {plan.points_to_redeem || 100} pts</span>
                            </div>
                          </div>

                          {plan.reward_title && (
                            <p className="text-[11px] text-slate-600 bg-indigo-50 p-2 rounded-xl border border-indigo-200">
                              🎁 <strong>Prêmio:</strong> {plan.reward_title}
                            </p>
                          )}
                        </div>
                      )}

                      {/* TYPE: CASHBACK */}
                      {plan?.type === 'cashback' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                              <Percent className="w-4 h-4 text-emerald-600" />
                              Saldo Cashback
                            </span>
                            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] border-emerald-300">
                              {plan.cashback_percentage || 5}% de volta
                            </Badge>
                          </div>

                          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                            <p className="text-[10px] uppercase font-bold text-emerald-700">
                              Disponível para abater
                            </p>
                            <p className="text-2xl font-black text-emerald-700 mt-0.5">
                              R$ {(card.cashback_balance || 0).toFixed(2)}
                            </p>
                          </div>

                          <p className="text-[11px] text-slate-500 leading-tight">
                            Apresente seu código no caixa desta loja para abater este saldo do valor
                            da sua próxima conta.
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="pt-2">
                        {isReadyToRedeem ? (
                          <Button
                            onClick={() => setSelectedCard(card)}
                            className="w-full bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-bold text-xs py-2 rounded-xl shadow-md"
                          >
                            <Gift className="w-3.5 h-3.5 mr-1.5" />
                            Apresentar para Resgatar
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => setSelectedCard(card)}
                            className="w-full text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl"
                          >
                            Ver Cartão no Caixa
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 2: HISTÓRICO DE COMPRAS E RESGATES */}
        {/* ======================================================== */}
        <TabsContent value="history" className="space-y-6">
          <Card className="rounded-3xl border-slate-200 shadow-xs">
            <CardHeader>
              <CardTitle className="text-lg font-black text-slate-900">
                Extrato de Acúmulos e Resgates
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Todas as movimentações registradas no seu cartão digital nas lojas parceiras
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Data/Hora</th>
                      <th className="py-3 px-4">Loja Parceira</th>
                      <th className="py-3 px-4">Tipo</th>
                      <th className="py-3 px-4">Valor da Compra</th>
                      <th className="py-3 px-4">Benefício Conquistado / Usado</th>
                      <th className="py-3 px-4">Detalhes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {purchases.map((pc) => {
                      const storeName = pc.expand?.store_id?.name || 'Loja Parceira'
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
                                -{pc.points_spent} pontos
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
                      )
                    })}
                    {purchases.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Nenhum registro de compra encontrado no seu cartão até o momento.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 3: MEUS DADOS CADASTRAIS (VISUALIZAÇÃO E EDIÇÃO) */}
        {/* ======================================================== */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="rounded-3xl border-slate-200 shadow-xs overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/60 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  Dados da Sua Conta
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Visualize seus dados atuais e edite seu nome, telefone ou senha de acesso a
                  qualquer momento.
                </CardDescription>
              </div>

              <Button
                onClick={() => setIsEditProfileOpen(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm gap-2 shrink-0"
              >
                <Settings className="w-3.5 h-3.5" />
                Alterar Meus Dados / Senha
              </Button>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Nome Completo
                  </p>
                  <p className="text-sm font-bold text-slate-900">{user?.name || '-'}</p>
                  <p className="text-[11px] text-slate-400">Exibido nos cartões e extratos</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Telefone / WhatsApp
                  </p>
                  <p className="text-sm font-bold text-slate-900 font-mono">
                    {user?.phone || 'Não informado'}
                  </p>
                  <p className="text-[11px] text-slate-400">Notificações e contato das lojas</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    E-mail de Acesso
                  </p>
                  <p className="text-sm font-bold text-slate-900 truncate" title={user?.email}>
                    {user?.email || '-'}
                  </p>
                  <p className="text-[11px] text-slate-400">Login principal no portal</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5 text-slate-400" />
                    Código de Identificação
                  </p>
                  <p className="text-base font-mono font-black text-slate-900">
                    {user?.customer_code || 'CLI-0000'}
                  </p>
                  <p className="text-[11px] text-slate-400">Usado para acumular nos caixas</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    CPF / CNPJ Vinculado
                  </p>
                  <p className="text-sm font-mono font-bold text-slate-900">
                    {user?.document
                      ? cleanDocument(user.document).length > 11
                        ? formatCNPJ(cleanDocument(user.document))
                        : formatCPF(cleanDocument(user.document))
                      : 'Não cadastrado'}
                  </p>
                  <p className="text-[11px] text-slate-400">Identificação complementar</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Status da Conta
                  </p>
                  <div className="pt-0.5">
                    {user?.verified ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
                        E-mail Verificado
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-amber-700 border-amber-300 bg-amber-50 text-xs"
                      >
                        Pendente de confirmação
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">Segurança do acesso</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL: PRESENT DIGITAL CARD AT CASHIER */}
      <Dialog open={!!selectedCard} onOpenChange={(open) => !open && setSelectedCard(null)}>
        <DialogContent className="max-w-md rounded-3xl p-6 text-center">
          {selectedCard && (
            <div className="space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 via-amber-500 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-rose-500/20">
                <Sparkles className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">
                  {selectedCard.expand?.store_id?.name || 'Cartão Digital'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Mostre este código para o atendente da loja no momento do pagamento
                </p>
              </div>

              {/* Big code display */}
              <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-3 shadow-xl">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Código do Cliente
                </p>
                <div className="flex items-center justify-center gap-2">
                  <QrCode className="w-8 h-8 text-amber-400" />
                  <span className="text-3xl sm:text-4xl font-mono font-black tracking-widest text-white">
                    {user?.customer_code}
                  </span>
                </div>
                {user?.document && (
                  <p className="text-xs font-mono text-amber-400 font-semibold">
                    {cleanDocument(user.document).length > 11
                      ? `CNPJ: ${formatCNPJ(cleanDocument(user.document))}`
                      : `CPF: ${formatCPF(cleanDocument(user.document))}`}
                  </p>
                )}
                <p className="text-xs text-amber-300 font-semibold">{user?.name}</p>
              </div>

              {/* Balances summary */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  <p className="text-[10px] text-amber-800 font-bold uppercase">Selos</p>
                  <p className="text-base font-black text-amber-900 mt-0.5">
                    {selectedCard.stamps_count || 0}
                  </p>
                </div>
                <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-200">
                  <p className="text-[10px] text-indigo-800 font-bold uppercase">Pontos</p>
                  <p className="text-base font-black text-indigo-900 mt-0.5">
                    {selectedCard.points_balance || 0}
                  </p>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  <p className="text-[10px] text-emerald-800 font-bold uppercase">Cashback</p>
                  <p className="text-base font-black text-emerald-900 mt-0.5">
                    R$ {(selectedCard.cashback_balance || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setSelectedCard(null)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-5 rounded-xl text-xs"
              >
                Fechar Cartão
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: EDIT CUSTOMER PROFILE & PASSWORD */}
      <EditCustomerProfileDialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen} />
    </div>
  )
}

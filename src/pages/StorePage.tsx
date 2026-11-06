import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { StoreRecord, FidelityPlanRecord, CustomerCardRecord } from '@/types'
import {
  getStoreBySlug,
  getStoreFidelityPlan,
  getCustomerCardForStore,
  isCustomerFidelityEnrolled,
  enrollCustomerToStore,
  unenrollCustomerFromStore,
  getStoreImageUrl,
} from '@/services/fidelityService'
import { formatWhatsAppUrl, formatWhatsAppDisplay } from '@/lib/whatsapp'
import { AppointmentBooking } from '@/components/AppointmentBooking'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Store,
  MapPin,
  Phone,
  MessageCircle,
  Gift,
  Award,
  Coins,
  Percent,
  CheckCircle2,
  Sparkles,
  Calendar as CalendarIcon,
  ArrowLeft,
  Share2,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  ShieldAlert,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function StorePage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user, role, isAuthenticated } = useAuth()

  const [store, setStore] = useState<StoreRecord | null>(null)
  const [plan, setPlan] = useState<FidelityPlanRecord | null>(null)
  const [customerCard, setCustomerCard] = useState<CustomerCardRecord | null>(null)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      if (!slug) {
        setNotFound(true)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setNotFound(false)

      try {
        const storeData = await getStoreBySlug(slug)
        if (!isMounted) return

        if (!storeData) {
          setNotFound(true)
          setIsLoading(false)
          return
        }

        setStore(storeData)

        // Se a loja estiver suspensa no portal público, não carregar o resto
        if (storeData.suspend_public) {
          setIsLoading(false)
          return
        }

        // Carregar plano de fidelidade
        const planData = await getStoreFidelityPlan(storeData.id)
        if (!isMounted) return
        setPlan(planData)

        // Carregar dados de cliente logado
        if (user && role === 'customer') {
          const [card, enrolled] = await Promise.all([
            getCustomerCardForStore(user.id, storeData.id),
            isCustomerFidelityEnrolled(user.id, storeData.id),
          ])
          if (!isMounted) return
          setCustomerCard(card)
          setIsEnrolled(enrolled)
        } else {
          setCustomerCard(null)
          setIsEnrolled(false)
        }
      } catch (err) {
        console.error('Erro ao carregar dados da loja:', err)
        if (isMounted) setNotFound(true)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [slug, user, role])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopiedLink(true)
      toast({
        title: 'Link copiado!',
        description: 'O link da loja foi copiado para a área de transferência.',
      })
      setTimeout(() => setCopiedLink(false), 2500)
    } catch {
      toast({
        title: 'Erro ao copiar',
        description: 'Selecione e copie o endereço do navegador.',
        variant: 'destructive',
      })
    }
  }

  const handleToggleFidelity = async () => {
    if (!store || !user || role !== 'customer') return

    if (store.suspend_public || store.suspend_merchant) {
      toast({
        title: 'Loja indisponível',
        description: 'Esta loja está temporariamente indisponível para novas fidelizações.',
        variant: 'destructive',
      })
      return
    }

    setIsEnrolling(true)
    try {
      if (isEnrolled) {
        await unenrollCustomerFromStore(user.id, store.id)
        setIsEnrolled(false)
        toast({
          title: 'Fidelização cancelada',
          description: 'Você cancelou sua fidelização com esta loja.',
        })
      } else {
        await enrollCustomerToStore(user.id, store.id)
        setIsEnrolled(true)
        const updatedCard = await getCustomerCardForStore(user.id, store.id)
        setCustomerCard(updatedCard)
        toast({
          title: 'Parabéns! Você está fidelizado',
          description: 'Seus dados e código já constam na base da loja.',
        })
      }
    } catch (err: any) {
      console.error('Erro ao alternar fidelização:', err)
      toast({
        title: 'Erro ao atualizar fidelização',
        description: err.message || 'Tente novamente em instantes.',
        variant: 'destructive',
      })
    } finally {
      setIsEnrolling(false)
    }
  }

  const renderPlanBadge = (p: FidelityPlanRecord | null) => {
    if (!p) {
      return <span className="text-xs text-slate-400 italic">Programa em breve</span>
    }

    if (p.type === 'stamps') {
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-300 gap-1 font-semibold text-xs">
          <Award className="w-3.5 h-3.5 text-amber-600" />
          {p.target_stamps || 10} Selos = Brinde
        </Badge>
      )
    }

    if (p.type === 'points') {
      return (
        <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300 gap-1 font-semibold text-xs">
          <Coins className="w-3.5 h-3.5 text-indigo-600" />
          {p.points_per_currency || 1} pt/R$ • Resgate {p.points_to_redeem} pts
        </Badge>
      )
    }

    return (
      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 gap-1 font-semibold text-xs">
        <Percent className="w-3.5 h-3.5 text-emerald-600" />
        {p.cashback_percentage || 5}% de Cashback
      </Badge>
    )
  }

  // Estado 1: Carregando
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Carregando loja...</p>
        </div>
      </div>
    )
  }

  // Estado 2: Loja não encontrada
  if (notFound || !store) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-slate-200 shadow-sm rounded-3xl overflow-hidden text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-slate-900 mb-2">Loja não encontrada</h1>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            O link que você acessou não corresponde a nenhum estabelecimento ativo no Fideliza.
            Verifique se o endereço foi digitado corretamente.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              onClick={() => navigate('/')}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Ver Lojas no Portal
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Estado 3: Loja suspensa no portal público
  if (store.suspend_public) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-amber-200 bg-amber-50/50 shadow-sm rounded-3xl overflow-hidden text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <Badge className="bg-amber-200/80 text-amber-900 border-0 text-xs font-semibold mb-3">
            Página Temporariamente Indisponível
          </Badge>
          <h1 className="text-xl font-black text-slate-900 mb-2">{store.name}</h1>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Esta loja está temporariamente indisponível no portal público. Se você é o proprietário
            desta loja, acesse a área do lojista para regularizar a assinatura ou entre em contato
            com o suporte do Fideliza.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="rounded-xl border-slate-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Portal
            </Button>
            {user?.id === store.owner_id && (
              <Button
                onClick={() => navigate('/lojista')}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl"
              >
                Ir para o Painel do Lojista
              </Button>
            )}
          </div>
        </Card>
      </div>
    )
  }

  const logoUrl = getStoreImageUrl(store, 'logo')
  const bannerUrl = getStoreImageUrl(store, 'banner') || store.banner_url

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      {/* Top navigation bar */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="container mx-auto max-w-4xl px-4 py-3 flex items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-rose-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Todas as Lojas</span>
            <span className="sm:hidden">Voltar</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="rounded-xl text-xs font-bold gap-1.5 border-slate-200 hover:bg-slate-50"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Compartilhar</span>
                </>
              )}
            </Button>

            {store.whatsapp && (
              <a
                href={formatWhatsAppUrl(store.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Conversar no WhatsApp</span>
                <span className="sm:hidden">WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 pt-6">
        {/* Main Store Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden mb-6">
          {/* Cover Banner */}
          <div className="relative h-48 sm:h-64 w-full bg-slate-900 overflow-hidden">
            {bannerUrl ? (
              <img
                src={bannerUrl}
                alt={`Capa da loja ${store.name}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-slate-900 via-rose-950 to-slate-900 flex items-center justify-center">
                <Store className="w-16 h-16 text-white/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

            {/* Category pill on banner */}
            <Badge className="absolute top-4 right-4 bg-white/95 text-slate-800 backdrop-blur-md border-0 text-xs font-bold shadow-xs">
              {store.category}
            </Badge>

            {/* Header info over banner bottom */}
            <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3.5 sm:gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-1 shadow-2xl shrink-0 overflow-hidden border-2 border-white">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={`Logo de ${store.name}`}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full bg-rose-600 text-white font-black text-2xl sm:text-3xl flex items-center justify-center rounded-xl">
                    {store.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="text-white pb-1 flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-black leading-tight drop-shadow-sm truncate">
                  {store.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-200 font-medium truncate">
                  {store.city || store.category}
                </p>
              </div>
            </div>
          </div>

          {/* Store Info Content */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Description */}
            {store.description && (
              <div>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Sobre o Estabelecimento
                </h2>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                  {store.description}
                </p>
              </div>
            )}

            {/* Contact & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs sm:text-sm">
              {store.address && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-800">Endereço</p>
                    <p className="text-slate-600">{store.address}</p>
                    {store.city && <p className="text-slate-500 text-xs">{store.city}</p>}
                  </div>
                </div>
              )}

              {store.phone && (
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-800">Telefone</p>
                    <p className="text-slate-600">{store.phone}</p>
                  </div>
                </div>
              )}

              {store.whatsapp && (
                <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/90 p-3.5 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-emerald-950 text-xs sm:text-sm">
                        WhatsApp Oficial da Loja
                      </p>
                      <p className="text-[11px] sm:text-xs text-emerald-800 font-mono">
                        {formatWhatsAppDisplay(store.whatsapp)}
                      </p>
                    </div>
                  </div>

                  <a
                    href={formatWhatsAppUrl(store.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Iniciar Conversa
                  </a>
                </div>
              )}
            </div>

            {/* FIDELITY PROGRAM SECTION */}
            <div className="border border-rose-100 bg-gradient-to-br from-rose-50/60 to-amber-50/60 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-black text-slate-900 text-base sm:text-lg">
                    Programa de Fidelidade Oficial
                  </h2>
                  <p className="text-xs text-slate-500">
                    Como acumular benefícios e recompensas nesta loja
                  </p>
                </div>
              </div>

              {plan ? (
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-rose-200/70 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-slate-900 text-base">{plan.title}</span>
                      {renderPlanBadge(plan)}
                    </div>

                    {plan.description && (
                      <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
                        {plan.description}
                      </p>
                    )}

                    {/* Regras específicas */}
                    {plan.type === 'stamps' && (
                      <div className="text-xs sm:text-sm bg-amber-50 text-amber-950 p-4 rounded-xl border border-amber-200 space-y-1.5">
                        <p className="font-bold text-amber-900">Regra de Acúmulo de Selos:</p>
                        <p>
                          • A cada <strong>R$ {(plan.min_purchase_amount || 1).toFixed(2)}</strong>{' '}
                          em compras = <strong>1 selo</strong> no seu cartão.
                        </p>
                        <p>
                          • Meta para resgatar prêmio:{' '}
                          <strong>{plan.target_stamps || 10} selos</strong>.
                        </p>
                        {plan.reward_title && (
                          <div className="pt-2 mt-1 border-t border-amber-200/80">
                            <p className="font-bold text-amber-900 flex items-center gap-1.5">
                              🎁 Recompensa:{' '}
                              <span className="text-amber-800">{plan.reward_title}</span>
                            </p>
                            {plan.reward_description && (
                              <p className="text-xs text-amber-800 mt-0.5">
                                {plan.reward_description}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {plan.type === 'points' && (
                      <div className="text-xs sm:text-sm bg-indigo-50 text-indigo-950 p-4 rounded-xl border border-indigo-200 space-y-1.5">
                        <p className="font-bold text-indigo-900">Regra de Pontuação:</p>
                        <p>
                          • <strong>R$ 1,00</strong> gasto ={' '}
                          <strong>{plan.points_per_currency || 1} ponto(s)</strong>.
                        </p>
                        <p>
                          • Meta para resgatar:{' '}
                          <strong>{plan.points_to_redeem || 100} pontos</strong>.
                        </p>
                        {plan.reward_title && (
                          <div className="pt-2 mt-1 border-t border-indigo-200/80">
                            <p className="font-bold text-indigo-900 flex items-center gap-1.5">
                              🎁 Recompensa:{' '}
                              <span className="text-indigo-800">{plan.reward_title}</span>
                            </p>
                            {plan.reward_description && (
                              <p className="text-xs text-indigo-800 mt-0.5">
                                {plan.reward_description}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {plan.type === 'cashback' && (
                      <div className="text-xs sm:text-sm bg-emerald-50 text-emerald-950 p-4 rounded-xl border border-emerald-200 space-y-1.5">
                        <p className="font-bold text-emerald-900">Regra de Cashback:</p>
                        <p>
                          • Receba <strong>{plan.cashback_percentage || 5}%</strong> de todo o valor
                          gasto de volta no seu saldo digital.
                        </p>
                        <p>
                          • O saldo fica acumulado na sua conta e pode ser abatido em qualquer
                          compra futura nesta loja!
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Customer's current balance if logged in */}
                  {isAuthenticated && role === 'customer' && (
                    <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-xs text-slate-400 font-medium">
                          Seu saldo atual nesta loja:
                        </p>
                        <p className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5">
                          {plan.type === 'stamps' &&
                            `${customerCard?.stamps_count || 0} / ${plan.target_stamps || 10} Selos`}
                          {plan.type === 'points' && `${customerCard?.points_balance || 0} Pontos`}
                          {plan.type === 'cashback' &&
                            `R$ ${(customerCard?.cashback_balance || 0).toFixed(2)} de Cashback`}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => navigate('/cliente')}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
                      >
                        Abrir Meu Cartão Completo
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 bg-white/70 rounded-2xl text-xs sm:text-sm text-slate-500">
                  Esta loja está configurando seu programa de fidelidade. Em breve você poderá
                  acumular benefícios aqui!
                </div>
              )}
            </div>

            {/* FIDELIZAÇÃO: CARD DE AÇÃO PARA O CLIENTE */}
            {isAuthenticated && role === 'customer' ? (
              <div className="p-5 rounded-3xl border border-rose-200 bg-rose-50/70 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shrink-0 shadow-xs ${
                      isEnrolled ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                    }`}
                  >
                    {isEnrolled ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <Sparkles className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900 text-sm sm:text-base">
                      {isEnrolled
                        ? 'Você é um Cliente Fidelizado desta Loja!'
                        : 'Fidelize-se a esta Loja para concorrer a prêmios e sorteios!'}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {isEnrolled
                        ? 'Seus dados e código constam na base da loja e você participa de sorteios exclusivos.'
                        : 'Entre na base da loja para receber benefícios, promoções e concorrer aos sorteios.'}
                    </p>
                  </div>
                </div>

                <Button
                  size="default"
                  disabled={isEnrolling}
                  onClick={handleToggleFidelity}
                  className={
                    isEnrolled
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl shrink-0 w-full sm:w-auto'
                      : 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-md shrink-0 w-full sm:w-auto'
                  }
                >
                  {isEnrolling
                    ? 'Processando...'
                    : isEnrolled
                      ? 'Cancelar Fidelização'
                      : 'Fidelizar-se a esta Loja'}
                </Button>
              </div>
            ) : !isAuthenticated ? (
              <div className="p-5 rounded-3xl border border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="font-extrabold text-slate-900 text-sm sm:text-base">
                    Quer acumular benefícios nesta loja?
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Crie sua conta de cliente gratuita em menos de 1 minuto para receber selos,
                    pontos ou cashback.
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    onClick={() => navigate('/cadastro?tipo=cliente')}
                    className="flex-1 sm:flex-none bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
                  >
                    Criar Minha Conta
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/login')}
                    className="flex-1 sm:flex-none text-xs rounded-xl font-bold"
                  >
                    Entrar
                  </Button>
                </div>
              </div>
            ) : null}

            {/* SEÇÃO DE AGENDAMENTO DE SERVIÇOS (quando appointments_enabled) */}
            {store.appointments_enabled && (
              <div className="p-6 rounded-3xl border border-blue-200 bg-blue-50/50 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <CalendarIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-sm sm:text-base">
                        Agendamento de Serviços Online
                      </p>
                      <p className="text-xs text-slate-600">
                        Reserve seu horário diretamente com a equipe de {store.name} em poucos
                        cliques.
                      </p>
                    </div>
                  </div>

                  {role === 'customer' ? (
                    <Button
                      size="sm"
                      onClick={() => setIsBookingOpen(!isBookingOpen)}
                      className={
                        isBookingOpen
                          ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl shrink-0'
                          : 'bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs shrink-0'
                      }
                    >
                      <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                      {isBookingOpen ? 'Recolher Agendamento' : 'Agendar Serviço Agora'}
                    </Button>
                  ) : !isAuthenticated ? (
                    <Button
                      size="sm"
                      onClick={() => navigate('/login')}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs shrink-0"
                    >
                      <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                      Entrar para Agendar
                    </Button>
                  ) : null}
                </div>

                {isBookingOpen && role === 'customer' && (
                  <div className="pt-4 border-t border-blue-200/80">
                    <AppointmentBooking
                      store={store}
                      onSuccess={() => {
                        toast({
                          title: 'Agendamento solicitado com sucesso!',
                          description:
                            'A loja recebeu seu pedido. Acompanhe na aba Meus Agendamentos.',
                        })
                        setTimeout(() => {
                          setIsBookingOpen(false)
                          navigate('/cliente?tab=appointments')
                        }, 1500)
                      }}
                      onCancel={() => setIsBookingOpen(false)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Código do cliente se estiver logado */}
            {isAuthenticated && role === 'customer' && user?.customer_code && (
              <div className="bg-emerald-50 text-emerald-950 p-4 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-emerald-800 font-semibold block">
                      Apresente seu código no caixa ao comprar:
                    </span>
                    <span className="font-mono font-black text-lg text-emerald-900 tracking-wider">
                      {user.customer_code}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate('/cliente')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
                >
                  Ver Meu Cartão
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

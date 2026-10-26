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
  createInfinitePayCheckoutLink,
  getStoreSubscriptionPayments,
  getPaymentProviderInfo,
  getStoreFidelityCustomers,
  getStoreGiveaways,
  createGiveaway,
  drawGiveawayWinner,
  confirmGiveawayRedemption,
  deleteGiveaway,
  generatePixSubscriptionPayload,
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
  SubscriptionPaymentRecord,
  PaymentProviderInfoResponse,
  StoreCustomerRecord,
  GiveawayRecord,
  GiveawayRewardType,
  PixPayloadResponse,
} from '@/types'
import { QRCodeSVG } from 'qrcode.react'
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
  Sparkles,
  Search,
  UserCheck,
  CreditCard,
  QrCode,
  DollarSign,
  Loader2,
  FileDown,
  MessageCircle,
  Filter,
  Copy,
  AlertCircle,
  Upload,
  Image as ImageIcon,
} from 'lucide-react'
import { getStoreImageUrl } from '@/services/fidelityService'
import { useToast } from '@/hooks/use-toast'
import { formatCPF, formatCNPJ, cleanDocument } from '@/lib/documentValidation'
import { formatWhatsAppUrl, formatWhatsAppDisplay } from '@/lib/whatsapp'
import { generateSalesReportPDF } from '@/lib/pdfReport'

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
  const [storeWhatsapp, setStoreWhatsapp] = useState('')
  const [storeLogo, setStoreLogo] = useState('')
  const [storeBanner, setStoreBanner] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [bannerPreview, setBannerPreview] = useState<string>('')
  const [selectedSubPlanId, setSelectedSubPlanId] = useState('')
  const [isSavingStore, setIsSavingStore] = useState(false)

  // Subscription payment state (InfinitePay real checkout + Pix direto do admin)
  const [isPayModalOpen, setIsPayModalOpen] = useState(false)
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false)
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)
  const [copiedPix, setCopiedPix] = useState(false)
  const [infinitePayConfigured, setInfinitePayConfigured] = useState<boolean | null>(null)
  const [showPixFallback, setShowPixFallback] = useState(false)
  const [subPaymentsHistory, setSubPaymentsHistory] = useState<SubscriptionPaymentRecord[]>([])
  const [activeTab, setActiveTab] = useState<string>('pos')
  const [paymentProviderInfo, setPaymentProviderInfo] =
    useState<PaymentProviderInfoResponse | null>(null)

  // PIX direto gerado no servidor
  const [pixPayloadData, setPixPayloadData] = useState<PixPayloadResponse | null>(null)
  const [isLoadingPixPayload, setIsLoadingPixPayload] = useState(false)
  const [pixPayloadError, setPixPayloadError] = useState<string | null>(null)

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

  // Sales report filter state
  const [reportPeriodMonths, setReportPeriodMonths] = useState<string>('all')
  const [reportTypeFilter, setReportTypeFilter] = useState<string>('all')
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  // Marketing & Sorteios state
  const [fidelityCustomers, setFidelityCustomers] = useState<StoreCustomerRecord[]>([])
  const [giveaways, setGiveaways] = useState<GiveawayRecord[]>([])
  const [isCreateGiveawayOpen, setIsCreateGiveawayOpen] = useState(false)
  const [newGiveawayTitle, setNewGiveawayTitle] = useState('')
  const [newGiveawayRewardType, setNewGiveawayRewardType] = useState<GiveawayRewardType>('gift')
  const [newGiveawayDesc, setNewGiveawayDesc] = useState('')
  const [newGiveawayDiscount, setNewGiveawayDiscount] = useState<number | ''>('')
  const [newGiveawayDays, setNewGiveawayDays] = useState(7)
  const [isSavingGiveaway, setIsSavingGiveaway] = useState(false)
  const [isDrawingWinner, setIsDrawingWinner] = useState<string | null>(null)
  const [isConfirmingRedeem, setIsConfirmingRedeem] = useState<string | null>(null)
  const [customerFilterQuery, setCustomerFilterQuery] = useState('')

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (role !== 'merchant' && role !== 'admin'))) {
      navigate('/login?tipo=lojista')
      return
    }
    if (isAuthenticated && user) {
      loadMerchantData()
      loadProviderInfo()
    }
  }, [isAuthenticated, user, authLoading])

  const loadProviderInfo = async () => {
    try {
      const info = await getPaymentProviderInfo()
      setPaymentProviderInfo(info)
    } catch {
      /* intentionally ignored */
    }
  }

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
        setStoreWhatsapp(storeData.whatsapp || '')
        setStoreLogo(storeData.logo_url || '')
        setStoreBanner(storeData.banner_url || '')
        setSelectedSubPlanId(storeData.subscription_plan_id || plansList[0]?.id || '')

        // Fetch fidelity plan, purchases, customers and giveaways
        const [planData, purchasesData, customersData, giveawaysData] = await Promise.all([
          getStoreFidelityPlan(storeData.id),
          getStorePurchases(storeData.id),
          getStoreFidelityCustomers(storeData.id),
          getStoreGiveaways(storeData.id),
        ])
        setFidelityCustomers(customersData)
        setGiveaways(giveawaysData)

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

        // Load store subscription payments history
        const paymentsData = await getStoreSubscriptionPayments(storeData.id)
        setSubPaymentsHistory(paymentsData)
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

  // File change handlers
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBannerFile(file)
      setBannerPreview(URL.createObjectURL(file))
    }
  }

  // STORE SAVE HANDLER
  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setIsSavingStore(true)
    try {
      if (store) {
        // Build FormData if files are selected, or regular object
        if (logoFile || bannerFile) {
          const formData = new FormData()
          formData.append('name', storeName)
          formData.append('category', storeCat)
          formData.append('description', storeDesc)
          formData.append('address', storeAddr)
          formData.append('city', storeCity)
          formData.append('phone', storePhone)
          formData.append('whatsapp', storeWhatsapp ? formatWhatsAppUrl(storeWhatsapp) : '')
          if (storeLogo) formData.append('logo_url', storeLogo)
          if (storeBanner) formData.append('banner_url', storeBanner)
          if (selectedSubPlanId) formData.append('subscription_plan_id', selectedSubPlanId)
          if (logoFile) formData.append('logo_file', logoFile)
          if (bannerFile) formData.append('banner_file', bannerFile)

          const updated = await updateStore(store.id, formData as any)
          setStore(updated)
        } else {
          const updated = await updateStore(store.id, {
            name: storeName,
            category: storeCat,
            description: storeDesc,
            address: storeAddr,
            city: storeCity,
            phone: storePhone,
            whatsapp: storeWhatsapp ? formatWhatsAppUrl(storeWhatsapp) : '',
            logo_url:
              storeLogo ||
              `https://img.usecurling.com/p/200/200?q=${encodeURIComponent(storeCat)}&color=orange`,
            banner_url:
              storeBanner || `https://img.usecurling.com/p/800/400?q=store+shop&color=black`,
            subscription_plan_id: selectedSubPlanId || undefined,
          })
          setStore(updated)
        }
        toast({
          title: 'Loja atualizada!',
          description: 'Os dados e imagens da sua loja foram salvos com sucesso.',
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
          whatsapp: storeWhatsapp ? formatWhatsAppUrl(storeWhatsapp) : '',
          logo_url:
            storeLogo ||
            `https://img.usecurling.com/p/200/200?q=${encodeURIComponent(storeCat)}&color=orange`,
          banner_url:
            storeBanner || `https://img.usecurling.com/p/800/400?q=store+shop&color=black`,
          approval_status: 'pending', // Requires admin approval
          subscription_plan_id: selectedSubPlanId || undefined,
          subscription_status: 'trial',
        })
        if (logoFile || bannerFile) {
          const formData = new FormData()
          if (logoFile) formData.append('logo_file', logoFile)
          if (bannerFile) formData.append('banner_file', bannerFile)
          const withFiles = await updateStore(created.id, formData as any)
          setStore(withFiles)
        } else {
          setStore(created)
        }
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

  // PIX DIRETO & CHECKOUT
  const currentSubPlan =
    subPlans.find((p) => p.id === (selectedSubPlanId || store?.subscription_plan_id)) || subPlans[0]

  // Função para carregar o payload PIX copia e cola gerado no servidor
  const fetchServerPixPayload = async () => {
    if (!store) return
    setIsLoadingPixPayload(true)
    setPixPayloadError(null)
    try {
      const res = await generatePixSubscriptionPayload(
        store.id,
        selectedSubPlanId || store.subscription_plan_id,
      )
      if (res.configured && res.pix_payload) {
        setPixPayloadData(res)
        // Recarregar histórico de pagamentos para refletir o registro gerado
        try {
          const payments = await getStoreSubscriptionPayments(store.id)
          setSubPaymentsHistory(payments)
        } catch {
          /* intentionally ignored */
        }
      } else {
        setPixPayloadError(res.error || 'Nenhuma chave Pix ativa configurada pelo administrador.')
        setPixPayloadData(null)
      }
    } catch (err: any) {
      console.error('Error fetching PIX payload:', err)
      setPixPayloadError(err.message || 'Não foi possível gerar o código Pix no servidor.')
      setPixPayloadData(null)
    } finally {
      setIsLoadingPixPayload(false)
    }
  }

  const handleCopyPix = () => {
    if (!pixPayloadData?.pix_payload) return
    navigator.clipboard.writeText(pixPayloadData.pix_payload)
    setCopiedPix(true)
    setTimeout(() => setCopiedPix(false), 3000)
    toast({
      title: 'Código PIX copiado com sucesso!',
      description: 'Abra seu banco, escolha a opção "PIX Copia e Cola" e cole o código.',
    })
  }

  const handleConfirmDirectPixPayment = async () => {
    if (!store) return
    setIsSubmittingPayment(true)
    try {
      const updated = await updateStore(store.id, {
        subscription_status: 'pending',
      })
      setStore(updated)
      setIsPayModalOpen(false)
      toast({
        title: 'Pagamento Pix registrado!',
        description:
          'Sua assinatura está com status "Aguardando confirmação". O administrador confirmará o recebimento para manter seu acesso ativo.',
      })
      // Atualizar lista de pagamentos
      const payments = await getStoreSubscriptionPayments(store.id)
      setSubPaymentsHistory(payments)
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar pagamento',
        description: err.message || 'Não foi possível registrar o pagamento.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmittingPayment(false)
    }
  }

  // REAL INFINITEPAY CHECKOUT FLOW
  const handleStartInfinitePayCheckout = async () => {
    if (!store) return
    setIsCreatingCheckout(true)
    try {
      const result = await createInfinitePayCheckoutLink(
        store.id,
        selectedSubPlanId || store.subscription_plan_id,
      )

      if (!result.configured) {
        // Se a chave InfinitePay não estiver configurada, fallback automático para PIX direto
        setInfinitePayConfigured(false)
        setShowPixFallback(true)
        fetchServerPixPayload()
        return
      }

      setInfinitePayConfigured(true)
      if (result.checkout_url) {
        toast({
          title: 'Redirecionando para o Checkout...',
          description: 'Você será levado com segurança para a página de pagamento da InfinitePay.',
        })
        // Redireciona na mesma janela para permitir retorno automático
        window.location.href = result.checkout_url
      } else {
        throw new Error(result.error || 'URL de checkout não retornada pela InfinitePay.')
      }
    } catch (err: any) {
      console.error('Error starting InfinitePay checkout:', err)
      // Se houver erro, ativa o fallback do PIX direto
      setShowPixFallback(true)
      fetchServerPixPayload()
      toast({
        title: 'Abertura do checkout alternativo',
        description:
          err.message || 'Tentando gerar PIX copia e cola direto com a chave do administrador.',
      })
    } finally {
      setIsCreatingCheckout(false)
    }
  }

  // MARKETING & GIVEAWAY HANDLERS
  const handleCreateGiveaway = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!store) return
    if (!newGiveawayTitle.trim()) {
      toast({
        title: 'Título obrigatório',
        description: 'Informe um título descritivo para o sorteio.',
        variant: 'destructive',
      })
      return
    }

    setIsSavingGiveaway(true)
    try {
      const created = await createGiveaway({
        store: store.id,
        title: newGiveawayTitle.trim(),
        reward_type: newGiveawayRewardType,
        reward_description: newGiveawayRewardType === 'gift' ? newGiveawayDesc.trim() : undefined,
        discount_amount:
          newGiveawayRewardType === 'discount' && typeof newGiveawayDiscount === 'number'
            ? newGiveawayDiscount
            : undefined,
        redemption_days: Number(newGiveawayDays) || 7,
        status: 'open',
      })

      setGiveaways((prev) => [created, ...prev])
      setIsCreateGiveawayOpen(false)
      setNewGiveawayTitle('')
      setNewGiveawayDesc('')
      setNewGiveawayDiscount('')
      setNewGiveawayDays(7)

      toast({
        title: 'Sorteio criado com sucesso!',
        description: 'O sorteio já está aberto. Quando quiser, clique em "Realizar Sorteio".',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao criar sorteio',
        description: err.message || 'Não foi possível cadastrar o sorteio.',
        variant: 'destructive',
      })
    } finally {
      setIsSavingGiveaway(false)
    }
  }

  const handleDrawWinner = async (giveawayId: string) => {
    if (!store) return
    if (fidelityCustomers.length === 0) {
      toast({
        title: 'Sem participantes',
        description:
          'Não há nenhum cliente fidelizado nesta loja ainda. Divulgue o link da loja para os clientes se fidelizarem!',
        variant: 'destructive',
      })
      return
    }

    if (
      !confirm(
        'Deseja realizar o sorteio agora entre todos os clientes fidelizados? O ganhador será notificado.',
      )
    ) {
      return
    }

    setIsDrawingWinner(giveawayId)
    try {
      const result = await drawGiveawayWinner(giveawayId)
      // Atualizar lista de sorteios
      const updatedList = await getStoreGiveaways(store.id)
      setGiveaways(updatedList)

      toast({
        title: '🎉 Sorteio realizado com sucesso!',
        description: `Ganhador: ${result.winner.name} (${result.winner.customer_code || 'Cliente'}). ${
          result.emailSent
            ? 'Notificação por e-mail enviada!'
            : 'Notificação in-app registrada no painel do cliente.'
        }`,
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao realizar sorteio',
        description: err.message || 'Não foi possível sortear o ganhador.',
        variant: 'destructive',
      })
    } finally {
      setIsDrawingWinner(null)
    }
  }

  const handleConfirmRedemption = async (giveawayId: string) => {
    if (!store) return
    if (!confirm('Confirmar que o cliente retirou/utilizou o prêmio do sorteio?')) return

    setIsConfirmingRedeem(giveawayId)
    try {
      await confirmGiveawayRedemption(giveawayId)
      const updatedList = await getStoreGiveaways(store.id)
      setGiveaways(updatedList)
      toast({
        title: 'Resgate confirmado!',
        description: 'O prêmio foi marcado como resgatado no sistema.',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao confirmar resgate',
        description: err.message || 'Falha ao confirmar resgate.',
        variant: 'destructive',
      })
    } finally {
      setIsConfirmingRedeem(null)
    }
  }

  const handleDeleteGiveaway = async (giveawayId: string) => {
    if (!confirm('Tem certeza que deseja excluir este sorteio?')) return
    try {
      await deleteGiveaway(giveawayId)
      setGiveaways((prev) => prev.filter((g) => g.id !== giveawayId))
      toast({
        title: 'Sorteio excluído.',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir sorteio',
        description: err.message,
        variant: 'destructive',
      })
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

  // SEARCH CUSTOMER BY CODE, EMAIL OR CPF/CNPJ
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
          description:
            'Verifique se o código (ex: CLI-7842), e-mail ou CPF/CNPJ foi digitado corretamente.',
          variant: 'destructive',
        })
      } else {
        setFoundCustomer(cust)
        // Load loyalty card for this customer in this store
        const card = await getCustomerCardForStore(cust.id, store.id)
        setCustomerCard(card)
        toast({
          title: 'Cliente localizado!',
          description: `${cust.name} (${cust.customer_code || cust.document || cust.email})`,
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

  // Filtered purchases for Sales Report tab
  const filteredPurchases = purchases.filter((p) => {
    // 1. Type filter
    if (reportTypeFilter !== 'all' && p.type !== reportTypeFilter) {
      return false
    }

    // 2. Period in months filter
    if (reportPeriodMonths !== 'all') {
      const months = Number(reportPeriodMonths)
      if (!isNaN(months) && months > 0) {
        const purchaseDate = new Date(p.created)
        const cutoffDate = new Date()
        cutoffDate.setMonth(cutoffDate.getMonth() - months)
        if (purchaseDate < cutoffDate) {
          return false
        }
      }
    }

    return true
  })

  // Filtered metrics
  const filteredTotalSales = filteredPurchases
    .filter((p) => p.type === 'purchase')
    .reduce((sum, p) => sum + (p.amount || 0), 0)
  const filteredPurchasesCount = filteredPurchases.filter((p) => p.type === 'purchase').length
  const filteredRedemptionsCount = filteredPurchases.filter((p) => p.type === 'redemption').length

  // PDF Export Handler
  const handleExportPDF = () => {
    setIsGeneratingPdf(true)
    try {
      let periodLabel = 'Todo o histórico'
      if (reportPeriodMonths === '1') periodLabel = 'Último 1 mês'
      else if (reportPeriodMonths === '3') periodLabel = 'Últimos 3 meses'
      else if (reportPeriodMonths === '6') periodLabel = 'Últimos 6 meses'
      else if (reportPeriodMonths === '12') periodLabel = 'Últimos 12 meses'

      let typeFilterLabel = 'Todas as movimentações'
      if (reportTypeFilter === 'purchase') typeFilterLabel = 'Apenas Compras (Crédito/Acúmulo)'
      else if (reportTypeFilter === 'redemption') typeFilterLabel = 'Apenas Resgates de Recompensas'

      generateSalesReportPDF({
        storeName: store?.name || 'Minha Loja',
        periodLabel,
        typeFilterLabel,
        totalSalesCount: filteredPurchasesCount,
        totalSalesAmount: filteredTotalSales,
        totalRedemptionsCount: filteredRedemptionsCount,
        purchases: filteredPurchases,
        storeInfo: store,
      })

      toast({
        title: 'PDF gerado com sucesso!',
        description: 'O download do relatório de vendas foi iniciado.',
      })
    } catch (err: any) {
      console.error('Error generating PDF report:', err)
      toast({
        title: 'Erro ao gerar PDF',
        description: err.message || 'Não foi possível exportar o relatório.',
        variant: 'destructive',
      })
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  // Global Sales metrics (for top cards)
  // hasOverdueSub: indica se a assinatura está com pendência de pagamento (Em Atraso ou Cancelado)
  const hasOverdueSub =
    store && (store.subscription_status === 'overdue' || store.subscription_status === 'cancelled')

  // isMerchantSuspended: se a restrição de funcionalidades no perfil do lojista está ativada
  // Por retrocompatibilidade, se suspend_merchant for true ou se for indefinido em loja com atraso, suspende
  const isMerchantSuspended = Boolean(
    hasOverdueSub && (store.suspend_merchant !== undefined ? store.suspend_merchant : true),
  )

  // isPublicSuspended: se a restrição no portal público está ativada
  const isPublicSuspended = Boolean(
    store?.subscription_status === 'cancelled' ||
    (hasOverdueSub && (store?.suspend_public !== undefined ? store.suspend_public : true)),
  )

  const totalStoreSales = purchases
    .filter((p) => p.type === 'purchase')
    .reduce((sum, p) => sum + (p.amount || 0), 0)
  const totalPurchasesNum = purchases.filter((p) => p.type === 'purchase').length
  const totalRedeemedNum = purchases.filter((p) => p.type === 'redemption').length

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl flex-1">
      {/* SUSPENSION WARNING BANNER (When store is overdue or cancelled) */}
      {hasOverdueSub && (
        <div
          className={`mb-6 p-5 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm border-2 ${
            isMerchantSuspended
              ? 'bg-rose-50 border-rose-300 text-rose-950'
              : 'bg-amber-50 border-amber-300 text-amber-950'
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div
              className={`w-10 h-10 rounded-2xl text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${
                isMerchantSuspended ? 'bg-rose-500' : 'bg-amber-500'
              }`}
            >
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className={`text-base font-black flex items-center gap-2 ${
                    isMerchantSuspended ? 'text-rose-900' : 'text-amber-900'
                  }`}
                >
                  {isMerchantSuspended
                    ? 'Acesso e Operações Suspensos por Pendência na Assinatura'
                    : isPublicSuspended
                      ? 'Loja Ocultada do Portal Público por Pendência na Assinatura'
                      : 'Aviso de Pendência na Assinatura'}
                </h3>
                <Badge
                  className={`border-0 text-[10px] ${
                    store.subscription_status === 'overdue'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-700 text-white'
                  }`}
                >
                  {store.subscription_status === 'overdue' ? 'Em Atraso' : 'Cancelado'}
                </Badge>
              </div>

              <p
                className={`text-xs leading-relaxed mt-1 max-w-2xl ${
                  isMerchantSuspended ? 'text-rose-800' : 'text-amber-800'
                }`}
              >
                {isMerchantSuspended && isPublicSuspended && (
                  <>
                    Sua loja está suspensa no portal público e as funcionalidades operacionais (PDV
                    Caixa e Edição de Fidelidade) estão bloqueadas. Efetue o pagamento para
                    reativar.
                  </>
                )}
                {isMerchantSuspended && !isPublicSuspended && (
                  <>
                    As funcionalidades do seu perfil (PDV Caixa e Edição de Fidelidade) foram
                    bloqueadas pelo administrador. Sua loja ainda está visível no portal público.
                    Efetue o pagamento para liberar suas ferramentas.
                  </>
                )}
                {!isMerchantSuspended && isPublicSuspended && (
                  <>
                    Sua loja foi suspensa do portal público e não aparece nas buscas de clientes.
                    Suas ferramentas internas continuam liberadas para operação. Regularize para
                    voltar a ser exibida publicamente.
                  </>
                )}
                {!isMerchantSuspended && !isPublicSuspended && (
                  <>
                    Sua assinatura está com pagamento pendente. Efetue a renovação via PIX para
                    evitar a suspensão de serviços e manter tudo em dia.
                  </>
                )}
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => {
              setShowPixFallback(false)
              setIsPayModalOpen(true)
              fetchServerPixPayload()
            }}
            className={`w-full md:w-auto shrink-0 text-white font-black text-xs py-5 px-5 rounded-2xl shadow-md gap-2 ${
              isMerchantSuspended
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Regularizar / Pagar Assinatura
          </Button>
        </div>
      )}

      {/* HEADER & STATUS BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-amber-100 text-amber-800 border-amber-300 gap-1 font-bold">
              <Store className="w-3.5 h-3.5" />
              Painel do Lojista
            </Badge>

            {store && !isPublicSuspended && store.approval_status === 'approved' && (
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold gap-1">
                <CheckCircle2 className="w-3 h-3" /> Loja Ativa no Portal
              </Badge>
            )}

            {store && isPublicSuspended && (
              <Badge className="bg-rose-600 text-white font-bold gap-1">
                <AlertCircle className="w-3 h-3" /> Suspensa do Portal Público
              </Badge>
            )}

            {store && isMerchantSuspended && (
              <Badge className="bg-amber-600 text-white font-bold gap-1">
                <AlertCircle className="w-3 h-3" /> Operações Bloqueadas
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

            {store && store.subscription_status === 'pending' && (
              <Badge className="bg-blue-600 text-white font-bold gap-1">
                <Clock className="w-3 h-3" /> Pagamento Aguardando Confirmação
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2.5 mt-1">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Store className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {store ? store.name : 'Configurar Minha Loja'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cadastre compras de clientes com código digital, defina regras e acompanhe vendas
          </p>
        </div>

        {/* Quick actions: register sale or pay subscription */}
        <div className="flex items-center gap-2 flex-wrap">
          {store && (
            <Button
              variant="outline"
              onClick={() => {
                setActiveTab('subscription')
                const el = document.getElementById('tabs-section')
                el?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="text-xs font-bold border-purple-200 text-purple-700 hover:bg-purple-50 rounded-xl"
            >
              <CreditCard className="w-3.5 h-3.5 mr-1" />
              Minha Assinatura
            </Button>
          )}

          {store && plan && !isMerchantSuspended && (
            <Button
              onClick={() => {
                setActiveTab('pos')
                const el = document.getElementById('registrar-compra-section')
                el?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold gap-2 text-xs sm:text-sm shadow-md shadow-rose-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              Registrar Compra do Cliente
            </Button>
          )}
        </div>
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6" id="tabs-section">
        <TabsList className="bg-slate-200/70 p-1 rounded-xl flex-wrap h-auto">
          <TabsTrigger
            value="pos"
            disabled={isMerchantSuspended}
            className="gap-2 text-xs sm:text-sm font-semibold"
            id="registrar-compra-section"
          >
            <ShoppingBag className="w-4 h-4" />
            Registrar Compra (PDV)
          </TabsTrigger>
          <TabsTrigger
            value="program"
            disabled={isMerchantSuspended}
            className="gap-2 text-xs sm:text-sm font-semibold"
          >
            <Award className="w-4 h-4" />
            Meu Plano de Fidelidade
          </TabsTrigger>
          <TabsTrigger value="store" className="gap-2 text-xs sm:text-sm font-semibold">
            <Store className="w-4 h-4" />
            Dados da Loja
          </TabsTrigger>
          <TabsTrigger value="subscription" className="gap-2 text-xs sm:text-sm font-semibold">
            <CreditCard className="w-4 h-4" />
            Assinatura
          </TabsTrigger>
          <TabsTrigger value="marketing" className="gap-2 text-xs sm:text-sm font-semibold">
            <Gift className="w-4 h-4 text-rose-600" />
            Marketing & Sorteios ({giveaways.length})
          </TabsTrigger>
          <TabsTrigger value="customers" className="gap-2 text-xs sm:text-sm font-semibold">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            Base de Clientes ({fidelityCustomers.length})
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
          {isMerchantSuspended ? (
            <Card className="rounded-3xl p-8 text-center max-w-lg mx-auto border-rose-200 bg-rose-50/50">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                PDV Bloqueado por Suspensão de Funcionalidades
              </h3>
              <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                O administrador ativou a{' '}
                <strong>Suspensão nas funcionalidades do perfil do lojista</strong> devido ao status{' '}
                <strong>
                  {store?.subscription_status === 'overdue' ? 'Em Atraso' : 'Cancelado'}
                </strong>{' '}
                da assinatura. Efetue o pagamento para reativar o registro de compras e créditos aos
                clientes.
              </p>
              <Button
                onClick={() => {
                  setShowPixFallback(false)
                  setIsPayModalOpen(true)
                  fetchServerPixPayload()
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl"
              >
                <CreditCard className="w-4 h-4 mr-2" /> Pagar Assinatura Agora
              </Button>
            </Card>
          ) : !store ? (
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
                      Localize o cliente pelo código (ex: CLI-7842), e-mail ou CPF/CNPJ
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <form onSubmit={handleSearchCustomer} className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          placeholder="Código, e-mail ou CPF/CNPJ"
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
                              {foundCustomer.document && (
                                <p className="text-[10px] text-amber-300 font-mono mt-0.5">
                                  {cleanDocument(foundCustomer.document).length > 11
                                    ? `CNPJ: ${formatCNPJ(cleanDocument(foundCustomer.document))}`
                                    : `CPF: ${formatCPF(cleanDocument(foundCustomer.document))}`}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge className="bg-white/10 font-mono text-[10px] text-amber-300 border-white/20 shrink-0">
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
                          Digite o código, e-mail ou CPF/CNPJ e clique em "Buscar"
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
          {isMerchantSuspended ? (
            <Card className="rounded-3xl p-8 text-center max-w-lg mx-auto border-rose-200 bg-rose-50/50">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Configuração Bloqueada por Suspensão de Funcionalidades
              </h3>
              <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                As funcionalidades do seu perfil foram suspensas pelo administrador devido à
                pendência na assinatura. Regularize para alterar ou gerenciar as regras do seu plano
                de fidelidade.
              </p>
              <Button
                onClick={() => {
                  setShowPixFallback(false)
                  setIsPayModalOpen(true)
                  fetchServerPixPayload()
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl"
              >
                <CreditCard className="w-4 h-4 mr-2" /> Regularizar Assinatura
              </Button>
            </Card>
          ) : (
            <Card className="rounded-3xl border-slate-200 shadow-xs max-w-3xl">
              <CardHeader>
                <CardTitle className="text-xl font-black text-slate-900">
                  Configurar Regras de Fidelidade
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Escolha o modelo que melhor engaja seu público: Selos no cartão, Pontos
                  acumulativos ou Cashback em %
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
          )}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">
                      Telefone Fixo / Contato
                    </Label>
                    <Input
                      placeholder="Ex: (11) 3456-7890"
                      value={storePhone}
                      onChange={(e) => setStorePhone(e.target.value)}
                      className="text-xs rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      WhatsApp da Loja (Link wa.me)
                    </Label>
                    <Input
                      placeholder="Ex: (11) 98765-4321 ou wa.me/5511..."
                      value={storeWhatsapp}
                      onChange={(e) => setStoreWhatsapp(e.target.value)}
                      className="text-xs rounded-xl"
                    />
                    <p className="text-[11px] text-slate-500">
                      {storeWhatsapp ? (
                        <span className="text-emerald-700 font-medium flex items-center gap-1">
                          Link gerado: {formatWhatsAppUrl(storeWhatsapp)}
                        </span>
                      ) : (
                        'Gera link https://wa.me/55... automaticamente para clientes conversarem pelo portal.'
                      )}
                    </p>
                  </div>
                </div>

                {/* LOGO AND BANNER UPLOAD SECTION */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 pt-4">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-rose-600" />
                      Imagens da Loja para o Portal Público
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Personalize a logo e o banner que seus clientes verão na página da sua loja
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Logo upload */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        Logo do Estabelecimento
                      </Label>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                          {logoPreview ? (
                            <img
                              src={logoPreview}
                              alt="Logo preview"
                              className="w-full h-full object-cover"
                            />
                          ) : store ? (
                            <img
                              src={getStoreImageUrl(store, 'logo')}
                              alt={store.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Store className="w-7 h-7 text-slate-300" />
                          )}
                        </div>
                        <div className="space-y-1 flex-1">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoFileChange}
                            className="text-xs rounded-xl file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 cursor-pointer"
                          />
                          <p className="text-[10px] text-slate-400">JPG, PNG ou WebP (máx. 5MB)</p>
                        </div>
                      </div>
                    </div>

                    {/* Banner upload */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        Banner de Capa (Topo)
                      </Label>
                      <div className="space-y-1.5">
                        <div className="w-full h-16 rounded-xl bg-slate-200 overflow-hidden border border-slate-300 flex items-center justify-center">
                          {bannerPreview ? (
                            <img
                              src={bannerPreview}
                              alt="Banner preview"
                              className="w-full h-full object-cover"
                            />
                          ) : store ? (
                            <img
                              src={getStoreImageUrl(store, 'banner')}
                              alt={store.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold">
                              Banner padrão
                            </span>
                          )}
                        </div>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerFileChange}
                          className="text-xs rounded-xl file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer"
                        />
                        <p className="text-[10px] text-slate-400">
                          Recomendado 800x400 (máx. 10MB)
                        </p>
                      </div>
                    </div>
                  </div>
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
        {/* TAB: ASSINATURA DA LOJA & PAGAMENTO */}
        {/* ======================================================== */}
        <TabsContent value="subscription" className="space-y-6">
          <Card className="rounded-3xl border-slate-200 shadow-xs max-w-3xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    Assinatura do Estabelecimento
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Gerencie seu plano de assinatura mensal/anual e mantenha seus serviços em dia
                  </CardDescription>
                </div>
                <Badge
                  className={`text-xs px-3 py-1 font-bold ${
                    store?.subscription_status === 'active'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : store?.subscription_status === 'trial'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : store?.subscription_status === 'pending'
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}
                >
                  {store?.subscription_status === 'active'
                    ? 'Ativa / Paga'
                    : store?.subscription_status === 'trial'
                      ? 'Período de Teste Grátis'
                      : store?.subscription_status === 'pending'
                        ? 'Aguardando Confirmação'
                        : store?.subscription_status === 'overdue'
                          ? 'Em Atraso (Suspensa)'
                          : 'Cancelada (Suspensa)'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* STATUS SUMMARY BANNER */}
              {store?.subscription_status === 'pending' ? (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 space-y-1">
                  <p className="font-bold text-xs flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-600" />
                    Pagamento em análise pelo Administrador
                  </p>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    Você já enviou a confirmação de pagamento via PIX. O administrador irá conferir
                    o recebimento e reativar sua assinatura em instantes.
                  </p>
                </div>
              ) : hasOverdueSub ? (
                <div
                  className={`p-4 rounded-2xl space-y-1 border ${
                    isMerchantSuspended
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <p className="font-bold text-xs flex items-center gap-1.5">
                    <AlertCircle
                      className={`w-4 h-4 ${
                        isMerchantSuspended ? 'text-rose-600' : 'text-amber-600'
                      }`}
                    />
                    Assinatura com Pagamento Pendente (
                    {store?.subscription_status === 'overdue' ? 'Em Atraso' : 'Cancelada'})
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    {isMerchantSuspended && isPublicSuspended && (
                      <>
                        Sua loja está suspensa no portal público e as ferramentas do painel estão
                        bloqueadas.
                      </>
                    )}
                    {isMerchantSuspended && !isPublicSuspended && (
                      <>
                        As ferramentas do painel (PDV e Fidelidade) estão bloqueadas, mas a loja
                        continua listada no portal.
                      </>
                    )}
                    {!isMerchantSuspended && isPublicSuspended && (
                      <>
                        Sua loja foi ocultada do portal público, mas suas ferramentas de operação
                        continuam ativas.
                      </>
                    )}
                    {!isMerchantSuspended && !isPublicSuspended && (
                      <>
                        Suas ferramentas continuam liberadas, mas há pendência financeira na
                        assinatura.
                      </>
                    )}{' '}
                    Clique no botão abaixo para pagar e regularizar.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                  <p className="font-bold text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Tudo certo com sua assinatura!
                  </p>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Sua loja está ativa no portal e os clientes podem pontuar e resgatar
                    normalmente.
                  </p>
                </div>
              )}

              {/* PLAN DETAILS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Plano Atual
                  </p>
                  <h4 className="text-base font-black text-slate-900 mt-1">
                    {currentSubPlan?.name || 'Plano Básico'}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Cobrança a cada {currentSubPlan?.billing_interval_months || 1} mês(es)
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Valor da Assinatura
                  </p>
                  <h4 className="text-xl font-black text-slate-900 mt-1">
                    R$ {Number(currentSubPlan?.price || 49.9).toFixed(2)}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Sem taxa de adesão</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Data de Vencimento
                  </p>
                  <h4 className="text-base font-black text-slate-900 mt-1">
                    {store?.subscription_expires_at
                      ? new Date(store.subscription_expires_at).toLocaleDateString('pt-BR')
                      : 'Não definida'}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {store?.subscription_status === 'trial'
                      ? 'Fim do teste grátis'
                      : 'Próxima renovação'}
                  </p>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    setShowPixFallback(false)
                    setIsPayModalOpen(true)
                    fetchServerPixPayload()
                  }}
                  className="flex-1 py-6 rounded-2xl font-black text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-600/20"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {store?.subscription_status === 'pending'
                    ? 'Opções de Pagamento / Pagar Novamente'
                    : hasOverdueSub
                      ? 'Pagar Assinatura e Regularizar Loja'
                      : 'Renovar / Pagar Assinatura'}
                </Button>
              </div>

              {/* HISTÓRICO DE PAGAMENTOS ONLINE */}
              {subPaymentsHistory.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Histórico Recente de Pagamentos
                  </h4>
                  <div className="space-y-2">
                    {subPaymentsHistory.slice(0, 5).map((pay) => (
                      <div
                        key={pay.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-900">
                            R$ {(pay.amount / 100).toFixed(2)}{' '}
                            <span className="font-normal text-slate-500">• {pay.order_nsu}</span>
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {new Date(pay.created).toLocaleDateString('pt-BR')} às{' '}
                            {new Date(pay.created).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {pay.capture_method && ` • Método: ${pay.capture_method.toUpperCase()}`}
                          </p>
                        </div>
                        <Badge
                          className={`text-[10px] border-0 font-bold ${
                            pay.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : pay.status === 'pending'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {pay.status === 'paid'
                            ? 'Pago'
                            : pay.status === 'pending'
                              ? 'Aguardando'
                              : pay.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 4: RELATÓRIO DE VENDAS */}
        {/* ======================================================== */}
        <TabsContent value="sales" className="space-y-6">
          {/* FILTERS & PDF EXPORT HEADER CARD */}
          <Card className="rounded-3xl border-slate-200 shadow-xs bg-gradient-to-br from-slate-50 to-white">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-rose-600" />
                    Relatório de Vendas e Resgates
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Filtre por período e tipo de movimentação para acompanhar ou exportar em PDF
                  </CardDescription>
                </div>

                <Button
                  onClick={handleExportPDF}
                  disabled={isGeneratingPdf || filteredPurchases.length === 0}
                  className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold rounded-xl gap-2 shadow-sm text-xs py-5 shrink-0"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Gerando PDF...
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4" />
                      Gerar PDF ({filteredPurchases.length})
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              {/* Filter controls row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                {/* Period in months selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Período em Meses
                  </Label>
                  <Select value={reportPeriodMonths} onValueChange={setReportPeriodMonths}>
                    <SelectTrigger className="text-xs rounded-xl bg-white border-slate-200">
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todo o Histórico</SelectItem>
                      <SelectItem value="1">Último 1 Mês (30 dias)</SelectItem>
                      <SelectItem value="3">Últimos 3 Meses</SelectItem>
                      <SelectItem value="6">Últimos 6 Meses</SelectItem>
                      <SelectItem value="12">Últimos 12 Meses (1 ano)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Movement type selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-500" />
                    Tipo de Movimentação
                  </Label>
                  <Select value={reportTypeFilter} onValueChange={setReportTypeFilter}>
                    <SelectTrigger className="text-xs rounded-xl bg-white border-slate-200">
                      <SelectValue placeholder="Selecione a operação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Operações</SelectItem>
                      <SelectItem value="purchase">Compras (Crédito/Acúmulo)</SelectItem>
                      <SelectItem value="redemption">Resgates de Recompensas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Reset filters shortcut */}
                <div className="flex items-end">
                  {(reportPeriodMonths !== 'all' || reportTypeFilter !== 'all') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setReportPeriodMonths('all')
                        setReportTypeFilter('all')
                      }}
                      className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
                    >
                      Limpar Filtros
                    </Button>
                  )}
                </div>
              </div>

              {/* Dynamic summary KPI cards for active filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Filtrado em Vendas
                  </p>
                  <p className="text-lg font-black text-emerald-600 mt-0.5">
                    R$ {filteredTotalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {filteredPurchasesCount} compras registradas
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Resgates Filtrados
                  </p>
                  <p className="text-lg font-black text-amber-600 mt-0.5">
                    {filteredRedemptionsCount}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Prêmios entregues aos clientes
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Total de Linhas no Relatório
                  </p>
                  <p className="text-lg font-black text-slate-800 mt-0.5">
                    {filteredPurchases.length}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Prontas para exportação em PDF
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TABLE OF MOVEMENTS */}
          <Card className="rounded-3xl border-slate-200 shadow-xs">
            <CardHeader className="py-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800">
                  Movimentações Filtradas ({filteredPurchases.length})
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-0">
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
                    {filteredPurchases.map((pc) => (
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
                    {filteredPurchases.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          Nenhuma movimentação encontrada com os filtros selecionados.
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
        {/* TAB: MARKETING & SORTEIOS */}
        {/* ======================================================== */}
        <TabsContent value="marketing" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Gift className="w-6 h-6 text-rose-600" />
                Marketing & Sorteios de Brindes
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Crie sorteios exclusivos para os clientes fidelizados da sua loja. O sistema sorteia
                aleatoriamente e notifica o ganhador por e-mail e no aplicativo.
              </p>
            </div>

            <Button
              onClick={() => setIsCreateGiveawayOpen(true)}
              className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-md gap-2 shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              Novo Sorteio
            </Button>
          </div>

          {/* KPI CARDS MARKETING */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="rounded-2xl border-slate-200 bg-white">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Clientes Participantes
                  </p>
                  <p className="text-2xl font-black text-slate-900 mt-0.5">
                    {fidelityCustomers.length}
                  </p>
                  <p className="text-[11px] text-slate-500">Fidelizados à sua loja</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 bg-white">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Sorteios Ativos / Abertos
                  </p>
                  <p className="text-2xl font-black text-rose-600 mt-0.5">
                    {giveaways.filter((g) => g.status === 'open').length}
                  </p>
                  <p className="text-[11px] text-rose-700">Aguardando sorteio</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 bg-white">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Prêmios Entregues / Resgatados
                  </p>
                  <p className="text-2xl font-black text-amber-600 mt-0.5">
                    {giveaways.filter((g) => g.status === 'redeemed').length}
                  </p>
                  <p className="text-[11px] text-slate-500">Resgate confirmado</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* LISTA DE SORTEIOS */}
          <Card className="rounded-3xl border-slate-200 shadow-xs">
            <CardHeader className="py-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800">
                  Histórico de Sorteios ({giveaways.length})
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Gerencie os sorteios criados, realize o sorteio e confirme o resgate dos prêmios
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              {giveaways.length === 0 ? (
                <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 max-w-md mx-auto">
                  <Gift className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Nenhum sorteio criado ainda</p>
                  <p className="text-[11px] text-slate-400 mt-1 mb-4">
                    Crie campanhas de sorteio de brindes ou descontos para incentivar os clientes a
                    se fidelizarem à sua loja.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setIsCreateGiveawayOpen(true)}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                  >
                    Criar Primeiro Sorteio
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {giveaways.map((gw) => {
                    const winner = gw.expand?.winner
                    const isExpired =
                      gw.expires_at &&
                      new Date(gw.expires_at).getTime() < Date.now() &&
                      gw.status === 'drawn'
                    const rewardLabel =
                      gw.reward_type === 'discount' && gw.discount_amount
                        ? `Desconto de R$ ${Number(gw.discount_amount).toFixed(2)}`
                        : gw.reward_description || 'Brinde'

                    return (
                      <Card
                        key={gw.id}
                        className="rounded-2xl border-slate-200 overflow-hidden shadow-2xs flex flex-col justify-between bg-white"
                      >
                        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                          <Badge
                            className={
                              gw.status === 'redeemed'
                                ? 'bg-slate-200 text-slate-800 text-[10px]'
                                : isExpired
                                  ? 'bg-red-100 text-red-700 border-red-200 text-[10px]'
                                  : gw.status === 'drawn'
                                    ? 'bg-amber-100 text-amber-800 border-amber-200 text-[10px]'
                                    : 'bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]'
                            }
                          >
                            {gw.status === 'redeemed'
                              ? 'Prêmio Resgatado'
                              : isExpired
                                ? 'Prazo Expirado'
                                : gw.status === 'drawn'
                                  ? 'Sorteado (Aguardando Resgate)'
                                  : 'Aberto / Ativo'}
                          </Badge>

                          <button
                            type="button"
                            onClick={() => handleDeleteGiveaway(gw.id)}
                            className="text-slate-400 hover:text-rose-600 text-[11px] font-semibold"
                            title="Excluir sorteio"
                          >
                            Excluir
                          </button>
                        </div>

                        <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <h4 className="font-black text-sm text-slate-900">{gw.title}</h4>
                            <p className="text-xs font-bold text-rose-600 mt-1 flex items-center gap-1">
                              🎁 {rewardLabel}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-2">
                              Prazo de resgate: <strong>{gw.redemption_days} dias</strong>
                            </p>

                            {/* Informações do Ganhador se já sorteado */}
                            {gw.status !== 'open' && winner && (
                              <div className="mt-3 p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                                  🎉 Ganhador Sorteado:
                                </p>
                                <p className="font-black text-slate-900">{winner.name}</p>
                                <p className="text-[11px] text-slate-600 font-mono">
                                  Código: {winner.customer_code || 'CLI-0000'}
                                </p>
                                {winner.document && (
                                  <p className="text-[10px] text-slate-500 font-mono">
                                    Doc:{' '}
                                    {cleanDocument(winner.document).length > 11
                                      ? formatCNPJ(cleanDocument(winner.document))
                                      : formatCPF(cleanDocument(winner.document))}
                                  </p>
                                )}
                                {gw.drawn_at && (
                                  <p className="text-[10px] text-slate-400 pt-1">
                                    Sorteado em: {new Date(gw.drawn_at).toLocaleDateString('pt-BR')}
                                  </p>
                                )}
                                {gw.expires_at && (
                                  <p className="text-[10px] text-rose-700 font-bold">
                                    Válido até:{' '}
                                    {new Date(gw.expires_at).toLocaleDateString('pt-BR')}
                                  </p>
                                )}
                                {gw.redeemed_at && (
                                  <p className="text-[10px] text-emerald-700 font-bold">
                                    Resgatado em:{' '}
                                    {new Date(gw.redeemed_at).toLocaleDateString('pt-BR')}
                                  </p>
                                )}
                              </div>
                            )}

                            {gw.status === 'open' && (
                              <div className="mt-2 text-[11px] text-slate-500">
                                Participantes aptos:{' '}
                                <strong className="text-slate-800">
                                  {fidelityCustomers.length}
                                </strong>{' '}
                                clientes fidelizados.
                              </div>
                            )}
                          </div>

                          {/* AÇÕES DO SORTEIO */}
                          <div className="pt-2 border-t border-slate-100 space-y-2">
                            {gw.status === 'open' && (
                              <Button
                                size="sm"
                                disabled={
                                  isDrawingWinner === gw.id || fidelityCustomers.length === 0
                                }
                                onClick={() => handleDrawWinner(gw.id)}
                                className="w-full bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-xs"
                              >
                                {isDrawingWinner === gw.id ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                    Sorteando cliente e enviando e-mail...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                                    Realizar Sorteio Agora
                                  </>
                                )}
                              </Button>
                            )}

                            {gw.status === 'drawn' && (
                              <Button
                                size="sm"
                                disabled={isConfirmingRedeem === gw.id}
                                onClick={() => handleConfirmRedemption(gw.id)}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
                              >
                                {isConfirmingRedeem === gw.id ? (
                                  'Confirmando...'
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                    Confirmar Resgate na Loja
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB: BASE DE CLIENTES FIDELIZADOS */}
        {/* ======================================================== */}
        <TabsContent value="customers" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-emerald-600" />
                Base de Clientes Fidelizados ({fidelityCustomers.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Clientes que se cadastraram ou se fidelizaram diretamente à sua loja, com dados
                completos e código pessoal para identificação.
              </p>
            </div>

            <div className="w-full sm:w-64">
              <Input
                placeholder="Filtrar por nome, CPF ou código..."
                value={customerFilterQuery}
                onChange={(e) => setCustomerFilterQuery(e.target.value)}
                className="text-xs rounded-xl border-slate-300"
              />
            </div>
          </div>

          <Card className="rounded-3xl border-slate-200 shadow-xs">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Código do Cliente</th>
                      <th className="py-3 px-4">Nome Completo</th>
                      <th className="py-3 px-4">E-mail</th>
                      <th className="py-3 px-4">Telefone / WhatsApp</th>
                      <th className="py-3 px-4">CPF / CNPJ</th>
                      <th className="py-3 px-4">Data de Fidelização</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fidelityCustomers
                      .filter((item) => {
                        if (!customerFilterQuery.trim()) return true
                        const q = customerFilterQuery.toLowerCase()
                        const c = item.expand?.customer
                        return (
                          (c?.name && c.name.toLowerCase().includes(q)) ||
                          (c?.email && c.email.toLowerCase().includes(q)) ||
                          (c?.customer_code && c.customer_code.toLowerCase().includes(q)) ||
                          (c?.document && c.document.includes(q))
                        )
                      })
                      .map((item) => {
                        const cust = item.expand?.customer
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/70">
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[11px]">
                                {cust?.customer_code || 'CLI-0000'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {cust?.name || 'Cliente'}
                            </td>
                            <td className="py-3 px-4 text-slate-600">{cust?.email || '-'}</td>
                            <td className="py-3 px-4 text-slate-600">
                              {cust?.phone ? (
                                <a
                                  href={formatWhatsAppUrl(cust.phone)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-700 hover:underline font-medium"
                                >
                                  {formatWhatsAppDisplay(cust.phone)}
                                </a>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-600">
                              {cust?.document
                                ? cleanDocument(cust.document).length > 11
                                  ? formatCNPJ(cleanDocument(cust.document))
                                  : formatCPF(cleanDocument(cust.document))
                                : '-'}
                            </td>
                            <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                              {new Date(item.created).toLocaleDateString('pt-BR')}
                            </td>
                          </tr>
                        )
                      })}

                    {fidelityCustomers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          Nenhum cliente fidelizado ainda. Os clientes entram nesta lista ao se
                          fidelizarem pelo portal da sua loja ou ao terem sua primeira compra
                          registrada.
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

      {/* MODAL: CRIAR NOVO SORTEIO */}
      <Dialog open={isCreateGiveawayOpen} onOpenChange={setIsCreateGiveawayOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-6">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 text-white flex items-center justify-center mb-2 shadow-md">
              <Gift className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-black text-slate-900">
              Criar Novo Sorteio de Marketing
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Configure os detalhes do prêmio. Todos os {fidelityCustomers.length} clientes
              fidelizados participarão automaticamente do sorteio.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateGiveaway} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Título do Sorteio *</Label>
              <Input
                required
                placeholder="Ex: Sorteio de Páscoa, Aniversário da Loja..."
                value={newGiveawayTitle}
                onChange={(e) => setNewGiveawayTitle(e.target.value)}
                className="text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Tipo de Prêmio *</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNewGiveawayRewardType('gift')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    newGiveawayRewardType === 'gift'
                      ? 'border-rose-500 bg-rose-50 text-rose-900 font-bold ring-2 ring-rose-500/20'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs font-bold">🎁 Brinde Pré-definido</p>
                  <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                    Ex: Kit de produtos, lanche grátis, cesta
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setNewGiveawayRewardType('discount')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    newGiveawayRewardType === 'discount'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/20'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs font-bold">💰 Desconto em R$</p>
                  <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                    Ex: R$ 50,00 de desconto na loja
                  </p>
                </button>
              </div>
            </div>

            {newGiveawayRewardType === 'gift' ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Descrição do Brinde *</Label>
                <Input
                  required
                  placeholder="Ex: 1 Garrafa de Vinho Especial, 1 Pizza Grande da Casa..."
                  value={newGiveawayDesc}
                  onChange={(e) => setNewGiveawayDesc(e.target.value)}
                  className="text-xs rounded-xl"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Valor do Desconto (R$) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">
                    R$
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="50,00"
                    value={newGiveawayDiscount}
                    onChange={(e) =>
                      setNewGiveawayDiscount(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="pl-9 text-xs rounded-xl font-bold"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Prazo para Resgate na Loja (em dias) *
              </Label>
              <Input
                type="number"
                min="1"
                max="90"
                required
                value={newGiveawayDays}
                onChange={(e) => setNewGiveawayDays(Number(e.target.value))}
                className="text-xs rounded-xl"
              />
              <p className="text-[10px] text-slate-400">
                O cliente terá este número de dias corridos para comparecer à loja e resgatar.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateGiveawayOpen(false)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSavingGiveaway}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl"
              >
                {isSavingGiveaway ? 'Criando Sorteio...' : 'Salvar Sorteio'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: CHECKOUT DE ASSINATURA (REAL INFINITEPAY COM FALLBACK PIX) */}
      <Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mb-2 shadow-md">
              <CreditCard className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-black text-slate-900">
              {showPixFallback || paymentProviderInfo?.source === 'pix_settings'
                ? 'Pagamento via PIX Direto'
                : 'Checkout de Assinatura'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              {showPixFallback || paymentProviderInfo?.source === 'pix_settings'
                ? 'Escaneie o QR Code ou copie o código PIX abaixo para pagar no app do seu banco.'
                : 'Pague sua assinatura com segurança via PIX ou Cartão de Crédito pela InfinitePay.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Amount card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  {pixPayloadData?.plan_name || currentSubPlan?.name || 'Plano Fideliza'}
                </p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">
                  R$ {Number(pixPayloadData?.amount || currentSubPlan?.price || 49.9).toFixed(2)}
                </p>
                <p className="text-[11px] text-slate-500">
                  Cobrança a cada{' '}
                  {pixPayloadData?.billing_interval_months ||
                    currentSubPlan?.billing_interval_months ||
                    1}{' '}
                  mês(es)
                </p>
              </div>
              <Badge className="bg-emerald-600 text-white font-bold text-xs py-1 px-3">
                {paymentProviderInfo?.source === 'pix_settings' || showPixFallback
                  ? 'PIX Direto (EMV)'
                  : paymentProviderInfo?.configured
                    ? paymentProviderInfo.provider
                    : 'PIX'}
              </Badge>
            </div>

            {/* Indicação clara do Gateway / Canal Ativo */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Canal de Pagamento:</span>
                {paymentProviderInfo?.source === 'pix_settings' ? (
                  <Badge
                    variant="outline"
                    className="border-indigo-300 text-indigo-800 bg-indigo-50 text-[10px] font-bold"
                  >
                    PIX direto (chave Pix do administrador)
                  </Badge>
                ) : paymentProviderInfo?.configured ? (
                  <Badge
                    variant="outline"
                    className="border-emerald-300 text-emerald-800 bg-emerald-50 text-[10px] font-bold"
                  >
                    Gateway Ativo ({paymentProviderInfo.provider})
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-rose-300 text-rose-800 bg-rose-50 text-[10px] font-bold"
                  >
                    Não Configurado
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-slate-600">
                {paymentProviderInfo?.source === 'pix_settings' ? (
                  <>
                    Pagamento direto via <strong>PIX oficial</strong> com chave cadastrada pelo
                    administrador.
                  </>
                ) : paymentProviderInfo?.configured ? (
                  <>
                    Pagamentos processados via <strong>{paymentProviderInfo.provider}</strong> —{' '}
                    {paymentProviderInfo.provider_name}
                    {paymentProviderInfo.api_key_masked &&
                      ` (${paymentProviderInfo.api_key_masked})`}
                    .
                  </>
                ) : (
                  <>Nenhuma forma de pagamento configurada pelo administrador.</>
                )}
              </p>
            </div>

            {/* CASO 1: SE TIVER GATEWAY ATIVO (INFINITEPAY) E NÃO ESTIVER FORÇADO PIX MANUAL */}
            {!showPixFallback &&
              paymentProviderInfo?.configured &&
              paymentProviderInfo?.source !== 'pix_settings' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      Pagamento Rápido e Seguro
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Você será redirecionado para o ambiente seguro de pagamento da{' '}
                      <strong>{paymentProviderInfo?.provider || 'InfinitePay'}</strong> com suporte
                      a <strong>PIX</strong> e <strong>Cartão de Crédito</strong>. Assim que
                      aprovado, sua loja é ativada automaticamente.
                    </p>
                  </div>

                  <Button
                    type="button"
                    disabled={isCreatingCheckout}
                    onClick={handleStartInfinitePayCheckout}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm py-6 rounded-2xl shadow-lg shadow-emerald-600/20 gap-2"
                  >
                    {isCreatingCheckout ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Gerando Link de Pagamento...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        Pagar com {paymentProviderInfo?.provider || 'InfinitePay'}
                      </>
                    )}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPixFallback(true)
                        fetchServerPixPayload()
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 underline font-medium"
                    >
                      Pagar via PIX direto (Chave do Administrador)
                    </button>
                  </div>
                </div>
              )}

            {/* CASO 2: PIX DIRETO (FALLBACK OU CANAL PRINCIPAL QUANDO SÓ PIX ESTIVER ATIVO) */}
            {(showPixFallback ||
              paymentProviderInfo?.source === 'pix_settings' ||
              (!paymentProviderInfo?.configured && !paymentProviderInfo?.is_simulated)) && (
              <div className="space-y-3">
                {isLoadingPixPayload && (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                    <Loader2 className="w-7 h-7 animate-spin mx-auto text-indigo-600 mb-2" />
                    <p className="text-xs font-bold text-slate-800">
                      Gerando PIX Copia e Cola oficial...
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Calculando CRC16 e montando dados do Banco Central no servidor
                    </p>
                  </div>
                )}

                {pixPayloadError && !isLoadingPixPayload && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-rose-800">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      Nenhuma forma de pagamento configurada pelo administrador
                    </div>
                    <p className="text-[11px] text-rose-700 leading-relaxed">
                      {pixPayloadError}. Entre em contato com o suporte ou aguarde o administrador
                      cadastrar a chave Pix ou credenciais no painel.
                    </p>
                  </div>
                )}

                {pixPayloadData?.pix_payload && !isLoadingPixPayload && (
                  <div className="space-y-3">
                    {/* QR Code centralizado */}
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center">
                      <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-100">
                        <QRCodeSVG
                          value={pixPayloadData.pix_payload}
                          size={180}
                          level="M"
                          includeMargin={true}
                        />
                      </div>
                      <p className="text-[11px] text-slate-600 mt-2 font-semibold">
                        Abra o app do seu banco e aponte a câmera para o QR Code
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span>
                          Recebedor: <strong>{pixPayloadData.receiver_name}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Cidade: <strong>{pixPayloadData.receiver_city}</strong>
                        </span>
                      </div>
                      {pixPayloadData.txid && (
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                          Identificador: {pixPayloadData.txid}
                        </p>
                      )}
                    </div>

                    {/* Copia e cola */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>Código PIX Copia e Cola</span>
                        <span className="text-[10px] text-emerald-600 font-semibold">
                          Padrão Banco Central (EMV)
                        </span>
                      </Label>
                      <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs break-all select-all leading-relaxed max-h-24 overflow-y-auto">
                        {pixPayloadData.pix_payload}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCopyPix}
                        className="w-full text-xs font-bold rounded-xl gap-2 h-10 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copiedPix ? 'Código Pix Copiado!' : 'Copiar código Pix'}
                      </Button>
                    </div>

                    <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-[11px] leading-relaxed">
                      ℹ️ <strong>Após efetuar a transferência:</strong> Clique em{' '}
                      <strong>"Confirmar que realizei o pagamento"</strong> abaixo. O administrador
                      irá conferir o recebimento na conta bancária para reativar seu acesso.
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      {paymentProviderInfo?.configured &&
                        paymentProviderInfo.source !== 'pix_settings' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowPixFallback(false)}
                            className="text-xs"
                          >
                            Voltar ao Checkout Online
                          </Button>
                        )}
                      <Button
                        type="button"
                        size="sm"
                        disabled={isSubmittingPayment}
                        onClick={handleConfirmDirectPixPayment}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-5 rounded-xl flex-1 shadow-md"
                      >
                        {isSubmittingPayment ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Registrando Solicitação...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Confirmar que realizei o pagamento
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsPayModalOpen(false)}
                className="text-xs w-full text-slate-400 hover:text-slate-600"
              >
                Fechar
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

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

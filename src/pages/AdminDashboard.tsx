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
  getCustomersAndCollaborators,
  promoteToCollaborator,
  demoteToCustomer,
  getPaymentCredentials,
  createPaymentCredential,
  updatePaymentCredential,
  deletePaymentCredential,
  getPixSettings,
  createPixSetting,
  updatePixSetting,
  deletePixSetting,
} from '@/services/fidelityService'
import type {
  StoreRecord,
  SubscriptionPlanRecord,
  PurchaseRecord,
  ApprovalStatus,
  SubscriptionStatus,
  UserRecord,
  PaymentCredentialRecord,
  PixSettingRecord,
  PixKeyType,
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
  AlertCircle,
  AlertTriangle,
  Trash2,
  Plus,
  Edit2,
  DollarSign,
  Calendar,
  CheckCircle2,
  Layers,
  Search,
  UserCheck,
  UserX,
  UserCog,
  Lock,
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Phone,
  FileText,
  User,
  Info,
} from 'lucide-react'
import { formatPhoneNumber, formatDocumentWithLabel } from '@/lib/documentValidation'
import { useToast } from '@/hooks/use-toast'

export default function AdminDashboard() {
  const { user, role, isAuthenticated, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const isCollaborator = role === 'collaborator'
  const isAdmin = role === 'admin'

  const [stores, setStores] = useState<StoreRecord[]>([])
  const [plans, setPlans] = useState<SubscriptionPlanRecord[]>([])
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([])
  const [customersCount, setCustomersCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Collaborators & Customers management state
  const [customersList, setCustomersList] = useState<UserRecord[]>([])
  const [collaboratorsList, setCollaboratorsList] = useState<UserRecord[]>([])
  const [searchUserTerm, setSearchUserTerm] = useState('')
  const [userToPromote, setUserToPromote] = useState<UserRecord | null>(null)
  const [userToDemote, setUserToDemote] = useState<UserRecord | null>(null)
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)

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

  // Delete Store Modal state
  const [storeToDelete, setStoreToDelete] = useState<StoreRecord | null>(null)
  const [isDeletingStore, setIsDeletingStore] = useState(false)

  // Store Details Modal state
  const [storeToViewDetails, setStoreToViewDetails] = useState<StoreRecord | null>(null)

  // Edit Store Subscription Status Modal
  const [storeToEditSub, setStoreToEditSub] = useState<StoreRecord | null>(null)
  const [subStatusChoice, setSubStatusChoice] = useState<SubscriptionStatus>('active')
  const [subPlanChoice, setSubPlanChoice] = useState<string>('')
  const [subExpiryDate, setSubExpiryDate] = useState<string>('')
  const [subSuspendPublic, setSubSuspendPublic] = useState<boolean>(true)
  const [subSuspendMerchant, setSubSuspendMerchant] = useState<boolean>(true)

  // Payment Credentials state (Exclusive Admin)
  const [paymentCredentials, setPaymentCredentials] = useState<PaymentCredentialRecord[]>([])
  const [isCredModalOpen, setIsCredModalOpen] = useState(false)
  const [editingCred, setEditingCred] = useState<PaymentCredentialRecord | null>(null)
  const [credToDelete, setCredToDelete] = useState<PaymentCredentialRecord | null>(null)
  const [isDeletingCred, setIsDeletingCred] = useState(false)
  const [isSavingCred, setIsSavingCred] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)

  // Credential form fields
  const [credProviderSelect, setCredProviderSelect] = useState('InfinitePay')
  const [credCustomProvider, setCredCustomProvider] = useState('')
  const [credName, setCredName] = useState('')
  const [credApiKey, setCredApiKey] = useState('')
  const [credExtraConfig, setCredExtraConfig] = useState('')
  const [credIsActive, setCredIsActive] = useState(true)

  // Pix Settings state (Exclusive Admin)
  const [pixSettings, setPixSettings] = useState<PixSettingRecord[]>([])
  const [isPixModalOpen, setIsPixModalOpen] = useState(false)
  const [editingPix, setEditingPix] = useState<PixSettingRecord | null>(null)
  const [pixToDelete, setPixToDelete] = useState<PixSettingRecord | null>(null)
  const [isDeletingPix, setIsDeletingPix] = useState(false)
  const [isSavingPix, setIsSavingPix] = useState(false)
  const [showPixRawKey, setShowPixRawKey] = useState(false)

  // Pix form fields
  const [pixKeyInput, setPixKeyInput] = useState('')
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>('aleatoria')
  const [pixReceiverName, setPixReceiverName] = useState('')
  const [pixReceiverCity, setPixReceiverCity] = useState('')
  const [pixIsActive, setPixIsActive] = useState(true)

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (role !== 'admin' && role !== 'collaborator'))) {
      navigate('/login?tipo=admin')
      return
    }
    if (isAuthenticated && (role === 'admin' || role === 'collaborator')) {
      loadData()
    }
  }, [isAuthenticated, role, authLoading])

  const loadData = async () => {
    setIsLoading(true)
    try {
      if (isAdmin) {
        // Admin carrega tudo: lojas, planos, compras, clientes, colaboradores, credenciais e configurações Pix
        const [storesData, plansData, purchasesData, usersData, credsData, pixData] =
          await Promise.all([
            getAllStores(),
            getSubscriptionPlans(),
            getAllPurchases(),
            getCustomersAndCollaborators(),
            getPaymentCredentials(),
            getPixSettings(),
          ])

        setStores(storesData)
        setPlans(plansData)
        setPurchases(purchasesData)
        setCustomersList(usersData.customers)
        setCollaboratorsList(usersData.collaborators)
        setPaymentCredentials(credsData)
        setPixSettings(pixData)
        setCustomersCount(usersData.customers.length)
      } else {
        // Colaborador carrega APENAS lojas e planos de assinatura
        const [storesData, plansData] = await Promise.all([getAllStores(), getSubscriptionPlans()])

        setStores(storesData)
        setPlans(plansData)
        setPurchases([])
        setCustomersList([])
        setCollaboratorsList([])
      }
    } catch (err) {
      console.error('Error loading admin/collaborator data:', err)
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados administrativos.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // COLLABORATOR PROMOTION & DEMOTION HANDLERS
  const handlePromoteConfirm = async () => {
    if (!userToPromote) return
    setIsUpdatingRole(true)
    try {
      const updated = await promoteToCollaborator(userToPromote.id)
      setCustomersList((prev) => prev.filter((u) => u.id !== userToPromote.id))
      setCollaboratorsList((prev) => [updated, ...prev])
      toast({
        title: 'Cliente promovido a Colaborador!',
        description: `${userToPromote.name || userToPromote.email} agora tem permissão para gerenciar assinaturas.`,
      })
      setUserToPromote(null)
    } catch (err: any) {
      toast({
        title: 'Erro ao promover usuário',
        description: err.message || 'Não foi possível promover o usuário.',
        variant: 'destructive',
      })
    } finally {
      setIsUpdatingRole(false)
    }
  }

  const handleDemoteConfirm = async () => {
    if (!userToDemote) return
    setIsUpdatingRole(true)
    try {
      const updated = await demoteToCustomer(userToDemote.id)
      setCollaboratorsList((prev) => prev.filter((u) => u.id !== userToDemote.id))
      setCustomersList((prev) => [updated, ...prev])
      toast({
        title: 'Colaborador rebaixado a Cliente',
        description: `${userToDemote.name || userToDemote.email} retornou ao papel de cliente e perdeu o acesso administrativo.`,
      })
      setUserToDemote(null)
    } catch (err: any) {
      toast({
        title: 'Erro ao reverter colaborador',
        description: err.message || 'Não foi possível alterar a função do usuário.',
        variant: 'destructive',
      })
    } finally {
      setIsUpdatingRole(false)
    }
  }

  // STORE APPROVAL HANDLERS
  const handleApproveStore = async (store: StoreRecord) => {
    if (!isAdmin) {
      toast({
        title: 'Acesso restrito',
        description: 'Colaboradores não têm permissão para aprovar cadastros de lojas.',
        variant: 'destructive',
      })
      return
    }
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
    if (!isAdmin) {
      toast({
        title: 'Acesso restrito',
        description: 'Colaboradores não têm permissão para recusar cadastros de lojas.',
        variant: 'destructive',
      })
      return
    }
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

  // DELETE STORE HANDLER
  const handleDeleteStore = async () => {
    if (!storeToDelete) return
    if (!isAdmin) {
      toast({
        title: 'Acesso negado',
        description: 'Colaboradores não podem excluir lojas. Função exclusiva do administrador.',
        variant: 'destructive',
      })
      setStoreToDelete(null)
      return
    }
    setIsDeletingStore(true)
    try {
      await pb.collection('stores').delete(storeToDelete.id)
      setStores((prev) => prev.filter((s) => s.id !== storeToDelete.id))
      toast({
        title: 'Loja excluída permanentemente',
        description: `A loja "${storeToDelete.name}" foi removida do sistema. O lojista deverá solicitar um novo acesso ou cadastrar uma nova loja.`,
      })
      setStoreToDelete(null)
    } catch (err: any) {
      console.error('Error deleting store:', err)
      toast({
        title: 'Erro ao excluir loja',
        description: err.message || 'Não foi possível excluir a loja.',
        variant: 'destructive',
      })
    } finally {
      setIsDeletingStore(false)
    }
  }

  // STORE SUBSCRIPTION STATUS MODAL HANDLERS
  const calculateNextExpiry = (baseDateStr: string | undefined, intervalMonths: number): string => {
    let baseDate = baseDateStr ? new Date(baseDateStr) : new Date()
    if (isNaN(baseDate.getTime()) || baseDate < new Date()) {
      baseDate = new Date()
    }
    const targetDate = new Date(baseDate)
    targetDate.setMonth(targetDate.getMonth() + (intervalMonths || 1))
    return targetDate.toISOString().split('T')[0]
  }

  const openSubscriptionModal = (store: StoreRecord) => {
    setStoreToEditSub(store)
    const currentStatus = store.subscription_status || 'trial'
    setSubStatusChoice(currentStatus)
    setSubPlanChoice(store.subscription_plan_id || plans[0]?.id || '')
    setSubExpiryDate(store.subscription_expires_at || '')

    // Se a loja já tiver flags salvas, respeitar; senão, se for inadimplente (overdue/cancelled), default true
    if (store.suspend_public !== undefined) {
      setSubSuspendPublic(store.suspend_public)
    } else {
      setSubSuspendPublic(currentStatus === 'overdue' || currentStatus === 'cancelled')
    }

    if (store.suspend_merchant !== undefined) {
      setSubSuspendMerchant(store.suspend_merchant)
    } else {
      setSubSuspendMerchant(currentStatus === 'overdue' || currentStatus === 'cancelled')
    }
  }

  const handleStatusChoiceChange = (newStatus: SubscriptionStatus) => {
    setSubStatusChoice(newStatus)
    // Se o admin selecionar Em Atraso ou Cancelado e nenhuma opção estiver marcada, sugere marcar ambas
    if (newStatus === 'overdue' || newStatus === 'cancelled') {
      if (!subSuspendPublic && !subSuspendMerchant) {
        setSubSuspendPublic(true)
        setSubSuspendMerchant(true)
      }
    } else if (newStatus === 'active' || newStatus === 'trial') {
      // Regularização: limpa as suspensões
      setSubSuspendPublic(false)
      setSubSuspendMerchant(false)
    }
  }

  const handleApproveSubscriptionPayment = async () => {
    if (!storeToEditSub) return
    const plan = plans.find((p) => p.id === (subPlanChoice || storeToEditSub.subscription_plan_id))
    const intervalMonths = plan?.billing_interval_months || 1
    const nextExpiry = calculateNextExpiry(storeToEditSub.subscription_expires_at, intervalMonths)

    try {
      const updated = await updateStore(storeToEditSub.id, {
        subscription_status: 'active',
        subscription_plan_id: subPlanChoice || storeToEditSub.subscription_plan_id || undefined,
        subscription_expires_at: nextExpiry,
        suspend_public: false,
        suspend_merchant: false,
      })
      setStores((prev) => prev.map((s) => (s.id === storeToEditSub.id ? updated : s)))
      setStoreToEditSub(null)
      toast({
        title: 'Pagamento confirmado e assinatura ativada!',
        description: `Loja "${storeToEditSub.name}" ativada até ${nextExpiry} (+${intervalMonths} mês/meses). Suspensões removidas.`,
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao aprovar pagamento',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  const handleSaveStoreSubscription = async () => {
    if (!storeToEditSub) return
    try {
      const isOverdueOrCancelled = subStatusChoice === 'overdue' || subStatusChoice === 'cancelled'
      const updated = await updateStore(storeToEditSub.id, {
        subscription_status: subStatusChoice,
        subscription_plan_id: subPlanChoice || undefined,
        subscription_expires_at: subExpiryDate || undefined,
        // Limpar suspensões se status foi regularizado para ativo ou trial
        suspend_public: isOverdueOrCancelled ? subSuspendPublic : false,
        suspend_merchant: isOverdueOrCancelled ? subSuspendMerchant : false,
      })
      setStores((prev) => prev.map((s) => (s.id === storeToEditSub.id ? updated : s)))
      setStoreToEditSub(null)
      toast({
        title: 'Assinatura atualizada',
        description: `Status de pagamento, plano e tipos de suspensão atualizados com sucesso.`,
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar assinatura',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  // PAYMENT CREDENTIALS HANDLERS (Exclusive Admin)
  const openCredModal = (cred?: PaymentCredentialRecord) => {
    if (cred) {
      setEditingCred(cred)
      const commonProviders = ['InfinitePay', 'Mercado Pago', 'PagSeguro', 'Asaas', 'Stripe']
      if (commonProviders.includes(cred.provider)) {
        setCredProviderSelect(cred.provider)
        setCredCustomProvider('')
      } else {
        setCredProviderSelect('Outro')
        setCredCustomProvider(cred.provider)
      }
      setCredName(cred.name)
      setCredApiKey('') // Nunca reexibida
      setShowApiKey(false)
      setCredExtraConfig(
        cred.extra_config && Object.keys(cred.extra_config).length > 0
          ? JSON.stringify(cred.extra_config, null, 2)
          : '',
      )
      setCredIsActive(cred.is_active ?? true)
    } else {
      setEditingCred(null)
      setCredProviderSelect('InfinitePay')
      setCredCustomProvider('')
      setCredName('')
      setCredApiKey('')
      setShowApiKey(false)
      setCredExtraConfig('')
      setCredIsActive(true)
    }
    setIsCredModalOpen(true)
  }

  const handleSaveCredential = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) return

    const finalProvider =
      credProviderSelect === 'Outro' ? credCustomProvider.trim() : credProviderSelect.trim()
    if (!finalProvider) {
      toast({
        title: 'Informe o provedor',
        description: 'Digite o nome do provedor ou selecione uma das opções.',
        variant: 'destructive',
      })
      return
    }

    if (!editingCred && !credApiKey.trim()) {
      toast({
        title: 'API Key obrigatória',
        description: 'Informe a API Key do provedor de pagamento.',
        variant: 'destructive',
      })
      return
    }

    let parsedExtra: Record<string, any> | undefined = undefined
    if (credExtraConfig.trim()) {
      try {
        parsedExtra = JSON.parse(credExtraConfig.trim())
      } catch (_) {
        toast({
          title: 'JSON de dados extras inválido',
          description:
            'Verifique a formatação do JSON de dados extras (ex: {"merchant_id": "123"}).',
          variant: 'destructive',
        })
        return
      }
    }

    setIsSavingCred(true)
    try {
      if (editingCred) {
        const payload: any = {
          provider: finalProvider,
          name: credName.trim(),
          is_active: credIsActive,
          extra_config: parsedExtra || {},
        }
        if (credApiKey.trim()) {
          payload.api_key = credApiKey.trim()
        }
        await updatePaymentCredential(editingCred.id, payload)
        toast({
          title: 'Credencial atualizada com sucesso!',
          description: `Credencial "${credName}" foi salva.`,
        })
      } else {
        await createPaymentCredential({
          provider: finalProvider,
          name: credName.trim(),
          api_key: credApiKey.trim(),
          extra_config: parsedExtra || {},
          is_active: credIsActive,
        })
        toast({
          title: 'Credencial cadastrada!',
          description: `Credencial "${credName}" para ${finalProvider} cadastrada com sucesso.`,
        })
      }

      // Recarrega a lista de credenciais
      const updatedList = await getPaymentCredentials()
      setPaymentCredentials(updatedList)
      setIsCredModalOpen(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar credencial',
        description: err.message || 'Não foi possível salvar a credencial de pagamento.',
        variant: 'destructive',
      })
    } finally {
      setIsSavingCred(false)
    }
  }

  const handleToggleCredentialActive = async (cred: PaymentCredentialRecord) => {
    if (!isAdmin) return
    const nextState = !cred.is_active
    try {
      await updatePaymentCredential(cred.id, {
        is_active: nextState,
      })
      const updatedList = await getPaymentCredentials()
      setPaymentCredentials(updatedList)
      toast({
        title: nextState ? 'Credencial ativada!' : 'Credencial desativada',
        description: nextState
          ? `A credencial "${cred.name}" foi ativada como principal para ${cred.provider}.`
          : `A credencial "${cred.name}" foi desativada.`,
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao alterar status',
        description: err.message || 'Não foi possível alterar a ativação da credencial.',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteCredential = async () => {
    if (!credToDelete || !isAdmin) return
    setIsDeletingCred(true)
    try {
      await deletePaymentCredential(credToDelete.id)
      setPaymentCredentials((prev) => prev.filter((c) => c.id !== credToDelete.id))
      toast({
        title: 'Credencial excluída',
        description: `A credencial "${credToDelete.name}" foi removida com sucesso.`,
      })
      setCredToDelete(null)
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir credencial',
        description: err.message || 'Não foi possível excluir a credencial.',
        variant: 'destructive',
      })
    } finally {
      setIsDeletingCred(false)
    }
  }

  // PIX SETTINGS HANDLERS (Exclusive Admin)
  const openPixModal = (pix?: PixSettingRecord) => {
    if (pix) {
      setEditingPix(pix)
      setPixKeyInput('') // Nunca reexibida
      setShowPixRawKey(false)
      setPixKeyType(pix.key_type || 'aleatoria')
      setPixReceiverName(pix.receiver_name || '')
      setPixReceiverCity(pix.receiver_city || '')
      setPixIsActive(pix.is_active ?? true)
    } else {
      setEditingPix(null)
      setPixKeyInput('')
      setShowPixRawKey(false)
      setPixKeyType('aleatoria')
      setPixReceiverName('FIDELIZA SISTEMAS')
      setPixReceiverCity('SAO PAULO')
      setPixIsActive(true)
    }
    setIsPixModalOpen(true)
  }

  const handleSavePixSetting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) return

    if (!editingPix && !pixKeyInput.trim()) {
      toast({
        title: 'Chave Pix obrigatória',
        description: 'Informe a chave Pix de recebimento.',
        variant: 'destructive',
      })
      return
    }

    if (!pixReceiverName.trim()) {
      toast({
        title: 'Nome do recebedor obrigatório',
        description: 'Informe o nome do recebedor (máx 25 caracteres para o padrão EMV).',
        variant: 'destructive',
      })
      return
    }

    if (!pixReceiverCity.trim()) {
      toast({
        title: 'Cidade obrigatória',
        description: 'Informe a cidade do recebedor (máx 15 caracteres para o padrão EMV).',
        variant: 'destructive',
      })
      return
    }

    // Sanitizar nome e cidade para caber nos limites do EMV (25 e 15 caracteres)
    const treatedName = pixReceiverName.trim().slice(0, 25)
    const treatedCity = pixReceiverCity.trim().slice(0, 15)

    setIsSavingPix(true)
    try {
      if (editingPix) {
        const payload: any = {
          key_type: pixKeyType,
          receiver_name: treatedName,
          receiver_city: treatedCity,
          is_active: pixIsActive,
        }
        if (pixKeyInput.trim()) {
          payload.pix_key = pixKeyInput.trim()
        }
        await updatePixSetting(editingPix.id, payload)
        toast({
          title: 'Configuração Pix atualizada!',
          description: `Chave Pix de "${treatedName}" salva com sucesso.`,
        })
      } else {
        await createPixSetting({
          pix_key: pixKeyInput.trim(),
          key_type: pixKeyType,
          receiver_name: treatedName,
          receiver_city: treatedCity,
          is_active: pixIsActive,
        })
        toast({
          title: 'Chave Pix cadastrada!',
          description: `Chave Pix de "${treatedName}" cadastrada com sucesso.`,
        })
      }

      const updatedList = await getPixSettings()
      setPixSettings(updatedList)
      setIsPixModalOpen(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar chave Pix',
        description: err.message || 'Não foi possível salvar a configuração Pix.',
        variant: 'destructive',
      })
    } finally {
      setIsSavingPix(false)
    }
  }

  const handleTogglePixActive = async (pix: PixSettingRecord) => {
    if (!isAdmin) return
    const nextState = !pix.is_active
    try {
      await updatePixSetting(pix.id, {
        is_active: nextState,
      })
      const updatedList = await getPixSettings()
      setPixSettings(updatedList)
      toast({
        title: nextState ? 'Chave Pix ativada!' : 'Chave Pix desativada',
        description: nextState
          ? `A chave de ${pix.receiver_name} foi definida como ativa para geração de PIX copia e cola.`
          : `A chave Pix foi desativada.`,
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao alterar status da chave Pix',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  const handleDeletePixSetting = async () => {
    if (!pixToDelete || !isAdmin) return
    setIsDeletingPix(true)
    try {
      await deletePixSetting(pixToDelete.id)
      setPixSettings((prev) => prev.filter((p) => p.id !== pixToDelete.id))
      toast({
        title: 'Chave Pix removida',
        description: `A configuração Pix de "${pixToDelete.receiver_name}" foi excluída.`,
      })
      setPixToDelete(null)
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir chave Pix',
        description: err.message || 'Não foi possível excluir a configuração.',
        variant: 'destructive',
      })
    } finally {
      setIsDeletingPix(false)
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
    const term = searchStoreTerm.toLowerCase().trim()
    if (!term) return matchesStatus
    const ownerName = s.expand?.owner_id?.name?.toLowerCase() || ''
    const ownerEmail = s.expand?.owner_id?.email?.toLowerCase() || ''
    const ownerPhone = s.expand?.owner_id?.phone?.toLowerCase() || ''
    const ownerDoc = s.expand?.owner_id?.document?.toLowerCase() || ''
    const matchesSearch =
      s.name.toLowerCase().includes(term) ||
      s.category.toLowerCase().includes(term) ||
      (s.address && s.address.toLowerCase().includes(term)) ||
      ownerName.includes(term) ||
      ownerEmail.includes(term) ||
      ownerPhone.includes(term) ||
      ownerDoc.includes(term)
    return matchesStatus && matchesSearch
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl flex-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                isCollaborator ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {isCollaborator ? (
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 gap-1 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Colaborador do Administrador (Área Restrita)
                  </Badge>
                ) : (
                  <Badge className="bg-purple-50 text-purple-700 border-purple-200 gap-1 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Painel do Administrador Geral
                  </Badge>
                )}
                {isAdmin && pendingStores.length > 0 && (
                  <Badge className="bg-amber-500 text-slate-950 font-bold animate-pulse">
                    {pendingStores.length} loja(s) aguardando aprovação
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                {isCollaborator
                  ? 'Gestão de Assinaturas das Lojas'
                  : 'Gestão Global do Sistema Fideliza'}
              </h1>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isCollaborator
              ? 'Acesso restrito: controle de pagamentos, status das assinaturas e planos para lojistas.'
              : 'Aprovação de lojistas, controle de planos, colaboradores e visão analítica das operações.'}
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

      {/* Collaborator Notice Banner */}
      {isCollaborator && (
        <div className="mb-6 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-3">
          <Lock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-sm text-blue-950">
              Permissões concedidas: Gestão de Assinaturas
            </p>
            <p className="text-blue-800 leading-relaxed">
              Você está autenticado como <strong>colaborador do administrador</strong>. Seu perfil
              possui permissão para visualizar o status das assinaturas de todas as lojas, confirmar
              pagamentos, ajustar vencimentos e configurar os planos de assinatura. A exclusão de
              lojas e aprovações cadastrais são exclusivas do administrador geral.
            </p>
          </div>
        </div>
      )}

      {/* METRICS CARDS */}
      {isAdmin ? (
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
                  {collaboratorsList.length} colaborador(es) ativo(s)
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
      ) : (
        /* Colaborador Metrics (focadas estritamente em assinaturas) */
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="rounded-2xl border-slate-200">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total de Lojas
                </p>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  {stores.length}
                </h3>
                <p className="text-[11px] text-slate-500 font-semibold mt-1">
                  Para gestão de planos
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Store className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Assinaturas Ativas
                </p>
                <h3 className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">
                  {stores.filter((s) => s.subscription_status === 'active').length}
                </h3>
                <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                  Pagamento confirmado
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Aguardando Confirmação
                </p>
                <h3 className="text-2xl sm:text-3xl font-black text-blue-700 mt-1">
                  {stores.filter((s) => s.subscription_status === 'pending').length}
                </h3>
                <p className="text-[11px] text-blue-600 font-semibold mt-1">
                  Pagamentos PIX informados
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Em Teste ou Atraso
                </p>
                <h3 className="text-2xl sm:text-3xl font-black text-amber-700 mt-1">
                  {
                    stores.filter(
                      (s) =>
                        s.subscription_status === 'trial' || s.subscription_status === 'overdue',
                    ).length
                  }
                </h3>
                <p className="text-[11px] text-amber-600 font-semibold mt-1">Trial ou pendência</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TABS: LOJAS, PLANOS, COLABORADORES, RELATÓRIO GLOBAL */}
      <Tabs defaultValue="stores" className="space-y-6">
        <TabsList className="bg-slate-200/70 p-1 rounded-xl">
          <TabsTrigger value="stores" className="gap-2 text-xs sm:text-sm font-semibold">
            <Store className="w-4 h-4" />
            {isCollaborator ? 'Assinaturas das Lojas' : 'Lojas & Aprovações'}
            {isAdmin && pendingStores.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                {pendingStores.length}
              </span>
            )}
          </TabsTrigger>

          <TabsTrigger value="plans" className="gap-2 text-xs sm:text-sm font-semibold">
            <Layers className="w-4 h-4" />
            Planos de Assinatura ({plans.length})
          </TabsTrigger>

          {/* Abas exclusivas do Administrador Geral */}
          {isAdmin && (
            <TabsTrigger value="credentials" className="gap-2 text-xs sm:text-sm font-semibold">
              <Key className="w-4 h-4 text-emerald-600" />
              Credenciais & Pix ({paymentCredentials.length + pixSettings.length})
            </TabsTrigger>
          )}

          {isAdmin && (
            <TabsTrigger value="collaborators" className="gap-2 text-xs sm:text-sm font-semibold">
              <UserCog className="w-4 h-4 text-purple-600" />
              Colaboradores ({collaboratorsList.length})
            </TabsTrigger>
          )}

          {isAdmin && (
            <TabsTrigger value="reports" className="gap-2 text-xs sm:text-sm font-semibold">
              <TrendingUp className="w-4 h-4" />
              Relatório Global de Vendas
            </TabsTrigger>
          )}
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
                    {isAdmin && <th className="py-3.5 px-4">Lojista Proprietário</th>}
                    {!isCollaborator && <th className="py-3.5 px-4">Status de Aprovação</th>}
                    <th className="py-3.5 px-4">Plano & Pagamento</th>
                    <th className="py-3.5 px-4">Cidade / Contato da Loja</th>
                    <th className="py-3.5 px-4 text-right">
                      {isCollaborator ? 'Gestão da Assinatura' : 'Ações do Administrador'}
                    </th>
                  </tr>
                </thead>{' '}
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

                      {/* Lojista Proprietário (Exclusivo Administrador) */}
                      {isAdmin && (
                        <td className="py-4 px-4">
                          <div className="space-y-1 max-w-[220px]">
                            <p className="font-bold text-slate-900 truncate">
                              {st.expand?.owner_id?.name || 'Lojista não informado'}
                            </p>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>
                                {st.expand?.owner_id?.phone
                                  ? formatPhoneNumber(st.expand.owner_id.phone)
                                  : 'Tel: não cadastrado'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                              <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="font-mono text-[10px]">
                                {st.expand?.owner_id?.document
                                  ? formatDocumentWithLabel(st.expand.owner_id.document)
                                  : 'Doc: não cadastrado'}
                              </span>
                            </div>
                            {st.expand?.owner_id?.email && (
                              <p className="text-[10px] text-slate-400 truncate">
                                {st.expand.owner_id.email}
                              </p>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Approval Status (Oculto para colaboradores, apenas admin) */}
                      {!isCollaborator && (
                        <td className="py-4 px-4">
                          {' '}
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
                      )}

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
                            {st.subscription_status === 'pending' && (
                              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                            )}
                            <span className="font-bold text-slate-800 capitalize">
                              {st.subscription_status === 'active'
                                ? 'Pago / Ativo'
                                : st.subscription_status === 'trial'
                                  ? 'Período de Teste'
                                  : st.subscription_status === 'pending'
                                    ? 'Aguardando Confirmação'
                                    : st.subscription_status === 'overdue'
                                      ? 'Em Atraso'
                                      : 'Cancelado'}
                            </span>
                          </div>

                          {/* Indicadores do tipo de suspensão ativa */}
                          {(st.subscription_status === 'overdue' ||
                            st.subscription_status === 'cancelled') && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {st.suspend_public && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] py-0 px-1.5 border-rose-300 text-rose-700 bg-rose-50"
                                >
                                  Susp. Portal Público
                                </Badge>
                              )}
                              {st.suspend_merchant && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] py-0 px-1.5 border-amber-300 text-amber-700 bg-amber-50"
                                >
                                  Susp. Painel Lojista
                                </Badge>
                              )}
                              {!st.suspend_public && !st.suspend_merchant && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] py-0 px-1.5 border-slate-200 text-slate-500"
                                >
                                  Sem bloqueio ativo
                                </Badge>
                              )}
                            </div>
                          )}

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
                          {isAdmin && st.approval_status === 'pending' && (
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

                          {/* Ver Detalhes Completos da Loja e Lojista (Admin) */}
                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setStoreToViewDetails(st)}
                              className="text-xs h-8 px-2.5 gap-1 border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold"
                              title="Ver Detalhes da Loja e Lojista"
                            >
                              <Info className="w-3.5 h-3.5 text-slate-500" />
                              Detalhes
                            </Button>
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
                          {/* Excluir loja: Apenas Admin Geral! Colaboradores NÃO veem este botão */}
                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setStoreToDelete(st)}
                              className="text-xs h-8 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-semibold"
                              title="Excluir Loja Permanentemente (Exclusivo Admin)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredStores.length === 0 && (
                    <tr>
                      <td
                        colSpan={isCollaborator ? 4 : 6}
                        className="py-8 text-center text-slate-400"
                      >
                        Nenhuma loja encontrada com os filtros selecionados.
                      </td>
                    </tr>
                  )}{' '}
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
        {/* TAB: CREDENCIAIS DE PAGAMENTO (APENAS ADMIN)             */}
        {/* ======================================================== */}
        {isAdmin && (
          <TabsContent value="credentials" className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                    <Key className="w-5 h-5 text-emerald-600" />
                    Credenciais de Pagamento & API Keys
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cadastre chaves de API para receber pagamentos de assinaturas de diferentes
                    bancos e gateways (InfinitePay, Mercado Pago, PagSeguro, Asaas, Stripe ou
                    personalizado).
                  </p>
                </div>
                <Button
                  onClick={() => openCredModal()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Nova Credencial de Pagamento
                </Button>
              </div>

              {/* Informação sobre Provedor em Uso */}
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-950">
                      Status do Gateway de Pagamento
                    </p>
                    <p className="text-xs text-emerald-800">
                      {paymentCredentials.some((c) => c.is_active) ? (
                        <>
                          Pagamentos de assinaturas sendo processados via{' '}
                          <strong>
                            {paymentCredentials.find((c) => c.is_active)?.provider} —{' '}
                            {paymentCredentials.find((c) => c.is_active)?.name}
                          </strong>
                          .
                        </>
                      ) : pixSettings.some((p) => p.is_active) ? (
                        <>
                          Gateway de pagamento inativo. Pagamentos sendo processados diretamente via{' '}
                          <strong>
                            PIX Copia e Cola (Chave de{' '}
                            {pixSettings.find((p) => p.is_active)?.receiver_name})
                          </strong>
                          .
                        </>
                      ) : (
                        <>
                          Nenhuma credencial de provedor ou chave Pix ativa. Cadastre uma chave Pix
                          abaixo para habilitar o pagamento das assinaturas.
                        </>
                      )}
                    </p>
                  </div>
                </div>
                {paymentCredentials.some((c) => c.is_active) && (
                  <Badge className="bg-emerald-600 text-white font-bold text-[11px] px-3 py-1">
                    Gateway Ativo no Sistema
                  </Badge>
                )}
              </div>

              {/* Tabela de Credenciais */}
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Provedor / Banco</th>
                      <th className="py-3 px-4">Identificação / Conta</th>
                      <th className="py-3 px-4">API Key Mascarada</th>
                      <th className="py-3 px-4">Configuração Extra</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Última Atualização</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paymentCredentials.map((cred) => (
                      <tr key={cred.id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-black text-xs">
                              {cred.provider.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900">{cred.provider}</p>
                              {cred.provider.toLowerCase().includes('infinitepay') && (
                                <span className="text-[10px] text-emerald-600 font-semibold">
                                  Integração ativa no checkout
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{cred.name}</td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                          <Badge
                            variant="outline"
                            className="font-mono bg-slate-50 border-slate-200 text-slate-700"
                          >
                            {cred.api_key_masked || '****...****'}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {cred.extra_config && Object.keys(cred.extra_config).length > 0 ? (
                            <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                              {Object.keys(cred.extra_config).join(', ')}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Padrão</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleCredentialActive(cred)}
                            className="inline-flex items-center gap-1.5 focus:outline-hidden"
                            title="Clique para alternar o status da credencial"
                          >
                            {cred.is_active ? (
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 gap-1 font-bold cursor-pointer hover:bg-emerald-200">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                Ativa (Principal)
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-slate-500 border-slate-300 gap-1 cursor-pointer hover:bg-slate-100"
                              >
                                Inativa
                              </Badge>
                            )}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                          {new Date(cred.updated || cred.created).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(cred.updated || cred.created).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openCredModal(cred)}
                              className="text-xs h-8 px-2 text-slate-600 hover:text-slate-900"
                              title="Editar credencial / substituir API Key"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setCredToDelete(cred)}
                              className="text-xs h-8 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                              title="Excluir credencial"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {paymentCredentials.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          Nenhuma credencial de pagamento cadastrada. Clique em "Nova Credencial de
                          Pagamento" para registrar sua API Key.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* SEÇÃO: CHAVE PIX DE RECEBIMENTO DO ADMINISTRADOR (EMV REAL) */}
              <div className="mt-12 pt-8 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-indigo-600" />
                      Chave Pix de Recebimento do Administrador
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cadastre a chave Pix oficial para recebimento direto de assinaturas quando não
                      houver gateway ativo (ex: InfinitePay). O servidor gera o payload oficial do
                      Banco Central (EMV / CRC16) com o valor exato do plano. A chave nunca é
                      exibida ao lojista.
                    </p>
                  </div>
                  <Button
                    onClick={() => openPixModal()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Nova Chave Pix
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4">Recebedor (EMV)</th>
                        <th className="py-3 px-4">Cidade</th>
                        <th className="py-3 px-4">Tipo de Chave</th>
                        <th className="py-3 px-4">Chave Pix Mascarada</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Atualizado</th>
                        <th className="py-3 px-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pixSettings.map((pix) => (
                        <tr key={pix.id} className="hover:bg-slate-50/70">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-black text-xs">
                                PIX
                              </div>
                              <div>
                                <p className="font-extrabold text-slate-900">{pix.receiver_name}</p>
                                <span className="text-[10px] text-indigo-600 font-semibold">
                                  Recebedor Oficial
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            {pix.receiver_city}
                          </td>
                          <td className="py-3.5 px-4 capitalize text-slate-700">
                            <Badge
                              variant="outline"
                              className="text-[11px] font-medium bg-slate-50"
                            >
                              {pix.key_type}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                            <Badge
                              variant="outline"
                              className="font-mono bg-slate-50 border-slate-200 text-slate-700"
                            >
                              {pix.pix_key_masked || '****'}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              onClick={() => handleTogglePixActive(pix)}
                              className="inline-flex items-center gap-1.5 focus:outline-hidden"
                              title="Clique para alternar o status desta chave Pix"
                            >
                              {pix.is_active ? (
                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 gap-1 font-bold cursor-pointer hover:bg-emerald-200">
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                  Ativa (Padrão)
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-slate-500 border-slate-300 gap-1 cursor-pointer hover:bg-slate-100"
                                >
                                  Inativa
                                </Badge>
                              )}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                            {new Date(pix.updated || pix.created).toLocaleDateString('pt-BR')} às{' '}
                            {new Date(pix.updated || pix.created).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openPixModal(pix)}
                                className="text-xs h-8 px-2 text-slate-600 hover:text-slate-900"
                                title="Editar configuração / alterar chave Pix"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setPixToDelete(pix)}
                                className="text-xs h-8 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                title="Excluir configuração Pix"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {pixSettings.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            Nenhuma chave Pix de recebimento cadastrada. Cadastre uma chave para
                            permitir que os lojistas paguem a assinatura via Pix direto (EMV Banco
                            Central).
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>
        )}

        {/* ======================================================== */}
        {/* TAB 3: COLABORADORES DO ADMINISTRADOR (APENAS ADMIN)     */}
        {/* ======================================================== */}
        {isAdmin && (
          <TabsContent value="collaborators" className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                    <UserCog className="w-5 h-5 text-purple-600" />
                    Colaboradores do Administrador
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Promova clientes para atuarem como colaboradores administrativos com permissão
                    para gerenciar exclusivamente assinaturas e planos (sem permissão para excluir
                    lojas).
                  </p>
                </div>
              </div>

              {/* Tabela de Colaboradores Ativos */}
              <div className="mb-8 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    Colaboradores Atuais ({collaboratorsList.length})
                  </h4>
                  <Badge variant="outline" className="text-[10px] text-purple-700 bg-purple-50">
                    Acesso a Assinaturas e Planos
                  </Badge>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4">Nome / Usuário</th>
                        <th className="py-3 px-4">E-mail</th>
                        <th className="py-3 px-4">Telefone / Documento</th>
                        <th className="py-3 px-4">Função Atual</th>
                        <th className="py-3 px-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {collaboratorsList.map((colab) => (
                        <tr key={colab.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                                {colab.name?.charAt(0).toUpperCase() || 'C'}
                              </div>
                              <div>
                                <p>{colab.name || 'Sem nome'}</p>
                                <p className="text-[10px] text-slate-400">ID: {colab.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-700">{colab.email}</td>
                          <td className="py-3 px-4 text-slate-600">
                            <p>{colab.phone || '-'}</p>
                            <p className="text-[10px] text-slate-400">{colab.document || '-'}</p>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] font-semibold gap-1">
                              <ShieldCheck className="w-3 h-3" /> Colaborador
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setUserToDemote(colab)}
                              className="text-xs h-7 px-2.5 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 gap-1 font-semibold"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              Reverter para Cliente
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {collaboratorsList.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400">
                            Nenhum colaborador cadastrado. Promova um cliente abaixo para
                            adicioná-lo.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tabela de Clientes Disponíveis para Promoção */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-600" />
                      Clientes Cadastrados ({customersList.length})
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Escolha um cliente da base para promover ao papel de colaborador
                      administrativo.
                    </p>
                  </div>

                  <div className="relative max-w-xs w-full">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <Input
                      placeholder="Buscar cliente por nome ou e-mail..."
                      value={searchUserTerm}
                      onChange={(e) => setSearchUserTerm(e.target.value)}
                      className="pl-8 text-xs h-8"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-100 max-h-96">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-slate-50 z-10">
                      <tr className="border-b bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4">Nome</th>
                        <th className="py-3 px-4">E-mail</th>
                        <th className="py-3 px-4">Código / Documento</th>
                        <th className="py-3 px-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customersList
                        .filter(
                          (c) =>
                            searchUserTerm.trim() === '' ||
                            c.name?.toLowerCase().includes(searchUserTerm.toLowerCase()) ||
                            c.email?.toLowerCase().includes(searchUserTerm.toLowerCase()) ||
                            c.customer_code?.toLowerCase().includes(searchUserTerm.toLowerCase()),
                        )
                        .map((cust) => (
                          <tr key={cust.id} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-4 font-bold text-slate-900">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center justify-center">
                                  {cust.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <span>{cust.name || 'Cliente sem nome'}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-slate-700">{cust.email}</td>
                            <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                              {cust.customer_code || cust.document || '-'}
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <Button
                                size="sm"
                                onClick={() => setUserToPromote(cust)}
                                className="text-xs h-7 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold gap-1"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                Promover a Colaborador
                              </Button>
                            </td>
                          </tr>
                        ))}
                      {customersList.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400">
                            Nenhum cliente cadastrado no momento.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>
        )}

        {/* ======================================================== */}
        {/* TAB 4: RELATÓRIO GLOBAL DE VENDAS (APENAS ADMIN)         */}
        {/* ======================================================== */}
        {isAdmin && (
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
        )}
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

      {/* MODAL: CONFIRM DELETE STORE */}
      <Dialog open={!!storeToDelete} onOpenChange={(open) => !open && setStoreToDelete(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-2">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-black text-slate-900">
              Excluir Loja Permanentemente?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              Você está prestes a excluir a loja <strong>"{storeToDelete?.name}"</strong>. Esta ação
              é irreversível: a loja será removida imediatamente do portal público e a conta do
              lojista ficará sem loja vinculada, obrigando-o a solicitar um novo acesso ou cadastrar
              uma nova loja.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeletingStore}
              onClick={() => setStoreToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isDeletingStore}
              onClick={handleDeleteStore}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {isDeletingStore ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: PROMOVER CLIENTE A COLABORADOR */}
      <Dialog open={!!userToPromote} onOpenChange={(open) => !open && setUserToPromote(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2">
              <UserCheck className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-black text-slate-900">
              Promover a Colaborador do Administrador?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              Você está promovendo o cliente{' '}
              <strong>"{userToPromote?.name || userToPromote?.email}"</strong> (
              {userToPromote?.email}) para o papel de <strong>Colaborador</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 text-xs space-y-1 my-2">
            <p className="font-bold">Permissões que serão concedidas:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-purple-800 text-[11px]">
              <li>Acesso ao painel administrativo de assinaturas</li>
              <li>Ajustar status de planos e assinaturas de lojas (Trial, Pago, Vencimento)</li>
              <li>Confirmar pagamentos de mensalidades</li>
              <li>Editar e criar valores de planos de assinatura</li>
            </ul>
            <p className="font-bold text-rose-600 pt-1 text-[11px]">
              O colaborador NÃO poderá excluir lojas nem aprovar/recusar cadastros de lojas.
            </p>
          </div>

          <DialogFooter className="pt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUpdatingRole}
              onClick={() => setUserToPromote(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isUpdatingRole}
              onClick={handlePromoteConfirm}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
            >
              {isUpdatingRole ? 'Promovendo...' : 'Confirmar Promoção'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: REVERTER COLABORADOR PARA CLIENTE */}
      <Dialog open={!!userToDemote} onOpenChange={(open) => !open && setUserToDemote(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-2">
              <UserX className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-black text-slate-900">
              Reverter Colaborador para Cliente?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              Deseja remover os privilégios administrativos de{' '}
              <strong>"{userToDemote?.name || userToDemote?.email}"</strong>? O usuário voltará a
              ser um cliente comum (role = customer) e não terá mais acesso à área de gestão de
              assinaturas.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUpdatingRole}
              onClick={() => setUserToDemote(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isUpdatingRole}
              onClick={handleDemoteConfirm}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {isUpdatingRole ? 'Revertendo...' : 'Confirmar Reversão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: CRIAR OU EDITAR CREDENCIAL DE PAGAMENTO (ADMIN) */}
      <Dialog open={isCredModalOpen} onOpenChange={setIsCredModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1">
              <Key className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-black text-slate-900">
              {editingCred
                ? 'Editar Credencial de Pagamento'
                : 'Cadastrar Nova Credencial de Pagamento'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Cadastre chaves de API e credenciais de bancos ou gateways para processamento de
              pagamentos.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCredential} className="space-y-4 pt-2">
            {/* Provedor / Banco */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Provedor / Banco</Label>
              <Select
                value={credProviderSelect}
                onValueChange={(val) => setCredProviderSelect(val)}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Selecione o provedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="InfinitePay">InfinitePay (Checkout Integrado)</SelectItem>
                  <SelectItem value="Mercado Pago">Mercado Pago</SelectItem>
                  <SelectItem value="PagSeguro">PagSeguro</SelectItem>
                  <SelectItem value="Asaas">Asaas</SelectItem>
                  <SelectItem value="Stripe">Stripe</SelectItem>
                  <SelectItem value="Outro">Outro (Personalizado)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Nome customizado se selecionou Outro */}
            {credProviderSelect === 'Outro' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  Nome do Provedor Personalizado
                </Label>
                <Input
                  required
                  placeholder="Ex: Banco Inter, Nubank, Itaú..."
                  value={credCustomProvider}
                  onChange={(e) => setCredCustomProvider(e.target.value)}
                  className="text-xs"
                />
              </div>
            )}

            {/* Identificador / Nome da credencial */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Nome da Conta / Identificador
              </Label>
              <Input
                required
                placeholder="Ex: Conta PJ Principal, InfinitePay Produção"
                value={credName}
                onChange={(e) => setCredName(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* API Key com botão de olho */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-700">
                  {editingCred
                    ? 'Nova API Key (deixe em branco para manter a atual)'
                    : 'API Key do Provedor'}
                </Label>
                {editingCred?.api_key_masked && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    Atual: {editingCred.api_key_masked}
                  </span>
                )}
              </div>
              <div className="relative">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  required={!editingCred}
                  placeholder={editingCred ? '••••••••••••••••' : 'Cole sua API Key aqui'}
                  value={credApiKey}
                  onChange={(e) => setCredApiKey(e.target.value)}
                  className="text-xs pr-10 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                  tabIndex={-1}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Por motivos de segurança, a API Key completa é armazenada de forma protegida e nunca
                será exposta novamente na tela.
              </p>
            </div>

            {/* Dados extras opcionais (JSON) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Dados Extras / Parâmetros Adicionais (Opcional - JSON)
              </Label>
              <Textarea
                rows={2}
                placeholder='Ex: {"client_secret": "xyz", "merchant_id": "12345"}'
                value={credExtraConfig}
                onChange={(e) => setCredExtraConfig(e.target.value)}
                className="text-xs font-mono resize-none"
              />
              <p className="text-[10px] text-slate-400">
                Chaves adicionais requeridas pelo gateway (ex: merchant id ou token secundário).
              </p>
            </div>

            {/* Ativa / Inativa */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Credencial Ativa</p>
                <p className="text-[11px] text-slate-500">
                  Ao ativar, outras credenciais deste mesmo provedor serão desativadas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCredIsActive(!credIsActive)}
                className="focus:outline-hidden"
              >
                {credIsActive ? (
                  <ToggleRight className="w-7 h-7 text-emerald-600 cursor-pointer" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-slate-400 cursor-pointer" />
                )}
              </button>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCredModalOpen(false)}
                disabled={isSavingCred}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                disabled={isSavingCred}
              >
                {isSavingCred
                  ? 'Salvando...'
                  : editingCred
                    ? 'Salvar Alterações'
                    : 'Cadastrar Credencial'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: CONFIRMAR EXCLUSÃO DE CREDENCIAL (ADMIN) */}
      <Dialog open={!!credToDelete} onOpenChange={(open) => !open && setCredToDelete(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-2">
              <Trash2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-black text-slate-900">
              Excluir Credencial de Pagamento?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              Você está prestes a excluir a credencial <strong>"{credToDelete?.name}"</strong> (
              {credToDelete?.provider}). Se esta credencial estiver ativa, os pagamentos por este
              canal não serão mais processados e o sistema recorrerá ao ambiente ou à chave Pix
              direta.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeletingCred}
              onClick={() => setCredToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isDeletingCred}
              onClick={handleDeleteCredential}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {isDeletingCred ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: CRIAR OU EDITAR CONFIGURAÇÃO PIX (ADMIN) */}
      <Dialog open={isPixModalOpen} onOpenChange={setIsPixModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-1">
              <DollarSign className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-black text-slate-900">
              {editingPix
                ? 'Editar Chave Pix de Recebimento'
                : 'Cadastrar Chave Pix de Recebimento'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Configure a chave Pix que receberá o valor das assinaturas dos lojistas via padrão EMV
              oficial do Banco Central.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePixSetting} className="space-y-4 pt-2">
            {/* Tipo de chave */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Tipo da Chave Pix</Label>
              <Select value={pixKeyType} onValueChange={(val: PixKeyType) => setPixKeyType(val)}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Selecione o tipo da chave" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="cnpj">CNPJ</SelectItem>
                  <SelectItem value="telefone">Telefone (DDD + Número)</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="aleatoria">Chave Aleatória (EVP)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Chave Pix */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-700">
                  {editingPix
                    ? 'Nova Chave Pix (deixe em branco para manter a atual)'
                    : 'Chave Pix'}
                </Label>
                {editingPix?.pix_key_masked && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    Atual: {editingPix.pix_key_masked}
                  </span>
                )}
              </div>
              <div className="relative">
                <Input
                  type={showPixRawKey ? 'text' : 'password'}
                  required={!editingPix}
                  placeholder={
                    pixKeyType === 'cpf'
                      ? '000.000.000-00'
                      : pixKeyType === 'cnpj'
                        ? '00.000.000/0001-00'
                        : pixKeyType === 'telefone'
                          ? '(11) 99999-9999'
                          : pixKeyType === 'email'
                            ? 'pagamentos@seusite.com'
                            : 'Cole a chave aleatória'
                  }
                  value={pixKeyInput}
                  onChange={(e) => setPixKeyInput(e.target.value)}
                  className="text-xs pr-10 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPixRawKey(!showPixRawKey)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                  tabIndex={-1}
                >
                  {showPixRawKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                A chave bruta fica armazenada de forma segura no backend e nunca será enviada para o
                navegador do lojista.
              </p>
            </div>

            {/* Nome do recebedor (max 25 chars) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-700">
                  Nome do Titular / Recebedor
                </Label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {pixReceiverName.length}/25 caracteres
                </span>
              </div>
              <Input
                required
                maxLength={25}
                placeholder="Ex: FIDELIZA SISTEMAS"
                value={pixReceiverName}
                onChange={(e) => setPixReceiverName(e.target.value)}
                className="text-xs"
              />
              <p className="text-[10px] text-slate-400">
                Padrão Banco Central: máximo de 25 caracteres (sem acentos especiais).
              </p>
            </div>

            {/* Cidade do recebedor (max 15 chars) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-700">Cidade do Recebedor</Label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {pixReceiverCity.length}/15 caracteres
                </span>
              </div>
              <Input
                required
                maxLength={15}
                placeholder="Ex: SAO PAULO"
                value={pixReceiverCity}
                onChange={(e) => setPixReceiverCity(e.target.value)}
                className="text-xs"
              />
              <p className="text-[10px] text-slate-400">
                Padrão Banco Central: máximo de 15 caracteres.
              </p>
            </div>

            {/* Ativa / Inativa */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Chave Ativa para Recebimento</p>
                <p className="text-[11px] text-slate-500">
                  Ao ativar, as demais chaves Pix serão colocadas como inativas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPixIsActive(!pixIsActive)}
                className="focus:outline-hidden"
              >
                {pixIsActive ? (
                  <ToggleRight className="w-7 h-7 text-indigo-600 cursor-pointer" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-slate-400 cursor-pointer" />
                )}
              </button>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPixModalOpen(false)}
                disabled={isSavingPix}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                disabled={isSavingPix}
              >
                {isSavingPix
                  ? 'Salvando...'
                  : editingPix
                    ? 'Salvar Alterações'
                    : 'Cadastrar Chave Pix'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: CONFIRMAR EXCLUSÃO DE CONFIGURAÇÃO PIX (ADMIN) */}
      <Dialog open={!!pixToDelete} onOpenChange={(open) => !open && setPixToDelete(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-2">
              <Trash2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-black text-slate-900">
              Excluir Chave Pix de Recebimento?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              Você está prestes a excluir a configuração Pix de{' '}
              <strong>"{pixToDelete?.receiver_name}"</strong>. Se esta for a chave ativa, o checkout
              deixará de oferecer a opção de PIX direto até que uma nova seja cadastrada.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeletingPix}
              onClick={() => setPixToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isDeletingPix}
              onClick={handleDeletePixSetting}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {isDeletingPix ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: DETALHES COMPLETOS DA LOJA E LOJISTA (EXCLUSIVO ADMIN) */}
      <Dialog
        open={!!storeToViewDetails}
        onOpenChange={(open) => !open && setStoreToViewDetails(null)}
      >
        <DialogContent className="max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-slate-900">
                  {storeToViewDetails?.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Categoria: {storeToViewDetails?.category} • Status:{' '}
                  {storeToViewDetails?.approval_status === 'approved'
                    ? 'Aprovada'
                    : storeToViewDetails?.approval_status === 'pending'
                      ? 'Pendente'
                      : 'Recusada'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            {/* Bloco: Dados do Lojista Proprietário */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <User className="w-4 h-4 text-purple-600" />
                <span>Dados do Lojista Proprietário (users)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">Nome</span>
                  <span className="font-bold text-slate-900">
                    {storeToViewDetails?.expand?.owner_id?.name || 'Não informado'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">E-mail</span>
                  <span className="font-mono text-slate-800 break-all">
                    {storeToViewDetails?.expand?.owner_id?.email || 'Não informado'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> Telefone do Lojista
                  </span>
                  <span className="font-bold text-slate-900">
                    {storeToViewDetails?.expand?.owner_id?.phone
                      ? formatPhoneNumber(storeToViewDetails.expand.owner_id.phone)
                      : 'Não cadastrado'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block flex items-center gap-1">
                    <FileText className="w-3 h-3 text-slate-400" /> Documento (CPF / CNPJ)
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {storeToViewDetails?.expand?.owner_id?.document
                      ? formatDocumentWithLabel(storeToViewDetails.expand.owner_id.document)
                      : 'Não cadastrado'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bloco: Dados da Loja Física */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Store className="w-4 h-4 text-emerald-600" />
                <span>Dados de Contato da Loja</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Telefone da Loja
                  </span>
                  <span className="text-slate-800">
                    {storeToViewDetails?.phone ? formatPhoneNumber(storeToViewDetails.phone) : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    WhatsApp da Loja
                  </span>
                  <span className="text-slate-800">{storeToViewDetails?.whatsapp || '-'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Endereço & Cidade
                  </span>
                  <span className="text-slate-800">
                    {storeToViewDetails?.address ? `${storeToViewDetails.address}, ` : ''}
                    {storeToViewDetails?.city || 'São Paulo - SP'}
                  </span>
                </div>
                {storeToViewDetails?.description && (
                  <div className="sm:col-span-2">
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      Descrição da Loja
                    </span>
                    <p className="text-slate-700 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                      {storeToViewDetails.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bloco: Assinatura */}
            <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-purple-900 block">
                  Plano Atual: {storeToViewDetails?.expand?.subscription_plan_id?.name || 'Padrão'}
                </span>
                <span className="text-[11px] text-purple-700">
                  Status: <strong>{storeToViewDetails?.subscription_status}</strong>
                  {storeToViewDetails?.subscription_expires_at &&
                    ` • Vence em: ${storeToViewDetails.subscription_expires_at}`}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (storeToViewDetails) {
                    const st = storeToViewDetails
                    setStoreToViewDetails(null)
                    openSubscriptionModal(st)
                  }
                }}
                className="text-xs h-7 border-purple-300 text-purple-700 hover:bg-purple-100 font-semibold"
              >
                Gerenciar Assinatura
              </Button>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStoreToViewDetails(null)}
            >
              Fechar
            </Button>
          </DialogFooter>
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

          {/* Dados do lojista proprietário exibidos no topo do modal para conferência do admin */}
          {isAdmin && storeToEditSub?.expand?.owner_id && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-600" />
                Lojista: {storeToEditSub.expand.owner_id.name || 'Nome não informado'}
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-0.5">
                <div>
                  <span className="text-slate-400 block text-[10px]">Telefone</span>
                  <span className="font-semibold text-slate-800">
                    {storeToEditSub.expand.owner_id.phone
                      ? formatPhoneNumber(storeToEditSub.expand.owner_id.phone)
                      : 'Não cadastrado'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">CPF / CNPJ</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {storeToEditSub.expand.owner_id.document
                      ? formatDocumentWithLabel(storeToEditSub.expand.owner_id.document)
                      : 'Não cadastrado'}
                  </span>
                </div>
              </div>
            </div>
          )}

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
                onValueChange={(val) => handleStatusChoiceChange(val as SubscriptionStatus)}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Em Período de Teste (Trial)</SelectItem>
                  <SelectItem value="pending">Aguardando Confirmação (PIX enviado)</SelectItem>
                  <SelectItem value="active">Pago / Assinatura Ativa</SelectItem>
                  <SelectItem value="overdue">Em Atraso</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* SELEÇÃO DO TIPO DE SUSPENSÃO (Em caso de inadimplência da loja) */}
            {(subStatusChoice === 'overdue' || subStatusChoice === 'cancelled') && (
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-slate-800 space-y-3">
                <div>
                  <Label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Tipo de Suspensão por Inadimplência
                  </Label>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-snug">
                    Selecione as restrições que serão aplicadas à loja enquanto estiver
                    inadimplente:
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={subSuspendPublic}
                      onChange={(e) => setSubSuspendPublic(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-amber-300 text-rose-600 focus:ring-rose-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900 block">
                        Suspensão no Portal Público
                      </span>
                      <span className="text-[11px] text-slate-600">
                        Oculta a loja da listagem e da busca pública para clientes no site.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={subSuspendMerchant}
                      onChange={(e) => setSubSuspendMerchant(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-amber-300 text-rose-600 focus:ring-rose-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900 block">
                        Suspensão nas funcionalidades do perfil do lojista
                      </span>
                      <span className="text-[11px] text-slate-600">
                        Bloqueia o PDV Caixa (registro de compras) e a alteração do plano de
                        fidelidade. O lojista ainda poderá acessar para pagar.
                      </span>
                    </div>
                  </label>
                </div>

                {!subSuspendPublic && !subSuspendMerchant && (
                  <p className="text-[10px] text-amber-700 italic">
                    Nenhuma suspensão selecionada: a loja continuará visível e operando, mas com
                    status de aviso de atraso.
                  </p>
                )}
              </div>
            )}

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

            {storeToEditSub?.subscription_status === 'pending' && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs space-y-2">
                <p className="font-bold">Aviso de Pagamento Simulado:</p>
                <p className="text-[11px] text-blue-800">
                  O lojista informou que realizou o pagamento da assinatura. Ao clicar no botão
                  abaixo, a assinatura será marcada como <strong>Ativo/Pago</strong> e a data de
                  vencimento avançará automaticamente com base no plano.
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApproveSubscriptionPayment}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Confirmar Recebimento e Ativar (+
                  {plans.find(
                    (p) => p.id === (subPlanChoice || storeToEditSub.subscription_plan_id),
                  )?.billing_interval_months || 1}{' '}
                  mês/meses)
                </Button>
              </div>
            )}

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

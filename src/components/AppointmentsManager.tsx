import React, { useEffect, useState, useMemo } from 'react'
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  Store,
  DollarSign,
  User,
  Phone,
  Filter,
  Check,
  X,
  Sparkles,
  QrCode,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import type { StoreRecord } from '@/types'
import type {
  AppointmentRecord,
  AppointmentStatus,
  BusinessHourRecord,
  ServiceOfferingRecord,
} from '@/types/appointments'
import {
  createServiceOffering,
  deleteServiceOffering,
  getApiErrorMessage,
  listBusinessHours,
  listServiceOfferings,
  listStoreAppointments,
  replaceBusinessHours,
  setAppointmentsEnabled,
  updateAppointmentStatus,
  updateServiceOffering,
} from '@/services/appointmentsService'
import { AppointmentDepositConfigCard } from '@/components/AppointmentDepositConfigCard'

const WEEKDAY_NAMES = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
]

interface AppointmentsManagerProps {
  store: StoreRecord
  isMerchantSuspended?: boolean
  onStoreUpdated?: (updated: StoreRecord) => void
}

interface PeriodDraft {
  weekday: number
  start_time: string
  end_time: string
}

export const AppointmentsManager: React.FC<AppointmentsManagerProps> = ({
  store,
  isMerchantSuspended,
  onStoreUpdated,
}) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(!!store.appointments_enabled)
  const [isTogglingEnabled, setIsTogglingEnabled] = useState(false)

  // Sub-tabs
  const [subTab, setSubTab] = useState<'schedule' | 'services' | 'hours'>('schedule')

  // Services
  const [services, setServices] = useState<ServiceOfferingRecord[]>([])
  const [isLoadingServices, setIsLoadingServices] = useState(false)
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<ServiceOfferingRecord | null>(null)
  const [serviceName, setServiceName] = useState('')
  const [serviceDuration, setServiceDuration] = useState('30')
  const [servicePrice, setServicePrice] = useState('')
  const [serviceActive, setServiceActive] = useState(true)
  const [isSavingService, setIsSavingService] = useState(false)

  // Business Hours
  const [hours, setHours] = useState<BusinessHourRecord[]>([])
  const [isLoadingHours, setIsLoadingHours] = useState(false)
  const [periodsDraft, setPeriodsDraft] = useState<PeriodDraft[]>([])
  const [isSavingHours, setIsSavingHours] = useState(false)

  // Appointments (Agenda)
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([])
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('')

  // Cancel dialog
  const [cancellingAppt, setCancellingAppt] = useState<AppointmentRecord | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // Sincroniza estado de enabled com a prop store
  useEffect(() => {
    setIsEnabled(!!store.appointments_enabled)
  }, [store.appointments_enabled])

  // Carrega tudo
  useEffect(() => {
    if (!store?.id) return
    loadServices()
    loadHours()
    loadAppointments()
  }, [store?.id])

  const loadServices = async () => {
    setIsLoadingServices(true)
    try {
      const data = await listServiceOfferings(store.id)
      setServices(data)
    } catch (err) {
      console.error('Erro ao carregar serviços:', err)
    } finally {
      setIsLoadingServices(false)
    }
  }

  const loadHours = async () => {
    setIsLoadingHours(true)
    try {
      const data = await listBusinessHours(store.id)
      setHours(data)
      setPeriodsDraft(
        data.map((h) => ({
          weekday: h.weekday,
          start_time: h.start_time,
          end_time: h.end_time,
        })),
      )
    } catch (err) {
      console.error('Erro ao carregar horários:', err)
    } finally {
      setIsLoadingHours(false)
    }
  }

  const loadAppointments = async () => {
    setIsLoadingAppointments(true)
    try {
      const data = await listStoreAppointments(store.id)
      setAppointments(data)
    } catch (err) {
      console.error('Erro ao carregar agendamentos:', err)
    } finally {
      setIsLoadingAppointments(false)
    }
  }

  // Toggle do módulo de agendamento na loja
  const handleToggleAppointments = async (checked: boolean) => {
    if (isMerchantSuspended) {
      toast({
        title: 'Ação bloqueada',
        description: 'Sua loja está suspensa. Efetue o pagamento para reativar os recursos.',
        variant: 'destructive',
      })
      return
    }

    setIsTogglingEnabled(true)
    try {
      const updated = await setAppointmentsEnabled(store, checked)
      setIsEnabled(checked)
      if (onStoreUpdated) onStoreUpdated(updated)
      toast({
        title: checked ? 'Agendamentos ativados!' : 'Agendamentos desativados',
        description: checked
          ? 'Agora os clientes podem agendar serviços oferecidos pela sua loja.'
          : 'Sua loja não está aceitando novos agendamentos no momento.',
      })
    } catch (err) {
      console.error('Erro ao atualizar agendamentos da loja:', err)
      toast({
        title: 'Erro ao salvar',
        description: getApiErrorMessage(err, 'Não foi possível alterar a opção de agendamento.'),
        variant: 'destructive',
      })
      setIsEnabled(!checked)
    } finally {
      setIsTogglingEnabled(false)
    }
  }

  // --- SERVIÇOS ---
  const handleOpenNewService = () => {
    setEditingService(null)
    setServiceName('')
    setServiceDuration('30')
    setServicePrice('')
    setServiceActive(true)
    setIsServiceModalOpen(true)
  }

  const handleOpenEditService = (srv: ServiceOfferingRecord) => {
    setEditingService(srv)
    setServiceName(srv.name)
    setServiceDuration(String(srv.duration_minutes || 30))
    setServicePrice(srv.price !== undefined && srv.price !== null ? String(srv.price) : '')
    setServiceActive(srv.active)
    setIsServiceModalOpen(true)
  }

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!serviceName.trim()) {
      toast({ title: 'Atenção', description: 'Informe o nome do serviço.', variant: 'destructive' })
      return
    }
    const duration = parseInt(serviceDuration, 10)
    if (isNaN(duration) || duration <= 0) {
      toast({
        title: 'Atenção',
        description: 'Duração em minutos inválida.',
        variant: 'destructive',
      })
      return
    }
    const priceNum = servicePrice ? parseFloat(servicePrice.replace(',', '.')) : undefined

    setIsSavingService(true)
    try {
      if (editingService) {
        await updateServiceOffering(editingService.id, {
          name: serviceName.trim(),
          duration_minutes: duration,
          price: priceNum,
          active: serviceActive,
        })
        toast({ title: 'Serviço atualizado com sucesso!' })
      } else {
        await createServiceOffering({
          store: store.id,
          name: serviceName.trim(),
          duration_minutes: duration,
          price: priceNum,
          active: serviceActive,
        })
        toast({ title: 'Serviço criado com sucesso!' })
      }
      setIsServiceModalOpen(false)
      loadServices()
    } catch (err) {
      console.error('Erro ao salvar serviço:', err)
      toast({
        title: 'Erro ao salvar',
        description: getApiErrorMessage(err, 'Não foi possível salvar o serviço.'),
        variant: 'destructive',
      })
    } finally {
      setIsSavingService(false)
    }
  }

  const handleDeleteService = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente remover o serviço "${name}"?`)) return
    try {
      await deleteServiceOffering(id)
      toast({ title: 'Serviço removido!' })
      loadServices()
    } catch (err) {
      console.error('Erro ao remover serviço:', err)
      toast({
        title: 'Erro ao excluir',
        description: getApiErrorMessage(err, 'Não foi possível remover o serviço.'),
        variant: 'destructive',
      })
    }
  }

  // --- HORÁRIOS DE ATENDIMENTO ---
  const handleAddPeriodDraft = () => {
    setPeriodsDraft((prev) => [
      ...prev,
      {
        weekday: 1, // Segunda
        start_time: '09:00',
        end_time: '18:00',
      },
    ])
  }

  const handleRemovePeriodDraft = (index: number) => {
    setPeriodsDraft((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpdatePeriodDraft = (
    index: number,
    field: keyof PeriodDraft,
    val: string | number,
  ) => {
    setPeriodsDraft((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item)),
    )
  }

  // Preenche padrão comercial comum (Segunda a Sexta 09h-18h, Sábado 09h-13h)
  const handleApplyCommercialTemplate = () => {
    const template: PeriodDraft[] = [
      { weekday: 1, start_time: '09:00', end_time: '18:00' },
      { weekday: 2, start_time: '09:00', end_time: '18:00' },
      { weekday: 3, start_time: '09:00', end_time: '18:00' },
      { weekday: 4, start_time: '09:00', end_time: '18:00' },
      { weekday: 5, start_time: '09:00', end_time: '18:00' },
      { weekday: 6, start_time: '09:00', end_time: '13:00' },
    ]
    setPeriodsDraft(template)
    toast({
      title: 'Modelo comercial aplicado',
      description: 'Lembre-se de clicar em "Salvar Horários" para confirmar.',
    })
  }

  const handleSaveHours = async () => {
    // Validação
    for (let i = 0; i < periodsDraft.length; i++) {
      const p = periodsDraft[i]
      if (!p.start_time || !p.end_time) {
        toast({
          title: 'Horário incompleto',
          description: `Preencha início e fim no período #${i + 1}.`,
          variant: 'destructive',
        })
        return
      }
      if (p.end_time <= p.start_time) {
        toast({
          title: 'Horário inválido',
          description: `No período #${i + 1} (${WEEKDAY_NAMES[p.weekday]}), o horário de término deve ser após o início.`,
          variant: 'destructive',
        })
        return
      }
    }

    setIsSavingHours(true)
    try {
      await replaceBusinessHours(store.id, periodsDraft)
      toast({
        title: 'Horários salvos com sucesso!',
        description: `${periodsDraft.length} período(s) configurado(s).`,
      })
      loadHours()
    } catch (err) {
      console.error('Erro ao salvar horários:', err)
      toast({
        title: 'Erro ao salvar horários',
        description: getApiErrorMessage(err, 'Falha ao salvar horários.'),
        variant: 'destructive',
      })
    } finally {
      setIsSavingHours(false)
    }
  }

  // --- AGENDA / STATUS ---
  const handleUpdateStatus = async (
    appt: AppointmentRecord,
    newStatus: AppointmentStatus,
    reason?: string,
  ) => {
    setIsUpdatingStatus(true)
    try {
      const res = await updateAppointmentStatus(appt.id, newStatus, reason)
      toast({
        title:
          newStatus === 'confirmed'
            ? 'Agendamento confirmado!'
            : newStatus === 'completed'
              ? 'Atendimento concluído!'
              : 'Agendamento cancelado',
        description:
          res.emailSent && newStatus === 'confirmed'
            ? 'Notificação enviada e e-mail de confirmação disparado ao cliente.'
            : res.message || 'Status atualizado.',
      })
      setCancellingAppt(null)
      setCancelReason('')
      loadAppointments()
    } catch (err) {
      console.error('Erro ao atualizar agendamento:', err)
      toast({
        title: 'Não foi possível alterar o status',
        description: getApiErrorMessage(err, 'Falha ao atualizar o agendamento.'),
        variant: 'destructive',
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Filtros da agenda
  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false
      if (dateFilter) {
        const apptDate = a.date.substring(0, 10)
        if (apptDate !== dateFilter) return false
      }
      return true
    })
  }, [appointments, statusFilter, dateFilter])

  // Contadores
  const pendingCount = useMemo(
    () => appointments.filter((a) => a.status === 'pending').length,
    [appointments],
  )

  const pendingDepositConfirmationCount = useMemo(
    () =>
      appointments.filter(
        (a) =>
          a.status === 'pending' &&
          a.deposit_required &&
          a.deposit_status === 'paid_pending_confirmation',
      ).length,
    [appointments],
  )
  const confirmedCount = useMemo(
    () => appointments.filter((a) => a.status === 'confirmed').length,
    [appointments],
  )

  const renderDepositBadge = (appt: AppointmentRecord) => {
    if (!appt.deposit_required) return null

    switch (appt.deposit_status) {
      case 'pending_payment':
        return (
          <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-bold gap-1 text-[11px]">
            <Clock className="w-3 h-3 text-amber-700" />
            Sinal: Aguardando Cliente Pagar (R$ {(appt.deposit_amount || 0).toFixed(2)})
          </Badge>
        )
      case 'paid_pending_confirmation':
        return (
          <Badge className="bg-blue-600 text-white font-bold gap-1 text-[11px] animate-pulse">
            <AlertTriangle className="w-3 h-3 text-amber-300" />
            Sinal Informado: Confirmar Recebimento (R$ {(appt.deposit_amount || 0).toFixed(2)})
          </Badge>
        )
      case 'confirmed':
        return (
          <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 font-bold gap-1 text-[11px]">
            <ShieldCheck className="w-3 h-3 text-emerald-700" />
            Sinal Pago e Confirmado (R$ {(appt.deposit_amount || 0).toFixed(2)})
          </Badge>
        )
      default:
        return null
    }
  }

  const renderStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-semibold gap-1">
            <Clock className="w-3 h-3" />
            Pendente
          </Badge>
        )
      case 'confirmed':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Confirmado
          </Badge>
        )
      case 'completed':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-semibold gap-1">
            <Check className="w-3 h-3" />
            Concluído
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-300 font-semibold gap-1">
            <XCircle className="w-3 h-3 text-slate-500" />
            Cancelado
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDisplayDate = (d: string) => {
    const raw = d.substring(0, 10)
    const [y, m, day] = raw.split('-')
    if (!y || !m || !day) return d
    return `${day}/${m}/${y}`
  }

  return (
    <div className="space-y-6">
      {/* Card de Configuração de Sinal e Chave Pix do Lojista */}
      <AppointmentDepositConfigCard
        store={store}
        isMerchantSuspended={isMerchantSuspended}
        onStoreUpdated={onStoreUpdated}
      />

      {/* Banner / Card de Ativação do Módulo */}
      <Card className="rounded-3xl border-slate-200 shadow-xs overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/50 border-b border-slate-100 pb-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black text-slate-900 tracking-tight">
                    Agendamento de Serviços
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Permita que seus clientes reservem horários para atendimentos, cortes, consultas
                    ou serviços diretamente pelo portal da loja.
                  </CardDescription>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white fideliza-panel-white p-3 rounded-2xl border border-slate-200/80 shadow-xs shrink-0">
              <div className="text-right">
                <span className="block text-xs font-bold text-slate-800">
                  {isEnabled ? 'Agendamentos Ativados' : 'Agendamentos Desativados'}
                </span>
                <span className="block text-[11px] text-slate-500">
                  {isEnabled ? 'Visível para os clientes' : 'Oculto no portal da loja'}
                </span>
              </div>
              <Switch
                checked={isEnabled}
                disabled={isTogglingEnabled || isMerchantSuspended}
                onCheckedChange={handleToggleAppointments}
                className="data-[state=checked]:bg-emerald-600"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-5 space-y-4">
          {!isEnabled && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <strong>O agendamento está desativado nesta loja.</strong> Ative a chave acima para
                que o botão "Agendar Serviço" apareça para os clientes no modal da sua loja. Você
                pode configurar seus serviços e horários antes de ativar.
              </div>
            </div>
          )}

          {/* Sub-navegação interna */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
            <Button
              variant={subTab === 'schedule' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSubTab('schedule')}
              className={
                subTab === 'schedule'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs gap-1.5'
                  : 'rounded-xl text-xs font-semibold gap-1.5 text-slate-700'
              }
            >
              <Calendar className="w-3.5 h-3.5" />
              Agenda / Agendamentos
              {pendingCount > 0 && (
                <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0 h-4 ml-1">
                  {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
                </Badge>
              )}
            </Button>

            <Button
              variant={subTab === 'services' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSubTab('services')}
              className={
                subTab === 'services'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs gap-1.5'
                  : 'rounded-xl text-xs font-semibold gap-1.5 text-slate-700'
              }
            >
              <Sparkles className="w-3.5 h-3.5" />
              Serviços Oferecidos ({services.length})
            </Button>

            <Button
              variant={subTab === 'hours' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSubTab('hours')}
              className={
                subTab === 'hours'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs gap-1.5'
                  : 'rounded-xl text-xs font-semibold gap-1.5 text-slate-700'
              }
            >
              <Clock className="w-3.5 h-3.5" />
              Dias e Horários de Atendimento ({hours.length})
            </Button>
          </div>

          {/* ======================================================== */}
          {/* SUB-ABA 1: AGENDA (LISTA DE AGENDAMENTOS) */}
          {/* ======================================================== */}
          {subTab === 'schedule' && (
            <div className="space-y-4">
              {/* Filtros da Agenda */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-xs font-bold text-slate-700">Filtrar por:</span>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px] h-8 text-xs bg-white fideliza-panel-white rounded-xl">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                      <SelectItem value="confirmed">Confirmados</SelectItem>
                      <SelectItem value="completed">Concluídos</SelectItem>
                      <SelectItem value="cancelled">Cancelados</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-[160px] h-8 text-xs bg-white fideliza-panel-white rounded-xl"
                  />

                  {(statusFilter !== 'all' || dateFilter) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setStatusFilter('all')
                        setDateFilter('')
                      }}
                      className="h-8 text-xs text-slate-500 hover:text-slate-800"
                    >
                      Limpar filtros
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{appointments.length}</span> total
                  {pendingCount > 0 && (
                    <span className="text-amber-700 font-bold">• {pendingCount} pendente(s)</span>
                  )}
                  {confirmedCount > 0 && (
                    <span className="text-emerald-700 font-bold">
                      • {confirmedCount} confirmado(s)
                    </span>
                  )}
                </div>
              </div>

              {/* Lista */}
              {isLoadingAppointments ? (
                <div className="p-12 text-center text-xs text-slate-500">
                  Carregando agendamentos...
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                  <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-800">Nenhum agendamento encontrado</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {statusFilter !== 'all' || dateFilter
                      ? 'Nenhum resultado para os filtros selecionados.'
                      : 'Quando seus clientes reservarem serviços, os agendamentos aparecerão aqui para você confirmar, concluir ou cancelar.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAppointments.map((appt) => {
                    return (
                      <div
                        key={appt.id}
                        className="bg-white fideliza-panel-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            {renderStatusBadge(appt.status)}
                            {renderDepositBadge(appt)}
                            <span className="text-sm font-black text-slate-900">
                              {appt.service_name || 'Serviço'}
                            </span>
                            {appt.price ? (
                              <Badge
                                variant="outline"
                                className="text-emerald-700 border-emerald-200 bg-emerald-50 text-[11px] font-bold"
                              >
                                Total: R$ {appt.price.toFixed(2)}
                              </Badge>
                            ) : null}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                            <span className="flex items-center gap-1.5 font-bold text-slate-800">
                              <Calendar className="w-3.5 h-3.5 text-blue-600" />
                              {formatDisplayDate(appt.date)}
                            </span>
                            <span className="flex items-center gap-1.5 font-bold text-slate-800">
                              <Clock className="w-3.5 h-3.5 text-blue-600" />
                              {appt.start_time} às {appt.end_time}
                            </span>
                            <span className="flex items-center gap-1.5 text-slate-700">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              {appt.customer_name || 'Cliente'}
                            </span>
                            {appt.customer_phone && (
                              <span className="flex items-center gap-1.5 text-slate-700">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                {appt.customer_phone}
                              </span>
                            )}
                          </div>

                          {appt.notes && (
                            <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-2 mt-1">
                              <strong>Observações do cliente:</strong> {appt.notes}
                            </p>
                          )}

                          {appt.status === 'cancelled' && appt.cancel_reason && (
                            <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2 mt-1">
                              <strong>Motivo do cancelamento:</strong> {appt.cancel_reason}
                            </p>
                          )}
                        </div>

                        {/* Ações */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-center">
                          {appt.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                disabled={isUpdatingStatus || isMerchantSuspended}
                                onClick={() => handleUpdateStatus(appt, 'confirmed')}
                                className={
                                  appt.deposit_required &&
                                  appt.deposit_status === 'paid_pending_confirmation'
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl gap-1 shadow-md ring-2 ring-emerald-400/50'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl gap-1'
                                }
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {appt.deposit_required
                                  ? 'Confirmar Sinal e Agendamento'
                                  : 'Confirmar'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isUpdatingStatus || isMerchantSuspended}
                                onClick={() => {
                                  setCancellingAppt(appt)
                                  setCancelReason('')
                                }}
                                className="border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs rounded-xl gap-1"
                              >
                                <X className="w-3.5 h-3.5" />
                                Recusar / Cancelar
                              </Button>
                            </>
                          )}

                          {appt.status === 'confirmed' && (
                            <>
                              <Button
                                size="sm"
                                disabled={isUpdatingStatus || isMerchantSuspended}
                                onClick={() => handleUpdateStatus(appt, 'completed')}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Concluir Atendimento
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isUpdatingStatus || isMerchantSuspended}
                                onClick={() => {
                                  setCancellingAppt(appt)
                                  setCancelReason('')
                                }}
                                className="border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl gap-1"
                              >
                                <X className="w-3.5 h-3.5" />
                                Cancelar
                              </Button>
                            </>
                          )}

                          {(appt.status === 'completed' || appt.status === 'cancelled') && (
                            <span className="text-[11px] text-slate-400 italic">
                              Agendamento finalizado
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* SUB-ABA 2: SERVIÇOS OFERECIDOS */}
          {/* ======================================================== */}
          {subTab === 'services' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Catálogo de Serviços</h4>
                  <p className="text-xs text-slate-500">
                    Defina o que sua loja oferece, o tempo de atendimento e o valor (opcional).
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleOpenNewService}
                  disabled={isMerchantSuspended}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Novo Serviço
                </Button>
              </div>

              {isLoadingServices ? (
                <div className="p-8 text-center text-xs text-slate-500">Carregando serviços...</div>
              ) : services.length === 0 ? (
                <div className="p-10 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-800">
                    Nenhum serviço cadastrado ainda
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Clique em "Novo Serviço" para cadastrar seu primeiro atendimento (ex.: Corte de
                    Cabelo, Manicure, Consulta, Banho e Tosa, etc).
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {services.map((srv) => (
                    <div
                      key={srv.id}
                      className="bg-white fideliza-panel-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="font-extrabold text-sm text-slate-900 leading-snug">
                            {srv.name}
                          </h5>
                          <Badge
                            className={
                              srv.active
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]'
                                : 'bg-slate-100 text-slate-600 border-slate-200 text-[10px]'
                            }
                          >
                            {srv.active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                          <span className="flex items-center gap-1 font-semibold">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            {srv.duration_minutes} min
                          </span>
                          {srv.price ? (
                            <span className="flex items-center gap-1 font-bold text-emerald-700">
                              <DollarSign className="w-3.5 h-3.5" />
                              R$ {srv.price.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-slate-400">Preço a combinar</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEditService(srv)}
                          className="h-7 text-xs text-slate-600 hover:text-blue-600"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteService(srv.id, srv.name)}
                          className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* SUB-ABA 3: HORÁRIOS DE ATENDIMENTO */}
          {/* ======================================================== */}
          {subTab === 'hours' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Dias e Períodos de Funcionamento
                  </h4>
                  <p className="text-xs text-slate-500">
                    Configure os dias da semana em que você atende e as faixas de horário (manhã,
                    tarde ou turno contínuo).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleApplyCommercialTemplate}
                    disabled={isSavingHours || isMerchantSuspended}
                    className="rounded-xl text-xs font-semibold text-slate-700"
                  >
                    Usar Modelo Comercial
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddPeriodDraft}
                    disabled={isSavingHours || isMerchantSuspended}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar Período
                  </Button>
                </div>
              </div>

              {isLoadingHours ? (
                <div className="p-8 text-center text-xs text-slate-500">Carregando horários...</div>
              ) : periodsDraft.length === 0 ? (
                <div className="p-10 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-800">
                    Nenhum período de atendimento configurado
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
                    Enquanto não houver horários cadastrados, nenhum horário ficará livre para os
                    clientes agendarem. Clique em "Adicionar Período" ou use o "Modelo Comercial".
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {periodsDraft.map((period, idx) => (
                    <div
                      key={idx}
                      className="bg-white fideliza-panel-white border border-slate-200 rounded-2xl p-3 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
                    >
                      <div className="flex flex-wrap items-center gap-2.5 flex-1">
                        <span className="text-xs font-bold text-slate-400 w-6">#{idx + 1}</span>

                        <div className="w-[170px]">
                          <Select
                            value={String(period.weekday)}
                            onValueChange={(val) =>
                              handleUpdatePeriodDraft(idx, 'weekday', parseInt(val, 10))
                            }
                          >
                            <SelectTrigger className="h-8 text-xs rounded-xl">
                              <SelectValue placeholder="Dia da semana" />
                            </SelectTrigger>
                            <SelectContent>
                              {WEEKDAY_NAMES.map((name, wIdx) => (
                                <SelectItem key={wIdx} value={String(wIdx)}>
                                  {name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">Início:</span>
                          <Input
                            type="time"
                            value={period.start_time}
                            onChange={(e) =>
                              handleUpdatePeriodDraft(idx, 'start_time', e.target.value)
                            }
                            className="w-[110px] h-8 text-xs rounded-xl font-mono"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">Fim:</span>
                          <Input
                            type="time"
                            value={period.end_time}
                            onChange={(e) =>
                              handleUpdatePeriodDraft(idx, 'end_time', e.target.value)
                            }
                            className="w-[110px] h-8 text-xs rounded-xl font-mono"
                          />
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemovePeriodDraft(idx)}
                        className="h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 self-end sm:self-center"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Remover
                      </Button>
                    </div>
                  ))}

                  <div className="pt-3 flex justify-end">
                    <Button
                      onClick={handleSaveHours}
                      disabled={isSavingHours || isMerchantSuspended}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs px-6"
                    >
                      {isSavingHours ? 'Salvando...' : 'Salvar Horários de Atendimento'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* DIALOG DE CRIAR/EDITAR SERVIÇO */}
      <Dialog open={isServiceModalOpen} onOpenChange={setIsServiceModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">
              {editingService ? 'Editar Serviço' : 'Novo Serviço'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Preencha os detalhes do atendimento oferecido aos clientes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveService} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Nome do Serviço *</Label>
              <Input
                placeholder="Ex.: Corte Masculino, Manicure, Banho e Tosa..."
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                className="rounded-xl text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Duração (minutos) *</Label>
                <Input
                  type="number"
                  min="10"
                  step="5"
                  value={serviceDuration}
                  onChange={(e) => setServiceDuration(e.target.value)}
                  className="rounded-xl text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Preço (R$) (opcional)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={servicePrice}
                  onChange={(e) => setServicePrice(e.target.value)}
                  className="rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="block text-xs font-bold text-slate-800">Serviço Ativo</span>
                <span className="block text-[11px] text-slate-500">
                  Aparece na lista de serviços disponíveis para agendamento
                </span>
              </div>
              <Switch checked={serviceActive} onCheckedChange={setServiceActive} />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsServiceModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSavingService}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs"
              >
                {isSavingService ? 'Salvando...' : 'Salvar Serviço'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG DE CANCELAMENTO COM MOTIVO */}
      <Dialog open={!!cancellingAppt} onOpenChange={(open) => !open && setCancellingAppt(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-900">
              Cancelar Agendamento
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Informe o motivo do cancelamento para o cliente. Ele receberá uma notificação in-app.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            {cancellingAppt && (
              <div className="bg-slate-50 p-3 rounded-xl text-xs border border-slate-200 space-y-1">
                <p>
                  <strong>Serviço:</strong> {cancellingAppt.service_name}
                </p>
                <p>
                  <strong>Cliente:</strong> {cancellingAppt.customer_name}
                </p>
                <p>
                  <strong>Data e Horário:</strong> {formatDisplayDate(cancellingAppt.date)} às{' '}
                  {cancellingAppt.start_time}
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Motivo do cancelamento (opcional):
              </Label>
              <Textarea
                placeholder="Ex.: Imprevisto na agenda, profissional ausente, horário esgotado..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="rounded-xl text-xs"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCancellingAppt(null)}
              className="rounded-xl text-xs"
            >
              Voltar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isUpdatingStatus}
              onClick={() =>
                cancellingAppt && handleUpdateStatus(cancellingAppt, 'cancelled', cancelReason)
              }
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs"
            >
              {isUpdatingStatus ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

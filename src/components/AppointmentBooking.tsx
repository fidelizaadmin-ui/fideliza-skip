import React, { useState, useEffect } from 'react'
import {
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  DollarSign,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import type { StoreRecord } from '@/types'
import type { BookedSlot, BusinessHourRecord, ServiceOfferingRecord } from '@/types/appointments'
import { buildUpcomingDates, computeFreeSlots, weekdayOf } from '@/lib/appointmentSlots'
import {
  bookAppointment,
  getApiErrorMessage,
  getBookedSlots,
  listBusinessHours,
  listServiceOfferings,
} from '@/services/appointmentsService'

const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTH_SHORT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

interface AppointmentBookingProps {
  store: StoreRecord
  onSuccess?: () => void
  onCancel?: () => void
}

export const AppointmentBooking: React.FC<AppointmentBookingProps> = ({
  store,
  onSuccess,
  onCancel,
}) => {
  // Steps: 'service' -> 'datetime' -> 'confirm' -> 'done'
  const [step, setStep] = useState<'service' | 'datetime' | 'confirm' | 'done'>('service')

  // Data
  const [services, setServices] = useState<ServiceOfferingRecord[]>([])
  const [hours, setHours] = useState<BusinessHourRecord[]>([])
  const [isLoadingInitial, setIsLoadingInitial] = useState(true)

  // Selection
  const [selectedService, setSelectedService] = useState<ServiceOfferingRecord | null>(null)
  const [upcomingDates, setUpcomingDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Carrega serviços e horários da loja
  useEffect(() => {
    if (!store?.id) return
    const init = async () => {
      setIsLoadingInitial(true)
      try {
        const [srvs, hrs] = await Promise.all([
          listServiceOfferings(store.id),
          listBusinessHours(store.id),
        ])
        setServices(srvs.filter((s) => s.active))
        setHours(hrs.filter((h) => h.active))

        const dates = buildUpcomingDates(14)
        setUpcomingDates(dates)
        if (dates.length > 0) {
          setSelectedDate(dates[0])
        }
      } catch (err) {
        console.error('Erro ao inicializar agendamento:', err)
        toast({
          title: 'Erro ao carregar serviços',
          description: 'Não foi possível carregar os serviços e horários desta loja.',
          variant: 'destructive',
        })
      } finally {
        setIsLoadingInitial(false)
      }
    }
    init()
  }, [store?.id])

  // Carrega ocupações da loja para a janela de datas selecionada
  const fetchAvailability = async () => {
    if (!store?.id || upcomingDates.length === 0) return
    setIsLoadingSlots(true)
    try {
      const from = upcomingDates[0]
      const to = upcomingDates[upcomingDates.length - 1]
      const booked = await getBookedSlots(store.id, from, to)
      setBookedSlots(booked)
    } catch (err) {
      console.warn('Erro ao carregar disponibilidade:', err)
    } finally {
      setIsLoadingSlots(false)
    }
  }

  useEffect(() => {
    if (step === 'datetime') {
      fetchAvailability()
    }
  }, [step, store?.id, upcomingDates])

  // Horários livres calculados para a data e serviço selecionados
  const freeSlots = React.useMemo(() => {
    if (!selectedDate || !selectedService) return []
    return computeFreeSlots({
      date: selectedDate,
      durationMinutes: selectedService.duration_minutes,
      hours,
      booked: bookedSlots,
    })
  }, [selectedDate, selectedService, hours, bookedSlots])

  // Handlers
  const handleSelectService = (srv: ServiceOfferingRecord) => {
    setSelectedService(srv)
    setSelectedTime('')
    setStep('datetime')
  }

  const handleSelectTime = (t: string) => {
    setSelectedTime(t)
    setStep('confirm')
  }

  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return

    setIsSubmitting(true)
    try {
      await bookAppointment({
        store_id: store.id,
        service_id: selectedService.id,
        date: selectedDate,
        start_time: selectedTime,
        notes: notes.trim(),
      })

      setStep('done')
      toast({
        title: 'Agendamento solicitado com sucesso!',
        description: 'Aguarde a confirmação da loja. Acompanhe em Meus Agendamentos.',
      })
      if (onSuccess) {
        // Deixa a mensagem de sucesso na tela e depois fecha
        setTimeout(onSuccess, 1800)
      }
    } catch (err) {
      console.error('Erro ao agendar:', err)
      const msg = getApiErrorMessage(
        err,
        'Não foi possível concluir o agendamento. Tente outro horário.',
      )
      toast({
        title: 'Horário indisponível',
        description: msg,
        variant: 'destructive',
      })
      // Recarrega grade e volta para a seleção de horário se conflitou
      fetchAvailability()
      setSelectedTime('')
      setStep('datetime')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDateDisplay = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-')
    const w = weekdayOf(dateStr)
    const mNum = parseInt(m, 10) - 1
    return {
      weekday: WEEKDAY_SHORT[w],
      day: d,
      month: MONTH_SHORT[mNum],
      full: `${d}/${m}/${y}`,
    }
  }

  if (isLoadingInitial) {
    return (
      <div className="p-8 text-center space-y-2">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
        <p className="text-xs text-slate-500">Carregando serviços disponíveis...</p>
      </div>
    )
  }

  if (services.length === 0) {
    return (
      <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
        <p className="text-sm font-bold text-slate-800">Nenhum serviço disponível no momento</p>
        <p className="text-xs text-slate-500">
          Esta loja ativou o agendamento, mas ainda não cadastrou serviços ativos.
        </p>
        {onCancel && (
          <Button
            size="sm"
            variant="outline"
            onClick={onCancel}
            className="mt-2 text-xs rounded-xl"
          >
            Voltar
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* HEADER / BREADCRUMB */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {step !== 'service' && step !== 'done' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (step === 'confirm') setStep('datetime')
                else if (step === 'datetime') setStep('service')
              }}
              className="h-7 w-7 p-0 rounded-lg text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div>
            <h4 className="text-sm font-black text-slate-900">
              {step === 'service' && '1. Escolha o Serviço'}
              {step === 'datetime' && '2. Escolha a Data e o Horário'}
              {step === 'confirm' && '3. Confirmar Agendamento'}
              {step === 'done' && 'Agendamento Confirmado!'}
            </h4>
            <p className="text-[11px] text-slate-500">
              {step === 'service' && `Serviços oferecidos por ${store.name}`}
              {step === 'datetime' &&
                `${selectedService?.name} • ${selectedService?.duration_minutes} min`}
              {step === 'confirm' && 'Revise os dados antes de solicitar a reserva'}
              {step === 'done' && 'Sua solicitação foi enviada para o lojista'}
            </p>
          </div>
        </div>

        {onCancel && step !== 'done' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-slate-700 h-7"
          >
            Fechar
          </Button>
        )}
      </div>

      {/* ======================================================== */}
      {/* PASSO 1: ESCOLHER SERVIÇO */}
      {/* ======================================================== */}
      {step === 'service' && (
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {services.map((srv) => (
            <button
              key={srv.id}
              type="button"
              onClick={() => handleSelectService(srv)}
              className="w-full text-left bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-2xl p-3.5 transition-all shadow-xs flex items-center justify-between gap-3 group"
            >
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-900 group-hover:text-blue-900">
                    {srv.name}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    {srv.duration_minutes} min
                  </span>
                  {srv.price ? (
                    <span className="flex items-center gap-1 font-bold text-emerald-700">
                      <DollarSign className="w-3.5 h-3.5" />
                      R$ {srv.price.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-slate-400">Preço sob consulta</span>
                  )}
                </div>
              </div>

              <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center text-slate-400 transition-colors shrink-0">
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* PASSO 2: ESCOLHER DATA E HORÁRIO */}
      {/* ======================================================== */}
      {step === 'datetime' && (
        <div className="space-y-4">
          {/* Carrossel de datas */}
          <div>
            <Label className="text-xs font-bold text-slate-700 mb-2 block">Selecione o Dia:</Label>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
              {upcomingDates.map((dateStr) => {
                const info = formatDateDisplay(dateStr)
                const isSelected = selectedDate === dateStr
                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => {
                      setSelectedDate(dateStr)
                      setSelectedTime('')
                    }}
                    className={`flex flex-col items-center justify-center min-w-[62px] py-2 px-1.5 rounded-2xl border transition-all text-xs shrink-0 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isSelected ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      {info.weekday}
                    </span>
                    <span className="text-base font-black my-0.5">{info.day}</span>
                    <span
                      className={`text-[10px] font-medium ${
                        isSelected ? 'text-blue-100' : 'text-slate-500'
                      }`}
                    >
                      {info.month}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Grade de horários livres */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-bold text-slate-700">
                Horários Disponíveis ({selectedDate ? formatDateDisplay(selectedDate).full : ''}):
              </Label>
              {isLoadingSlots && (
                <span className="text-[11px] text-blue-600 flex items-center gap-1 font-semibold">
                  <Loader2 className="w-3 h-3 animate-spin" /> Atualizando...
                </span>
              )}
            </div>

            {isLoadingSlots ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Buscando horários disponíveis...
              </div>
            ) : freeSlots.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-1">
                <Clock className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Nenhum horário livre nesta data</p>
                <p className="text-[11px] text-slate-400">
                  A loja pode estar fechada neste dia ou todos os horários já foram reservados.
                  Escolha outra data acima.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[220px] overflow-y-auto pr-1">
                {freeSlots.map((slot) => {
                  const isSelected = selectedTime === slot
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => handleSelectTime(slot)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold font-mono transition-all border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white hover:bg-blue-50 text-slate-800 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      {slot}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PASSO 3: CONFIRMAR E ADICIONAR NOTAS */}
      {/* ======================================================== */}
      {step === 'confirm' && selectedService && selectedDate && selectedTime && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/40 border border-blue-200 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                Resumo da Reserva
              </span>
              <Badge className="bg-blue-600 text-white text-[10px]">
                {selectedService.duration_minutes} minutos
              </Badge>
            </div>

            <div className="space-y-1">
              <h5 className="text-base font-black text-slate-900">{selectedService.name}</h5>
              <p className="text-xs text-slate-600">
                Loja: <strong>{store.name}</strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-200/60 text-xs">
              <div>
                <span className="block text-slate-500 text-[11px]">Data:</span>
                <span className="font-bold text-slate-900">
                  {formatDateDisplay(selectedDate).full} ({formatDateDisplay(selectedDate).weekday})
                </span>
              </div>
              <div>
                <span className="block text-slate-500 text-[11px]">Horário:</span>
                <span className="font-bold text-blue-700 font-mono text-sm">{selectedTime}</span>
              </div>
            </div>

            {selectedService.price ? (
              <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Valor estimado:</span>
                <span className="font-black text-emerald-700 text-sm">
                  R$ {selectedService.price.toFixed(2)}
                </span>
              </div>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">
              Observações para o lojista (opcional):
            </Label>
            <Textarea
              placeholder="Ex.: Primeira vez, preferência de profissional, detalhes específicos..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-xl text-xs"
              rows={2}
              maxLength={500}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStep('datetime')}
              disabled={isSubmitting}
              className="rounded-xl text-xs"
            >
              Alterar Horário
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmBooking}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs px-5 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Reservando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Confirmar Reserva
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PASSO 4: CONCLUÍDO */}
      {/* ======================================================== */}
      {step === 'done' && (
        <div className="p-8 text-center space-y-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h5 className="text-base font-black text-emerald-900">Solicitação Enviada!</h5>
            <p className="text-xs text-emerald-700 mt-1 max-w-sm mx-auto leading-relaxed">
              O lojista foi avisado da sua solicitação para <strong>{selectedService?.name}</strong>{' '}
              em{' '}
              <strong>
                {selectedDate ? formatDateDisplay(selectedDate).full : ''} às {selectedTime}
              </strong>
              . Você receberá uma notificação assim que for confirmado.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

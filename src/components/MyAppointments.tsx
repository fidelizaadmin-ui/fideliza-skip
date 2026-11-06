import React, { useState, useEffect, useMemo } from 'react'
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  XCircle,
  Store,
  DollarSign,
  AlertCircle,
  X,
  Sparkles,
  Info,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import type { AppointmentRecord, AppointmentStatus } from '@/types/appointments'
import {
  getApiErrorMessage,
  listMyAppointments,
  updateAppointmentStatus,
} from '@/services/appointmentsService'

export const MyAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [cancellingAppt, setCancellingAppt] = useState<AppointmentRecord | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)

  const loadAppointments = async () => {
    setIsLoading(true)
    try {
      const data = await listMyAppointments()
      setAppointments(data)
    } catch (err) {
      console.error('Erro ao buscar meus agendamentos:', err)
      toast({
        title: 'Erro ao carregar agendamentos',
        description: 'Não foi possível carregar sua lista de agendamentos.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAppointments()
  }, [])

  const handleCancelAppointment = async () => {
    if (!cancellingAppt) return

    setIsCancelling(true)
    try {
      await updateAppointmentStatus(cancellingAppt.id, 'cancelled', cancelReason)
      toast({
        title: 'Agendamento cancelado',
        description: 'Seu agendamento foi cancelado com sucesso.',
      })
      setCancellingAppt(null)
      setCancelReason('')
      loadAppointments()
    } catch (err) {
      console.error('Erro ao cancelar agendamento:', err)
      toast({
        title: 'Erro ao cancelar',
        description: getApiErrorMessage(err, 'Não foi possível cancelar o agendamento.'),
        variant: 'destructive',
      })
    } finally {
      setIsCancelling(false)
    }
  }

  const formatDisplayDate = (d: string) => {
    const raw = d.substring(0, 10)
    const [y, m, day] = raw.split('-')
    if (!y || !m || !day) return d
    return `${day}/${m}/${y}`
  }

  const renderStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-semibold gap-1">
            <Clock className="w-3 h-3" />
            Aguardando confirmação
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
            <CheckCircle2 className="w-3 h-3" />
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

  // Agendamentos ativos (pendentes ou confirmados no futuro/hoje)
  const activeCount = useMemo(
    () => appointments.filter((a) => a.status === 'pending' || a.status === 'confirmed').length,
    [appointments],
  )

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-slate-200 shadow-xs overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/50 border-b border-slate-100 pb-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black text-slate-900 tracking-tight">
                    Meus Agendamentos
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Acompanhe suas reservas de serviços nas lojas parceiras do Fideliza.
                  </CardDescription>
                </div>
              </div>
            </div>

            {activeCount > 0 && (
              <Badge className="bg-blue-600 text-white font-bold text-xs px-3 py-1 rounded-xl shadow-xs">
                {activeCount} agendamento{activeCount > 1 ? 's' : ''} ativo
                {activeCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-4">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Carregando seus agendamentos...
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-200 rounded-3xl bg-slate-50/50 space-y-2">
              <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-800">
                Você ainda não fez nenhum agendamento
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Explore as lojas do portal que oferecem agendamento de serviços, escolha o dia e o
                melhor horário para você.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((appt) => {
                const storeName = appt.expand?.store?.name || 'Loja parceira'
                const canCancel = appt.status === 'pending' || appt.status === 'confirmed'

                return (
                  <div
                    key={appt.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {renderStatusBadge(appt.status)}
                        <span className="text-sm font-black text-slate-900">
                          {appt.service_name || 'Serviço'}
                        </span>
                        {appt.price ? (
                          <Badge
                            variant="outline"
                            className="text-emerald-700 border-emerald-200 bg-emerald-50 text-[11px] font-bold"
                          >
                            R$ {appt.price.toFixed(2)}
                          </Badge>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Store className="w-3.5 h-3.5 text-blue-600" />
                          {storeName}
                        </span>
                        <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                          <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                          {formatDisplayDate(appt.date)}
                        </span>
                        <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          {appt.start_time} às {appt.end_time}
                        </span>
                      </div>

                      {appt.notes && (
                        <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-2 mt-1">
                          <strong>Suas observações:</strong> {appt.notes}
                        </p>
                      )}

                      {appt.status === 'cancelled' && appt.cancel_reason && (
                        <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2 mt-1">
                          <strong>Motivo do cancelamento:</strong> {appt.cancel_reason}
                        </p>
                      )}

                      {appt.status === 'pending' && (
                        <p className="text-[11px] text-amber-700 flex items-center gap-1 mt-1">
                          <Info className="w-3 h-3 shrink-0" />
                          Aguardando a loja confirmar seu agendamento. Você receberá um aviso assim
                          que for aprovado.
                        </p>
                      )}
                    </div>

                    {/* Ação de Cancelamento pelo cliente */}
                    {canCancel && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCancellingAppt(appt)
                          setCancelReason('')
                        }}
                        className="border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs rounded-xl gap-1 shrink-0 self-end md:self-center"
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancelar Agendamento
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* DIALOG DE CONFIRMAÇÃO DE CANCELAMENTO PELO CLIENTE */}
      <Dialog open={!!cancellingAppt} onOpenChange={(open) => !open && setCancellingAppt(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-slate-900">
              Cancelar meu Agendamento
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Tem certeza que deseja cancelar esta reserva? O horário será liberado para outros
              clientes da loja.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            {cancellingAppt && (
              <div className="bg-slate-50 p-3 rounded-xl text-xs border border-slate-200 space-y-1">
                <p>
                  <strong>Serviço:</strong> {cancellingAppt.service_name}
                </p>
                <p>
                  <strong>Loja:</strong> {cancellingAppt.expand?.store?.name || 'Loja'}
                </p>
                <p>
                  <strong>Data:</strong> {formatDisplayDate(cancellingAppt.date)} às{' '}
                  {cancellingAppt.start_time}
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Motivo do cancelamento (opcional):
              </Label>
              <Textarea
                placeholder="Ex.: Imprevisto pessoal, mudança de horário..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="rounded-xl text-xs"
                rows={2}
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
              disabled={isCancelling}
              onClick={handleCancelAppointment}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs"
            >
              {isCancelling ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

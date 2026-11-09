import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  Copy,
  Check,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  User,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import type { AppointmentPixPayloadData } from '@/types/appointments'
import { markDepositPaid } from '@/services/appointmentsService'

interface AppointmentDepositPaymentViewProps {
  appointmentId: string
  pix: AppointmentPixPayloadData
  serviceName: string
  servicePrice?: number
  dateDisplay: string
  timeDisplay: string
  storeName: string
  onPaymentReported?: () => void
}

export const AppointmentDepositPaymentView: React.FC<AppointmentDepositPaymentViewProps> = ({
  appointmentId,
  pix,
  serviceName,
  servicePrice,
  dateDisplay,
  timeDisplay,
  storeName,
  onPaymentReported,
}) => {
  const [copied, setCopied] = useState(false)
  const [isMarking, setIsMarking] = useState(false)
  const [markedDone, setMarkedDone] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pix.pix_payload)
      setCopied(true)
      toast({
        title: 'Código Pix copiado!',
        description: 'Abra o app do seu banco e cole no Pix Copia e Cola.',
      })
      setTimeout(() => setCopied(false), 3000)
    } catch (_) {
      toast({
        title: 'Não foi possível copiar automaticamente',
        description: 'Selecione o código Pix e copie manualmente.',
      })
    }
  }

  const handleConfirmPaid = async () => {
    setIsMarking(true)
    try {
      await markDepositPaid(appointmentId)
      setMarkedDone(true)
      toast({
        title: 'Pagamento informado!',
        description:
          'O lojista irá conferir o recebimento do sinal na conta e confirmar seu agendamento.',
      })
      if (onPaymentReported) onPaymentReported()
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Erro ao informar pagamento do sinal.'
      toast({
        title: 'Atenção',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setIsMarking(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho de Sinal */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
            Sinal de Reserva Requerido ({pix.deposit_percent}%)
          </span>
          <span className="text-base font-black text-emerald-900">R$ {pix.amount.toFixed(2)}</span>
        </div>

        <p className="text-xs text-emerald-900 leading-relaxed">
          Para garantir seu horário para <strong>{serviceName}</strong> em{' '}
          <strong>
            {dateDisplay} às {timeDisplay}
          </strong>{' '}
          na loja <strong>{storeName}</strong>, pague o sinal de{' '}
          <strong>R$ {pix.amount.toFixed(2)}</strong> via Pix.
          {servicePrice ? (
            <span className="block text-[11px] text-emerald-700 mt-1">
              O valor restante de R$ {(servicePrice - pix.amount).toFixed(2)} será pago diretamente
              no local no dia do atendimento.
            </span>
          ) : null}
        </p>
      </div>

      {/* QR Code */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col items-center justify-center text-center shadow-2xs">
        <div className="p-2.5 bg-white rounded-2xl shadow-xs border border-slate-100">
          <QRCodeSVG value={pix.pix_payload} size={180} level="M" includeMargin={true} />
        </div>
        <p className="text-xs font-bold text-slate-800 mt-2.5">
          Aponte a câmera do seu banco para o QR Code
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-600">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3 text-slate-400" />
            Recebedor: <strong>{pix.receiver_name}</strong>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Building2 className="w-3 h-3 text-slate-400" />
            Cidade: <strong>{pix.receiver_city}</strong>
          </span>
        </div>

        {pix.txid && (
          <span className="text-[10px] font-mono text-slate-400 mt-1">
            Identificador: {pix.txid}
          </span>
        )}
      </div>

      {/* Pix Copia e Cola */}
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-slate-800 flex items-center justify-between">
          <span>PIX Copia e Cola Oficial</span>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
            Banco Central (EMV)
          </span>
        </Label>

        <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs break-all select-all leading-relaxed max-h-24 overflow-y-auto border border-slate-800">
          {pix.pix_payload}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="w-full h-10 text-xs font-bold rounded-xl gap-2 border-emerald-200 text-emerald-800 hover:bg-emerald-50"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Código Pix Copiado com Sucesso!' : 'Copiar Código Pix Copia e Cola'}
        </Button>
      </div>

      {/* Ação de confirmação */}
      {markedDone ? (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-900">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Pagamento informado com sucesso!
          </div>
          <p className="text-[11px] text-blue-700 leading-relaxed">
            Seu agendamento está reservado e aguardando a conferência do sinal pelo lojista. Você
            pode acompanhar o status na aba <strong>"Meus Agendamentos"</strong> do seu painel.
          </p>
        </div>
      ) : (
        <div className="space-y-2 pt-1">
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Importante:</strong> Após realizar a transferência Pix pelo app do seu banco,
              clique no botão abaixo para avisar o lojista.
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            disabled={isMarking}
            onClick={handleConfirmPaid}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-11 rounded-xl shadow-md gap-2"
          >
            {isMarking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Informando pagamento...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Já realizei o pagamento do sinal
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { checkInfinitePayPayment } from '@/services/fidelityService'
import type { PaymentCheckResponse } from '@/types'
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  RotateCw,
  Store,
  ShieldCheck,
} from 'lucide-react'

export default function PaymentReturnPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const orderNsu = searchParams.get('order_nsu') || ''
  const slug = searchParams.get('slug') || ''
  const captureMethod = searchParams.get('capture_method') || ''
  const receiptUrl = searchParams.get('receipt_url') || ''
  const transactionNsu = searchParams.get('transaction_nsu') || ''

  const [isLoading, setIsLoading] = useState(true)
  const [checkResult, setCheckResult] = useState<PaymentCheckResponse | null>(null)
  const [pollCount, setPollCount] = useState(0)

  // Realiza checagem ao carregar a página
  useEffect(() => {
    let isMounted = true

    const verifyStatus = async () => {
      if (!orderNsu && !slug && !transactionNsu) {
        setIsLoading(false)
        return
      }

      try {
        const res = await checkInfinitePayPayment({
          order_nsu: orderNsu || undefined,
          slug: slug || undefined,
          transaction_nsu: transactionNsu || undefined,
        })
        if (isMounted) {
          setCheckResult(res)
          setIsLoading(false)

          // Se ainda não estiver pago e realizamos poucos polls, tenta mais uma vez em 3 segundos
          if (!res.paid && pollCount < 2) {
            setTimeout(() => {
              if (isMounted) {
                setPollCount((p) => p + 1)
              }
            }, 3000)
          }
        }
      } catch (err) {
        console.error('Error verifying payment return:', err)
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    verifyStatus()

    return () => {
      isMounted = false
    }
  }, [orderNsu, slug, transactionNsu, pollCount])

  const isPaid = Boolean(checkResult?.paid)

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl flex-1 flex flex-col justify-center">
      <Card className="rounded-3xl border-slate-200 shadow-lg overflow-hidden">
        <div
          className={`h-3 w-full ${
            isPaid ? 'bg-emerald-500' : isLoading ? 'bg-purple-500 animate-pulse' : 'bg-blue-500'
          }`}
        />

        <CardHeader className="text-center pt-8 pb-4">
          <div className="mx-auto mb-4">
            {isPaid ? (
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
            ) : isLoading ? (
              <div className="w-16 h-16 rounded-3xl bg-purple-100 text-purple-600 flex items-center justify-center animate-spin">
                <RotateCw className="w-8 h-8" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-3xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Clock className="w-9 h-9" />
              </div>
            )}
          </div>

          <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">
            {isPaid
              ? 'Pagamento Confirmado com Sucesso!'
              : isLoading
                ? 'Verificando seu Pagamento...'
                : 'Aguardando Processamento do Pagamento'}
          </CardTitle>

          <CardDescription className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
            {isPaid
              ? 'Sua assinatura foi renovada e sua loja está 100% ativa no Fideliza!'
              : 'Recebemos o retorno da InfinitePay. Caso tenha acabado de pagar via PIX ou cartão, a confirmação pode levar alguns segundos para ser computada.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-2 pb-8">
          {/* Status Badge */}
          <div className="flex justify-center">
            <Badge
              className={`text-xs px-4 py-1.5 font-bold border-0 ${
                isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
              }`}
            >
              {isPaid ? 'Assinatura Ativa & Regularizada' : 'Processamento em Andamento'}
            </Badge>
          </div>

          {/* Details Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 font-semibold text-slate-700">
              <span>Identificador do Pedido:</span>
              <span className="font-mono text-slate-900 font-bold">{orderNsu || 'N/A'}</span>
            </div>

            {captureMethod && (
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 text-slate-600">
                <span>Forma de Pagamento:</span>
                <span className="font-bold text-slate-900 uppercase">
                  {captureMethod === 'pix'
                    ? 'PIX'
                    : captureMethod === 'credit_card'
                      ? 'Cartão de Crédito'
                      : captureMethod}
                </span>
              </div>
            )}

            {transactionNsu && (
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 text-slate-600">
                <span>NSU Transação:</span>
                <span className="font-mono text-slate-800">{transactionNsu}</span>
              </div>
            )}

            {receiptUrl && (
              <div className="flex items-center justify-between pt-1">
                <span>Comprovante InfinitePay:</span>
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-emerald-700 hover:text-emerald-800 underline inline-flex items-center gap-1"
                >
                  Visualizar Recibo
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Friendly informative tip */}
          {!isPaid && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                O webhook da InfinitePay sincroniza automaticamente sua assinatura em segundo plano.
                Ao retornar para o painel do lojista, o status será atualizado.
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              onClick={() => navigate('/lojista')}
              className="flex-1 py-6 rounded-2xl font-black text-sm bg-purple-600 hover:bg-purple-700 text-white shadow-md gap-2"
            >
              <Store className="w-4 h-4" />
              Voltar ao Painel do Lojista
              <ArrowRight className="w-4 h-4" />
            </Button>

            {!isPaid && (
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={() => {
                  setIsLoading(true)
                  setPollCount((p) => p + 1)
                }}
                className="py-6 rounded-2xl font-bold text-xs border-slate-300 gap-2"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Rechecar Status
              </Button>
            )}
          </div>

          <div className="text-center pt-2">
            <Link
              to="/"
              className="text-xs text-slate-400 hover:text-slate-600 inline-flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Fideliza • Programa de Fidelidade Inteligente
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { MailWarning, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const COOLDOWN_KEY = 'fideliza_verify_email_cooldown_until'
const COOLDOWN_SECONDS = 60

export const EmailVerificationBanner: React.FC = () => {
  const { user, isAuthenticated, requestVerificationEmail } = useAuth()
  const [cooldownLeft, setCooldownLeft] = useState<number>(0)
  const [isSending, setIsSending] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  )

  // Checa cooldown salvo no localStorage ao montar
  useEffect(() => {
    const checkCooldown = () => {
      const stored = localStorage.getItem(COOLDOWN_KEY)
      if (stored) {
        const until = parseInt(stored, 10)
        const diff = Math.ceil((until - Date.now()) / 1000)
        if (diff > 0) {
          setCooldownLeft(diff)
        } else {
          setCooldownLeft(0)
          localStorage.removeItem(COOLDOWN_KEY)
        }
      }
    }

    checkCooldown()
    const timer = setInterval(() => {
      setCooldownLeft((prev) => {
        if (prev <= 1) {
          localStorage.removeItem(COOLDOWN_KEY)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Se o usuário não está autenticado ou já está verificado, o banner não é exibido
  if (!isAuthenticated || !user || user.verified === true) {
    return null
  }

  const handleResend = async () => {
    if (cooldownLeft > 0 || isSending) return

    setIsSending(true)
    setFeedback(null)

    const result = await requestVerificationEmail(user.email)
    setIsSending(false)

    if (result.success) {
      setFeedback({
        type: 'success',
        message: 'E-mail de confirmação reenviado! Verifique sua caixa de entrada e spam.',
      })
      const cooldownUntil = Date.now() + COOLDOWN_SECONDS * 1000
      localStorage.setItem(COOLDOWN_KEY, cooldownUntil.toString())
      setCooldownLeft(COOLDOWN_SECONDS)
    } else {
      setFeedback({
        type: 'error',
        message:
          result.message || 'Não foi possível enviar o e-mail agora. Tente novamente mais tarde.',
      })
    }
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-amber-50 border-b border-amber-200/90 text-amber-950 px-4 py-2.5 sm:py-2 text-xs transition-all shadow-xs"
    >
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-700">
            <MailWarning className="w-3.5 h-3.5" />
          </div>
          <span className="font-medium text-amber-900 leading-snug">
            <strong>Confirme seu e-mail:</strong> Enviamos uma mensagem para{' '}
            <strong className="font-semibold text-amber-950 underline decoration-amber-300">
              {user.email}
            </strong>
            . Verifique sua caixa de entrada para ativar todas as funções.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isSending || cooldownLeft > 0}
            onClick={handleResend}
            className="h-7 px-3 text-xs font-semibold bg-white border-amber-300 hover:bg-amber-100 text-amber-900 rounded-lg shadow-2xs transition-colors"
          >
            {isSending ? (
              <>
                <RefreshCw className="w-3 h-3 mr-1.5 animate-spin text-amber-700" />
                Enviando...
              </>
            ) : cooldownLeft > 0 ? (
              <>
                <RefreshCw className="w-3 h-3 mr-1.5 text-amber-600" />
                Aguarde {cooldownLeft}s
              </>
            ) : (
              <>
                <RefreshCw className="w-3 h-3 mr-1.5 text-amber-700" />
                Reenviar e-mail
              </>
            )}
          </Button>
        </div>
      </div>

      {feedback && (
        <div className="container mx-auto mt-1.5 pt-1.5 border-t border-amber-200/60 flex items-center justify-center sm:justify-start gap-1.5 text-[11px]">
          {feedback.type === 'success' ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-emerald-800 font-medium">{feedback.message}</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span className="text-rose-800 font-medium">{feedback.message}</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}
export default EmailVerificationBanner

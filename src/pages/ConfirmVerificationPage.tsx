import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  MailCheck,
} from 'lucide-react'
import { Logo } from '@/components/Logo'

export default function ConfirmVerificationPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    let isMounted = true

    const verifyToken = async () => {
      if (!token) {
        setStatus('error')
        setErrorMessage('Nenhum código de verificação foi encontrado na URL.')
        return
      }

      try {
        await pb.collection('users').confirmVerification(token)
        if (!isMounted) return

        // Recarrega informações do usuário caso esteja logado
        await refreshUser()

        setStatus('success')
      } catch (err: any) {
        if (!isMounted) return
        console.error('Erro na confirmação de verificação:', err)
        setStatus('error')
        setErrorMessage(
          err?.message ||
            'O link de verificação é inválido ou já expirou. Solicite um novo reenvio caso precise.',
        )
      }
    }

    verifyToken()

    return () => {
      isMounted = false
    }
  }, [token])

  const handleGoToDashboard = () => {
    if (!user) {
      navigate('/login')
      return
    }
    if (user.role === 'admin' || user.role === 'collaborator') {
      navigate('/admin')
    } else if (user.role === 'merchant') {
      navigate('/lojista')
    } else {
      navigate('/cliente')
    }
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Logo variant="full" theme="light" size="lg" />
          </div>
        </div>

        <Card className="border-slate-200 shadow-xl shadow-slate-200/60 rounded-3xl text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-3 flex items-center justify-center">
              {status === 'verifying' && (
                <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center animate-pulse">
                  <Loader2 className="w-7 h-7 animate-spin text-rose-600" />
                </div>
              )}
              {status === 'success' && (
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              )}
              {status === 'error' && (
                <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8" />
                </div>
              )}
            </div>

            <CardTitle className="text-xl font-black text-slate-900">
              {status === 'verifying' && 'Confirmando seu e-mail...'}
              {status === 'success' && 'E-mail Confirmado!'}
              {status === 'error' && 'Falha na Confirmação'}
            </CardTitle>

            <CardDescription className="text-xs sm:text-sm text-slate-600">
              {status === 'verifying' &&
                'Aguarde um instante enquanto validamos seu cadastro no Fideliza.'}
              {status === 'success' &&
                'Sua conta foi validada com sucesso. Todos os benefícios de fidelidade e acesso estão ativos.'}
              {status === 'error' && errorMessage}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {status === 'success' && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs text-left flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-emerald-900">Conta verificada com segurança</p>
                  <p className="text-emerald-700 leading-relaxed">
                    Você já pode criar programas, resgatar recompensas e acumular selos normalmente.
                  </p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs text-left flex items-start gap-2.5">
                <MailCheck className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-rose-900">Como resolver?</p>
                  <p className="text-rose-700 leading-relaxed">
                    Você pode acessar o app normalmente. Se o banner de verificação continuar
                    aparecendo, use o botão <strong>Reenviar e-mail</strong> para receber um link
                    atualizado.
                  </p>
                </div>
              </div>
            )}

            <div className="pt-2">
              {status === 'success' ? (
                <Button
                  onClick={handleGoToDashboard}
                  className="w-full py-5 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md gap-1.5"
                >
                  {user ? 'Acessar Meu Painel' : 'Fazer Login'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : status === 'error' ? (
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => navigate('/login')}
                    className="w-full py-5 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md"
                  >
                    Ir para o Login
                  </Button>
                  <Link
                    to="/"
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium py-1"
                  >
                    Voltar para o Início
                  </Link>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

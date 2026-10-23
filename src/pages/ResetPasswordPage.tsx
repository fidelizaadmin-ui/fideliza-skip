import React, { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertCircle, Loader2, KeyRound, Eye, EyeOff, Lock } from 'lucide-react'
import { Logo } from '@/components/Logo'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!token) {
      setErrorMessage('Token de redefinição não encontrado ou link inválido.')
      return
    }

    if (password.length < 8) {
      setErrorMessage('A nova senha deve ter no mínimo 8 caracteres.')
      return
    }

    if (password !== passwordConfirm) {
      setErrorMessage('As duas senhas não coincidem. Digite novamente.')
      return
    }

    setIsLoading(true)

    try {
      await pb.collection('users').confirmPasswordReset(token, password, passwordConfirm)
      setIsSuccess(true)
    } catch (err: any) {
      console.error('Password reset confirmation error:', err)
      setErrorMessage(
        err?.message ||
          'Não foi possível redefinir sua senha. O link pode ter expirado ou já ter sido utilizado.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Logo variant="full" theme="light" size="lg" />
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Defina uma nova senha segura para a sua conta no Fideliza
          </p>
        </div>

        <Card className="border-slate-200 shadow-xl shadow-slate-200/60 rounded-3xl">
          <CardHeader className="pb-3 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center mx-auto mb-2">
              <KeyRound className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl font-black text-slate-900">
              {isSuccess ? 'Senha Redefinida!' : 'Nova Senha'}
            </CardTitle>
            <CardDescription className="text-xs text-slate-600">
              {isSuccess
                ? 'Sua senha foi atualizada com sucesso. Agora você já pode acessar com suas novas credenciais.'
                : 'Digite e confirme a nova senha que deseja usar no seu acesso.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-2">
            {isSuccess ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-emerald-950">Tudo pronto!</p>
                    <p className="text-emerald-800 mt-0.5">
                      Sua nova senha está ativa. Clique abaixo para fazer login.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => navigate('/login')}
                  className="w-full py-5 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md"
                >
                  Ir para a página de login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <Alert variant="destructive" className="text-xs py-2">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}

                {!token && (
                  <Alert variant="destructive" className="text-xs py-2">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                      Nenhum código de redefinição foi fornecido. Solicite novamente através do link
                      &quot;Esqueci a Senha&quot; na tela de login.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="new-pass" className="text-xs font-bold text-slate-700">
                    Nova Senha (mínimo 8 caracteres)
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-pass"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="rounded-xl border-slate-200 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-md"
                      title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-pass" className="text-xs font-bold text-slate-700">
                    Confirme a Nova Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-pass"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      placeholder="••••••••"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      className="rounded-xl border-slate-200"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !token}
                  className="w-full py-5 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Atualizando senha...
                    </>
                  ) : (
                    'Salvar Nova Senha'
                  )}
                </Button>

                <div className="text-center pt-2">
                  <Link
                    to="/login"
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium underline underline-offset-2"
                  >
                    Voltar para o login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

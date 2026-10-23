import React, { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Store,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Logo } from '@/components/Logo'

export default function Login() {
  const [searchParams] = useSearchParams()
  const initialRole = (searchParams.get('tipo') as UserRole) || 'customer'
  const [selectedRole, setSelectedRole] = useState<UserRole>(
    ['customer', 'merchant', 'admin'].includes(initialRole) ? initialRole : 'customer',
  )

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { login } = useAuth()
  const navigate = useNavigate()

  // Preset demo accounts helper
  const handleUseDemo = (demoRole: UserRole) => {
    setSelectedRole(demoRole)
    if (demoRole === 'admin') {
      setEmail('angelo.marcos_silva@hotmail.com')
      setPassword('Skip@Pass')
    } else if (demoRole === 'merchant') {
      setEmail('lojista@fideliza.com')
      setPassword('Skip@Pass')
    } else {
      setEmail('cliente@fideliza.com')
      setPassword('Skip@Pass')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setIsLoading(true)

    try {
      const user = await login(email, password)
      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/admin')
      } else if (user.role === 'merchant') {
        navigate('/lojista')
      } else {
        navigate('/cliente')
      }
    } catch (err: any) {
      console.error('Login error:', err)
      setErrorMsg(err?.message || 'E-mail ou senha inválidos. Verifique suas credenciais.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-3">
          <div className="p-4 rounded-3xl bg-[#0D2240] shadow-xl inline-block mx-auto border border-slate-800">
            <Logo variant="full" theme="dark" size="lg" />
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Selecione seu perfil e faça login com seu e-mail e senha
          </p>
        </div>

        <Card className="border-slate-200 shadow-xl shadow-slate-200/60 rounded-3xl">
          <CardHeader className="pb-3">
            <Tabs
              value={selectedRole}
              onValueChange={(val) => {
                setSelectedRole(val as UserRole)
                setErrorMsg(null)
              }}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 w-full bg-slate-100 p-1 rounded-xl">
                <TabsTrigger
                  value="customer"
                  className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-xs flex items-center gap-1"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Cliente
                </TabsTrigger>
                <TabsTrigger
                  value="merchant"
                  className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-xs flex items-center gap-1"
                >
                  <Store className="w-3.5 h-3.5" />
                  Lojista
                </TabsTrigger>
                <TabsTrigger
                  value="admin"
                  className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-xs flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admin
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="pt-2">
            {errorMsg && (
              <Alert variant="destructive" className="mb-4 text-xs py-2">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold text-slate-700">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl border-slate-200 focus-visible:ring-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pass" className="text-xs font-bold text-slate-700">
                    Senha
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    id="pass"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-xl border-slate-200 focus-visible:ring-rose-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-md transition-colors"
                    title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                    aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-5 rounded-xl font-black bg-[#0D2240] hover:bg-[#132c52] text-amber-400 hover:text-amber-300 shadow-md transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar como{' '}
                    {selectedRole === 'admin'
                      ? 'Administrador'
                      : selectedRole === 'merchant'
                        ? 'Lojista'
                        : 'Cliente'}
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </Button>
            </form>

            {/* Quick Demo Fill Buttons */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2">
                Acesso Rápido de Teste (Preenchimento Automático)
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleUseDemo('customer')}
                  className="p-1.5 text-[11px] rounded-lg bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 text-center transition-colors"
                >
                  Cliente Teste
                </button>
                <button
                  type="button"
                  onClick={() => handleUseDemo('merchant')}
                  className="p-1.5 text-[11px] rounded-lg bg-amber-50 text-amber-700 font-semibold hover:bg-amber-100 text-center transition-colors"
                >
                  Lojista Teste
                </button>
                <button
                  type="button"
                  onClick={() => handleUseDemo('admin')}
                  className="p-1.5 text-[11px] rounded-lg bg-purple-50 text-purple-700 font-semibold hover:bg-purple-100 text-center transition-colors"
                >
                  Admin Teste
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Link to Register */}
        <div className="text-center text-xs text-slate-600">
          Ainda não tem conta?{' '}
          <Link
            to={`/cadastro?tipo=${selectedRole}`}
            className="font-bold text-[#0D2240] hover:text-amber-600 underline underline-offset-2"
          >
            Cadastre-se como{' '}
            {selectedRole === 'admin'
              ? 'administrador'
              : selectedRole === 'merchant'
                ? 'lojista'
                : 'cliente'}
          </Link>
        </div>
      </div>
    </div>
  )
}

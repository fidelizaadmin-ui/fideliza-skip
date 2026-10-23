import React, { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Store,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Gift,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Logo } from '@/components/Logo'

export default function Register() {
  const [searchParams] = useSearchParams()
  const initialRole = (searchParams.get('tipo') as UserRole) || 'customer'
  const [selectedRole, setSelectedRole] = useState<UserRole>(
    ['customer', 'merchant', 'admin'].includes(initialRole) ? initialRole : 'customer',
  )

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [phone, setPhone] = useState('')
  const [adminToken, setAdminToken] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { register } = useAuth()
  const navigate = useNavigate()

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) {
      return digits.length > 0 ? `(${digits}` : ''
    }
    if (digits.length <= 7) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    }
    if (digits.length <= 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhone(formatted)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    const phoneDigits = phone.replace(/\D/g, '')
    if (!phoneDigits) {
      setErrorMsg('Informe seu telefone com WhatsApp.')
      return
    }

    if (phoneDigits.length < 10) {
      setErrorMsg('Informe um telefone válido com DDD (ex: (11) 98765-4321).')
      return
    }

    if (password.length < 8) {
      setErrorMsg('A senha precisa ter pelo menos 8 caracteres.')
      return
    }

    if (selectedRole === 'admin' && adminToken.trim() !== 'FIDELIZA_ADMIN_2026') {
      setErrorMsg(
        'Código de convite de administrador inválido. Use FIDELIZA_ADMIN_2026 ou entre com o admin já criado.',
      )
      return
    }

    setIsLoading(true)

    try {
      const { user } = await register({
        name,
        email,
        password,
        role: selectedRole,
        phone: phone.trim(),
      })

      if (user?.role === 'admin') {
        navigate('/admin')
      } else if (user?.role === 'merchant') {
        navigate('/lojista')
      } else {
        navigate('/cliente')
      }
    } catch (err: any) {
      console.error('Registration error:', err)
      setErrorMsg(
        err?.data?.data?.email?.message ||
          err?.message ||
          'Não foi possível criar sua conta. Verifique se o e-mail já não está cadastrado.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Logo variant="full" theme="light" size="lg" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Criar Nova Conta
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
              Junte-se ao Fideliza e comece a acumular ou criar seus programas
            </p>
          </div>
        </div>

        <Card className="border-slate-200/80 shadow-xl shadow-slate-200/50 rounded-3xl">
          <CardHeader className="pb-3">
            <Tabs
              value={selectedRole}
              onValueChange={(val) => {
                const nextRole = val as UserRole
                setSelectedRole(nextRole)
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
            {/* Context callout */}
            {selectedRole === 'customer' && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl flex items-center gap-2">
                <Gift className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>
                  Você receberá um <strong>Código Digital exclusivo</strong> para acumular selos,
                  pontos e cashback em todas as lojas parceiras.
                </span>
              </div>
            )}

            {selectedRole === 'merchant' && (
              <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-xl flex items-center gap-2">
                <Store className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  Cadastre sua loja, escolha seu plano de fidelidade (selos, pontos ou cashback) e
                  ganhe <strong>dias de teste grátis</strong>.
                </span>
              </div>
            )}

            {selectedRole === 'admin' && (
              <div className="mb-4 bg-purple-50 border border-purple-200 text-purple-800 text-xs p-3 rounded-xl flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-purple-600" />
                <span>
                  Acesso de gestão global para aprovar lojas, definir planos e acompanhar métricas.
                  (Código de convite: <code>FIDELIZA_ADMIN_2026</code>)
                </span>
              </div>
            )}

            {errorMsg && (
              <Alert variant="destructive" className="mb-4 text-xs py-2">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold text-slate-700">
                  {selectedRole === 'merchant' ? 'Nome do Responsável / Lojista' : 'Nome Completo'}
                </Label>
                <Input
                  id="name"
                  type="text"
                  required
                  placeholder={
                    selectedRole === 'merchant' ? 'Ex: Carlos Oliveira' : 'Ex: Juliana Silva'
                  }
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl border-slate-200 focus-visible:ring-rose-500"
                />
              </div>

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
                <Label htmlFor="phone" className="text-xs font-bold text-slate-700">
                  WhatsApp / Telefone *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  placeholder="(11) 98765-4321"
                  maxLength={15}
                  value={phone}
                  onChange={handlePhoneChange}
                  className="rounded-xl border-slate-200 focus-visible:ring-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pass" className="text-xs font-bold text-slate-700">
                  Senha (mínimo 8 caracteres)
                </Label>
                <div className="relative">
                  <Input
                    id="pass"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
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

              {selectedRole === 'admin' && (
                <div className="space-y-1.5">
                  <Label htmlFor="token" className="text-xs font-bold text-purple-700">
                    Código de Convite de Administrador
                  </Label>
                  <Input
                    id="token"
                    type="text"
                    required
                    placeholder="FIDELIZA_ADMIN_2026"
                    value={adminToken}
                    onChange={(e) => setAdminToken(e.target.value)}
                    className="rounded-xl border-purple-200 focus-visible:ring-purple-500 font-mono text-xs"
                  />
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-5 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Finalizar Cadastro como{' '}
                    {selectedRole === 'admin'
                      ? 'Admin'
                      : selectedRole === 'merchant'
                        ? 'Lojista'
                        : 'Cliente'}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Link to Login */}
        <div className="text-center text-xs text-slate-600">
          Já tem uma conta?{' '}
          <Link
            to={`/login?tipo=${selectedRole}`}
            className="font-bold text-rose-600 hover:text-rose-700 underline underline-offset-2"
          >
            Faça login aqui
          </Link>
        </div>
      </div>
    </div>
  )
}

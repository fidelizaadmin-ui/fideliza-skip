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
  Sparkles,
  Store,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Gift,
  FileText,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  cleanDocument,
  formatCPF,
  formatCNPJ,
  validateCPF,
  validateCNPJ,
} from '@/lib/documentValidation'

export default function Register() {
  const [searchParams] = useSearchParams()
  const initialRole = (searchParams.get('tipo') as UserRole) || 'customer'
  const [selectedRole, setSelectedRole] = useState<UserRole>(
    ['customer', 'merchant', 'admin'].includes(initialRole) ? initialRole : 'customer',
  )

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [documentNumber, setDocumentNumber] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [adminToken, setAdminToken] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { register } = useAuth()
  const navigate = useNavigate()

  const handleDocumentChange = (raw: string) => {
    const digits = cleanDocument(raw)
    if (selectedRole === 'merchant') {
      setDocumentNumber(formatCNPJ(digits))
    } else {
      setDocumentNumber(formatCPF(digits))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    // Validate Document (CPF for customer, CNPJ for merchant)
    if (selectedRole === 'customer') {
      const digits = cleanDocument(documentNumber)
      if (!digits) {
        setErrorMsg('O CPF é obrigatório para cadastro de cliente.')
        return
      }
      if (digits.length !== 11) {
        setErrorMsg('O CPF deve conter 11 dígitos.')
        return
      }
      if (!validateCPF(digits)) {
        setErrorMsg('CPF inválido. Por favor, verifique os dígitos digitados.')
        return
      }
    } else if (selectedRole === 'merchant') {
      const digits = cleanDocument(documentNumber)
      if (!digits) {
        setErrorMsg('O CNPJ é obrigatório para cadastro de lojista.')
        return
      }
      if (digits.length !== 14) {
        setErrorMsg('O CNPJ deve conter 14 dígitos.')
        return
      }
      if (!validateCNPJ(digits)) {
        setErrorMsg('CNPJ inválido. Por favor, verifique os dígitos digitados.')
        return
      }
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
      const user = await register({
        name,
        email,
        password,
        role: selectedRole,
        document: documentNumber ? cleanDocument(documentNumber) : undefined,
        phone: phone || undefined,
      })

      if (user.role === 'admin') {
        navigate('/admin')
      } else if (user.role === 'merchant') {
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
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-rose-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Criar Nova Conta
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Junte-se ao Fideliza e comece a acumular ou criar seus programas
          </p>
        </div>

        <Card className="border-slate-200/80 shadow-xl shadow-slate-200/50 rounded-3xl">
          <CardHeader className="pb-3">
            <Tabs
              value={selectedRole}
              onValueChange={(val) => {
                const nextRole = val as UserRole
                setSelectedRole(nextRole)
                setErrorMsg(null)
                // Re-format existing digits for the new role
                const digits = cleanDocument(documentNumber)
                if (nextRole === 'merchant') {
                  setDocumentNumber(formatCNPJ(digits))
                } else {
                  setDocumentNumber(formatCPF(digits))
                }
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

              {/* CPF for customer / CNPJ for merchant */}
              {selectedRole !== 'admin' && (
                <div className="space-y-1.5">
                  <Label
                    htmlFor="document"
                    className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    {selectedRole === 'merchant' ? 'CNPJ da Loja / Empresa *' : 'CPF do Cliente *'}
                  </Label>
                  <Input
                    id="document"
                    type="text"
                    required
                    inputMode="numeric"
                    placeholder={
                      selectedRole === 'merchant' ? '00.000.000/0000-00' : '000.000.000-00'
                    }
                    value={documentNumber}
                    onChange={(e) => handleDocumentChange(e.target.value)}
                    maxLength={selectedRole === 'merchant' ? 18 : 14}
                    className="rounded-xl border-slate-200 focus-visible:ring-rose-500 font-mono text-sm tracking-wider"
                  />
                  <p className="text-[11px] text-slate-400">
                    {selectedRole === 'merchant'
                      ? 'Informe os 14 dígitos do CNPJ para identificação da sua empresa.'
                      : 'O CPF permite que lojistas identifiquem você no balcão além do código digital.'}
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-bold text-slate-700">
                  WhatsApp / Telefone (Opcional)
                </Label>
                <Input
                  id="phone"
                  type="text"
                  placeholder="(11) 98765-4321"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-xl border-slate-200 focus-visible:ring-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pass" className="text-xs font-bold text-slate-700">
                  Senha (mínimo 8 caracteres)
                </Label>
                <Input
                  id="pass"
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl border-slate-200 focus-visible:ring-rose-500"
                />
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
                className="w-full py-5 rounded-xl font-bold bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white shadow-md shadow-rose-600/20"
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

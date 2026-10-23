import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  User,
  Phone,
  Lock,
  Mail,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  AlertCircle,
  FileText,
  KeyRound,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatCPF, formatCNPJ, cleanDocument } from '@/lib/documentValidation'

interface EditCustomerProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const EditCustomerProfileDialog: React.FC<EditCustomerProfileDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { user, updateProfile } = useAuth()
  const { toast } = useToast()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  // Senhas (opcionais)
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Máscara de telefone idêntica à usada no cadastro/registro
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

  // Preenche dados ao abrir
  useEffect(() => {
    if (open && user) {
      setName(user.name || '')
      setPhone(formatPhoneNumber(user.phone || ''))
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordSection(false)
      setErrorMsg(null)
    }
  }, [open, user])

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhoneNumber(e.target.value))
    setErrorMsg(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    // Validação de Nome
    const cleanName = name.trim()
    if (!cleanName) {
      setErrorMsg('Por favor, informe seu nome completo.')
      return
    }

    // Validação de Telefone
    const phoneDigits = phone.replace(/\D/g, '')
    if (!phoneDigits) {
      setErrorMsg('Por favor, informe seu telefone com WhatsApp.')
      return
    }
    if (phoneDigits.length < 10) {
      setErrorMsg('Informe um telefone válido com DDD (mínimo 10 dígitos, ex: (11) 98765-4321).')
      return
    }

    // Validação do DDD (primeiros 2 dígitos)
    const ddd = parseInt(phoneDigits.slice(0, 2), 10)
    if (ddd < 11 || ddd > 99) {
      setErrorMsg('DDD inválido. Por favor, verifique o DDD do telefone.')
      return
    }

    // Validação opcional de senha
    const hasPasswordInput = currentPassword.trim() || newPassword.trim() || confirmPassword.trim()

    if (hasPasswordInput) {
      if (!currentPassword) {
        setErrorMsg('Informe sua senha atual para poder cadastrar uma nova senha.')
        return
      }
      if (!newPassword) {
        setErrorMsg('Informe a nova senha desejada.')
        return
      }
      if (newPassword.length < 6) {
        setErrorMsg('A nova senha deve ter no mínimo 6 caracteres.')
        return
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('A confirmação da nova senha não confere com a nova senha digitada.')
        return
      }
      if (newPassword === currentPassword) {
        setErrorMsg('A nova senha deve ser diferente da senha atual.')
        return
      }
    }

    setIsSubmitting(true)

    try {
      await updateProfile({
        name: cleanName,
        phone: phone.trim(),
        currentPassword: hasPasswordInput ? currentPassword : undefined,
        newPassword: hasPasswordInput ? newPassword : undefined,
      })

      toast({
        title: 'Dados atualizados com sucesso!',
        description: hasPasswordInput
          ? 'Seu perfil e sua senha foram atualizados.'
          : 'Seu nome e telefone foram atualizados.',
      })

      onOpenChange(false)
    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err)

      // Tratamento amigável de erros do PocketBase
      let msg = 'Não foi possível atualizar seus dados. Tente novamente mais tarde.'

      const rawMsg = err?.data?.message || err?.message || ''
      const fieldData = err?.data?.data || {}

      if (
        fieldData?.oldPassword?.message ||
        rawMsg.toLowerCase().includes('old password') ||
        rawMsg.toLowerCase().includes('password does not match') ||
        rawMsg.toLowerCase().includes('invalid old password')
      ) {
        msg = 'A senha atual informada está incorreta.'
      } else if (fieldData?.password?.message) {
        msg = `Erro na nova senha: ${fieldData.password.message}`
      } else if (fieldData?.phone?.message) {
        msg = `Telefone inválido: ${fieldData.phone.message}`
      } else if (fieldData?.name?.message) {
        msg = `Nome inválido: ${fieldData.name.message}`
      } else if (err?.message) {
        msg = err.message
      }

      setErrorMsg(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const docClean = cleanDocument(user?.document || '')
  const formattedDoc = docClean
    ? docClean.length > 11
      ? formatCNPJ(docClean)
      : formatCPF(docClean)
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border-slate-200 max-h-[92vh] overflow-y-auto">
        <DialogHeader className="text-left space-y-2 pb-1">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
                Meus Dados Cadastrais
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Altere seu nome, telefone de contato e atualize sua senha de acesso
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-3">
          {errorMsg && (
            <Alert variant="destructive" className="py-2.5 text-xs">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          {/* Dados somente leitura (E-mail e Documento) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Mail className="w-3 h-3" /> E-mail (Somente leitura)
              </Label>
              <p
                className="text-xs font-semibold text-slate-700 truncate mt-0.5"
                title={user?.email}
              >
                {user?.email || '-'}
              </p>
            </div>

            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <FileText className="w-3 h-3" /> CPF / CNPJ Cadastrado
              </Label>
              <p className="text-xs font-mono font-semibold text-slate-700 mt-0.5">
                {formattedDoc || 'Não informado'}
              </p>
            </div>
          </div>

          {/* Campo Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-name" className="text-xs font-bold text-slate-700">
              Nome Completo *
            </Label>
            <div className="relative">
              <Input
                id="edit-name"
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setErrorMsg(null)
                }}
                placeholder="Seu nome completo"
                className="rounded-xl border-slate-200 focus-visible:ring-emerald-500"
              />
            </div>
          </div>

          {/* Campo Telefone */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-phone" className="text-xs font-bold text-slate-700">
              Telefone / WhatsApp *
            </Label>
            <div className="relative">
              <Input
                id="edit-phone"
                type="tel"
                required
                maxLength={15}
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(11) 98765-4321"
                className="rounded-xl border-slate-200 focus-visible:ring-emerald-500 font-mono text-sm"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Utilizado para comunicações e notificações dos seus benefícios nas lojas.
            </p>
          </div>

          {/* Seção Opcional: Alterar Senha */}
          <div className="pt-2 border-t border-slate-100">
            {!showPasswordSection ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPasswordSection(true)}
                className="w-full text-xs font-bold border-dashed border-slate-300 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50/50 py-2.5 rounded-xl gap-2"
              >
                <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                Deseja alterar sua senha de acesso?
              </Button>
            ) : (
              <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-600" />
                    <span className="text-xs font-bold text-slate-800">
                      Alteração de Senha (Opcional)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordSection(false)
                      setCurrentPassword('')
                      setNewPassword('')
                      setConfirmPassword('')
                      setErrorMsg(null)
                    }}
                    className="text-[11px] font-semibold text-rose-600 hover:underline"
                  >
                    Cancelar troca de senha
                  </button>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="current-password"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Senha Atual *
                  </Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value)
                        setErrorMsg(null)
                      }}
                      placeholder="Sua senha atual"
                      className="rounded-xl border-slate-200 pr-10 focus-visible:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      title={showCurrentPassword ? 'Ocultar' : 'Exibir'}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="new-password" className="text-xs font-semibold text-slate-700">
                      Nova Senha *
                    </Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value)
                          setErrorMsg(null)
                        }}
                        placeholder="Mínimo 6 caracteres"
                        className="rounded-xl border-slate-200 pr-10 focus-visible:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        title={showNewPassword ? 'Ocultar' : 'Exibir'}
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="confirm-password"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Confirmar Nova Senha *
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value)
                          setErrorMsg(null)
                        }}
                        placeholder="Repita a nova senha"
                        className="rounded-xl border-slate-200 pr-10 focus-visible:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        title={showConfirmPassword ? 'Ocultar' : 'Exibir'}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs font-bold border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting || !name.trim() || !phone.trim()}
              className="rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md text-xs px-5 py-2.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando alterações...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

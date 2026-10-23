import React, { useState } from 'react'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  cleanDocument,
  formatCPF,
  formatCNPJ,
  validateCPF,
  validateCNPJ,
} from '@/lib/documentValidation'
import {
  ShieldCheck,
  FileText,
  Loader2,
  CheckCircle2,
  UserCheck,
  Store,
  LogOut,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

type DocumentType = 'cpf' | 'cnpj'

export const CompleteDocumentDialog: React.FC = () => {
  const { user, role, isAuthenticated, isLoading, updateDocument, logout } = useAuth()

  // Default to CNPJ if merchant, CPF if customer
  const [docType, setDocType] = useState<DocumentType>(() => {
    return role === 'merchant' ? 'cnpj' : 'cpf'
  })
  const [documentInput, setDocumentInput] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sync docType if role changes and user hasn't typed anything yet
  React.useEffect(() => {
    if (!documentInput) {
      setDocType(role === 'merchant' ? 'cnpj' : 'cpf')
    }
  }, [role, documentInput])

  // Only show for authenticated customer or merchant with no document
  const shouldOpen =
    !isLoading &&
    isAuthenticated &&
    !!user &&
    (user.role === 'customer' || user.role === 'merchant') &&
    !user.document

  const handleTypeChange = (nextType: DocumentType) => {
    setDocType(nextType)
    setErrorMsg(null)
    const digits = cleanDocument(documentInput)
    if (nextType === 'cnpj') {
      setDocumentInput(formatCNPJ(digits))
    } else {
      setDocumentInput(formatCPF(digits))
    }
  }

  const handleInputChange = (raw: string) => {
    const digits = cleanDocument(raw)
    setErrorMsg(null)
    if (docType === 'cnpj') {
      setDocumentInput(formatCNPJ(digits))
    } else {
      setDocumentInput(formatCPF(digits))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    const digits = cleanDocument(documentInput)

    if (docType === 'cpf') {
      if (!digits) {
        setErrorMsg('Informe o CPF.')
        return
      }
      if (digits.length !== 11) {
        setErrorMsg('O CPF deve conter exatamente 11 dígitos.')
        return
      }
      if (!validateCPF(digits)) {
        setErrorMsg('CPF inválido. Por favor, verifique os dígitos digitados.')
        return
      }
    } else {
      if (!digits) {
        setErrorMsg('Informe o CNPJ.')
        return
      }
      if (digits.length !== 14) {
        setErrorMsg('O CNPJ deve conter exatamente 14 dígitos.')
        return
      }
      if (!validateCNPJ(digits)) {
        setErrorMsg('CNPJ inválido. Por favor, verifique os dígitos digitados.')
        return
      }
    }

    setIsSubmitting(true)
    try {
      await updateDocument(digits)
      toast({
        title: 'Documento cadastrado com sucesso!',
        description: `Seu ${docType.toUpperCase()} foi vinculado à sua conta.`,
      })
      setDocumentInput('')
    } catch (err: any) {
      console.error('Failed to update document:', err)
      setErrorMsg(
        err?.message || 'Não foi possível salvar o documento. Tente novamente em instantes.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!shouldOpen) {
    return null
  }

  const isMerchant = user?.role === 'merchant'

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      {/* Obligatory modal: do not dismiss on click outside or escape, hide close button */}
      <DialogContent
        className="max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border-slate-200 [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center space-y-3 pb-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-rose-500/20">
            {isMerchant ? <Store className="w-7 h-7" /> : <FileText className="w-7 h-7" />}
          </div>

          <div className="space-y-1">
            <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Complete seu Cadastro
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {isMerchant ? (
                <>
                  Para ativar o painel da sua loja e emitir benefícios fiscais e de fidelidade,
                  informe seu documento (<strong>CPF</strong> ou <strong>CNPJ</strong>).
                </>
              ) : (
                <>
                  Para que as lojas identifiquem você no balcão e no caixa pelo documento além do
                  código digital, informe seu <strong>CPF</strong> ou <strong>CNPJ</strong>.
                </>
              )}
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          {errorMsg && (
            <Alert variant="destructive" className="py-2.5 text-xs">
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          {/* Option to choose CPF or CNPJ */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Escolha o tipo de documento
            </Label>
            <RadioGroup
              value={docType}
              onValueChange={(val) => handleTypeChange(val as DocumentType)}
              className="grid grid-cols-2 gap-3"
            >
              <label
                htmlFor="doc-cpf"
                className={`flex items-center justify-between p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                  docType === 'cpf'
                    ? 'border-rose-600 bg-rose-50/60 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserCheck
                    className={`w-4 h-4 ${docType === 'cpf' ? 'text-rose-600' : 'text-slate-400'}`}
                  />
                  <div>
                    <p
                      className={`text-xs font-bold ${
                        docType === 'cpf' ? 'text-rose-950' : 'text-slate-700'
                      }`}
                    >
                      CPF
                    </p>
                    <p className="text-[10px] text-slate-500">Pessoa Física</p>
                  </div>
                </div>
                <RadioGroupItem value="cpf" id="doc-cpf" />
              </label>

              <label
                htmlFor="doc-cnpj"
                className={`flex items-center justify-between p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                  docType === 'cnpj'
                    ? 'border-rose-600 bg-rose-50/60 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Store
                    className={`w-4 h-4 ${docType === 'cnpj' ? 'text-rose-600' : 'text-slate-400'}`}
                  />
                  <div>
                    <p
                      className={`text-xs font-bold ${
                        docType === 'cnpj' ? 'text-rose-950' : 'text-slate-700'
                      }`}
                    >
                      CNPJ
                    </p>
                    <p className="text-[10px] text-slate-500">Pessoa Jurídica</p>
                  </div>
                </div>
                <RadioGroupItem value="cnpj" id="doc-cnpj" />
              </label>
            </RadioGroup>
          </div>

          {/* Document Input with real-time formatting */}
          <div className="space-y-1.5">
            <Label
              htmlFor="doc-number"
              className="text-xs font-bold text-slate-700 flex items-center justify-between"
            >
              <span>Número do {docType.toUpperCase()} *</span>
              <span className="text-[11px] font-normal text-slate-400 font-mono">
                {docType === 'cpf' ? '11 dígitos' : '14 dígitos'}
              </span>
            </Label>
            <div className="relative">
              <Input
                id="doc-number"
                type="text"
                inputMode="numeric"
                required
                autoFocus
                placeholder={docType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                maxLength={docType === 'cpf' ? 14 : 18}
                value={documentInput}
                onChange={(e) => handleInputChange(e.target.value)}
                className="rounded-2xl border-slate-300 font-mono text-base tracking-wider py-5 focus-visible:ring-rose-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              {docType === 'cpf'
                ? 'Os dígitos verificadores do CPF serão validados automaticamente.'
                : 'Os dígitos verificadores do CNPJ serão validados automaticamente.'}
            </p>
          </div>

          <div className="pt-2 space-y-2">
            <Button
              type="submit"
              disabled={isSubmitting || !cleanDocument(documentInput)}
              className="w-full py-5 rounded-2xl font-bold bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white shadow-md shadow-rose-600/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando documento...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmar e Continuar
                </>
              )}
            </Button>

            <div className="flex items-center justify-center pt-2">
              <button
                type="button"
                onClick={logout}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sair da conta
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

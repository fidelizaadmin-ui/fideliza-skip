import React, { useEffect, useState } from 'react'
import {
  QrCode,
  ShieldCheck,
  Check,
  Save,
  Percent,
  KeyRound,
  UserCheck,
  Building2,
  AlertTriangle,
  Lock,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import type { StoreRecord } from '@/types'
import type { AppointmentPixKeyType } from '@/types/appointments'
import {
  getAppointmentDepositSettings,
  saveAppointmentDepositSettings,
} from '@/services/appointmentsService'

interface AppointmentDepositConfigCardProps {
  store: StoreRecord
  isMerchantSuspended?: boolean
  onStoreUpdated?: (updated: StoreRecord) => void
}

export const AppointmentDepositConfigCard: React.FC<AppointmentDepositConfigCardProps> = ({
  store,
  isMerchantSuspended,
  onStoreUpdated,
}) => {
  const [depositEnabled, setDepositEnabled] = useState<boolean>(!!store.appointment_deposit_enabled)
  const [depositPercent, setDepositPercent] = useState<number>(
    store.appointment_deposit_percent ?? 20,
  )
  const [keyType, setKeyType] = useState<AppointmentPixKeyType>(
    (store.appointment_pix_key_type as AppointmentPixKeyType) || 'aleatoria',
  )
  const [pixKey, setPixKey] = useState<string>('')
  const [receiverName, setReceiverName] = useState<string>(
    store.appointment_pix_receiver_name || store.name || '',
  )
  const [receiverCity, setReceiverCity] = useState<string>(
    store.appointment_pix_receiver_city || store.city || 'SAO PAULO',
  )
  const [pixKeyMasked, setPixKeyMasked] = useState<string>(store.appointment_pix_key_masked || '')
  const [hasPixKey, setHasPixKey] = useState<boolean>(
    !!store.appointment_pix_key_masked || !!store.appointment_pix_key,
  )
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)

  // Carrega configurações persistidas do backend (com chave mascarada)
  useEffect(() => {
    if (!store?.id) return
    let isMounted = true
    setIsLoading(true)
    getAppointmentDepositSettings(store.id)
      .then((data) => {
        if (!isMounted) return
        setDepositEnabled(!!data.deposit_enabled)
        setDepositPercent(Number(data.deposit_percent) || 20)
        setKeyType(data.key_type || 'aleatoria')
        setPixKeyMasked(data.pix_key_masked || '')
        setHasPixKey(!!data.has_pix_key)
        if (data.receiver_name) setReceiverName(data.receiver_name)
        if (data.receiver_city) setReceiverCity(data.receiver_city)
      })
      .catch((err) => {
        console.warn('Não foi possível carregar configurações de sinal:', err)
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [store?.id])

  const handleSave = async (overrideEnabled?: boolean) => {
    if (isMerchantSuspended) {
      toast({
        title: 'Ação bloqueada',
        description: 'Sua loja está suspensa. Efetue o pagamento para reativar os recursos.',
        variant: 'destructive',
      })
      return
    }

    const enabledToSave = overrideEnabled !== undefined ? overrideEnabled : depositEnabled

    if (enabledToSave) {
      if (!hasPixKey && !pixKey.trim()) {
        toast({
          title: 'Chave Pix necessária',
          description: 'Informe sua chave Pix para receber o valor do sinal antes de ativar.',
          variant: 'destructive',
        })
        return
      }
      if (depositPercent <= 0 || depositPercent > 100) {
        toast({
          title: 'Porcentagem inválida',
          description: 'A porcentagem do sinal deve ser entre 1% e 100%.',
          variant: 'destructive',
        })
        return
      }
    }

    setIsSaving(true)
    try {
      const res = await saveAppointmentDepositSettings({
        store_id: store.id,
        deposit_enabled: enabledToSave,
        deposit_percent: Number(depositPercent) || 0,
        key_type: keyType,
        pix_key: pixKey.trim() || undefined,
        receiver_name: receiverName.trim() || undefined,
        receiver_city: receiverCity.trim() || undefined,
      })

      setDepositEnabled(res.deposit_enabled)
      setDepositPercent(res.deposit_percent)
      setKeyType(res.key_type)
      setPixKeyMasked(res.pix_key_masked)
      setHasPixKey(res.has_pix_key)
      setPixKey('') // limpa o campo sensível da memória

      if (onStoreUpdated) {
        onStoreUpdated({
          ...store,
          appointment_deposit_enabled: res.deposit_enabled,
          appointment_deposit_percent: res.deposit_percent,
          appointment_pix_key_type: res.key_type,
          appointment_pix_key_masked: res.pix_key_masked,
          appointment_pix_receiver_name: res.receiver_name,
          appointment_pix_receiver_city: res.receiver_city,
        })
      }

      toast({
        title: 'Configurações de sinal salvas!',
        description: res.deposit_enabled
          ? `Cobrança de sinal ativa (${res.deposit_percent}%). A chave Pix foi salva com segurança.`
          : 'Cobrança de sinal desativada.',
      })
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Erro ao salvar configurações de sinal.'
      toast({
        title: 'Erro ao salvar',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggle = (checked: boolean) => {
    setDepositEnabled(checked)
    if (!checked) {
      handleSave(false)
    }
  }

  return (
    <>
      {/* Card 1: Cobrança de Sinal por Pix (ativação + porcentagem) */}
      <Card className="rounded-3xl border border-slate-200/80 shadow-xs bg-linear-to-br from-white to-slate-50/60 overflow-hidden">
        <CardHeader className="p-5 sm:p-6 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 shrink-0 mt-0.5">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base sm:text-lg font-black text-slate-900">
                    Cobrança de Sinal por Pix
                  </CardTitle>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Novo
                  </span>
                </div>
                <CardDescription className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Exija o pagamento antecipado de uma porcentagem do serviço para reservar o
                  horário. O cliente paga via Pix copia e cola diretamente na sua conta e você
                  confirma antes de validar a agenda.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs shrink-0 self-start sm:self-center">
              <div className="text-right">
                <span className="block text-xs font-bold text-slate-800">
                  {depositEnabled ? 'Sinal Ativado' : 'Sinal Desativado'}
                </span>
                <span className="block text-[11px] text-slate-500">
                  {depositEnabled
                    ? `${depositPercent}% no agendamento`
                    : 'Agendamento sem pagamento'}
                </span>
              </div>
              <Switch
                checked={depositEnabled}
                disabled={isSaving || isLoading || isMerchantSuspended}
                onCheckedChange={handleToggle}
                className="data-[state=checked]:bg-emerald-600"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-5">
          {/* Bloco de Porcentagem */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-emerald-600" />
                Porcentagem do Sinal (%)
              </Label>
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                {depositPercent}% do serviço
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Defina quanto o cliente deve antecipar para segurar o horário.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Input
                type="number"
                min={1}
                max={100}
                step={1}
                value={depositPercent}
                onChange={(e) =>
                  setDepositPercent(Math.max(1, Math.min(100, Number(e.target.value) || 0)))
                }
                disabled={isSaving || isMerchantSuspended}
                className="rounded-xl h-10 font-bold text-slate-900 text-sm"
              />
              <div className="flex gap-1 shrink-0">
                {[10, 20, 30, 50].map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant={depositPercent === preset ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDepositPercent(preset)}
                    className={
                      depositPercent === preset
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 text-xs font-bold px-2.5'
                        : 'rounded-xl h-10 text-xs font-semibold px-2.5 text-slate-700'
                    }
                  >
                    {preset}%
                  </Button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              Exemplo: serviço de R$ 100,00 com {depositPercent}% = sinal de{' '}
              <strong className="text-slate-800 font-bold">
                R$ {((100 * depositPercent) / 100).toFixed(2)}
              </strong>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Cadastrar PIX (Nome do Recebedor, Cidade, Tipo de Chave, Chave Pix + salvar) */}
      <Card className="rounded-3xl border border-slate-200/80 shadow-xs bg-linear-to-br from-white to-slate-50/60 overflow-hidden">
        <CardHeader className="p-5 sm:p-6 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 shrink-0 mt-0.5">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-black text-slate-900">
                  Cadastrar PIX
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Cadastre a chave Pix de recebimento do lojista. O valor do sinal é pago
                  diretamente na sua conta. A chave é protegida e nunca exibida por completo.
                </CardDescription>
              </div>
            </div>

            {hasPixKey && (
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 self-start sm:self-auto shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Chave ativa: <span className="font-mono">{pixKeyMasked || '••••••••'}</span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-4">
          {/* Nome do Recebedor + Cidade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <Label className="text-[10px] font-semibold text-slate-600 flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-emerald-600" /> Nome do Recebedor
              </Label>
              <Input
                value={receiverName}
                maxLength={25}
                placeholder="Nome ou Loja"
                onChange={(e) => setReceiverName(e.target.value)}
                disabled={isSaving || isMerchantSuspended}
                className="rounded-xl h-10 text-xs"
              />
            </div>
            <div>
              <Label className="text-[10px] font-semibold text-slate-600 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-emerald-600" /> Cidade
              </Label>
              <Input
                value={receiverCity}
                maxLength={15}
                placeholder="SAO PAULO"
                onChange={(e) => setReceiverCity(e.target.value)}
                disabled={isSaving || isMerchantSuspended}
                className="rounded-xl h-10 text-xs uppercase"
              />
            </div>
          </div>

          {/* Tipo de Chave + Digite a chave Pix — lado a lado na mesma linha */}
          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-2.5">
            <div>
              <Label className="text-[10px] font-semibold text-slate-600">Tipo de Chave</Label>
              <Select
                value={keyType}
                onValueChange={(val: AppointmentPixKeyType) => setKeyType(val)}
                disabled={isSaving || isMerchantSuspended}
              >
                <SelectTrigger className="rounded-xl h-10 text-xs bg-slate-50">
                  <SelectValue placeholder="Tipo de chave" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="cnpj">CNPJ</SelectItem>
                  <SelectItem value="telefone">Telefone / Celular</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="aleatoria">Chave Aleatória (EVP)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[10px] font-semibold text-slate-600 flex items-center justify-between">
                <span>{hasPixKey ? 'Alterar Chave Pix (opcional)' : 'Digite a Chave Pix'}</span>
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Lock className="w-2.5 h-2.5" /> Protegido com máscara
                </span>
              </Label>
              <Input
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder={
                  hasPixKey
                    ? 'Deixe em branco para manter a chave atual'
                    : keyType === 'cpf'
                      ? '000.000.000-00'
                      : keyType === 'cnpj'
                        ? '00.000.000/0000-00'
                        : keyType === 'telefone'
                          ? '(11) 99999-9999'
                          : keyType === 'email'
                            ? 'seuemail@exemplo.com'
                            : 'Chave aleatória (32 caracteres)'
                }
                disabled={isSaving || isMerchantSuspended}
                className="rounded-xl h-10 text-xs font-mono"
              />
            </div>
          </div>

          {/* Rodapé: aviso + botão salvar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="text-[11px] text-slate-500 leading-relaxed">
              {depositEnabled && !hasPixKey && !pixKey.trim() ? (
                <span className="text-amber-600 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Cadastre sua chave Pix para que os clientes consigam agendar e pagar o sinal.
                </span>
              ) : (
                <span>
                  O QR Code e o Copia e Cola oficiais do Banco Central (EMV) serão gerados
                  automaticamente para cada agendamento com o valor exato do sinal.
                </span>
              )}
            </div>

            <Button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving || isMerchantSuspended}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs h-10 px-4 gap-1.5 shadow-xs shrink-0 self-end sm:self-auto"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Salvando...' : 'Salvar Configurações de Sinal'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

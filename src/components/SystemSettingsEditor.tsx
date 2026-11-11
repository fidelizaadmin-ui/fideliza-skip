import React, { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { useSystemSettings, applyThemeToDocument } from '@/contexts/SystemSettingsContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { SystemBrandImagesCard } from '@/components/SystemBrandImagesCard'
import { Loader2, Save, Palette, Type, CheckCircle2 } from 'lucide-react'

interface SystemSettingsRecord {
  id: string
  system_name: string
  theme: string
}

/** Paletas pré-definidas (devem casar com os valores do select "theme" na migração 0027) */
const THEME_OPTIONS: { value: string; label: string; description: string; swatches: string[] }[] = [
  {
    value: 'azul',
    label: 'Azul Fideliza',
    description: 'Padrão atual — azul marinho institucional',
    swatches: ['#012d76', '#0283fd'],
  },
  {
    value: 'verde',
    label: 'Verde',
    description: 'Esmeralda — tom de crescimento e aprovação',
    swatches: ['#065f46', '#10b981'],
  },
  {
    value: 'roxo',
    label: 'Roxo',
    description: 'Violeta profundo — tom premium',
    swatches: ['#4c1d95', '#8b5cf6'],
  },
  {
    value: 'laranja',
    label: 'Laranja',
    description: 'Laranja vibrante — tom energético',
    swatches: ['#c2410c', '#f97316'],
  },
  {
    value: 'vermelho',
    label: 'Vermelho escuro',
    description: 'Vermelho sóbrio — tom de urgência',
    swatches: ['#991b1b', '#ef4444'],
  },
  {
    value: 'grafite',
    label: 'Grafite',
    description: 'Cinza ardósia — tom neutro e discreto',
    swatches: ['#1e293b', '#64748b'],
  },
]

export const SystemSettingsEditor: React.FC = () => {
  const { applySettings } = useSystemSettings()
  const { toast } = useToast()

  const [systemName, setSystemName] = useState('Fideliza')
  const [theme, setTheme] = useState('azul')
  const [recordId, setRecordId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const list = await pb.collection('system_settings').getList<SystemSettingsRecord>(1, 1)
        const rec = list.items[0]
        if (!cancelled && rec) {
          setRecordId(rec.id)
          setSystemName(rec.system_name || 'Fideliza')
          setTheme(rec.theme || 'azul')
        }
      } catch (err) {
        console.warn('Erro ao carregar configurações do sistema:', err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    const safeName = (systemName || '').trim()
    if (!safeName) {
      toast({
        title: 'Nome obrigatório',
        description: 'Informe o nome do sistema antes de salvar.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      const payload = { system_name: safeName, theme }
      let saved: SystemSettingsRecord
      if (recordId) {
        saved = await pb
          .collection('system_settings')
          .update<SystemSettingsRecord>(recordId, payload)
      } else {
        saved = await pb.collection('system_settings').create<SystemSettingsRecord>(payload)
        setRecordId(saved.id)
      }

      // Aplica globalmente (contexto + tema no <html> + título da aba)
      applySettings(saved.system_name, saved.theme)

      toast({
        title: 'Configurações salvas!',
        description: 'Nome e tema atualizados em todo o sistema.',
        className: 'bg-emerald-600 text-white border-emerald-700',
      })
    } catch (err: any) {
      console.error('Erro ao salvar configurações:', err)
      toast({
        title: 'Erro ao salvar',
        description: getErrorMessage(err) || 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400 gap-2 text-sm">
        <Loader2 className="w-5 h-5 animate-spin" />
        Carregando configurações...
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* NOME DO SISTEMA */}
      <Card className="rounded-3xl border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-black text-slate-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[var(--brand-soft)] text-[var(--brand-primary)] flex items-center justify-center">
              <Type className="w-4 h-4" />
            </span>
            Nome do Sistema
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Aparece na navbar, no rodapé, nas páginas de Login/Cadastro e no título da aba do
            navegador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5 max-w-md">
            <Label htmlFor="system-name" className="text-xs font-bold text-slate-700">
              Nome exibido
            </Label>
            <Input
              id="system-name"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              maxLength={60}
              placeholder="Ex: Fideliza"
              className="text-sm font-semibold rounded-xl"
            />
            <p className="text-[11px] text-slate-400">{systemName.length}/60 caracteres</p>
          </div>
        </CardContent>
      </Card>

      {/* LOGO E ÍCONE */}
      <SystemBrandImagesCard recordId={recordId} />

      {/* TEMA / CORES */}
      <Card className="rounded-3xl border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-black text-slate-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[var(--brand-soft)] text-[var(--brand-primary)] flex items-center justify-center">
              <Palette className="w-4 h-4" />
            </span>
            Tema de Cores
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Escolha uma das paletas pré-definidas. As cores de destaque da interface mudam
            imediatamente após salvar (a logo com a caixa de presente é mantida).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {THEME_OPTIONS.map((opt) => {
              const isSelected = theme === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setTheme(opt.value)
                    applyThemeToDocument(opt.value) // pré-visualização imediata
                  }}
                  className={`relative text-left rounded-2xl border p-3 transition-all ${
                    isSelected
                      ? 'border-[var(--brand-primary)] ring-2 ring-[var(--brand-secondary)] bg-[var(--brand-soft)]'
                      : 'border-slate-200 bg-white fideliza-panel-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                  aria-pressed={isSelected}
                >
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-[var(--brand-primary)] absolute top-2.5 right-2.5" />
                  )}
                  <div className="flex gap-1.5 mb-2">
                    {opt.swatches.map((c) => (
                      <span
                        key={c}
                        className="w-6 h-6 rounded-full border border-black/10 shadow-xs"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-black text-slate-900">{opt.label}</p>
                  <p className="text-[10px] text-slate-500 leading-snug mt-0.5">
                    {opt.description}
                  </p>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSaving}
          className="brand-primary-btn rounded-xl px-6 font-bold gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

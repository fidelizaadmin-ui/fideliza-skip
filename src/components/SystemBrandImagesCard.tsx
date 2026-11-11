import React, { useEffect, useRef, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { useSystemSettings } from '@/contexts/SystemSettingsContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { Loader2, Upload, RotateCcw, Save, Image as ImageIcon } from 'lucide-react'

type ImageKind = 'logo' | 'icon' | 'hero'

const ACCEPTED_TYPES: Record<ImageKind, string[]> = {
  logo: ['image/png', 'image/jpeg', 'image/svg+xml'],
  icon: ['image/png', 'image/jpeg', 'image/svg+xml'],
  hero: ['image/png', 'image/jpeg', 'image/webp'],
}

const ACCEPT_ATTRS: Record<ImageKind, string> = {
  logo: '.png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml',
  icon: '.png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml',
  hero: '.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp',
}

const MAX_BYTES = 5 * 1024 * 1024

/**
 * Upload de logo (marca horizontal), ícone (quadrado/favicon) e imagem de fundo
 * do hero da página inicial. Só é montado dentro do editor de Configurações
 * (visível apenas ao admin).
 */
export const SystemBrandImagesCard: React.FC<{ recordId: string | null }> = ({ recordId }) => {
  const { logoUrl, iconUrl, heroImageUrl, refresh } = useSystemSettings()
  const { toast } = useToast()

  const [pending, setPending] = useState<Record<ImageKind, File | null>>({
    logo: null,
    icon: null,
    hero: null,
  })
  const [previews, setPreviews] = useState<Record<ImageKind, string | null>>({
    logo: null,
    icon: null,
    hero: null,
  })
  const [busy, setBusy] = useState<ImageKind | null>(null)

  // Guarda as pré-visualizações atuais para liberá-las só ao desmontar
  const previewsRef = useRef(previews)
  previewsRef.current = previews

  useEffect(() => {
    return () => {
      ;(Object.keys(previewsRef.current) as ImageKind[]).forEach((k) => {
        const url = previewsRef.current[k]
        if (url) URL.revokeObjectURL(url)
      })
    }
  }, [])

  const handlePick = (kind: ImageKind, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!ACCEPTED_TYPES[kind].includes(file.type)) {
      toast({
        title: 'Formato não aceito',
        description:
          kind === 'hero'
            ? 'Envie uma imagem JPG, PNG ou WEBP.'
            : 'Envie uma imagem PNG, JPG ou SVG.',
        variant: 'destructive',
      })
      return
    }
    if (file.size > MAX_BYTES) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo é 5 MB.',
        variant: 'destructive',
      })
      return
    }

    setPending((p) => ({ ...p, [kind]: file }))
    setPreviews((p) => {
      if (p[kind]) URL.revokeObjectURL(p[kind] as string)
      return { ...p, [kind]: URL.createObjectURL(file) }
    })
  }

  const clearPending = (kind: ImageKind) => {
    setPending((p) => ({ ...p, [kind]: null }))
    setPreviews((p) => {
      if (p[kind]) URL.revokeObjectURL(p[kind] as string)
      return { ...p, [kind]: null }
    })
  }

  /** Envia o arquivo escolhido (ou, com file=null, restaura o padrão apagando o arquivo) */
  const save = async (kind: ImageKind, restore: boolean) => {
    if (!recordId) {
      toast({
        title: 'Salve as configurações primeiro',
        description: 'Ainda não há registro de configurações do sistema.',
        variant: 'destructive',
      })
      return
    }
    const file = pending[kind]
    if (!restore && !file) return

    setBusy(kind)
    try {
      const fd = new FormData()
      // Campo vazio remove o arquivo e volta ao padrão do Fideliza
      fd.append(kind, restore ? '' : (file as File))
      await pb.collection('system_settings').update(recordId, fd)
      await refresh()
      clearPending(kind)
      toast({
        title: restore ? 'Padrão restaurado' : FIELD_TITLES[kind].savedTitle,
        description: restore
          ? FIELD_TITLES[kind].restoredDesc
          : 'A nova imagem já está em uso no sistema.',
        className: 'bg-emerald-600 text-white border-emerald-700',
      })
    } catch (err) {
      console.error('Erro ao salvar imagem do sistema:', err)
      toast({
        title: 'Erro ao salvar imagem',
        description: getErrorMessage(err) || 'Não foi possível salvar a imagem.',
        variant: 'destructive',
      })
    } finally {
      setBusy(null)
    }
  }

  const currentUrls: Record<ImageKind, string | null> = {
    logo: logoUrl,
    icon: iconUrl,
    hero: heroImageUrl,
  }

  const FIELD_TITLES: Record<ImageKind, { savedTitle: string; restoredDesc: string }> = {
    logo: {
      savedTitle: 'Logo salva!',
      restoredDesc: 'A logo voltou ao padrão do Fideliza.',
    },
    icon: {
      savedTitle: 'Ícone salvo!',
      restoredDesc: 'O ícone voltou ao padrão do Fideliza.',
    },
    hero: {
      savedTitle: 'Imagem de fundo salva!',
      restoredDesc: 'A imagem de fundo do hero voltou ao padrão do Fideliza.',
    },
  }

  const renderField = (kind: ImageKind) => {
    const isLogo = kind === 'logo'
    const isHero = kind === 'hero'
    const title = isLogo
      ? 'Logo do Sistema'
      : isHero
        ? 'Imagem de Fundo do Hero'
        : 'Ícone do Sistema'
    const description = isLogo
      ? 'Marca horizontal exibida na navbar, rodapé, login, cadastro, cartão do cliente e páginas de e-mail/senha.'
      : isHero
        ? "Foto exibida como marca d'água no fundo do topo (hero) da página inicial, atrás dos títulos e da busca."
        : 'Ícone quadrado usado no favicon da aba e no lugar da caixa de presente nas marcas pequenas.'
    const currentUrl = currentUrls[kind]
    const previewUrl = previews[kind]
    const shown = previewUrl ?? currentUrl
    const isBusy = busy === kind

    return (
      <div className="space-y-3">
        <div>
          <p className="text-xs font-black text-slate-900">{title}</p>
          <p className="text-[11px] text-slate-500 leading-snug">{description}</p>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={`flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden ${
              isLogo ? 'w-48 h-20' : 'w-20 h-20'
            }`}
          >
            {shown ? (
              <img
                src={shown}
                alt={title}
                className={
                  isHero ? 'w-full h-full object-cover' : 'max-w-full max-h-full object-contain p-2'
                }
              />
            ) : (
              <ImageIcon className="w-6 h-6 text-slate-300" />
            )}
          </div>
          <div className="text-[11px] text-slate-500">
            {previewUrl
              ? 'Pré-visualização (ainda não salva)'
              : currentUrl
                ? 'Em uso'
                : 'Padrão do Fideliza'}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <label className="inline-flex items-center gap-2 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
            <Upload className="w-4 h-4" />
            Escolher arquivo
            <input
              type="file"
              accept={ACCEPT_ATTRS[kind]}
              className="sr-only"
              onChange={(e) => handlePick(kind, e)}
              disabled={isBusy}
            />
          </label>
          {pending[kind] && (
            <Button
              type="button"
              size="sm"
              disabled={isBusy}
              onClick={() => save(kind, false)}
              className="brand-primary-btn rounded-xl font-bold gap-2"
            >
              {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar
            </Button>
          )}
          {pending[kind] && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isBusy}
              onClick={() => clearPending(kind)}
              className="rounded-xl font-bold"
            >
              Cancelar
            </Button>
          )}
          {!pending[kind] && currentUrl && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isBusy}
              onClick={() => save(kind, true)}
              className="rounded-xl font-bold gap-2"
            >
              {isBusy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              Restaurar padrão
            </Button>
          )}
        </div>
        <p className="text-[10px] text-slate-400">
          {isHero ? 'JPG, PNG ou WEBP — máximo 5 MB.' : 'PNG, JPG ou SVG — máximo 5 MB.'}
        </p>
      </div>
    )
  }

  return (
    <Card className="rounded-3xl border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-black text-slate-900 flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-[var(--brand-soft)] text-[var(--brand-primary)] flex items-center justify-center">
            <ImageIcon className="w-4 h-4" />
          </span>
          Logo, Ícone e Imagem de Fundo
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Substitua a marca padrão do Fideliza por imagens próprias.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-8 md:grid-cols-2">
        {renderField('logo')}
        {renderField('icon')}
        {renderField('hero')}
      </CardContent>
    </Card>
  )
}

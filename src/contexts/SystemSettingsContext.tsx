import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'

export interface SystemSettings {
  system_name: string
  theme: string
}

type SystemSettingsRecord = {
  id: string
  collectionId: string
  collectionName: string
  system_name: string
  theme: string
  logo?: string
  icon?: string
  hero_image?: string
}

interface Snapshot {
  recordId: string | null
  systemName: string
  theme: string
  logoUrl: string | null
  iconUrl: string | null
  heroImageUrl: string | null
}

interface SystemSettingsContextValue {
  /** Nome do sistema configurado pelo admin (default: "Fideliza") */
  systemName: string
  /** Tema pré-definido ativo (default: "azul") */
  theme: string
  /** URL da logo personalizada (null = logo padrão do Fideliza) */
  logoUrl: string | null
  /** URL do ícone personalizado (null = ícone/favicon padrão) */
  iconUrl: string | null
  /** URL da imagem de fundo do hero da página inicial (null = imagem padrão) */
  heroImageUrl: string | null
  /** Id do registro único de system_settings (null se ainda não existe) */
  recordId: string | null
  /** Atualiza o estado local (após o admin salvar no backend) */
  applySettings: (name: string, theme: string) => void
  /** Recarrega o registro do backend (após trocar logo/ícone) */
  refresh: () => Promise<void>
}

const DEFAULT_NAME = 'Fideliza'
const DEFAULT_THEME = 'azul'

const EMPTY_SNAPSHOT: Snapshot = {
  recordId: null,
  systemName: DEFAULT_NAME,
  theme: DEFAULT_THEME,
  logoUrl: null,
  iconUrl: null,
  heroImageUrl: null,
}

const SystemSettingsContext = createContext<SystemSettingsContextValue>({
  systemName: DEFAULT_NAME,
  theme: DEFAULT_THEME,
  logoUrl: null,
  iconUrl: null,
  heroImageUrl: null,
  recordId: null,
  applySettings: () => {},
  refresh: async () => {},
})

/** href original do favicon do index.html (restaurado ao "Restaurar padrão") */
const DEFAULT_ICON_HREF =
  typeof document !== 'undefined'
    ? (document.querySelector<HTMLLinkElement>('link[rel~="icon"]')?.getAttribute('href') ?? null)
    : null

/** Aplica o atributo data-brand-theme no <html> (troca as variáveis CSS do tema) */
export function applyThemeToDocument(theme: string) {
  const root = document.documentElement
  if (!theme || theme === 'azul') {
    root.removeAttribute('data-brand-theme')
  } else {
    root.setAttribute('data-brand-theme', theme)
  }
}

/** Troca o favicon da aba pelo ícone personalizado (ou volta ao padrão) */
function applyFavicon(href: string | null) {
  if (!href) return
  let link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  link.href = href
}

async function fetchSnapshot(): Promise<Snapshot | null> {
  const list = await pb.collection('system_settings').getList<SystemSettingsRecord>(1, 1)
  const rec = list.items[0]
  if (!rec) return null
  return {
    recordId: rec.id,
    systemName: (rec.system_name || DEFAULT_NAME).trim() || DEFAULT_NAME,
    theme: rec.theme || DEFAULT_THEME,
    logoUrl: rec.logo ? pb.files.getURL(rec, rec.logo) : null,
    iconUrl: rec.icon ? pb.files.getURL(rec, rec.icon) : null,
    heroImageUrl: rec.hero_image ? pb.files.getURL(rec, rec.hero_image) : null,
  }
}

/**
 * Carrega as configurações do sistema no bootstrap do app.
 * Se o banco estiver vazio/indisponível, cai no padrão seguro:
 * nome "Fideliza" + tema azul + logo/ícone/hero padrão — sem quebrar nada.
 */
export function SystemSettingsProvider({ children }: { children: React.ReactNode }) {
  const [snap, setSnap] = useState<Snapshot>(EMPTY_SNAPSHOT)

  const applySnapshot = useCallback((s: Snapshot) => {
    setSnap(s)
    applyThemeToDocument(s.theme)
    document.title = `${s.systemName} — Fidelidade que Premia`
    applyFavicon(s.iconUrl ?? DEFAULT_ICON_HREF)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const s = await fetchSnapshot()
        if (!cancelled && s) {
          applySnapshot(s)
        } else {
          applyThemeToDocument(DEFAULT_THEME)
        }
      } catch {
        // Sem configuração no banco (ou falha de rede): mantém o padrão seguro.
        applyThemeToDocument(DEFAULT_THEME)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [applySnapshot])

  const applySettings = (name: string, t: string) => {
    const safeName = (name || DEFAULT_NAME).trim() || DEFAULT_NAME
    const safeTheme = t || DEFAULT_THEME
    setSnap((prev) => ({ ...prev, systemName: safeName, theme: safeTheme }))
    applyThemeToDocument(safeTheme)
    document.title = `${safeName} — Fidelidade que Premia`
  }

  const refresh = async () => {
    try {
      const s = await fetchSnapshot()
      if (s) applySnapshot(s)
    } catch (err) {
      console.warn('Erro ao recarregar configurações do sistema:', err)
    }
  }

  return (
    <SystemSettingsContext.Provider
      value={{
        systemName: snap.systemName,
        theme: snap.theme,
        logoUrl: snap.logoUrl,
        iconUrl: snap.iconUrl,
        heroImageUrl: snap.heroImageUrl,
        recordId: snap.recordId,
        applySettings,
        refresh,
      }}
    >
      {children}
    </SystemSettingsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSystemSettings() {
  return useContext(SystemSettingsContext)
}

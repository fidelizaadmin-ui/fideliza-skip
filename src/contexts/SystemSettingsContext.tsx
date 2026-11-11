import React, { createContext, useContext, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'

export interface SystemSettings {
  system_name: string
  theme: string
}

interface SystemSettingsContextValue {
  /** Nome do sistema configurado pelo admin (default: "Fideliza") */
  systemName: string
  /** Tema pré-definido ativo (default: "azul") */
  theme: string
  /** Atualiza o estado local (após o admin salvar no backend) */
  applySettings: (name: string, theme: string) => void
}

const SystemSettingsContext = createContext<SystemSettingsContextValue>({
  systemName: 'Fideliza',
  theme: 'azul',
  applySettings: () => {},
})

const DEFAULT_NAME = 'Fideliza'
const DEFAULT_THEME = 'azul'

/** Aplica o atributo data-brand-theme no <html> (troca as variáveis CSS do tema) */
export function applyThemeToDocument(theme: string) {
  const root = document.documentElement
  if (!theme || theme === 'azul') {
    root.removeAttribute('data-brand-theme')
  } else {
    root.setAttribute('data-brand-theme', theme)
  }
}

/**
 * Carrega as configurações do sistema no bootstrap do app.
 * Se o banco estiver vazio/indisponível, cai no padrão seguro:
 * nome "Fideliza" + tema azul — sem quebrar nada.
 */
export function SystemSettingsProvider({ children }: { children: React.ReactNode }) {
  const [systemName, setSystemName] = useState(DEFAULT_NAME)
  const [theme, setTheme] = useState(DEFAULT_THEME)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const list = await pb.collection('system_settings').getList<SystemSettings>(1, 1)
        const rec = list.items[0]
        if (!cancelled && rec) {
          const name = (rec.system_name || DEFAULT_NAME).trim() || DEFAULT_NAME
          const t = rec.theme || DEFAULT_THEME
          setSystemName(name)
          setTheme(t)
          applyThemeToDocument(t)
          document.title = `${name} — Fidelidade que Premia`
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
  }, [])

  const applySettings = (name: string, t: string) => {
    const safeName = (name || DEFAULT_NAME).trim() || DEFAULT_NAME
    const safeTheme = t || DEFAULT_THEME
    setSystemName(safeName)
    setTheme(safeTheme)
    applyThemeToDocument(safeTheme)
    document.title = `${safeName} — Fidelidade que Premia`
  }

  return (
    <SystemSettingsContext.Provider value={{ systemName, theme, applySettings }}>
      {children}
    </SystemSettingsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSystemSettings() {
  return useContext(SystemSettingsContext)
}

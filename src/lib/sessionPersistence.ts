/**
 * Controle de persistência da sessão ("Permanecer logado neste dispositivo").
 *
 * O SDK do PocketBase usa por padrão o LocalAuthStore, que SEMPRE grava o estado
 * de autenticação (chave "pocketbase_auth") no localStorage — ou seja, a sessão
 * sobrevive ao fechamento do navegador, mesmo quando o usuário não quer isso.
 *
 * Aqui trocamos o authStore da instância pb por um DualAuthStore, que decide ONDE
 * guardar o token conforme a escolha feita no login/cadastro:
 *  - "local"   → localStorage   → continua logado mesmo após fechar o navegador
 *  - "session" → sessionStorage → vale apenas até fechar o navegador/aba
 *
 * Importado cedo (via src/lib/pocketbase/client.ts) para que a troca aconteça
 * antes do primeiro uso do authStore.
 */
import { BaseAuthStore, type AuthRecord } from 'pocketbase'
import pb from '@/lib/pocketbase/client'

export type SessionPersistence = 'local' | 'session'

/** Mesma chave usada pelo LocalAuthStore padrão do SDK (compatível com sessões antigas). */
const AUTH_KEY = 'pocketbase_auth'

/** Lembrança da última escolha do usuário no checkbox (localStorage). */
const REMEMBER_KEY = 'fideliza_remember_me'

type StoredPayload = { token?: string; record?: AuthRecord; model?: AuthRecord }

export class DualAuthStore extends BaseAuthStore {
  private mode: SessionPersistence = 'local'
  private memoryFallback: Record<string, any> = {}

  constructor() {
    super()
    // Restaura a sessão que sobreviveu: primeiro a persistente, depois a da aba atual.
    // Isso mantém compatibilidade com sessões criadas antes deste recurso (localStorage).
    if (typeof window !== 'undefined') {
      const localData = this.readFrom(window.localStorage)
      const data = localData || this.readFrom(window.sessionStorage)
      if (data && (data.token || data.record || data.model)) {
        this.mode = localData ? 'local' : 'session'
        super.save(data.token || '', data.record || data.model || null)
        // Garante que não fiquem cópias nos dois storages ao mesmo tempo.
        this.removeFromInactive()
      }
    }
    this.bindStorageEvent()
  }

  private activeStorage(): Storage | null {
    if (typeof window === 'undefined') return null
    return this.mode === 'session' ? window.sessionStorage : window.localStorage
  }

  private inactiveStorage(): Storage | null {
    if (typeof window === 'undefined') return null
    return this.mode === 'session' ? window.localStorage : window.sessionStorage
  }

  private readFrom(storage: Storage | null): StoredPayload | null {
    if (!storage) return this.memoryFallback[AUTH_KEY] || null
    const raw = storage.getItem(AUTH_KEY) || ''
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed : null
    } catch {
      return null
    }
  }

  private readAny(): StoredPayload | null {
    return this.readFrom(window.localStorage) || this.readFrom(window.sessionStorage)
  }

  private writeToActive(data: StoredPayload | null) {
    const target = this.activeStorage()
    if (!target) {
      // Sem storage disponível (ambiente restrito): guarda só em memória.
      if (data) {
        this.memoryFallback[AUTH_KEY] = data
      } else {
        delete this.memoryFallback[AUTH_KEY]
      }
      return
    }
    try {
      if (data) {
        target.setItem(AUTH_KEY, JSON.stringify(data))
      } else {
        target.removeItem(AUTH_KEY)
      }
    } catch {
      /* quota/privacidade — mantém apenas em memória */
      if (data) this.memoryFallback[AUTH_KEY] = data
    }
  }

  private removeFromInactive() {
    const other = this.inactiveStorage()
    try {
      other?.removeItem(AUTH_KEY)
    } catch {
      /* ignora */
    }
  }

  get token(): string {
    return this.readAny()?.token || ''
  }

  get record(): AuthRecord {
    const data = this.readAny()
    return data?.record || data?.model || null
  }

  save(token: string, record?: AuthRecord) {
    this.writeToActive({ token: token || '', record: record || null })
    super.save(token, record)
  }

  clear() {
    // Apaga de TODOS os lugares: o logout sempre desloga de verdade.
    try {
      window.localStorage.removeItem(AUTH_KEY)
      window.sessionStorage.removeItem(AUTH_KEY)
    } catch {
      /* ignora */
    }
    delete this.memoryFallback[AUTH_KEY]
    super.clear()
  }

  /**
   * Move a sessão atual para o storage do modo escolhido ("permanecer logado").
   * Chamado logo após authWithPassword/authRefresh quando o modo muda.
   */
  relocate(mode: SessionPersistence) {
    const data = this.readAny()
    const hadData = !!(data && data.token)
    this.mode = mode
    if (hadData) {
      this.writeToActive(data)
    }
    this.removeFromInactive()
  }

  currentMode(): SessionPersistence {
    return this.mode
  }

  /**
   * Sincroniza o estado quando OUTRA aba altera o localStorage (mesma chave).
   */
  private bindStorageEvent() {
    if (typeof window === 'undefined' || !window.addEventListener) return
    window.addEventListener('storage', (e) => {
      if (e.key !== AUTH_KEY || e.storageArea !== window.localStorage) return
      const data = this.readAny()
      if (data && (data.token || data.record || data.model)) {
        this.mode = 'local'
        super.save(data.token || '', data.record || data.model || null)
      } else {
        super.clear()
      }
    })
  }
}

// Substitui o authStore padrão da instância pelo store com dupla persistência.
export function installDualAuthStore() {
  try {
    const store = pb.authStore as unknown
    if (store instanceof DualAuthStore) return
    pb.authStore = new DualAuthStore()
  } catch {
    /* instância imutável — mantém o comportamento padrão do SDK */
  }
}

// Executa no carregamento do módulo (importado cedo, antes do primeiro render).
installDualAuthStore()

/** Última escolha do usuário no checkbox "Permanecer logado" (padrão: marcado). */
export function getRememberMePreference(): boolean {
  try {
    return window.localStorage.getItem(REMEMBER_KEY) !== '0'
  } catch {
    return true
  }
}

export function setRememberMePreference(remember: boolean) {
  try {
    window.localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0')
  } catch {
    /* ignora */
  }
}

/** Volta ao padrão (marcado) — usado no logout. */
export function clearRememberMePreference() {
  try {
    window.localStorage.removeItem(REMEMBER_KEY)
  } catch {
    /* ignora */
  }
}

/**
 * Aplica o modo de persistência à sessão atual. Chamar DEPOIS de um login bem-sucedido
 * (ou do authRefresh), com a escolha do usuário.
 */
export function applySessionPersistence(remember: boolean) {
  setRememberMePreference(remember)
  const store = pb.authStore as unknown
  if (store instanceof DualAuthStore) {
    store.relocate(remember ? 'local' : 'session')
  }
}

/** Modo de persistência da sessão atual (para diagnóstico/exibição). */
export function currentSessionPersistence(): SessionPersistence {
  const store = pb.authStore as unknown
  return store instanceof DualAuthStore ? store.currentMode() : 'local'
}

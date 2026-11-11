import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  /** Título exibido no fallback (contextualiza onde o erro aconteceu) */
  title?: string
  /** Isolamento: quando true, o fallback ocupa o mínimo possível (para uso dentro de abas) */
  compact?: boolean
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  message: string
}

/**
 * ErrorBoundary genérico: captura erros de renderização em tempo de execução
 * e exibe um fallback legível (com o erro e um botão de recarregar) em vez de
 * deixar a tela em branco. Usado no painel /admin (rota inteira) e isolado
 * dentro da aba Configurações, para que um erro pontual não derrube o painel.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Erro desconhecido'
    return { hasError: true, message }
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    // Log no console para diagnóstico (aparece no DevTools do navegador)
    console.error('[ErrorBoundary]', error, info?.componentStack)
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    if (this.props.compact) {
      return (
        <div className="p-6 rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 space-y-3">
          <p className="font-bold text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {this.props.title || 'Esta seção não pôde ser carregada'}
          </p>
          <p className="text-xs font-mono break-words text-amber-800">{this.state.message}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={this.handleReload}
            className="gap-2 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Recarregar página
          </Button>
        </div>
      )
    }

    return (
      <div className="container mx-auto px-4 py-16 max-w-xl flex-1">
        <div className="p-8 rounded-3xl border border-amber-200 bg-amber-50 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-black text-slate-900">
            {this.props.title || 'Algo deu errado nesta página'}
          </h1>
          <p className="text-sm text-slate-600">
            Ocorreu um erro inesperado ao renderizar esta tela. Tente recarregar a página — se o
            problema persistir, o detalhe técnico abaixo ajuda no diagnóstico.
          </p>
          <p className="text-xs font-mono break-words text-amber-800 bg-white/70 border border-amber-200 rounded-xl p-3 text-left">
            {this.state.message}
          </p>
          <Button
            type="button"
            onClick={this.handleReload}
            className="gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold"
          >
            <RefreshCw className="w-4 h-4" />
            Recarregar página
          </Button>
        </div>
      </div>
    )
  }
}

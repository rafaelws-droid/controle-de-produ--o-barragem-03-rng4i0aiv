import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: React.ReactNode
}

interface State {
  temErro: boolean
}

/**
 * Se uma tela falhar ao renderizar (dado inesperado do banco, erro de
 * programação), o app não fica em branco: mostra a mensagem e um botão para
 * recarregar — os dados estão salvos.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { temErro: false }

  static getDerivedStateFromError(): State {
    return { temErro: true }
  }

  componentDidCatch(error: unknown) {
    console.error('Erro de renderização:', error)
  }

  render() {
    if (this.state.temErro) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <div className="flex max-w-md flex-col items-center justify-center rounded-xl border border-red-200 bg-white p-10 text-center">
            <AlertCircle className="mb-3 h-12 w-12 text-red-400" />
            <h2 className="mb-1 text-base font-semibold text-slate-800">
              Algo deu errado nesta tela
            </h2>
            <p className="mb-5 text-sm text-slate-500">
              Ocorreu um erro inesperado ao exibir a página. Tente recarregar — seus dados estão
              salvos.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              Recarregar tela
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary

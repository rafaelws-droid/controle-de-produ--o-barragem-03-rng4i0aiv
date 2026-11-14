import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  title: string
  message: string
  onRetry?: () => void
}

export function LoadError({ title, message, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-white p-10 text-center">
      <AlertCircle className="mb-3 h-12 w-12 text-red-400" />
      <h3 className="mb-1 text-base font-semibold text-slate-800">{title}</h3>
      <p className="mb-5 max-w-md text-sm text-slate-500">{message}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
      )}
    </div>
  )
}

export default LoadError

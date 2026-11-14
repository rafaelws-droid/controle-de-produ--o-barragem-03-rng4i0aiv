import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="text-center">
        <p className="text-5xl font-bold text-blue-600">404</p>
        <h1 className="mt-2 text-lg font-semibold text-slate-800">Página não encontrada</h1>
        <p className="mt-1 text-sm text-slate-500">O endereço acessado não existe neste sistema.</p>
        <Link
          to="/"
          className="mt-5 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}

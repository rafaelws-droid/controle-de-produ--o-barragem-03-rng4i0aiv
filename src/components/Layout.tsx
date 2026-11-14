import { Outlet, useLocation } from 'react-router-dom'
import { Navbar } from './Navbar'

export default function Layout() {
  const location = useLocation()

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar />
      {/* key por rota: a tela é remontada a cada navegação, então clicar no menu
          sempre recarrega os dados — inclusive no item em que já se está. */}
      <main
        key={location.pathname}
        className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      >
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        Controle de Produção — Barragem 03 • Silveira Transportes
      </footer>
    </div>
  )
}

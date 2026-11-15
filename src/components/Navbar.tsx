import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard,
  PlusCircle,
  History,
  FileBarChart,
  Truck,
  Users,
  LogOut,
  HardHat,
  ShieldCheck,
  Gauge,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

function iniciais(name: string, email: string): string {
  const fonte = name && name !== email ? name : email
  const partes = fonte
    .replace(/@.*/, '')
    .split(/[\s._-]+/)
    .filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[1][0]).toUpperCase()
}

const NAV = [
  { label: 'Início', path: '/', icon: LayoutDashboard },
  { label: 'Novo Lançamento', path: '/novo', icon: PlusCircle },
  { label: 'Lançamentos', path: '/lancamentos', icon: History },
  { label: 'Relatório', path: '/relatorio', icon: FileBarChart },
  { label: 'Horímetros', path: '/horimetros', icon: Gauge },
  { label: 'Equipamentos', path: '/equipamentos', icon: Truck },
  { label: 'Operadores', path: '/operadores', icon: Users },
  { label: 'Acessos', path: '/usuarios', icon: ShieldCheck, soGestor: true },
]

export function Navbar() {
  const { user, logout, ehGestor } = useAuth()
  const location = useLocation()
  const itens = NAV.filter((i) => !i.soGestor || ehGestor)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
            <HardHat className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-tight text-slate-900">
              Silveira · Produção
            </span>
            <span className="text-xs font-medium text-slate-500">Barragem 03</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {itens.map((item) => {
            const Icon = item.icon
            const ativo = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  ativo
                    ? 'bg-blue-50 font-semibold text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${ativo ? 'text-blue-600' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {user && (
            <Link
              to="/trocar-senha"
              className="flex items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-slate-100"
              title="Trocar minha senha"
            >
              <div className="flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                {iniciais(user.name, user.email)}
              </div>
              <div className="hidden min-w-0 flex-col items-start text-xs sm:flex">
                <span className="max-w-[150px] truncate font-semibold leading-tight text-slate-800">
                  {user.name || user.email}
                </span>
                <span className="max-w-[150px] truncate text-slate-500">
                  {ehGestor ? 'Gestor' : 'Lançador'} · {user.email}
                </span>
              </div>
            </Link>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="flex items-center gap-1.5 text-slate-700 hover:border-red-200 hover:text-red-600"
            title="Sair do sistema"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/80 px-2 py-1.5 md:hidden">
        <div className="grid grid-cols-3 gap-1 text-center">
          {itens.map((item) => {
            const Icon = item.icon
            const ativo = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center rounded px-1 py-1.5 text-xs transition-colors ${
                  ativo
                    ? 'bg-blue-100/70 font-semibold text-blue-700'
                    : 'text-slate-600 hover:bg-slate-200/50'
                }`}
              >
                <Icon className={`mb-0.5 h-4 w-4 ${ativo ? 'text-blue-600' : 'text-slate-500'}`} />
                <span className="w-full truncate text-[11px]">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </header>
  )
}

export default Navbar

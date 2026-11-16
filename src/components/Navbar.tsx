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
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LogoImagem, AZUL_MARCA, AMARELO_MARCA } from '@/components/Logo'

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

interface ItemNav {
  label: string
  path: string
  icon: typeof LayoutDashboard
  soGestor?: boolean
  /** rotas que tambem marcam este item como ativo */
  tambemAtivo?: string[]
}

const NAV: ItemNav[] = [
  { label: 'Início', path: '/', icon: LayoutDashboard },
  // Dashboard: leitura visual com filtro de equipamento, frente, operador e periodo.
  { label: 'Dashboard', path: '/dashboard', icon: BarChart3 },
  { label: 'Novo Lançamento', path: '/novo', icon: PlusCircle },
  { label: 'Lançamentos', path: '/lancamentos', icon: History },
  // Producao e horimetros ficam na MESMA tela, em abas: sao dois assuntos de
  // relatorio, nao dois sistemas. As rotas antigas continuam validas.
  {
    label: 'Relatórios',
    path: '/relatorios',
    icon: FileBarChart,
    tambemAtivo: ['/relatorio', '/horimetros'],
  },
  { label: 'Horímetro', path: '/horimetro', icon: Gauge },
  { label: 'Equipamentos', path: '/equipamentos', icon: Truck },
  { label: 'Operadores', path: '/operadores', icon: Users },
  { label: 'Acessos', path: '/usuarios', icon: ShieldCheck, soGestor: true },
]

export function Navbar() {
  const { user, logout, ehGestor } = useAuth()
  const location = useLocation()
  const itens = NAV.filter((i) => !i.soGestor || ehGestor)

  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-white/10 shadow-sm backdrop-blur"
      style={{ backgroundColor: 'rgba(27,21,71,0.95)' }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <LogoImagem altura={40} />
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-tight text-white">
              Silveira · Produção
            </span>
            <span className="text-xs font-medium text-slate-300">Barragem 03</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {itens.map((item) => {
            const Icon = item.icon
            // Item com rotas irmas fica marcado tambem quando uma delas esta aberta,
            // senao o menu parece nao ter nada selecionado.
            const ativo =
              location.pathname === item.path ||
              (item.tambemAtivo?.includes(location.pathname) ?? false)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  ativo
                    ? 'bg-white/15 font-semibold text-white'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4`} style={{ color: ativo ? AMARELO_MARCA : undefined }} />
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
              <div
                className="flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-full text-xs font-bold"
                style={{ backgroundColor: AMARELO_MARCA, color: AZUL_MARCA }}
              >
                {iniciais(user.name, user.email)}
              </div>
              <div className="hidden min-w-0 flex-col items-start text-xs sm:flex">
                <span className="max-w-[150px] truncate font-semibold leading-tight text-white">
                  {user.name || user.email}
                </span>
                <span className="max-w-[150px] truncate text-slate-300">
                  {ehGestor ? 'Gestor' : 'Lançador'} · {user.email}
                </span>
              </div>
            </Link>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="flex items-center gap-1.5 border-white/20 bg-transparent text-slate-200 hover:border-red-300 hover:text-red-300"
            title="Sair do sistema"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>

      <div className="border-t border-white/10 bg-white/5 px-2 py-1.5 md:hidden">
        <div className="grid grid-cols-3 gap-1 text-center">
          {itens.map((item) => {
            const Icon = item.icon
            const ativo =
              location.pathname === item.path ||
              (item.tambemAtivo?.includes(location.pathname) ?? false)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center rounded px-1 py-1.5 text-xs transition-colors ${
                  ativo
                    ? 'bg-white/15 font-semibold text-white'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <Icon
                  className="mb-0.5 h-4 w-4"
                  style={{ color: ativo ? AMARELO_MARCA : undefined }}
                />
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

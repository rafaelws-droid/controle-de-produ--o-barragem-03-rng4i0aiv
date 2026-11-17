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
  /** rótulo curto usado quando o espaço aperta */
  curto?: string
  path: string
  icon: typeof LayoutDashboard
  soGestor?: boolean
  /** rotas que tambem marcam este item como ativo */
  tambemAtivo?: string[]
}

const NAV: ItemNav[] = [
  { label: 'Início', path: '/', icon: LayoutDashboard },
  { label: 'Dashboard', path: '/dashboard', icon: BarChart3 },
  { label: 'Novo Lançamento', curto: 'Novo', path: '/novo', icon: PlusCircle },
  { label: 'Lançamentos', path: '/lancamentos', icon: History },
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

/**
 * Cabeçalho do Controle de Produção.
 *
 * DISTRIBUIÇÃO (corrigida em 16/11): antes a marca ocupava muito espaço porque
 * repetia o nome que já está na logo ("Silveira · Produção"), e o menu encostava
 * nela. Agora são três blocos com folga:
 *
 *   [ logo + Barragem 03 ]   |   [ menu, ocupando o meio ]   |   [ usuário + sair ]
 *
 * O menu tem respiro próprio e, se ainda faltar espaço (telas menores), some
 * o texto dos itens e ficam os ícones — nunca um em cima do outro.
 */
export function Navbar() {
  const { user, logout, ehGestor } = useAuth()
  const location = useLocation()
  const itens = NAV.filter((i) => !i.soGestor || ehGestor)

  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-white/10 shadow-sm backdrop-blur"
      style={{ backgroundColor: 'rgba(27,21,71,0.97)' }}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-3 sm:px-5 lg:px-6">
        {/* ---------- 1. marca ---------- */}
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90"
          title="Início"
        >
          <LogoImagem altura={38} />
          {/* a logo já diz SILVEIRA: aqui só o que identifica ESTE sistema */}
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="whitespace-nowrap text-[13px] font-bold tracking-tight text-white">
              Controle de Produção
            </span>
            <span className="whitespace-nowrap text-[10.5px] font-medium text-slate-300">
              Barragem 03
            </span>
          </div>
        </Link>

        <span className="hidden h-8 w-px shrink-0 bg-white/15 lg:block" />

        {/* ---------- 2. menu (meio, com folga) ---------- */}
        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 md:flex">
          {itens.map((item) => {
            const Icon = item.icon
            const ativo =
              location.pathname === item.path ||
              (item.tambemAtivo?.includes(location.pathname) ?? false)
            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.label}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1.5 text-[12.5px] font-medium transition-colors xl:gap-2 xl:px-2.5 xl:text-[13px] ${
                  ativo
                    ? 'bg-white/15 font-semibold text-white'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon
                  className="h-[15px] w-[15px] shrink-0"
                  style={{ color: ativo ? AMARELO_MARCA : undefined }}
                />
                {/* entre md e xl o texto curto evita que o menu aperte */}
                <span className="hidden xl:inline">{item.label}</span>
                <span className="hidden md:inline xl:hidden">{item.curto ?? item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* ---------- 3. usuário e sair ---------- */}
        <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
          {user && (
            <Link
              to="/trocar-senha"
              className="flex items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-white/10"
              title={`${user.name || user.email} — trocar minha senha`}
            >
              <div
                className="flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-full text-xs font-bold"
                style={{ backgroundColor: AMARELO_MARCA, color: AZUL_MARCA }}
              >
                {iniciais(user.name, user.email)}
              </div>
              <div className="hidden min-w-0 flex-col items-start text-xs 2xl:flex">
                <span className="max-w-[130px] truncate font-semibold leading-tight text-white">
                  {user.name || user.email}
                </span>
                <span className="max-w-[130px] truncate text-[10px] text-slate-300">
                  {ehGestor ? 'Gestor' : 'Lançador'}
                </span>
              </div>
            </Link>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="flex items-center gap-1.5 border-white/20 bg-transparent px-2 text-slate-200 hover:border-red-300 hover:text-red-300"
            title="Sair do sistema"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden xl:inline">Sair</span>
          </Button>
        </div>
      </div>

      {/* ---------- menu do celular ---------- */}
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
                <span className="w-full truncate text-[10.5px]">{item.curto ?? item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </header>
  )
}

export default Navbar

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  HardHat,
  PlusCircle,
  History,
  Truck,
  Gauge,
  CalendarDays,
  TrendingUp,
  Loader2,
  ArrowRight,
  Route,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadError } from '@/components/LoadError'
import { frentesService, lancamentosService } from '@/services/producao'
import { formatDataBR, formatHoras, nomeEquipamento, nomeOperador } from '@/lib/exportUtils'
import type { Frente, Lancamento } from '@/types'

/** Primeiro dia do mês corrente (YYYY-MM-DD). */
function inicioDoMes(): string {
  const hoje = new Date()
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
}

export default function Index() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [frentes, setFrentes] = useState<Frente[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)

  const carregar = async () => {
    try {
      setCarregando(true)
      setErro(false)
      const [ls, fs] = await Promise.all([lancamentosService.getAll(), frentesService.getAll()])
      setLancamentos(ls)
      setFrentes(fs)
    } catch (e) {
      console.error(e)
      setErro(true)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    void carregar()
  }, [])

  const inicioMes = inicioDoMes()

  const doMes = useMemo(
    () => lancamentos.filter((l) => l.data >= inicioMes),
    [lancamentos, inicioMes],
  )

  const hoje = new Date().toISOString().split('T')[0]
  const deHoje = useMemo(() => lancamentos.filter((l) => l.data === hoje), [lancamentos, hoje])

  const horasMes = doMes.reduce((a, l) => a + (l.horas || 0), 0)
  const viagensMes = doMes.reduce((a, l) => a + (l.viagens || 0), 0)

  /** Progresso da garantia mensal por frente (usando os lançamentos do mês). */
  const progresso = useMemo(() => {
    const porFrente = new Map<string, number>()
    for (const l of doMes) {
      porFrente.set(l.frente, (porFrente.get(l.frente) || 0) + (l.horas || 0))
    }
    return frentes
      .map((f) => {
        const feito = Number((porFrente.get(f.id) || 0).toFixed(2))
        const garantia = f.garantia_horas || 0
        const pct = garantia > 0 ? Math.min(100, (feito / garantia) * 100) : 0
        return { frente: f, feito, garantia, pct, falta: Math.max(0, garantia - feito) }
      })
      .sort((a, b) => b.pct - a.pct)
  }, [doMes, frentes])

  const recentes = useMemo(
    () => [...lancamentos].sort((a, b) => (a.data < b.data ? 1 : -1)).slice(0, 6),
    [lancamentos],
  )

  if (carregando) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-12">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
          <p className="text-sm">Carregando painel de produção...</p>
        </div>
      </div>
    )
  }

  if (erro) {
    return (
      <LoadError
        title="Erro ao carregar o painel"
        message="Não foi possível buscar os lançamentos. Verifique sua conexão e tente novamente."
        onRetry={carregar}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            <HardHat className="h-7 w-7 text-blue-600" />
            Produção Barragem 03
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Lançamento diário de horas, viagens e serviços por equipamento.
          </p>
        </div>
        <Button
          asChild
          className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          <Link to="/novo">
            <PlusCircle className="h-4 w-4" />
            Lançar Produção
          </Link>
        </Button>
      </div>

      {/* Indicadores do mês */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <CalendarDays className="h-4 w-4 text-blue-500" />
              Lançamentos do mês
            </div>
            <p className="mt-1 text-2xl font-bold text-slate-900">{doMes.length}</p>
            <p className="text-[11px] text-slate-500">{deHoje.length} hoje</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Gauge className="h-4 w-4 text-emerald-500" />
              Horas no mês
            </div>
            <p className="mt-1 text-2xl font-bold text-slate-900">{formatHoras(horasMes)} h</p>
            <p className="text-[11px] text-slate-500">soma dos horímetros</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Route className="h-4 w-4 text-purple-500" />
              Viagens no mês
            </div>
            <p className="mt-1 text-2xl font-bold text-slate-900">{viagensMes}</p>
            <p className="text-[11px] text-slate-500">caminhões</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              Frentes ativas
            </div>
            <p className="mt-1 text-2xl font-bold text-slate-900">{progresso.length}</p>
            <p className="text-[11px] text-slate-500">com garantia mensal</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Garantia de horas por frente */}
        <Card className="border-slate-200 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">
              Garantia de horas mensais por frente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {progresso.length === 0 && (
              <p className="text-sm text-slate-500">Nenhuma frente cadastrada.</p>
            )}
            {progresso.map(({ frente, feito, garantia, pct, falta }) => (
              <div key={frente.id}>
                <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                  <span className="truncate font-medium text-slate-700">{frente.nome}</span>
                  <span className="shrink-0 tabular-nums text-slate-500">
                    <b className="text-slate-800">{formatHoras(feito)}</b> / {formatHoras(garantia)}{' '}
                    h
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${
                      pct >= 100 ? 'bg-emerald-500' : pct >= 70 ? 'bg-blue-500' : 'bg-amber-400'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {pct >= 100
                    ? 'Garantia atingida'
                    : `Faltam ${formatHoras(falta)} h (${pct.toFixed(0)}%)`}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Últimos lançamentos */}
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">
              Últimos lançamentos
            </CardTitle>
            <Link
              to="/lancamentos"
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {recentes.length === 0 && (
              <p className="text-sm text-slate-500">Nenhum lançamento ainda.</p>
            )}
            {recentes.map((l) => (
              <div
                key={l.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-800">
                    {nomeEquipamento(l)} · {nomeOperador(l)}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">
                    {formatDataBR(l.data)} · {l.expand?.frente?.nome || '-'}
                  </p>
                </div>
                <span className="shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-[11px] font-bold text-blue-700">
                  {formatHoras(l.horas)} h
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Ações rápidas */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          to="/novo"
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md"
        >
          <PlusCircle className="h-8 w-8 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-slate-800">Lançar produção</p>
            <p className="text-xs text-slate-500">Registro diário por equipamento</p>
          </div>
        </Link>
        <Link
          to="/relatorio"
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md"
        >
          <History className="h-8 w-8 text-emerald-600" />
          <div>
            <p className="text-sm font-semibold text-slate-800">Relatório e exportação</p>
            <p className="text-xs text-slate-500">PDF, Excel e CSV por período</p>
          </div>
        </Link>
        <Link
          to="/equipamentos"
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md"
        >
          <Truck className="h-8 w-8 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-slate-800">Equipamentos e frentes</p>
            <p className="text-xs text-slate-500">Cadastro e garantia de horas</p>
          </div>
        </Link>
      </div>
    </div>
  )
}

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
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadError } from '@/components/LoadError'
import { frentesService, lancamentosService } from '@/services/producao'
import { formatDataBR, formatHoras, nomeEquipamento, nomeOperador } from '@/lib/exportUtils'
import type { Frente, Lancamento } from '@/types'

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/**
 * Ciclo de faturamento do contrato: do dia 20 ao dia 19 do mes seguinte,
 * igual ao periodo da planilha oficial ("PERIODO 20/10 a 19/11/2026").
 * Se hoje e antes do dia 20, o ciclo comecou no dia 20 do mes anterior.
 */
function cicloAtual(): { de: string; ate: string; rotulo: string } {
  const hoje = new Date()
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 20)
  if (hoje.getDate() < 20) inicio.setMonth(inicio.getMonth() - 1)
  const fim = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 19)
  return {
    de: iso(inicio),
    ate: iso(fim),
    rotulo: `Ciclo ${formatDataBR(iso(inicio))} a ${formatDataBR(iso(fim))}`,
  }
}

function mesCivil(): { de: string; ate: string; rotulo: string } {
  const hoje = new Date()
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
  return {
    de: iso(inicio),
    ate: iso(fim),
    rotulo: `Mes de ${inicio.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
  }
}

type Modo = 'ciclo' | 'mes' | 'tudo' | 'periodo'

/** Data ISO de hoje, no fuso do aparelho. */
const hojeISO = () => iso(new Date())

export default function Index() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [frentes, setFrentes] = useState<Frente[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)
  const [modo, setModo] = useState<Modo>('ciclo')

  // Intervalo livre: o mesmo "De / Ate" do relatorio, trazido para o painel.
  // Comeca preenchido com o ciclo atual, para o campo nunca abrir vazio.
  const [deCustom, setDeCustom] = useState(() => cicloAtual().de)
  const [ateCustom, setAteCustom] = useState(() => hojeISO())

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

  const periodo = useMemo(() => {
    if (modo === 'ciclo') return cicloAtual()
    if (modo === 'mes') return mesCivil()
    if (modo === 'periodo') {
      // O usuario escolheu as duas pontas na mao.
      const de = deCustom
      const ate = ateCustom
      if (!de && !ate) return { de: '', ate: '', rotulo: 'Periodo em branco' }
      return {
        de,
        ate,
        rotulo: `${de ? formatDataBR(de) : 'inicio'} a ${ate ? formatDataBR(ate) : 'hoje'}`,
      }
    }
    const datas = lancamentos.map((l) => l.data).sort()
    if (datas.length === 0) return { de: '', ate: '', rotulo: 'Sem lancamentos' }
    return {
      de: datas[0],
      ate: datas[datas.length - 1],
      rotulo: `Tudo: ${formatDataBR(datas[0])} a ${formatDataBR(datas[datas.length - 1])}`,
    }
  }, [modo, lancamentos, deCustom, ateCustom])

  /** Intervalo invalido: o usuario inverteu as datas. */
  const intervaloInvalido = modo === 'periodo' && !!deCustom && !!ateCustom && deCustom > ateCustom

  const doPeriodo = useMemo(() => {
    if (intervaloInvalido) return []
    return lancamentos.filter(
      (l) => (!periodo.de || l.data >= periodo.de) && (!periodo.ate || l.data <= periodo.ate),
    )
  }, [lancamentos, periodo, intervaloInvalido])

  const hoje = iso(new Date())
  const deHoje = useMemo(() => lancamentos.filter((l) => l.data === hoje), [lancamentos, hoje])

  const horasPeriodo = doPeriodo.reduce((a, l) => a + (l.horas || 0), 0)
  const viagensPeriodo = doPeriodo.reduce((a, l) => a + (l.viagens || 0), 0)

  /**
   * Progresso da garantia por frente no periodo escolhido.
   * A porcentagem NAO e limitada a 100%: quando a frente passa da garantia,
   * isso precisa aparecer, nao ser escondido.
   */
  const progresso = useMemo(() => {
    const porFrente = new Map<string, number>()
    for (const l of doPeriodo) {
      porFrente.set(l.frente, (porFrente.get(l.frente) || 0) + (l.horas || 0))
    }
    return frentes
      .map((f) => {
        const feito = Number((porFrente.get(f.id) || 0).toFixed(2))
        const garantia = f.garantia_horas || 0
        const pct = garantia > 0 ? (feito / garantia) * 100 : 0
        return {
          frente: f,
          feito,
          garantia,
          pct,
          falta: Math.max(0, garantia - feito),
          excedente: Math.max(0, feito - garantia),
        }
      })
      .sort((a, b) => b.pct - a.pct)
  }, [doPeriodo, frentes])

  /**
   * "Ultimos lancamentos" passa a respeitar o periodo escolhido: consultando
   * um mes antigo, a lista mostra o que foi lancado naquele mes, nao o de hoje.
   */
  const recentes = useMemo(
    () => [...doPeriodo].sort((a, b) => (a.data < b.data ? 1 : -1)).slice(0, 6),
    [doPeriodo],
  )

  if (carregando) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-12">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
          <p className="text-sm">Carregando painel de producao...</p>
        </div>
      </div>
    )
  }

  if (erro) {
    return (
      <LoadError
        title="Erro ao carregar o painel"
        message="Nao foi possivel buscar os lancamentos. Verifique sua conexao e tente novamente."
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
            Producao Barragem 03
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Lancamento diario de horas, viagens e servicos por equipamento.
          </p>
        </div>
        <Button
          asChild
          className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          <Link to="/novo">
            <PlusCircle className="h-4 w-4" />
            Lancar Producao
          </Link>
        </Button>
      </div>

      {/* Seletor de periodo: o mesmo numero pode ser lido de tres jeitos */}
      <Card className="border-slate-200">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Periodo somado
            </p>
            <p className="text-sm font-semibold text-slate-800">{periodo.rotulo}</p>
            <p className="text-[11px] text-slate-500">
              {doPeriodo.length} lancamento(s) neste periodo
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={modo === 'ciclo' ? 'default' : 'outline'}
              onClick={() => setModo('ciclo')}
              className={modo === 'ciclo' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
            >
              Ciclo do contrato (20 a 19)
            </Button>
            <Button
              size="sm"
              variant={modo === 'mes' ? 'default' : 'outline'}
              onClick={() => setModo('mes')}
              className={modo === 'mes' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
            >
              Mes civil
            </Button>
            <Button
              size="sm"
              variant={modo === 'periodo' ? 'default' : 'outline'}
              onClick={() => setModo('periodo')}
              className={
                modo === 'periodo'
                  ? 'flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700'
                  : 'flex items-center gap-2'
              }
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Escolher periodo
            </Button>
            <Button
              size="sm"
              variant={modo === 'tudo' ? 'default' : 'outline'}
              onClick={() => setModo('tudo')}
              className={modo === 'tudo' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
            >
              Tudo
            </Button>
          </div>
        </CardContent>

        {/* Filtro de datas: aparece so quando "Escolher periodo" esta ativo. */}
        {modo === 'periodo' && (
          <CardContent className="border-t border-slate-100 bg-slate-50/60 p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="de" className="text-xs font-semibold text-slate-700">
                  De
                </Label>
                <Input
                  id="de"
                  type="date"
                  value={deCustom}
                  max={ateCustom || undefined}
                  onChange={(e) => setDeCustom(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ate" className="text-xs font-semibold text-slate-700">
                  Ate
                </Label>
                <Input
                  id="ate"
                  type="date"
                  value={ateCustom}
                  min={deCustom || undefined}
                  onChange={(e) => setAteCustom(e.target.value)}
                />
              </div>
              <div className="flex items-end gap-2 sm:col-span-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const c = cicloAtual()
                    setDeCustom(c.de)
                    setAteCustom(c.ate)
                  }}
                >
                  Ciclo atual
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const h = new Date()
                    const inicio = new Date(h.getFullYear(), h.getMonth(), 1)
                    setDeCustom(iso(inicio))
                    setAteCustom(hojeISO())
                  }}
                >
                  Este mes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const h = new Date()
                    const inicio = new Date(h.getFullYear(), h.getMonth() - 1, 1)
                    const fim = new Date(h.getFullYear(), h.getMonth(), 0)
                    setDeCustom(iso(inicio))
                    setAteCustom(iso(fim))
                  }}
                >
                  Mes passado
                </Button>
              </div>
            </div>

            <p className="mt-2 text-[11px] text-slate-500">
              Escolha as duas datas. Todos os numeros e a lista de lancamentos abaixo passam a somar
              somente o intervalo selecionado. O Painel abre sempre no ciclo do contrato (dia 20 a
              dia 19), que e o periodo de faturamento.
            </p>
          </CardContent>
        )}
      </Card>

      {intervaloInvalido && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-2 p-3 text-xs font-medium text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            A data inicial e maior que a final. Ajuste o intervalo para ver os dados.
          </CardContent>
        </Card>
      )}

      {/* Indicadores do periodo */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <CalendarDays className="h-4 w-4 text-blue-500" />
              Lancamentos
            </div>
            <p className="mt-1 text-2xl font-bold text-slate-900">{doPeriodo.length}</p>
            <p className="text-[11px] text-slate-500">{deHoje.length} hoje</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Gauge className="h-4 w-4 text-emerald-500" />
              Horas no periodo
            </div>
            <p className="mt-1 text-2xl font-bold text-slate-900">{formatHoras(horasPeriodo)} h</p>
            <p className="text-[11px] text-slate-500">soma dos horimetros</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Route className="h-4 w-4 text-purple-500" />
              Viagens
            </div>
            <p className="mt-1 text-2xl font-bold text-slate-900">{viagensPeriodo}</p>
            <p className="text-[11px] text-slate-500">caminhoes</p>
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
              Garantia de horas por frente
            </CardTitle>
            <p className="text-[11px] text-slate-500">
              Percentual calculado sobre {periodo.rotulo.toLowerCase()}
            </p>
            {doPeriodo.length > 0 && (
              <Link
                to={`/relatorio?de=${periodo.de}&ate=${periodo.ate}`}
                className="text-[11px] font-medium text-blue-600 hover:underline"
              >
                Abrir este periodo no relatorio
              </Link>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {progresso.length === 0 && (
              <p className="text-sm text-slate-500">Nenhuma frente cadastrada.</p>
            )}
            {progresso.map(({ frente, feito, garantia, pct, falta, excedente }) => (
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
                      excedente > 0
                        ? 'bg-red-500'
                        : pct >= 100
                          ? 'bg-emerald-500'
                          : pct >= 70
                            ? 'bg-blue-500'
                            : 'bg-amber-400'
                    }`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <p
                  className={`mt-0.5 text-[11px] ${
                    excedente > 0 ? 'font-semibold text-red-600' : 'text-slate-400'
                  }`}
                >
                  {excedente > 0 ? (
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Estourou a garantia em {formatHoras(excedente)} h ({pct.toFixed(0)}%)
                    </span>
                  ) : pct >= 100 ? (
                    'Garantia atingida'
                  ) : (
                    `Faltam ${formatHoras(falta)} h (${pct.toFixed(0)}%)`
                  )}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Ultimos lancamentos */}
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">
              Ultimos lancamentos
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
              <p className="text-sm text-slate-500">Nenhum lancamento ainda.</p>
            )}
            {recentes.map((l) => (
              <div
                key={l.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-800">
                    {nomeEquipamento(l)} - {nomeOperador(l)}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">
                    {formatDataBR(l.data)} - {l.expand?.frente?.nome || '-'}
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

      {/* Acoes rapidas */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          to="/novo"
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md"
        >
          <PlusCircle className="h-8 w-8 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-slate-800">Lancar producao</p>
            <p className="text-xs text-slate-500">Registro diario por equipamento</p>
          </div>
        </Link>
        <Link
          to="/relatorio"
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md"
        >
          <History className="h-8 w-8 text-emerald-600" />
          <div>
            <p className="text-sm font-semibold text-slate-800">Relatorio e exportacao</p>
            <p className="text-xs text-slate-500">PDF, Excel e CSV por periodo</p>
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

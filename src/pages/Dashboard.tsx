/**
 * Dashboard de produção — leitura visual do Controle de Produção.
 *
 * Responde, com filtro de equipamento, frente, operador e período:
 *  - quanto rodou (horas, dias com apontamento, média por dia)
 *  - quanto produziu (viagens, viagens por hora, por dia)
 *  - como evolui no tempo (horas e viagens por dia)
 *  - onde o tempo foi (horas por equipamento / por frente / por operador)
 *  - o que aconteceu fora do normal (manutenção, refeição, abastecimento,
 *    disposição, dias sem apontamento, horímetro incoerente)
 *
 * Regra de ouro desta tela: todo número é soma do que está lançado. Nada é
 * estimado. Quando o dado não permite o cálculo (divisão por zero, equipamento
 * parado), a tela diz "—" em vez de mostrar zero enganoso.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  CalendarDays,
  Loader2,
  Truck,
  Gauge,
  Route,
  Clock,
  AlertTriangle,
  Filter,
  X,
  TrendingUp,
  Users,
  Fuel,
  UtensilsCrossed,
  Wrench,
  CircleSlash,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadError } from '@/components/LoadError'
import {
  equipamentosService,
  frentesService,
  lancamentosService,
  operadoresService,
} from '@/services/producao'
import { formatDataBR, formatHoras, nomeEquipamento, nomeOperador } from '@/lib/exportUtils'
import type { Equipamento, Frente, Lancamento, Operador } from '@/types'

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Ciclo do contrato: dia 20 ao dia 19 do mês seguinte. */
function cicloAtual(): { de: string; ate: string } {
  const hoje = new Date()
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 20)
  if (hoje.getDate() < 20) inicio.setMonth(inicio.getMonth() - 1)
  const fim = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 19)
  return { de: iso(inicio), ate: iso(fim) }
}

const hojeISO = () => iso(new Date())

/** Converte 'AAAA-MM-DD' em Date local, sem deslocar fuso. */
function paraData(isoData: string): Date | null {
  const [a, m, d] = (isoData || '').slice(0, 10).split('-').map(Number)
  if (!a || !m || !d) return null
  return new Date(a, m - 1, d)
}

const numero = (v: number, dec = 0) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(
    Number.isFinite(v) ? v : 0,
  )

const CORES = [
  '#2563eb',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
]

export default function Dashboard() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [frentes, setFrentes] = useState<Frente[]>([])
  const [operadores, setOperadores] = useState<Operador[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)

  const ciclo = cicloAtual()
  const [de, setDe] = useState(ciclo.de)
  const [ate, setAte] = useState(hojeISO())
  const [equipamento, setEquipamento] = useState('')
  const [frente, setFrente] = useState('')
  const [operador, setOperador] = useState('')
  const [mostrarFiltros, setMostrarFiltros] = useState(true)

  /**
   * OTIMIZAÇÃO (24/11): o Dashboard baixava TODOS os lançamentos para filtrar no
   * navegador. Mesmo com o filtro de período na tela, a consulta trazia a coleção
   * inteira. Agora o período vai para o servidor (índice em `data`) e só os
   * cadastros — que são pequenos e mudam pouco — continuam vindo completos.
   */
  const carregar = async () => {
    try {
      setCarregando(true)
      setErro(false)
      const deBusca = de || '2020-01-01'
      const ateBusca = ate || hojeISO()
      const [ls, es, fs, os] = await Promise.all([
        lancamentosService.getPeriodo(deBusca, ateBusca),
        equipamentosService.getAll(),
        frentesService.getAll(),
        operadoresService.getAll(),
      ])
      setLancamentos(ls)
      setEquipamentos(es)
      setFrentes(fs)
      setOperadores(os)
    } catch (e) {
      console.error(e)
      setErro(true)
    } finally {
      setCarregando(false)
    }
  }

  // recarrega quando o período muda (a consulta vai ao servidor)
  useEffect(() => {
    void carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [de, ate])

  const invalido = !!de && !!ate && de > ate

  /** Linhas que entram em todos os cálculos, já filtradas. */
  const filtrados = useMemo(() => {
    if (invalido) return []
    return lancamentos.filter((l) => {
      if (de && l.data < de) return false
      if (ate && l.data > ate) return false
      if (equipamento && l.equipamento !== equipamento) return false
      if (frente && l.frente !== frente) return false
      if (operador && l.operador !== operador) return false
      return true
    })
  }, [lancamentos, de, ate, equipamento, frente, operador, invalido])

  // ---------------------------------------------------------------- agregados
  const kpi = useMemo(() => {
    const horas = filtrados.reduce((a, l) => a + (l.horas || 0), 0)
    const viagens = filtrados.reduce((a, l) => a + (l.viagens || 0), 0)
    const dias = new Set(filtrados.map((l) => l.data)).size
    const equipamentosUsados = new Set(filtrados.map((l) => l.equipamento)).size
    const operadoresUsados = new Set(filtrados.map((l) => l.operador)).size

    // contagem dos toggles — é onde o "tempo que não rendeu" aparece
    const marcas = {
      manutencao: filtrados.filter((l) => l.manutencao).length,
      refeicao: filtrados.filter((l) => l.refeicao).length,
      abastecimento: filtrados.filter((l) => l.abastecimento).length,
      disposicao: filtrados.filter((l) => l.disposicao).length,
      dds: filtrados.filter((l) => l.dds).length,
      apr: filtrados.filter((l) => l.apr).length,
      checklist: filtrados.filter((l) => l.checklist).length,
    }

    return {
      horas,
      viagens,
      dias,
      equipamentosUsados,
      operadoresUsados,
      apontamentos: filtrados.length,
      horasPorDia: dias > 0 ? horas / dias : null,
      viagensPorDia: dias > 0 ? viagens / dias : null,
      viagensPorHora: horas > 0 ? viagens / horas : null,
      horasPorEquipamento: equipamentosUsados > 0 ? horas / equipamentosUsados : null,
      marcas,
    }
  }, [filtrados])

  /** Série por dia: horas e viagens. Dia sem apontamento não entra. */
  const porDia = useMemo(() => {
    const mapa = new Map<
      string,
      { horas: number; viagens: number; apont: number; equip: Set<string> }
    >()
    for (const l of filtrados) {
      const item = mapa.get(l.data) || { horas: 0, viagens: 0, apont: 0, equip: new Set<string>() }
      item.horas += l.horas || 0
      item.viagens += l.viagens || 0
      item.apont += 1
      item.equip.add(l.equipamento)
      mapa.set(l.data, item)
    }
    return [...mapa.entries()]
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([data, v]) => ({
        data,
        rotulo: formatDataBR(data).slice(0, 5),
        horas: Number(v.horas.toFixed(2)),
        viagens: v.viagens,
        apontamentos: v.apont,
        equipamentos: v.equip.size,
      }))
  }, [filtrados])

  /** Horas por equipamento — o ranking que responde "quem rodou mais". */
  const porEquipamento = useMemo(() => {
    const mapa = new Map<
      string,
      {
        nome: string
        categoria: string
        horas: number
        viagens: number
        dias: Set<string>
        apont: number
        manut: number
      }
    >()
    for (const l of filtrados) {
      const nome = l.expand?.equipamento?.identificacao || nomeEquipamento(l)
      const item = mapa.get(nome) || {
        nome,
        categoria: l.expand?.equipamento?.categoria || '—',
        horas: 0,
        viagens: 0,
        dias: new Set<string>(),
        apont: 0,
        manut: 0,
      }
      item.horas += l.horas || 0
      item.viagens += l.viagens || 0
      item.dias.add(l.data)
      item.apont += 1
      if (l.manutencao) item.manut += 1
      mapa.set(nome, item)
    }
    return [...mapa.values()]
      .map((x) => ({
        nome: x.nome,
        categoria: x.categoria,
        horas: Number(x.horas.toFixed(2)),
        viagens: x.viagens,
        dias: x.dias.size,
        apontamentos: x.apont,
        manutencoes: x.manut,
        horasPorDia: x.dias.size > 0 ? Number((x.horas / x.dias.size).toFixed(2)) : null,
      }))
      .sort((a, b) => b.horas - a.horas)
  }, [filtrados])

  /** Horas por frente. */
  const porFrente = useMemo(() => {
    const mapa = new Map<string, { nome: string; horas: number; viagens: number }>()
    for (const l of filtrados) {
      const nome = l.expand?.frente?.nome || '—'
      const item = mapa.get(nome) || { nome, horas: 0, viagens: 0 }
      item.horas += l.horas || 0
      item.viagens += l.viagens || 0
      mapa.set(nome, item)
    }
    return [...mapa.values()]
      .map((x) => ({ ...x, horas: Number(x.horas.toFixed(2)) }))
      .sort((a, b) => b.horas - a.horas)
  }, [filtrados])

  /** Horas por operador — mostra quem mais rodou no período. */
  const porOperador = useMemo(() => {
    const mapa = new Map<
      string,
      { nome: string; horas: number; viagens: number; dias: Set<string> }
    >()
    for (const l of filtrados) {
      const nome = l.expand?.operador?.nome || nomeOperador(l)
      const item = mapa.get(nome) || { nome, horas: 0, viagens: 0, dias: new Set<string>() }
      item.horas += l.horas || 0
      item.viagens += l.viagens || 0
      item.dias.add(l.data)
      mapa.set(nome, item)
    }
    return [...mapa.values()]
      .map((x) => ({
        nome: x.nome,
        horas: Number(x.horas.toFixed(2)),
        viagens: x.viagens,
        dias: x.dias.size,
      }))
      .sort((a, b) => b.horas - a.horas)
  }, [filtrados])

  /** Turnos: horas e viagens por turno. */
  const porTurno = useMemo(() => {
    const mapa = new Map<string, { turno: string; horas: number; viagens: number }>()
    for (const l of filtrados) {
      const t = (l.turno || '—').trim()
      const item = mapa.get(t) || { turno: t, horas: 0, viagens: 0 }
      item.horas += l.horas || 0
      item.viagens += l.viagens || 0
      mapa.set(t, item)
    }
    return [...mapa.values()]
      .map((x) => ({ ...x, horas: Number(x.horas.toFixed(2)) }))
      .sort((a, b) => b.horas - a.horas)
  }, [filtrados])

  /**
   * Alertas de horímetro: o horímetro final de um dia deveria ser o inicial do
   * próximo. Quando não é, a projeção e o horas/dia ficam errados — por isso
   * aparece aqui, e não escondido num relatório.
   */
  const alertasHorimetro = useMemo(() => {
    const porEquip = new Map<string, Lancamento[]>()
    for (const l of filtrados) {
      const arr = porEquip.get(l.equipamento) || []
      arr.push(l)
      porEquip.set(l.equipamento, arr)
    }
    const saida: { equipamento: string; data: string; de: number; para: number; delta: number }[] =
      []
    for (const arr of porEquip.values()) {
      arr.sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0))
      for (let i = 1; i < arr.length; i++) {
        const anterior = Number(arr[i - 1].horimetro_final) || 0
        const atual = Number(arr[i].horimetro_inicial) || 0
        const delta = atual - anterior
        if (Math.abs(delta) > 0.01) {
          saida.push({
            equipamento: arr[i].expand?.equipamento?.identificacao || nomeEquipamento(arr[i]),
            data: arr[i].data,
            de: anterior,
            para: atual,
            delta: Number(delta.toFixed(2)),
          })
        }
      }
    }
    return saida.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 12)
  }, [filtrados])

  /** Dias do período sem NENHUM apontamento (para frente/equipamento filtrado). */
  const diasSemApontamento = useMemo(() => {
    const d1 = paraData(de)
    const d2 = paraData(ate && ate < hojeISO() ? ate : hojeISO())
    if (!d1 || !d2 || d1 > d2) return []
    const comDado = new Set(filtrados.map((l) => l.data))
    const faltando: string[] = []
    const cursor = new Date(d1)
    while (cursor <= d2) {
      const s = iso(cursor)
      if (!comDado.has(s)) faltando.push(s)
      cursor.setDate(cursor.getDate() + 1)
    }
    return faltando
  }, [de, ate, filtrados])

  const filtroAtivo = !!(equipamento || frente || operador)

  const limpar = () => {
    setEquipamento('')
    setFrente('')
    setOperador('')
    setDe(ciclo.de)
    setAte(hojeISO())
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-12">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
          <p className="text-sm">Montando o dashboard...</p>
        </div>
      </div>
    )
  }

  if (erro) {
    return (
      <LoadError
        title="Erro ao carregar o dashboard"
        message="Não foi possível buscar os lançamentos. Verifique a conexão e tente novamente."
        onRetry={carregar}
      />
    )
  }

  const nomeEquipSel = equipamentos.find((e) => e.id === equipamento)?.identificacao

  return (
    <div className="space-y-5">
      {/* cabeçalho */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            <BarChart3 className="h-7 w-7 text-blue-600" />
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {nomeEquipSel ? (
              <>
                Equipamento <span className="font-semibold text-slate-800">
                  {nomeEquipSel}
                </span>{' '}
                ·{' '}
              </>
            ) : null}
            {formatDataBR(de)} a {formatDataBR(ate)} · {kpi.apontamentos} apontamento(s) em{' '}
            {kpi.dias} dia(s)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setMostrarFiltros((v) => !v)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {mostrarFiltros ? 'Ocultar filtros' : 'Filtros'}
            {filtroAtivo && (
              <span className="ml-1 rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                !
              </span>
            )}
          </Button>
          {filtroAtivo && (
            <Button variant="ghost" onClick={limpar} className="flex items-center gap-1">
              <X className="h-4 w-4" /> Limpar
            </Button>
          )}
        </div>
      </div>

      {/* filtros */}
      {mostrarFiltros && (
        <Card className="border-slate-200">
          <CardContent className="space-y-3 p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Equipamento</Label>
                <select
                  value={equipamento}
                  onChange={(e) => setEquipamento(e.target.value)}
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                >
                  <option value="">Todos</option>
                  {equipamentos.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.identificacao} — {e.categoria}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Frente</Label>
                <select
                  value={frente}
                  onChange={(e) => setFrente(e.target.value)}
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                >
                  <option value="">Todas</option>
                  {frentes.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Operador</Label>
                <select
                  value={operador}
                  onChange={(e) => setOperador(e.target.value)}
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                >
                  <option value="">Todos</option>
                  {operadores.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">De</Label>
                <Input
                  type="date"
                  value={de}
                  max={ate || undefined}
                  onChange={(e) => setDe(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Até</Label>
                <Input
                  type="date"
                  value={ate}
                  min={de || undefined}
                  onChange={(e) => setAte(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const c = cicloAtual()
                  setDe(c.de)
                  setAte(c.ate)
                }}
              >
                Ciclo atual
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const h = new Date()
                  setDe(iso(new Date(h.getFullYear(), h.getMonth(), 1)))
                  setAte(hojeISO())
                }}
              >
                Este mês
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const h = new Date()
                  setDe(iso(new Date(h.getFullYear(), h.getMonth() - 1, 1)))
                  setAte(iso(new Date(h.getFullYear(), h.getMonth(), 0)))
                }}
              >
                Mês passado
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const datas = lancamentos.map((l) => l.data).sort()
                  if (datas.length) {
                    setDe(datas[0])
                    setAte(datas[datas.length - 1])
                  }
                }}
              >
                Tudo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {invalido && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-2 p-3 text-xs font-medium text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />A data inicial é maior que
            a final. Corrija para ver os números.
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          icone={<Clock className="h-4 w-4" />}
          rotulo="Total de horas"
          valor={`${formatHoras(kpi.horas)}`}
          unidade="h"
          detalhe={
            kpi.horasPorDia !== null
              ? `${formatHoras(kpi.horasPorDia)} h por dia com apontamento`
              : '—'
          }
          cor="blue"
        />
        <Kpi
          icone={<Route className="h-4 w-4" />}
          rotulo="Total de viagens"
          valor={numero(kpi.viagens)}
          detalhe={
            kpi.viagensPorHora !== null
              ? `${kpi.viagensPorHora.toFixed(2)} viagens por hora`
              : 'sem horas no período'
          }
          cor="amber"
        />
        <Kpi
          icone={<Truck className="h-4 w-4" />}
          rotulo="Dias com produção"
          valor={numero(kpi.dias)}
          detalhe={`${kpi.apontamentos} apontamentos`}
          cor="emerald"
        />
        <Kpi
          icone={<Gauge className="h-4 w-4" />}
          rotulo="Equipamentos ativos"
          valor={numero(kpi.equipamentosUsados)}
          detalhe={
            kpi.horasPorEquipamento !== null
              ? `${formatHoras(kpi.horasPorEquipamento)} h por equipamento`
              : '—'
          }
          cor="violet"
        />
      </div>

      {/* evolução no tempo */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <TrendingUp className="h-4 w-4 text-blue-600" /> Horas por dia
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {porDia.length === 0 ? (
              <Vazio />
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={porDia} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradHoras" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="rotulo"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <ReTooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                    formatter={(v: number | string, n: string) => [
                      n === 'horas' ? `${formatHoras(Number(v))} h` : v,
                      n === 'horas' ? 'Horas' : 'Viagens',
                    ]}
                    labelFormatter={(r: string) => `Dia ${r}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="horas"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fill="url(#gradHoras)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Route className="h-4 w-4 text-amber-600" /> Viagens por dia
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {porDia.length === 0 ? (
              <Vazio />
            ) : kpi.viagens === 0 ? (
              <SemViagens />
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={porDia} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="rotulo"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <ReTooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                    formatter={(v: number | string) => [`${numero(Number(v))} viagens`, 'Viagens']}
                    labelFormatter={(r: string) => `Dia ${r}`}
                  />
                  <Bar dataKey="viagens" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ranking por equipamento */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Truck className="h-4 w-4 text-blue-600" /> Horas por equipamento
            <span className="ml-auto text-[11px] font-normal text-slate-500">
              {porEquipamento.length} equipamento(s)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {porEquipamento.length === 0 ? (
            <Vazio />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-2 text-left font-semibold">Equipamento</th>
                    <th className="px-2 py-2 text-right font-semibold">Horas</th>
                    <th className="px-2 py-2 text-right font-semibold">Viagens</th>
                    <th className="px-2 py-2 text-right font-semibold">Dias</th>
                    <th className="px-2 py-2 text-right font-semibold">h/dia</th>
                    <th className="hidden px-2 py-2 text-right font-semibold sm:table-cell">
                      Manutenção
                    </th>
                    <th className="w-[22%] px-2 py-2 text-left font-semibold">Participação</th>
                  </tr>
                </thead>
                <tbody>
                  {porEquipamento.map((e, i) => {
                    const pct = kpi.horas > 0 ? (e.horas / kpi.horas) * 100 : 0
                    return (
                      <tr key={e.nome} className="border-b border-slate-100 last:border-0">
                        <td className="py-2 pr-2">
                          <span className="font-semibold text-slate-800">{e.nome}</span>
                          <span className="ml-1.5 text-[10px] text-slate-400">{e.categoria}</span>
                        </td>
                        <td className="tabular-nums px-2 py-2 text-right font-semibold text-slate-900">
                          {formatHoras(e.horas)}
                        </td>
                        <td className="tabular-nums px-2 py-2 text-right text-slate-700">
                          {e.viagens ? numero(e.viagens) : '—'}
                        </td>
                        <td className="tabular-nums px-2 py-2 text-right text-slate-700">
                          {e.dias}
                        </td>
                        <td className="tabular-nums px-2 py-2 text-right text-slate-700">
                          {e.horasPorDia !== null ? formatHoras(e.horasPorDia) : '—'}
                        </td>
                        <td className="tabular-nums hidden px-2 py-2 text-right text-slate-700 sm:table-cell">
                          {e.manutencoes || '—'}
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.max(pct, pct > 0 ? 2 : 0)}%`,
                                  backgroundColor: CORES[i % CORES.length],
                                }}
                              />
                            </div>
                            <span className="tabular-nums w-9 text-right text-[10px] text-slate-500">
                              {pct < 1 && pct > 0 ? '<1' : Math.round(pct)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* frente, turno e operador */}
      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-800">Horas por frente</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {porFrente.length === 0 ? (
              <Vazio />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={165}>
                  <PieChart>
                    <Pie
                      data={porFrente}
                      dataKey="horas"
                      nameKey="nome"
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={68}
                      paddingAngle={2}
                    >
                      {porFrente.map((_, i) => (
                        <Cell key={i} fill={CORES[i % CORES.length]} />
                      ))}
                    </Pie>
                    <ReTooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                      formatter={(v: number | string) => [`${formatHoras(Number(v))} h`, 'Horas']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="mt-1 space-y-1">
                  {porFrente.slice(0, 6).map((f, i) => (
                    <li key={f.nome} className="flex items-center gap-2 text-[11px]">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: CORES[i % CORES.length] }}
                      />
                      <span className="min-w-0 flex-1 truncate text-slate-700">{f.nome}</span>
                      <span className="tabular-nums font-semibold text-slate-900">
                        {formatHoras(f.horas)} h
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Clock className="h-4 w-4 text-emerald-600" /> Horas por turno
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {porTurno.length === 0 ? (
              <Vazio />
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart
                  data={porTurno}
                  layout="vertical"
                  margin={{ top: 4, right: 12, left: 4, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis
                    type="category"
                    dataKey="turno"
                    width={72}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <ReTooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                    formatter={(v: number | string) => [`${formatHoras(Number(v))} h`, 'Horas']}
                  />
                  <Bar dataKey="horas" fill="#10b981" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Users className="h-4 w-4 text-violet-600" /> Top operadores
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {porOperador.length === 0 ? (
              <Vazio />
            ) : (
              <ul className="space-y-1.5">
                {porOperador.slice(0, 8).map((o, i) => {
                  const max = porOperador[0]?.horas || 1
                  return (
                    <li key={o.nome} className="text-[11.5px]">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="min-w-0 truncate text-slate-700">
                          <span className="tabular-nums mr-1 text-slate-400">{i + 1}.</span>
                          {o.nome}
                        </span>
                        <span className="tabular-nums shrink-0 font-semibold text-slate-900">
                          {formatHoras(o.horas)} h
                        </span>
                      </div>
                      <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-violet-500"
                          style={{ width: `${Math.max((o.horas / max) * 100, 2)}%` }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* onde o tempo foi */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Wrench className="h-4 w-4 text-amber-600" /> O que aconteceu no período
            <span className="ml-auto text-[11px] font-normal text-slate-500">
              marcações feitas no lançamento
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
            <Marcacao
              icone={<Wrench className="h-3.5 w-3.5" />}
              rotulo="Manutenção"
              valor={kpi.marcas.manutencao}
              total={kpi.apontamentos}
              cor="text-amber-600"
            />
            <Marcacao
              icone={<UtensilsCrossed className="h-3.5 w-3.5" />}
              rotulo="Refeição"
              valor={kpi.marcas.refeicao}
              total={kpi.apontamentos}
              cor="text-emerald-600"
            />
            <Marcacao
              icone={<Fuel className="h-3.5 w-3.5" />}
              rotulo="Abastecimento"
              valor={kpi.marcas.abastecimento}
              total={kpi.apontamentos}
              cor="text-blue-600"
            />
            <Marcacao
              icone={<CircleSlash className="h-3.5 w-3.5" />}
              rotulo="À disposição"
              valor={kpi.marcas.disposicao}
              total={kpi.apontamentos}
              cor="text-rose-600"
            />
            <Marcacao
              icone={<AlertTriangle className="h-3.5 w-3.5" />}
              rotulo="DDS"
              valor={kpi.marcas.dds}
              total={kpi.apontamentos}
              cor="text-slate-600"
            />
            <Marcacao
              icone={<AlertTriangle className="h-3.5 w-3.5" />}
              rotulo="APR"
              valor={kpi.marcas.apr}
              total={kpi.apontamentos}
              cor="text-slate-600"
            />
            <Marcacao
              icone={<AlertTriangle className="h-3.5 w-3.5" />}
              rotulo="Check list"
              valor={kpi.marcas.checklist}
              total={kpi.apontamentos}
              cor="text-slate-600"
            />
          </div>
          <p className="mt-2 text-[10.5px] leading-relaxed text-slate-500">
            Contagem de apontamentos com a marcação ligada. As horas não são recalculadas por
            marcação — elas vêm do horímetro, que é o dado de campo.
          </p>
        </CardContent>
      </Card>

      {/* integridade do horímetro e dias sem apontamento */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Gauge className="h-4 w-4 text-rose-600" /> Horímetro com salto
              <span className="ml-auto text-[11px] font-normal text-slate-500">
                {alertasHorimetro.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {alertasHorimetro.length === 0 ? (
              <p className="py-6 text-center text-xs text-emerald-700">
                Nenhum salto no período — a cadeia do horímetro está contínua.
              </p>
            ) : (
              <ul className="space-y-1">
                {alertasHorimetro.map((a, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-md bg-rose-50 px-2 py-1.5 text-[11px]"
                  >
                    <span className="font-semibold text-slate-800">{a.equipamento}</span>
                    <span className="text-slate-500">{formatDataBR(a.data)}</span>
                    <span className="tabular-nums text-slate-600">
                      {formatHoras(a.de)} → {formatHoras(a.para)}
                    </span>
                    <span
                      className={`tabular-nums font-bold ${a.delta > 0 ? 'text-emerald-700' : 'text-rose-700'}`}
                    >
                      {a.delta > 0 ? '+' : ''}
                      {formatHoras(a.delta)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-[10.5px] leading-relaxed text-slate-500">
              Quando o horímetro inicial de um dia não é o final do anterior, a diferença aparece
              aqui. É o que faz o horas/dia e a projeção de manutenção saírem errados.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <CalendarDays className="h-4 w-4 text-slate-600" /> Dias sem apontamento
              <span className="ml-auto text-[11px] font-normal text-slate-500">
                {diasSemApontamento.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {diasSemApontamento.length === 0 ? (
              <p className="py-6 text-center text-xs text-emerald-700">
                Todos os dias do período têm apontamento.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {diasSemApontamento.map((d) => (
                  <span
                    key={d}
                    className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10.5px] text-slate-600"
                  >
                    {formatDataBR(d).slice(0, 5)}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-2 text-[10.5px] leading-relaxed text-slate-500">
              {filtroAtivo
                ? 'Dias em que o filtro escolhido não tem nenhum lançamento — pode ser parada da máquina, folga ou falta de lançamento.'
                : 'Dias do período sem nenhum lançamento no sistema.'}
            </p>
          </CardContent>
        </Card>
      </div>

      <p className="pb-2 text-[10.5px] text-slate-400">
        Todos os números são soma dos lançamentos do período e dos filtros acima — nada é estimado.
        O arquivo da AMG sai pela tela{' '}
        <Link to="/relatorios" className="font-semibold text-blue-600 hover:underline">
          Relatórios
        </Link>
        .
      </p>
    </div>
  )
}

// ---------------------------------------------------------------- componentes

function Kpi({
  icone,
  rotulo,
  valor,
  unidade,
  detalhe,
  cor,
}: {
  icone: ReactNode
  rotulo: string
  valor: string
  unidade?: string
  detalhe: string
  cor: 'blue' | 'amber' | 'emerald' | 'violet'
}) {
  const mapa = {
    blue: 'text-blue-600 bg-blue-50',
    amber: 'text-amber-600 bg-amber-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    violet: 'text-violet-600 bg-violet-50',
  }
  return (
    <Card className="border-slate-200">
      <CardContent className="p-3.5">
        <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">
          <span className={`rounded p-1 ${mapa[cor]}`}>{icone}</span>
          {rotulo}
        </div>
        <div className="tabular-nums mt-1.5 text-[25px] font-extrabold leading-none text-slate-900">
          {valor}
          {unidade && <span className="ml-1 text-xs font-semibold text-slate-400">{unidade}</span>}
        </div>
        <div className="mt-1 text-[10.5px] leading-tight text-slate-500">{detalhe}</div>
      </CardContent>
    </Card>
  )
}

function Marcacao({
  icone,
  rotulo,
  valor,
  total,
  cor,
}: {
  icone: ReactNode
  rotulo: string
  valor: number
  total: number
  cor: string
}) {
  const pct = total > 0 ? (valor / total) * 100 : 0
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-2">
      <div
        className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide ${cor}`}
      >
        {icone}
        <span className="truncate text-slate-600">{rotulo}</span>
      </div>
      <div className="tabular-nums mt-1 text-lg font-extrabold leading-none text-slate-900">
        {numero(valor)}
      </div>
      <div className="mt-0.5 text-[10px] text-slate-500">
        {pct > 0 ? `${Math.round(pct)}% dos apontamentos` : 'nenhum'}
      </div>
    </div>
  )
}

const Vazio = () => (
  <p className="py-8 text-center text-xs text-slate-400">
    Nenhum lançamento no período e filtros escolhidos.
  </p>
)

const SemViagens = () => (
  <p className="py-8 text-center text-xs text-slate-400">
    Este filtro não tem viagens — escolha uma frente de caminhão para ver o volume transportado.
  </p>
)

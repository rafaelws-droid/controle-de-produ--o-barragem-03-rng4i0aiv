import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Gauge,
  FileSpreadsheet,
  FileText,
  Loader2,
  Wrench,
  AlertTriangle,
  CalendarDays,
  ArrowUpRight,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadError } from '@/components/LoadError'
import { Paginacao, POR_PAGINA } from '@/components/Paginacao'
import { useToast } from '@/hooks/use-toast'
import { equipamentosService, lancamentosService } from '@/services/producao'
import { formatDataBR, formatHoras } from '@/lib/exportUtils'
import {
  exportarHorimetrosCsv,
  exportarHorimetrosExcel,
  exportarHorimetrosPdf,
  hojeISO,
  montarHorimetros,
  resumoHorimetros,
  situacao,
  type LinhaHorimetro,
} from '@/lib/exportHorimetros'
import type { Equipamento, Lancamento } from '@/types'

function primeiroDiaDoMesCorrente(): string {
  const h = hojeISO()
  return `${h.slice(0, 7)}-01`
}

type Filtro = 'todos' | 'operacao' | 'atencao' | 'semapontamento'

const TODOS = '__todos__'

export default function RelatorioHorimetros() {
  const { toast } = useToast()

  const [eqs, setEqs] = useState<Equipamento[]>([])
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erroCarga, setErroCarga] = useState(false)
  /** página da tabela (10 por página) */
  const [pagina, setPagina] = useState(1)

  // O periodo comeca no mes corrente, mas assim que os lancamentos chegam ele
  // passa a cobrir TODO o periodo com dados. Sem isso a tela abriria zerada
  // quando o mes corrente ainda nao tem apontamento (ex.: consulta retroativa).
  const [de, setDe] = useState(primeiroDiaDoMesCorrente())
  const [ate, setAte] = useState(hojeISO())
  const [filtro, setFiltro] = useState<Filtro>('todos')
  // Filtro por equipamento individual: __todos__ = frota inteira.
  const [equipamentoFiltro, setEquipamentoFiltro] = useState(TODOS)
  const [periodoAuto, setPeriodoAuto] = useState(true)

  const carregar = async () => {
    try {
      setCarregando(true)
      setErroCarga(false)
      const [listaEq, listaLa] = await Promise.all([
        equipamentosService.getAll(),
        lancamentosService.getAll(),
      ])
      setEqs(listaEq)
      setLancamentos(listaLa)

      // Ajusta o periodo inicial para o intervalo que realmente tem dados.
      if (listaLa.length > 0) {
        const datas = listaLa.map((l) => l.data).sort()
        setDe((atual) => (periodoAuto ? datas[0] : atual))
        setAte((atual) => (periodoAuto ? datas[datas.length - 1] : atual))
      }
    } catch (e) {
      console.error(e)
      setErroCarga(true)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    void carregar()
  }, [])

  const noPeriodo = useMemo(
    () => lancamentos.filter((l) => (!de || l.data >= de) && (!ate || l.data <= ate)),
    [lancamentos, de, ate],
  )

  // Um equipamento escolhido: so ele entra no calculo. Caso contrario, a frota.
  const equipamentosBase = useMemo(
    () => (equipamentoFiltro === TODOS ? eqs : eqs.filter((e) => e.id === equipamentoFiltro)),
    [eqs, equipamentoFiltro],
  )

  const linhas = useMemo(
    () => montarHorimetros(equipamentosBase, noPeriodo, ate || hojeISO()),
    [equipamentosBase, noPeriodo, ate],
  )

  const visiveis = useMemo(() => {
    if (filtro === 'operacao') return linhas.filter((l) => situacao(l) === 'EM OPERAÇÃO')
    if (filtro === 'atencao') return linhas.filter((l) => l.manutencoes > 0)
    if (filtro === 'semapontamento') return linhas.filter((l) => l.semLeitura)
    return linhas
  }, [linhas, filtro])

  // Os cartoes refletem exatamente o que esta na tabela — senao o numero do topo
  // contradiz a lista quando ha filtro de equipamento.
  const resumo = useMemo(() => resumoHorimetros(visiveis), [visiveis])

  // ---- paginação da tabela, 10 em 10 ----
  const totalPaginas = Math.max(1, Math.ceil(visiveis.length / POR_PAGINA))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const daPagina = useMemo(
    () => visiveis.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA),
    [visiveis, paginaAtual],
  )

  // mudou filtro ou período, volta para a primeira página
  useEffect(() => {
    setPagina(1)
  }, [de, ate, filtro, equipamentoFiltro])

  const selecionado = useMemo(
    () =>
      equipamentoFiltro === TODOS ? null : (eqs.find((e) => e.id === equipamentoFiltro) ?? null),
    [eqs, equipamentoFiltro],
  )

  const periodo = `${de ? formatDataBR(de) : 'início'} a ${ate ? formatDataBR(ate) : 'hoje'}`

  const exportar = (tipo: 'pdf' | 'excel' | 'csv') => {
    if (visiveis.length === 0) {
      toast({
        title: 'Nada para exportar',
        description: 'Não há equipamentos com os filtros escolhidos.',
        variant: 'destructive',
      })
      return
    }
    const doFiltro = new Set(visiveis.map((v) => v.equipamentoId))
    const lancamentosFiltrados = noPeriodo.filter((l) => doFiltro.has(l.equipamento))

    if (tipo === 'pdf') exportarHorimetrosPdf(visiveis, periodo)
    if (tipo === 'excel') exportarHorimetrosExcel(visiveis, lancamentosFiltrados, periodo)
    if (tipo === 'csv') exportarHorimetrosCsv(visiveis, periodo)
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-12">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
          <p className="text-sm">Lendo horímetros...</p>
        </div>
      </div>
    )
  }

  if (erroCarga) {
    return (
      <LoadError
        title="Erro ao carregar os horímetros"
        message="Não foi possível buscar os lançamentos do período."
        onRetry={carregar}
      />
    )
  }

  const celulaSituacao = (l: LinhaHorimetro) => {
    if (l.semLeitura) {
      return <span className="font-semibold text-slate-400">SEM APONTAMENTO</span>
    }
    if (l.manutencoes > 0) {
      return (
        <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
          <Wrench className="h-3 w-3" />
          MANUTENÇÃO
        </span>
      )
    }
    if ((l.diasSemApontamento ?? 0) >= 3) {
      return (
        <span className="inline-flex items-center gap-1 font-semibold text-orange-600">
          <AlertTriangle className="h-3 w-3" />
          {l.diasSemApontamento} DIAS PARADO
        </span>
      )
    }
    return <span className="font-medium text-emerald-700">EM OPERAÇÃO</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            <Gauge className="h-7 w-7 text-blue-600" />
            Horímetros — Manutenção
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {selecionado ? `${selecionado.identificacao} · ` : ''}
            {periodo} • {resumo.comApontamento} de {resumo.equipamentos} equipamentos com
            apontamento • {formatHoras(resumo.horas)} h no período
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => exportar('pdf')}
            className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
          >
            <FileText className="h-4 w-4" />
            PDF
          </Button>
          <Button
            onClick={() => exportar('excel')}
            className="flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button
            onClick={() => exportar('csv')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            CSV
          </Button>
        </div>
      </div>

      <Card className="border-slate-200">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">De</Label>
            <Input
              type="date"
              value={de}
              onChange={(e) => {
                setPeriodoAuto(false)
                setDe(e.target.value)
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Até</Label>
            <Input
              type="date"
              value={ate}
              onChange={(e) => {
                setPeriodoAuto(false)
                setAte(e.target.value)
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              Equipamento
            </Label>
            <select
              value={equipamentoFiltro}
              onChange={(e) => setEquipamentoFiltro(e.target.value)}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
            >
              <option value={TODOS}>Todos os equipamentos</option>
              {eqs.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.identificacao}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Mostrar</Label>
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value as Filtro)}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
            >
              <option value="todos">Todos</option>
              <option value="operacao">Só em operação</option>
              <option value="atencao">Só com manutenção</option>
              <option value="semapontamento">Só sem apontamento</option>
            </select>
          </div>
          <div className="flex items-end">
            <p className="text-[11px] leading-tight text-slate-500">
              O horímetro é a leitura do medidor de horas. A diferença entre a leitura final e a
              inicial é o que o equipamento rodou no período.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Horas no período
            </p>
            <p className="mt-1 text-2xl font-bold text-blue-700">{formatHoras(resumo.horas)} h</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Com manutenção
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{resumo.comManutencao}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              3+ dias sem apontamento
            </p>
            <p className="mt-1 text-2xl font-bold text-orange-600">{resumo.parados}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Sem apontamento
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-500">{resumo.semApontamento}</p>
          </CardContent>
        </Card>
      </div>

      {visiveis.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <CalendarDays className="mb-3 h-12 w-12 text-slate-300" />
          <h3 className="text-base font-semibold text-slate-800">
            {selecionado
              ? `Sem apontamento para ${selecionado.identificacao}`
              : 'Nenhum equipamento'}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {selecionado
              ? 'Este equipamento não tem lançamento no período escolhido. Amplie o período ou escolha outro.'
              : 'Não há equipamento com esse filtro no período escolhido.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[980px] text-left text-xs">
            <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Equipamento</th>
                <th className="px-3 py-2">Categoria</th>
                <th className="px-3 py-2 text-right">Horímetro inicial</th>
                <th className="px-3 py-2 text-right">Horímetro final</th>
                <th className="px-3 py-2 text-right">Horas no período</th>
                <th className="px-3 py-2 text-right">Apont.</th>
                <th className="px-3 py-2">Último apont.</th>
                <th className="px-3 py-2 text-right">Dias s/ apont.</th>
                <th className="px-3 py-2">Situação</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {daPagina.map((l) => (
                <tr
                  key={l.equipamentoId}
                  className={
                    l.manutencoes > 0
                      ? 'bg-amber-50/60 hover:bg-amber-50'
                      : (l.diasSemApontamento ?? 0) >= 3
                        ? 'bg-orange-50/40 hover:bg-orange-50'
                        : 'hover:bg-slate-50/70'
                  }
                >
                  <td className="whitespace-nowrap px-3 py-2">
                    <span className="font-semibold text-slate-800">{l.equipamento}</span>
                    {l.descricao && (
                      <span className="block text-[10px] text-slate-500">{l.descricao}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{l.categoria}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                    {l.horimetroInicial !== null ? formatHoras(l.horimetroInicial) : '—'}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                    {l.horimetroFinal !== null ? formatHoras(l.horimetroFinal) : '—'}
                  </td>
                  <td className="px-3 py-2 text-right font-bold tabular-nums text-blue-700">
                    {formatHoras(l.horasPeriodo)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                    {l.lancamentos || '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                    {l.ultimaData ? formatDataBR(l.ultimaData) : '—'}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                    {l.diasSemApontamento ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-[10px]">{celulaSituacao(l)}</td>
                  <td className="px-3 py-2">
                    {!l.semLeitura && (
                      <Link
                        to={`/relatorio?de=${de}&ate=${ate}&equipamento=${l.equipamentoId}`}
                        title="Ver os apontamentos deste equipamento"
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:underline"
                      >
                        Ver
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-bold text-slate-800">
              <tr>
                <td className="px-3 py-2" colSpan={4}>
                  TOTAL ({visiveis.length} equipamento{visiveis.length === 1 ? '' : 's'})
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-blue-700">
                  {formatHoras(visiveis.reduce((a, l) => a + l.horasPeriodo, 0))}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {visiveis.reduce((a, l) => a + l.lancamentos, 0)}
                </td>
                <td colSpan={4}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {visiveis.length > 0 && (
        <Paginacao
          pagina={paginaAtual}
          totalPaginas={totalPaginas}
          totalItens={visiveis.length}
          porPagina={POR_PAGINA}
          onMudar={setPagina}
        />
      )}

      <p className="text-[11px] leading-relaxed text-slate-500">
        Linhas em amarelo: equipamento com manutenção registrada no período. Em laranja: 3 dias ou
        mais sem apontamento — pode ser parada para manutenção, avaria ou falta de lançamento. O
        relatório considera apenas os lançamentos do período escolhido.
      </p>
    </div>
  )
}

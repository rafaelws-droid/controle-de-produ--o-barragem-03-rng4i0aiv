import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FileBarChart, FileSpreadsheet, FileText, Loader2, Gauge } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadError } from '@/components/LoadError'
import { Paginacao, POR_PAGINA } from '@/components/Paginacao'
import { hojeISO, inicioMesISO } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import {
  equipamentosService,
  frentesService,
  lancamentosService,
  operadoresService,
} from '@/services/producao'
import {
  exportarCsv,
  exportarExcel,
  exportarPdf,
  formatDataBR,
  formatHoras,
  nomeEquipamento,
  nomeOperador,
} from '@/lib/exportUtils'
import { baixarAmg } from '@/lib/xlsxAmg'
import type { Equipamento, Frente, Lancamento, Operador } from '@/types'

function primeiroDiaDoMes(): string {
  return inicioMesISO()
}

export default function Relatorio() {
  const { toast } = useToast()
  const [params] = useSearchParams()

  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [frentes, setFrentes] = useState<Frente[]>([])
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [operadores, setOperadores] = useState<Operador[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erroCarga, setErroCarga] = useState(false)
  /** página do detalhamento (10 por página) */
  const [pagina, setPagina] = useState(1)

  const [de, setDe] = useState(params.get('de') || primeiroDiaDoMes())
  const [ate, setAte] = useState(params.get('ate') || hojeISO())
  // Quando a tela abre sem periodo vindo do Painel, o periodo passa a cobrir
  // todo o intervalo com dados — senao abriria zerada num mes sem lancamento.
  const [periodoAuto, setPeriodoAuto] = useState(!params.get('de') && !params.get('ate'))
  const [frente, setFrente] = useState(params.get('frente') || '')
  // O filtro por equipamento vem pela URL quando a pessoa clica em "Ver" no
  // relatorio de horimetros. Antes ele era ignorado e abria a frota inteira.
  const [equipamento, setEquipamento] = useState(params.get('equipamento') || '')
  const [operador, setOperador] = useState('')

  const carregar = async () => {
    try {
      setCarregando(true)
      setErroCarga(false)
      const [ls, fs, es, os] = await Promise.all([
        lancamentosService.getAll(),
        frentesService.getAll(),
        equipamentosService.getAll(),
        operadoresService.getAll(),
      ])
      setLancamentos(ls)
      setFrentes(fs)
      setEquipamentos(es)
      setOperadores(os)

      if (periodoAuto && ls.length > 0) {
        const datas = ls.map((l) => l.data).sort()
        setDe(datas[0])
        setAte(datas[datas.length - 1])
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

  const filtrados = useMemo(
    () =>
      lancamentos.filter((l) => {
        if (de && l.data < de) return false
        if (ate && l.data > ate) return false
        if (frente && l.frente !== frente) return false
        if (equipamento && l.equipamento !== equipamento) return false
        if (operador && l.operador !== operador) return false
        return true
      }),
    [lancamentos, de, ate, frente, equipamento, operador],
  )

  const totalHoras = filtrados.reduce((a, l) => a + (l.horas || 0), 0)
  const totalViagens = filtrados.reduce((a, l) => a + (l.viagens || 0), 0)

  // ---- paginação do detalhamento, 10 em 10 ----
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const daPagina = useMemo(
    () => filtrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA),
    [filtrados, paginaAtual],
  )

  // mudou o filtro, volta para a primeira página
  useEffect(() => {
    setPagina(1)
  }, [de, ate, frente, equipamento, operador])

  const periodo = `${de ? formatDataBR(de) : 'início'} a ${ate ? formatDataBR(ate) : 'hoje'}`

  /** Resumo por frente, igual às abas/garantias da planilha antiga. */
  const porFrente = useMemo(() => {
    const mapa = new Map<
      string,
      { nome: string; horas: number; viagens: number; qtd: number; garantia: number }
    >()
    for (const l of filtrados) {
      const chave = l.frente
      const item = mapa.get(chave) || {
        nome: l.expand?.frente?.nome || '-',
        horas: 0,
        viagens: 0,
        qtd: 0,
        garantia: l.expand?.frente?.garantia_horas || 0,
      }
      item.horas += l.horas || 0
      item.viagens += l.viagens || 0
      item.qtd += 1
      mapa.set(chave, item)
    }
    return [...mapa.values()].sort((a, b) => b.horas - a.horas)
  }, [filtrados])

  /**
   * Resumo por equipamento. E o que faz sentido quando a pessoa chega aqui
   * filtrada por um equipamento so — resumo por frente mostraria uma linha
   * com a frente inteira e esconderia o que interessa.
   */
  const porEquipamento = useMemo(() => {
    const mapa = new Map<
      string,
      { nome: string; categoria: string; horas: number; viagens: number; qtd: number }
    >()
    for (const l of filtrados) {
      const chave = l.equipamento
      const item = mapa.get(chave) || {
        nome: l.expand?.equipamento?.identificacao || nomeEquipamento(l),
        categoria: l.expand?.equipamento?.categoria || '—',
        horas: 0,
        viagens: 0,
        qtd: 0,
      }
      item.horas += l.horas || 0
      item.viagens += l.viagens || 0
      item.qtd += 1
      mapa.set(chave, item)
    }
    return [...mapa.entries()].map(([id, v]) => ({ id, ...v })).sort((a, b) => b.horas - a.horas)
  }, [filtrados])

  const agrupadoPorEquipamento = equipamento !== ''

  const exportar = (tipo: 'pdf' | 'excel' | 'csv' | 'amg') => {
    if (filtrados.length === 0) {
      toast({
        title: 'Nada para exportar',
        description: 'Não há lançamentos no período/filtros selecionados.',
        variant: 'destructive',
      })
      return
    }
    if (tipo === 'pdf') {
      exportarPdf(filtrados, periodo)
      return
    }
    if (tipo === 'excel') {
      exportarExcel(filtrados, periodo)
      return
    }
    if (tipo === 'csv') {
      exportarCsv(filtrados, periodo)
      return
    }

    // ---- padrão AMG: 9 abas, uma por frente, no mesmo formato da planilha da AMG ----
    // O filtro por frente precisa estar vazio (o arquivo tem as 9 abas).
    // O filtro por equipamento continua valendo por dentro da aba dele.
    if (frente) {
      const nome = frentes.find((f) => f.id === frente)?.nome || 'a frente'
      toast({
        title: 'Tire o filtro de frente',
        description: `A planilha da AMG tem uma aba por frente. Para exportar em "${nome}", use o Excel comum — ou remova o filtro de frente e exporte as 9 abas.`,
        variant: 'destructive',
      })
      return
    }

    const garantias: Record<string, number> = {}
    for (const f of frentes) {
      if (f.garantia_horas != null) {
        garantias[f.nome.toUpperCase().replace(/\\s+/g, ' ').trim()] = Number(f.garantia_horas)
      }
    }

    const res = baixarAmg(filtrados, de, ate, garantias)
    toast({
      title: 'Planilha AMG gerada',
      description: `${res.lancamentos} lançamentos em ${res.abas.length} abas · ${formatHoras(
        res.totalHoras,
      )} h · ${res.totalViagens} viagens${
        res.semAba > 0 ? ` · ${res.semAba} lançamento(s) com frente fora do padrão AMG` : ''
      }`,
    })
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-12">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
          <p className="text-sm">Montando relatório...</p>
        </div>
      </div>
    )
  }

  if (erroCarga) {
    return (
      <LoadError
        title="Erro ao carregar o relatório"
        message="Não foi possível buscar os lançamentos do período."
        onRetry={carregar}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            <FileBarChart className="h-7 w-7 text-blue-600" />
            Relatório de Produção
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {periodo} • {filtrados.length} lançamentos • {formatHoras(totalHoras)} h •{' '}
            {totalViagens} viagens
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
          <Button
            onClick={() => exportar('amg')}
            className="flex items-center gap-2 bg-slate-800 text-white hover:bg-slate-900"
            title="Mesmo formato da planilha enviada à AMG: 9 abas, uma por frente"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Planilha AMG
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
            <Label className="text-xs font-semibold text-slate-700">Equipamento</Label>
            <select
              value={equipamento}
              onChange={(e) => setEquipamento(e.target.value)}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
            >
              <option value="">Todos</option>
              {equipamentos.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.identificacao}
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
        </CardContent>
      </Card>

      {/* Resumo: por frente, ou por equipamento quando a consulta esta filtrada */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Gauge className="h-4 w-4 text-blue-600" />
            {agrupadoPorEquipamento ? 'Resumo por equipamento' : 'Resumo por frente'}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {agrupadoPorEquipamento ? (
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Equipamento</th>
                  <th className="px-3 py-2">Categoria</th>
                  <th className="px-3 py-2 text-right">Lançamentos</th>
                  <th className="px-3 py-2 text-right">Horas</th>
                  <th className="px-3 py-2 text-right">Viagens</th>
                  <th className="px-3 py-2 text-right">Média h/lanç.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {porEquipamento.map((e) => (
                  <tr key={e.id}>
                    <td className="px-3 py-2 font-medium text-slate-800">{e.nome}</td>
                    <td className="px-3 py-2 text-slate-600">{e.categoria}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-600">{e.qtd}</td>
                    <td className="px-3 py-2 text-right font-bold tabular-nums text-blue-700">
                      {formatHoras(e.horas)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                      {e.viagens || '-'}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                      {e.qtd > 0 ? formatHoras(e.horas / e.qtd) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-bold text-slate-800">
                <tr>
                  <td className="px-3 py-2" colSpan={2}>
                    TOTAL ({porEquipamento.length})
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {porEquipamento.reduce((a, e) => a + e.qtd, 0)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-blue-700">
                    {formatHoras(totalHoras)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{totalViagens}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Frente</th>
                  <th className="px-3 py-2 text-right">Lançamentos</th>
                  <th className="px-3 py-2 text-right">Horas</th>
                  <th className="px-3 py-2 text-right">Viagens</th>
                  <th className="px-3 py-2 text-right">Garantia mensal</th>
                  <th className="px-3 py-2 text-right">% da garantia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {porFrente.map((f) => (
                  <tr key={f.nome}>
                    <td className="px-3 py-2 font-medium text-slate-800">{f.nome}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-600">{f.qtd}</td>
                    <td className="px-3 py-2 text-right font-bold tabular-nums text-blue-700">
                      {formatHoras(f.horas)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                      {f.viagens || '-'}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                      {f.garantia ? `${formatHoras(f.garantia)} h` : '-'}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {f.garantia ? `${((f.horas / f.garantia) * 100).toFixed(0)}%` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Detalhamento */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Data</th>
              <th className="px-3 py-2">Frente</th>
              <th className="px-3 py-2">Equip.</th>
              <th className="px-3 py-2">Operador</th>
              <th className="px-3 py-2">Turno</th>
              <th className="px-3 py-2 text-right">Horas</th>
              <th className="px-3 py-2 text-right">Viag.</th>
              <th className="px-3 py-2">Serviço</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {daPagina.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50/70">
                <td className="whitespace-nowrap px-3 py-2">{formatDataBR(l.data)}</td>
                <td className="px-3 py-2 text-slate-600">{l.expand?.frente?.nome || '-'}</td>
                <td className="px-3 py-2 font-semibold text-slate-800">{nomeEquipamento(l)}</td>
                <td className="px-3 py-2 text-slate-600">{nomeOperador(l)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-500">{l.turno}</td>
                <td className="px-3 py-2 text-right font-bold tabular-nums text-blue-700">
                  {formatHoras(l.horas)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                  {l.viagens || '-'}
                </td>
                <td className="max-w-[320px] truncate px-3 py-2 text-slate-600">{l.servico}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 font-bold text-slate-800">
            <tr>
              <td className="px-3 py-2" colSpan={5}>
                TOTAL
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-blue-700">
                {formatHoras(totalHoras)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{totalViagens}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {filtrados.length > 0 && (
        <Paginacao
          pagina={paginaAtual}
          totalPaginas={totalPaginas}
          totalItens={filtrados.length}
          porPagina={POR_PAGINA}
          onMudar={setPagina}
        />
      )}
    </div>
  )
}

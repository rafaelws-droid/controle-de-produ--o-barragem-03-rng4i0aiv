import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FileBarChart, FileSpreadsheet, FileText, Loader2, Gauge } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadError } from '@/components/LoadError'
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
import type { Equipamento, Frente, Lancamento, Operador } from '@/types'

function primeiroDiaDoMes(): string {
  const h = new Date()
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-01`
}
const hojeISO = () => new Date().toISOString().split('T')[0]

export default function Relatorio() {
  const { toast } = useToast()
  const [params] = useSearchParams()

  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [frentes, setFrentes] = useState<Frente[]>([])
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [operadores, setOperadores] = useState<Operador[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erroCarga, setErroCarga] = useState(false)

  const [de, setDe] = useState(params.get('de') || primeiroDiaDoMes())
  const [ate, setAte] = useState(params.get('ate') || hojeISO())
  const [frente, setFrente] = useState(params.get('frente') || '')
  const [equipamento, setEquipamento] = useState('')
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

  const exportar = (tipo: 'pdf' | 'excel' | 'csv') => {
    if (filtrados.length === 0) {
      toast({
        title: 'Nada para exportar',
        description: 'Não há lançamentos no período/filtros selecionados.',
        variant: 'destructive',
      })
      return
    }
    if (tipo === 'pdf') exportarPdf(filtrados, periodo)
    if (tipo === 'excel') exportarExcel(filtrados, periodo)
    if (tipo === 'csv') exportarCsv(filtrados, periodo)
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
        </div>
      </div>

      <Card className="border-slate-200">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">De</Label>
            <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Até</Label>
            <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
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

      {/* Resumo por frente com garantia */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Gauge className="h-4 w-4 text-blue-600" />
            Resumo por frente
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
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
            {filtrados.map((l) => (
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
    </div>
  )
}

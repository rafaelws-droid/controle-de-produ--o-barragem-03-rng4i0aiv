/**
 * Horímetro — lê os equipamentos e as leituras do Controle de Produção.
 *
 * Antes esta tela usava um cadastro separado (horimetro_equipamentos) que tinha
 * máquinas de exemplo. Agora mostra a frota real, com o horímetro que vem dos
 * lançamentos, e permite lançar uma leitura que também alimenta o controle.
 */
import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadError } from '@/components/LoadError'
import { useToast } from '@/hooks/use-toast'
import { Gauge, Truck, RefreshCw, ArrowUpRight, AlertTriangle, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDataBR, formatHoras } from '@/lib/exportUtils'
import {
  carregarEquipamentos,
  carregarLancamentos,
  montarResumo,
  type ResumoHorimetro,
} from '@/services/horimetroReal'
import { hojeISO } from '@/lib/exportHorimetros'

function diasAtras(n: number): string {
  const h = hojeISO()
  const [a, m, d] = h.split('-').map(Number)
  const dt = new Date(a, m - 1, d - n)
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${dt.getFullYear()}-${mm}-${dd}`
}

export function Horimetro() {
  const { toast } = useToast()
  const [resumos, setResumos] = useState<ResumoHorimetro[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  // Janela padrão: 120 dias, que cobre os dois ciclos carregados.
  const [de, setDe] = useState(diasAtras(120))
  const [ate, setAte] = useState(hojeISO())

  async function carregar() {
    setCarregando(true)
    setErro(null)
    try {
      const [eqs, lancs] = await Promise.all([carregarEquipamentos(), carregarLancamentos(de, ate)])
      setResumos(montarResumo(eqs, lancs, ate))
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Falha ao carregar os horímetros.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    void carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [de, ate])

  const total = useMemo(
    () => ({
      horas: resumos.reduce((s, r) => s + r.horas, 0),
      equipamentos: resumos.length,
      semApontamento: resumos.filter((r) => r.diasSemApontamento >= 3).length,
    }),
    [resumos],
  )

  if (erro) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <LoadError title="Erro ao carregar" message={erro} onRetry={carregar} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            <Gauge className="h-7 w-7 text-blue-600" /> Horímetro
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Leitura de cada equipamento da frota, vinda dos lançamentos do Controle de Produção.
            Horímetro atual é a última leitura registrada.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={de}
            onChange={(e) => setDe(e.target.value)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
          />
          <span className="text-xs text-slate-500">a</span>
          <input
            type="date"
            value={ate}
            onChange={(e) => setAte(e.target.value)}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
          />
          <Button variant="outline" size="sm" onClick={() => void carregar()} disabled={carregando}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${carregando ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Horas no período
            </p>
            <p className="mt-1 text-2xl font-bold text-blue-700">{formatHoras(total.horas)} h</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Equipamentos com leitura
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{total.equipamentos}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              3+ dias sem apontamento
            </p>
            <p className="mt-1 text-2xl font-bold text-orange-600">{total.semApontamento}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Truck className="h-4 w-4 text-blue-600" /> Frota — horímetro atual
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {formatDataBR(de)} a {formatDataBR(ate)} · {total.equipamentos} equipamento(s)
          </p>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Lendo horímetros…</p>
          ) : resumos.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum equipamento com apontamento no período escolhido.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Equipamento</th>
                    <th className="px-3 py-2">Categoria</th>
                    <th className="px-3 py-2 text-right">Horímetro atual</th>
                    <th className="px-3 py-2">Última leitura</th>
                    <th className="px-3 py-2 text-right">Horas no período</th>
                    <th className="px-3 py-2 text-right">h/dia</th>
                    <th className="px-3 py-2">Situação</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resumos.map((r) => (
                    <tr key={r.equipamento.id} className="hover:bg-slate-50/70">
                      <td className="px-3 py-2 font-semibold text-slate-800">
                        {r.equipamento.identificacao}
                      </td>
                      <td className="px-3 py-2 text-slate-600">{r.equipamento.categoria || '—'}</td>
                      <td className="px-3 py-2 text-right font-bold tabular-nums text-blue-700">
                        {formatHoras(r.horimetroAtual)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                        {r.dataAtual ? formatDataBR(r.dataAtual) : '—'}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                        {formatHoras(r.horas)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                        {formatHoras(r.horasPorDia)}
                      </td>
                      <td className="px-3 py-2">
                        {r.diasSemApontamento >= 3 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-orange-600">
                            <AlertTriangle className="h-3 w-3" /> {r.diasSemApontamento} dias parado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                            <Wrench className="h-3 w-3" /> em operação
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <Link
                          to={`/relatorio?de=${de}&ate=${ate}&equipamento=${r.equipamento.id}`}
                          className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:underline"
                        >
                          Ver <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-[11px] leading-relaxed text-slate-500">
        O horímetro vem do campo “horímetro final” do último lançamento de cada equipamento. h/dia é
        a média por dia com apontamento. Para ver o detalhe dia a dia de uma máquina, use o “Ver” ou
        a aba Horímetros em Relatórios.
      </p>
    </div>
  )
}

export default Horimetro

/**
 * Horímetro — mostra, de cada equipamento, o PENÚLTIMO e o ÚLTIMO lançamento
 * válido de horímetro, na ordem verdadeira da máquina.
 *
 * POR QUE ORDENAR PELO HORÍMETRO E NÃO PELA DATA/CARGA:
 * a planilha é preenchida em abas por frente, e o mesmo equipamento aparece em
 * mais de uma aba. Quando os dados são importados, os registros de um dia podem
 * ser gravados depois dos de outro dia — e ordenar por data de gravação devolvia
 * como "último" um apontamento antigo. O horímetro é sequencial (o final de um
 * é o inicial do próximo), então ele é a única ordenação confiável.
 *
 * A tela descarta lançamento inválido (final menor que inicial, mais de 24 h,
 * leitura zerada) e informa quantos foram descartados.
 */
import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadError } from '@/components/LoadError'
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
import { Paginacao, POR_PAGINA } from '@/components/Paginacao'

function diasAtras(n: number): string {
  const h = hojeISO()
  const [a, m, d] = h.split('-').map(Number)
  const dt = new Date(a, m - 1, d - n)
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${dt.getFullYear()}-${mm}-${dd}`
}

export function Horimetro() {
  const [resumos, setResumos] = useState<ResumoHorimetro[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  // Janela padrão: 120 dias, que cobre os ciclos carregados.
  const [de, setDe] = useState(diasAtras(120))
  const [ate, setAte] = useState(hojeISO())
  const [pagina, setPagina] = useState(1)

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

  useEffect(() => {
    setPagina(1)
  }, [de, ate])

  const totalPaginas = Math.max(1, Math.ceil(resumos.length / POR_PAGINA))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const daPagina = useMemo(
    () => resumos.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA),
    [resumos, paginaAtual],
  )

  const total = useMemo(
    () => ({
      /** soma dos totais de conferência diária de todos os equipamentos */
      totalDia: resumos.reduce((s, r) => s + r.totalDoisUltimos, 0),
      equipamentos: resumos.length,
      semApontamento: resumos.filter((r) => r.diasSemApontamento >= 3).length,
      descartados: resumos.reduce((s, r) => s + r.descartados, 0),
      /** equipamentos cujo total do intervalo não bate com as horas apontadas */
      divergentes: resumos.filter((r) => Math.abs(r.totalDoisUltimos - r.horasDoisUltimos) > 0.05)
        .length,
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
            De cada equipamento: o <b>penúltimo</b> e o <b>último</b> lançamento válido. A ordem é
            pelo horímetro da máquina, não pela data de digitação — assim registro importado fora de
            ordem não aparece trocado.
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

      <div className="grid gap-3 sm:grid-cols-4">
        <Card className="border-blue-200 bg-blue-50/60">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
              Total dos 2 últimos
            </p>
            <p className="mt-1 text-2xl font-bold text-blue-800">{formatHoras(total.totalDia)} h</p>
            <p className="text-[10px] text-blue-700">soma do intervalo de todos os equipamentos</p>
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
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Não batem</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{total.divergentes}</p>
            <p className="text-[10px] text-slate-500">total × horas apontadas</p>
          </CardContent>
        </Card>
      </div>

      {total.descartados > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-[12.5px] text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <b>{total.descartados} lançamento(s)</b> foram ignorados por serem inválidos (horímetro
            final menor que o inicial, mais de 24 h ou leitura zerada). Eles continuam em
            Lançamentos para conferência.
          </span>
        </div>
      )}

      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Truck className="h-4 w-4 text-blue-600" /> Frota — penúltimo e último lançamento
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
            <>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full min-w-[1000px] text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Equipamento</th>
                      <th className="px-3 py-2 text-right">Penúltimo horímetro</th>
                      <th className="px-3 py-2 text-right">Último horímetro</th>
                      <th className="px-3 py-2 text-right font-bold text-blue-800">Total dos 2</th>
                      <th className="px-3 py-2 text-right">Horas apontadas</th>
                      <th className="px-3 py-2">Último lançamento</th>
                      <th className="px-3 py-2">Situação</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {daPagina.map((r) => {
                      // o total do intervalo deve casar com as horas apontadas
                      const diverge = Math.abs(r.totalDoisUltimos - r.horasDoisUltimos) > 0.05
                      return (
                        <tr
                          key={r.equipamento.id}
                          className={
                            diverge ? 'bg-amber-50/60 hover:bg-amber-50' : 'hover:bg-slate-50/70'
                          }
                        >
                          <td className="px-3 py-2 font-semibold text-slate-800">
                            {r.equipamento.identificacao}
                            {r.descartados > 0 && (
                              <span
                                className="ml-1 text-[10px] font-normal text-amber-600"
                                title={`${r.descartados} lançamento(s) inválido(s) ignorado(s)`}
                              >
                                ⚠{r.descartados}
                              </span>
                            )}
                          </td>

                          {/* PENÚLTIMO horímetro */}
                          <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-500">
                            {r.penultimo ? (
                              <>
                                <div>{formatHoras(r.penultimo.horimetroFinal)}</div>
                                <div className="text-[10px] text-slate-400">
                                  {formatDataBR(r.penultimo.data)}
                                </div>
                              </>
                            ) : (
                              '—'
                            )}
                          </td>

                          {/* ÚLTIMO horímetro */}
                          <td className="whitespace-nowrap px-3 py-2 text-right font-bold tabular-nums text-blue-700">
                            {r.ultimo ? (
                              <>
                                <div>{formatHoras(r.ultimo.horimetroFinal)}</div>
                                <div className="text-[10px] font-normal text-slate-400">
                                  {formatDataBR(r.ultimo.data)}
                                </div>
                              </>
                            ) : (
                              '—'
                            )}
                          </td>

                          {/* TOTAL DOS DOIS — o número da conferência diária */}
                          <td
                            className="whitespace-nowrap px-3 py-2 text-right text-base font-extrabold tabular-nums text-blue-900"
                            title="Quanto o horímetro andou entre o penúltimo e o último lançamento"
                          >
                            {formatHoras(r.totalDoisUltimos)}
                          </td>

                          {/* horas apontadas nos dois */}
                          <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-600">
                            {formatHoras(r.horasDoisUltimos)}
                            {diverge && (
                              <AlertTriangle className="ml-1 inline h-3 w-3 text-amber-600" />
                            )}
                          </td>

                          <td className="whitespace-nowrap px-3 py-2 text-[11px] text-slate-600">
                            {r.ultimo ? (
                              <>
                                <div className="font-medium">{formatDataBR(r.ultimo.data)}</div>
                                <div className="text-[10px] text-slate-400">
                                  {r.ultimo.turno} · {r.ultimo.operador || '—'}
                                </div>
                              </>
                            ) : (
                              '—'
                            )}
                          </td>

                          <td className="px-3 py-2">
                            {r.diasSemApontamento >= 3 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-orange-600">
                                <AlertTriangle className="h-3 w-3" /> {r.diasSemApontamento} dias
                                parado
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
                      )
                    })}
                  </tbody>
                  <tfoot className="bg-blue-50 font-bold text-slate-800">
                    <tr>
                      <td className="px-3 py-2 text-[11px] uppercase" colSpan={3}>
                        Total dos 2 últimos ({total.equipamentos} equipamento(s))
                      </td>
                      <td className="px-3 py-2 text-right text-base font-extrabold tabular-nums text-blue-900">
                        {formatHoras(daPagina.reduce((s, r) => s + r.totalDoisUltimos, 0))}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatHoras(daPagina.reduce((s, r) => s + r.horasDoisUltimos, 0))}
                      </td>
                      <td colSpan={3}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="mt-3">
                <Paginacao
                  pagina={paginaAtual}
                  totalPaginas={totalPaginas}
                  totalItens={resumos.length}
                  porPagina={POR_PAGINA}
                  onMudar={setPagina}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <p className="text-[11px] leading-relaxed text-slate-500">
        <b>Total dos 2</b> é a diferença entre o último e o penúltimo horímetro lançado de cada
        equipamento — serve para conferir o dia, não o mês. A coluna <b>Horas apontadas</b> mostra o
        que foi lançado nesses mesmos dois apontamentos: quando os dois números não batem, a linha
        fica em amarelo com ⚠. A ordem é pelo <b>horímetro</b> e não pela data de digitação, então
        registro importado fora de ordem não aparece trocado. Lançamentos inválidos (final menor que
        o inicial, mais de 24 h ou leitura zerada) são ignorados e sinalizados com ⚠ no equipamento.
      </p>
    </div>
  )
}

export default Horimetro

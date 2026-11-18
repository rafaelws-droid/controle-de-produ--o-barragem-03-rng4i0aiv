import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  History,
  PlusCircle,
  Loader2,
  Search,
  Trash2,
  Pencil,
  CalendarDays,
  AlertTriangle,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { LoadError } from '@/components/LoadError'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import {
  equipamentosService,
  frentesService,
  lancamentosService,
  operadoresService,
} from '@/services/producao'
import {
  descreverMarcacoes,
  formatDataBR,
  formatHoras,
  nomeEquipamento,
  nomeOperador,
} from '@/lib/exportUtils'
import type { Equipamento, Frente, Lancamento, Operador } from '@/types'

export default function Lancamentos() {
  const { toast } = useToast()
  const { ehGestor } = useAuth()
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [frentes, setFrentes] = useState<Frente[]>([])
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [operadores, setOperadores] = useState<Operador[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erroCarga, setErroCarga] = useState(false)

  const [busca, setBusca] = useState('')
  const [frenteFiltro, setFrenteFiltro] = useState('')
  const [de, setDe] = useState('')
  const [ate, setAte] = useState('')
  /** true = mostrar só os lançamentos marcados para conferência */
  const [soConferir, setSoConferir] = useState(false)
  /** paginação: a lista passa de mil linhas e não pode carregar tudo na tela */
  const [pagina, setPagina] = useState(1)
  const POR_PAGINA = 10

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

  const filtrados = useMemo(() => {
    return lancamentos.filter((l) => {
      if (frenteFiltro && l.frente !== frenteFiltro) return false
      if (de && l.data < de) return false
      if (ate && l.data > ate) return false
      if (soConferir && !l.conferir) return false
      if (busca.trim()) {
        const alvo = busca.trim().toUpperCase()
        const texto = [nomeEquipamento(l), nomeOperador(l), l.servico, l.expand?.frente?.nome || '']
          .join(' ')
          .toUpperCase()
        if (!texto.includes(alvo)) return false
      }
      return true
    })
  }, [lancamentos, frenteFiltro, de, ate, busca, soConferir])

  /** Quantos lançamentos do período pedem conferência. */
  const totalConferir = useMemo(() => filtrados.filter((l) => l.conferir).length, [filtrados])

  const totalHoras = filtrados.reduce((a, l) => a + (l.horas || 0), 0)
  const totalViagens = filtrados.reduce((a, l) => a + (l.viagens || 0), 0)

  // ---- paginação de 10 em 10 ----
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
  const paginaAtual = Math.min(pagina, totalPaginas)
  /** só esta fatia vai para a tabela: é o que deixa a tela leve */
  const daPagina = useMemo(
    () => filtrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA),
    [filtrados, paginaAtual],
  )

  // qualquer filtro novo volta para a primeira página
  useEffect(() => {
    setPagina(1)
  }, [frenteFiltro, de, ate, busca, soConferir])

  const excluir = async (l: Lancamento) => {
    const ok = window.confirm(
      `Excluir o lançamento de ${nomeEquipamento(l)} em ${formatDataBR(l.data)} (${formatHoras(l.horas)} h)?\n\nEssa ação não pode ser desfeita.`,
    )
    if (!ok) return
    try {
      await lancamentosService.delete(l.id)
      // Recarrega do servidor para os totais (horas/viagens) ficarem corretos.
      await carregar()
      toast({
        title: 'Lançamento excluído',
        description: `${nomeEquipamento(l)} · ${formatDataBR(l.data)} removido.`,
      })
    } catch (e) {
      console.error(e)
      toast({
        title: 'Não foi possível excluir',
        description:
          'Só o gestor pode apagar um lançamento. Se o problema continuar, tente de novo.',
        variant: 'destructive',
      })
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-12">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
          <p className="text-sm">Carregando lançamentos...</p>
        </div>
      </div>
    )
  }

  if (erroCarga) {
    return (
      <LoadError
        title="Erro ao carregar os lançamentos"
        message="Não foi possível buscar os registros de produção."
        onRetry={carregar}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            <History className="h-7 w-7 text-blue-600" />
            Lançamentos
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {filtrados.length} apontamento(s) • {formatHoras(totalHoras)} h • {totalViagens} viagens
          </p>
        </div>
        <Button
          asChild
          className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          <Link to="/novo">
            <PlusCircle className="h-4 w-4" />
            Novo Lançamento
          </Link>
        </Button>
      </div>

      {/* Filtros */}
      <Card className="border-slate-200">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Equipamento, operador, serviço..."
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Frente</Label>
            <select
              value={frenteFiltro}
              onChange={(e) => setFrenteFiltro(e.target.value)}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
            >
              <option value="">Todas as frentes</option>
              {frentes.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">De</Label>
            <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Até</Label>
            <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* aviso de conferência: só aparece quando existe algum marcado */}
      {totalConferir > 0 && (
        <div className="flex flex-col gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-[12.5px] text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <b>{totalConferir} lançamento(s)</b> com as horas abaixo do horímetro — normalmente
              parada da máquina. Vale conferir.
            </span>
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoConferir((v) => !v)}
            className={
              soConferir
                ? 'border-amber-500 bg-amber-500 font-bold text-white hover:bg-amber-600'
                : 'border-amber-400 text-amber-800 hover:bg-amber-100'
            }
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            {soConferir ? 'Mostrando só os marcados' : 'Ver só os marcados'}
          </Button>
        </div>
      )}

      {filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <CalendarDays className="mb-3 h-12 w-12 text-slate-300" />
          <h3 className="text-base font-semibold text-slate-800">Nenhum lançamento encontrado</h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Ajuste os filtros ou registre a produção do dia.
          </p>
          <Button asChild className="mt-4 bg-blue-600 text-white hover:bg-blue-700">
            <Link to="/novo">Lançar produção</Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Data</th>
                <th className="px-3 py-2">Frente</th>
                <th className="px-3 py-2">Equip.</th>
                <th className="px-3 py-2">Operador</th>
                <th className="px-3 py-2">Turno</th>
                <th className="px-3 py-2 text-right">Ini.</th>
                <th className="px-3 py-2 text-right">Fim</th>
                <th className="px-3 py-2 text-right">Horas</th>
                <th className="px-3 py-2 text-right">Viag.</th>
                <th className="px-3 py-2">Serviço / Ocorrências</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {daPagina.map((l) => (
                <tr
                  key={l.id}
                  className={
                    l.conferir ? 'bg-amber-50/80 hover:bg-amber-50' : 'hover:bg-slate-50/70'
                  }
                >
                  <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-700">
                    <span className="flex items-center gap-1">
                      {l.conferir && (
                        <AlertTriangle
                          className="h-3.5 w-3.5 shrink-0 text-amber-600"
                          aria-label="Conferir"
                        />
                      )}
                      {formatDataBR(l.data)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{l.expand?.frente?.nome || '-'}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-semibold text-slate-800">
                    {nomeEquipamento(l)}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{nomeOperador(l)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-500">{l.turno}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                    {formatHoras(l.horimetro_inicial)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                    {formatHoras(l.horimetro_final)}
                  </td>
                  <td className="px-3 py-2 text-right font-bold tabular-nums text-blue-700">
                    {formatHoras(l.horas)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                    {l.viagens || '-'}
                  </td>
                  <td className="max-w-[280px] px-3 py-2 text-slate-600">
                    <p className="truncate">{l.servico}</p>
                    {descreverMarcacoes(l) && (
                      <p className="truncate text-[10px] text-slate-400">{descreverMarcacoes(l)}</p>
                    )}
                    {l.observacao && (
                      <p className="truncate text-[10px] text-slate-400">{l.observacao}</p>
                    )}
                    {l.conferir && l.motivo_conferir && (
                      <p className="mt-0.5 text-[10px] font-semibold text-amber-700">
                        ⚠ {l.motivo_conferir}
                      </p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {ehGestor ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          title="Editar lançamento"
                          className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600"
                        >
                          <Link to={`/lancamento/${l.id}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => excluir(l)}
                          title="Excluir lançamento"
                          className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-bold text-slate-800">
              <tr>
                <td className="px-3 py-2" colSpan={7}>
                  TOTAL ({filtrados.length} lançamentos)
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-blue-700">
                  {formatHoras(totalHoras)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{totalViagens}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* paginação de 10 em 10 */}
      {filtrados.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <p className="text-[11.5px] text-slate-500">
            Mostrando{' '}
            <b className="text-slate-800">
              {(paginaAtual - 1) * POR_PAGINA + 1}–
              {Math.min(paginaAtual * POR_PAGINA, filtrados.length)}
            </b>{' '}
            de <b className="text-slate-800">{filtrados.length}</b> lançamentos · {totalPaginas}{' '}
            página(s)
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagina(1)}
              disabled={paginaAtual === 1}
              className="h-9 px-2"
              title="Primeira página"
            >
              «
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={paginaAtual === 1}
              className="h-9 px-3 font-semibold"
            >
              Anterior
            </Button>
            <span className="min-w-[70px] text-center text-[12px] font-bold text-slate-700">
              {paginaAtual} / {totalPaginas}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaAtual === totalPaginas}
              className="h-9 px-3 font-semibold"
            >
              Próxima
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagina(totalPaginas)}
              disabled={paginaAtual === totalPaginas}
              className="h-9 px-2"
              title="Última página"
            >
              »
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  PlusCircle,
  Save,
  Loader2,
  AlertCircle,
  Clock,
  Gauge,
  Truck,
  User,
  Route,
  CheckCircle2,
  Pencil,
  Settings2,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadError } from '@/components/LoadError'
import { SelectNativo } from '@/components/SelectNativo'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import {
  calcularHoras,
  contaViagens,
  equipamentosService,
  frentesService,
  lancamentosService,
  operadoresService,
  turnosService,
} from '@/services/producao'
import { formatHoras, formatDataBR } from '@/lib/exportUtils'
import { hojeISO } from '@/lib/utils'
import {
  FLAGS,
  SERVICOS_COMUNS,
  TURNOS_PADRAO,
  type Turno,
  type Equipamento,
  type Frente,
  type Operador,
} from '@/types'

// Data de hoje vem de `hojeISO()` em @/lib/utils, que respeita o fuso do Brasil.
// (NÃO usar toISOString(): das 21h à meia-noite o Brasil ainda é o dia anterior
// em UTC e o formulário abria com a data de amanhã.)

export default function NovoLancamento() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { toast } = useToast()
  // Quando a rota traz :id, a tela esta editando um lancamento existente.
  const { id: idEdicao } = useParams<{ id: string }>()
  const editando = !!idEdicao
  const { ehGestor } = useAuth()

  const [frentes, setFrentes] = useState<Frente[]>([])
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [operadores, setOperadores] = useState<Operador[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erroCarga, setErroCarga] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  /**
   * Aviso do turno: preenchido quando o último lançamento do dia é do 1º turno e
   * o 2º (o último do dia) ainda não foi lançado. A sugestão vem de um valor
   * REAL, mas vai aumentar — o lançador precisa saber antes de confiar nele.
   */
  const [avisoTurno, setAvisoTurno] = useState<{
    valor: number | null
    data: string | null
    turno: string | null
  } | null>(null)

  const [data, setData] = useState(hojeISO())
  const [frenteId, setFrenteId] = useState(params.get('frente') || '')
  const [equipamentoId, setEquipamentoId] = useState('')
  const [operadorId, setOperadorId] = useState('')
  const [turno, setTurno] = useState('1º TURNO')
  const [hi, setHi] = useState('')
  const [hf, setHf] = useState('')
  const [viagens, setViagens] = useState('')
  const [servico, setServico] = useState('')
  const [flags, setFlags] = useState<Record<string, boolean>>({})
  const [substituindo, setSubstituindo] = useState('')
  const [observacao, setObservacao] = useState('')

  // Cadastro de turnos: o gestor cria e apaga aqui mesmo, sem sair do formulario.
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [novoTurno, setNovoTurno] = useState('')
  const [gerenciarTurnos, setGerenciarTurnos] = useState(false)
  const [salvandoTurno, setSalvandoTurno] = useState(false)

  const carregar = async () => {
    try {
      setCarregando(true)
      setErroCarga(false)
      const [fs, es, os, ts] = await Promise.all([
        frentesService.getAll(),
        equipamentosService.getAll(),
        operadoresService.getAll(),
        turnosService.getAll(),
      ])
      setFrentes(fs)
      setEquipamentos(es)
      setOperadores(os)
      setTurnos(ts)

      // Edicao: preenche o formulario com o que ja esta gravado.
      if (idEdicao) {
        const l = await lancamentosService.getById(idEdicao)
        setData(l.data)
        setFrenteId(l.frente)
        setEquipamentoId(l.equipamento)
        setOperadorId(l.operador)
        setTurno(l.turno)
        setHi(String(l.horimetro_inicial))
        setHf(String(l.horimetro_final))
        setViagens(l.viagens ? String(l.viagens) : '')
        setServico(l.servico)
        setSubstituindo(l.substituindo || '')
        setObservacao(l.observacao || '')
        const marcadas: Record<string, boolean> = {}
        for (const f of FLAGS) {
          if (l[f.campo as keyof typeof l]) marcadas[f.campo as string] = true
        }
        setFlags(marcadas)
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

  const frente = frentes.find((f) => f.id === frenteId)

  /**
   * Horímetro inicial automático: ao escolher o equipamento, busca o último
   * horímetro final lançado e já preenche o campo — o administrativo digita
   * apenas a leitura do fim do turno.
   */
  useEffect(() => {
    let ativo = true
    // Na edicao o horimetro ja vem do registro: nao buscar o ultimo do equipamento.
    if (editando) return
    setAvisoTurno(null)
    if (!equipamentoId) {
      setHi('')
      return
    }
    void lancamentosService
      .sugestaoHorimetro(equipamentoId)
      .then((s) => {
        if (!ativo) return
        setHi(s.valor === null ? '' : String(s.valor))
        // Aviso: o último lançamento do dia é do 1º turno e o 2º ainda não existe.
        // O valor sugerido é real, mas vai aumentar quando o 2º turno for lançado.
        setAvisoTurno(
          s.faltaSegundoTurno
            ? {
                valor: s.valor,
                data: s.data,
                turno: s.turno,
              }
            : null,
        )
      })
      .catch(() => {
        if (ativo) {
          setHi('')
          setAvisoTurno(null)
        }
      })
    return () => {
      ativo = false
    }
  }, [equipamentoId, editando])

  const horas = useMemo(() => {
    const i = hi === '' ? null : Number(hi.replace(',', '.'))
    const f = hf === '' ? null : Number(hf.replace(',', '.'))
    return calcularHoras(i, f)
  }, [hi, hf])

  const usaViagens = contaViagens(frente)

  const criarTurno = async () => {
    const nome = novoTurno.trim().toUpperCase()
    if (!nome) return
    if (turnos.some((t) => t.nome.toUpperCase() === nome)) {
      toast({
        title: 'Turno já existe',
        description: `${nome} já está cadastrado.`,
        variant: 'destructive',
      })
      return
    }
    try {
      setSalvandoTurno(true)
      const criado = await turnosService.create({
        nome,
        ordem: turnos.length + 1,
        ativo: true,
      })
      setTurnos((lista) => [...lista, criado])
      setNovoTurno('')
      setTurno(nome)
      toast({ title: 'Turno criado', description: `${nome} já está disponível.` })
    } catch (e) {
      console.error(e)
      toast({
        title: 'Não foi possível criar o turno',
        description: 'Só o gestor pode cadastrar turno.',
        variant: 'destructive',
      })
    } finally {
      setSalvandoTurno(false)
    }
  }

  const excluirTurno = async (t: Turno) => {
    const ok = window.confirm(`Apagar o turno "${t.nome}"?`)
    if (!ok) return
    try {
      await turnosService.delete(t.id)
      setTurnos((lista) => lista.filter((x) => x.id !== t.id))
      if (turno === t.nome) setTurno('')
      toast({ title: 'Turno apagado', description: `${t.nome} foi removido.` })
    } catch (e) {
      console.error(e)
      toast({
        title: 'Não foi possível apagar',
        description: 'Verifique se o turno já está em uso num lançamento.',
        variant: 'destructive',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    if (!data) return setErro('Informe a data do lançamento.')
    if (!frenteId) return setErro('Selecione a frente de serviço.')
    if (!equipamentoId) return setErro('Selecione o equipamento.')
    if (!operadorId) return setErro('Selecione o operador/motorista.')
    if (!turno) return setErro('Selecione o turno.')
    if (hi === '' || Number.isNaN(Number(hi.replace(',', '.'))))
      return setErro('Informe o horímetro inicial.')
    if (hf === '' || Number.isNaN(Number(hf.replace(',', '.'))))
      return setErro('Informe o horímetro final.')
    if (horas <= 0)
      return setErro(
        'O horímetro final precisa ser maior que o inicial (as horas lançadas devem ser maiores que zero).',
      )
    if (!servico.trim()) return setErro('Descreva o serviço executado.')

    const registro: Record<string, unknown> = {
      data,
      frente: frenteId,
      equipamento: equipamentoId,
      operador: operadorId,
      turno,
      horimetro_inicial: Number(hi.replace(',', '.')),
      horimetro_final: Number(hf.replace(',', '.')),
      horas,
      servico: servico.trim(),
      observacao: observacao.trim(),
    }
    for (const f of FLAGS) {
      registro[f.campo as string] = !!flags[f.campo as string]
    }
    if (usaViagens && viagens !== '') registro.viagens = Number(viagens)
    if (substituindo) registro.substituindo = substituindo

    try {
      setSalvando(true)
      if (editando && idEdicao) {
        await lancamentosService.update(idEdicao, registro)
        toast({
          title: 'Lançamento atualizado',
          description: `${formatHoras(horas)} h em ${data.split('-').reverse().join('/')}.`,
        })
      } else {
        await lancamentosService.create(registro)
        toast({
          title: 'Lançamento gravado!',
          description: `${formatHoras(horas)} h registradas em ${data.split('-').reverse().join('/')}.`,
        })
      }
      navigate('/lancamentos')
    } catch (err) {
      console.error(err)
      setErro(
        editando
          ? 'Não foi possível salvar a alteração. Confira os dados e tente novamente.'
          : 'Não foi possível salvar o lançamento. Confira os dados e tente novamente.',
      )
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-12">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
          <p className="text-sm">Carregando formulário...</p>
        </div>
      </div>
    )
  }

  if (erroCarga) {
    return (
      <LoadError
        title="Erro ao carregar o formulário"
        message="Não foi possível buscar frentes, equipamentos e operadores."
        onRetry={carregar}
      />
    )
  }

  const equipamentosDaFrente = equipamentos

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {editando ? (
            <Pencil className="h-7 w-7 text-blue-600" />
          ) : (
            <PlusCircle className="h-7 w-7 text-blue-600" />
          )}
          {editando ? 'Editar Lançamento' : 'Novo Lançamento de Produção'}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {editando
            ? 'Altere o que precisar e salve. As horas são recalculadas pelo horímetro.'
            : 'O horímetro inicial vem preenchido com a última leitura do equipamento — digite apenas o valor do fim do turno.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border-slate-200 lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-slate-900">
              Dados do apontamento
            </CardTitle>
            <CardDescription>
              Data, frente, equipamento, operador, horímetro e serviço executado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {erro && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{erro}</span>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label
                  htmlFor="data"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"
                >
                  <Clock className="h-3.5 w-3.5 text-blue-600" />
                  Data
                </Label>
                <Input
                  id="data"
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="turno" className="text-xs font-semibold text-slate-700">
                    Turno
                  </Label>
                  {ehGestor && (
                    <button
                      type="button"
                      onClick={() => setGerenciarTurnos((v) => !v)}
                      className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:underline"
                      title="Criar ou apagar turno"
                    >
                      <Settings2 className="h-3 w-3" />
                      {gerenciarTurnos ? 'Fechar' : 'Criar/apagar turno'}
                    </button>
                  )}
                </div>
                <SelectNativo
                  id="turno"
                  value={turno}
                  onChange={setTurno}
                  placeholder="Selecione o turno"
                  options={(turnos.length ? turnos.map((t) => t.nome) : TURNOS_PADRAO).map((t) => ({
                    value: t,
                    label: t,
                  }))}
                />

                {gerenciarTurnos && ehGestor && (
                  <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
                    <div className="flex gap-1.5">
                      <Input
                        value={novoTurno}
                        onChange={(e) => setNovoTurno(e.target.value.toUpperCase())}
                        placeholder="Ex.: 4º TURNO"
                        className="h-9"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={criarTurno}
                        disabled={salvandoTurno || !novoTurno.trim()}
                        className="h-9 shrink-0 bg-blue-600 text-white hover:bg-blue-700"
                      >
                        {salvandoTurno ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <PlusCircle className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                    {turnos.length === 0 ? (
                      <p className="text-[11px] text-slate-500">
                        Nenhum turno cadastrado — os três turnos padrão continuam valendo.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-200">
                        {turnos.map((t) => (
                          <div key={t.id} className="flex items-center justify-between gap-2 py-1">
                            <span className="text-xs font-medium text-slate-700">{t.nome}</span>
                            <button
                              type="button"
                              onClick={() => excluirTurno(t)}
                              className="text-slate-400 hover:text-red-600"
                              title="Apagar turno"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="frente"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"
              >
                <Truck className="h-3.5 w-3.5 text-blue-600" />
                Frente de serviço
              </Label>
              <SelectNativo
                id="frente"
                value={frenteId}
                onChange={setFrenteId}
                placeholder="Selecione a frente"
                options={frentes.map((f) => ({ value: f.id, label: f.nome }))}
              />
              {frente?.garantia_horas ? (
                <p className="text-[11px] text-slate-500">
                  Garantia mensal desta frente: <b>{formatHoras(frente.garantia_horas)} h</b>
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="equipamento" className="text-xs font-semibold text-slate-700">
                  Equipamento
                </Label>
                <SelectNativo
                  id="equipamento"
                  value={equipamentoId}
                  onChange={setEquipamentoId}
                  placeholder="Selecione o equipamento"
                  options={equipamentosDaFrente.map((e) => ({
                    value: e.id,
                    label: e.descricao ? `${e.identificacao} — ${e.descricao}` : e.identificacao,
                  }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="operador"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"
                >
                  <User className="h-3.5 w-3.5 text-blue-600" />
                  Operador / Motorista
                </Label>
                <SelectNativo
                  id="operador"
                  value={operadorId}
                  onChange={setOperadorId}
                  placeholder="Selecione o operador"
                  options={operadores.map((o) => ({
                    value: o.id,
                    label: o.funcao ? `${o.nome} (${o.funcao})` : o.nome,
                  }))}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="hi"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"
                >
                  <Gauge className="h-3.5 w-3.5 text-blue-600" />
                  Horímetro inicial
                </Label>
                <Input
                  id="hi"
                  inputMode="decimal"
                  placeholder="0.0"
                  value={hi}
                  onChange={(e) => {
                    setHi(e.target.value)
                    // o lançador mexeu no valor: o aviso deixa de fazer sentido
                    setAvisoTurno(null)
                  }}
                  className={avisoTurno ? 'border-amber-400 bg-amber-50' : undefined}
                />
                {avisoTurno && (
                  <div className="mt-1 flex items-start gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2 py-1.5 text-[11px] leading-snug text-amber-900">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                    <span>
                      Este valor é do <b>{avisoTurno.turno}</b>
                      {avisoTurno.data ? ` de ${formatDataBR(avisoTurno.data)}` : ''}. O{' '}
                      <b>2º turno</b> ainda não foi lançado — quando for, a leitura será{' '}
                      <b>maior</b>. Confirme com o operador antes de gravar.
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hf" className="text-xs font-semibold text-slate-700">
                  Horímetro final
                </Label>
                <Input
                  id="hf"
                  inputMode="decimal"
                  placeholder="0.0"
                  value={hf}
                  onChange={(e) => setHf(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Total de horas</Label>
                <div className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-blue-700">
                  {formatHoras(horas)} h
                </div>
              </div>
            </div>

            {usaViagens && (
              <div className="space-y-1.5">
                <Label
                  htmlFor="viagens"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"
                >
                  <Route className="h-3.5 w-3.5 text-blue-600" />
                  Total de viagens
                </Label>
                <Input
                  id="viagens"
                  inputMode="numeric"
                  placeholder="0"
                  value={viagens}
                  onChange={(e) => setViagens(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="servico" className="text-xs font-semibold text-slate-700">
                Serviço executado
              </Label>
              <Input
                id="servico"
                list="servicos"
                placeholder="Ex.: LIMPEZA DE CANAL"
                value={servico}
                onChange={(e) => setServico(e.target.value.toUpperCase())}
              />
              <datalist id="servicos">
                {SERVICOS_COMUNS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
              <p className="text-[11px] text-slate-500">
                Digite ou escolha na lista — os serviços mais usados já estão sugeridos.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="observacao" className="text-xs font-semibold text-slate-700">
                Ocorrências do turno
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {FLAGS.map((f) => {
                  const chave = f.campo as string
                  const ativo = !!flags[chave]
                  return (
                    <button
                      key={chave}
                      type="button"
                      onClick={() => setFlags((s) => ({ ...s, [chave]: !ativo }))}
                      className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        ativo
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 bg-white text-slate-600 hover:border-blue-300'
                      }`}
                    >
                      {ativo && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {f.label}
                    </button>
                  )
                })}
              </div>
              <Textarea
                id="observacao"
                rows={2}
                placeholder="Escreva aqui a ocorrência do turno. Ex.: manutenção das 07:00 às 09:00; parada por chuva."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
              <p className="text-[11px] text-slate-500">
                Marque as ocorrências acima e/ou escreva o que aconteceu no turno.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="substituindo" className="text-xs font-semibold text-slate-700">
                Substituindo equipamento (opcional)
              </Label>
              <SelectNativo
                id="substituindo"
                value={substituindo}
                onChange={setSubstituindo}
                placeholder="Nenhum"
                options={equipamentos
                  .filter((e) => e.id !== equipamentoId)
                  .map((e) => ({ value: e.id, label: e.identificacao }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Resumo */}
        <Card className="h-fit border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Data</span>
              <span className="font-medium text-slate-800">
                {data ? data.split('-').reverse().join('/') : '-'}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="shrink-0 text-slate-500">Frente</span>
              <span className="truncate text-right font-medium text-slate-800">
                {frente?.nome || '-'}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="shrink-0 text-slate-500">Equipamento</span>
              <span className="truncate text-right font-medium text-slate-800">
                {equipamentos.find((e) => e.id === equipamentoId)?.identificacao || '-'}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="shrink-0 text-slate-500">Operador</span>
              <span className="truncate text-right font-medium text-slate-800">
                {operadores.find((o) => o.id === operadorId)?.nome || '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Turno</span>
              <span className="font-medium text-slate-800">{turno || '-'}</span>
            </div>
            <div className="border-t border-slate-100 pt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-slate-500">Total de horas</span>
                <span className="text-xl font-bold text-blue-700">{formatHoras(horas)} h</span>
              </div>
              {usaViagens && (
                <div className="mt-1 flex justify-between">
                  <span className="text-slate-500">Viagens</span>
                  <span className="font-medium text-slate-800">{viagens || '0'}</span>
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={salvando}
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
            >
              {salvando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {editando ? 'Salvar Alteração' : 'Salvar Lançamento'}
                </>
              )}
            </Button>

            {editando && (
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/lancamentos')}
                className="w-full"
              >
                Cancelar
              </Button>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

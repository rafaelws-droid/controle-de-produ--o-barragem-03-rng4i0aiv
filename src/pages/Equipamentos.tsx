import { useEffect, useState } from 'react'
import { Truck, Plus, Loader2, Gauge, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadError } from '@/components/LoadError'
import { useToast } from '@/hooks/use-toast'
import { equipamentosService, frentesService } from '@/services/producao'
import { formatHoras } from '@/lib/exportUtils'
import type { Categoria, Equipamento, Frente } from '@/types'

const CATEGORIAS: Categoria[] = [
  'ESCAVADEIRA',
  'PÁ CARREGADEIRA',
  'CAMINHÃO',
  'CAMINHÃO PIPA',
  'ROLO COMPACTADOR',
  'OUTRO',
]

export default function Equipamentos() {
  const { toast } = useToast()
  const [frentes, setFrentes] = useState<Frente[]>([])
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erroCarga, setErroCarga] = useState(false)

  const [novaFrente, setNovaFrente] = useState('')
  const [novaGarantia, setNovaGarantia] = useState('')

  const [identificacao, setIdentificacao] = useState('')
  const [descricao, setDescricao] = useState('')
  const [categoria, setCategoria] = useState<Categoria>('CAMINHÃO')
  const [salvando, setSalvando] = useState(false)

  const carregar = async () => {
    try {
      setCarregando(true)
      setErroCarga(false)
      const [fs, es] = await Promise.all([frentesService.getAll(), equipamentosService.getAll()])
      setFrentes(fs)
      setEquipamentos(es)
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

  const criarFrente = async () => {
    if (!novaFrente.trim()) return
    try {
      await frentesService.create({
        nome: novaFrente.trim().toUpperCase(),
        garantia_horas: Number(novaGarantia.replace(',', '.')) || 0,
        ordem: frentes.length + 1,
        ativo: true,
      })
      setNovaFrente('')
      setNovaGarantia('')
      await carregar()
      toast({ title: 'Frente cadastrada', description: 'A frente de serviço foi criada.' })
    } catch (e) {
      console.error(e)
      toast({
        title: 'Erro ao salvar frente',
        description: 'Verifique se já existe uma frente com esse nome.',
        variant: 'destructive',
      })
    }
  }

  const editarGarantia = async (f: Frente) => {
    const valor = window.prompt(
      `Garantia de horas mensais para "${f.nome}":`,
      String(f.garantia_horas ?? 0),
    )
    if (valor === null) return
    try {
      await frentesService.update(f.id, { garantia_horas: Number(valor.replace(',', '.')) || 0 })
      await carregar()
      toast({ title: 'Garantia atualizada' })
    } catch (e) {
      console.error(e)
      toast({ title: 'Erro ao atualizar', variant: 'destructive' })
    }
  }

  const criarEquipamento = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identificacao.trim()) return
    try {
      setSalvando(true)
      await equipamentosService.create({
        identificacao: identificacao.trim().toUpperCase(),
        descricao: descricao.trim().toUpperCase(),
        categoria,
        ativo: true,
      })
      setIdentificacao('')
      setDescricao('')
      await carregar()
      toast({ title: 'Equipamento cadastrado' })
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao cadastrar equipamento',
        description: 'Verifique se esse equipamento já está cadastrado.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const excluirEquipamento = async (eq: Equipamento) => {
    const ok = window.confirm(`Excluir o equipamento ${eq.identificacao}?`)
    if (!ok) return
    try {
      await equipamentosService.delete(eq.id)
      await carregar()
      toast({ title: 'Equipamento excluído' })
    } catch (e) {
      console.error(e)
      toast({
        title: 'Não foi possível excluir',
        description: 'Esse equipamento tem lançamentos vinculados.',
        variant: 'destructive',
      })
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-12">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    )
  }

  if (erroCarga) {
    return (
      <LoadError
        title="Erro ao carregar equipamentos"
        message="Não foi possível buscar os cadastros."
        onRetry={carregar}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          <Truck className="h-7 w-7 text-blue-600" />
          Equipamentos e Frentes
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Frentes com garantia de horas mensais e o cadastro dos equipamentos.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Frentes */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Gauge className="h-4 w-4 text-blue-600" />
              Frentes e garantia de horas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Nova frente</Label>
                <Input
                  value={novaFrente}
                  onChange={(e) => setNovaFrente(e.target.value.toUpperCase())}
                  placeholder="Ex.: ESCAVADEIRA 24H"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Garantia de horas mensais
                </Label>
                <Input
                  inputMode="decimal"
                  value={novaGarantia}
                  onChange={(e) => setNovaGarantia(e.target.value)}
                  placeholder="Ex.: 500"
                />
              </div>
              <Button
                type="button"
                onClick={criarFrente}
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar frente
              </Button>
            </div>

            <div className="divide-y divide-slate-100">
              {frentes.map((f) => (
                <div key={f.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{f.nome}</p>
                    <p className="text-[11px] text-slate-500">
                      Garantia: {formatHoras(f.garantia_horas)} h/mês
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editarGarantia(f)}
                    className="h-7 shrink-0 px-2 text-xs text-blue-600 hover:bg-blue-50"
                  >
                    <Pencil className="mr-1 h-3 w-3" />
                    Editar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Equipamentos */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Truck className="h-4 w-4 text-blue-600" />
              Equipamentos ({equipamentos.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <form
              onSubmit={criarEquipamento}
              className="space-y-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Identificação</Label>
                  <Input
                    value={identificacao}
                    onChange={(e) => setIdentificacao(e.target.value.toUpperCase())}
                    placeholder="ST 57"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Categoria</Label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as Categoria)}
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                  >
                    {CATEGORIAS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Descrição (opcional)</Label>
                <Input
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value.toUpperCase())}
                  placeholder="CAMINHÃO 3344"
                />
              </div>
              <Button
                type="submit"
                disabled={salvando}
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
              >
                {salvando ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Adicionar equipamento
              </Button>
            </form>

            <div className="max-h-[420px] divide-y divide-slate-100 overflow-y-auto">
              {equipamentos.map((eq) => (
                <div key={eq.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {eq.identificacao}
                      {eq.descricao ? ` — ${eq.descricao}` : ''}
                    </p>
                    <p className="text-[11px] text-slate-500">{eq.categoria || 'OUTRO'}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => excluirEquipamento(eq)}
                    className="h-7 w-7 shrink-0 p-0 text-slate-400 hover:text-red-600"
                    title="Excluir equipamento"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

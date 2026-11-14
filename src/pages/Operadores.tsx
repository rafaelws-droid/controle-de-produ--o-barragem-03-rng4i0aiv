import { useEffect, useState } from 'react'
import { Users, Plus, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadError } from '@/components/LoadError'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { operadoresService } from '@/services/producao'
import type { Operador } from '@/types'

export default function Operadores() {
  const { toast } = useToast()
  const { ehGestor } = useAuth()
  const [operadores, setOperadores] = useState<Operador[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erroCarga, setErroCarga] = useState(false)
  const [nome, setNome] = useState('')
  const [funcao, setFuncao] = useState<'OPERADOR' | 'MOTORISTA'>('OPERADOR')
  const [salvando, setSalvando] = useState(false)
  const [busca, setBusca] = useState('')

  const carregar = async () => {
    try {
      setCarregando(true)
      setErroCarga(false)
      setOperadores(await operadoresService.getAll())
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

  const criar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return
    try {
      setSalvando(true)
      await operadoresService.create({ nome: nome.trim().toUpperCase(), funcao, ativo: true })
      setNome('')
      await carregar()
      toast({ title: 'Operador cadastrado' })
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao cadastrar',
        description: 'Verifique se a pessoa já está cadastrada.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async (o: Operador) => {
    if (!window.confirm(`Excluir ${o.nome}?`)) return
    try {
      await operadoresService.delete(o.id)
      await carregar()
      toast({ title: 'Operador excluído' })
    } catch (e) {
      console.error(e)
      toast({
        title: 'Não foi possível excluir',
        description: 'Essa pessoa tem lançamentos vinculados.',
        variant: 'destructive',
      })
    }
  }

  const filtrados = operadores.filter((o) =>
    o.nome.toUpperCase().includes(busca.trim().toUpperCase()),
  )

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
        title="Erro ao carregar operadores"
        message="Não foi possível buscar o cadastro de operadores e motoristas."
        onRetry={carregar}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          <Users className="h-7 w-7 text-blue-600" />
          Operadores e Motoristas
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {operadores.length} pessoas cadastradas — usadas no preenchimento do lançamento.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className={ehGestor ? 'h-fit border-slate-200' : 'hidden'}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">Novo cadastro</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={criar} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Nome</Label>
                <Input
                  value={nome}
                  onChange={(e) => setNome(e.target.value.toUpperCase())}
                  placeholder="Ex.: ISRAEL"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Função</Label>
                <select
                  value={funcao}
                  onChange={(e) => setFuncao(e.target.value as 'OPERADOR' | 'MOTORISTA')}
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                >
                  <option value="OPERADOR">Operador</option>
                  <option value="MOTORISTA">Motorista</option>
                </select>
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
                Cadastrar
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card
          className={ehGestor ? 'border-slate-200 lg:col-span-2' : 'border-slate-200 lg:col-span-3'}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">Cadastrados</CardTitle>
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome..."
              className="mt-2 max-w-xs"
            />
          </CardHeader>
          <CardContent>
            <div className="grid gap-x-6 sm:grid-cols-2">
              {filtrados.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between gap-2 border-b border-slate-100 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{o.nome}</p>
                    <p className="text-[11px] text-slate-500">{o.funcao || 'OPERADOR'}</p>
                  </div>
                  {ehGestor && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => excluir(o)}
                      className="h-7 w-7 shrink-0 p-0 text-slate-400 hover:text-red-600"
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              {filtrados.length === 0 && (
                <p className="text-sm text-slate-500">Nenhum nome encontrado.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

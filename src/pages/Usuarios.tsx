import { useEffect, useMemo, useState } from 'react'
import { Users, Plus, Loader2, Trash2, ShieldCheck, HardHat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadError } from '@/components/LoadError'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { usuariosService } from '@/services/producao'
import type { Papel, UsuarioSistema } from '@/types'

const senhaForte = (s: string) => s.length >= 8

export default function Usuarios() {
  const { toast } = useToast()
  const { user } = useAuth()

  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erroCarga, setErroCarga] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [papel, setPapel] = useState<Papel>('LANCADOR')

  const carregar = async () => {
    try {
      setCarregando(true)
      setErroCarga(false)
      setUsuarios(await usuariosService.getAll())
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

  const ordenados = useMemo(
    () =>
      [...usuarios].sort((a, b) => {
        if (a.papel !== b.papel) return a.papel === 'GESTOR' ? -1 : 1
        return (a.name || a.email).localeCompare(b.name || b.email)
      }),
    [usuarios],
  )

  const criar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim() || !email.trim()) {
      toast({ title: 'Informe nome e e-mail', variant: 'destructive' })
      return
    }
    if (!senhaForte(senha)) {
      toast({
        title: 'Senha curta',
        description: 'Use pelo menos 8 caracteres.',
        variant: 'destructive',
      })
      return
    }
    try {
      setSalvando(true)
      await usuariosService.create({
        name: nome.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
        password: senha,
        passwordConfirm: senha,
        papel,
      })
      setNome('')
      setEmail('')
      setSenha('')
      setPapel('LANCADOR')
      await carregar()
      toast({
        title: 'Acesso criado',
        description: `${nome.trim().toUpperCase()} já pode entrar com o e-mail e a senha informados.`,
      })
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao criar acesso',
        description: 'Verifique se esse e-mail já está cadastrado.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const trocarPapel = async (u: UsuarioSistema, novo: Papel) => {
    if (u.id === user?.id) {
      toast({
        title: 'Não é possível mudar o seu próprio papel',
        description: 'Peça a outro gestor para alterar.',
        variant: 'destructive',
      })
      return
    }
    try {
      await usuariosService.update(u.id, { papel: novo })
      await carregar()
      toast({ title: `Agora é ${novo}` })
    } catch (e) {
      console.error(e)
      toast({ title: 'Erro ao alterar papel', variant: 'destructive' })
    }
  }

  const excluir = async (u: UsuarioSistema) => {
    if (u.id === user?.id) {
      toast({
        title: 'Não é possível excluir a sua própria conta',
        variant: 'destructive',
      })
      return
    }
    if (
      !window.confirm(
        `Remover o acesso de ${u.name || u.email}? A pessoa deixa de entrar no sistema.`,
      )
    )
      return
    try {
      await usuariosService.delete(u.id)
      await carregar()
      toast({ title: 'Acesso removido' })
    } catch (e) {
      console.error(e)
      toast({ title: 'Erro ao remover acesso', variant: 'destructive' })
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-12">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
          <p className="text-sm">Carregando acessos...</p>
        </div>
      </div>
    )
  }

  if (erroCarga) {
    return (
      <LoadError
        title="Erro ao carregar os acessos"
        message="Não foi possível buscar a lista de usuários."
        onRetry={carregar}
      />
    )
  }

  const gestores = ordenados.filter((u) => u.papel === 'GESTOR').length
  const lancadores = ordenados.length - gestores

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          <Users className="h-7 w-7 text-blue-600" />
          Acessos ao sistema
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {ordenados.length} pessoa(s) com acesso — {gestores} gestor(es) e {lancadores}{' '}
          lançador(es).
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Novo acesso */}
        <Card className="h-fit border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">Novo acesso</CardTitle>
            <p className="text-[11px] text-slate-500">
              A pessoa entra com o e-mail e a senha que você definir aqui.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={criar} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Nome</Label>
                <Input
                  value={nome}
                  onChange={(e) => setNome(e.target.value.toUpperCase())}
                  placeholder="Ex.: JOÃO BATISTA"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">E-mail</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@silveiratransportes.com"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Senha inicial</Label>
                <Input
                  type="text"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="mínimo 8 caracteres"
                  autoComplete="new-password"
                />
                <p className="text-[11px] text-slate-500">
                  Combine com a pessoa e peça para trocar no primeiro acesso.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Papel</Label>
                <select
                  value={papel}
                  onChange={(e) => setPapel(e.target.value as Papel)}
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                >
                  <option value="LANCADOR">Lançador — só lança produção</option>
                  <option value="GESTOR">Gestor — lança, corrige, apaga e vê tudo</option>
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
                Criar acesso
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lista */}
        <Card className="border-slate-200 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">
              Quem tem acesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100">
              {ordenados.map((u) => {
                const ehVoce = u.id === user?.id
                return (
                  <div
                    key={u.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 truncate text-sm font-medium text-slate-800">
                        {u.papel === 'GESTOR' ? (
                          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                        ) : (
                          <HardHat className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                        )}
                        {u.name || '(sem nome)'}
                        {ehVoce && (
                          <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                            você
                          </span>
                        )}
                      </p>
                      <p className="truncate text-[11px] text-slate-500">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={u.papel || 'LANCADOR'}
                        onChange={(e) => trocarPapel(u, e.target.value as Papel)}
                        disabled={ehVoce}
                        className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <option value="LANCADOR">Lançador</option>
                        <option value="GESTOR">Gestor</option>
                      </select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => excluir(u)}
                        disabled={ehVoce}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 disabled:opacity-30"
                        title={ehVoce ? 'Você não pode excluir a própria conta' : 'Remover acesso'}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
              {ordenados.length === 0 && (
                <p className="py-4 text-sm text-slate-500">Nenhum acesso cadastrado.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardContent className="space-y-1.5 p-4 text-xs text-slate-600">
          <p className="font-semibold text-slate-800">O que cada papel pode fazer</p>
          <p>
            <b>Gestor:</b> lança produção, corrige e apaga lançamentos, altera equipamentos e
            cadastros, vê relatório e gerencia os acessos.
          </p>
          <p>
            <b>Lançador:</b> lança produção, consulta os lançamentos e vê o relatório. Não apaga
            nada e não altera cadastro.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Loader2, AlertCircle, CheckCircle2, KeyRound, ArrowLeft } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function TrocarSenha() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [atual, setAtual] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [pronto, setPronto] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    if (senha.length < 8) {
      setErro('A senha nova precisa ter pelo menos 8 caracteres.')
      return
    }
    if (senha !== confirmacao) {
      setErro('As duas senhas novas não são iguais.')
      return
    }
    if (senha === atual) {
      setErro('A senha nova precisa ser diferente da atual.')
      return
    }

    try {
      setCarregando(true)
      const id = pb.authStore.model?.id
      if (!id) throw new Error('Sessão expirada')
      await pb.collection('users').update(id, {
        oldPassword: atual,
        password: senha,
        passwordConfirm: senha,
      })
      // O PocketBase invalida o token antigo quando a senha muda. Sem entrar de
      // novo com a senha nova, o usuário cai para a tela de login logo após
      // salvar. Aqui a sessão é renovada na hora.
      const email = pb.authStore.model?.email
      if (!email) throw new Error('Sessão expirada')
      await pb.collection('users').authWithPassword(email, senha)
      setPronto(true)
      setAtual('')
      setSenha('')
      setConfirmacao('')
    } catch (err) {
      console.error('Erro ao trocar a senha:', err)
      const status = (err as { status?: number })?.status
      setErro(
        status === 400
          ? 'A senha atual não confere. Confira e tente de novo.'
          : 'Não foi possível salvar a nova senha agora. Tente de novo em instantes.',
      )
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
          <KeyRound className="h-6 w-6 text-blue-600" />
          Trocar senha
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Conta: <span className="font-medium text-slate-800">{user?.email}</span>
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg font-semibold text-slate-900">
            Definir uma senha nova
          </CardTitle>
          <CardDescription className="text-slate-600">
            Se você entrou com uma senha provisória, troque por uma sua agora.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {erro && (
              <Alert variant="destructive" className="py-2.5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{erro}</AlertDescription>
              </Alert>
            )}

            {pronto && (
              <Alert className="border-emerald-200 bg-emerald-50 py-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-xs text-emerald-800">
                  Senha alterada. Use a senha nova no próximo acesso.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="atual" className="text-xs font-semibold text-slate-700">
                Senha atual
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="atual"
                  type="password"
                  placeholder="••••••••"
                  value={atual}
                  onChange={(e) => setAtual(e.target.value)}
                  className="pl-9"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha" className="text-xs font-semibold text-slate-700">
                Senha nova
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="senha"
                  type="password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="pl-9"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <p className="text-[11px] text-slate-500">Mínimo de 8 caracteres.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmacao" className="text-xs font-semibold text-slate-700">
                Repita a senha nova
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="confirmacao"
                  type="password"
                  placeholder="••••••••"
                  value={confirmacao}
                  onChange={(e) => setConfirmacao(e.target.value)}
                  className="pl-9"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex-col gap-3">
            <Button
              type="submit"
              disabled={carregando}
              className="w-full bg-blue-600 font-medium text-white hover:bg-blue-700"
            >
              {carregando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Salvar nova senha
                </>
              )}
            </Button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-700 hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar ao início
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

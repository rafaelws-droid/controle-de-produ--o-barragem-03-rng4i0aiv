import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { HardHat, Lock, Mail, ArrowRight, Loader2, AlertCircle, UserPlus } from 'lucide-react'
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

type Modo = 'login' | 'signup'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, signup, isAuthenticated } = useAuth()

  const [modo, setModo] = useState<Modo>('login')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [nome, setNome] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const destino = () => {
    const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/'
    navigate(from, { replace: true })
  }

  if (isAuthenticated) {
    destino()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    if (!email.trim() || !senha) {
      setErro('Informe seu e-mail e sua senha.')
      return
    }
    if (modo === 'signup') {
      if (!nome.trim()) {
        setErro('Informe o seu nome.')
        return
      }
      if (senha.length < 8) {
        setErro('A senha deve ter no mínimo 8 caracteres.')
        return
      }
      if (senha !== confirmacao) {
        setErro('As senhas não coincidem.')
        return
      }
    }

    try {
      setCarregando(true)
      if (modo === 'signup') {
        await signup(nome, email, senha)
      } else {
        await login(email, senha)
      }
      destino()
    } catch (err) {
      console.error('Erro de autenticação:', err)
      const msg = getErrorMessage(err)
      setErro(
        msg && msg !== 'Ocorreu um erro inesperado.'
          ? msg
          : 'Credenciais inválidas. Verifique seu e-mail e senha.',
      )
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-2xl bg-white shadow-xl shadow-blue-500/25">
            <HardHat className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Controle de Produção</h1>
          <p className="mt-1 text-sm text-slate-400">Barragem 03 — acesso do administrativo</p>
        </div>

        <Card className="border-slate-800 bg-white/95 shadow-2xl backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-semibold text-slate-900">
              {modo === 'login' ? 'Entrar no sistema' : 'Criar nova conta'}
            </CardTitle>
            <CardDescription className="text-slate-600">
              {modo === 'login'
                ? 'Digite seu e-mail e senha para acessar os lançamentos'
                : 'Cadastre-se com e-mail e senha para começar a usar'}
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

              {modo === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-xs font-semibold text-slate-700">
                    Seu nome
                  </Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex.: Rafael Silveira"
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="gestor@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha" className="text-xs font-semibold text-slate-700">
                  Senha
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
                    autoComplete={modo === 'signup' ? 'new-password' : 'current-password'}
                  />
                </div>
              </div>

              {modo === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="confirmacao" className="text-xs font-semibold text-slate-700">
                    Confirmar senha
                  </Label>
                  <Input
                    id="confirmacao"
                    type="password"
                    placeholder="••••••••"
                    value={confirmacao}
                    onChange={(e) => setConfirmacao(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <p className="text-[11px] text-slate-500">Mínimo de 8 caracteres.</p>
                </div>
              )}
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
                    {modo === 'login' ? 'Entrando...' : 'Criando conta...'}
                  </>
                ) : (
                  <>
                    {modo === 'login' ? 'Acessar Painel' : 'Criar conta e entrar'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setModo(modo === 'login' ? 'signup' : 'login')
                  setErro(null)
                  setConfirmacao('')
                }}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                <span className="flex items-center gap-1.5">
                  <UserPlus className="h-3.5 w-3.5" />
                  {modo === 'login'
                    ? 'Não tem conta? Criar cadastro'
                    : 'Já tenho conta — voltar ao login'}
                </span>
              </button>

              <Link to="/" className="sr-only">
                início
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

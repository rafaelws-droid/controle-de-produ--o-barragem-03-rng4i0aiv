import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { Lock, Mail, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogoImagem, AZUL_MARCA, AMARELO_MARCA } from '@/components/Logo'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

/**
 * Tela de entrada do Controle de Produção.
 *
 * NÃO existe "criar conta" aqui. Antes o login tinha um botão "Não tem conta?
 * Criar cadastro" que abria o formulário de cadastro — e isso deixava qualquer
 * pessoa criar a própria conta direto pela tela.
 *
 * O cadastro é feito pelo GESTOR, no menu Acessos, depois de entrar. No servidor
 * a regra também está fechada (`createRule` só para GESTOR), então nem chamando
 * a API direto alguém cria conta.
 */
export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated } = useAuth()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(
    (location.state as { mensagem?: string })?.mensagem ?? null,
  )

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
    setAviso(null)

    if (!email.trim() || !senha) {
      setErro('Informe seu e-mail e sua senha.')
      return
    }

    try {
      setCarregando(true)
      await login(email.trim().toLowerCase(), senha)
      destino()
    } catch (err) {
      console.error('Erro de autenticação:', err)
      const msg = getErrorMessage(err)
      setErro(
        msg && msg !== 'Ocorreu um erro inesperado.'
          ? msg
          : 'E-mail ou senha incorretos. Confira e tente de novo.',
      )
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ backgroundColor: AZUL_MARCA }}
    >
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <LogoImagem altura={118} />
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-white">
            Controle de Produção
          </h1>
          <p className="mt-1 text-sm text-slate-300">Barragem 03 — acesso do administrativo</p>
        </div>

        <Card className="border-slate-800 bg-white/95 shadow-2xl backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-semibold text-slate-900">
              Entrar no sistema
            </CardTitle>
            <CardDescription className="text-slate-600">
              Use o e-mail e a senha que o gestor cadastrou para você.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {aviso && !erro && (
                <Alert className="border-emerald-200 bg-emerald-50 py-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <AlertDescription className="text-xs text-emerald-800">{aviso}</AlertDescription>
                </Alert>
              )}

              {erro && (
                <Alert variant="destructive" className="py-2.5">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{erro}</AlertDescription>
                </Alert>
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
                    placeholder="nome@silveiratransportes.com"
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
                    autoComplete="current-password"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex-col gap-3">
              <Button
                type="submit"
                disabled={carregando}
                style={{ backgroundColor: AMARELO_MARCA, color: AZUL_MARCA }}
                className="w-full font-bold hover:brightness-105"
              >
                {carregando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    Acessar Painel
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <Link
                to="/esqueci-senha"
                className="text-xs font-medium text-slate-500 hover:underline"
                style={{ color: AZUL_MARCA }}
              >
                Esqueci minha senha
              </Link>

              <p className="mt-1 text-center text-[11px] leading-relaxed text-slate-500">
                Não tem acesso? Peça ao gestor para cadastrar você no menu <b>Acessos</b>.
                <br />
                Só o gestor cria contas neste sistema.
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

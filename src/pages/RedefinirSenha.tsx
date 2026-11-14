import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, Loader2, AlertCircle, ArrowLeft, CheckCircle2, HardHat } from 'lucide-react'
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
import { confirmarRedefinicaoSenha } from '@/services/auth'

export default function RedefinirSenha() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    if (!token) {
      setErro('Link inválido ou incompleto. Peça um novo link de recuperação.')
      return
    }
    if (senha.length < 8) {
      setErro('A senha precisa ter pelo menos 8 caracteres.')
      return
    }
    if (senha !== confirmacao) {
      setErro('As duas senhas não são iguais.')
      return
    }

    try {
      setCarregando(true)
      await confirmarRedefinicaoSenha(token, senha, confirmacao)
      navigate('/login', {
        replace: true,
        state: { mensagem: 'Senha alterada. Entre com a sua nova senha.' },
      })
    } catch (err) {
      console.error('Erro ao redefinir senha:', err)
      setErro(
        'Não foi possível salvar a nova senha. O link pode ter expirado ou já ter sido usado. Peça outro.',
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
              Definir nova senha
            </CardTitle>
            <CardDescription className="text-slate-600">
              Digite a senha nova e repita. Mínimo de 8 caracteres.
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

              {!token && !erro && (
                <Alert className="border-amber-200 bg-amber-50 py-2.5">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-xs text-amber-800">
                    Este endereço não tem o código de redefinição. Abra o link que chegou por
                    e-mail.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="senha" className="text-xs font-semibold text-slate-700">
                  Nova senha
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmacao" className="text-xs font-semibold text-slate-700">
                  Repita a nova senha
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
                disabled={carregando || !token}
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

              <Link
                to="/login"
                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar ao login
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Mail,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  HardHat,
} from 'lucide-react'
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
import { solicitarRedefinicaoSenha } from '@/services/auth'

export default function EsqueciSenha() {
  const [email, setEmail] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    if (!email.trim()) {
      setErro('Informe o seu e-mail.')
      return
    }

    try {
      setCarregando(true)
      await solicitarRedefinicaoSenha(email)
      setEnviado(true)
    } catch (err) {
      console.error('Erro ao solicitar redefinição de senha:', err)
      setErro(
        'Não foi possível enviar o e-mail agora. Confira o endereço e tente de novo em alguns minutos.',
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
            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
              <KeyRound className="h-5 w-5 text-blue-600" />
              Esqueci minha senha
            </CardTitle>
            <CardDescription className="text-slate-600">
              Informe o e-mail da sua conta. Enviamos um link para você criar uma senha nova.
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

              {enviado && (
                <Alert className="border-emerald-200 bg-emerald-50 py-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <AlertDescription className="text-xs text-emerald-800">
                    Se este e-mail estiver cadastrado, o link chega em instantes. Confira também a
                    caixa de spam e o lixo eletrônico.
                  </AlertDescription>
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
                    Enviando...
                  </>
                ) : (
                  'Enviar link de recuperação'
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

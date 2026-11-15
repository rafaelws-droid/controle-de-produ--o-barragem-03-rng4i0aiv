import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Pencil, Trash2, Save, X, MailPlus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { destinatariosService } from '@/services/horimetro'
import type { DestinatarioRelatorio } from '@/types/horimetro'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

interface Props {
  destinatarios: DestinatarioRelatorio[]
  onChange: () => void
}

const VAZIO = { nome: '', email: '', ativo: true }

export function AbaDestinatarios({ destinatarios, onChange }: Props) {
  const { toast } = useToast()
  const [dialogAberto, setDialogAberto] = useState(false)
  const [editando, setEditando] = useState<DestinatarioRelatorio | null>(null)
  const [form, setForm] = useState(VAZIO)
  const [salvando, setSalvando] = useState(false)

  const totalAtivos = useMemo(() => destinatarios.filter((d) => d.ativo).length, [destinatarios])

  function abrirNovo() {
    setEditando(null)
    setForm(VAZIO)
    setDialogAberto(true)
  }

  function abrirEdicao(d: DestinatarioRelatorio) {
    setEditando(d)
    setForm({ nome: d.nome, email: d.email, ativo: d.ativo })
    setDialogAberto(true)
  }

  async function salvar() {
    if (!form.nome.trim() || !form.email.trim()) {
      toast({ title: 'Informe nome e e-mail', variant: 'destructive' })
      return
    }
    setSalvando(true)
    try {
      const dados = { nome: form.nome.trim(), email: form.email.trim(), ativo: form.ativo }
      if (editando) {
        await destinatariosService.update(editando.id, dados)
        toast({ title: 'Destinatário atualizado' })
      } else {
        await destinatariosService.create(dados)
        toast({ title: 'Destinatário cadastrado' })
      }
      setDialogAberto(false)
      onChange()
    } catch (erro: unknown) {
      const campos = extractFieldErrors(erro)
      toast({
        title: campos.email ? 'E-mail inválido ou já cadastrado' : 'Erro ao salvar destinatário',
        description: Object.values(campos).join(' · ') || undefined,
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  async function alternarAtivo(d: DestinatarioRelatorio, ativo: boolean) {
    try {
      await destinatariosService.update(d.id, { ativo })
      onChange()
    } catch (_) {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' })
    }
  }

  async function excluir(d: DestinatarioRelatorio) {
    if (!confirm(`Excluir o destinatário "${d.nome || d.email}"?`)) return
    try {
      await destinatariosService.delete(d.id)
      toast({ title: 'Destinatário excluído' })
      onChange()
    } catch (_) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Destinatários do relatório semanal</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            E-mails que recebem o relatório toda segunda-feira às 07:00. {totalAtivos} ativo(s) de{' '}
            {destinatarios.length}.
          </p>
        </div>
        <Button size="sm" onClick={abrirNovo}>
          <MailPlus className="mr-1.5 h-4 w-4" /> Novo destinatário
        </Button>
      </CardHeader>
      <CardContent>
        {destinatarios.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhum destinatário cadastrado ainda.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead className="text-center">Recebe</TableHead>
                  <TableHead className="w-24 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {destinatarios.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.nome || '—'}</TableCell>
                    <TableCell>{d.email}</TableCell>
                    <TableCell className="text-center">
                      <Switch checked={d.ativo} onCheckedChange={(v) => alternarAtivo(d, v)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => abrirEdicao(d)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => excluir(d)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar destinatário' : 'Novo destinatário'}</DialogTitle>
            <DialogDescription>
              Pessoa que receberá o relatório semanal de horímetro por e-mail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dest-nome">Nome</Label>
              <Input
                id="dest-nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex.: João da Silveira"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dest-email">E-mail</Label>
              <Input
                id="dest-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="exemplo@empresa.com.br"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="dest-ativo"
                checked={form.ativo}
                onCheckedChange={(v) => setForm({ ...form, ativo: v })}
              />
              <Label htmlFor="dest-ativo">Destinatário ativo (recebe os e-mails)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAberto(false)}>
              <X className="mr-1.5 h-4 w-4" /> Cancelar
            </Button>
            <Button onClick={salvar} disabled={salvando}>
              <Save className="mr-1.5 h-4 w-4" /> {salvando ? 'Salvando…' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

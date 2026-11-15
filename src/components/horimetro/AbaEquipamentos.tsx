import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { SelectNativo, type OpcaoSelect } from '@/components/SelectNativo'
import { Pencil, Trash2, Save, X, Plus, Truck, Gauge } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  horimetroEquipamentosService,
  horimetroLeiturasService,
  formatarSemana,
} from '@/services/horimetro'
import { formatHoras, formatDataBR } from '@/lib/exportUtils'
import type { EquipamentoHorimetro, LeituraHorimetro } from '@/types/horimetro'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

const TIPOS = [
  'ESCAVADEIRA',
  'PÁ CARREGADEIRA',
  'CAMINHÃO BASCULANTE',
  'TRATOR DE ESTEIRA',
  'MOTONIVELADORA',
  'CAMINHÃO PIPA',
  'ROLO COMPACTADOR',
  'OUTRO',
]

const EQ_VAZIO = { identificacao: '', tipo: TIPOS[0], ativo: true }
const LEITURA_VAZIA = { equipamento: '', data: '', horas: '', observacao: '' }

interface Props {
  equipamentos: EquipamentoHorimetro[]
  leituras: LeituraHorimetro[]
  semana: { inicio: string; fim: string }
  onEquipamentosChange: () => void
  onLeiturasChange: () => void
}

export function AbaEquipamentos({
  equipamentos,
  leituras,
  semana,
  onEquipamentosChange,
  onLeiturasChange,
}: Props) {
  const { toast } = useToast()

  // ---- equipamentos ----
  const [dialogEq, setDialogEq] = useState(false)
  const [editandoEq, setEditandoEq] = useState<EquipamentoHorimetro | null>(null)
  const [formEq, setFormEq] = useState(EQ_VAZIO)
  const [salvandoEq, setSalvandoEq] = useState(false)

  // ---- leituras ----
  const [dialogLeitura, setDialogLeitura] = useState(false)
  const [editandoLeitura, setEditandoLeitura] = useState<LeituraHorimetro | null>(null)
  const [formLeitura, setFormLeitura] = useState(LEITURA_VAZIA)
  const [salvandoLeitura, setSalvandoLeitura] = useState(false)

  const optionsEquipamentos: OpcaoSelect[] = useMemo(
    () =>
      equipamentos
        .filter((e) => e.ativo || editandoLeitura?.equipamento === e.id)
        .map((e) => ({ value: e.id, label: `${e.identificacao}${e.tipo ? ` — ${e.tipo}` : ''}` })),
    [equipamentos, editandoLeitura],
  )

  const leiturasPorEquipamento = useMemo(() => {
    const mapa = new Map<string, LeituraHorimetro[]>()
    for (const l of leituras) {
      const chave = typeof l.equipamento === 'string' ? l.equipamento : l.equipamento.id
      if (!mapa.has(chave)) mapa.set(chave, [])
      mapa.get(chave)!.push(l)
    }
    return mapa
  }, [leituras])

  const leiturasSemana = useMemo(
    () => leituras.filter((l) => l.data >= semana.inicio && l.data <= semana.fim).length,
    [leituras, semana],
  )

  function abrirNovoEq() {
    setEditandoEq(null)
    setFormEq(EQ_VAZIO)
    setDialogEq(true)
  }

  function abrirEdicaoEq(eq: EquipamentoHorimetro) {
    setEditandoEq(eq)
    setFormEq({ identificacao: eq.identificacao, tipo: eq.tipo, ativo: eq.ativo })
    setDialogEq(true)
  }

  async function salvarEq() {
    if (!formEq.identificacao.trim()) {
      toast({ title: 'Informe a identificação do equipamento', variant: 'destructive' })
      return
    }
    setSalvandoEq(true)
    try {
      const dados = {
        identificacao: formEq.identificacao.trim().toUpperCase(),
        tipo: formEq.tipo,
        ativo: formEq.ativo,
      }
      if (editandoEq) {
        await horimetroEquipamentosService.update(editandoEq.id, dados)
        toast({ title: 'Equipamento atualizado' })
      } else {
        await horimetroEquipamentosService.create(dados)
        toast({ title: 'Equipamento cadastrado' })
      }
      setDialogEq(false)
      onEquipamentosChange()
    } catch (erro: unknown) {
      const campos = extractFieldErrors(erro)
      toast({
        title: 'Erro ao salvar equipamento',
        description:
          Object.values(campos).join(' · ') || 'Verifique se a identificação já não existe.',
        variant: 'destructive',
      })
    } finally {
      setSalvandoEq(false)
    }
  }

  async function excluirEq(eq: EquipamentoHorimetro) {
    if (
      !confirm(
        `Excluir o equipamento "${eq.identificacao}"? As leituras dele também serão apagadas.`,
      )
    )
      return
    try {
      await horimetroEquipamentosService.delete(eq.id)
      toast({ title: 'Equipamento excluído' })
      onEquipamentosChange()
      onLeiturasChange()
    } catch (_) {
      toast({ title: 'Erro ao excluir equipamento', variant: 'destructive' })
    }
  }

  function abrirNovaLeitura() {
    setEditandoLeitura(null)
    setFormLeitura({ ...LEITURA_VAZIA, equipamento: optionsEquipamentos[0]?.valor || '' })
    setDialogLeitura(true)
  }

  function abrirEdicaoLeitura(l: LeituraHorimetro) {
    setEditandoLeitura(l)
    setFormLeitura({
      equipamento: typeof l.equipamento === 'string' ? l.equipamento : l.equipamento.id,
      data: l.data,
      horas: String(l.horas),
      observacao: l.observacao || '',
    })
    setDialogLeitura(true)
  }

  async function salvarLeitura() {
    if (!formLeitura.equipamento || !formLeitura.data || formLeitura.horas === '') {
      toast({ title: 'Preencha equipamento, data e horas', variant: 'destructive' })
      return
    }
    const horas = Number(formLeitura.horas.replace(',', '.'))
    if (Number.isNaN(horas) || horas < 0) {
      toast({ title: 'Horas do horímetro inválidas', variant: 'destructive' })
      return
    }
    setSalvandoLeitura(true)
    try {
      const dados = {
        equipamento: formLeitura.equipamento,
        data: formLeitura.data,
        horas,
        observacao: formLeitura.observacao.trim(),
      }
      if (editandoLeitura) {
        await horimetroLeiturasService.update(editandoLeitura.id, dados)
        toast({ title: 'Leitura atualizada' })
      } else {
        await horimetroLeiturasService.create(dados)
        toast({ title: 'Leitura registrada' })
      }
      setDialogLeitura(false)
      onLeiturasChange()
    } catch (erro: unknown) {
      const campos = extractFieldErrors(erro)
      const duplicada = Object.keys(campos).some((c) => c.includes('equip_data'))
      toast({
        title: duplicada
          ? 'Já existe leitura desse equipamento nessa data'
          : 'Erro ao salvar leitura',
        description: Object.values(campos).join(' · ') || undefined,
        variant: 'destructive',
      })
    } finally {
      setSalvandoLeitura(false)
    }
  }

  async function excluirLeitura(l: LeituraHorimetro) {
    const nomeEq =
      typeof l.equipamento === 'object' && l.equipamento !== null
        ? l.equipamento.identificacao
        : 'equipamento'
    if (!confirm(`Excluir a leitura de ${formatDataBR(l.data)} (${nomeEq})?`)) return
    try {
      await horimetroLeiturasService.delete(l.id)
      toast({ title: 'Leitura excluída' })
      onLeiturasChange()
    } catch (_) {
      toast({ title: 'Erro ao excluir leitura', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      {/* ---------------- EQUIPAMENTOS ---------------- */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="h-4 w-4 text-blue-600" /> Equipamentos
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {equipamentos.length} cadastrado(s), {equipamentos.filter((e) => e.ativo).length}{' '}
              ativo(s).
            </p>
          </div>
          <Button size="sm" onClick={abrirNovoEq}>
            <Plus className="mr-1.5 h-4 w-4" /> Novo equipamento
          </Button>
        </CardHeader>
        <CardContent>
          {equipamentos.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum equipamento cadastrado ainda.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Identificação</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-center">Ativo</TableHead>
                    <TableHead className="text-right">Leituras na semana</TableHead>
                    <TableHead className="w-24 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipamentos.map((eq) => {
                    const proprias = leiturasPorEquipamento.get(eq.id) || []
                    const naSemana = proprias.filter(
                      (l) => l.data >= semana.inicio && l.data <= semana.fim,
                    ).length
                    return (
                      <TableRow key={eq.id}>
                        <TableCell className="font-medium">{eq.identificacao}</TableCell>
                        <TableCell>{eq.tipo || '—'}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={eq.ativo ? 'default' : 'secondary'}>
                            {eq.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{naSemana}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => abrirEdicaoEq(eq)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => excluirEq(eq)}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------------- LEITURAS ---------------- */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gauge className="h-4 w-4 text-blue-600" /> Leituras de horímetro
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {leituras.length} leitura(s) no total, {leiturasSemana} na semana atual (
              {formatarSemana(semana.inicio, semana.fim)}).
            </p>
          </div>
          <Button size="sm" onClick={abrirNovaLeitura} disabled={equipamentos.length === 0}>
            <Plus className="mr-1.5 h-4 w-4" /> Nova leitura
          </Button>
        </CardHeader>
        <CardContent>
          {leituras.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma leitura registrada ainda.
            </p>
          ) : (
            <div className="max-h-96 overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Equipamento</TableHead>
                    <TableHead className="text-right">Horas do horímetro</TableHead>
                    <TableHead>Observação</TableHead>
                    <TableHead className="w-24 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leituras.map((l) => {
                    const eq =
                      typeof l.equipamento === 'object' && l.equipamento !== null
                        ? l.equipamento
                        : undefined
                    return (
                      <TableRow key={l.id}>
                        <TableCell>{formatDataBR(l.data)}</TableCell>
                        <TableCell>
                          {eq ? (
                            <span>
                              <span className="font-medium">{eq.identificacao}</span>
                              <span className="ml-2 text-xs text-muted-foreground">{eq.tipo}</span>
                            </span>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatHoras(l.horas)}
                        </TableCell>
                        <TableCell className="max-w-64 truncate text-sm text-muted-foreground">
                          {l.observacao || '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => abrirEdicaoLeitura(l)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => excluirLeitura(l)}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* dialog equipamento */}
      <Dialog open={dialogEq} onOpenChange={setDialogEq}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editandoEq ? 'Editar equipamento' : 'Novo equipamento'}</DialogTitle>
            <DialogDescription>
              Máquina monitorada pelo horímetro (escavadeira, caminhão, pá…).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="eq-identificacao">Identificação (nome/código)</Label>
              <Input
                id="eq-identificacao"
                value={formEq.identificacao}
                onChange={(e) => setFormEq({ ...formEq, identificacao: e.target.value })}
                placeholder="Ex.: ESC-01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eq-tipo">Tipo</Label>
              <SelectNativo
                id="eq-tipo"
                options={TIPOS.map((t) => ({ value: t, label: t }))}
                value={formEq.tipo}
                onChange={(valor) => setFormEq({ ...formEq, tipo: valor })}
                placeholder="Selecione o tipo"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="eq-ativo"
                checked={formEq.ativo}
                onCheckedChange={(v) => setFormEq({ ...formEq, ativo: v })}
              />
              <Label htmlFor="eq-ativo">Equipamento ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogEq(false)}>
              <X className="mr-1.5 h-4 w-4" /> Cancelar
            </Button>
            <Button onClick={salvarEq} disabled={salvandoEq}>
              <Save className="mr-1.5 h-4 w-4" /> {salvandoEq ? 'Salvando…' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* dialog leitura */}
      <Dialog open={dialogLeitura} onOpenChange={setDialogLeitura}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editandoLeitura ? 'Editar leitura' : 'Nova leitura de horímetro'}
            </DialogTitle>
            <DialogDescription>
              Posição do horímetro da máquina na data informada (em horas).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="leitura-equipamento">Equipamento</Label>
              <SelectNativo
                id="leitura-equipamento"
                options={optionsEquipamentos}
                value={formLeitura.equipamento}
                onChange={(valor) => setFormLeitura({ ...formLeitura, equipamento: valor })}
                placeholder="Selecione o equipamento"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leitura-data">Data da leitura</Label>
              <Input
                id="leitura-data"
                type="date"
                value={formLeitura.data}
                onChange={(e) => setFormLeitura({ ...formLeitura, data: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leitura-horas">Horas do horímetro</Label>
              <Input
                id="leitura-horas"
                type="number"
                step="0.25"
                min="0"
                value={formLeitura.horas}
                onChange={(e) => setFormLeitura({ ...formLeitura, horas: e.target.value })}
                placeholder="Ex.: 1234,5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leitura-obs">Observação (opcional)</Label>
              <Input
                id="leitura-obs"
                value={formLeitura.observacao}
                onChange={(e) => setFormLeitura({ ...formLeitura, observacao: e.target.value })}
                placeholder="Ex.: manutenção programada"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogLeitura(false)}>
              <X className="mr-1.5 h-4 w-4" /> Cancelar
            </Button>
            <Button onClick={salvarLeitura} disabled={salvandoLeitura}>
              <Save className="mr-1.5 h-4 w-4" /> {salvandoLeitura ? 'Salvando…' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

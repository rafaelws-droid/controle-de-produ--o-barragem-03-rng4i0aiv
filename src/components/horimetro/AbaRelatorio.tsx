import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { FileBarChart, Calendar } from 'lucide-react'
import { calcularHorasNoPeriodo, formatarSemana } from '@/services/horimetro'
import { formatHoras, formatDataBR } from '@/lib/exportUtils'
import type { EquipamentoHorimetro, LeituraHorimetro } from '@/types/horimetro'

interface Props {
  equipamentos: EquipamentoHorimetro[]
  leituras: LeituraHorimetro[]
  semana: { inicio: string; fim: string }
  onGerar: () => void
  gerando: boolean
}

export function AbaRelatorio({ equipamentos, leituras, semana, onGerar, gerando }: Props) {
  const linhas = useMemo(
    () => calcularHorasNoPeriodo(equipamentos, leituras, semana.inicio, semana.fim),
    [equipamentos, leituras, semana],
  )
  const total = useMemo(() => linhas.reduce((acc, l) => acc + l.horas, 0), [linhas])
  const comLeitura = linhas.filter((l) => l.leituras.length > 0).length

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileBarChart className="h-4 w-4 text-blue-600" /> Relatório semanal de horímetro
          </CardTitle>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" /> {formatarSemana(semana.inicio, semana.fim)}
            {' · '}
            {comLeitura}/{linhas.length} equipamentos com leitura
          </p>
        </div>
        <Button size="sm" onClick={onGerar} disabled={gerando}>
          <FileBarChart className="mr-1.5 h-4 w-4" />
          {gerando ? 'Gerando…' : 'Gerar relatório'}
        </Button>
      </CardHeader>
      <CardContent>
        {linhas.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhum equipamento cadastrado ainda.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipamento</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Leituras do período</TableHead>
                    <TableHead className="text-right">Horas no período</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linhas.map((linha) => (
                    <TableRow key={linha.equipamento.id}>
                      <TableCell className="font-medium">
                        {linha.equipamento.identificacao}
                      </TableCell>
                      <TableCell>{linha.equipamento.tipo || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {linha.leituras.length === 0
                          ? 'sem leituras no período'
                          : linha.leituras
                              .map((x) => `${formatDataBR(x.data)} → ${formatHoras(x.horas)} h`)
                              .join(' | ')}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        <span className={linha.horas > 0 ? 'text-green-600' : 'text-red-500'}>
                          {formatHoras(linha.horas)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <Badge variant="outline" className="text-sm">
                Total: {formatHoras(total)} h
              </Badge>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Horas no período = última leitura − primeira leitura do horímetro dentro da janela.
              Este mesmo relatório é enviado por e-mail toda segunda-feira às 07:00 para os
              destinatários cadastrados.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

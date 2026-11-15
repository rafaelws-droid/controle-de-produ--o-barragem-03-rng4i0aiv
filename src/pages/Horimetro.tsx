import { useEffect, useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Gauge, Truck, FileBarChart, Mail } from 'lucide-react'
import { LoadError } from '@/components/LoadError'
import {
  horimetroEquipamentosService,
  horimetroLeiturasService,
  destinatariosService,
  semanaAtual,
} from '@/services/horimetro'
import type {
  EquipamentoHorimetro,
  LeituraHorimetro,
  DestinatarioRelatorio,
} from '@/types/horimetro'
import { AbaEquipamentos } from '@/components/horimetro/AbaEquipamentos'
import { AbaRelatorio } from '@/components/horimetro/AbaRelatorio'
import { AbaDestinatarios } from '@/components/horimetro/AbaDestinatarios'
import { useToast } from '@/hooks/use-toast'

export function Horimetro() {
  const { toast } = useToast()
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [equipamentos, setEquipamentos] = useState<EquipamentoHorimetro[]>([])
  const [leituras, setLeituras] = useState<LeituraHorimetro[]>([])
  const [destinatarios, setDestinatarios] = useState<DestinatarioRelatorio[]>([])
  const [semana] = useState(semanaAtual())

  async function carregarTudo() {
    setCarregando(true)
    setErro(null)
    try {
      const [eqs, leit, dests] = await Promise.all([
        horimetroEquipamentosService.getAll(),
        horimetroLeiturasService.getAll(),
        destinatariosService.getAll(),
      ])
      setEquipamentos(eqs)
      setLeituras(leit)
      setDestinatarios(dests)
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Falha ao carregar os dados de horímetro.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarTudo()
  }, [])

  if (erro)
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <LoadError title="Erro ao carregar" message={erro} onRetry={carregarTudo} />
      </div>
    )

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
          <Gauge className="h-6 w-6 text-blue-600" /> Horímetro
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Controle de horas trabalhadas por equipamento, com relatório semanal automático por
          e-mail.
        </p>
      </div>

      <Tabs defaultValue="equipamentos" className="space-y-6">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="equipamentos" className="flex items-center gap-1.5">
            <Truck className="h-4 w-4" /> Equipamentos &amp; Leituras
          </TabsTrigger>
          <TabsTrigger value="relatorio" className="flex items-center gap-1.5">
            <FileBarChart className="h-4 w-4" /> Relatório semanal
          </TabsTrigger>
          <TabsTrigger value="destinatarios" className="flex items-center gap-1.5">
            <Mail className="h-4 w-4" /> Destinatários
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equipamentos">
          <AbaEquipamentos
            equipamentos={equipamentos}
            leituras={leituras}
            semana={semana}
            onEquipamentosChange={carregarTudo}
            onLeiturasChange={carregarTudo}
          />
        </TabsContent>

        <TabsContent value="relatorio">
          <AbaRelatorio
            equipamentos={equipamentos}
            leituras={leituras}
            semana={semana}
            onGerar={async () => {
              await carregarTudo()
              toast({ title: 'Relatório semanal atualizado com as leituras mais recentes' })
            }}
            gerando={carregando}
          />
        </TabsContent>

        <TabsContent value="destinatarios">
          <AbaDestinatarios destinatarios={destinatarios} onChange={carregarTudo} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Horimetro

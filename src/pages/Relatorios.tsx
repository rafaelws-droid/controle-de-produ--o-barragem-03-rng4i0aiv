/**
 * Relatórios — um menu só, duas abas.
 *
 * Antes existiam dois itens separados ("Relatório" e "Rel. Horímetros") que
 * confundiam: os dois são relatório, muda só o assunto. Aqui as rotas antigas
 * continuam valendo (/relatorio e /horimetros), então link salvo e o botão
 * "Ver" dos horímetros seguem funcionando — só o menu ficou único.
 */
import { useSearchParams } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { FileBarChart, Gauge, FileBarChart2 } from 'lucide-react'
import Relatorio from './Relatorio'
import RelatorioHorimetros from './RelatorioHorimetros'

export default function Relatorios() {
  const [params, setParams] = useSearchParams()
  const aba = params.get('aba') === 'horimetros' ? 'horimetros' : 'producao'

  // A aba escolhida vai na URL: recarregar a pagina, ou voltar do "Ver" de um
  // equipamento, mantem a pessoa onde ela estava.
  const trocar = (valor: string) => {
    const proximos = new URLSearchParams(params)
    proximos.set('aba', valor)
    setParams(proximos, { replace: true })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          <FileBarChart className="h-7 w-7 text-blue-600" />
          Relatórios
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Produção e horímetros no mesmo lugar. Os dois filtram por período e por equipamento.
        </p>
      </div>

      <Tabs value={aba} onValueChange={trocar} className="space-y-6">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="producao" className="flex items-center gap-1.5">
            <FileBarChart2 className="h-4 w-4" /> Produção
          </TabsTrigger>
          <TabsTrigger value="horimetros" className="flex items-center gap-1.5">
            <Gauge className="h-4 w-4" /> Horímetros e manutenção
          </TabsTrigger>
        </TabsList>

        <TabsContent value="producao">
          <Relatorio />
        </TabsContent>

        <TabsContent value="horimetros">
          <RelatorioHorimetros />
        </TabsContent>
      </Tabs>

      <p className="text-[11px] leading-relaxed text-slate-400">
        Dica: escolha o equipamento no filtro para ver só ele. O resumo do topo passa a somar apenas
        aquele equipamento — nunca a frota inteira.
      </p>
    </div>
  )
}

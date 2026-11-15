import pb from '@/lib/pocketbase/client'
import type {
  EquipamentoHorimetro,
  LeituraHorimetro,
  DestinatarioRelatorio,
  RelatorioHorimetro,
} from '@/types/horimetro'
import { formatDataBR } from '@/lib/exportUtils'

const equipamentosCollection = pb.collection('horimetro_equipamentos')
const leiturasCollection = pb.collection('horimetro_leituras')
const destinatariosCollection = pb.collection('destinatarios_relatorio')
const relatoriosCollection = pb.collection('horimetro_relatorios')

export const horimetroEquipamentosService = {
  getAll: async (somenteAtivos = false): Promise<EquipamentoHorimetro[]> => {
    const filtro = somenteAtivos ? 'ativo = true' : ''
    return (await equipamentosCollection.getFullList({
      filter: filtro,
      sort: 'identificacao',
    })) as unknown as EquipamentoHorimetro[]
  },
  create: async (dados: { identificacao: string; tipo: string; ativo: boolean }) =>
    (await equipamentosCollection.create(dados)) as unknown as EquipamentoHorimetro,
  update: async (
    id: string,
    dados: Partial<{ identificacao: string; tipo: string; ativo: boolean }>,
  ) => (await equipamentosCollection.update(id, dados)) as unknown as EquipamentoHorimetro,
  delete: async (id: string) => equipamentosCollection.delete(id),
}

export const horimetroLeiturasService = {
  getAll: async (filtro = ''): Promise<LeituraHorimetro[]> => {
    return (await leiturasCollection.getFullList({
      filter: filtro,
      sort: '-data,created',
      expand: 'equipamento',
    })) as unknown as LeituraHorimetro[]
  },
  create: async (dados: {
    equipamento: string
    data: string
    horas: number
    observacao?: string
  }) => (await leiturasCollection.create(dados)) as unknown as LeituraHorimetro,
  update: async (
    id: string,
    dados: Partial<{ equipamento: string; data: string; horas: number; observacao: string }>,
  ) => (await leiturasCollection.update(id, dados)) as unknown as LeituraHorimetro,
  delete: async (id: string) => leiturasCollection.delete(id),
}

export const destinatariosService = {
  getAll: async (): Promise<DestinatarioRelatorio[]> => {
    return (await destinatariosCollection.getFullList({
      sort: '-created',
    })) as unknown as DestinatarioRelatorio[]
  },
  create: async (dados: { nome: string; email: string; ativo: boolean }) =>
    (await destinatariosCollection.create(dados)) as unknown as DestinatarioRelatorio,
  update: async (id: string, dados: Partial<{ nome: string; email: string; ativo: boolean }>) =>
    (await destinatariosCollection.update(id, dados)) as unknown as DestinatarioRelatorio,
  delete: async (id: string) => destinatariosCollection.delete(id),
}

export const horimetroRelatoriosService = {
  ultimo: async (): Promise<RelatorioHorimetro | null> => {
    try {
      return (await relatoriosCollection.getFirstListItem('', {
        sort: '-semana_fim',
      })) as unknown as RelatorioHorimetro
    } catch (_) {
      return null
    }
  },
}

// ---------- cálculo de horas no período ----------

export interface LinhaHorimetro {
  equipamento: EquipamentoHorimetro
  horas: number
  leituras: { data: string; horas: number }[]
}

/** Segunda-feira da semana que contém a data informada (AAAA-MM-DD). */
export function segundaDaSemana(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split('-').map(Number)
  const d = new Date(ano, mes - 1, dia)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  const a = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${a}-${m}-${dd}`
}

export function domingoDaSemana(dataISO: string): string {
  const [ano, mes, dia] = segundaDaSemana(dataISO).split('-').map(Number)
  const d = new Date(ano, mes - 1, dia + 6)
  const a = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${a}-${m}-${dd}`
}

export function semanaAtual(): { inicio: string; fim: string } {
  const hojeISO = new Date().toISOString().slice(0, 10)
  return { inicio: segundaDaSemana(hojeISO), fim: domingoDaSemana(hojeISO) }
}

export function semanaAnterior(): { inicio: string; fim: string } {
  const { inicio } = semanaAtual()
  const [ano, mes, dia] = inicio.split('-').map(Number)
  const d = new Date(ano, mes - 1, dia - 1) // domingo da semana passada
  const iniISO = d.toISOString().slice(0, 10)
  return { inicio: segundaDaSemana(iniISO), fim: iniISO }
}

/**
 * Horas trabalhadas por equipamento no período: diferença entre a última e a
 * primeira leitura dentro da janela (medidor cumulativo).
 */
export function calcularHorasNoPeriodo(
  equipamentos: EquipamentoHorimetro[],
  leituras: LeituraHorimetro[],
  inicio: string,
  fim: string,
): LinhaHorimetro[] {
  const noPeriodo = leituras.filter((l) => l.data >= inicio && l.data <= fim)
  const porEquipamento = new Map<string, LeituraHorimetro[]>()
  for (const l of noPeriodo) {
    const chave = typeof l.equipamento === 'string' ? l.equipamento : l.equipamento.id
    if (!porEquipamento.has(chave)) porEquipamento.set(chave, [])
    porEquipamento.get(chave)!.push(l)
  }
  return equipamentos
    .map((eq) => {
      const propias = (porEquipamento.get(eq.id) || [])
        .slice()
        .sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0))
        .map((l) => ({ data: l.data, horas: l.horas }))
      const horas =
        propias.length === 0 ? 0 : Math.max(0, propias[propias.length - 1].horas - propias[0].horas)
      return { equipamento: eq, horas: Number(horas.toFixed(2)), leituras: propias }
    })
    .sort((a, b) => b.horas - a.horas)
}

export function formatarSemana(inicio: string, fim: string): string {
  return `${formatDataBR(inicio)} a ${formatDataBR(fim)}`
}

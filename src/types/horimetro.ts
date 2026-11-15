// Tipos do módulo Horímetro.

export interface EquipamentoHorimetro {
  id: string
  identificacao: string
  tipo: string
  ativo: boolean
  created?: string
  updated?: string
  expand?: Record<string, unknown>
}

export interface LeituraHorimetro {
  id: string
  equipamento: string | EquipamentoHorimetro
  data: string
  horas: number
  observacao?: string
  created?: string
  updated?: string
  expand?: {
    equipamento?: EquipamentoHorimetro
  }
}

export interface DestinatarioRelatorio {
  id: string
  nome: string
  email: string
  ativo: boolean
  created?: string
  updated?: string
}

export interface LinhaRelatorioHorimetro {
  equipamento: string
  tipo: string
  leituras: { data: string; horas: number }[]
  horas_semana: number
  situacao: string
}

export interface RelatorioHorimetro {
  id: string
  semana_inicio: string
  semana_fim: string
  resumo: string
  conteudo: {
    semana_inicio: string
    semana_fim: string
    linhas: LinhaRelatorioHorimetro[]
    total_horas: number
    equipamentos_com_leitura: number
    equipamentos_total: number
  }
  gerado_em: string
}

export type Categoria =
  | 'ESCAVADEIRA'
  | 'PÁ CARREGADEIRA'
  | 'CAMINHÃO'
  | 'CAMINHÃO PIPA'
  | 'ROLO COMPACTADOR'
  | 'OUTRO'

export interface Frente {
  id: string
  nome: string
  garantia_horas?: number
  ordem?: number
  ativo?: boolean
}

export interface Equipamento {
  id: string
  identificacao: string
  descricao?: string
  categoria?: Categoria
  ativo?: boolean
}

export interface Operador {
  id: string
  nome: string
  funcao?: 'OPERADOR' | 'MOTORISTA'
  ativo?: boolean
}

export type Turno = '1º TURNO' | '2º TURNO' | '3º TURNO'

export interface Lancamento {
  id: string
  data: string
  frente: string
  equipamento: string
  operador: string
  turno: Turno
  horimetro_inicial: number
  horimetro_final: number
  horas: number
  viagens?: number
  servico: string
  refeicao?: boolean
  abastecimento?: boolean
  manutencao?: boolean
  dds?: boolean
  apr?: boolean
  checklist?: boolean
  disposicao?: boolean
  substituindo?: string
  observacao?: string
  created?: string
  expand?: {
    frente?: Frente
    equipamento?: Equipamento
    operador?: Operador
    substituindo?: Equipamento
  }
}

export const TURNOS: Turno[] = ['1º TURNO', '2º TURNO', '3º TURNO']

/** Opções de "observação" que na planilha eram texto livre e agora são toggles. */
export const FLAGS: { campo: keyof Lancamento; label: string }[] = [
  { campo: 'refeicao', label: 'Refeição' },
  { campo: 'abastecimento', label: 'Abastecimento' },
  { campo: 'manutencao', label: 'Manutenção' },
  { campo: 'dds', label: 'DDS' },
  { campo: 'apr', label: 'APR' },
  { campo: 'checklist', label: 'Check list' },
  { campo: 'disposicao', label: 'À disposição' },
]

/** Serviços mais usados na planilha, para virar lista rápida no lançamento. */
export const SERVICOS_COMUNS = [
  'CARREGAMENTO DE CAMINHÕES',
  'CARREGAMENTO DE CAMINHÕES E REMONTANDO',
  'LIMPEZA DE CANAL',
  'ESPALHANDO PILHA PDR 02',
  'COMPACTANDO PILHA PDR 02',
  'TRANSPORTANDO MATERIAL DA BARRAGEM 03 P/PDR 02',
  'TRANSPORTANDO MATERIAL DO DESAGUAMENTO P/ PDR 02',
  'TRANSPORTANDO MATERIAL DO DESAGUAMENTO P/ DEPÓSITO 03 FELDSPATO',
  'TRANSPORTANDO MATERIAL DO DESAGUAMENTO P/ DEPÓSITO 11 FELDSPATO',
  'TRANSPORTANDO MATERIAL DO DESAGUAMENTO P/ DEPÓSITO 12 FELDSPATO',
  'TRANSPORTANDO MATERIAL DO DESAGUAMENTO P/ DEPÓSITO 07 ESPODUMÊNIO',
  'TRANSPORTANDO MATERIAL DO DESAGUAMENTO P/ DEPÓSITO URUBU DESCARTE',
  'TRANSPORTANDO MATERIAL URUBU FORRO P/PDR 02',
  'TRANSPORTANDO MATERIAL ANFIBOLITO P/PDR 02',
  'FAZENDO FORRO PDR 02',
  'QUEBRANDO MONTE PDR 02',
  'ACERTO TALUDE PDR 02',
  'FAZENDO DRENAGEM PDR 02',
  'SERVIÇOS PDR 02',
  'UMIDIFICANDO VIAS',
  'LIMPEZA DE VEGETAÇÃO',
  'APOIO NA PLANTA',
]

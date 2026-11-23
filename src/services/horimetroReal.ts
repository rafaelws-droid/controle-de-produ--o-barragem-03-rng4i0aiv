/**
 * Horímetro a partir do dado REAL.
 *
 * O módulo de horímetro nasceu com um cadastro próprio (horimetro_equipamentos),
 * separado do cadastro verdadeiro (equipamentos) — por isso apareciam máquinas
 * de demonstração. Aqui a leitura é derivada dos lançamentos do Controle de
 * Produção: é a mesma fonte que alimenta o resto do sistema.
 */
import pb from '@/lib/pocketbase/client'
import type { Equipamento, Lancamento } from '@/types'

export interface LeituraEquipamento {
  data: string
  horimetroInicial: number
  horimetroFinal: number
  horas: number
  lancamentos: number
  operador: string
}

export interface ResumoHorimetro {
  equipamento: Equipamento
  /** primeira leitura do período — onde o horímetro estava quando o período começou */
  horimetroAnterior: number
  /** data da primeira leitura do período */
  dataAnterior: string
  /** maior horímetro encontrado no período */
  horimetroAtual: number
  dataAtual: string
  /** horas somadas no período */
  horas: number
  /** horas por dia com apontamento */
  horasPorDia: number
  diasComApontamento: number
  ultimaData: string
  diasSemApontamento: number
  /** dia usado como referencia do "dias parado" (ultimo dia com lancamento) */
  referencia: string
  leituras: LeituraEquipamento[]
}

/** Todos os equipamentos reais (frota da Barragem 03). */
export async function carregarEquipamentos(): Promise<Equipamento[]> {
  return pb.collection('equipamentos').getFullList<Equipamento>({ sort: 'identificacao' })
}

/** Lançamentos do período, paginados. */
export async function carregarLancamentos(de: string, ate: string): Promise<Lancamento[]> {
  const todos: Lancamento[] = []
  let pagina = 1
  const filtro = `data >= "${de}" && data <= "${ate}"`
  for (;;) {
    const res = await pb.collection('lancamentos').getList<Lancamento>(pagina, 500, {
      filter: filtro,
      sort: 'data',
      expand: 'equipamento,operador',
    })
    todos.push(...res.items)
    if (pagina >= res.totalPages || res.items.length === 0) break
    pagina += 1
  }
  return todos
}

const diasEntre = (de: string, ate: string) => {
  const a = new Date(de + 'T00:00:00').getTime()
  const b = new Date(ate + 'T00:00:00').getTime()
  return Math.max(1, Math.round((b - a) / 86400000) + 1)
}

/** Agrupa os lançamentos por equipamento e por dia, virando leitura de horímetro. */
export function montarResumo(
  equipamentos: Equipamento[],
  lancamentos: Lancamento[],
  ate: string,
): ResumoHorimetro[] {
  const porEquip = new Map<string, Map<string, LeituraEquipamento>>()

  for (const l of lancamentos) {
    const chave = l.equipamento
    const dias = porEquip.get(chave) ?? new Map<string, LeituraEquipamento>()
    const dia = l.data.slice(0, 10)
    const atual = dias.get(dia)

    const hi = Number(l.horimetro_inicial) || 0
    const hf = Number(l.horimetro_final) || 0
    const horas = Number(l.horas) || 0

    if (atual) {
      atual.horimetroInicial = Math.min(atual.horimetroInicial, hi)
      atual.horimetroFinal = Math.max(atual.horimetroFinal, hf)
      atual.horas += horas
      atual.lancamentos += 1
      if (!atual.operador && l.expand?.operador?.nome) atual.operador = l.expand.operador.nome
    } else {
      dias.set(dia, {
        data: dia,
        horimetroInicial: hi,
        horimetroFinal: hf,
        horas,
        lancamentos: 1,
        operador: l.expand?.operador?.nome ?? '',
      })
    }
    porEquip.set(chave, dias)
  }

  // A referencia de "dias parado" NAO pode ser hoje: se o apontamento do sistema
  // inteiro parou (ex.: ultimo lancamento em 12/11 e hoje 15/11), todos os
  // equipamentos apareceriam parados — alarme falso em 19 de 19. A referencia e
  // o ultimo dia com QUALQUER lancamento no periodo.
  const ultimoDiaGlobal = lancamentos.reduce(
    (m, l) => (l.data.slice(0, 10) > m ? l.data.slice(0, 10) : m),
    '',
  )
  const referencia = ultimoDiaGlobal || ate

  return equipamentos
    .map((eq) => {
      const dias = porEquip.get(eq.id) ?? new Map<string, LeituraEquipamento>()
      const leituras = [...dias.values()].sort((a, b) => a.data.localeCompare(b.data))
      const horas = leituras.reduce((s, l) => s + l.horas, 0)
      const ultima = leituras[leituras.length - 1]

      const horimetroAtual = leituras.reduce((m, l) => Math.max(m, l.horimetroFinal), 0)
      const dataAtual = ultima?.data ?? ''
      // "horímetro anterior" = a PRIMEIRA leitura do período (o inicial dela).
      // "horímetro atual"    = a ÚLTIMA leitura (o final dela).
      // A diferença entre os dois é o que a máquina andou no período.
      const primeira = leituras[0]
      const horimetroAnterior = primeira ? primeira.horimetroInicial : 0
      const dataAnterior = primeira?.data ?? ''
      const diasSemApontamento = ultima
        ? Math.max(0, diasEntre(ultima.data, referencia) - 1)
        : diasEntre(referencia, referencia) + 999 // sem leitura nenhuma no periodo

      return {
        equipamento: eq,
        horimetroAnterior,
        dataAnterior,
        horimetroAtual,
        dataAtual,
        horas,
        horasPorDia: leituras.length > 0 ? horas / leituras.length : 0,
        diasComApontamento: leituras.length,
        ultimaData: dataAtual,
        diasSemApontamento,
        referencia,
        leituras,
      }
    })
    .filter((r) => r.leituras.length > 0)
    .sort((a, b) => b.horas - a.horas)
}

/**
 * Horímetro a partir do dado REAL, ordenado pelo PRÓPRIO HORÍMETRO.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * POR QUE ORDENAR PELO HORÍMETRO E NÃO PELA DATA (correção de 23/11)
 * ────────────────────────────────────────────────────────────────────────────
 * A primeira versão ordenava por `data` e usava `created` como desempate. Isso
 * quebrou quando a carga leu a planilha aba por aba: um mesmo equipamento
 * aparece em várias abas (o ST 18, por exemplo, está em CAMINHÕES DESAGUAMENTO
 * e em CAMINHÕES BARRAGEM 03), então os registros do dia 21 foram gravados
 * ANTES dos do dia 18. Com isso o "último lançamento" do dia saía errado.
 *
 * O horímetro é o único campo que NÃO depende da ordem de gravação: a leitura
 * final de um apontamento é a inicial do próximo. É uma sequência numérica
 * crescente por equipamento. Ordenar por ele dá a ordem verdadeira, sempre —
 * inclusive com registro importado fora de ordem, digitado errado ou repetido.
 *
 * Também há o caso do TURNO: no dia 22/11 o ST 22 tem 21732,30 (1º turno) e
 * 21742,00 (2º turno). Ordenar por data pegaria qualquer um dos dois; ordenar
 * por horímetro pega o maior, que é o último de fato.
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
  turno: string
}

export interface ResumoHorimetro {
  equipamento: Equipamento
  /** primeira leitura do período — onde o horímetro estava quando o período começou */
  horimetroAnterior: number
  dataAnterior: string
  /** maior horímetro encontrado no período (a última leitura de fato) */
  horimetroAtual: number
  dataAtual: string
  /** diferença real do relógio: atual − anterior */
  andou: number
  /** horas somadas no período */
  horas: number
  horasPorDia: number
  diasComApontamento: number
  ultimaData: string
  diasSemApontamento: number
  referencia: string
  leituras: LeituraEquipamento[]
  /** o penúltimo lançamento válido (registro completo, para a tabela) */
  penultimo: LeituraEquipamento | null
  /** o último lançamento válido (registro completo, para a tabela) */
  ultimo: LeituraEquipamento | null
  /** quantos lançamentos foram descartados por serem inválidos/inconsistentes */
  descartados: number
  /**
   * TOTAL DO INTERVALO ENTRE OS DOIS ÚLTIMOS LANÇAMENTOS.
   * É o número da CONFERÊNCIA DIÁRIA: quanto a máquina andou entre o penúltimo
   * e o último apontamento. Antes esta coluna somava o mês inteiro, o que não
   * servia para bater o dia.
   */
  totalDoisUltimos: number
  /** horas apontadas só nesses dois lançamentos (o último normalmente basta) */
  horasDoisUltimos: number
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

/** Um lançamento serve para leitura de horímetro? */
function leituraValida(l: Lancamento): boolean {
  const hi = Number(l.horimetro_inicial)
  const hf = Number(l.horimetro_final)
  if (!Number.isFinite(hi) || !Number.isFinite(hf)) return false
  // leitura zerada não é leitura (lançamento antigo sem horímetro preenchido)
  if (hi <= 0 && hf <= 0) return false
  // o relógio não volta: final menor que o inicial é dado inconsistente
  if (hf < hi) return false
  // um apontamento não pode passar de 24 h
  if (hf - hi > 24) return false
  return true
}

/**
 * Agrupa por equipamento e devolve, de cada um, o PENÚLTIMO e o ÚLTIMO
 * lançamento VÁLIDO, em ordem de horímetro.
 */
export function montarResumo(
  equipamentos: Equipamento[],
  lancamentos: Lancamento[],
  ate: string,
): ResumoHorimetro[] {
  // 1) separa os válidos por equipamento
  const validos = new Map<string, LeituraEquipamento[]>()
  const descartes = new Map<string, number>()

  for (const l of lancamentos) {
    const chave = l.equipamento
    if (!leituraValida(l)) {
      descartes.set(chave, (descartes.get(chave) ?? 0) + 1)
      continue
    }
    const lista = validos.get(chave) ?? []
    lista.push({
      data: l.data.slice(0, 10),
      horimetroInicial: Number(l.horimetro_inicial),
      horimetroFinal: Number(l.horimetro_final),
      horas: Number(l.horas) || Number(l.horimetro_final) - Number(l.horimetro_inicial),
      lancamentos: 1,
      operador: l.expand?.operador?.nome ?? '',
      turno: l.turno ?? '',
    })
    validos.set(chave, lista)
  }

  // referência de "dias parado": último dia com QUALQUER lançamento do período.
  // Não pode ser hoje — se o sistema inteiro parou de apontar, todos apareceriam
  // parados, alarme falso em 19 de 19 (bug já corrigido antes).
  const ultimoDiaGlobal = lancamentos.reduce(
    (m, l) => (l.data.slice(0, 10) > m ? l.data.slice(0, 10) : m),
    '',
  )
  const referencia = ultimoDiaGlobal || ate

  return equipamentos
    .map((eq) => {
      const lista = validos.get(eq.id) ?? []

      // ---- ORDEM VERDADEIRA: pelo horímetro inicial; desempate pelo final e pela data
      const ordenadas = [...lista].sort((a, b) => {
        if (a.horimetroInicial !== b.horimetroInicial)
          return a.horimetroInicial - b.horimetroInicial
        if (a.horimetroFinal !== b.horimetroFinal) return a.horimetroFinal - b.horimetroFinal
        return a.data.localeCompare(b.data)
      })

      const ultimo = ordenadas.length > 0 ? ordenadas[ordenadas.length - 1] : null
      const penultimo = ordenadas.length > 1 ? ordenadas[ordenadas.length - 2] : null

      // ---- totais do período (todas as leituras válidas)
      const horas = lista.reduce((s, x) => s + x.horas, 0)
      const horimetroAnterior = ordenadas.length > 0 ? ordenadas[0].horimetroInicial : 0
      const dataAnterior = ordenadas.length > 0 ? ordenadas[0].data : ''
      const horimetroAtual = ultimo ? ultimo.horimetroFinal : 0
      const dataAtual = ultimo ? ultimo.data : ''
      const andou = Math.round((horimetroAtual - horimetroAnterior) * 10000) / 10000

      const diasSet = new Set(lista.map((x) => x.data))
      const diasSemApontamento = ultimo ? Math.max(0, diasEntre(dataAtual, referencia) - 1) : 999

      // ---- TOTAL DA CONFERÊNCIA DIÁRIA ----
      // Quanto o relógio andou entre o penúltimo e o último lançamento válido.
      // Se só existe um lançamento no período, o total é a variação dele mesmo.
      const totalDoisUltimos =
        penultimo && ultimo
          ? Math.round((ultimo.horimetroFinal - penultimo.horimetroFinal) * 10000) / 10000
          : ultimo
            ? Math.round((ultimo.horimetroFinal - ultimo.horimetroInicial) * 10000) / 10000
            : 0

      // horas apontadas nesses dois lançamentos (o que deveria bater com o total)
      const horasDoisUltimos =
        Math.round(((penultimo ? penultimo.horas : 0) + (ultimo ? ultimo.horas : 0)) * 10000) /
        10000

      return {
        equipamento: eq,
        horimetroAnterior,
        dataAnterior,
        horimetroAtual,
        dataAtual,
        andou,
        horas,
        horasPorDia: diasSet.size > 0 ? horas / diasSet.size : 0,
        diasComApontamento: diasSet.size,
        ultimaData: dataAtual,
        diasSemApontamento,
        referencia,
        leituras: ordenadas,
        penultimo,
        ultimo,
        descartados: descartes.get(eq.id) ?? 0,
        totalDoisUltimos,
        horasDoisUltimos,
      }
    })
    .filter((r) => r.ultimo !== null)
    .sort((a, b) => b.horas - a.horas)
}

import pb from '@/lib/pocketbase/client'
import type { Equipamento, Frente, Lancamento, Operador, Turno, UsuarioSistema } from '@/types'

const EXPAND = 'frente,equipamento,operador,substituindo'

/** Contas do sistema — gestao restrita ao papel GESTOR (regra no servidor). */
export const usuariosService = {
  getAll: () => pb.collection('users').getFullList<UsuarioSistema>({ sort: 'papel,name' }),
  create: (data: {
    name: string
    email: string
    password: string
    passwordConfirm: string
    papel: string
  }) => pb.collection('users').create<UsuarioSistema>(data),
  update: (id: string, data: Partial<UsuarioSistema>) =>
    pb.collection('users').update<UsuarioSistema>(id, data),
  delete: (id: string) => pb.collection('users').delete(id),
}

export const frentesService = {
  getAll: () => pb.collection('frentes').getFullList<Frente>({ sort: 'ordem,nome' }),
  update: (id: string, data: Partial<Frente>) => pb.collection('frentes').update<Frente>(id, data),
  create: (data: Partial<Frente>) => pb.collection('frentes').create<Frente>(data),
}

export const equipamentosService = {
  getAll: () => pb.collection('equipamentos').getFullList<Equipamento>({ sort: 'identificacao' }),
  create: (data: Partial<Equipamento>) => pb.collection('equipamentos').create<Equipamento>(data),
  update: (id: string, data: Partial<Equipamento>) =>
    pb.collection('equipamentos').update<Equipamento>(id, data),
  delete: (id: string) => pb.collection('equipamentos').delete(id),
}

export const turnosService = {
  getAll: () => pb.collection('turnos').getFullList<Turno>({ sort: 'ordem,nome' }),
  create: (data: Partial<Turno>) => pb.collection('turnos').create<Turno>(data),
  update: (id: string, data: Partial<Turno>) => pb.collection('turnos').update<Turno>(id, data),
  delete: (id: string) => pb.collection('turnos').delete(id),
}

export const operadoresService = {
  getAll: () => pb.collection('operadores').getFullList<Operador>({ sort: 'nome' }),
  create: (data: Partial<Operador>) => pb.collection('operadores').create<Operador>(data),
  update: (id: string, data: Partial<Operador>) =>
    pb.collection('operadores').update<Operador>(id, data),
  delete: (id: string) => pb.collection('operadores').delete(id),
}

export const lancamentosService = {
  async getAll(): Promise<Lancamento[]> {
    return pb.collection('lancamentos').getFullList<Lancamento>({
      sort: '-data,-created',
      expand: EXPAND,
    })
  },

  /**
   * Lançamentos de um período, paginados no SERVIDOR.
   *
   * POR QUE ISSO EXISTE: antes as telas chamavam `getAll()` e traziam a coleção
   * inteira para o navegador — com 1.800 registros eram vários segundos no
   * celular, e o volume só cresce durante o mês de teste. Aqui o filtro de data
   * vai para o servidor (que usa o índice `idx_lanc_data_equip`) e a tela recebe
   * só o que precisa mostrar.
   */
  async getPeriodo(de: string, ate: string, limite = 5000): Promise<Lancamento[]> {
    const todos: Lancamento[] = []
    let pagina = 1
    const filtro = `data >= "${de}" && data <= "${ate}"`
    for (;;) {
      const res = await pb.collection('lancamentos').getList<Lancamento>(pagina, 500, {
        filter: filtro,
        sort: '-data,-created',
        expand: EXPAND,
      })
      todos.push(...res.items)
      if (pagina >= res.totalPages || res.items.length === 0 || todos.length >= limite) break
      pagina += 1
    }
    return todos
  },

  /** Contagem rápida de um período — para o resumo sem baixar os registros. */
  async contarPeriodo(de: string, ate: string): Promise<number> {
    const res = await pb.collection('lancamentos').getList(1, 1, {
      filter: `data >= "${de}" && data <= "${ate}"`,
    })
    return res.totalItems
  },

  getById: (id: string) => pb.collection('lancamentos').getOne<Lancamento>(id, { expand: EXPAND }),

  async getRecentes(limite = 8): Promise<Lancamento[]> {
    const res = await pb.collection('lancamentos').getList<Lancamento>(1, limite, {
      sort: '-data,-created',
      expand: EXPAND,
    })
    return res.items
  },

  /**
   * Último horímetro final do equipamento — vira o campo "horímetro inicial" do
   * próximo lançamento.
   *
   * ──────────────────────────────────────────────────────────────────────────
   * BUG CORRIGIDO EM 24/11 (o Rafael percebeu antes de mim)
   * ──────────────────────────────────────────────────────────────────────────
   * O sort era `-data,-created`: dentro do MESMO dia, a ordem era a da digitação.
   * Se o 1º turno fosse lançado DEPOIS do 2º turno (acontece: quem fecha o turno
   * da noite lança antes de quem fecha o do dia), o sistema pegava a leitura do
   * 1º turno — que é a MENOR — como sendo a última do dia. Resultado: o horímetro
   * inicial do próximo lançamento vinha para trás e a máquina "andava para trás".
   *
   * Caso real encontrado: ST 18 em 23/11 tinha 2º turno até 27.981,00 e 1º turno
   * até 27.973,00; a tela sugeria 27.973,00 — 8 h a menos. O ST 44 em 22/11
   * sugeria 5.667,00 quando o correto era 5.672,00.
   *
   * A ORDEM CERTA é:
   *   1. data (mais recente primeiro)
   *   2. ordem do TURNO (2º turno é o último do dia; o 1º vem antes)
   *   3. horímetro final, como desempate
   *
   * O horímetro é sequencial por equipamento: o final de um apontamento é o
   * inicial do próximo. Então, dentro do mesmo turno, o maior final é o último.
   */
  async ultimoHorimetro(equipamentoId: string): Promise<number | null> {
    // Busca os lançamentos do dia mais recente que tem registro deste equipamento.
    const ultimoDia = await pb.collection('lancamentos').getList<Lancamento>(1, 1, {
      filter: `equipamento = "${equipamentoId}"`,
      sort: '-data',
    })

    if (ultimoDia.items.length === 0) {
      // equipamento ainda sem lançamento (primeiro uso): usa a leitura de
      // partida do cadastro. Sem isso o campo abria VAZIO e o operador podia
      // digitar qualquer número — erro que contamina todos os dias seguintes.
      try {
        const eq = await pb.collection('equipamentos').getOne<Equipamento>(equipamentoId)
        const partida = Number(
          (eq as Equipamento & { horimetro_partida?: number }).horimetro_partida,
        )
        if (Number.isFinite(partida) && partida > 0) return partida
      } catch {
        /* cadastro sem o campo: segue */
      }
      return null
    }

    const dia = ultimoDia.items[0].data

    // Todos os lançamentos DESTE dia para este equipamento (normalmente 1 ou 2,
    // um por turno — por isso não precisa paginar).
    const doDia = await pb.collection('lancamentos').getFullList<Lancamento>({
      filter: `equipamento = "${equipamentoId}" && data = "${dia}"`,
      sort: 'turno,horimetro_final',
    })

    if (doDia.length === 0) return null

    const ordemTurno = (t?: string) => {
      const s = String(t ?? '')
        .toUpperCase()
        .trim()
      // 3º TURNO é raro, mas se existir é o último do dia
      if (s.startsWith('3')) return 3
      if (s.startsWith('2')) return 2
      if (s.startsWith('1')) return 1
      return 0
    }

    const ultimo = doDia.reduce((melhor, atual) => {
      const d = ordemTurno(atual.turno) - ordemTurno(melhor.turno)
      if (d !== 0) return d > 0 ? atual : melhor
      // mesmo turno: o maior horímetro final é o mais recente
      return Number(atual.horimetro_final) > Number(melhor.horimetro_final) ? atual : melhor
    }, doDia[0])

    return ultimo.horimetro_final
  },

  /**
   * Igual ao `ultimoHorimetro`, mas devolve o CONTEXTO junto — a tela usa isso
   * para avisar o lançador quando a sugestão pode estar incompleta.
   *
   * O caso é este: o equipamento trabalhou no 1º turno e o 2º turno (o último do
   * dia) ainda não foi lançado. O valor sugerido vem do 1º turno; quando o 2º for
   * lançado, a leitura será maior. Sem o aviso, o lançador confia no número e
   * pode gravar um horímetro inicial que já nasce atrasado.
   */
  async sugestaoHorimetro(equipamentoId: string): Promise<{
    valor: number | null
    data: string | null
    turno: string | null
    /** true quando o último lançamento do dia é do 1º turno e o 2º não existe */
    faltaSegundoTurno: boolean
  }> {
    const ultimoDia = await pb.collection('lancamentos').getList<Lancamento>(1, 1, {
      filter: `equipamento = "${equipamentoId}"`,
      sort: '-data',
    })

    if (ultimoDia.items.length === 0) {
      try {
        const eq = await pb.collection('equipamentos').getOne<Equipamento>(equipamentoId)
        const partida = Number(
          (eq as Equipamento & { horimetro_partida?: number }).horimetro_partida,
        )
        return {
          valor: Number.isFinite(partida) && partida > 0 ? partida : null,
          data: null,
          turno: null,
          faltaSegundoTurno: false,
        }
      } catch {
        return { valor: null, data: null, turno: null, faltaSegundoTurno: false }
      }
    }

    const dia = ultimoDia.items[0].data
    const doDia = await pb.collection('lancamentos').getFullList<Lancamento>({
      filter: `equipamento = "${equipamentoId}" && data = "${dia}"`,
      sort: 'turno,horimetro_final',
    })
    if (doDia.length === 0) {
      return { valor: null, data: null, turno: null, faltaSegundoTurno: false }
    }

    const ordemTurno = (t?: string) => {
      const s = String(t ?? '')
        .toUpperCase()
        .trim()
      if (s.startsWith('3')) return 3
      if (s.startsWith('2')) return 2
      if (s.startsWith('1')) return 1
      return 0
    }

    const ultimo = doDia.reduce((melhor, atual) => {
      const d = ordemTurno(atual.turno) - ordemTurno(melhor.turno)
      if (d !== 0) return d > 0 ? atual : melhor
      return Number(atual.horimetro_final) > Number(melhor.horimetro_final) ? atual : melhor
    }, doDia[0])

    const turnosNoDia = new Set(doDia.map((x) => ordemTurno(x.turno)))
    // só avisa quando o último do dia é do 1º turno E o 2º não foi lançado
    const faltaSegundoTurno = ordemTurno(ultimo.turno) === 1 && !turnosNoDia.has(2)

    return {
      valor: ultimo.horimetro_final,
      data: dia,
      turno: ultimo.turno ?? null,
      faltaSegundoTurno,
    }
  },

  create: (data: Partial<Lancamento>) =>
    pb.collection('lancamentos').create<Lancamento>(data, { expand: EXPAND }),

  update: (id: string, data: Partial<Lancamento>) =>
    pb.collection('lancamentos').update<Lancamento>(id, data, { expand: EXPAND }),

  delete: (id: string) => pb.collection('lancamentos').delete(id),
}

/** Horas = final − inicial (2 casas). Virada inválida ou negativa → 0. */
export function calcularHoras(inicial: number | null, final: number | null): number {
  if (inicial === null || final === null) return 0
  if (Number.isNaN(inicial) || Number.isNaN(final)) return 0
  const d = final - inicial
  return d > 0 ? Number(d.toFixed(2)) : 0
}

/** Frentes com viagens (caminhões): as demais não mostram o campo. */
export function contaViagens(frente?: Frente | null): boolean {
  if (!frente) return false
  return frente.nome.toUpperCase().startsWith('CAMINH')
}

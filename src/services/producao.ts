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
   * Último horímetro final do equipamento: vira o horímetro inicial do próximo
   * lançamento, então o administrativo digita só o número novo.
   */
  async ultimoHorimetro(equipamentoId: string): Promise<number | null> {
    const res = await pb.collection('lancamentos').getList<Lancamento>(1, 1, {
      filter: `equipamento = "${equipamentoId}"`,
      sort: '-data,-created',
    })
    const ultimo = res.items[0]
    return ultimo ? ultimo.horimetro_final : null
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

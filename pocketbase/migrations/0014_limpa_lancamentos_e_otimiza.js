// 0014_limpa_lancamentos_e_otimiza.js
//
// PEDIDO DO RAFAEL (23/11): "Apague todos os dados do sistema, mantendo apenas
// os dados fixos. Remova apenas os dados de lançamento, preservando os demais,
// como equipamentos, frentes etc. O uso vai começar no dia 20 de novembro."
//
// O QUE ESTA MIGRAÇÃO FAZ:
//   1. Apaga TODOS os registros de `lancamentos` (e nada mais).
//   2. Cria índices para as consultas mais usadas — é o que deixa o sistema
//      rápido quando o volume crescer durante o mês de teste.
//
// O QUE ELA NÃO TOCA (dados fixos / estrutura):
//   equipamentos, frentes, operadores, turnos, users (contas), planos_manutencao,
//   revisoes, ancoras_manutencao, e a estrutura de todas as coleções.
//
// BACKUP: antes de rodar, salvei em artifacts/backup/
//   lancamentos_20261123_1642.json  (registro completo)
//   lancamentos_20261123_1642.csv   (legível)
//   1.833 lançamentos · 8.981,5500 h · 11.804 viagens
migrate(
  (app) => {
    // ---------------------------------------------------------------- 1. limpeza
    const lanc = app.findCollectionByNameOrId('lancamentos')
    const antes = app.countRecords('lancamentos')

    // truncateCollection apaga os registros e mantem a estrutura intacta.
    app.truncateCollection(lanc)

    const depois = app.countRecords('lancamentos')
    console.log('[0014] lancamentos: ' + antes + ' -> ' + depois)

    // confere que os dados fixos continuam de pe (se algum sumir, avisa alto)
    const fixos = {
      equipamentos: app.countRecords('equipamentos'),
      frentes: app.countRecords('frentes'),
      operadores: app.countRecords('operadores'),
      turnos: app.countRecords('turnos'),
      users: app.countRecords('users'),
    }
    console.log(
      '[0014] dados fixos preservados: ' +
        'equipamentos=' +
        fixos.equipamentos +
        ' frentes=' +
        fixos.frentes +
        ' operadores=' +
        fixos.operadores +
        ' turnos=' +
        fixos.turnos +
        ' users=' +
        fixos.users,
    )
    if (fixos.equipamentos === 0 || fixos.frentes === 0) {
      throw new Error('[0014] ABORTADO: dados fixos sumiram')
    }

    // ---------------------------------------------------------------- 2. indices
    // As consultas que mais rodam, na ordem:
    //   · lista de lancamentos do periodo, ordenada por data  -> (data)
    //   · relatorio por equipamento no periodo                -> (equipamento, data)
    //   · relatorio por frente no periodo                     -> (frente, data)
    //   · horimetro do equipamento (ultima leitura)            -> (equipamento, data DESC)
    //   · checagem de duplicata                                -> ja existe idx_lanc_duplicata
    const novos = [
      ['idx_lanc_data_equip', false, 'data, equipamento', ''],
      ['idx_lanc_data_frente', false, 'data, frente', ''],
      ['idx_lanc_equip_data_desc', false, 'equipamento, data DESC', ''],
    ]

    let col = app.findCollectionByNameOrId('lancamentos')
    for (const [nome, unico, campos, cond] of novos) {
      let jaTem = false
      for (const i of col.indexes || []) {
        if (String(i).indexOf(nome) >= 0) jaTem = true
      }
      if (!jaTem) {
        col.addIndex(nome, unico, campos, cond)
        console.log('[0014] indice criado: ' + nome + ' (' + campos + ')')
      }
    }
    app.save(col)

    console.log('[0014] pronto: lancamentos limpos e indices de performance ativos')
  },
  (app) => {
    // Rollback NAO recupera os lancamentos apagados — para isso existe o backup
    // em artifacts/backup/. Aqui so removemos os indices criados.
    const col = app.findCollectionByNameOrId('lancamentos')
    for (const nome of [
      'idx_lanc_data_equip',
      'idx_lanc_data_frente',
      'idx_lanc_equip_data_desc',
    ]) {
      try {
        col.removeIndex(nome)
      } catch {
        /* nao existia */
      }
    }
    app.save(col)
  },
)

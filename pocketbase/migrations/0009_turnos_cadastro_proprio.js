// Turnos deixam de ser uma lista fixa dentro do lançamento e passam a ser
// cadastro próprio (coleção `turnos`), para o gestor criar e apagar turno pela
// tela sem depender de programação.
//
// O campo `turno` de `lancamentos` era um `select` com três valores fixos. Para
// aceitar qualquer turno cadastrado, ele passa a ser texto livre. A conversão é
// feita preservando o que já estava gravado: os valores são lidos antes de
// remover o campo e reescritos depois de recriá-lo como texto.
migrate(
  (app) => {
    // 1. Guarda o turno de cada lançamento existente.
    const lancamentos = app.findCollectionByNameOrId('lancamentos')
    const guardados = []
    try {
      for (const record of app.findAllRecords('lancamentos')) {
        guardados.push({ id: record.id, turno: record.getString('turno') })
      }
    } catch (_) {
      // coleção vazia
    }

    // 2. Troca o select por texto, para aceitar turno novo.
    lancamentos.fields.removeByName('turno')
    lancamentos.fields.add(new TextField({ name: 'turno', required: true, max: 40 }))
    app.save(lancamentos)

    // 3. Devolve o turno aos lançamentos que já existiam.
    for (const item of guardados) {
      if (!item.turno) continue
      try {
        const record = app.findRecordById('lancamentos', item.id)
        record.set('turno', item.turno)
        app.save(record)
      } catch (_) {
        // registro removido durante a migração: segue adiante
      }
    }

    // 4. Cria o cadastro de turnos com os três turnos que já eram usados.
    let turnos
    try {
      turnos = app.findCollectionByNameOrId('turnos')
    } catch (_) {
      turnos = new Collection({
        name: 'turnos',
        type: 'base',
        fields: [
          { name: 'nome', type: 'text', required: true, max: 40 },
          { name: 'ordem', type: 'number' },
          { name: 'ativo', type: 'bool' },
        ],
        // Quem está logado lê; só o gestor cria e apaga.
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.papel = 'GESTOR'",
        updateRule: "@request.auth.papel = 'GESTOR'",
        deleteRule: "@request.auth.papel = 'GESTOR'",
      })
      app.save(turnos)
    }

    const iniciais = ['1º TURNO', '2º TURNO', '3º TURNO']
    for (let i = 0; i < iniciais.length; i++) {
      const nome = iniciais[i]
      try {
        app.findFirstRecordByData('turnos', 'nome', nome)
        continue // já existe
      } catch (_) {}
      const col = app.findCollectionByNameOrId('turnos')
      const record = new Record(col)
      record.set('nome', nome)
      record.set('ordem', i + 1)
      record.set('ativo', true)
      app.save(record)
    }
  },
  (app) => {
    // Volta o campo a select com os três turnos originais.
    const lancamentos = app.findCollectionByNameOrId('lancamentos')
    const guardados = []
    try {
      for (const record of app.findAllRecords('lancamentos')) {
        guardados.push({ id: record.id, turno: record.getString('turno') })
      }
    } catch (_) {}

    lancamentos.fields.removeByName('turno')
    lancamentos.fields.add(
      new SelectField({
        name: 'turno',
        required: true,
        maxSelect: 1,
        values: ['1º TURNO', '2º TURNO', '3º TURNO'],
      }),
    )
    app.save(lancamentos)

    for (const item of guardados) {
      if (!item.turno) continue
      try {
        const record = app.findRecordById('lancamentos', item.id)
        record.set('turno', item.turno)
        app.save(record)
      } catch (_) {}
    }

    try {
      app.delete(app.findCollectionByNameOrId('turnos'))
    } catch (_) {}
  },
)

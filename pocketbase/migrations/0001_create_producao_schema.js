migrate(
  (app) => {
    // ---------- FRENTES (as "abas" da planilha, cada uma com garantia de horas mensais) ----------
    const frentes = new Collection({
      name: 'frentes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome', type: 'text', required: true, max: 60 },
        { name: 'garantia_horas', type: 'number', min: 0 },
        { name: 'ordem', type: 'number', min: 0 },
        { name: 'ativo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_frentes_nome ON frentes (nome)'],
    })
    app.save(frentes)

    // ---------- EQUIPAMENTOS ----------
    const equipamentos = new Collection({
      name: 'equipamentos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'identificacao', type: 'text', required: true, max: 40 },
        { name: 'descricao', type: 'text', max: 120 },
        {
          name: 'categoria',
          type: 'select',
          maxSelect: 1,
          values: [
            'ESCAVADEIRA',
            'PÁ CARREGADEIRA',
            'CAMINHÃO',
            'CAMINHÃO PIPA',
            'ROLO COMPACTADOR',
            'OUTRO',
          ],
        },
        { name: 'ativo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_equipamentos_identificacao ON equipamentos (identificacao)',
      ],
    })
    app.save(equipamentos)

    // ---------- OPERADORES / MOTORISTAS ----------
    const operadores = new Collection({
      name: 'operadores',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome', type: 'text', required: true, max: 80 },
        { name: 'funcao', type: 'select', maxSelect: 1, values: ['OPERADOR', 'MOTORISTA'] },
        { name: 'ativo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_operadores_nome ON operadores (nome)'],
    })
    app.save(operadores)

    // ---------- LANÇAMENTOS DIÁRIOS ----------
    const lancamentos = new Collection({
      name: 'lancamentos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'data', type: 'text', required: true, max: 10 },
        {
          name: 'frente',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('frentes').id,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'equipamento',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('equipamentos').id,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'operador',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('operadores').id,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'turno',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['1º TURNO', '2º TURNO', '3º TURNO'],
        },
        { name: 'horimetro_inicial', type: 'number', required: true, min: 0 },
        { name: 'horimetro_final', type: 'number', required: true, min: 0 },
        { name: 'horas', type: 'number', required: true, min: 0 },
        { name: 'viagens', type: 'number', min: 0 },
        { name: 'servico', type: 'text', required: true, max: 200 },
        { name: 'refeicao', type: 'bool' },
        { name: 'abastecimento', type: 'bool' },
        { name: 'manutencao', type: 'bool' },
        { name: 'dds', type: 'bool' },
        { name: 'apr', type: 'bool' },
        { name: 'checklist', type: 'bool' },
        { name: 'disposicao', type: 'bool' },
        {
          name: 'substituindo',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('equipamentos').id,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'observacao', type: 'text', max: 300 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_lancamentos_data ON lancamentos (data)',
        'CREATE INDEX idx_lancamentos_equipamento ON lancamentos (equipamento)',
        'CREATE INDEX idx_lancamentos_frente ON lancamentos (frente)',
      ],
    })
    app.save(lancamentos)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('lancamentos'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('operadores'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('equipamentos'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('frentes'))
    } catch (_) {}
  },
)

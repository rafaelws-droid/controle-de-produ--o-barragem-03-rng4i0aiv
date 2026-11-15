// ----------
// MÓDULO HORÍMETRO — Barragem 03
//
// Cria as coleções próprias do módulo:
//   - horimetro_equipamentos: equipamentos controlados por horímetro
//     (nome/código, tipo, ativo). O cadastro geral da produção continua
//     na coleção "equipamentos" — aqui é o recorte do relatório de horímetro.
//   - horimetro_leituras: leitura do medidor (equipamento + data + horas).
//   - destinatarios_relatorio: lista de e-mails que recebe o relatório semanal,
//     editável pelo gestor dentro do app.
//   - horimetro_relatorios: histórico dos relatórios gerados (usado pelo job
//     de e-mail e pelos agentes nativos como fonte do "relatório atual").
//
// Regras de acesso: leitura para qualquer conta logada; escrita restrita ao
// papel GESTOR (mesma convenção das telas de cadastro).
// ----------
migrate(
  (app) => {
    const logado = "@request.auth.id != ''"
    const gestor = "@request.auth.papel = 'GESTOR'"
    const soGestor = { list: logado, view: logado, create: gestor, update: gestor, delete: gestor }

    const equipHorimetro = new Collection({
      name: 'horimetro_equipamentos',
      type: 'base',
      ...soGestor,
      fields: [
        { name: 'identificacao', type: 'text', required: true, max: 40 },
        { name: 'tipo', type: 'text', max: 60 },
        { name: 'ativo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_horimetro_equipamentos_identificacao ON horimetro_equipamentos (identificacao)',
      ],
    })
    app.save(equipHorimetro)

    const leituras = new Collection({
      name: 'horimetro_leituras',
      type: 'base',
      ...soGestor,
      fields: [
        {
          name: 'equipamento',
          type: 'relation',
          required: true,
          collectionId: equipHorimetro.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'data', type: 'text', required: true, max: 10 },
        { name: 'horas', type: 'number', required: false, min: 0 },
        { name: 'observacao', type: 'text', max: 300 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_horimetro_leituras_equipamento ON horimetro_leituras (equipamento)',
        'CREATE INDEX idx_horimetro_leituras_data ON horimetro_leituras (data)',
        'CREATE UNIQUE INDEX idx_horimetro_leituras_equip_data ON horimetro_leituras (equipamento, data)',
      ],
    })
    app.save(leituras)

    const destinatarios = new Collection({
      name: 'destinatarios_relatorio',
      type: 'base',
      ...soGestor,
      fields: [
        { name: 'nome', type: 'text', max: 120 },
        { name: 'email', type: 'email', required: true },
        { name: 'ativo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_destinatarios_email ON destinatarios_relatorio (email)'],
    })
    app.save(destinatarios)

    const relatorios = new Collection({
      name: 'horimetro_relatorios',
      type: 'base',
      // leitura logada; escrita só pelo backend/hooks (regras fechadas)
      ...soGestor,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'semana_inicio', type: 'text', required: true, max: 10 },
        { name: 'semana_fim', type: 'text', required: true, max: 10 },
        { name: 'resumo', type: 'text', max: 2000 },
        { name: 'conteudo', type: 'json', maxSize: 0 },
        { name: 'gerado_em', type: 'autodate', onCreate: true, onUpdate: false },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_horimetro_relatorios_semana ON horimetro_relatorios (semana_fim)',
      ],
    })
    app.save(relatorios)

    // ---------- DADOS DE EXEMPLO ----------
    // 5 equipamentos típicos da operação + leituras de duas semanas, para o
    // relatório já ter conteúdo no primeiro dia. Idempotente: só entra se não existir.
    const equipCol = app.findCollectionByNameOrId('horimetro_equipamentos')
    const leiCol = app.findCollectionByNameOrId('horimetro_leituras')

    const EXEMPLO = [
      { id: 'ESC-01', tipo: 'ESCAVADEIRA', leituras: [4200, 4247.5, 4296] },
      { id: 'CB-102', tipo: 'CAMINHÃO BASCULANTE', leituras: [18750, 18812.75, 18879.5] },
      { id: 'PC-07', tipo: 'PÁ CARREGADEIRA', leituras: [9310, 9342.25, 9370.5] },
      { id: 'TE-05', tipo: 'TRATOR DE ESTEIRA', leituras: [6602, 6639.5, 6684.25] },
      { id: 'MN-03', tipo: 'MOTONIVELADORA', leituras: [5104.75, 5131, 5158.5] },
    ]

    // Leituras: segunda da semana passada, segunda desta semana e hoje —
    // geradas a partir do "hoje" do servidor para a semana corrente sempre ter dado.
    const hoje = new Date()
    const diasAteSegunda = (hoje.getDay() + 6) % 7 // seg = 0
    const segundaAtual = new Date(hoje)
    segundaAtual.setDate(hoje.getDate() - diasAteSegunda)
    const dISO = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const semanaPassada = new Date(segundaAtual)
    semanaPassada.setDate(segundaAtual.getDate() - 7)
    const datas = [dISO(semanaPassada), dISO(segundaAtual), dISO(hoje)]

    for (const eq of EXEMPLO) {
      let rec
      try {
        rec = app.findFirstRecordByData('horimetro_equipamentos', 'identificacao', eq.id)
      } catch (_) {
        rec = new Record(equipCol)
        rec.set('identificacao', eq.id)
        rec.set('tipo', eq.tipo)
        rec.set('ativo', true)
        app.save(rec)
      }
      eq.leituras.forEach((horas, i) => {
        try {
          app.findFirstRecordByFilter(
            'horimetro_leituras',
            `equipamento = "${rec.id}" && data = "${datas[i]}"`,
          )
          return
        } catch (_) {}
        const leitura = new Record(leiCol)
        leitura.set('equipamento', rec.id)
        leitura.set('data', datas[i])
        leitura.set('horas', horas)
        leitura.set('observacao', 'Leitura de exemplo (cadastro inicial).')
        app.save(leitura)
      })
    }
  },
  (app) => {
    for (const nome of [
      'horimetro_relatorios',
      'horimetro_leituras',
      'destinatarios_relatorio',
      'horimetro_equipamentos',
    ]) {
      try {
        app.delete(app.findCollectionByNameOrId(nome))
      } catch (_) {}
    }
  },
)

// ----------
// AGENTES NATIVOS (Skip Cloud / Maestro)
//
// Dois agentes nativos definidos via $ai.agents.define, com ferramentas de
// LEITURA sobre as coleções de horímetro, para a automação do usuário no
// Maestro ("Sistema" e "Controle de Manutenção") conseguir consultar o
// relatório. Não há endpoint de chat manual — o consumo é o mecanismo nativo.
// ----------
migrate(
  (app) => {
    const ferramentas = [
      { collection: 'horimetro_equipamentos', perms: { read: true, list: true } },
      { collection: 'horimetro_leituras', perms: { read: true, list: true } },
      { collection: 'horimetro_relatorios', perms: { read: true, list: true } },
    ]
    const contexto = `
CONTEXTO: Controle de Produção Barragem 03 (Silveira Transportes).
Coleções que você pode consultar (somente leitura):
  - horimetro_relatorios: relatórios semanais já gerados. Campos: semana_inicio (AAAA-MM-DD),
    semana_fim (AAAA-MM-DD), resumo (texto), conteudo (JSON com a tabela por equipamento).
    O mais recente é o relatório semanal vigente — ordene por semana_fim descendo.
  - horimetro_leituras: leituras de horímetro (equipamento, data AAAA-MM-DD, horas = posição do medidor).
  - horimetro_equipamentos: cadastro (identificacao, tipo, ativo).
Horas trabalhadas = diferença entre leituras consecutivas do mesmo equipamento.
FIDELIDADE: responda apenas com os dados consultados; não invente leituras, horas ou equipamentos.
Se não houver relatório para o período pedido, diga isso e informe o mais recente disponível.`

    const AGENTES = [
      {
        slug: 'sistema-barragem03',
        name: 'Sistema',
        description: 'Agente de consulta ao relatório semanal de horímetro — Barragem 03.',
        systemPrompt: `Você é o agente "Sistema" do Controle de Produção Barragem 03.
Papel: consultar o relatório semanal de horímetro e as leituras, e responder de forma objetiva em português.
Use as ferramentas de leitura para buscar os dados antes de responder; nunca estime valores sem consultar.
${contexto}`,
      },
      {
        slug: 'controle-manutencao-barragem03',
        name: 'Controle de Manutenção',
        description: 'Agente de manutenção: analisa horas por equipamento e aponta atenção.',
        systemPrompt: `Você é o agente "Controle de Manutenção" do Controle de Produção Barragem 03.
Papel: apoiar a manutenção — horas rodadas por equipamento na semana, posição atual do horímetro,
equipamentos sem leitura recente e tendência de uso. Responda em português, com números do relatório.
Destaque os equipamentos com mais horas na semana (prioridade de revisão) e os sem apontamento.
${contexto}`,
      },
    ]

    for (const ag of AGENTES) {
      try {
        $ai.agents.delete(app, ag.slug)
      } catch (_) {}
      $ai.agents.define(app, {
        slug: ag.slug,
        name: ag.name,
        description: ag.description,
        systemPrompt: ag.systemPrompt,
        tier: 'fast',
        tools: ferramentas,
        memory: [],
      })
    }
  },
  (app) => {
    $ai.agents.delete(app, 'sistema-barragem03')
    $ai.agents.delete(app, 'controle-manutencao-barragem03')
  },
)

// Catalogos iniciais do Controle de Producao Barragem 03, extraidos da planilha
// real (20/10 a 19/11/2026): frentes com garantia de horas mensais, equipamentos
// e operadores/motoristas. Os lancamentos entram pelo proprio sistema.
migrate(
  (app) => {
    const frenteCol = app.findCollectionByNameOrId('frentes')
    const equipCol = app.findCollectionByNameOrId('equipamentos')
    const opCol = app.findCollectionByNameOrId('operadores')

    const FRENTES = [
      { nome: 'ESCAVADEIRA 24H', garantia_horas: 500, ordem: 1 },
      { nome: 'ESCAVADEIRA ADM', garantia_horas: 105, ordem: 2 },
      { nome: 'ESCAVADEIRA CARREGAMENTO', garantia_horas: 300, ordem: 3 },
      { nome: 'PÁ CARREGADEIRA BARRAGEM 03', garantia_horas: 300, ordem: 4 },
      { nome: 'PÁ CARREGADEIRA DESAGUAMENTO', garantia_horas: 660, ordem: 5 },
      { nome: 'CAMINHÕES DESAGUAMENTO', garantia_horas: 1228.077, ordem: 6 },
      { nome: 'CAMINHÕES BARRAGEM 03', garantia_horas: 614.04, ordem: 7 },
      { nome: 'CAMINHÃO PIPA', garantia_horas: 250, ordem: 8 },
      { nome: 'ROLO COMPACTADOR', garantia_horas: 250, ordem: 9 },
    ]
    for (const f of FRENTES) {
      try {
        app.findFirstRecordByData('frentes', 'nome', f.nome)
        continue
      } catch (_) {}
      const rec = new Record(frenteCol)
      rec.set('nome', f.nome)
      rec.set('garantia_horas', f.garantia_horas)
      rec.set('ordem', f.ordem)
      rec.set('ativo', true)
      app.save(rec)
    }

    const EQUIPAMENTOS = [
      { id: 'ST 07', cat: 'CAMINHÃO' },
      { id: 'ST 14', cat: 'CAMINHÃO' },
      { id: 'ST 18', cat: 'CAMINHÃO' },
      { id: 'ST 27', cat: 'PÁ CARREGADEIRA' },
      { id: 'ST 29', cat: 'PÁ CARREGADEIRA' },
      { id: 'ST 33', cat: 'PÁ CARREGADEIRA' },
      { id: 'ST 34', cat: 'PÁ CARREGADEIRA' },
      { id: 'ST 41', cat: 'CAMINHÃO' },
      { id: 'ST 42', cat: 'CAMINHÃO' },
      { id: 'ST 43', cat: 'CAMINHÃO' },
      { id: 'ST 44', cat: 'CAMINHÃO' },
      { id: 'ST 52', cat: 'ESCAVADEIRA' },
      { id: 'ST 53', cat: 'ESCAVADEIRA' },
      { id: 'ST 55', cat: 'ESCAVADEIRA' },
      { id: 'ST 57', cat: 'ESCAVADEIRA' },
      { id: 'ST 66', cat: 'CAMINHÃO PIPA' },
      { id: 'ST 71', cat: 'ROLO COMPACTADOR' },
      { id: 'ST 75', cat: 'ROLO COMPACTADOR' },
    ]
    for (const e of EQUIPAMENTOS) {
      try {
        app.findFirstRecordByData('equipamentos', 'identificacao', e.id)
        continue
      } catch (_) {}
      const rec = new Record(equipCol)
      rec.set('identificacao', e.id)
      rec.set('categoria', e.cat)
      rec.set('ativo', true)
      app.save(rec)
    }

    const MOTORISTAS = [
      'ALDAIR',
      'ALDINEI FARIA',
      'ALEXANDRE FLAVIO',
      'APOENÃ',
      'BRENO',
      'CARLOS HENRIQUE',
      'EDIMILSON',
      'FRANCISCO INACIO',
      'GILSON SANTOS',
      'JEAN',
      'JOÃO BATISTA',
      'LEANDRO GERALDO',
      'LEANDRO HEITOR',
      'LUCAS',
      'MARCOS TEIXEIRA',
      'MÁRCIO JOSÉ',
      'MÁRCIO NASCIMENTO',
      'PEDRO',
      'SÉRGIO RUBENS',
      'WALLACE',
    ]
    const OPERADORES = [
      'ANTONIO ANDRÉ',
      'CARLOS MAGNO',
      'CELSO',
      'FRANCISCO CARLOS',
      'FÁBIO',
      'IGOR',
      'ISRAEL',
      'JHONATAN',
      'JOSÉ RONALDO',
      'JULIANO',
      'KAIKY SILVA',
      'LEONARDO',
      'MARCIO ANDRÉ',
      'MILHER',
      'PAULO FARIA',
      'ROMÁRIO',
      'THAUAN',
      'ÉDERSON DEIVIDE',
    ]
    const todos = []
    for (const n of MOTORISTAS) todos.push({ nome: n, funcao: 'MOTORISTA' })
    for (const n of OPERADORES) todos.push({ nome: n, funcao: 'OPERADOR' })
    for (const o of todos) {
      try {
        app.findFirstRecordByData('operadores', 'nome', o.nome)
        continue
      } catch (_) {}
      const rec = new Record(opCol)
      rec.set('nome', o.nome)
      rec.set('funcao', o.funcao)
      rec.set('ativo', true)
      app.save(rec)
    }

    // Usuario gestor inicial
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'rafaelws@silveiratransportes.com')
    } catch (_) {
      const admin = new Record(users)
      admin.setEmail('rafaelws@silveiratransportes.com')
      admin.setPassword('Skip@Pass')
      admin.setVerified(true)
      admin.set('name', 'Gestor de Produção')
      app.save(admin)
    }
  },
  (app) => {
    // Catalogos iniciais: mantidos ao reverter a migracao.
  },
)

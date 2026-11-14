// Controle de acesso por papel: GESTOR e LANCADOR.
//
// Antes: qualquer conta criada na tela de login entrava e podia ler, editar e
// APAGAR tudo. Agora:
//   - ninguem cria conta pela tela (o gestor cria pelo painel do PocketBase);
//   - o campo `papel` decide o que cada um pode fazer;
//   - `papel` NAO pode ser alterado pelo proprio usuario (protecao no update);
//   - so GESTOR apaga lancamento, altera cadastro e ve a lista de usuarios.
//
// A conta do Rafael (rafaelws@silveiratransportes.com) e promovida a GESTOR.
migrate(
  (app) => {
    // ---------- 1. campo `papel` na colecao de usuarios ----------
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!users.fields.getByName('papel')) {
      users.fields.add(
        new SelectField({
          name: 'papel',
          values: ['GESTOR', 'LANCADOR'],
          maxSelect: 1,
          required: false,
        }),
      )
    }

    // Sem cadastro publico: conta so nasce pelo painel administrativo.
    // Ninguem logado pode listar usuarios (o gestor ve pelo painel do banco).
    users.createRule = null
    users.listRule = null
    // Cada um ve e edita apenas o proprio perfil, e NAO pode mudar o proprio papel.
    users.viewRule = 'id = @request.auth.id'
    users.updateRule = 'id = @request.auth.id && @request.body.papel:changed = false'
    users.deleteRule = null
    app.save(users)

    // ---------- 2. o dono do sistema vira GESTOR ----------
    try {
      const rafael = app.findAuthRecordByEmail(
        '_pb_users_auth_',
        'rafaelws@silveiratransportes.com',
      )
      rafael.set('papel', 'GESTOR')
      app.save(rafael)
    } catch (_) {
      // Conta ainda nao existe: nada a promover.
    }

    // ---------- 3. regras das colecoes de negocio ----------
    const ehGestor = "@request.auth.papel = 'GESTOR'"
    const logado = "@request.auth.id != ''"

    // Lancamentos: os dois papeis leem e criam; so GESTOR edita ou apaga.
    const lanc = app.findCollectionByNameOrId('lancamentos')
    lanc.listRule = logado
    lanc.viewRule = logado
    lanc.createRule = logado
    lanc.updateRule = ehGestor
    lanc.deleteRule = ehGestor
    app.save(lanc)

    // Catalogos (frentes, equipamentos, operadores): todos leem para poder
    // lancar; so GESTOR cadastra, altera ou remove.
    for (const nome of ['frentes', 'equipamentos', 'operadores']) {
      const col = app.findCollectionByNameOrId(nome)
      col.listRule = logado
      col.viewRule = logado
      col.createRule = ehGestor
      col.updateRule = ehGestor
      col.deleteRule = ehGestor
      app.save(col)
    }
  },
  (app) => {
    // Volta ao estado anterior: qualquer usuario logado podia tudo, e o
    // cadastro publico estava aberto.
    const logado = "@request.auth.id != ''"

    for (const nome of ['frentes', 'equipamentos', 'operadores', 'lancamentos']) {
      const col = app.findCollectionByNameOrId(nome)
      col.listRule = logado
      col.viewRule = logado
      col.createRule = logado
      col.updateRule = logado
      col.deleteRule = logado
      app.save(col)
    }

    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.listRule = 'id = @request.auth.id'
    users.viewRule = 'id = @request.auth.id'
    users.createRule = ''
    users.updateRule = 'id = @request.auth.id'
    users.deleteRule = 'id = @request.auth.id'
    app.save(users)
  },
)

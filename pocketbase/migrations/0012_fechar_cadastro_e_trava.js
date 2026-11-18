// 0012_fechar_cadastro_e_trava_de_lancamento.js
//
// Duas correções pedidas pelo Rafael em 17/11, depois da auditoria:
//
// (1) CADASTRO PÚBLICO FECHADO
//     A regra era `@request.body.papel = 'LANCADOR'` — qualquer pessoa na
//     internet criava uma conta de lançador e lançava produção. Provei criando
//     uma conta anônima e lançando. Agora só GESTOR cria conta.
//
// (2) COERÊNCIA DO LANÇAMENTO
//     Antes o servidor aceitava tudo: horímetro final menor que o inicial,
//     horas que não batem com o horímetro, 400 h num dia, data em 2030 e o
//     mesmo apontamento duas vezes. As travas ficam no hook
//     `pocketbase/hooks/lancamento.pb.js`.
migrate(
  (app) => {
    // ---------------------------------------------------------------- users
    const users = app.findCollectionByNameOrId('users')

    // lançador lê o próprio; gestor lê todos
    users.listRule =
      "@request.auth.id != '' && (id = @request.auth.id || @request.auth.papel = 'GESTOR')"
    users.viewRule =
      "@request.auth.id != '' && (id = @request.auth.id || @request.auth.papel = 'GESTOR')"

    // SÓ GESTOR CRIA. Era aqui que o sistema estava aberto.
    users.createRule = "@request.auth.papel = 'GESTOR'"

    // cada um edita o próprio perfil, mas NÃO o próprio papel; gestor edita tudo
    users.updateRule =
      "(id = @request.auth.id && @request.body.papel:changed = false) || @request.auth.papel = 'GESTOR'"
    users.deleteRule = "@request.auth.papel = 'GESTOR'"
    app.save(users)

    // ---------------------------------------------------------------- lancamentos
    const lan = app.findCollectionByNameOrId('lancamentos')
    // lançador continua podendo lançar; excluir e editar é do gestor
    lan.listRule = "@request.auth.id != ''"
    lan.viewRule = "@request.auth.id != ''"
    lan.createRule = "@request.auth.id != ''"
    lan.updateRule = "@request.auth.papel = 'GESTOR'"
    lan.deleteRule = "@request.auth.papel = 'GESTOR'"
    app.save(lan)

    // índice para a checagem de duplicata (equipamento + data + horímetro)
    try {
      lan.addIndex(
        'idx_lanc_duplicata',
        false,
        'equipamento, data, horimetro_inicial, horimetro_final',
        '',
      )
      app.save(lan)
    } catch {
      // se já existir, segue
    }

    console.log('[0012] cadastro fechado (só gestor cria) e lancamentos com regra revisada')
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.createRule = "@request.body.papel = 'LANCADOR'"
    app.save(users)
  },
)

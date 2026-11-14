// Reabre o cadastro pela tela de login, a pedido do Rafael (14/11/2026).
//
// Regra de seguranca que torna isso viavel:
//   - quem se cadastra sozinho vira LANCADOR, nunca GESTOR;
//   - a regra de criacao EXIGE papel = 'LANCADOR' no corpo da requisicao,
//     entao ninguem consegue se criar como gestor pela API;
//   - o papel continua travado no update: o usuario nao se promove depois.
//
// Resultado: a pessoa cria a propria conta e ja pode lancar producao.
// Para virar gestor, so outro gestor promove pela tela Acessos.
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    // Cadastro aberto, mas exclusivamente como LANCADOR.
    users.createRule = "@request.body.papel = 'LANCADOR'"
    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.createRule = "@request.auth.papel = 'GESTOR'"
    app.save(users)
  },
)

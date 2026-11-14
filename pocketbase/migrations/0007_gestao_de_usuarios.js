// Permite que o GESTOR crie e gerencie contas dentro do proprio sistema,
// pela tela "Usuarios" — sem precisar do painel do banco.
//
// Regras:
//   - LANCADOR ve e edita so o proprio perfil;
//   - GESTOR ve a lista de todos, cria conta, troca papel e remove;
//   - ninguem deslogado cria conta (cadastro publico fechado);
//   - ninguem pode mudar o proprio papel (evita virar gestor sozinho).
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const ehGestor = "@request.auth.papel = 'GESTOR'"
    const logado = "@request.auth.id != ''"

    users.createRule = ehGestor
    users.listRule = `${logado} && (id = @request.auth.id || ${ehGestor})`
    users.viewRule = `${logado} && (id = @request.auth.id || ${ehGestor})`
    users.updateRule = `(id = @request.auth.id && @request.body.papel:changed = false) || ${ehGestor}`
    users.deleteRule = ehGestor

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.createRule = null
    users.listRule = null
    users.viewRule = 'id = @request.auth.id'
    users.updateRule = 'id = @request.auth.id && @request.body.papel:changed = false'
    users.deleteRule = null
    app.save(users)
  },
)

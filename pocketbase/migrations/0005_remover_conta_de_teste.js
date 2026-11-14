// Remove contas de teste criadas durante a verificacao de seguranca de 14/11.
//
// A colecao `users` permite cadastro publico (createRule vazio), entao foi
// possivel criar uma conta descartavel para provar a falha. Esta migracao
// apaga qualquer conta cujo e-mail comece com o prefixo usado naquele teste.
// E idempotente: se nao houver nenhuma, nao faz nada.
migrate(
  (app) => {
    const contas = app.findRecordsByFilter('_pb_users_auth_', "email ~ 'teste.probe.'", '', 0, 0)
    for (let i = 0; i < contas.length; i++) {
      app.delete(contas[i])
    }
  },
  (app) => {
    // Sem volta: conta de teste removida nao e recriada.
  },
)

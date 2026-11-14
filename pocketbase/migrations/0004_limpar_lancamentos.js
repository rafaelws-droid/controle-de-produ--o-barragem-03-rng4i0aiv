// Zera a colecao de lancamentos: o controle de producao volta a ser feito
// manualmente no proximo fechamento. Os catalogos (frentes de servico,
// equipamentos, colaboradores e os turnos do campo `turno`) permanecem.
//
// Antes desta migracao foi gerado um backup completo em CSV dos 699 registros
// (artifacts/BACKUP_lancamentos_barragem03_699.csv) e entregue ao gestor.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('lancamentos')
    app.truncateCollection(col)
  },
  (app) => {
    // Sem volta: os lancamentos apagados nao sao recriados aqui.
  },
)

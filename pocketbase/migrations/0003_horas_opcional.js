// Um apontamento pode ter 0 hora (equipamento à disposição, manutenção o dia
// inteiro, turno parado por chuva). Com `horas` obrigatório o PocketBase recusa
// o valor 0 ("Cannot be blank"), então o campo passa a ser opcional.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('lancamentos')
    const campo = col.fields.getByName('horas')
    if (campo) {
      campo.required = false
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('lancamentos')
    const campo = col.fields.getByName('horas')
    if (campo) {
      campo.required = true
      app.save(col)
    }
  },
)

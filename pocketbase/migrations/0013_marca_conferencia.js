// 0013_marca_conferencia.js
//
// DECISÃO DO RAFAEL (17/11): quando as horas lançadas ficarem abaixo do
// horímetro (parada, chuva, manutenção), o sistema NÃO recusa mais — GRAVA e
// MARCA EM AMARELO para conferência.
//
// Campos novos em `lancamentos`:
//   conferir        → true quando precisa de olho humano
//   motivo_conferir → o texto que explica o motivo, mostrado na tela
migrate(
  (app) => {
    const lan = app.findCollectionByNameOrId('lancamentos')

    if (!lan.fields.getByName('conferir')) {
      lan.fields.add(new BoolField({ name: 'conferir', required: false }))
    }
    if (!lan.fields.getByName('motivo_conferir')) {
      lan.fields.add(
        new TextField({
          name: 'motivo_conferir',
          required: false,
          max: 200,
        }),
      )
    }
    app.save(lan)

    console.log('[0013] campos de conferencia criados em lancamentos')
  },
  (app) => {
    const lan = app.findCollectionByNameOrId('lancamentos')
    if (lan.fields.getByName('conferir')) lan.fields.removeByName('conferir')
    if (lan.fields.getByName('motivo_conferir')) lan.fields.removeByName('motivo_conferir')
    app.save(lan)
  },
)

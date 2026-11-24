// 0015_horimetro_de_partida.js
//
// PROBLEMA REAL PARA O MÊS DE USO (auditoria de 24/11):
// o horímetro inicial do próximo lançamento é sugerido a partir do último
// lançamento do equipamento. Quatro equipamentos (ST 27, ST 53, ST 54, ST 75)
// NÃO têm nenhum lançamento carregado — no primeiro dia de uso o campo abre
// VAZIO e o operador digita qualquer número. Se digitar errado, o erro se
// propaga: a leitura final vira a inicial do dia seguinte.
//
// Correção: campo opcional `horimetro_partida` no cadastro do equipamento.
// A tela usa este valor como sugestão quando o equipamento ainda não tem
// lançamento. O gestor preenche uma vez, com a leitura real da máquina.
migrate(
  (app) => {
    const eqs = app.findCollectionByNameOrId('equipamentos')

    if (!eqs.fields.getByName('horimetro_partida')) {
      eqs.fields.add(
        new NumberField({
          name: 'horimetro_partida',
          required: false,
          min: 0,
        }),
      )
      app.save(eqs)
      console.log('[0015] campo horimetro_partida criado em equipamentos')
    } else {
      console.log('[0015] campo horimetro_partida ja existia')
    }
  },
  (app) => {
    const eqs = app.findCollectionByNameOrId('equipamentos')
    if (eqs.fields.getByName('horimetro_partida')) {
      eqs.fields.removeByName('horimetro_partida')
      app.save(eqs)
    }
  },
)

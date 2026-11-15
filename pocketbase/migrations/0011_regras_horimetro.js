// Migration 0011: corrige as regras de acesso das coleções do módulo horímetro.
// A migration 0010 gravou todas as regras como null (superusuário apenas) porque
// usou chaves incorretas dentro do objeto. Aqui aplicamos as regras diretamente
// nos atributos da coleção: qualquer usuário logado lê e escreve (uso interno);
// em horimetro_relatorios a escrita permanece null (somente hooks gravam).

migrate(
  (app) => {
    const regrasLeitura = "@request.auth.id != ''"
    const regrasEscrita = "@request.auth.id != ''"

    const aplicar = (nome, comEscrita) => {
      const col = app.findCollectionByNameOrId(nome)
      col.listRule = regrasLeitura
      col.viewRule = regrasLeitura
      if (comEscrita) {
        col.createRule = regrasEscrita
        col.updateRule = regrasEscrita
        col.deleteRule = regrasEscrita
      }
      app.save(col)
    }

    aplicar('horimetro_equipamentos', true)
    aplicar('horimetro_leituras', true)
    aplicar('destinatarios_relatorio', true)
    aplicar('horimetro_relatorios', false)
  },
  (app) => {
    // Reverte para null (superusuário apenas), estado deixado pela 0010.
    const limpar = (nome) => {
      const col = app.findCollectionByNameOrId(nome)
      col.listRule = null
      col.viewRule = null
      col.createRule = null
      col.updateRule = null
      col.deleteRule = null
      app.save(col)
    }

    limpar('horimetro_equipamentos')
    limpar('horimetro_leituras')
    limpar('destinatarios_relatorio')
    limpar('horimetro_relatorios')
  },
)

/// <reference path="../pb_data/types.d.ts" />

// TRACAS DE COERÊNCIA DO LANÇAMENTO DE PRODUÇÃO
//
// Antes o servidor aceitava qualquer coisa: horímetro final menor que o inicial,
// horas que não batem com o horímetro, 400 h num dia, data em 2030 e o mesmo
// apontamento duas vezes. Testado e comprovado na auditoria de 17/11.
//
// Aqui cada lançamento é conferido ANTES de gravar, e a mensagem explica o que
// corrigir — em português, porque quem lê é o lançador.
//
// ATENÇÃO: toda a lógica fica DENTRO do callback. O PocketBase executa cada hook
// num VM separado e uma função no topo do arquivo quebra em runtime.

const TOLERANCIA_HORAS = 0.05 // arredondamento de horímetro, não erro de digitação

/** Data de hoje em ISO (YYYY-MM-DD), no fuso do Brasil. */
function hojeBR() {
  const agora = new Date()
  // o servidor roda em UTC; -3h para o horário de Brasília
  const br = new Date(agora.getTime() - 3 * 60 * 60 * 1000)
  const y = br.getUTCFullYear()
  const m = String(br.getUTCMonth() + 1).padStart(2, '0')
  const d = String(br.getUTCDate()).padStart(2, '0')
  return y + '-' + m + '-' + d
}

onRecordCreate((e) => {
  const r = e.record

  const data = r.getString('data')
  const hi = Number(r.getFloat('horimetro_inicial'))
  const hf = Number(r.getFloat('horimetro_final'))
  const horas = Number(r.getFloat('horas'))
  const viagens = Number(r.getFloat('viagens'))
  const equipamento = r.getString('equipamento')

  // ---------------------------------------------------------------- 1. data
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    throw new BadRequestError('A data precisa estar no formato AAAA-MM-DD.')
  }
  const hoje = hojeBR()
  if (data > hoje) {
    throw new BadRequestError(
      'A data ' + data + ' está no futuro (hoje é ' + hoje + '). Confira a data.',
    )
  }
  // limite de sanidade: nada antes de 2020
  if (data < '2020-01-01') {
    throw new BadRequestError('A data ' + data + ' é antiga demais. Confira o ano.')
  }

  // ---------------------------------------------------------------- 2. horímetro
  if (!Number.isFinite(hi) || !Number.isFinite(hf)) {
    throw new BadRequestError('Informe o horímetro inicial e o final.')
  }
  if (hi < 0 || hf < 0) {
    throw new BadRequestError('Horímetro não pode ser negativo.')
  }
  if (hf < hi) {
    throw new BadRequestError(
      'O horímetro final (' +
        hf +
        ') é MENOR que o inicial (' +
        hi +
        '). Confira as leituras — normalmente é digitação trocada.',
    )
  }

  const variacao = Math.round((hf - hi) * 10000) / 10000

  // ------------------------------------------ 3. horas coerentes com o horímetro
  // A regra é: as horas não podem PASSAR da variação do horímetro (a máquina
  // não roda mais do que o relógio dela andou). Ficar abaixo é permitido
  // (parada, refeição), mas uma diferença grande merece aviso — e é isso que
  // impede o "andou 100 h e lancei 8 h" de passar batido.
  if (variacao > 0) {
    if (horas > variacao + TOLERANCIA_HORAS) {
      throw new BadRequestError(
        'As horas lançadas (' +
          horas +
          ' h) são MAIORES que a variação do horímetro (' +
          variacao +
          ' h). O horímetro andou ' +
          variacao +
          ' h, então as horas não podem passar disso.',
      )
    }
    // aceita até 20% de diferença (parada para refeição, manutenção no campo),
    // mas acima disso provavelmente é horímetro errado
    const minimo = Math.round(variacao * 0.8 * 100) / 100
    if (horas > 0 && horas < minimo) {
      throw new BadRequestError(
        'As horas lançadas (' +
          horas +
          ' h) estão muito abaixo do horímetro, que andou ' +
          variacao +
          ' h. Se a máquina ficou parada, escreva isso na observação e confira a leitura. ' +
          'Diferença aceita: até 20%.',
      )
    }
  } else if (horas > 0) {
    throw new BadRequestError(
      'O horímetro não variou (inicial = final), então não pode haver ' +
        horas +
        ' h lançadas. Se a máquina trabalhou, confira a leitura final.',
    )
  }

  // ---------------------------------------------------------------- 4. teto de horas
  if (horas < 0) {
    throw new BadRequestError('As horas não podem ser negativas.')
  }
  if (horas > 24) {
    throw new BadRequestError(
      'Foram lançadas ' + horas + ' h num único apontamento. O máximo é 24 h por dia.',
    )
  }

  // ---------------------------------------------------------------- 5. viagens
  if (Number.isFinite(viagens)) {
    if (viagens < 0) {
      throw new BadRequestError('As viagens não podem ser negativas.')
    }
    if (viagens > 500) {
      throw new BadRequestError(
        'Foram lançadas ' +
          viagens +
          ' viagens. Acima de 500 num apontamento é quase certo erro de digitação.',
      )
    }
  }

  // ---------------------------------------------------------------- 6. duplicata
  // mesmo equipamento, mesma data, mesmo horímetro = o mesmo apontamento 2x
  if (equipamento) {
    try {
      const existentes = $app.findRecordsByFilter(
        'lancamentos',
        'equipamento = {:eq} && data = {:data} && horimetro_inicial = {:hi} && horimetro_final = {:hf}',
        '',
        2,
        0,
        { eq: equipamento, data: data, hi: hi, hf: hf },
      )
      if (existentes && existentes.length > 0) {
        throw new BadRequestError(
          'Este apontamento já está lançado: mesmo equipamento (' +
            equipamento +
            '), mesma data (' +
            data +
            ') e mesmo horímetro (' +
            hi +
            ' → ' +
            hf +
            '). Confira em Lançamentos antes de lançar de novo.',
        )
      }
    } catch (err) {
      // se o erro for o nosso, repassa; se for da consulta, não bloqueia
      if (String(err).indexOf('já está lançado') >= 0) throw err
    }
  }

  return e.next()
}, 'lancamentos')

/// <reference path="../pb_data/types.d.ts" />

// TRACAS DE COERÊNCIA DO LANÇAMENTO DE PRODUÇÃO
//
// Antes o servidor aceitava qualquer coisa: horímetro final menor que o inicial,
// horas que não batem com o horímetro, 400 h num dia, data em 2030 e o mesmo
// apontamento duas vezes. Comprovado na auditoria de 17/11.
//
// Aplica as MESMAS regras ao CRIAR e ao EDITAR. Editar é a correção manual que o
// gestor faz quando um lançamento saiu errado (pedido do Rafael em 24/11) — se a
// trava valesse só na criação, daria para "consertar" um lançamento deixando-o
// inconsistente.
//
// ATENÇÃO: TODA a lógica fica DENTRO do callback, inclusive constantes e datas.
// O PocketBase executa cada hook num VM separado: qualquer declaração no topo do
// arquivo quebra em runtime com ReferenceError.

onRecordCreate((e) => {
  const TOLERANCIA_HORAS = 0.05 // arredondamento de horímetro, não erro de digitação

  // data de hoje no fuso do Brasil (o servidor roda em UTC)
  const agora = new Date()
  const br = new Date(agora.getTime() - 3 * 60 * 60 * 1000)
  const hoje =
    br.getUTCFullYear() +
    '-' +
    String(br.getUTCMonth() + 1).padStart(2, '0') +
    '-' +
    String(br.getUTCDate()).padStart(2, '0')

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
  if (data > hoje) {
    throw new BadRequestError(
      'A data ' + data + ' está no futuro (hoje é ' + hoje + '). Confira a data.',
    )
  }
  if (data < '2020-01-01') {
    throw new BadRequestError('A data ' + data + ' é antiga demais. Confira o ano.')
  }

  // ---------------------------------------------------------------- 2. horímetro
  if (!Number.isFinite(hi) || !Number.isFinite(hf)) {
    throw new BadRequestError('Informe o horímetro inicial e o final.')
  }
  if (hi < 0 || hf < 0) {
    throw new BadRequestError('O horímetro não pode ser negativo.')
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
  if (variacao > 0) {
    if (horas > variacao + TOLERANCIA_HORAS) {
      throw new BadRequestError(
        'As horas lançadas (' +
          horas +
          ' h) são MAIORES que a variação do horímetro (' +
          variacao +
          ' h). Confira as leituras.',
      )
    }
    // AVISO, NÃO BLOQUEIO (decisão do Rafael em 17/11): máquina parada não trava
    // o lançador — grava e marca em amarelo para conferência.
    const minimo = Math.round(variacao * 0.8 * 100) / 100
    if (horas > 0 && horas < minimo) {
      const diferenca = Math.round((variacao - horas) * 100) / 100
      r.set('conferir', true)
      r.set(
        'motivo_conferir',
        'Horímetro andou ' +
          variacao +
          ' h e foram lançadas ' +
          horas +
          ' h (' +
          diferenca +
          ' h de diferença). Confira se houve parada.',
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
  if (equipamento) {
    let existentes = null
    try {
      existentes = $app.findRecordsByFilter(
        'lancamentos',
        'equipamento = {:eq} && data = {:data} && horimetro_inicial = {:hi} && horimetro_final = {:hf}',
        '',
        2,
        0,
        { eq: equipamento, data: data, hi: hi, hf: hf },
      )
    } catch (err) {
      existentes = null // consulta falhou: não bloqueia o lançamento
    }
    if (existentes && existentes.length > 0) {
      throw new BadRequestError(
        'Este apontamento já está lançado: mesmo equipamento, mesma data (' +
          data +
          ') e mesmo horímetro (' +
          hi +
          ' → ' +
          hf +
          '). Confira em Lançamentos antes de lançar de novo.',
      )
    }
  }

  return e.next()
}, 'lancamentos')

// ---------------------------------------------------------------------------
// EDIÇÃO: mesmas regras da criação, com dois cuidados
//   1. o registro que está sendo editado NÃO conta como duplicata de si mesmo;
//   2. a marcação "conferir" é RECALCULADA — se o gestor corrige as horas, o
//      amarelo tem de sair; se piora, tem de aparecer.
// ---------------------------------------------------------------------------
onRecordUpdate((e) => {
  const TOLERANCIA_HORAS = 0.05

  const agora = new Date()
  const br = new Date(agora.getTime() - 3 * 60 * 60 * 1000)
  const hoje =
    br.getUTCFullYear() +
    '-' +
    String(br.getUTCMonth() + 1).padStart(2, '0') +
    '-' +
    String(br.getUTCDate()).padStart(2, '0')

  const r = e.record

  const data = r.getString('data')
  const hi = Number(r.getFloat('horimetro_inicial'))
  const hf = Number(r.getFloat('horimetro_final'))
  const horas = Number(r.getFloat('horas'))
  const viagens = Number(r.getFloat('viagens'))
  const equipamento = r.getString('equipamento')

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    throw new BadRequestError('A data precisa estar no formato AAAA-MM-DD.')
  }
  if (data > hoje) {
    throw new BadRequestError(
      'A data ' + data + ' está no futuro (hoje é ' + hoje + '). Confira a data.',
    )
  }
  if (data < '2020-01-01') {
    throw new BadRequestError('A data ' + data + ' é antiga demais. Confira o ano.')
  }

  if (!Number.isFinite(hi) || !Number.isFinite(hf)) {
    throw new BadRequestError('Informe o horímetro inicial e o final.')
  }
  if (hi < 0 || hf < 0) {
    throw new BadRequestError('O horímetro não pode ser negativo.')
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

  if (variacao > 0) {
    if (horas > variacao + TOLERANCIA_HORAS) {
      throw new BadRequestError(
        'As horas lançadas (' +
          horas +
          ' h) são MAIORES que a variação do horímetro (' +
          variacao +
          ' h). Confira as leituras.',
      )
    }
    const minimo = Math.round(variacao * 0.8 * 100) / 100
    if (horas > 0 && horas < minimo) {
      const diferenca = Math.round((variacao - horas) * 100) / 100
      r.set('conferir', true)
      r.set(
        'motivo_conferir',
        'Horímetro andou ' +
          variacao +
          ' h e foram lançadas ' +
          horas +
          ' h (' +
          diferenca +
          ' h de diferença). Confira se houve parada.',
      )
    } else {
      // corrigiu as horas: o amarelo sai
      r.set('conferir', false)
      r.set('motivo_conferir', '')
    }
  } else if (horas > 0) {
    throw new BadRequestError(
      'O horímetro não variou (inicial = final), então não pode haver ' +
        horas +
        ' h lançadas. Se a máquina trabalhou, confira a leitura final.',
    )
  }

  if (horas < 0) {
    throw new BadRequestError('As horas não podem ser negativas.')
  }
  if (horas > 24) {
    throw new BadRequestError(
      'Foram lançadas ' + horas + ' h num único apontamento. O máximo é 24 h por dia.',
    )
  }

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

  // duplicata: ignora o PRÓPRIO registro
  if (equipamento) {
    let existentes = null
    try {
      existentes = $app.findRecordsByFilter(
        'lancamentos',
        'equipamento = {:eq} && data = {:data} && horimetro_inicial = {:hi} && horimetro_final = {:hf} && id != {:id}',
        '',
        2,
        0,
        { eq: equipamento, data: data, hi: hi, hf: hf, id: r.id },
      )
    } catch (err) {
      existentes = null
    }
    if (existentes && existentes.length > 0) {
      throw new BadRequestError(
        'Já existe outro apontamento com este equipamento, data (' +
          data +
          ') e horímetro (' +
          hi +
          ' → ' +
          hf +
          '). Corrija a leitura ou apague o duplicado.',
      )
    }
  }

  return e.next()
}, 'lancamentos')

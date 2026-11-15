/// <reference path="../pb_data/types.d.ts" />

// ----------
// JOB AGENDADO — Relatório semanal de horímetro (Barragem 03)
//
// cronAdd "relatorio_semanal_horimetro": toda segunda-feira às 07:00 no fuso
// America/Sao_Paulo. Monta o relatório (horas por equipamento = última leitura
// − primeira leitura dentro da janela), grava em horimetro_relatorios e envia
// por e-mail para os destinatarios_relatorio ativos.
//   - Sem leituras na semana → registra no log e NÃO envia e-mail (evita
//     e-mail vazio semanalmente); o log deixa a decisão auditável.
//   - Sem destinatários ativos → relatório é salvo no histórico e o log avisa.
//
// Autocontido: o JSVM do PocketBase executa callbacks (cron/rota) em um pool
// de VMs sem escopo de topo, então as funções ficam dentro do callback — e o
// fluxo da rota manual de teste vive em horimetro_rota.pb.js (mesmo fluxo,
// arquivo separado, porque arquivos não se enxergam).
// ----------

// Fuso do agendamento: 07:00 locais de São Paulo (o cronExpr "0 7 * * 1" é
// interpretado neste timezone, não em UTC).
$app.cron().setTimezone(new Timezone('America/Sao_Paulo'))

cronAdd('relatorio_semanal_horimetro', '0 7 * * 1', () => {
  const JOB = 'relatorio_semanal_horimetro'

  try {
    // ---- janela: semana ENCERRADA (segunda anterior a domingo), fuso SP ----
    const partes = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .format(new Date())
      .split('-')
      .map(Number)
    const segunda = new Date(partes[0], partes[1] - 1, partes[2])
    segunda.setDate(segunda.getDate() - ((segunda.getDay() + 6) % 7))
    const domingo = new Date(segunda)
    domingo.setDate(segunda.getDate() + 6)
    const ini = new Date(segunda)
    ini.setDate(segunda.getDate() - 7)
    const iso = (d) =>
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0')
    const inicio = iso(ini)
    const fim = iso(domingo)

    const dBR = (isoData) => isoData.split('-').reverse().join('/')
    const fmt = (n) => n.toFixed(2).replace('.', ',')

    // ---- monta o relatório ----
    const equipamentos = app.findRecordsByFilter(
      'horimetro_equipamentos',
      'ativo = true',
      'identificacao',
      0,
      0,
    )
    const linhas = []
    let totalHoras = 0
    let comLeitura = 0
    for (const eq of equipamentos) {
      const leituras = app.findRecordsByFilter(
        'horimetro_leituras',
        'equipamento = "' + eq.id + '" && data >= "' + inicio + '" && data <= "' + fim + '"',
        'data',
        0,
        0,
      )
      if (leituras.length === 0) {
        linhas.push({
          equipamento: eq.getString('identificacao'),
          tipo: eq.getString('tipo'),
          leituras: [],
          horas_semana: 0,
          situacao: 'sem leituras no período',
        })
        continue
      }
      const ordenadas = leituras.map((r) => ({
        data: r.getString('data'),
        horas: r.getFloat('horas'),
      }))
      const horas = Math.max(0, ordenadas[ordenadas.length - 1].horas - ordenadas[0].horas)
      totalHoras += horas
      comLeitura++
      linhas.push({
        equipamento: eq.getString('identificacao'),
        tipo: eq.getString('tipo'),
        leituras: ordenadas,
        horas_semana: Number(horas.toFixed(2)),
        situacao: 'ok',
      })
    }
    linhas.sort((a, b) => b.horas_semana - a.horas_semana)

    const rel = {
      semana_inicio: inicio,
      semana_fim: fim,
      linhas: linhas,
      total_horas: Number(totalHoras.toFixed(2)),
      equipamentos_com_leitura: comLeitura,
      equipamentos_total: linhas.length,
    }

    // ---- sem leituras: loga e não envia ----
    if (comLeitura === 0) {
      console.log(
        '[' +
          JOB +
          '] Semana ' +
          inicio +
          ' a ' +
          fim +
          ': nenhuma leitura de horímetro. E-mail NÃO enviado.',
      )
      return
    }

    // ---- salva no histórico (um por semana_fim) ----
    const col = app.findCollectionByNameOrId('horimetro_relatorios')
    let rec
    try {
      rec = app.findFirstRecordByFilter('horimetro_relatorios', 'semana_fim = "' + fim + '"')
    } catch (_) {
      rec = new Record(col)
    }
    rec.set('semana_inicio', inicio)
    rec.set('semana_fim', fim)
    rec.set(
      'resumo',
      'Total de ' +
        fmt(totalHoras) +
        ' h rodadas na semana. ' +
        comLeitura +
        '/' +
        linhas.length +
        ' equipamentos com leitura.',
    )
    rec.set('conteudo', rel)
    app.save(rec)

    // ---- destinatários ----
    const destinatarios = app.findRecordsByFilter(
      'destinatarios_relatorio',
      'ativo = true',
      'email',
      0,
      0,
    )
    if (destinatarios.length === 0) {
      console.log(
        '[' +
          JOB +
          '] Relatório de ' +
          inicio +
          ' a ' +
          fim +
          ' salvo, mas nenhum destinatário ativo cadastrado em destinatarios_relatorio.',
      )
      return
    }

    // ---- e-mail ----
    const corpo = linhas
      .map((l) => {
        const leiturasTxt =
          l.leituras.map((x) => dBR(x.data) + ' → ' + fmt(x.horas) + ' h').join('<br>') || '—'
        const cor = l.horas_semana > 0 ? '#16a34a' : '#dc2626'
        return (
          '<tr>' +
          '<td style="padding:6px 10px;border:1px solid #e2e8f0;font-weight:600">' +
          l.equipamento +
          '</td>' +
          '<td style="padding:6px 10px;border:1px solid #e2e8f0">' +
          (l.tipo || '—') +
          '</td>' +
          '<td style="padding:6px 10px;border:1px solid #e2e8f0">' +
          leiturasTxt +
          '</td>' +
          '<td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right;color:' +
          cor +
          ';font-weight:700">' +
          fmt(l.horas_semana) +
          '</td>' +
          '</tr>'
        )
      })
      .join('')
    const html =
      '<div style="font-family:Arial,sans-serif;color:#0f172a">' +
      '<h2 style="margin:0 0 4px">Relatório Semanal de Horímetro — Barragem 03</h2>' +
      '<p style="margin:0 0 14px;color:#475569">Período: ' +
      dBR(inicio) +
      ' a ' +
      dBR(fim) +
      '</p>' +
      '<table style="border-collapse:collapse;width:100%;font-size:13px">' +
      '<thead><tr style="background:#f1f5f9">' +
      '<th align="left" style="padding:6px 10px;border:1px solid #e2e8f0">Equipamento</th>' +
      '<th align="left" style="padding:6px 10px;border:1px solid #e2e8f0">Tipo</th>' +
      '<th align="left" style="padding:6px 10px;border:1px solid #e2e8f0">Leituras</th>' +
      '<th align="right" style="padding:6px 10px;border:1px solid #e2e8f0">Horas no período</th>' +
      '</tr></thead>' +
      '<tbody>' +
      corpo +
      '</tbody>' +
      '<tfoot><tr>' +
      '<td colspan="3" style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right;font-weight:700">TOTAL</td>' +
      '<td style="padding:6px 10px;border:1px solid #e2e8f0;text-align:right;font-weight:800">' +
      fmt(totalHoras) +
      '</td>' +
      '</tr></tfoot>' +
      '</table>' +
      '<p style="margin-top:14px;color:#64748b;font-size:12px">' +
      'Horas no período = última leitura − primeira leitura do horímetro dentro da janela. ' +
      'Equipamentos sem leitura no período aparecem com 0,00 h.</p>' +
      '</div>'

    const destino = destinatarios.map((d) => ({ address: d.getString('email') }))
    const mensagem = new MailerMessage({
      from: {
        address: $app.settings().meta.senderAddress,
        name: $app.settings().meta.senderName,
      },
      to: destino,
      subject:
        'Relatório Semanal de Horímetro — Barragem 03 (' + dBR(inicio) + ' a ' + dBR(fim) + ')',
      html: html,
    })
    $app.newMailClient().send(mensagem)

    console.log(
      '[' +
        JOB +
        '] Relatório ' +
        inicio +
        ' a ' +
        fim +
        ' enviado para ' +
        destino.length +
        ' destinatário(s).',
    )
  } catch (e) {
    console.error(
      '[' + JOB + '] Falha ao gerar/enviar relatório: ' + (e && e.message ? e.message : e),
    )
  }
})

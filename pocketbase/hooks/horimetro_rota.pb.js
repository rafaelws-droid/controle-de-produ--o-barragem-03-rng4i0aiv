/// <reference path="../pb_data/types.d.ts" />

// Rota manual de teste do relatório semanal de horímetro.
// POST/GET /backend/v1/horimetro/enviar-relatorio (autenticada).
// Parâmetros opcionais semana_inicio / semana_fim (AAAA-MM-DD) no corpo (POST)
// ou na query (GET); sem eles, usa a semana encerrada (mesma janela do cron).
//
// Autocontida: o JSVM do PocketBase executa cada arquivo/callback em escopo
// próprio, sem enxergar constantes ou funções de outro arquivo — o mesmo fluxo
// do cron (horimetro.pb.js) está replicado aqui de propósito.

routerAdd('POST /backend/v1/horimetro/enviar-relatorio', (e) => {
  const info = e.requestInfo()
  const dados = info.body && typeof info.body === 'object' ? info.body : {}
  let inicio = String(dados.semana_inicio || info.query.semana_inicio || '').trim()
  let fim = String(dados.semana_fim || info.query.semana_fim || '').trim()

  if (!inicio || !fim) {
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
    const iso = function (d) {
      return (
        d.getFullYear() +
        '-' +
        String(d.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(d.getDate()).padStart(2, '0')
      )
    }
    inicio = iso(ini)
    fim = iso(domingo)
  }

  const dBR = function (isoData) {
    return isoData.split('-').reverse().join('/')
  }
  const fmt = function (n) {
    return n.toFixed(2).replace('.', ',')
  }

  try {
    // ---- monta o relatório (horas = última leitura − primeira na janela) ----
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
      const ordenadas = leituras.map(function (r) {
        return { data: r.getString('data'), horas: r.getFloat('horas') }
      })
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
    linhas.sort(function (a, b) {
      return b.horas_semana - a.horas_semana
    })
    const rel = {
      semana_inicio: inicio,
      semana_fim: fim,
      linhas: linhas,
      total_horas: Number(totalHoras.toFixed(2)),
      equipamentos_com_leitura: comLeitura,
      equipamentos_total: linhas.length,
    }

    let relatorio_id = null
    let enviado = false
    let motivo = ''
    let qtdDestinatarios = 0

    if (comLeitura === 0) {
      motivo = 'sem leituras no período'
      console.log(
        '[relatorio_semanal_horimetro] Disparo manual (' +
          inicio +
          '~' +
          fim +
          '): ' +
          motivo +
          '.',
      )
    } else {
      // ---- salva no histórico ----
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
      relatorio_id = rec.id

      // ---- e-mail ----
      const destinatarios = app.findRecordsByFilter(
        'destinatarios_relatorio',
        'ativo = true',
        'email',
        0,
        0,
      )
      if (destinatarios.length === 0) {
        motivo = 'nenhum destinatário ativo'
      } else {
        const corpo = linhas
          .map(function (l) {
            const leiturasTxt =
              l.leituras
                .map(function (x) {
                  return dBR(x.data) + ' → ' + fmt(x.horas) + ' h'
                })
                .join('<br>') || '—'
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
          'Horas no período = última leitura − primeira leitura do horímetro dentro da janela.</p>' +
          '</div>'

        const destino = destinatarios.map(function (d) {
          return { address: d.getString('email') }
        })
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
        enviado = true
        qtdDestinatarios = destino.length
      }
    }

    return e.json(200, {
      ok: true,
      enviado: enviado,
      motivo: motivo,
      semana: { inicio: rel.semana_inicio, fim: rel.semana_fim },
      resumo: {
        total_horas: rel.total_horas,
        equipamentos_com_leitura: rel.equipamentos_com_leitura,
        equipamentos_total: rel.equipamentos_total,
      },
      relatorio_id: relatorio_id,
      destinatarios: qtdDestinatarios,
    })
  } catch (err) {
    return e.json(500, { ok: false, erro: String(err && err.message ? err.message : err) })
  }
})

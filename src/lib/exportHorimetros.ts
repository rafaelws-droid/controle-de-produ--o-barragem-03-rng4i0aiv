import type { Lancamento } from '@/types'
import { baixarBlob, baixarXlsx, type Planilha } from '@/lib/xlsx-lite'
import { formatDataBR, formatHoras, sanitizeFilename } from '@/lib/exportUtils'

/**
 * Relatório de horímetros para o controle de manutenção.
 *
 * O que a manutenção precisa saber por equipamento:
 *  - leitura do horímetro no início e no fim do período (posição do medidor);
 *  - quantas horas o equipamento rodou no período;
 *  - data do último apontamento e quantos dias está sem apontamento
 *    (equipamento parado pode ser manutenção, avaria ou falta de lançamento);
 *  - se houve manutenção registrada no período e qual foi a última.
 */

export interface EquipamentoBase {
  id: string
  identificacao: string
  descricao?: string
  categoria?: string
}

export interface LinhaHorimetro {
  equipamentoId: string
  equipamento: string
  descricao: string
  categoria: string
  horimetroInicial: number | null
  horimetroFinal: number | null
  variacaoHorimetro: number
  horasPeriodo: number
  lancamentos: number
  ultimaData: string | null
  diasSemApontamento: number | null
  manutencoes: number
  ultimaManutencao: string | null
  obsManutencao: string
  semLeitura: boolean
}

const MS_DIA = 24 * 60 * 60 * 1000

function emDias(de: string, ate: string): number {
  const a = new Date(`${de}T00:00:00`)
  const b = new Date(`${ate}T00:00:00`)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0
  return Math.round((b.getTime() - a.getTime()) / MS_DIA)
}

/** Data de hoje no formato YYYY-MM-DD, no fuso local. */
export function hojeISO(): string {
  const h = new Date()
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}-${String(
    h.getDate(),
  ).padStart(2, '0')}`
}

export function montarHorimetros(
  equipamentos: EquipamentoBase[],
  lancamentos: Lancamento[],
  referencia: string = hojeISO(),
): LinhaHorimetro[] {
  const porEquipamento = new Map<string, Lancamento[]>()
  for (const l of lancamentos) {
    if (!l.equipamento) continue
    const lista = porEquipamento.get(l.equipamento) || []
    lista.push(l)
    porEquipamento.set(l.equipamento, lista)
  }

  const linhas: LinhaHorimetro[] = equipamentos.map((eq) => {
    const lista = (porEquipamento.get(eq.id) || [])
      .slice()
      .sort((a, b) => (a.data + (a.created || '')).localeCompare(b.data + (b.created || '')))

    const primeiro = lista[0]
    const ultimo = lista[lista.length - 1]

    const horasPeriodo = lista.reduce((acc, l) => acc + (l.horas || 0), 0)
    const inicial = primeiro ? primeiro.horimetro_inicial : null
    const final = ultimo ? ultimo.horimetro_final : null
    const variacao =
      inicial !== null && final !== null && final >= inicial
        ? Number((final - inicial).toFixed(2))
        : 0

    const comManutencao = lista.filter((l) => l.manutencao)
    const ultimaManutencao = comManutencao.length
      ? comManutencao[comManutencao.length - 1].data
      : null
    const obsManutencao = comManutencao
      .map((l) => [l.servico, l.observacao].filter(Boolean).join(' — '))
      .filter(Boolean)
      .join(' | ')

    return {
      equipamentoId: eq.id,
      equipamento: eq.identificacao,
      descricao: eq.descricao || '',
      categoria: eq.categoria || 'OUTRO',
      horimetroInicial: inicial,
      horimetroFinal: final,
      variacaoHorimetro: variacao,
      horasPeriodo: Number(horasPeriodo.toFixed(2)),
      lancamentos: lista.length,
      ultimaData: ultimo ? ultimo.data : null,
      diasSemApontamento: ultimo ? Math.max(0, emDias(ultimo.data, referencia)) : null,
      manutencoes: comManutencao.length,
      ultimaManutencao,
      obsManutencao,
      semLeitura: lista.length === 0,
    }
  })

  // Quem rodou mais horas primeiro: é onde a manutenção olha antes.
  return linhas.sort((a, b) => {
    if (b.horasPeriodo !== a.horasPeriodo) return b.horasPeriodo - a.horasPeriodo
    return a.equipamento.localeCompare(b.equipamento)
  })
}

export function resumoHorimetros(linhas: LinhaHorimetro[]) {
  const comApontamento = linhas.filter((l) => !l.semLeitura)
  return {
    equipamentos: linhas.length,
    comApontamento: comApontamento.length,
    semApontamento: linhas.length - comApontamento.length,
    horas: Number(linhas.reduce((a, l) => a + l.horasPeriodo, 0).toFixed(2)),
    comManutencao: linhas.filter((l) => l.manutencoes > 0).length,
    parados: comApontamento.filter((l) => (l.diasSemApontamento ?? 0) >= 3).length,
  }
}

/** Situação de cada equipamento, em texto curto para a planilha. */
export function situacao(l: LinhaHorimetro): string {
  if (l.semLeitura) return 'SEM APONTAMENTO NO PERÍODO'
  const partes: string[] = []
  if (l.manutencoes > 0) partes.push('MANUTENÇÃO REGISTRADA')
  if ((l.diasSemApontamento ?? 0) >= 3) partes.push(`${l.diasSemApontamento} DIAS SEM APONTAMENTO`)
  return partes.length ? partes.join(' / ') : 'EM OPERAÇÃO'
}

const CABECALHO = [
  'Equipamento',
  'Descrição',
  'Categoria',
  'Horímetro Inicial',
  'Horímetro Final',
  'Variação do Horímetro',
  'Horas no Período',
  'Apontamentos',
  'Último Apontamento',
  'Dias sem Apontamento',
  'Manutenções',
  'Última Manutenção',
  'Situação',
]

function linhaDe(l: LinhaHorimetro): (string | number)[] {
  return [
    l.equipamento,
    l.descricao,
    l.categoria,
    l.horimetroInicial !== null ? Number(l.horimetroInicial.toFixed(2)) : '',
    l.horimetroFinal !== null ? Number(l.horimetroFinal.toFixed(2)) : '',
    l.variacaoHorimetro,
    l.horasPeriodo,
    l.lancamentos,
    l.ultimaData ? formatDataBR(l.ultimaData) : '—',
    l.diasSemApontamento ?? '',
    l.manutencoes,
    l.ultimaManutencao ? formatDataBR(l.ultimaManutencao) : '—',
    situacao(l),
  ]
}

const CABECALHO_DETALHE = [
  'Data',
  'Equipamento',
  'Operador/Motorista',
  'Turno',
  'Horímetro Inicial',
  'Horímetro Final',
  'Horas',
  'Manutenção',
  'Serviço',
  'Observação',
]

function linhaDetalhe(l: Lancamento): (string | number)[] {
  return [
    formatDataBR(l.data),
    l.expand?.equipamento?.identificacao || '-',
    l.expand?.operador?.nome || '-',
    l.turno || '',
    Number(l.horimetro_inicial?.toFixed(2) ?? 0),
    Number(l.horimetro_final?.toFixed(2) ?? 0),
    Number((l.horas || 0).toFixed(2)),
    l.manutencao ? 'SIM' : '',
    l.servico || '',
    l.observacao || '',
  ]
}

export function exportarHorimetrosExcel(
  linhas: LinhaHorimetro[],
  lancamentos: Lancamento[],
  periodo: string,
): void {
  const r = resumoHorimetros(linhas)

  const planilhas: Planilha[] = [
    {
      nome: 'Horímetro por equipamento',
      linhas: [
        ['CONTROLE DE MANUTENÇÃO — HORÍMETRO POR EQUIPAMENTO'],
        ['Barragem 03 — Silveira Transportes'],
        [`Período: ${periodo}`],
        [],
        [
          'Equipamentos',
          r.equipamentos,
          'Com apontamento',
          r.comApontamento,
          'Sem apontamento',
          r.semApontamento,
        ],
        ['Total de horas no período', r.horas, 'Com manutenção registrada', r.comManutencao],
        [],
        CABECALHO,
        ...linhas.map(linhaDe),
      ],
    },
    {
      nome: 'Detalhamento',
      linhas: [
        ['DETALHAMENTO DOS APONTAMENTOS'],
        [`Período: ${periodo}`],
        [],
        CABECALHO_DETALHE,
        ...lancamentos.map(linhaDetalhe),
      ],
    },
  ]

  baixarXlsx(`horimetros_manutencao_${sanitizeFilename(periodo)}.xlsx`, planilhas)
}

export function exportarHorimetrosCsv(linhas: LinhaHorimetro[], periodo: string): void {
  const esc = (v: string | number) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const corpo = [
    ['HORÍMETRO POR EQUIPAMENTO — BARRAGEM 03'],
    [`Período: ${periodo}`],
    [],
    CABECALHO,
    ...linhas.map(linhaDe),
  ]
    .map((l) => l.map(esc).join(';'))
    .join('\r\n')
  const blob = new Blob(['\uFEFF' + corpo], { type: 'text/csv;charset=utf-8;' })
  baixarBlob(blob, `horimetros_manutencao_${sanitizeFilename(periodo)}.csv`)
}

export function exportarHorimetrosPdf(linhas: LinhaHorimetro[], periodo: string): void {
  const r = resumoHorimetros(linhas)

  const corpo = linhas
    .map((l) => {
      const alerta =
        l.manutencoes > 0 || (l.diasSemApontamento ?? 0) >= 3 || l.semLeitura
          ? ' class="alerta"'
          : ''
      return `<tr${alerta}>
        <td class="eq"><b>${l.equipamento}</b>${l.descricao ? `<br><span class="sub">${l.descricao}</span>` : ''}</td>
        <td>${l.categoria}</td>
        <td class="num">${l.horimetroInicial !== null ? formatHoras(l.horimetroInicial) : '—'}</td>
        <td class="num">${l.horimetroFinal !== null ? formatHoras(l.horimetroFinal) : '—'}</td>
        <td class="num"><b>${formatHoras(l.horasPeriodo)}</b></td>
        <td class="num">${l.lancamentos}</td>
        <td>${l.ultimaData ? formatDataBR(l.ultimaData) : '—'}</td>
        <td class="num">${l.diasSemApontamento ?? '—'}</td>
        <td>${l.ultimaManutencao ? formatDataBR(l.ultimaManutencao) : '—'}</td>
        <td class="sit">${situacao(l)}</td>
      </tr>`
    })
    .join('')

  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
  <title>Horímetros — Manutenção — ${periodo}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; margin: 16px; color: #0f172a; }
    header { border-bottom: 3px solid #2563eb; padding-bottom: 8px; margin-bottom: 12px; }
    h1 { font-size: 17px; margin: 0 0 2px; }
    .sub { font-size: 11px; color: #475569; }
    .cards { display: flex; gap: 8px; margin: 10px 0 14px; flex-wrap: wrap; }
    .card { border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; font-size: 11px; }
    .card b { display: block; font-size: 15px; color: #1d4ed8; }
    table { width: 100%; border-collapse: collapse; font-size: 9px; }
    th, td { border: 1px solid #cbd5e1; padding: 3px 4px; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; font-size: 8.5px; text-transform: uppercase; }
    td.num { text-align: right; white-space: nowrap; }
    td.eq { white-space: nowrap; }
    td.sit { font-size: 8px; }
    tr.alerta td { background: #fff7ed; }
    .legenda { font-size: 9px; color: #64748b; margin-top: 10px; }
    @page { size: A4 landscape; margin: 10mm; }
    @media print { body { margin: 0; } th { -webkit-print-color-adjust: exact; } tr { break-inside: avoid; } }
  </style></head><body>
  <header>
    <h1>CONTROLE DE MANUTENÇÃO — HORÍMETRO POR EQUIPAMENTO</h1>
    <div class="sub">Barragem 03 • Período: ${periodo} • Emitido em ${new Date().toLocaleString('pt-BR')}</div>
  </header>
  <div class="cards">
    <div class="card">Equipamentos<b>${r.equipamentos}</b></div>
    <div class="card">Com apontamento<b>${r.comApontamento}</b></div>
    <div class="card">Sem apontamento<b>${r.semApontamento}</b></div>
    <div class="card">Horas no período<b>${formatHoras(r.horas)} h</b></div>
    <div class="card">Com manutenção<b>${r.comManutencao}</b></div>
  </div>
  <table>
    <thead><tr>
      <th>Equipamento</th><th>Categoria</th><th>Horímetro inicial</th><th>Horímetro final</th>
      <th>Horas no período</th><th>Apont.</th><th>Último apont.</th><th>Dias s/ apont.</th>
      <th>Última manut.</th><th>Situação</th>
    </tr></thead>
    <tbody>${corpo}</tbody>
  </table>
  <p class="legenda">Linhas destacadas: equipamento com manutenção registrada, sem apontamento no período ou há 3 dias ou mais sem apontamento.
  O horímetro é a leitura do medidor de horas do equipamento; a diferença entre a leitura final e a inicial é o que o equipamento rodou no período.</p>
  <script>window.onload = function () { window.print() }</script>
  </body></html>`

  const janela = window.open('', '_blank')
  if (!janela) {
    alert(
      'O navegador bloqueou a janela do PDF. Libere pop-ups para este site e clique em PDF novamente.',
    )
    return
  }
  janela.document.open()
  janela.document.write(html)
  janela.document.close()
}

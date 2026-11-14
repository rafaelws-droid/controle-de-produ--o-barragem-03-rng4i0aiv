import type { Lancamento } from '@/types'
import { baixarBlob, baixarXlsx, type Planilha } from '@/lib/xlsx-lite'

export function formatHoras(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return '0,00'
  return valor.toFixed(2).replace('.', ',')
}

export function formatNumero(valor: number | null | undefined, dec = 2): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return '-'
  return valor.toFixed(dec).replace('.', ',')
}

/** Data YYYY-MM-DD → DD/MM/YYYY (sem depender de fuso do navegador). */
export function formatDataBR(data: string | null | undefined): string {
  if (!data) return '-'
  const [ano, mes, dia] = data.split('-')
  if (ano && mes && dia) return `${dia}/${mes}/${ano}`
  return data
}

export function nomeEquipamento(l: Lancamento): string {
  return l.expand?.equipamento?.identificacao || '-'
}

export function nomeOperador(l: Lancamento): string {
  return l.expand?.operador?.nome || '-'
}

export function nomeFrente(l: Lancamento): string {
  return l.expand?.frente?.nome || '-'
}

/** Texto único com as marcações do lançamento (o que antes era "OBSERVAÇÃO"). */
export function descreverMarcacoes(l: Lancamento): string {
  const itens: string[] = []
  if (l.refeicao) itens.push('REFEIÇÃO')
  if (l.abastecimento) itens.push('ABASTECIMENTO')
  if (l.manutencao) itens.push('MANUTENÇÃO')
  if (l.dds) itens.push('DDS')
  if (l.apr) itens.push('APR')
  if (l.checklist) itens.push('CHECK LIST')
  if (l.disposicao) itens.push('À DISPOSIÇÃO')
  if (l.expand?.substituindo?.identificacao) {
    itens.push(`SUBSTITUINDO ${l.expand.substituindo.identificacao}`)
  }
  return itens.join(' / ')
}

const escapeCsv = (v: string | number | null | undefined) =>
  `"${String(v ?? '').replace(/"/g, '""')}"`

export function sanitizeFilename(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase()
}

export function resumo(lancamentos: Lancamento[]) {
  const horas = lancamentos.reduce((acc, l) => acc + (l.horas || 0), 0)
  const viagens = lancamentos.reduce((acc, l) => acc + (l.viagens || 0), 0)
  return {
    quantidade: lancamentos.length,
    horas: Number(horas.toFixed(2)),
    viagens,
  }
}

const CABECALHO = [
  'Data',
  'Frente',
  'Equipamento',
  'Operador/Motorista',
  'Turno',
  'Horímetro Inicial',
  'Horímetro Final',
  'Total Horas',
  'Viagens',
  'Serviço',
  'Observação',
]

function linhaDe(l: Lancamento): (string | number)[] {
  return [
    formatDataBR(l.data),
    nomeFrente(l),
    nomeEquipamento(l),
    nomeOperador(l),
    l.turno || '',
    Number(l.horimetro_inicial?.toFixed(2) ?? 0),
    Number(l.horimetro_final?.toFixed(2) ?? 0),
    Number((l.horas || 0).toFixed(2)),
    l.viagens || 0,
    l.servico || '',
    descreverMarcacoes(l) + (l.observacao ? ` (${l.observacao})` : ''),
  ]
}

function planilhaDe(nome: string, lancamentos: Lancamento[]): Planilha {
  const r = resumo(lancamentos)
  const linhas: (string | number | null)[][] = [
    ['CONTROLE DE PRODUÇÃO — BARRAGEM 03'],
    [nome],
    [],
    CABECALHO,
    ...lancamentos.map(linhaDe),
    [],
    ['TOTAL', '', '', '', '', '', '', r.horas, r.viagens, `${r.quantidade} lançamentos`, ''],
  ]
  return { nome, linhas }
}

export function exportarExcel(lancamentos: Lancamento[], periodo: string): void {
  const planilhas: Planilha[] = [planilhaDe('Lançamentos', lancamentos)]

  // Uma aba por frente, como as abas da planilha antiga.
  const porFrente = new Map<string, Lancamento[]>()
  for (const l of lancamentos) {
    const chave = nomeFrente(l)
    const lista = porFrente.get(chave) || []
    lista.push(l)
    porFrente.set(chave, lista)
  }
  for (const [frente, lista] of porFrente) {
    planilhas.push(planilhaDe(frente, lista))
  }

  baixarXlsx(`producao_barragem03_${sanitizeFilename(periodo)}.xlsx`, planilhas)
}

export function exportarCsv(lancamentos: Lancamento[], periodo: string): void {
  const r = resumo(lancamentos)
  const linhas = [
    ['CONTROLE DE PRODUÇÃO — BARRAGEM 03'],
    [periodo],
    [],
    CABECALHO,
    ...lancamentos.map(linhaDe),
    [],
    ['TOTAL', '', '', '', '', '', '', formatHoras(r.horas), r.viagens, '', ''],
  ]
  const csv = linhas.map((l) => l.map(escapeCsv).join(';')).join('\r\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  baixarBlob(blob, `producao_barragem03_${sanitizeFilename(periodo)}.csv`)
}

/**
 * PDF: abre a janela de impressão do navegador já com o relatório formatado.
 * O usuário escolhe "Salvar como PDF" — funciona no celular e no computador sem
 * depender de biblioteca de PDF no projeto.
 */
export function exportarPdf(lancamentos: Lancamento[], periodo: string): void {
  const r = resumo(lancamentos)

  const linhasPorFrente = new Map<string, Lancamento[]>()
  for (const l of lancamentos) {
    const chave = nomeFrente(l)
    const lista = linhasPorFrente.get(chave) || []
    lista.push(l)
    linhasPorFrente.set(chave, lista)
  }

  const blocos: string[] = []
  for (const [frente, lista] of linhasPorFrente) {
    const rr = resumo(lista)
    blocos.push(`
      <h2>${frente}</h2>
      <table>
        <thead><tr>
          <th>Data</th><th>Equip.</th><th>Operador</th><th>Turno</th>
          <th>Ini.</th><th>Fim</th><th>Horas</th><th>Viag.</th><th>Serviço</th><th>Obs.</th>
        </tr></thead>
        <tbody>
          ${lista
            .map(
              (l) => `<tr>
            <td>${formatDataBR(l.data)}</td>
            <td>${nomeEquipamento(l)}</td>
            <td>${nomeOperador(l)}</td>
            <td>${l.turno || ''}</td>
            <td>${formatNumero(l.horimetro_inicial, 1)}</td>
            <td>${formatNumero(l.horimetro_final, 1)}</td>
            <td><b>${formatHoras(l.horas)}</b></td>
            <td>${l.viagens || ''}</td>
            <td class="serv">${l.servico || ''}</td>
            <td class="obs">${descreverMarcacoes(l)}${l.observacao ? ` (${l.observacao})` : ''}</td>
          </tr>`,
            )
            .join('')}
        </tbody>
        <tfoot><tr>
          <td colspan="6">TOTAL ${frente}</td>
          <td>${formatHoras(rr.horas)}</td>
          <td>${rr.viagens}</td>
          <td colspan="2">${rr.quantidade} lançamentos</td>
        </tr></tfoot>
      </table>
    `)
  }

  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
  <title>Produção Barragem 03 — ${periodo}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; margin: 18px; color: #0f172a; }
    header { border-bottom: 3px solid #2563eb; padding-bottom: 10px; margin-bottom: 14px; }
    h1 { font-size: 18px; margin: 0 0 2px; }
    .sub { font-size: 12px; color: #475569; }
    .cards { display: flex; gap: 10px; margin: 12px 0 18px; flex-wrap: wrap; }
    .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 7px 12px; font-size: 12px; }
    .card b { display: block; font-size: 16px; color: #1d4ed8; }
    h2 { font-size: 13px; margin: 16px 0 6px; background: #eff6ff; padding: 5px 8px; border-left: 4px solid #2563eb; }
    table { width: 100%; border-collapse: collapse; font-size: 9px; }
    th, td { border: 1px solid #cbd5e1; padding: 3px 4px; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; font-size: 8.5px; text-transform: uppercase; }
    tfoot td { font-weight: bold; background: #f8fafc; }
    .serv { max-width: 210px; }
    .obs { max-width: 150px; font-size: 8px; }
    @page { size: A4 landscape; margin: 10mm; }
    @media print { body { margin: 0; } h2 { break-after: avoid; } table { break-inside: auto; } tr { break-inside: avoid; } }
  </style></head><body>
  <header>
    <h1>CONTROLE DE PRODUÇÃO — BARRAGEM 03</h1>
    <div class="sub">Período: ${periodo} • Emitido em ${new Date().toLocaleString('pt-BR')}</div>
  </header>
  <div class="cards">
    <div class="card">Lançamentos<b>${r.quantidade}</b></div>
    <div class="card">Total de horas<b>${formatHoras(r.horas)} h</b></div>
    <div class="card">Total de viagens<b>${r.viagens}</b></div>
    <div class="card">Frentes<b>${linhasPorFrente.size}</b></div>
  </div>
  ${blocos.join('')}
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

/**
 * Exportação no PADRÃO AMG — engenharia reversa da planilha original.
 *
 * Referência: `Controle_de_Produc_a_o_Barragem_03_setembro-outubro_de_2026.xlsx`.
 *
 * O arquivo tem 11 abas:
 *   1..9  — as abas originais da AMG, uma por frente, idênticas à original
 *           (nome, mesclagens, larguras, alturas, fonte, cores, bordas, formatos
 *           e as fórmulas =SUM(F-E) e =SUM(G4:Gn));
 *   10    — BASE: todos os lançamentos do período numa tabela plana e filtrável;
 *   11    — PAINEL: cartões do período, ranking por equipamento e a soma do que
 *           está filtrado (SUBTOTAL, que acompanha o filtro).
 *
 * As duas últimas são acréscimo: não alteram nenhuma das 9 originais.
 *
 * Cada detalhe visual foi LIDO da original célula por célula, não inventado:
 *  - linha 1: título mesclado A1:D2 e o rótulo "CONTROLE DIÁRIO DE PRODUÇÃO …"
 *    em E1:G1 — a sequência de espaços no meio faz parte do arquivo;
 *  - linha 2: "GARANTIA DE HORAS MENSAIS" em E2:F2 e o valor em G2, em vermelho;
 *  - linha 3: cabeçalho, MOTORISTA nas abas de caminhão e OPERADOR nas demais;
 *  - dados da linha 4 em diante, altura 15,75;
 *  - última linha mesclada A:F com "TOTAL HORAS" (ou "TOTAL HORAS E VIAGENS");
 *  - fonte Red Hat Display 11 com preto explícito; preenchimentos EEEEEE,
 *    E7E6E6, FBE5D6, C6DEB5, DDE8CB e DEE6EF; bordas medium/dotted;
 *  - a aba do PIPA guarda horímetro como DURAÇÃO ([h]:mm:ss).
 *
 * Defeitos da própria original reproduzidos de propósito, para sair igual:
 *  - "HORIM FINAL" sem acento na aba ESCAVADEIRA_CARREGAMENTO;
 *  - "TOTAL HORAS " com espaço no fim em três abas;
 *  - "PERÍODO 20/09 19/10/2026" sem o "á" na aba ROLO_COMPACTADOR;
 *  - formato de moeda (R$) em colunas de texto — invisível, mas está lá.
 *
 * ARMADILHAS QUE JÁ CUSTARAM ERRO (não repetir):
 *  - fórmula no XML do .xlsx vai em INGLÊS e com VÍRGULA. "SUBTOTAL(9;...)" com
 *    ponto e vírgula gera #VALUE! ao abrir;
 *  - a chave do cache de estilos tem que incluir o numFmt resolvido, senão dois
 *    formatos diferentes dividem o mesmo índice e o Excel mostra General;
 *  - `cod_material` do SisUM não é chave (o código 002 repete em 38 cadastros);
 *  - a aba BASE precisa do nome reservado `_xlnm._FilterDatabase` em
 *    workbook.xml, senão o Excel perde o filtro ao reabrir.
 */

type Fmt = null | 'DATA' | 'DURACAO' | 'BRL' | 'INTEIRO' | 'DUAS'

interface AbaSpec {
  frente: string
  aba: string
  titulo: string
  pessoa: 'OPERADOR' | 'MOTORISTA'
  viagens: boolean
  rodape: string
  garantia: number
  larguras: Record<string, number>
  fillCab: (string | null)[]
  fillDado: (string | null)[]
  fillTot: (string | null)[]
  fmtDado: Fmt[]
  fmtTot: Fmt[]
  cabecalhoHf?: string
  periodoSemA?: boolean
  duracao?: boolean
}

const E = 'EEEEEE'
const S = null

export const ABAS_AMG: AbaSpec[] = [
  {
    frente: 'ESCAVADEIRA 24H',
    aba: 'ESCAVADEIRA_24 HORAS',
    titulo:
      'CONTROLE DIÁRIO DE PRODUÇÃO                                      ESCAVADEIRA LIMPEZA DE CANAL 24 HORAS',
    pessoa: 'OPERADOR',
    viagens: false,
    rodape: 'TOTAL HORAS',
    garantia: 500,
    larguras: { B: 21.14, C: 27.86, D: 17.86, E: 18.86, F: 24.29, G: 22, H: 70.43, I: 76.57 },
    fillCab: [E, E, E, E, 'E7E6E6', 'E7E6E6', 'FBE5D6', E, E],
    fillDado: [S, S, S, S, S, S, 'FBE5D6', S, S],
    fillTot: ['DDE8CB', S, S, S, S, S, 'DDE8CB', 'DDE8CB', 'DDE8CB'],
    fmtDado: ['DATA', 'BRL', 'BRL', 'BRL', S, S, S, 'BRL', 'BRL'],
    fmtTot: ['BRL', S, S, S, S, S, S, 'BRL', 'BRL'],
  },
  {
    frente: 'ESCAVADEIRA ADM',
    aba: 'ESCAVADEIRA_ADM',
    titulo: 'CONTROLE DIÁRIO DE PRODUÇÃO                                      ESCAVADEIRA ADM',
    pessoa: 'OPERADOR',
    viagens: false,
    rodape: 'TOTAL HORAS',
    garantia: 105,
    larguras: { B: 21.14, C: 25.14, D: 12.14, E: 18.86, F: 24.29, G: 22, H: 76.57, I: 62.71 },
    fillCab: [E, E, E, E, E, E, E, E, E],
    fillDado: [S, S, S, S, S, S, 'FBE5D6', S, S],
    fillTot: ['DDE8CB', S, S, S, S, S, 'DDE8CB', 'DDE8CB', 'DDE8CB'],
    fmtDado: ['DATA', S, S, S, S, S, S, S, S],
    fmtTot: ['BRL', S, S, S, S, S, S, 'BRL', 'BRL'],
  },
  {
    frente: 'ESCAVADEIRA CARREGAMENTO',
    aba: 'ESCAVADEIRA_CARREGAMENTO',
    titulo:
      'CONTROLE DIÁRIO DE PRODUÇÃO                                      ESCAVADEIRA CARREGAMENTO',
    pessoa: 'OPERADOR',
    viagens: false,
    rodape: 'TOTAL HORAS ',
    garantia: 300,
    larguras: { B: 21.14, C: 25, D: 13.43, E: 18.86, F: 24.29, G: 22, H: 70.43, I: 87.43 },
    fillCab: [E, E, E, E, E, E, E, E, E],
    fillDado: [S, S, S, S, S, S, 'FBE5D6', S, S],
    fillTot: ['DDE8CB', S, S, S, S, S, 'DDE8CB', 'DDE8CB', 'DDE8CB'],
    fmtDado: ['DATA', 'BRL', 'BRL', 'BRL', S, S, S, 'BRL', 'BRL'],
    fmtTot: ['BRL', S, S, S, S, S, S, 'BRL', 'BRL'],
    cabecalhoHf: 'HORIM FINAL',
  },
  {
    frente: 'PÁ CARREGADEIRA BARRAGEM 03',
    aba: 'PÁ CARREGADEIRA_BARRAGEM 03',
    titulo:
      'CONTROLE DIÁRIO DE PRODUÇÃO                                               PÁ CARREGADEIRA BARRAGEM 03',
    pessoa: 'OPERADOR',
    viagens: false,
    rodape: 'TOTAL HORAS',
    garantia: 300,
    larguras: { B: 21.14, C: 23.43, D: 11.71, E: 18.86, F: 24.29, G: 22, H: 80.57, I: 68 },
    fillCab: [E, E, E, E, E, E, E, E, E],
    fillDado: [S, S, S, S, S, S, 'FBE5D6', S, S],
    fillTot: ['DDE8CB', S, S, S, S, S, 'DDE8CB', 'DDE8CB', 'DDE8CB'],
    fmtDado: ['DATA', S, S, S, S, S, S, S, S],
    fmtTot: ['BRL', S, S, S, S, S, S, 'BRL', 'BRL'],
  },
  {
    frente: 'PÁ CARREGADEIRA DESAGUAMENTO',
    aba: 'PÁ CARREGADEIRA_DESAGUAMENTO',
    titulo:
      'CONTROLE DIÁRIO DE PRODUÇÃO                                               PÁ CARREGADEIRA DESAGUAMENTO',
    pessoa: 'OPERADOR',
    viagens: false,
    rodape: 'TOTAL HORAS ',
    garantia: 660,
    larguras: {
      A: 11.29,
      B: 21.14,
      C: 26.14,
      D: 13.43,
      E: 18.86,
      F: 24.29,
      G: 22,
      H: 92.14,
      I: 67,
    },
    fillCab: [E, E, E, E, E, E, E, E, E],
    fillDado: [S, S, S, S, S, S, 'FBE5D6', S, S],
    fillTot: ['DDE8CB', S, S, S, S, S, 'DDE8CB', 'DDE8CB', 'DDE8CB'],
    fmtDado: ['DATA', S, S, S, S, S, S, S, S],
    fmtTot: ['BRL', S, S, S, S, S, S, 'BRL', 'BRL'],
  },
  {
    frente: 'CAMINHÕES DESAGUAMENTO',
    aba: 'CAMINHÕES _DESAGUAMENTO',
    titulo:
      'CONTROLE DIÁRIO DE PRODUÇÃO                                      CAMINHÕES-DESAGUAMENTO',
    pessoa: 'MOTORISTA',
    viagens: true,
    rodape: 'TOTAL HORAS E VIAGENS',
    garantia: 1228.077,
    larguras: { B: 21.14, C: 34.4, D: 12.1, E: 18.86, F: 24.29, G: 22, H: 24, I: 100.3, J: 73.6 },
    fillCab: [E, E, E, E, E, E, 'FBE5D6', 'C6DEB5', E, E],
    fillDado: [S, S, S, S, S, S, 'FBE5D6', 'C6DEB5', S, S],
    fillTot: ['DDE8CB', S, S, S, S, S, 'DDE8CB', 'DDE8CB', 'DDE8CB', 'DDE8CB'],
    fmtDado: ['DATA', S, S, S, S, S, S, S, S, S],
    fmtTot: ['BRL', S, S, S, S, S, S, S, 'BRL', 'BRL'],
  },
  {
    frente: 'CAMINHÕES BARRAGEM 03',
    aba: 'CAMINHÕES_BARRAGEM 03',
    titulo:
      'CONTROLE DIÁRIO DE PRODUÇÃO                                      CAMINHÕES-BARRAGEM 03',
    pessoa: 'MOTORISTA',
    viagens: true,
    rodape: 'TOTAL HORAS E VIAGENS',
    garantia: 614.04,
    larguras: { B: 17.6, C: 33.6, D: 17.9, E: 18.86, F: 24.29, G: 22, H: 24, I: 96.7, J: 87.6 },
    fillCab: [E, E, E, E, E, E, 'FBE5D6', 'C6DEB5', E, E],
    fillDado: [S, S, S, S, S, S, 'FBE5D6', 'C6DEB5', S, S],
    fillTot: ['DDE8CB', S, S, S, S, S, 'DDE8CB', 'DDE8CB', 'DDE8CB', 'DDE8CB'],
    fmtDado: ['DATA', S, S, S, S, S, S, S, S, S],
    fmtTot: ['BRL', S, S, S, S, S, S, S, 'BRL', 'BRL'],
  },
  {
    frente: 'CAMINHÃO PIPA',
    aba: 'CAMINHÃO_PIPA',
    titulo: 'CONTROLE DIÁRIO DE PRODUÇÃO                                      CAMINHÃO PIPA',
    pessoa: 'MOTORISTA',
    viagens: false,
    rodape: 'TOTAL HORAS ',
    garantia: 250,
    larguras: { B: 21.14, C: 25.9, D: 16.7, E: 18.86, F: 24.29, G: 22, H: 72.4, I: 69.6 },
    fillCab: [E, E, E, E, E, E, E, E, E],
    fillDado: [S, S, S, S, S, S, 'FBE5D6', S, S],
    fillTot: ['DDE8CB', S, S, S, S, S, 'FBE5D6', 'DDE8CB', 'DDE8CB'],
    fmtDado: ['DATA', S, S, S, 'DURACAO', 'DURACAO', 'DURACAO', S, S],
    fmtTot: ['BRL', S, S, S, S, S, 'DURACAO', 'BRL', 'BRL'],
    duracao: true,
  },
  {
    frente: 'ROLO COMPACTADOR',
    aba: 'ROLO_COMPACTADOR',
    titulo: 'CONTROLE DIÁRIO DE PRODUÇÃO                                       ROLO COMPACTADOR',
    pessoa: 'OPERADOR',
    viagens: false,
    rodape: 'TOTAL HORAS',
    garantia: 250,
    larguras: { B: 21.14, C: 27.6, D: 12, E: 18.86, F: 24.29, G: 22, H: 70.4, I: 61.1 },
    fillCab: [E, E, E, E, E, E, E, E, E],
    fillDado: [S, S, S, S, S, S, 'FBE5D6', S, S],
    fillTot: ['DDE8CB', S, S, S, S, S, 'DDE8CB', 'DDE8CB', 'DDE8CB'],
    fmtDado: ['DATA', S, S, S, S, S, S, S, S],
    fmtTot: ['BRL', S, S, S, S, S, S, 'BRL', 'BRL'],
    periodoSemA: true,
  },
]

// ---------------------------------------------------------------- ZIP / CRC

const encoder = new TextEncoder()
const texto = (s: string): Uint8Array => encoder.encode(s)

const TABELA_CRC = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i++) crc = TABELA_CRC[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function montarZip(arquivos: { nome: string; dados: Uint8Array }[]): Uint8Array {
  const partes: Uint8Array[] = []
  const central: Uint8Array[] = []
  let deslocamento = 0

  for (const arq of arquivos) {
    const nome = texto(arq.nome)
    const crc = crc32(arq.dados)
    const tam = arq.dados.length
    const local = new Uint8Array(30 + nome.length)
    const lv = new DataView(local.buffer)
    lv.setUint32(0, 0x04034b50, true)
    lv.setUint16(4, 20, true)
    lv.setUint16(6, 0x0800, true)
    lv.setUint16(8, 0, true)
    lv.setUint32(14, crc, true)
    lv.setUint32(18, tam, true)
    lv.setUint32(22, tam, true)
    lv.setUint16(26, nome.length, true)
    local.set(nome, 30)
    partes.push(local, arq.dados)

    const cd = new Uint8Array(46 + nome.length)
    const dv = new DataView(cd.buffer)
    dv.setUint32(0, 0x02014b50, true)
    dv.setUint16(4, 20, true)
    dv.setUint16(6, 20, true)
    dv.setUint16(8, 0x0800, true)
    dv.setUint32(16, crc, true)
    dv.setUint32(20, tam, true)
    dv.setUint32(24, tam, true)
    dv.setUint16(28, nome.length, true)
    dv.setUint32(42, deslocamento, true)
    cd.set(nome, 46)
    central.push(cd)
    deslocamento += local.length + tam
  }

  const tamCentral = central.reduce((a, c) => a + c.length, 0)
  const fim = new Uint8Array(22)
  const fv = new DataView(fim.buffer)
  fv.setUint32(0, 0x06054b50, true)
  fv.setUint16(8, arquivos.length, true)
  fv.setUint16(10, arquivos.length, true)
  fv.setUint32(12, tamCentral, true)
  fv.setUint32(16, deslocamento, true)

  const total = partes.reduce((a, p) => a + p.length, 0) + tamCentral + fim.length
  const saida = new Uint8Array(total)
  let pos = 0
  for (const p of partes) {
    saida.set(p, pos)
    pos += p.length
  }
  for (const c of central) {
    saida.set(c, pos)
    pos += c.length
  }
  saida.set(fim, pos)
  return saida
}

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const CONTROLE = (() => {
  const codes: number[] = []
  for (let c = 0; c <= 8; c++) codes.push(c)
  codes.push(11, 12)
  for (let c = 14; c <= 31; c++) codes.push(c)
  return new RegExp(`[${codes.map((c) => String.fromCharCode(c)).join('')}]`, 'g')
})()

const limpar = (s: string): string => s.replace(CONTROLE, '').replace(/\r?\n/g, ' ').slice(0, 32000)

const letra = (i: number): string => {
  let s = ''
  let n = i
  while (n > 0) {
    const r = (n - 1) % 26
    s = String.fromCharCode(65 + r) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}
const ref = (col: number, row: number): string => `${letra(col)}${row}`

function serialExcel(iso: string): number {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number)
  if (!a || !m || !d) return 0
  return (Date.UTC(a, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000
}

const ddmm = (iso: string): string => {
  const [, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}`
}
const ddmmaaaa = (iso: string): string => {
  const [a, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${a}`
}

// ---------------------------------------------------------------- estilos

type Borda = 'CORPO' | 'TITULO' | 'TOT_ESQ' | 'TOT_MEIO' | 'TOT_DIR' | 'TOT_VALOR'

const BORDAS: Record<Borda, [string, string, string, string]> = {
  // top, bottom, left, right
  CORPO: ['medium', 'dotted', 'medium', 'dotted'],
  TITULO: ['medium', 'medium', 'medium', 'medium'],
  TOT_ESQ: ['dotted', 'none', 'none', 'medium'],
  TOT_MEIO: ['dotted', 'none', 'none', 'none'],
  TOT_DIR: ['dotted', 'none', 'none', 'medium'],
  TOT_VALOR: ['medium', 'none', 'medium', 'none'],
}

const NUMFMT = { DATA: 164, DURACAO: 165, BRL: 166, INTEIRO: 167, DUAS: 168 }

class RegistroEstilos {
  private fills: (string | null)[] = [null, null]
  private bordas: string[] = ['<border/>']
  private xfs: { fill: number; borda: number; numFmt: number; bold: boolean; red: boolean }[] = []
  private indice = new Map<string, number>()

  private fill(cor: string | null): number {
    if (!cor) return 0
    const i = this.fills.indexOf(cor, 2)
    if (i >= 0) return i
    this.fills.push(cor)
    return this.fills.length - 1
  }

  private borda(b: Borda): number {
    const [t, bo, l, r] = BORDAS[b]
    const lado = (s: string, n: string) =>
      s === 'none' ? `<${n}/>` : `<${n} style="${s}"><color auto="1"/></${n}>`
    const xml = `<border>${lado(l, 'left')}${lado(r, 'right')}${lado(t, 'top')}${lado(bo, 'bottom')}<diagonal/></border>`
    const i = this.bordas.indexOf(xml)
    if (i >= 0) return i
    this.bordas.push(xml)
    return this.bordas.length - 1
  }

  /** Índice de estilo para uma célula. */
  obter(cor: string | null, borda: Borda, fmt: Fmt, bold: boolean, red = false): number {
    const numFmt =
      fmt === 'DATA'
        ? NUMFMT.DATA
        : fmt === 'DURACAO'
          ? NUMFMT.DURACAO
          : fmt === 'BRL'
            ? NUMFMT.BRL
            : fmt === 'INTEIRO'
              ? NUMFMT.INTEIRO
              : fmt === 'DUAS'
                ? NUMFMT.DUAS
                : 0
    // A chave usa o numFmt RESOLVIDO: sem isso 'INTEIRO'/'DUAS' reaproveitam o
    // índice de outro formato e o Excel acaba mostrando General.
    const chave = `${cor || '-'}|${borda}|${numFmt}|${bold}|${red}`
    const achado = this.indice.get(chave)
    if (achado !== undefined) return achado
    this.xfs.push({ fill: this.fill(cor), borda: this.borda(borda), numFmt, bold, red })
    const idx = this.xfs.length
    this.indice.set(chave, idx)
    return idx
  }

  xml(): string {
    const numFmts = `<numFmt numFmtId="${NUMFMT.DATA}" formatCode="d-mmm"/><numFmt numFmtId="${NUMFMT.DURACAO}" formatCode="[h]:mm:ss"/><numFmt numFmtId="${NUMFMT.BRL}" formatCode="&quot;R$&quot;\\ #,##0.00;[Red]\\-&quot;R$&quot;\\ #,##0.00"/><numFmt numFmtId="${NUMFMT.INTEIRO}" formatCode="#,##0"/><numFmt numFmtId="${NUMFMT.DUAS}" formatCode="#,##0.00"/>`

    // a original grava a cor preta explicita (rgb FF000000), nao herda do tema
    const fonte = (bold: boolean, red: boolean) =>
      `<font>${bold ? '<b/>' : ''}<sz val="11"/><color rgb="${red ? 'FFFF0000' : 'FF000000'}"/><name val="Red Hat Display"/><family val="2"/></font>`

    const fillsXml = this.fills
      .map((c) =>
        c === null
          ? '<fill><patternFill patternType="none"/></fill>'
          : `<fill><patternFill patternType="solid"><fgColor rgb="FF${c}"/><bgColor indexed="64"/></patternFill></fill>`,
      )
      .join('')
      .replace(
        '<fill><patternFill patternType="none"/></fill><fill><patternFill patternType="none"/></fill>',
        '<fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>',
      )

    const xfsXml = this.xfs
      .map(
        (x) =>
          `<xf numFmtId="${x.numFmt}" fontId="${x.bold ? (x.red ? 2 : 1) : x.red ? 2 : 0}" fillId="${x.fill}" borderId="${x.borda}" xfId="0" applyFont="1" applyFill="1" applyBorder="1"${x.numFmt ? ' applyNumberFormat="1"' : ''} applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>`,
      )
      .join('')

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="5">${numFmts}</numFmts><fonts count="3">${fonte(false, false)}${fonte(true, false)}${fonte(true, true)}</fonts><fills count="${this.fills.length}">${fillsXml}</fills><borders count="${this.bordas.length}">${this.bordas.join('')}</borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${this.xfs.length + 1}"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>${xfsXml}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`
  }
}

// ---------------------------------------------------------------- células

type Celula =
  | { tipo: 'texto'; valor: string; estilo: number }
  | { tipo: 'numero'; valor: number; estilo: number }
  | { tipo: 'formula'; formula: string; cache: number; estilo: number }

const T = (valor: string, estilo: number): Celula => ({ tipo: 'texto', valor, estilo })
const Nc = (valor: number, estilo: number): Celula => ({ tipo: 'numero', valor, estilo })
const F = (formula: string, cache: number, estilo: number): Celula => ({
  tipo: 'formula',
  formula,
  cache,
  estilo,
})

function xmlCelula(col: number, row: number, c: Celula): string {
  const r = ref(col, row)
  if (c.tipo === 'texto') {
    const s = limpar(c.valor)
    if (s === '') return `<c r="${r}" s="${c.estilo}"/>`
    return `<c r="${r}" s="${c.estilo}" t="inlineStr"><is><t xml:space="preserve">${esc(s)}</t></is></c>`
  }
  if (c.tipo === 'numero') {
    const v = Number.isFinite(c.valor) ? c.valor : 0
    return `<c r="${r}" s="${c.estilo}"><v>${v}</v></c>`
  }
  const v = Number.isFinite(c.cache) ? c.cache : 0
  return `<c r="${r}" s="${c.estilo}"><f>${esc(c.formula)}</f><v>${v}</v></c>`
}

interface LinhaAba {
  row: number
  altura?: number
  celulas: { col: number; celula: Celula }[]
}

function xmlAba(spec: AbaSpec, linhas: LinhaAba[], merges: string[], ncol: number): string {
  const cols = Object.entries(spec.larguras)
    .map(([k, w]) => {
      const idx = k.charCodeAt(0) - 64
      return `<col min="${idx}" max="${idx}" width="${w}" customWidth="1"/>`
    })
    .join('')

  const rows = linhas
    .map((l) => {
      const altura = l.altura ? ` ht="${l.altura}" customHeight="1"` : ''
      const celulas = l.celulas
        .slice()
        .sort((a, b) => a.col - b.col)
        .map((x) => xmlCelula(x.col, l.row, x.celula))
        .join('')
      return `<row r="${l.row}"${altura}>${celulas}</row>`
    })
    .join('')

  const mc = merges.length
    ? `<mergeCells count="${merges.length}">${merges.map((m) => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>`
    : ''
  const ultima = linhas[linhas.length - 1]?.row ?? 4

  // Filtro e congelamento: quem recebe o arquivo precisa filtrar por equipamento,
  // data, operador, turno, viagens. O cabeçalho (linhas 1 a 3) fica congelado.
  const ultimaDados = ultima - 1
  const autoFiltro = ultimaDados >= 4 ? `<autoFilter ref="A3:${letra(ncol)}${ultimaDados}"/>` : ''
  const paneCongelado = `<sheetViews><sheetView workbookViewId="0"><pane ySplit="3" topLeftCell="A4" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A4" sqref="A4"/></sheetView></sheetViews>`

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${letra(ncol)}${ultima}"/>${paneCongelado}<sheetFormatPr defaultRowHeight="15" defaultColWidth="8.43"/><cols>${cols}</cols><sheetData>${rows}</sheetData>${autoFiltro}${mc}<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/></worksheet>`
}

/**
 * Aba TABELA (BASE e PAINEL): grava o filtro no próprio arquivo via
 * `_xlnm._FilterDatabase` (montado em workbook.xml), senão o Excel perde o
 * filtro ao reabrir.
 */
function xmlAbaTabela(
  linhas: LinhaAba[],
  ncol: number,
  merges: string[],
  congelarLinha: number,
  larguras: Record<number, number>,
  filtroRef?: string,
): string {
  const cols = Object.entries(larguras)
    .map(([k, w]) => `<col min="${k}" max="${k}" width="${w}" customWidth="1"/>`)
    .join('')

  const rows = linhas
    .map((l) => {
      const altura = l.altura ? ` ht="${l.altura}" customHeight="1"` : ''
      const celulas = l.celulas
        .slice()
        .sort((a, b) => a.col - b.col)
        .map((x) => xmlCelula(x.col, l.row, x.celula))
        .join('')
      return `<row r="${l.row}"${altura}>${celulas}</row>`
    })
    .join('')

  const mc = merges.length
    ? `<mergeCells count="${merges.length}">${merges.map((m) => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>`
    : ''
  const ultima = linhas[linhas.length - 1]?.row ?? 1

  const pane = congelarLinha
    ? `<pane ySplit="${congelarLinha}" topLeftCell="A${congelarLinha + 1}" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A${congelarLinha + 1}" sqref="A${congelarLinha + 1}"/>`
    : ''
  const autoFiltro = filtroRef ? `<autoFilter ref="${filtroRef}"/>` : ''

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><dimension ref="A1:${letra(ncol)}${ultima}"/><sheetViews><sheetView workbookViewId="0">${pane}</sheetView></sheetViews><sheetFormatPr defaultRowHeight="15" defaultColWidth="8.43"/><cols>${cols}</cols><sheetData>${rows}</sheetData>${autoFiltro}${mc}<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/></worksheet>`
}

interface LinhaBase {
  data: string
  frente: string
  equipamento: string
  categoria: string
  pessoa: string
  turno: string
  horimetro_inicial: number
  horimetro_final: number
  horas: number
  viagens: number
  servico: string
  observacao: string
}

/** Nome da aba base, usado nas fórmulas do painel. */
const ABA_BASE = 'BASE'

const DIAS_SEMANA = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']

function paraDataSegura(iso: string): Date | null {
  const [a, m, d] = (iso || '').slice(0, 10).split('-').map(Number)
  if (!a || !m || !d) return null
  return new Date(a, m - 1, d)
}

/**
 * Monta as duas abas de apoio ao filtro:
 *  - BASE: todos os lançamentos do período numa tabela única, plana, com filtro
 *    em todas as colunas. É a aba onde a pessoa filtra.
 *  - PAINEL: cartões do período, ranking por equipamento e a SOMA DO QUE ESTÁ
 *    FILTRADO via SUBTOTAL — essa muda quando a BASE é filtrada.
 */
function montarAbasFiltro(
  est: RegistroEstilos,
  lancamentos: AmgLancamento[],
  de: string,
  ate: string,
): { base: { nome: string; xml: string; filtro: string }; painel: { nome: string; xml: string } } {
  const nomesEquip = (l: AmgLancamento) => l.expand?.equipamento?.identificacao || ''
  // O lançamento não carrega a categoria; ela vem do cadastro do equipamento.
  const categoriaPorEquip = new Map<string, string>()
  for (const l of lancamentos) {
    const nome = nomesEquip(l)
    const cat = (l.expand?.equipamento as { categoria?: string })?.categoria
    if (nome && cat) categoriaPorEquip.set(nome, cat)
  }
  const nomesCat = (l: AmgLancamento) => categoriaPorEquip.get(nomesEquip(l)) || ''

  const linhas: LinhaBase[] = lancamentos
    .filter((l) => l.data >= de && l.data <= ate)
    .slice()
    .sort((a, b) => {
      if (a.data !== b.data) return a.data < b.data ? -1 : 1
      const ea = nomesEquip(a)
      const eb = nomesEquip(b)
      return ea < eb ? -1 : ea > eb ? 1 : 0
    })
    .map((l) => ({
      data: l.data,
      frente: nomeFrente(l),
      equipamento: nomesEquip(l),
      categoria: nomesCat(l),
      pessoa: l.expand?.operador?.nome || '',
      turno: l.turno || '',
      horimetro_inicial: Number(l.horimetro_inicial) || 0,
      horimetro_final: Number(l.horimetro_final) || 0,
      horas: Number(l.horas) || 0,
      viagens: Number(l.viagens) || 0,
      servico: l.servico || '',
      observacao: observacaoAmg(l),
    }))

  const CAB_BASE = [
    'DATA',
    'MÊS',
    'DIA DA SEMANA',
    'FRENTE',
    'EQUIPAMENTO',
    'CATEGORIA',
    'OPERADOR / MOTORISTA',
    'TURNO',
    'HORÍM INICIAL',
    'HORÍM FINAL',
    'TOTAL HORAS',
    'TOTAL VIAGENS',
    'DESCRIÇÃO DO SERVIÇO',
    'OBSERVAÇÃO',
  ]

  const stCabBase = est.obter('1E3A8A', 'TITULO', null, true, false)
  const stTexto = est.obter(null, 'CORPO', null, false, false)
  const stData = est.obter(null, 'CORPO', 'DATA', false, false)

  const linhasBase: LinhaAba[] = [
    {
      row: 1,
      altura: 26,
      celulas: CAB_BASE.map((h, i) => ({ col: i + 1, celula: T(h, stCabBase) })),
    },
  ]

  let r = 2
  for (const l of linhas) {
    const dt = paraDataSegura(l.data)
    const mes = dt ? `${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}` : ''
    const semana = dt ? DIAS_SEMANA[dt.getDay()] : ''

    linhasBase.push({
      row: r,
      altura: 15,
      celulas: [
        { col: 1, celula: Nc(serialExcel(l.data), stData) },
        { col: 2, celula: T(mes, stTexto) },
        { col: 3, celula: T(semana, stTexto) },
        { col: 4, celula: T(l.frente, stTexto) },
        { col: 5, celula: T(l.equipamento, est.obter(null, 'CORPO', null, true, false)) },
        { col: 6, celula: T(l.categoria, stTexto) },
        { col: 7, celula: T(l.pessoa, stTexto) },
        { col: 8, celula: T(l.turno, stTexto) },
        { col: 9, celula: Nc(l.horimetro_inicial, stTexto) },
        { col: 10, celula: Nc(l.horimetro_final, stTexto) },
        { col: 11, celula: Nc(l.horas, stTexto) },
        { col: 12, celula: Nc(l.viagens, stTexto) },
        { col: 13, celula: T(l.servico, stTexto) },
        { col: 14, celula: T(l.observacao, stTexto) },
      ],
    })
    r++
  }

  const ultimaBase = Math.max(r - 1, 2)
  const filtroBase = `A1:N${ultimaBase}`
  const baseXml = xmlAbaTabela(
    linhasBase,
    14,
    [],
    1,
    {
      1: 11,
      2: 9,
      3: 13,
      4: 28,
      5: 12,
      6: 18,
      7: 22,
      8: 12,
      9: 14,
      10: 14,
      11: 12,
      12: 13,
      13: 55,
      14: 45,
    },
    filtroBase,
  )

  // ---------------------------------------------------------------- PAINEL
  const porEquip = new Map<
    string,
    { equip: string; categoria: string; horas: number; viagens: number; dias: Set<string> }
  >()
  for (const l of linhas) {
    const chave = l.equipamento
    const item = porEquip.get(chave) || {
      equip: chave,
      categoria: l.categoria,
      horas: 0,
      viagens: 0,
      dias: new Set<string>(),
    }
    item.horas += l.horas
    item.viagens += l.viagens
    item.dias.add(l.data)
    porEquip.set(chave, item)
  }
  const ranking = [...porEquip.values()].sort((a, b) => b.horas - a.horas)
  const totalHoras = ranking.reduce((a, x) => a + x.horas, 0)
  const totalViagens = ranking.reduce((a, x) => a + x.viagens, 0)
  const dias = new Set(linhas.map((l) => l.data)).size

  const stTitulo = est.obter('1E3A8A', 'TITULO', null, true, false)
  const stRotulo = est.obter('EEEEEE', 'TITULO', null, true, false)
  const stValor = est.obter('DBEAFE', 'TITULO', null, true, false)
  const stNota = est.obter(null, 'CORPO', null, false, false)
  const stLinha = est.obter(null, 'CORPO', null, false, false)

  const linhaPainel: LinhaAba[] = []
  const mergesPainel: string[] = []

  const poe = (row: number, col: number, celula: Celula) => {
    const existente = linhaPainel.find((l) => l.row === row)
    if (existente) existente.celulas.push({ col, celula })
    else linhaPainel.push({ row, celulas: [{ col, celula }] })
  }

  poe(1, 1, T('PAINEL DE FILTROS — PRODUÇÃO BARRAGEM 03', stTitulo))
  poe(1, 4, T(`${ddmm(de)} á ${ddmmaaaa(ate)}`, stTitulo))
  mergesPainel.push('A1:C1', 'D1:F1')

  poe(2, 1, T('Use a aba BASE para filtrar; os números abaixo são o total do período.', stNota))
  mergesPainel.push('A2:F2')

  // Cartões: horas e média com 2 casas, contagens inteiras. Número de verdade
  // (não texto) para o Excel poder reaproveitar.
  const cartoes: [string, number][] = [
    ['TOTAL DE HORAS', totalHoras],
    ['TOTAL DE VIAGENS', totalViagens],
    ['DIAS COM PRODUÇÃO', dias],
    ['APONTAMENTOS', linhas.length],
    ['EQUIPAMENTOS', ranking.length],
    ['MÉDIA POR DIA', dias > 0 ? totalHoras / dias : 0],
  ]
  let col = 1
  for (const [rot, val] of cartoes) {
    poe(4, col, T(rot, stRotulo))
    // contagem inteira usa #,##0; horas e média usam #,##0.00
    const formatoCartao: Fmt = Number.isInteger(val) ? 'INTEIRO' : 'DUAS'
    poe(5, col, Nc(val, est.obter('DBEAFE', 'TITULO', formatoCartao, true, false)))
    col++
  }

  poe(7, 1, T('HORAS E VIAGENS POR EQUIPAMENTO (período inteiro)', stCabBase))
  mergesPainel.push('A7:G7')

  const cabRank = ['#', 'EQUIPAMENTO', 'CATEGORIA', 'HORAS', 'VIAGENS', 'H/DIA', '% DO TOTAL']
  cabRank.forEach((h, i) => poe(8, i + 1, T(h, stRotulo)))

  let rr = 9
  ranking.forEach((x, i) => {
    poe(rr, 1, Nc(i + 1, stLinha))
    poe(rr, 2, T(x.equip, stLinha))
    poe(rr, 3, T(x.categoria, stLinha))
    poe(rr, 4, Nc(x.horas, est.obter(null, 'CORPO', 'DUAS', false, false)))
    poe(rr, 5, Nc(x.viagens, est.obter(null, 'CORPO', 'INTEIRO', false, false)))
    poe(
      rr,
      6,
      Nc(
        x.dias.size > 0 ? x.horas / x.dias.size : 0,
        est.obter(null, 'CORPO', 'DUAS', false, false),
      ),
    )
    poe(
      rr,
      7,
      Nc(
        totalHoras > 0 ? (100 * x.horas) / totalHoras : 0,
        est.obter(null, 'CORPO', 'DUAS', false, false),
      ),
    )
    rr++
  })

  const instrucoes = [
    'COMO FILTRAR',
    '1. Vá para a aba BASE.',
    '2. Clique na setinha do cabeçalho da coluna que quer filtrar (EQUIPAMENTO, DATA, OPERADOR, TURNO, FRENTE…).',
    '3. Marque só o que quer ver e confirme. A tabela esconde o resto.',
    '4. A soma do que sobrou aparece no rodapé desta aba, em "SOMA DO QUE ESTÁ FILTRADO".',
    '5. Para tirar o filtro: setinha do cabeçalho → "Limpar filtro de …".',
    '',
    'Os cartões e o ranking acima NÃO mudam quando você filtra a BASE: eles são o total do período.',
  ]
  let linhaInstr = rr + 1
  instrucoes.forEach((txt, i) => {
    poe(linhaInstr + i, 1, T(txt, i === 0 ? stCabBase : stNota))
    if (i === 0) mergesPainel.push(`A${linhaInstr}:G${linhaInstr}`)
  })
  linhaInstr += instrucoes.length

  const linhasSub = linhaInstr + 1
  poe(linhasSub, 1, T('SOMA DO QUE ESTÁ FILTRADO (muda com o filtro):', stRotulo))
  mergesPainel.push(`A${linhasSub}:C${linhasSub}`)
  poe(linhasSub, 4, T('Horas', stRotulo))
  poe(linhasSub, 5, T('Viagens', stRotulo))
  poe(linhasSub, 6, T('Apontamentos', stRotulo))

  const r2 = linhasSub + 1
  // 109 e 103, não 9 e 3: a família 1xx do SUBTOTAL ignora as linhas ESCONDIDAS,
  // que é o que o filtro faz. Com 9/3 a soma continuaria dando o total do período
  // e o número não acompanharia o filtro (testado: 55 vs 46).
  poe(r2, 4, F(`SUBTOTAL(109,BASE!K2:K${ultimaBase})`, totalHoras, stValor))
  poe(r2, 5, F(`SUBTOTAL(109,BASE!L2:L${ultimaBase})`, totalViagens, stValor))
  poe(r2, 6, F(`SUBTOTAL(103,BASE!A2:A${ultimaBase})`, linhas.length, stValor))

  poe(
    r2 + 2,
    1,
    T(
      'SUBTOTAL(9,…) soma só as linhas visíveis — é o que faz o número acompanhar o filtro.',
      stNota,
    ),
  )
  mergesPainel.push(`A${r2 + 2}:G${r2 + 2}`)

  const painelXml = xmlAbaTabela(linhaPainel, 7, mergesPainel, 0, {
    1: 14,
    2: 26,
    3: 18,
    4: 16,
    5: 16,
    6: 22,
    7: 14,
  })

  return {
    base: { nome: ABA_BASE, xml: baseXml, filtro: filtroBase },
    painel: { nome: 'PAINEL', xml: painelXml },
  }
}

const AZUL_D = '1E3A8A'
const AZUL_M = '2563EB'
const CINZA_D = 'F1F5F9'
const AMARELO_D = 'FEF3C7'

interface ChartDef {
  tipo: 'line' | 'barH' | 'barV' | 'pie'
  titulo: string
  catsRef: string
  series: { titulo: string; nomeRef: string; dadosRef: string; cor: string }[]
  /** célula onde o gráfico é ancorado (canto superior esquerdo) */
  ancora: string
}

/** chartN.xml — gráfico nativo do Excel (sem imagem, redesenha ao mudar o dado). */
function xmlChart(c: ChartDef): string {
  const seriesXml = c.series
    .map(
      (s, i) => `
    <c:ser><c:idx val="${i}"/><c:order val="${i}"/>
      <c:tx><c:strRef><c:f>${esc(s.nomeRef)}</c:f><c:strCache><c:ptCount val="1"/><c:pt idx="0"><c:v>${esc(s.titulo)}</c:v></c:pt></c:strCache></c:strRef></c:tx>
      <c:spPr><a:solidFill><a:srgbClr val="${s.cor.toUpperCase()}"/></a:solidFill></c:spPr>
      <c:cat><c:strRef><c:f>${esc(c.catsRef)}</c:f></c:strRef></c:cat>
      <c:val><c:numRef><c:f>${esc(s.dadosRef)}</c:f></c:numRef></c:val>
      ${c.tipo === 'line' ? '<c:smooth val="0"/>' : ''}
    </c:ser>`,
    )
    .join('')

  let plot = ''
  if (c.tipo === 'line') {
    plot = `<c:lineChart><c:grouping val="standard"/><c:varyColors val="0"/>${seriesXml}<c:axId val="111111111"/><c:axId val="222222222"/></c:lineChart><c:catAx><c:axId val="111111111"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:crossAx val="222222222"/></c:catAx><c:valAx><c:axId val="222222222"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="l"/><c:majorGridlines/><c:crossAx val="111111111"/></c:valAx>`
  } else if (c.tipo === 'pie') {
    plot = `<c:pieChart><c:varyColors val="1"/>${seriesXml}<c:firstSliceAng val="0"/></c:pieChart>`
  } else {
    const barDir = c.tipo === 'barH' ? 'bar' : 'col'
    const posCat = c.tipo === 'barH' ? 'l' : 'b'
    const posVal = c.tipo === 'barH' ? 'b' : 'l'
    plot = `<c:barChart><c:barDir val="${barDir}"/><c:grouping val="clustered"/><c:varyColors val="0"/>${seriesXml}<c:gapWidth val="60"/><c:axId val="111111111"/><c:axId val="222222222"/></c:barChart><c:catAx><c:axId val="111111111"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="${posCat}"/><c:crossAx val="222222222"/></c:catAx><c:valAx><c:axId val="222222222"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="${posVal}"/><c:majorGridlines/><c:crossAx val="111111111"/></c:valAx>`
  }

  const legenda =
    c.tipo === 'pie' ? '<c:legend><c:legendPos val="r"/><c:overlay val="0"/></c:legend>' : ''

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><c:chart><c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr sz="1100" b="1"/><a:t>${esc(c.titulo)}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title><c:autoTitleDeleted val="0"/><c:plotArea><c:layout/>${plot}</c:plotArea>${legenda}<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart></c:chartSpace>`
}

/** drawingN.xml — posiciona os gráficos na aba. */
function xmlDrawing(charts: ChartDef[]): string {
  const ancoras = charts
    .map((c, i) => {
      const m = /^([A-Z]+)(\d+)$/.exec(c.ancora)
      let col = 0
      if (m) for (const ch of m[1]) col = col * 26 + (ch.charCodeAt(0) - 64)
      const c0 = Math.max(col - 1, 0)
      const r0 = m ? Number(m[2]) - 1 : 0
      return `<xdr:twoCellAnchor><xdr:from><xdr:col>${c0}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${r0}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:to><xdr:col>${c0 + 8}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${r0 + 20}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to><xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="${i + 2}" name="Gráfico ${i + 1}"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" r:id="rId${i + 1}"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor>`
    })
    .join('')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${ancoras}</xdr:wsDr>`
}

interface CtxDash {
  est: RegistroEstilos
  equipamentos: string[]
  frentes: string[]
  turnos: string[]
  dias: string[]
  de: string
  ate: string
  /** lançamentos do período, para calcular o VALOR em cache das fórmulas */
  linhas: AmgLancamento[]
}

/** Arredonda para 4 casas — usado no cache das fórmulas. */
const duas = (v: number) => Math.round(v * 10000) / 10000

/**
 * Monta a aba DASHBOARD: 2 seletores (equipamento e frente), período, 6 cartões,
 * 4 tabelas calculadas e 4 gráficos nativos.
 *
 * Todos os números são SUMPRODUCT com a MESMA condição de filtro:
 *   ((BASE!E=B6)+(B6="TODOS"))*((BASE!D=D6)+(D6="TODOS"))*(data>=F6)*(data<=H6)
 * O `+(B6="TODOS")` é o que faz "TODOS" não filtrar nada.
 *
 * O cache de cada célula é calculado aqui em TypeScript (função cacheDe): sem
 * isso quem abre o arquivo num programa que não recalcula vê zero em tudo.
 */
function montarAbaDashboard(ctx: CtxDash, ULT: number): { xml: string; charts: ChartDef[] } {
  const { est, equipamentos, frentes, turnos, dias, de, ate } = ctx
  const L: LinhaAba[] = []
  const merges: string[] = []

  const poe = (row: number, col: number, celula: Celula) => {
    const e = L.find((x) => x.row === row)
    if (e) e.celulas.push({ col, celula })
    else L.push({ row, celulas: [{ col, celula }] })
  }

  const stTit = est.obter(AZUL_D, 'TITULO', null, true, false)
  const stSub = est.obter(null, 'CORPO', null, false, false)
  const stRot = est.obter(CINZA_D, 'CORPO', null, true, false)
  const stCardAzul = est.obter('EFF6FF', 'CORPO', null, true, false)
  const stCardVerde = est.obter('ECFDF5', 'CORPO', null, true, false)
  const stSel = est.obter(AMARELO_D, 'CORPO', null, true, false)
  const stTexto = est.obter(null, 'CORPO', null, false, false)
  const stData = est.obter(null, 'CORPO', 'DATA', false, false)
  const stDuas = est.obter(null, 'CORPO', 'DUAS', false, false)
  const stInt = est.obter(null, 'CORPO', 'INTEIRO', false, false)
  const stSecao = est.obter(AZUL_D, 'CORPO', null, true, false)

  // título
  poe(1, 1, T('DASHBOARD DE PRODUÇÃO — BARRAGEM 03', stTit))
  merges.push('A1:H1')
  poe(2, 1, T('Escolha nos campos amarelos. Os números e os gráficos mudam na hora.', stSub))
  merges.push('A2:H2')

  // seletores: rótulo na linha 5, valor na 6 (B6 e D6 são os seletores)
  poe(5, 1, T('EQUIPAMENTO', stRot))
  poe(6, 2, T('TODOS', stSel))
  poe(5, 3, T('FRENTE', stRot))
  poe(6, 4, T('TODOS', stSel))
  poe(5, 5, T('DE', stRot))
  poe(6, 6, Nc(serialExcel(de), stData))
  poe(5, 7, T('ATÉ', stRot))
  poe(6, 8, Nc(serialExcel(ate), stData))

  // listas dos dropdowns em AA (27) e AB (28)
  poe(3, 27, T('TODOS', stTexto))
  equipamentos.forEach((e, i) => poe(4 + i, 27, T(e, stTexto)))
  poe(3, 28, T('TODOS', stTexto))
  frentes.forEach((f, i) => poe(4 + i, 28, T(f, stTexto)))

  // cartões
  const CART: [string, number][] = [
    ['HORAS', stCardAzul],
    ['VIAGENS', stCardAzul],
    ['DIAS', stCardVerde],
    ['APONTAMENTOS', stCardVerde],
    ['EQUIPAMENTOS', stCardVerde],
    ['MÉDIA H/DIA', stCardAzul],
  ]
  CART.forEach(([rot, st], i) => {
    poe(8, 11 + i, T(rot, stRot))
    poe(9, 11 + i, T('', st))
  })

  // tabela por dia
  const R_DIA = 12
  poe(R_DIA - 1, 2, T('PRODUÇÃO POR DIA', stSecao))
  ;['DIA', 'HORAS', 'VIAGENS'].forEach((h, j) => poe(R_DIA, 2 + j, T(h, stRot)))
  dias.forEach((d, i) => {
    const r = R_DIA + 1 + i
    poe(r, 2, Nc(serialExcel(d), stData))
    poe(r, 3, T('', stDuas))
    poe(r, 4, T('', stInt))
  })
  const FIM_DIA = R_DIA + dias.length

  // tabela por equipamento
  const R_EQ = FIM_DIA + 3
  poe(R_EQ - 1, 2, T('HORAS POR EQUIPAMENTO', stSecao))
  ;['EQUIPAMENTO', 'HORAS', 'VIAGENS'].forEach((h, j) => poe(R_EQ, 2 + j, T(h, stRot)))
  equipamentos.forEach((e, i) => {
    const r = R_EQ + 1 + i
    poe(r, 2, T(e, stTexto))
    poe(r, 3, T('', stDuas))
    poe(r, 4, T('', stInt))
  })
  const FIM_EQ = R_EQ + equipamentos.length

  // tabela por frente
  const R_FR = FIM_EQ + 3
  poe(R_FR - 1, 9, T('HORAS POR FRENTE', stSecao))
  ;['FRENTE', 'HORAS', 'VIAGENS'].forEach((h, j) => poe(R_FR, 9 + j, T(h, stRot)))
  frentes.forEach((f, i) => {
    const r = R_FR + 1 + i
    poe(r, 9, T(f, stTexto))
    poe(r, 10, T('', stDuas))
    poe(r, 11, T('', stInt))
  })
  const FIM_FR = R_FR + frentes.length

  // tabela por turno
  const R_TU = FIM_FR + 3
  poe(R_TU - 1, 9, T('HORAS POR TURNO', stSecao))
  ;['TURNO', 'HORAS'].forEach((h, j) => poe(R_TU, 9 + j, T(h, stRot)))
  turnos.forEach((t, i) => {
    const r = R_TU + 1 + i
    poe(r, 9, T(t, stTexto))
    poe(r, 10, T('', stDuas))
  })

  // ---- fórmulas
  const FLT =
    `((BASE!$E$2:$E$${ULT}=$B$6)+($B$6="TODOS"))` +
    `*((BASE!$D$2:$D$${ULT}=$D$6)+($D$6="TODOS"))` +
    `*(BASE!$A$2:$A$${ULT}>=$F$6)*(BASE!$A$2:$A$${ULT}<=$H$6)`

  const formulas: Record<string, string> = {
    K9: `SUMPRODUCT(${FLT}*BASE!$K$2:$K$${ULT})`,
    L9: `SUMPRODUCT(${FLT}*BASE!$L$2:$L$${ULT})`,
    M9: `COUNTIF(C${R_DIA + 1}:C${FIM_DIA},">0")`,
    N9: `SUMPRODUCT(${FLT})`,
    O9: `IF($B$6<>"TODOS",1,COUNTIF(C${R_EQ + 1}:C${FIM_EQ},">0"))`,
    P9: 'IF($M$9=0,0,$K$9/$M$9)',
  }
  dias.forEach((_d, i) => {
    const r = R_DIA + 1 + i
    formulas[`C${r}`] = `SUMPRODUCT(${FLT}*(BASE!$A$2:$A$${ULT}=$B${r})*BASE!$K$2:$K$${ULT})`
    formulas[`D${r}`] = `SUMPRODUCT(${FLT}*(BASE!$A$2:$A$${ULT}=$B${r})*BASE!$L$2:$L$${ULT})`
  })
  equipamentos.forEach((_e, i) => {
    const r = R_EQ + 1 + i
    formulas[`C${r}`] = `SUMPRODUCT(${FLT}*(BASE!$E$2:$E$${ULT}=$B${r})*BASE!$K$2:$K$${ULT})`
    formulas[`D${r}`] = `SUMPRODUCT(${FLT}*(BASE!$E$2:$E$${ULT}=$B${r})*BASE!$L$2:$L$${ULT})`
  })
  frentes.forEach((_f, i) => {
    const r = R_FR + 1 + i
    formulas[`J${r}`] = `SUMPRODUCT(${FLT}*(BASE!$D$2:$D$${ULT}=$I${r})*BASE!$K$2:$K$${ULT})`
    formulas[`K${r}`] = `SUMPRODUCT(${FLT}*(BASE!$D$2:$D$${ULT}=$I${r})*BASE!$L$2:$L$${ULT})`
  })
  turnos.forEach((_t, i) => {
    const r = R_TU + 1 + i
    formulas[`J${r}`] = `SUMPRODUCT(${FLT}*(BASE!$H$2:$H$${ULT}=$I${r})*BASE!$K$2:$K$${ULT})`
  })

  /** Valor inicial de cada célula (espelha a fórmula em TypeScript). */
  function cacheDe(ref: string): number {
    const noPeriodo = (l: AmgLancamento) => (l.data || '') >= de && (l.data || '') <= ate
    const dentro = ctx.linhas.filter(noPeriodo)
    const horasTot = dentro.reduce((a, l) => a + (Number(l.horas) || 0), 0)
    const viagTot = dentro.reduce((a, l) => a + (Number(l.viagens) || 0), 0)
    const diasTot = new Set(dentro.map((l) => l.data)).size

    if (ref === 'K9') return duas(horasTot)
    if (ref === 'L9') return viagTot
    if (ref === 'M9') return diasTot
    if (ref === 'N9') return dentro.length
    if (ref === 'O9')
      return new Set(dentro.map((l) => l.expand?.equipamento?.identificacao || '')).size
    if (ref === 'P9') return diasTot > 0 ? duas(horasTot / diasTot) : 0

    const m = /^([CDJK])(\d+)$/.exec(ref)
    if (!m) return 0
    const col = m[1]
    const row = Number(m[2])

    if (row > R_DIA && row <= FIM_DIA) {
      const dia = dias[row - R_DIA - 1]
      const doDia = dentro.filter((l) => l.data === dia)
      if (col === 'C') return duas(doDia.reduce((a, l) => a + (Number(l.horas) || 0), 0))
      if (col === 'D') return doDia.reduce((a, l) => a + (Number(l.viagens) || 0), 0)
    }
    if (row > R_EQ && row <= FIM_EQ) {
      const eq = equipamentos[row - R_EQ - 1]
      const doEq = dentro.filter((l) => (l.expand?.equipamento?.identificacao || '') === eq)
      if (col === 'C') return duas(doEq.reduce((a, l) => a + (Number(l.horas) || 0), 0))
      if (col === 'D') return doEq.reduce((a, l) => a + (Number(l.viagens) || 0), 0)
    }
    if (row > R_FR && row <= FIM_FR) {
      const fr = frentes[row - R_FR - 1]
      const daFr = dentro.filter((l) => nomeFrente(l) === fr)
      if (col === 'J') return duas(daFr.reduce((a, l) => a + (Number(l.horas) || 0), 0))
      if (col === 'K') return daFr.reduce((a, l) => a + (Number(l.viagens) || 0), 0)
    }
    if (row > R_TU && row <= R_TU + turnos.length) {
      const tu = turnos[row - R_TU - 1]
      const doTu = dentro.filter((l) => (l.turno || '') === tu)
      if (col === 'J') return duas(doTu.reduce((a, l) => a + (Number(l.horas) || 0), 0))
    }
    return 0
  }

  // injeta as fórmulas (mantendo o estilo que já estava na célula)
  for (const [ref, fx] of Object.entries(formulas)) {
    const m = /^([A-Z]+)(\d+)$/.exec(ref)
    if (!m) continue
    let col = 0
    for (const ch of m[1]) col = col * 26 + (ch.charCodeAt(0) - 64)
    const linha = L.find((l) => l.row === Number(m[2]))
    if (!linha) continue
    const cel = linha.celulas.find((c) => c.col === col)
    if (!cel) continue
    const estilo = (cel.celula as { estilo: number }).estilo
    cel.celula = { tipo: 'formula', formula: fx, cache: cacheDe(ref), estilo }
  }

  const larguras = {
    1: 2,
    2: 12,
    3: 11,
    4: 26,
    5: 9,
    6: 12,
    7: 8,
    8: 12,
    9: 24,
    10: 12,
    11: 15,
    12: 13,
    13: 11,
    14: 15,
    15: 15,
    16: 14,
    17: 3,
    18: 3,
    27: 14,
    28: 26,
  }
  let xml = xmlAbaTabela(L, 28, merges, 3, larguras)

  const charts: ChartDef[] = [
    {
      tipo: 'line',
      titulo: 'Horas por dia',
      catsRef: `'DASHBOARD'!$B$${R_DIA + 1}:$B$${FIM_DIA}`,
      series: [
        {
          titulo: 'Horas',
          nomeRef: `'DASHBOARD'!$C$${R_DIA}`,
          dadosRef: `'DASHBOARD'!$C$${R_DIA + 1}:$C$${FIM_DIA}`,
          cor: AZUL_M,
        },
      ],
      ancora: 'R4',
    },
    {
      tipo: 'barH',
      titulo: 'Horas por equipamento',
      catsRef: `'DASHBOARD'!$B$${R_EQ + 1}:$B$${FIM_EQ}`,
      series: [
        {
          titulo: 'Horas',
          nomeRef: `'DASHBOARD'!$C$${R_EQ}`,
          dadosRef: `'DASHBOARD'!$C$${R_EQ + 1}:$C$${FIM_EQ}`,
          cor: AZUL_M,
        },
      ],
      ancora: 'R24',
    },
    {
      tipo: 'pie',
      titulo: 'Horas por frente',
      catsRef: `'DASHBOARD'!$I$${R_FR + 1}:$I$${FIM_FR}`,
      series: [
        {
          titulo: 'Horas',
          nomeRef: `'DASHBOARD'!$J$${R_FR}`,
          dadosRef: `'DASHBOARD'!$J$${R_FR + 1}:$J$${FIM_FR}`,
          cor: '70AD47',
        },
      ],
      ancora: 'R48',
    },
    {
      tipo: 'barV',
      titulo: 'Horas por turno',
      catsRef: `'DASHBOARD'!$I$${R_TU + 1}:$I$${R_TU + turnos.length}`,
      series: [
        {
          titulo: 'Horas',
          nomeRef: `'DASHBOARD'!$J$${R_TU}`,
          dadosRef: `'DASHBOARD'!$J$${R_TU + 1}:$J$${R_TU + turnos.length}`,
          cor: 'ED7D31',
        },
      ],
      ancora: 'R72',
    },
  ]

  // validação de dados (dropdowns) + referência ao desenho
  const dv =
    `<dataValidations count="2">` +
    `<dataValidation type="list" allowBlank="0" showInputMessage="1" showErrorMessage="1" sqref="B6"><formula1>'DASHBOARD'!$AA$3:$AA$${3 + equipamentos.length}</formula1></dataValidation>` +
    `<dataValidation type="list" allowBlank="0" showInputMessage="1" showErrorMessage="1" sqref="D6"><formula1>'DASHBOARD'!$AB$3:$AB$${3 + frentes.length}</formula1></dataValidation>` +
    `</dataValidations>`

  xml = xml.replace('<pageMargins', dv + '<drawing r:id="rId1"/><pageMargins')

  return { xml, charts }
}

// ---------------------------------------------------------------- montagem

export interface AmgLancamento {
  data: string
  frente: string
  equipamento: string
  operador: string
  turno: string
  horimetro_inicial: number
  horimetro_final: number
  horas: number
  viagens?: number
  servico: string
  refeicao?: boolean
  abastecimento?: boolean
  manutencao?: boolean
  dds?: boolean
  apr?: boolean
  checklist?: boolean
  disposicao?: boolean
  observacao?: string
  expand?: {
    equipamento?: { identificacao?: string; categoria?: string }
    operador?: { nome?: string }
    frente?: { nome?: string }
    substituindo?: { identificacao?: string }
  }
}

const nomeFrente = (l: AmgLancamento): string => l.expand?.frente?.nome || ''
const chaveFrente = (s: string): string => s.toUpperCase().replace(/\s+/g, ' ').trim()

/** Texto da coluna OBSERVAÇÃO: os toggles viram o texto que existia na planilha. */
export function observacaoAmg(l: AmgLancamento): string {
  const p: string[] = []
  if (l.refeicao) p.push('REFEIÇÃO')
  if (l.abastecimento) p.push('ABASTECIMENTO')
  if (l.manutencao) p.push('MANUTENÇÃO')
  if (l.dds) p.push('DDS')
  if (l.apr) p.push('APR')
  if (l.checklist) p.push('CHECK LIST')
  if (l.disposicao) p.push('À DISPOSIÇÃO')
  const sub = l.expand?.substituindo?.identificacao
  if (sub) p.push(`SUBSTITUÍNDO ${sub}`)
  if (l.observacao && l.observacao.trim()) p.push(l.observacao.trim())
  return p.join('/')
}

export interface ResultadoAmg {
  bytes: Uint8Array
  abas: { aba: string; linhas: number; horas: number; viagens: number }[]
  totalHoras: number
  totalViagens: number
  lancamentos: number
  semAba: number
}

/**
 * Gera o arquivo no padrão AMG: as 9 abas originais (inclusive as vazias, com
 * cabeçalho e total zero) mais BASE e PAINEL para filtro dentro do Excel.
 */
export function gerarAmg(
  lancamentos: AmgLancamento[],
  de: string,
  ate: string,
  garantias: Record<string, number> = {},
): ResultadoAmg {
  const est = new RegistroEstilos()
  const porAba = new Map<string, AmgLancamento[]>()
  for (const a of ABAS_AMG) porAba.set(a.aba, [])

  const mapa = new Map<string, AbaSpec>()
  for (const a of ABAS_AMG) mapa.set(chaveFrente(a.frente), a)

  let semAba = 0
  for (const l of lancamentos) {
    if (!l.data || l.data < de || l.data > ate) continue
    const spec = mapa.get(chaveFrente(nomeFrente(l)))
    if (!spec) {
      semAba++
      continue
    }
    porAba.get(spec.aba)!.push(l)
  }

  const resumo: ResultadoAmg['abas'] = []
  const sheets: { nome: string; xml: string }[] = []

  for (const spec of ABAS_AMG) {
    const linhas = (porAba.get(spec.aba) || []).slice().sort((a, b) => {
      if (a.data !== b.data) return a.data < b.data ? -1 : 1
      if ((a.turno || '') !== (b.turno || '')) return (a.turno || '') < (b.turno || '') ? -1 : 1
      const ea = a.expand?.equipamento?.identificacao || ''
      const eb = b.expand?.equipamento?.identificacao || ''
      return ea < eb ? -1 : ea > eb ? 1 : 0
    })

    const ncol = spec.viagens ? 10 : 9
    const periodo = spec.periodoSemA
      ? `PRODUÇÃO BARRAGEM 03-PERÍODO ${ddmm(de)} ${ddmmaaaa(ate)}`
      : `PRODUÇÃO BARRAGEM 03-PERÍODO ${ddmm(de)} á ${ddmmaaaa(ate)}`

    const cab: string[] = [
      'DATA',
      'EQUIPAMENTO',
      spec.pessoa,
      'TURNO',
      'HORÍM INICIAL',
      spec.cabecalhoHf || 'HORÍM FINAL',
      'TOTAL HORAS',
    ]
    if (spec.viagens) cab.push('TOTAL VIAGENS')
    cab.push('DESCRIÇÃO DO SERVIÇO', 'OBSERVAÇÃO')

    const stTitulo = est.obter('DEE6EF', 'TITULO', null, true, false)
    const stRotulo = est.obter('EEEEEE', 'TITULO', null, true, false)
    const stGarantia = est.obter(null, 'CORPO', null, true, true)

    const linhasAba: LinhaAba[] = [
      {
        row: 1,
        altura: 39.75,
        celulas: [
          { col: 1, celula: T(periodo, stTitulo) },
          { col: 5, celula: T(spec.titulo, stRotulo) },
        ],
      },
      {
        row: 2,
        altura: 30.75,
        celulas: [
          { col: 5, celula: T('GARANTIA DE HORAS MENSAIS', stRotulo) },
          { col: 7, celula: Nc(garantias[chaveFrente(spec.frente)] ?? spec.garantia, stGarantia) },
        ],
      },
      {
        row: 3,
        altura: 35.25,
        celulas: cab.map((h, i) => ({
          col: i + 1,
          celula: T(h, est.obter(spec.fillCab[i] ?? null, 'CORPO', null, true, false)),
        })),
      },
    ]

    let totalHoras = 0
    let totalViagens = 0
    let r = 4

    for (const l of linhas) {
      const horas = Number(l.horas) || Number(l.horimetro_final) - Number(l.horimetro_inicial) || 0
      totalHoras += horas
      totalViagens += Number(l.viagens) || 0

      const hIni = spec.duracao
        ? (Number(l.horimetro_inicial) || 0) / 24
        : Number(l.horimetro_inicial) || 0
      const hFim = spec.duracao
        ? (Number(l.horimetro_final) || 0) / 24
        : Number(l.horimetro_final) || 0
      const hTot = spec.duracao ? horas / 24 : horas

      const st = (c: number) =>
        est.obter(spec.fillDado[c - 1] ?? null, 'CORPO', spec.fmtDado[c - 1] ?? null, false, false)

      const cel: { col: number; celula: Celula }[] = [
        { col: 1, celula: Nc(serialExcel(l.data), st(1)) },
        { col: 2, celula: T(l.expand?.equipamento?.identificacao || '', st(2)) },
        { col: 3, celula: T(l.expand?.operador?.nome || '', st(3)) },
        { col: 4, celula: T(l.turno || '', st(4)) },
        { col: 5, celula: Nc(hIni, st(5)) },
        { col: 6, celula: Nc(hFim, st(6)) },
        { col: 7, celula: F(`SUM(F${r}-E${r})`, hTot, st(7)) },
      ]

      if (spec.viagens) {
        cel.push({ col: 8, celula: Nc(Number(l.viagens) || 0, st(8)) })
        cel.push({ col: 9, celula: T(l.servico || '', st(9)) })
        cel.push({ col: 10, celula: T(observacaoAmg(l), st(10)) })
      } else {
        cel.push({ col: 8, celula: T(l.servico || '', st(8)) })
        cel.push({ col: 9, celula: T(observacaoAmg(l), st(9)) })
      }

      linhasAba.push({ row: r, altura: 15.75, celulas: cel })
      r++
    }

    const ultima = r
    const stTotal = (c: number) => {
      const borda: Borda =
        c === 1 ? 'TOT_ESQ' : c === 6 ? 'TOT_DIR' : c === 7 || c >= 8 ? 'TOT_VALOR' : 'TOT_MEIO'
      return est.obter(spec.fillTot[c - 1] ?? null, borda, spec.fmtTot[c - 1] ?? null, true, false)
    }

    const linhaTotal: { col: number; celula: Celula }[] = [
      { col: 1, celula: T(spec.rodape, stTotal(1)) },
      {
        col: 7,
        celula: F(
          `SUM(G4:G${ultima - 1})`,
          spec.duracao ? totalHoras / 24 : totalHoras,
          stTotal(7),
        ),
      },
    ]
    if (spec.viagens)
      linhaTotal.push({ col: 8, celula: F(`SUM(H4:H${ultima - 1})`, totalViagens, stTotal(8)) })
    linhasAba.push({ row: ultima, celulas: linhaTotal })

    const merges = ['A1:D2', 'E1:G1', 'E2:F2']
    if (spec.viagens) merges.push('H2:I2')
    merges.push(`A${ultima}:F${ultima}`)

    sheets.push({ nome: spec.aba, xml: xmlAba(spec, linhasAba, merges, ncol) })
    resumo.push({
      aba: spec.aba,
      linhas: linhas.length,
      horas: Number(totalHoras.toFixed(4)),
      viagens: totalViagens,
    })
  }

  // ---- ABAS DE APOIO REMOVIDAS (pedido do Rafael em 24/11)
  // O arquivo passa a ter SOMENTE as 9 abas originais da AMG, uma por frente.
  // Saíram:
  //   · BASE      — a lista plana que alimentava as fórmulas
  //   · PAINEL    — cartões com soma do que estava filtrado
  //   · DASHBOARD — seletores, 4 tabelas e 4 gráficos nativos
  //
  // Consequência assumida: o arquivo deixa de ter filtro interativo e gráfico.
  // Ele volta a ser o que a AMG usa: uma aba por frente, com os totais no pé.
  // As funções montarAbasFiltro/montarAbaDashboard continuam no módulo, sem uso,
  // para que voltar atrás seja só restaurar estas linhas.
  const apoio = null as null | { base: { nome: string; xml: string; filtro: string } }
  const dash = null as null | { xml: string; charts: unknown[] }

  // ---- pacote
  const arquivos: { nome: string; dados: Uint8Array }[] = []
  const overrides = sheets
    .map(
      (_s, i) =>
        `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    )
    .join('')

  // sem DASHBOARD não há desenho nem gráfico para declarar no pacote
  const overridesDesenho = ''

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${overrides}${overridesDesenho}<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`

  // Sem a aba BASE não existe nome reservado de filtro para declarar.
  const nomeReservado = ''

  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets
    .map((s, i) => `<sheet name="${esc(s.nome)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
    .join('')}</sheets>${nomeReservado}<calcPr calcId="0" fullCalcOnLoad="1"/></workbook>`

  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets
    .map(
      (_s, i) =>
        `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
    )
    .join(
      '',
    )}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`

  arquivos.push({ nome: '[Content_Types].xml', dados: texto(contentTypes) })
  arquivos.push({ nome: '_rels/.rels', dados: texto(rels) })
  arquivos.push({ nome: 'xl/workbook.xml', dados: texto(workbook) })
  arquivos.push({ nome: 'xl/_rels/workbook.xml.rels', dados: texto(workbookRels) })
  arquivos.push({ nome: 'xl/styles.xml', dados: texto(est.xml()) })
  sheets.forEach((s, i) => {
    arquivos.push({ nome: `xl/worksheets/sheet${i + 1}.xml`, dados: texto(s.xml) })
  })

  // Sem DASHBOARD: nenhum desenho, gráfico ou vínculo de desenho é gravado.
  // O pacote fica só com as 9 abas + estilos, que é o que a AMG espera.

  return {
    bytes: montarZip(arquivos),
    abas: resumo,
    totalHoras: Number(resumo.reduce((a, x) => a + x.horas, 0).toFixed(4)),
    totalViagens: resumo.reduce((a, x) => a + x.viagens, 0),
    lancamentos: resumo.reduce((a, x) => a + x.linhas, 0),
    semAba,
  }
}

/** Gera e baixa o arquivo no padrão AMG. */
export function baixarAmg(
  lancamentos: AmgLancamento[],
  de: string,
  ate: string,
  garantias: Record<string, number> = {},
): ResultadoAmg {
  const res = gerarAmg(lancamentos, de, ate, garantias)
  const blob = new Blob([res.bytes as unknown as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.style.display = 'none'
  link.setAttribute('href', url)
  link.setAttribute('download', `producao_AMG_${de}_a_${ate}.xlsx`)
  document.body.appendChild(link)
  link.click()
  window.setTimeout(() => {
    if (link.parentNode) link.parentNode.removeChild(link)
    URL.revokeObjectURL(url)
  }, 1500)
  return res
}

/**
 * Exportação no PADRÃO AMG — engenharia reversa da planilha original.
 *
 * Referência: `Controle_de_Produc_a_o_Barragem_03_setembro-outubro_de_2026.xlsx`.
 *
 * Cada detalhe abaixo foi LIDO da original célula por célula, não inventado:
 *  - 9 abas, nesta ordem, com os nomes exatos (inclusive o espaço em "CAMINHÕES _DESAGUAMENTO");
 *  - linha 1: título mesclado A1:D2 e o rótulo "CONTROLE DIÁRIO DE PRODUÇÃO ... <FRENTE>"
 *    em E1:G1 — a sequência de espaços no meio faz parte do arquivo;
 *  - linha 2: "GARANTIA DE HORAS MENSAIS" em E2:F2 e o valor em G2, em vermelho;
 *  - linha 3: cabeçalho, MOTORISTA nas abas de caminhão e OPERADOR nas demais;
 *  - dados da linha 4 em diante, altura 15,75;
 *  - última linha mesclada A:F com "TOTAL HORAS" (ou "TOTAL HORAS E VIAGENS") e as
 *    fórmulas =SUM(G4:Gn) e =SUM(H4:Hn);
 *  - fonte Red Hat Display 11; preenchimentos EEEEEE (cabeçalho), E7E6E6 (horímetro inicial/final
 *    na aba 24 HORAS), FBE5D6 (coluna TOTAL HORAS), C6DEB5 (TOTAL VIAGENS), DDE8CB (linha de
 *    total), DEE6EF (título);
 *  - bordas medium/dotted do corpo, diferentes na linha de total;
 *  - alturas 39,75 / 30,75 / 35,25 e a largura de cada coluna;
 *  - a aba do PIPA guarda horímetro como DURAÇÃO ([h]:mm:ss).
 *
 * Defeitos da própria original reproduzidos de propósito, para o arquivo sair igual:
 *  - "HORIM FINAL" sem acento na aba ESCAVADEIRA_CARREGAMENTO;
 *  - "TOTAL HORAS " com espaço no fim em três abas;
 *  - "PERÍODO 20/09 19/10/2026" sem o "á" na aba ROLO_COMPACTADOR;
 *  - formato de moeda (R$) aplicado em algumas colunas de texto — invisível no texto,
 *    mas é o que está no arquivo.
 *
 * Nada é estimado nem corrigido: o dado do Controle de Produção vai como está e o
 * total é a soma das linhas.
 */

// ---------------------------------------------------------------- especificação

type Fmt = null | 'DATA' | 'DURACAO' | 'BRL'

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

// ---------------------------------------------------------------- registro de estilos

/**
 * Estilos montados em tempo de execução, iguais aos da original. Cada combinação
 * (preenchimento, borda, formato, negrito, vermelho) vira um índice de cellXfs,
 * que é o que o arquivo XML referencia em cada célula.
 */
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

const NUMFMT = { DATA: 164, DURACAO: 165, BRL: 166 }

class RegistroEstilos {
  private fills: (string | null)[] = [null, null] // 0 = none, 1 = gray125
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
    const chave = `${cor || '-'}|${borda}|${fmt || '-'}|${bold}|${red}`
    const achado = this.indice.get(chave)
    if (achado !== undefined) return achado
    const numFmt =
      fmt === 'DATA'
        ? NUMFMT.DATA
        : fmt === 'DURACAO'
          ? NUMFMT.DURACAO
          : fmt === 'BRL'
            ? NUMFMT.BRL
            : 0
    this.xfs.push({ fill: this.fill(cor), borda: this.borda(borda), numFmt, bold, red })
    const idx = this.xfs.length
    this.indice.set(chave, idx)
    return idx
  }

  xml(): string {
    const numFmts = `<numFmt numFmtId="${NUMFMT.DATA}" formatCode="d-mmm"/><numFmt numFmtId="${NUMFMT.DURACAO}" formatCode="[h]:mm:ss"/><numFmt numFmtId="${NUMFMT.BRL}" formatCode="&quot;R$&quot;\\ #,##0.00;[Red]\\-&quot;R$&quot;\\ #,##0.00"/>`

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
      // o segundo fill é o gray125 que o Excel espera
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
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="3">${numFmts}</numFmts><fonts count="3">${fonte(false, false)}${fonte(true, false)}${fonte(true, true)}</fonts><fills count="${this.fills.length}">${fillsXml}</fills><borders count="${this.bordas.length}">${this.bordas.join('')}</borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${this.xfs.length + 1}"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>${xfsXml}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`
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

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${letra(ncol)}${ultima}"/><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="15" defaultColWidth="8.43"/><cols>${cols}</cols><sheetData>${rows}</sheetData>${mc}<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/></worksheet>`
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
    equipamento?: { identificacao?: string }
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
 * Gera o arquivo no padrão AMG: sempre as 9 abas, na ordem da original, inclusive as
 * que não têm lançamento no período (vazias, com cabeçalho e total zero).
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

      const st = (col: number) =>
        est.obter(
          spec.fillDado[col - 1] ?? null,
          'CORPO',
          spec.fmtDado[col - 1] ?? null,
          false,
          false,
        )

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
    const stTotal = (col: number) => {
      const borda: Borda =
        col === 1
          ? 'TOT_ESQ'
          : col === 6
            ? 'TOT_DIR'
            : col === 7 || col >= 8
              ? 'TOT_VALOR'
              : 'TOT_MEIO'
      return est.obter(
        spec.fillTot[col - 1] ?? null,
        borda,
        spec.fmtTot[col - 1] ?? null,
        true,
        false,
      )
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

  // ---- pacote
  const arquivos: { nome: string; dados: Uint8Array }[] = []
  const overrides = sheets
    .map(
      (_s, i) =>
        `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    )
    .join('')

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${overrides}<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`

  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets
    .map((s, i) => `<sheet name="${esc(s.nome)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
    .join('')}</sheets><calcPr calcId="0" fullCalcOnLoad="1"/></workbook>`

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

/**
 * Gerador mínimo de .xlsx (Excel) sem nenhuma biblioteca externa.
 *
 * O projeto não traz o pacote `xlsx` nas dependências e o package.json não pode
 * ser alterado, então o arquivo é montado à mão: um ZIP (método "stored", sem
 * compressão) contendo as partes XML que o Excel/Google Sheets leem.
 */

export interface Planilha {
  nome: string
  linhas: (string | number | null)[][]
}

const TABELA_CRC = (() => {
  const tabela = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    tabela[n] = c >>> 0
  }
  return tabela
})()

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    crc = TABELA_CRC[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

const texto = (s: string): Uint8Array => new TextEncoder().encode(s)

/** Monta um ZIP sem compressão com os arquivos informados. */
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
    lv.setUint16(6, 0x0800, true) // nomes em UTF-8
    lv.setUint16(8, 0, true) // sem compressão
    lv.setUint16(10, 0, true)
    lv.setUint16(12, 0, true)
    lv.setUint32(14, crc, true)
    lv.setUint32(18, tam, true)
    lv.setUint32(22, tam, true)
    lv.setUint16(26, nome.length, true)
    lv.setUint16(28, 0, true)
    local.set(nome, 30)

    partes.push(local, arq.dados)

    const cd = new Uint8Array(46 + nome.length)
    const dv = new DataView(cd.buffer)
    dv.setUint32(0, 0x02014b50, true)
    dv.setUint16(4, 20, true)
    dv.setUint16(6, 20, true)
    dv.setUint16(8, 0x0800, true)
    dv.setUint16(10, 0, true)
    dv.setUint16(12, 0, true)
    dv.setUint16(14, 0, true)
    dv.setUint32(16, crc, true)
    dv.setUint32(20, tam, true)
    dv.setUint32(24, tam, true)
    dv.setUint16(28, nome.length, true)
    dv.setUint16(30, 0, true)
    dv.setUint16(32, 0, true)
    dv.setUint16(34, 0, true)
    dv.setUint16(36, 0, true)
    dv.setUint32(38, 0, true)
    dv.setUint32(42, deslocamento, true)
    cd.set(nome, 46)
    central.push(cd)

    deslocamento += local.length + tam
  }

  const tamCentral = central.reduce((acc, c) => acc + c.length, 0)
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

function colunaLetra(indice: number): string {
  let s = ''
  let n = indice + 1
  while (n > 0) {
    const resto = (n - 1) % 26
    s = String.fromCharCode(65 + resto) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

const escapar = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Remove os caracteres de controle que o Excel recusa no XML. A classe é
// montada a partir de char codes para não deixar controles literais no código.
const CONTROLE = (() => {
  const codes: number[] = []
  for (let c = 0; c <= 8; c++) codes.push(c)
  codes.push(11, 12)
  for (let c = 14; c <= 31; c++) codes.push(c)
  return new RegExp(`[${codes.map((c) => String.fromCharCode(c)).join('')}]`, 'g')
})()

const colar = (s: string): string => s.replace(CONTROLE, '').replace(/\r?\n/g, ' ').slice(0, 32000)

function xmlPlanilha(linhas: (string | number | null)[][]): string {
  const corpo = linhas
    .map((linha, r) => {
      const celulas = linha
        .map((valor, c) => {
          const ref = `${colunaLetra(c)}${r + 1}`
          if (valor === null || valor === '') return ''
          if (typeof valor === 'number' && Number.isFinite(valor)) {
            return `<c r="${ref}"><v>${valor}</v></c>`
          }
          return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapar(
            colar(String(valor)),
          )}</t></is></c>`
        })
        .join('')
      return `<row r="${r + 1}">${celulas}</row>`
    })
    .join('')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${corpo}</sheetData></worksheet>`
}

const NOME_ABA_VALIDO = (nome: string): string =>
  (nome.replace(/[\\/?*[\]:]/g, ' ').trim() || 'Planilha').slice(0, 31)

/** Gera e baixa o arquivo .xlsx com uma ou mais abas. */
export function baixarXlsx(arquivo: string, planilhas: Planilha[]): void {
  const abas = planilhas.length > 0 ? planilhas : [{ nome: 'Planilha', linhas: [] }]

  const arquivos: { nome: string; dados: Uint8Array }[] = []

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${abas
    .map(
      (_a, i) =>
        `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    )
    .join(
      '',
    )}<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`

  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${abas
    .map(
      (a, i) =>
        `<sheet name="${escapar(NOME_ABA_VALIDO(a.nome))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`,
    )
    .join('')}</sheets></workbook>`

  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${abas
    .map(
      (_a, i) =>
        `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
    )
    .join(
      '',
    )}<Relationship Id="rId${abas.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`

  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="1"><fill><patternFill patternType="none"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs></styleSheet>`

  arquivos.push({ nome: '[Content_Types].xml', dados: texto(contentTypes) })
  arquivos.push({ nome: '_rels/.rels', dados: texto(rels) })
  arquivos.push({ nome: 'xl/workbook.xml', dados: texto(workbook) })
  arquivos.push({ nome: 'xl/_rels/workbook.xml.rels', dados: texto(workbookRels) })
  arquivos.push({ nome: 'xl/styles.xml', dados: texto(styles) })
  abas.forEach((aba, i) => {
    arquivos.push({
      nome: `xl/worksheets/sheet${i + 1}.xml`,
      dados: texto(xmlPlanilha(aba.linhas)),
    })
  })

  const zip = montarZip(arquivos)
  const blob = new Blob([zip as unknown as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  baixarBlob(blob, arquivo.endsWith('.xlsx') ? arquivo : `${arquivo}.xlsx`)
}

export function baixarBlob(blob: Blob, arquivo: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.style.display = 'none'
  link.setAttribute('href', url)
  link.setAttribute('download', arquivo)
  document.body.appendChild(link)
  link.click()
  window.setTimeout(() => {
    if (link.parentNode) link.parentNode.removeChild(link)
    URL.revokeObjectURL(url)
  }, 1500)
}

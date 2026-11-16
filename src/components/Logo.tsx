// Marca da Silveira — padrão aprovado em 15/11/2026 (skill `identidade-silveira`).
//
// A arte é BRANCA: ela só aparece sobre o azul-marinho da marca. As três regras:
//   1. fundo ESCURO (#1b1547) — arte branca em fundo claro carrega e desaparece;
//   2. tamanho GRANDE — 118 px no login, 40 px no topo, 44 px no menu do celular;
//   3. base64 em linhas de 76 caracteres unidas com '+' — linha única é cortada
//      na transferência e a imagem chega corrompida.
//
// A arte é a mesma do Painel Silveira (77872) e do Abastecimento (78101):
// 150x197, branca com amarelo. Copiada de lá, não regerada.
const B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAJYAAADFCAYAAAC2Gwu7AAAE+ElEQVR42u3dXW7bMBBF4TLw' +
  'cxaS7iWLTfeShaQLUF8aoAjcmLJJiTPzndcAsUQe3RlRf+0HpvLx9rL972/Pr+8t634/mfpz' +
  'pOr5O7EAYoFYIBZALBALxAIAAAAwkdMvgm7btvT1stZam7lve///jP85gwuZEF4sQtXhiVQI' +
  'KxapiEUqrC8WqYgFxBBLWtXmssJGrLCghwCJtSetSEUsSQXNO4gFYgHEQjaxeptya13Emga5' +
  'crLEAukZclnqCCpWa62tnEZft41omvdpoinLQcSKmAIEC5JYUUsMuQKUQnIRi1yI17y3v0gt' +
  'yw2HpNfqk7dt2yZxA4i1SpmURklK4WrsKc0kJJYTC2KRi1gAsaQWsUAsgFh3YEmBWCCWtKrI' +
  'hVB9QjljJJZ0WkGsEd8lvvbRbJNX+8DRYymDxCIVsUhFLJCKWKSKclZoCAhFLELlEuvaOpXJ' +
  'OmcMVhjXnnUyPRY07yAWiAUQC8QCsQBigVgoi0s62E3P6r/EglIIYoFYALHgrDDnU8aVnpf8' +
  'bl6+ex71+fW9PZksUu3d31sPOX+8vWxKIaZUkmW+/hXhIwJU07wju1gZUktaSSxUEityalVO' +
  'q0f2XWJhylnh5ciN7D0CIn7GrdIDuj0PMEssZTB+855pXatqWumxpFUtsbKllrSSWNLqQE77' +
  '2HiGM8Rb2xVF0L3j6zVG0qpeKYzea+mtJJa0qiZW1KNeWiVKrNlpIq2SieWaILHSppa0Gs9l' +
  'lRSousqeNQHDnRWOFlBaJRdr9SNXb5U8sUamjLQqIlbUa4JIklgj0kZaFRNrtXSQVsUS65HU' +
  'kVZFxVolJaRV0cS6J32kVXGxzk4LafUYKd7z3nv7cvQ3DN564dk9X8ItWQqlRr9USuFJvVbG' +
  '96ESS2oRK2NqSStimXBixUgtaUUsE0+sGKmVKa1WWqPqIdQCaZR748mV+ElovRWx9FrEygVJ' +
  'iUUIYpETgcUiBrFISSyCgFhkJBZRqpHinvfIcp19iWrW2Hm5bXFmiU0s6LFALBALIBaIBWIB' +
  'g7kYgnlkvSpw69mD1lojFqYcNEoh9FggFogFEAvEQmWmLjf4+vzxfI75zP3seR/qpZJU321X' +
  'trtQjxBMKeycnIhvshn1Ul9iEWy3NGfsD7GSJdgqchErWa+4yr4QK6BcEZKUWIkmc6X9IFYw' +
  'uaIIfur9WGevHVV9UW7v19Ik1gNifxJBxpG/PXs/lMJF0jNbuhIrkFyRZCVWgPTY83urHBzE' +
  'klreNiMd+w6KvQfHDLmIlUyqVZKXWJiSWsRKmFYrpBaxnIxMSS1iJU0ryw2YLtUZqUWsA069' +
  'K44Bse4Y0FnlZ2YJPLpkEqtQUh1ZEi+E2jeAEdNq6eb94+1l63kCNoJI/1LtLPD3r5+HpHgb' +
  'Icvz63u7Z6OuDdLKJenr9u4du2vj9KhYqx7seqyTJzSjVMQ6cEL/l1ZZIdaJjXLWtCLWHVKN' +
  'SqvMUllumCxUxRJIrB1lb3RCZE8rYnX0UY9M5Oi0irSOeGpjukpjPHtbRqVVpO1K27yv8EBB' +
  'FKn2/l7PfqQ+K1xRriqkX25YRa4IF5lHplaJdSzJdXxpL7NAeqZckW6JGfX7pVbez5Ar4n1W' +
  'I0piuUs6yqLmPbxcke8KfTS1yl6EllwSK6RcGe5hfyS1yt82M0OuTA9G3CuX+7GUxVil8NZk' +
  'RW5WR8kV5e2B92znHxeySTX2pYVXAAAAAElFTkSuQmCC'

export const LOGO_DATA_URI = `data:image/png;base64,${B64}`

/** Azul-marinho da marca — o fundo onde a arte branca aparece. */
export const AZUL_MARCA = '#1b1547'
/** Amarelo da marca — botão principal, item ativo, avatar. */
export const AMARELO_MARCA = '#f5b32c'

/** Logo pura. Use SEMPRE sobre fundo escuro. */
export function LogoImagem({
  altura = 92,
  className = '',
}: {
  altura?: number
  className?: string
}) {
  return (
    <img
      src={LOGO_DATA_URI}
      alt="Silveira Transportes"
      style={{ height: altura }}
      className={`w-auto select-none object-contain ${className}`}
      draggable={false}
    />
  )
}

export default LogoImagem

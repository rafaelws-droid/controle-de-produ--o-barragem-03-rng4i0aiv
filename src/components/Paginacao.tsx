import { Button } from '@/components/ui/button'

/**
 * Controles de paginação — o mesmo desenho em Lançamentos, Relatórios e
 * Horímetros, para o usuário não aprender uma coisa diferente em cada tela.
 *
 * "Mostrando 1–10 de 1698 · 170 páginas" + « Anterior 1/170 Próxima »
 */
export function Paginacao({
  pagina,
  totalPaginas,
  totalItens,
  porPagina,
  onMudar,
}: {
  pagina: number
  totalPaginas: number
  totalItens: number
  porPagina: number
  onMudar: (pagina: number) => void
}) {
  const primeiro = totalItens === 0 ? 0 : (pagina - 1) * porPagina + 1
  const ultimo = Math.min(pagina * porPagina, totalItens)

  return (
    <div className="flex flex-col items-center justify-between gap-2 px-1 sm:flex-row">
      <p className="text-[11.5px] text-slate-500">
        Mostrando{' '}
        <b className="text-slate-800">
          {primeiro}–{ultimo}
        </b>{' '}
        de <b className="text-slate-800">{totalItens}</b> ·{' '}
        <b className="text-slate-800">{totalPaginas}</b> página(s)
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onMudar(1)}
          disabled={pagina === 1}
          className="h-9 px-2"
          title="Primeira página"
        >
          «
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onMudar(Math.max(1, pagina - 1))}
          disabled={pagina === 1}
          className="h-9 px-3 font-semibold"
        >
          Anterior
        </Button>
        <span className="min-w-[70px] text-center text-[12px] font-bold text-slate-700">
          {pagina} / {totalPaginas}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onMudar(Math.min(totalPaginas, pagina + 1))}
          disabled={pagina === totalPaginas}
          className="h-9 px-3 font-semibold"
        >
          Próxima
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onMudar(totalPaginas)}
          disabled={pagina === totalPaginas}
          className="h-9 px-2"
          title="Última página"
        >
          »
        </Button>
      </div>
    </div>
  )
}

/** Quantidade por página — o Rafael pediu 10 em todas as telas. */
export const POR_PAGINA = 10

export default Paginacao

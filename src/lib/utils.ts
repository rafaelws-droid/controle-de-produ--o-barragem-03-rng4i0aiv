/* General utility functions (exposes cn) */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges multiple class names into a single string
 * @param inputs - Array of class names
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Data de HOJE no formato AAAA-MM-DD, no fuso do BRASIL.
 *
 * POR QUE NÃO `new Date().toISOString().split('T')[0]`:
 * o toISOString converte para UTC. Das 21h à meia-noite no Brasil já é o dia
 * seguinte em UTC, então o formulário abria com a data de AMANHÃ — e o
 * lançamento ia para o dia errado. Bug encontrado em 17/11 às 21:51.
 */
export function hojeISO(): string {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

/** Soma dias a uma data AAAA-MM-DD, devolvendo AAAA-MM-DD. */
export function somarDiasISO(iso: string, dias: number): string {
  const [a, m, d] = iso.split('-').map(Number)
  const dt = new Date(a, m - 1, d)
  dt.setDate(dt.getDate() + dias)
  const ano = dt.getFullYear()
  const mes = String(dt.getMonth() + 1).padStart(2, '0')
  const dia = String(dt.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

/** Primeiro dia do mês de hoje, em AAAA-MM-DD. */
export function inicioMesISO(): string {
  const agora = new Date()
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-01`
}

/** Primeiro dia do mês anterior, em AAAA-MM-DD. */
export function inicioMesPassadoISO(): string {
  const agora = new Date()
  const d = new Date(agora.getFullYear(), agora.getMonth() - 1, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

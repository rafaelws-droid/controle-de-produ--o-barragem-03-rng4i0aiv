/**
 * Select nativo no lugar do Radix Select.
 * O Radix Select tem bug conhecido com React 19 (loop de re-render ao abrir /
 * selecionar) que congela a aba no desktop. O <select> nativo é imune e se
 * comporta igual no computador e no celular.
 */
import { ChevronDown } from 'lucide-react'

export interface OpcaoSelect {
  value: string
  label: string
}

interface Props {
  id?: string
  value: string
  onChange: (valor: string) => void
  placeholder: string
  options: OpcaoSelect[]
  disabled?: boolean
  className?: string
}

export function SelectNativo({
  id,
  value,
  onChange,
  placeholder,
  options,
  disabled,
  className,
}: Props) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`flex h-10 w-full appearance-none items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 pr-9 text-sm text-slate-900 shadow-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/40 disabled:cursor-not-allowed disabled:opacity-50 ${
          className || ''
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  )
}

export default SelectNativo

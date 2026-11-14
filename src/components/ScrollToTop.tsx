import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Volta ao topo ao trocar de tela — sem isso a tela nova abre fora de vista. */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

export default ScrollToTop

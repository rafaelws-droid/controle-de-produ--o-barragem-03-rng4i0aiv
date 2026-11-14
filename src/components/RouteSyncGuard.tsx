import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Rede de segurança do roteamento (mesma correção usada no app de Horas Extras):
 * se o clique no menu mudar a URL mas o React continuar exibindo a tela
 * anterior, a página se recarrega sozinha no endereço certo — o que o usuário
 * faria com o botão de recarregar do navegador, só que automático.
 */
export function RouteSyncGuard() {
  const { pathname, search } = useLocation()
  const rotaRenderizada = useRef(pathname + search)

  rotaRenderizada.current = pathname + search

  useEffect(() => {
    let timer: number | undefined

    const agendarChecagem = () => {
      if (timer) window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        const urlAtual = window.location.pathname + window.location.search
        if (urlAtual !== rotaRenderizada.current) {
          window.location.replace(window.location.href)
        }
      }, 300)
    }

    const pushStateOriginal = window.history.pushState.bind(window.history)
    const replaceStateOriginal = window.history.replaceState.bind(window.history)

    window.history.pushState = (data, unused, url) => {
      pushStateOriginal(data, unused, url)
      agendarChecagem()
    }
    window.history.replaceState = (data, unused, url) => {
      replaceStateOriginal(data, unused, url)
      agendarChecagem()
    }
    window.addEventListener('popstate', agendarChecagem)

    return () => {
      if (timer) window.clearTimeout(timer)
      window.history.pushState = pushStateOriginal
      window.history.replaceState = replaceStateOriginal
      window.removeEventListener('popstate', agendarChecagem)
    }
  }, [])

  return null
}

export default RouteSyncGuard

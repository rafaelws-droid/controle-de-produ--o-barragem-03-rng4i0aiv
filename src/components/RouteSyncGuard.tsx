import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Recuperação de tela em branco.
 *
 * No celular, quando o aplicativo é minimizado/trocado, o navegador congela a
 * aba. Ao voltar, o React pode ficar sem renderizar nada — e ai a tela fica
 * branca ate o usuario atualizar na mao.
 *
 * Aqui o app VIGIA a si mesmo: se a raiz estiver renderizada e o conteudo
 * aparecer vazio por alguns instantes, ele se recupera sozinho (uma vez por
 * rota, para nunca entrar em ciclo de recarga).
 */
export function RouteSyncGuard() {
  const { pathname } = useLocation()
  const [jaRecuperou, setJaRecuperou] = useState(false)
  const tentativas = useRef(0)

  // Nova rota: permite uma nova recuperacao.
  useEffect(() => {
    tentativas.current = 0
    setJaRecuperou(false)
  }, [pathname])

  useEffect(() => {
    if (jaRecuperou) return

    const verificar = () => {
      const raiz = document.getElementById('root')
      if (!raiz) return
      // "Em branco" = raiz existe mas nao tem conteudo visivel.
      const semConteudo = raiz.children.length === 0 || raiz.textContent?.trim().length === 0
      if (!semConteudo) return
      if (tentativas.current >= 1) return
      tentativas.current += 1
      setJaRecuperou(true)
      window.location.reload()
    }

    // Volta do segundo plano (celular): checa imediatamente e de novo logo depois.
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') {
        verificar()
        window.setTimeout(verificar, 1200)
      }
    }

    const aoFicarVisivel = () => aoVoltar()

    document.addEventListener('visibilitychange', aoFicarVisivel)
    window.addEventListener('pageshow', aoVoltar)
    window.addEventListener('online', aoVoltar)

    const inicial = window.setTimeout(verificar, 2500)

    return () => {
      document.removeEventListener('visibilitychange', aoFicarVisivel)
      window.removeEventListener('pageshow', aoVoltar)
      window.removeEventListener('online', aoVoltar)
      window.clearTimeout(inicial)
    }
  }, [pathname, jaRecuperou])

  return null
}

export default RouteSyncGuard

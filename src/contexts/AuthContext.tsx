import React, { createContext, useContext, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { setupAuthErrorHandling } from '@/lib/pocketbase/authGuard'
import type { Papel } from '@/types'

interface Usuario {
  id: string
  email: string
  name: string
  avatar?: string
  papel?: Papel
}

interface AuthContextType {
  user: Usuario | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  ehGestor: boolean
  login: (email: string, senha: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

type ModeloAuth = {
  id?: string
  email?: string
  name?: string
  avatar?: string
  papel?: Papel
} | null

function doModelo(m: ModeloAuth): Usuario | null {
  if (!m || !m.id) return null
  return {
    id: m.id,
    email: m.email || '',
    name: m.name || m.email || '',
    avatar: m.avatar,
    papel: m.papel,
  }
}

/** Usuário salvo no aparelho, lido sem falar com o servidor. */
function usuarioDoStore(): Usuario | null {
  return doModelo(pb.authStore.model as ModeloAuth)
}

/**
 * Valida a sessão no servidor em SEGUNDO PLANO.
 *
 * Regra que evita a tela branca: falha de rede, lentidão ou tempo esgotado
 * NUNCA derruba a sessão do usuário. Só uma resposta real do servidor dizendo
 * que a sessão não vale mais (401/403) encerra o login — e isso é feito pelo
 * authGuard, não aqui.
 */
async function validarSessaoEmSegundoPlano(): Promise<void> {
  if (!pb.authStore.isValid) return
  try {
    await pb.collection('users').authRefresh()
  } catch (err) {
    const status = (err as { status?: number })?.status
    if (status === 401 || status === 403) return
    console.warn('Validação de sessão adiada (rede):', err)
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(() =>
    pb.authStore.isValid ? usuarioDoStore() : null,
  )
  const [token, setToken] = useState<string | null>(pb.authStore.token)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setupAuthErrorHandling()

    void validarSessaoEmSegundoPlano()

    const unsubscribe = pb.authStore.onChange((novoToken, model) => {
      setToken(novoToken)
      setUser(doModelo(model as ModeloAuth))
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const login = async (email: string, senha: string) => {
    await pb.collection('users').authWithPassword(email.trim(), senha)
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        ehGestor: user?.papel === 'GESTOR',
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth precisa estar dentro do AuthProvider')
  return context
}

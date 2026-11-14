import React, { createContext, useContext, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { setupAuthErrorHandling } from '@/lib/pocketbase/authGuard'

interface Usuario {
  id: string
  email: string
  name: string
  avatar?: string
}

interface AuthContextType {
  user: Usuario | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, senha: string) => Promise<void>
  signup: (nome: string, email: string, senha: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/** Usuário salvo no aparelho, lido sem falar com o servidor. */
function usuarioDoStore(): Usuario | null {
  const m = pb.authStore.model as {
    id?: string
    email?: string
    name?: string
    avatar?: string
  } | null
  if (!m || !m.id) return null
  return {
    id: m.id,
    email: m.email || '',
    name: m.name || m.email || '',
    avatar: m.avatar,
  }
}

/**
 * Valida a sessão no servidor em SEGUNDO PLANO.
 *
 * Regra que evita a tela branca: falha de rede, lentidão ou tempo esgotado
 * NUNCA derruba a sessão do usuário. Só uma resposta real do servidor dizendo
 * que a sessão não vale mais (401) encerra o login — e isso é feito pelo
 * authGuard, não aqui.
 */
async function validarSessaoEmSegundoPlano(): Promise<void> {
  if (!pb.authStore.isValid) return
  try {
    await pb.collection('users').authRefresh()
  } catch (err) {
    const status = (err as { status?: number })?.status
    if (status === 401 || status === 403) {
      // Sessão realmente inválida: o authGuard já limpou o token.
      return
    }
    // Sem rede, servidor lento ou instável: mantém o acesso e tenta depois.
    console.warn('Validação de sessão adiada (rede):', err)
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  /**
   * Estado inicial lido do aparelho, sem esperar a rede: quem já entrou vê a
   * tela na hora. A validação acontece depois, sem travar nada.
   */
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
      if (model) {
        setUser({
          id: model.id,
          email: model.email,
          name: model.name || model.email,
          avatar: model.avatar,
        })
      } else {
        setUser(null)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const login = async (email: string, senha: string) => {
    await pb.collection('users').authWithPassword(email.trim(), senha)
  }

  const signup = async (nome: string, email: string, senha: string) => {
    await pb.collection('users').create({
      name: nome.trim(),
      email: email.trim(),
      password: senha,
      passwordConfirm: senha,
    })
    await pb.collection('users').authWithPassword(email.trim(), senha)
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!user && !!token, isLoading, login, signup, logout }}
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

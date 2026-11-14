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

/** Valida a sessão no servidor com teto de tempo — nunca trava o carregamento. */
async function validarSessao(): Promise<void> {
  if (!pb.authStore.isValid) return
  await Promise.race([
    pb.collection('users').authRefresh(),
    new Promise((_r, reject) =>
      setTimeout(() => reject(new Error('timeout_validacao_sessao')), 8000),
    ),
  ]).catch((err) => {
    console.warn('Validação de sessão falhou:', err)
    pb.authStore.clear()
  })
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null)
  const [token, setToken] = useState<string | null>(pb.authStore.token)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setupAuthErrorHandling()

    void validarSessao().finally(() => setIsLoading(false))

    // Se a validação não terminar por qualquer motivo, destrava em 10s.
    const t = setTimeout(() => setIsLoading(false), 10000)

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
      clearTimeout(t)
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

import pb from './client'

/**
 * Tratamento global de sessão: qualquer 401 limpa o token guardado, o
 * AuthContext reage e o ProtectedRoute leva o usuário ao login — em vez de a
 * tela ficar presa em "carregando".
 */
export function setupAuthErrorHandling(): void {
  pb.afterSend = (response, data) => {
    if (response.status === 401) {
      pb.authStore.clear()
    }
    return data
  }
}

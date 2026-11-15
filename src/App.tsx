import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import Login from './pages/Login'
import EsqueciSenha from './pages/EsqueciSenha'
import RedefinirSenha from './pages/RedefinirSenha'
import TrocarSenha from './pages/TrocarSenha'
import RelatorioHorimetros from './pages/RelatorioHorimetros'
import Horimetro from './pages/Horimetro'
import NovoLancamento from './pages/NovoLancamento'
import Lancamentos from './pages/Lancamentos'
import Relatorio from './pages/Relatorio'
import Equipamentos from './pages/Equipamentos'
import Operadores from './pages/Operadores'
import Usuarios from './pages/Usuarios'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ScrollToTop } from './components/ScrollToTop'
import { RouteSyncGuard } from './components/RouteSyncGuard'

const App = () => (
  <BrowserRouter>
    <RouteSyncGuard />
    <ScrollToTop />
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />
          <Route path="/reset-password" element={<RedefinirSenha />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route
              path="/"
              element={
                <ErrorBoundary key="index">
                  <Index />
                </ErrorBoundary>
              }
            />
            <Route
              path="/novo"
              element={
                <ErrorBoundary key="novo">
                  <NovoLancamento />
                </ErrorBoundary>
              }
            />
            <Route
              path="/lancamento/:id"
              element={
                <ErrorBoundary key="editar">
                  <NovoLancamento />
                </ErrorBoundary>
              }
            />
            <Route
              path="/lancamentos"
              element={
                <ErrorBoundary key="lancamentos">
                  <Lancamentos />
                </ErrorBoundary>
              }
            />
            <Route
              path="/relatorio"
              element={
                <ErrorBoundary key="relatorio">
                  <Relatorio />
                </ErrorBoundary>
              }
            />
            <Route
              path="/equipamentos"
              element={
                <ErrorBoundary key="equipamentos">
                  <Equipamentos />
                </ErrorBoundary>
              }
            />
            <Route
              path="/operadores"
              element={
                <ErrorBoundary key="operadores">
                  <Operadores />
                </ErrorBoundary>
              }
            />
            <Route
              path="/horimetros"
              element={
                <ErrorBoundary key="horimetros">
                  <RelatorioHorimetros />
                </ErrorBoundary>
              }
            />
            <Route
              path="/horimetro"
              element={
                <ErrorBoundary key="horimetro">
                  <Horimetro />
                </ErrorBoundary>
              }
            />
            <Route
              path="/trocar-senha"
              element={
                <ErrorBoundary key="trocarsenha">
                  <TrocarSenha />
                </ErrorBoundary>
              }
            />
            <Route
              path="/usuarios"
              element={
                <ErrorBoundary key="usuarios">
                  <Usuarios />
                </ErrorBoundary>
              }
            />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App

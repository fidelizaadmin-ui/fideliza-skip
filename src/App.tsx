/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ScrollToTop } from './components/ScrollToTop'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/AdminDashboard'
import MerchantDashboard from './pages/MerchantDashboard'
import CustomerDashboard from './pages/CustomerDashboard'
import PlansPage from './pages/PlansPage'
import HowItWorksPage from './pages/HowItWorksPage'
import ConfirmVerificationPage from './pages/ConfirmVerificationPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import PaymentReturnPage from './pages/PaymentReturnPage'
import StorePage from './pages/StorePage'
import { Navigate, useParams } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SystemSettingsProvider } from './contexts/SystemSettingsContext'
import { CompleteDocumentDialog } from './components/CompleteDocumentDialog'
import { ErrorBoundary } from './components/ErrorBoundary'

// ONLY IMPORT AND RENDER WORKING PAGES, NEVER ADD PLACEHOLDER COMPONENTS OR PAGES IN THIS FILE
// AVOID REMOVING ANY CONTEXT PROVIDERS FROM THIS FILE (e.g. TooltipProvider, Toaster, Sonner)

/**
 * Compatibilidade: endereços antigos no formato /loja/:slug continuam
 * funcionando e redirecionam para o novo formato /:slug (sem "/loja").
 */
const LegacyStoreRedirect = () => {
  const { slug } = useParams<{ slug: string }>()
  return <Navigate to={`/${slug ?? ''}`} replace />
}

const App = () => (
  <BrowserRouter>
    <ScrollToTop />
    <SystemSettingsProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <CompleteDocumentDialog />
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Register />} />
              <Route path="/confirmar-email" element={<ConfirmVerificationPage />} />
              <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
              <Route
                path="/admin"
                element={
                  <ErrorBoundary title="Erro no painel do administrador">
                    <AdminDashboard />
                  </ErrorBoundary>
                }
              />
              <Route path="/lojista" element={<MerchantDashboard />} />
              <Route path="/cliente" element={<CustomerDashboard />} />
              <Route path="/planos" element={<PlansPage />} />
              <Route path="/como-funciona" element={<HowItWorksPage />} />
              <Route path="/pagamento-retorno" element={<PaymentReturnPage />} />
              {/* Compatibilidade com links antigos: /loja/slug → /slug */}
              <Route path="/loja/:slug" element={<LegacyStoreRedirect />} />
              {/* Rota dinâmica do link individual: vem por último para que
                  as rotas fixas do sistema tenham precedência sobre /:slug */}
              <Route path="/:slug" element={<StorePage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </SystemSettingsProvider>
  </BrowserRouter>
)

export default App

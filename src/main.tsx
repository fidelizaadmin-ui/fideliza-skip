/* Main entry point for the application - renders the root React component */
import { createRoot } from 'react-dom/client'
// Instala o authStore com dupla persistência (local/session) ANTES de qualquer uso do pb.
import '@/lib/sessionPersistence'
import App from './App.tsx'
import './main.css'

// @skip-protected: Do not remove. Required for React rendering.
createRoot(document.getElementById('root')!).render(<App />)

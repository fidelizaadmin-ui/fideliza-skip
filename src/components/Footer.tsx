import React from 'react'
import { Link } from 'react-router-dom'
import { Heart, Store, ShieldCheck, CreditCard } from 'lucide-react'
import { Logo } from '@/components/Logo'

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800 bg-[#0A192F] text-slate-300 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-3 md:col-span-1">
            <Logo variant="horizontal" theme="dark" size="sm" showTagline={false} />
            <p className="text-xs text-slate-400 leading-relaxed pt-1">
              A plataforma completa de fidelidade que conecta lojas e clientes através de selos
              digitais, pontos e cashback em tempo real.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-3">
              Para Clientes
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Descobrir Lojas
                </Link>
              </li>
              <li>
                <Link to="/cliente" className="hover:text-white transition-colors">
                  Meu Cartão Digital
                </Link>
              </li>
              <li>
                <Link to="/como-funciona" className="hover:text-white transition-colors">
                  Como Acumular & Resgatar
                </Link>
              </li>
            </ul>
          </div>

          {/* For merchants */}
          <div>
            <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-3">
              Para Lojistas
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/cadastro?tipo=lojista" className="hover:text-white transition-colors">
                  Cadastrar Minha Loja
                </Link>
              </li>
              <li>
                <Link to="/planos" className="hover:text-white transition-colors">
                  Planos de Assinatura
                </Link>
              </li>
              <li>
                <Link to="/lojista" className="hover:text-white transition-colors">
                  Painel do Lojista
                </Link>
              </li>
            </ul>
          </div>

          {/* Admin and system */}
          <div>
            <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-3">
              Áreas do Sistema
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/login"
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <CreditCard className="w-3 h-3 text-emerald-400" /> Acesso Cliente
                </Link>
              </li>
              <li>
                <Link
                  to="/login?tipo=lojista"
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <Store className="w-3 h-3 text-amber-400" /> Acesso Lojista
                </Link>
              </li>
              <li>
                <Link
                  to="/login?tipo=admin"
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <ShieldCheck className="w-3 h-3 text-purple-400" /> Acesso Administrador
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Fideliza. Todos os direitos reservados.</p>
          <div className="flex items-center gap-1">
            <span>Programa de Fidelidade</span>
            <span className="text-rose-500 font-bold">•</span>
            <span>Comércio local valorizado</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

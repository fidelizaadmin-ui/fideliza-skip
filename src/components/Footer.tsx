import React from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Heart, Store, ShieldCheck, CreditCard } from 'lucide-react'

export const Footer: React.FC = () => {
  return (
    <footer className="border-t bg-slate-50 text-slate-600 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg text-slate-900">Fideliza</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              A plataforma completa de fidelidade que conecta lojas e clientes através de selos
              digitais, pontos e cashback em tempo real.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Para Clientes
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-rose-600 transition-colors">
                  Descobrir Lojas
                </Link>
              </li>
              <li>
                <Link to="/cliente" className="hover:text-rose-600 transition-colors">
                  Meu Cartão Digital
                </Link>
              </li>
              <li>
                <Link to="/como-funciona" className="hover:text-rose-600 transition-colors">
                  Como Acumular & Resgatar
                </Link>
              </li>
            </ul>
          </div>

          {/* For merchants */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Para Lojistas
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/cadastro?tipo=lojista" className="hover:text-rose-600 transition-colors">
                  Cadastrar Minha Loja
                </Link>
              </li>
              <li>
                <Link to="/planos" className="hover:text-rose-600 transition-colors">
                  Planos de Assinatura
                </Link>
              </li>
              <li>
                <Link to="/lojista" className="hover:text-rose-600 transition-colors">
                  Painel do Lojista
                </Link>
              </li>
            </ul>
          </div>

          {/* Admin and system */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Áreas do Sistema
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/login"
                  className="hover:text-rose-600 transition-colors flex items-center gap-1"
                >
                  <CreditCard className="w-3 h-3 text-emerald-500" /> Acesso Cliente
                </Link>
              </li>
              <li>
                <Link
                  to="/login?tipo=lojista"
                  className="hover:text-rose-600 transition-colors flex items-center gap-1"
                >
                  <Store className="w-3 h-3 text-amber-500" /> Acesso Lojista
                </Link>
              </li>
              <li>
                <Link
                  to="/login?tipo=admin"
                  className="hover:text-rose-600 transition-colors flex items-center gap-1"
                >
                  <ShieldCheck className="w-3 h-3 text-purple-500" /> Acesso Administrador
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Sistema Fideliza. Todos os direitos reservados.</p>
          <div className="flex items-center gap-1">
            <span>Desenvolvido com</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
            <span>para impulsionar o comércio local</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

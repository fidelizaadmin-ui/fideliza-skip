import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  Store,
  User,
  ShieldCheck,
  CreditCard,
  LogOut,
  LogIn,
  UserPlus,
  Compass,
} from 'lucide-react'

export const Navbar: React.FC = () => {
  const { user, role, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const getDashboardRoute = () => {
    if (role === 'admin') return '/admin'
    if (role === 'merchant') return '/lojista'
    return '/cliente'
  }

  const getRoleBadge = () => {
    if (role === 'admin') {
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 gap-1">
          <ShieldCheck className="w-3 h-3" /> Administrador
        </Badge>
      )
    }
    if (role === 'merchant') {
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
          <Store className="w-3 h-3" /> Lojista
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
        <CreditCard className="w-3 h-3" /> Cliente
      </Badge>
    )
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-xs">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Fideliza
            </span>
            <span className="block text-[10px] uppercase tracking-wider text-rose-600 font-bold -mt-1">
              Clube de Fidelidade
            </span>
          </div>
        </Link>

        {/* Center navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link to="/" className="flex items-center gap-1.5 hover:text-rose-600 transition-colors">
            <Compass className="w-4 h-4" />
            Explorar Lojas
          </Link>
          <Link to="/planos" className="hover:text-rose-600 transition-colors">
            Planos para Lojistas
          </Link>
          <Link to="/como-funciona" className="hover:text-rose-600 transition-colors">
            Como Funciona
          </Link>
        </nav>

        {/* Auth / Profile Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(getDashboardRoute())}
                className="hidden sm:inline-flex items-center gap-1.5 font-medium border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
              >
                {role === 'admin' && <ShieldCheck className="w-4 h-4" />}
                {role === 'merchant' && <Store className="w-4 h-4" />}
                {role === 'customer' && <CreditCard className="w-4 h-4" />}
                Minha Área
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative flex items-center gap-2 px-2 hover:bg-slate-100 rounded-full"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 text-white font-semibold text-xs flex items-center justify-center">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="hidden lg:inline-block text-xs font-semibold max-w-[120px] truncate text-slate-800">
                      {user.name}
                    </span>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56 p-2">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none text-slate-900">
                        {user.name}
                      </p>
                      <p className="text-xs leading-none text-slate-500 truncate">{user.email}</p>
                      <div className="pt-1">{getRoleBadge()}</div>
                      {user.customer_code && (
                        <p className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded mt-1 font-semibold">
                          Cód: {user.customer_code}
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => navigate(getDashboardRoute())}
                    className="cursor-pointer gap-2 font-medium"
                  >
                    {role === 'admin' ? (
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                    ) : role === 'merchant' ? (
                      <Store className="w-4 h-4 text-amber-600" />
                    ) : (
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                    )}
                    Painel{' '}
                    {role === 'admin'
                      ? 'Administrador'
                      : role === 'merchant'
                        ? 'do Lojista'
                        : 'do Cliente'}
                  </DropdownMenuItem>

                  {role === 'customer' && (
                    <DropdownMenuItem
                      onClick={() => navigate('/cliente')}
                      className="cursor-pointer gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-rose-500" />
                      Meus Cartões Fidelidade
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer gap-2 text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair da Conta
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/login')}
                className="gap-1.5 font-medium text-slate-700 hover:text-slate-900"
              >
                <LogIn className="w-4 h-4" />
                Entrar
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/cadastro')}
                className="gap-1.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-medium shadow-sm shadow-rose-500/20"
              >
                <UserPlus className="w-4 h-4" />
                Criar Conta
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

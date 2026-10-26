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
  Store,
  ShieldCheck,
  CreditCard,
  LogOut,
  LogIn,
  UserPlus,
  Compass,
  Gift,
  Bell,
  CheckCircle,
} from 'lucide-react'
import {
  getCustomerNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/services/fidelityService'
import type { NotificationRecord } from '@/types'
import { Logo } from '@/components/Logo'
import { formatCPF, formatCNPJ, cleanDocument } from '@/lib/documentValidation'

export const Navbar: React.FC = () => {
  const { user, role, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const [notifications, setNotifications] = React.useState<NotificationRecord[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)

  React.useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadNotifications()
      // Atualizar notificações a cada 30 segundos
      const interval = setInterval(loadNotifications, 30000)
      return () => clearInterval(interval)
    } else {
      setNotifications([])
      setUnreadCount(0)
    }
  }, [isAuthenticated, user?.id])

  const loadNotifications = async () => {
    if (!user?.id) return
    try {
      const data = await getCustomerNotifications(user.id)
      setNotifications(data)
      const unread = data.filter((n) => !n.is_read).length
      setUnreadCount(unread)
    } catch (err) {
      console.warn('Erro ao carregar notificações na navbar:', err)
    }
  }

  const handleNotificationClick = async (notif: NotificationRecord) => {
    if (!notif.is_read) {
      try {
        await markNotificationAsRead(notif.id)
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)),
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch (err) {
        console.warn('Erro ao marcar notificação como lida:', err)
      }
    }
    navigate('/cliente')
  }

  const handleMarkAllRead = async () => {
    if (!user?.id) return
    try {
      await markAllNotificationsAsRead(user.id)
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.warn('Erro ao marcar todas como lidas:', err)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const getDashboardRoute = () => {
    if (role === 'admin' || role === 'collaborator') return '/admin'
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
    if (role === 'collaborator') {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
          <ShieldCheck className="w-3 h-3" /> Colaborador Admin
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-xs">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center group transition-transform hover:scale-[1.02]">
          <Logo variant="horizontal" theme="light" size="sm" showTagline={false} />
        </Link>

        {/* Center navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
          <Link to="/" className="flex items-center gap-1.5 hover:text-rose-600 transition-colors">
            <Compass className="w-4 h-4 text-rose-500" />
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
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Sino de Notificações para todos os usuários logados */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative p-2 h-9 w-9 rounded-full text-slate-700 hover:text-rose-600 hover:bg-slate-100"
                    title="Notificações"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white ring-2 ring-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0 rounded-2xl shadow-xl">
                  <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 rounded-t-2xl">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-rose-600" />
                      <span className="font-bold text-xs text-slate-900">Notificações</span>
                      {unreadCount > 0 && (
                        <Badge className="bg-rose-100 text-rose-700 border-rose-200 text-[10px] py-0 px-1.5">
                          {unreadCount} nova(s)
                        </Badge>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline"
                      >
                        Marcar todas como lidas
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        Nenhuma notificação no momento.
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((notif) => (
                        <button
                          key={notif.id}
                          type="button"
                          onClick={() => handleNotificationClick(notif)}
                          className={`w-full text-left p-3.5 transition-colors flex gap-3 hover:bg-slate-50 ${
                            !notif.is_read ? 'bg-rose-50/40' : 'bg-white'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                              notif.type === 'giveaway_won'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {notif.type === 'giveaway_won' ? (
                              <Gift className="w-4 h-4" />
                            ) : (
                              <Bell className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {notif.title}
                              </p>
                              {!notif.is_read && (
                                <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                              {notif.message}
                            </p>
                            <p className="text-[9px] text-slate-400 mt-1">
                              {new Date(notif.created).toLocaleDateString('pt-BR')} às{' '}
                              {new Date(notif.created).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  <div className="p-2 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/cliente')}
                      className="w-full text-xs font-bold text-slate-700 hover:text-rose-600"
                    >
                      Ver painel do cliente
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(getDashboardRoute())}
                className="hidden sm:inline-flex items-center gap-1.5 font-bold border-slate-200 text-slate-800 hover:bg-slate-50"
              >
                {role === 'admin' && <ShieldCheck className="w-4 h-4 text-purple-600" />}
                {role === 'collaborator' && <ShieldCheck className="w-4 h-4 text-blue-600" />}
                {role === 'merchant' && <Store className="w-4 h-4 text-amber-600" />}
                {role === 'customer' && <CreditCard className="w-4 h-4 text-emerald-600" />}
                Minha Área
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative flex items-center gap-2 px-2 hover:bg-slate-100 rounded-full"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-xs">
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
                      {user.document && (
                        <p className="text-[10px] font-mono text-slate-500 px-1 pt-0.5">
                          {cleanDocument(user.document).length > 11
                            ? `CNPJ: ${formatCNPJ(cleanDocument(user.document))}`
                            : `CPF: ${formatCPF(cleanDocument(user.document))}`}
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
                    ) : role === 'collaborator' ? (
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                    ) : role === 'merchant' ? (
                      <Store className="w-4 h-4 text-amber-600" />
                    ) : (
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                    )}
                    Painel{' '}
                    {role === 'admin'
                      ? 'Administrador'
                      : role === 'collaborator'
                        ? 'do Colaborador'
                        : role === 'merchant'
                          ? 'do Lojista'
                          : 'do Cliente'}
                  </DropdownMenuItem>

                  {role === 'customer' && (
                    <DropdownMenuItem
                      onClick={() => navigate('/cliente')}
                      className="cursor-pointer gap-2"
                    >
                      <Gift className="w-4 h-4 text-amber-500" />
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
                className="gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm transition-all hover:shadow"
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

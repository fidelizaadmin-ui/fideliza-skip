import React from 'react'
import {
  ShoppingBag,
  Award,
  Store,
  CreditCard,
  Gift,
  UserCheck,
  Calendar as CalendarIcon,
  TrendingUp,
  Menu,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

export type MerchantTabKey =
  | 'pos'
  | 'program'
  | 'store'
  | 'subscription'
  | 'marketing'
  | 'customers'
  | 'appointments'
  | 'sales'

export interface MerchantSidebarItem {
  key: MerchantTabKey
  label: string
  shortLabel?: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number | string | null
  badgeColor?: string
  disabled?: boolean
  disabledReason?: string
  iconColor?: string
}

interface MerchantSidebarProps {
  activeTab: string
  onSelectTab: (tab: MerchantTabKey) => void
  isMerchantSuspended?: boolean
  giveawaysCount?: number
  customersCount?: number
  storeName?: string
  className?: string
}

export function buildMerchantNavItems(options: {
  isMerchantSuspended?: boolean
  giveawaysCount?: number
  customersCount?: number
}): MerchantSidebarItem[] {
  const { isMerchantSuspended = false, giveawaysCount = 0, customersCount = 0 } = options

  return [
    {
      key: 'pos',
      label: 'Registrar Compra (PDV)',
      shortLabel: 'PDV',
      icon: ShoppingBag,
      disabled: isMerchantSuspended,
      disabledReason: isMerchantSuspended ? 'Bloqueado por suspensão' : undefined,
    },
    {
      key: 'program',
      label: 'Meu Plano de Fidelidade',
      shortLabel: 'Fidelidade',
      icon: Award,
      disabled: isMerchantSuspended,
      disabledReason: isMerchantSuspended ? 'Bloqueado por suspensão' : undefined,
    },
    {
      key: 'store',
      label: 'Dados da Loja',
      shortLabel: 'Loja',
      icon: Store,
    },
    {
      key: 'subscription',
      label: 'Assinatura',
      shortLabel: 'Assinatura',
      icon: CreditCard,
    },
    {
      key: 'marketing',
      label: 'Marketing & Sorteios',
      shortLabel: 'Sorteios',
      icon: Gift,
      iconColor: 'text-rose-600',
      badge: giveawaysCount,
      badgeColor: 'bg-rose-100 text-rose-700 border-rose-200',
    },
    {
      key: 'customers',
      label: 'Base de Clientes',
      shortLabel: 'Clientes',
      icon: UserCheck,
      iconColor: 'text-emerald-600',
      badge: customersCount,
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    },
    {
      key: 'appointments',
      label: 'Agendamentos',
      shortLabel: 'Agenda',
      icon: CalendarIcon,
      iconColor: 'text-blue-600',
    },
    {
      key: 'sales',
      label: 'Relatório de Vendas',
      shortLabel: 'Vendas',
      icon: TrendingUp,
    },
  ]
}

export const MerchantSidebar: React.FC<MerchantSidebarProps> = ({
  activeTab,
  onSelectTab,
  isMerchantSuspended = false,
  giveawaysCount = 0,
  customersCount = 0,
  storeName,
  className,
}) => {
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const items = React.useMemo(
    () =>
      buildMerchantNavItems({
        isMerchantSuspended,
        giveawaysCount,
        customersCount,
      }),
    [isMerchantSuspended, giveawaysCount, customersCount],
  )

  const activeItem = items.find((i) => i.key === activeTab) || items[0]

  const handleItemClick = (key: MerchantTabKey, disabled?: boolean) => {
    if (disabled) return
    onSelectTab(key)
    setMobileOpen(false)

    // Suaviza rolagem para o conteúdo caso a página esteja mais abaixo
    const contentEl = document.getElementById('tabs-section')
    if (contentEl) {
      contentEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const renderNavList = (isMobile = false) => (
    <nav className="flex flex-col gap-1.5" aria-label="Navegação do Lojista">
      {items.map((item) => {
        const Icon = item.icon
        const isActive = activeTab === item.key
        const isDisabled = Boolean(item.disabled)

        return (
          <button
            key={item.key}
            type="button"
            disabled={isDisabled}
            onClick={() => handleItemClick(item.key, isDisabled)}
            title={isDisabled ? item.disabledReason : item.label}
            className={cn(
              'group relative flex items-center justify-between w-full text-left rounded-2xl px-3.5 py-3 transition-all font-semibold text-xs sm:text-sm',
              isActive
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20 ring-1 ring-amber-400'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
              isDisabled &&
                'opacity-45 cursor-not-allowed hover:bg-transparent hover:text-slate-500',
            )}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span
                className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                  isActive
                    ? 'bg-white/90 text-amber-800 shadow-xs'
                    : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200/80 group-hover:text-slate-900',
                  isDisabled && 'bg-slate-100 text-slate-400',
                )}
              >
                <Icon className={cn('w-4 h-4', !isActive && item.iconColor)} />
              </span>

              <span className="truncate tracking-tight">{item.label}</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              {item.badge !== undefined && item.badge !== null && (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] font-black px-2 py-0.5 rounded-full border',
                    isActive
                      ? 'bg-white text-slate-900 border-white/80'
                      : item.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200',
                  )}
                >
                  {item.badge}
                </Badge>
              )}

              {isDisabled ? (
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              ) : (
                <ChevronRight
                  className={cn(
                    'w-3.5 h-3.5 transition-transform shrink-0',
                    isActive
                      ? 'text-slate-950 translate-x-0.5'
                      : 'text-slate-400 group-hover:text-slate-600',
                  )}
                />
              )}
            </div>
          </button>
        )
      })}
    </nav>
  )

  return (
    <div className={cn('w-full', className)}>
      {/* MOBILE TRIGGER BAR (< lg) */}
      <div className="lg:hidden mb-4 bg-white border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold">
            {React.createElement(activeItem.icon, {
              className: cn('w-4 h-4', activeItem.iconColor),
            })}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Seção Atual
            </p>
            <p className="text-xs sm:text-sm font-black text-slate-900 truncate">
              {activeItem.label}
            </p>
          </div>
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl border-slate-200 font-bold text-xs bg-slate-50 hover:bg-slate-100 shrink-0 text-slate-800"
            >
              <Menu className="w-4 h-4 text-slate-700" />
              <span>Menu do Painel</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[340px] p-0 flex flex-col bg-white">
            <SheetHeader className="p-5 border-b border-slate-100 text-left bg-gradient-to-br from-amber-50/70 to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <SheetTitle className="text-sm font-black text-slate-900">
                    Menu do Lojista
                  </SheetTitle>
                  <SheetDescription className="text-[11px] text-slate-500 truncate max-w-[210px]">
                    {storeName || 'Painel de Controle'}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="p-3.5 flex-1 overflow-y-auto">{renderNavList(true)}</div>

            {isMerchantSuspended && (
              <div className="p-3.5 m-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-[11px]">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  Operações bloqueadas
                </p>
                <p className="text-rose-800 mt-0.5 leading-snug">
                  PDV e Fidelidade estão suspensos até regularização do pagamento.
                </p>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>

      {/* DESKTOP LATERAL SIDEBAR (>= lg) */}
      <aside
        className="hidden lg:block w-72 shrink-0 bg-white border border-slate-200 rounded-3xl p-4 shadow-xs self-start sticky top-24"
        aria-label="Menu Lateral do Lojista"
      >
        <div className="pb-3.5 mb-3 border-b border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            Navegação do Lojista
          </p>
          <h2 className="text-sm font-black text-slate-900 truncate mt-0.5">
            {storeName || 'Painel da Loja'}
          </h2>
        </div>

        {renderNavList(false)}

        {isMerchantSuspended && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
            <p className="font-bold flex items-center gap-1.5 text-rose-950">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              Operações suspensas
            </p>
            <p className="text-[11px] text-rose-800 mt-1 leading-relaxed">
              O PDV e o Plano de Fidelidade estão bloqueados até o pagamento da assinatura.
            </p>
          </div>
        )}
      </aside>
    </div>
  )
}

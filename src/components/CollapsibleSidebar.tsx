import React from 'react'
import { ChevronRight } from 'lucide-react'
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

/**
 * Ícone com 3 traços horizontais ("---"), hambúrguer clássico com 3 linhas.
 */
export function ThreeLinesMenuIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('w-4 h-4', className)}
      aria-hidden="true"
    >
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  )
}

export interface CollapsibleSidebarItem<T extends string = string> {
  key: T
  label: string
  shortLabel?: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number | string | null
  badgeColor?: string
  disabled?: boolean
  disabledReason?: string
  iconColor?: string
}

export interface CollapsibleSidebarProps<T extends string = string> {
  title: string
  subtitle?: string
  headerIcon?: React.ComponentType<{ className?: string }>
  headerBadge?: string
  headerGradient?: string
  triggerButtonText?: string
  activeColorClass?: string
  items: CollapsibleSidebarItem<T>[]
  activeKey: T
  onSelect: (key: T) => void
  footerContent?: React.ReactNode
  className?: string
  scrollTargetId?: string
  showCurrentSectionBar?: boolean
  showFixedTriggerButton?: boolean
}

export function CollapsibleSidebar<T extends string = string>({
  title,
  subtitle,
  headerIcon: HeaderIcon,
  headerBadge,
  headerGradient = 'from-slate-50 to-white',
  triggerButtonText = 'MENU',
  activeColorClass = 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20 ring-1 ring-amber-400',
  items,
  activeKey,
  onSelect,
  footerContent,
  className,
  scrollTargetId,
  showCurrentSectionBar = true,
  showFixedTriggerButton = true,
}: CollapsibleSidebarProps<T>) {
  const [open, setOpen] = React.useState(false)

  const activeItem = items.find((i) => i.key === activeKey) || items[0]

  const handleSelect = (key: T, disabled?: boolean) => {
    if (disabled) return
    onSelect(key)
    setOpen(false)

    if (scrollTargetId) {
      const el = document.getElementById(scrollTargetId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  const ActiveIcon = activeItem?.icon

  return (
    <div className={cn('w-full', className)}>
      <Sheet open={open} onOpenChange={setOpen}>
        {/* BOTÃO FIXO NA LATERAL SUPERIOR ESQUERDA DA TELA (SEMPRE VISÍVEL NO TOPO, ACIMA DE QUALQUER CONTEÚDO E DO CABEÇALHO) */}
        {showFixedTriggerButton && (
          <div className="fixed top-20 left-4 z-50 pointer-events-auto">
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 px-3.5 gap-2 rounded-xl bg-white/95 backdrop-blur-md border-slate-300 shadow-md hover:shadow-lg font-bold text-xs text-slate-800 hover:text-slate-950 hover:bg-white active:scale-95 transition-all"
                aria-label={triggerButtonText}
              >
                <ThreeLinesMenuIcon className="w-4 h-4 text-slate-800 shrink-0" />
                <span>{triggerButtonText}</span>
              </Button>
            </SheetTrigger>
          </div>
        )}

        {/* Barra de Seção Atual (azul da marca, sem botão MENU: o toggle fica só no botão fixo do topo) */}
        {showCurrentSectionBar && (
          <div className="bg-gradient-to-r from-[#012D76] via-[#01358a] to-[#012D76] border border-[#0283FD]/40 rounded-2xl p-3 sm:p-3.5 shadow-md shadow-[#012D76]/20 flex items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-3 min-w-0">
              {ActiveIcon && (
                <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ActiveIcon className={cn('w-4 h-4', 'text-white')} />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] font-bold text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#0283FD]" />
                  Seção Atual
                </p>
                <p className="text-xs sm:text-sm font-black text-white truncate">
                  {activeItem?.label || title}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Gaveta Retrátil com Overlay e Fechamento no X */}
        <SheetContent side="left" className="w-[300px] sm:w-[340px] p-0 flex flex-col bg-white">
          <SheetHeader
            className={cn(
              'p-5 border-b border-slate-100 text-left bg-gradient-to-br',
              headerGradient,
            )}
          >
            <div className="flex items-center justify-between gap-2.5 pr-6">
              <div className="flex items-center gap-2.5 min-w-0">
                {HeaderIcon && (
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                    <HeaderIcon className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="min-w-0">
                  <SheetTitle className="text-sm font-black text-slate-900 truncate">
                    {title}
                  </SheetTitle>
                  {subtitle && (
                    <SheetDescription className="text-[11px] text-slate-500 truncate max-w-[210px]">
                      {subtitle}
                    </SheetDescription>
                  )}
                </div>
              </div>

              {headerBadge && (
                <Badge variant="outline" className="text-[10px] font-black shrink-0">
                  {headerBadge}
                </Badge>
              )}
            </div>
          </SheetHeader>

          <div className="p-3.5 flex-1 overflow-y-auto">
            <nav className="flex flex-col gap-1.5" aria-label={`Navegação de ${title}`}>
              {items.map((item) => {
                const Icon = item.icon
                const isActive = activeKey === item.key
                const isDisabled = Boolean(item.disabled)

                return (
                  <button
                    key={item.key}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleSelect(item.key, isDisabled)}
                    title={isDisabled ? item.disabledReason : item.label}
                    className={cn(
                      'group relative flex items-center justify-between w-full text-left rounded-2xl px-3.5 py-3 transition-all font-semibold text-xs sm:text-sm',
                      isActive
                        ? activeColorClass
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
                            ? 'bg-white/90 text-slate-900 shadow-xs'
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

                      <ChevronRight
                        className={cn(
                          'w-3.5 h-3.5 transition-transform shrink-0',
                          isActive
                            ? 'text-current translate-x-0.5'
                            : 'text-slate-400 group-hover:text-slate-600',
                        )}
                      />
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>

          {footerContent && <div className="p-3.5 border-t border-slate-100">{footerContent}</div>}
        </SheetContent>
      </Sheet>
    </div>
  )
}

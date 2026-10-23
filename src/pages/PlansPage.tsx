import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSubscriptionPlans } from '@/services/fidelityService'
import type { SubscriptionPlanRecord } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, ArrowRight, ShieldCheck, Store } from 'lucide-react'
import { Logo } from '@/components/Logo'

export default function PlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlanRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const data = await getSubscriptionPlans()
      setPlans(data)
    } catch (err) {
      console.error('Error loading subscription plans:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl flex-1">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="flex justify-center mb-2">
          <div className="p-3.5 rounded-2xl bg-[#0D2240] shadow-lg">
            <Logo variant="symbol" theme="dark" size="md" />
          </div>
        </div>
        <Badge className="bg-[#0D2240] text-amber-400 border-[#0D2240] font-bold px-3 py-1">
          Planos de Assinatura para Lojistas • Fidelidade que Premia
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Escolha o plano ideal para fidelizar seus clientes
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          Todos os planos contam com dias de teste grátis configurados pelo administrador. Cadastre
          sua loja e comece sem compromisso.
        </p>
      </div>

      {/* Grid of plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {plans.map((p) => {
          const isBestValue = p.slug === 'anual'
          const features = Array.isArray(p.features)
            ? p.features
            : typeof p.features === 'string' && p.features.startsWith('[')
              ? JSON.parse(p.features)
              : []

          return (
            <Card
              key={p.id}
              className={`rounded-3xl border overflow-hidden flex flex-col justify-between transition-all duration-300 relative ${
                isBestValue
                  ? 'border-rose-500 shadow-2xl shadow-rose-500/10 scale-105 z-10 bg-white'
                  : 'border-slate-200 shadow-sm hover:shadow-md bg-white'
              }`}
            >
              {isBestValue && (
                <div className="bg-[#0D2240] text-amber-400 text-[11px] font-black uppercase tracking-widest text-center py-1.5">
                  Mais Popular & Econômico
                </div>
              )}

              <CardHeader className="p-8 pb-4">
                <Badge variant="outline" className="w-fit mb-2 text-xs font-bold uppercase">
                  {p.slug}
                </Badge>
                <CardTitle className="text-2xl font-black text-slate-900">{p.name}</CardTitle>
                <p className="text-xs text-slate-500 mt-1 min-h-[36px]">{p.description}</p>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <span className="text-4xl font-black text-slate-900">
                    R$ {Number(p.price).toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-xs text-slate-500 ml-1.5 font-medium">
                    /{' '}
                    {p.billing_interval_months === 1 ? 'mês' : `${p.billing_interval_months} meses`}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{p.trial_days} dias de teste sem cobrança imediata</span>
                </div>
              </CardHeader>

              <CardContent className="p-8 pt-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3 mb-8">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    O que está incluso:
                  </p>
                  {features.map((feat: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => navigate('/cadastro?tipo=lojista')}
                  className={`w-full py-6 rounded-2xl font-black text-sm shadow-md ${
                    isBestValue
                      ? 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white shadow-rose-500/20'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  Começar Teste Grátis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Assurance Box */}
      <div className="bg-slate-100/70 border border-slate-200 rounded-3xl p-8 text-center max-w-3xl mx-auto">
        <ShieldCheck className="w-10 h-10 text-slate-700 mx-auto mb-3" />
        <h3 className="font-extrabold text-base text-slate-900 mb-1">
          Como funciona a aprovação e o pagamento?
        </h3>
        <p className="text-xs text-slate-600 max-w-xl mx-auto leading-relaxed">
          Você cadastra sua loja e escolhe seu plano. O administrador aprova seu cadastro e ativa
          seu período de teste. O status da sua assinatura é controlado e registrado diretamente
          pelo administrador.
        </p>
      </div>
    </div>
  )
}

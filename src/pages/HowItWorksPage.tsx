import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  Award,
  Coins,
  Percent,
  CreditCard,
  QrCode,
  Store,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'

export default function HowItWorksPage() {
  const navigate = useNavigate()

  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl flex-1">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
        <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-bold px-3 py-1">
          Guia Rápido • Fideliza
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Como funciona a plataforma Fideliza
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          Sem cartões de papel perdidos na carteira. O Fideliza une clientes e lojas em um único
          sistema digital em tempo real.
        </p>
      </div>

      {/* 3 Steps for Customers */}
      <section className="mb-20">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-8 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-emerald-600" />
          Para Você que é Cliente
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black text-lg flex items-center justify-center">
              1
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Crie sua Conta Grátis</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Faça seu cadastro em segundos com e-mail e senha e receba seu{' '}
              <strong>Código Digital exclusivo</strong> (ex: CLI-7842).
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black text-lg flex items-center justify-center">
              2
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Informe no Caixa</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ao comprar em qualquer loja cadastrada, diga seu código ou mostre seu cartão no
              celular. O lojista registra e os benefícios caem na hora.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black text-lg flex items-center justify-center">
              3
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Resgate seus Prêmios</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Complete os selos necessários, troque seus pontos por cortesias ou use o saldo de
              cashback para abater contas futuras.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Button
            onClick={() => navigate('/cadastro?tipo=cliente')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-5 px-6 rounded-xl"
          >
            Criar Minha Conta de Cliente
          </Button>
        </div>
      </section>

      {/* 3 Steps for Merchants */}
      <section className="mb-16">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-8 flex items-center gap-2">
          <Store className="w-6 h-6 text-amber-600" />
          Para Você que é Lojista
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-black text-lg flex items-center justify-center">
              1
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Cadastre sua Loja</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Informe nome, categoria, endereço e escolha seu plano de assinatura (mensal, semestral
              ou anual com teste grátis).
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-black text-lg flex items-center justify-center">
              2
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Escolha o Modelo</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Defina as regras do seu programa: <strong>Selos</strong> (ex: 10 selos = lanche),{' '}
              <strong>Pontos</strong> por real ou <strong>Cashback</strong> em %.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-black text-lg flex items-center justify-center">
              3
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Registre no PDV</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Na sua área do lojista, digite o código do cliente e o valor da compra. O sistema faz
              o cálculo e alimenta o relatório de vendas automaticamente.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Button
            onClick={() => navigate('/cadastro?tipo=lojista')}
            className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-xs py-5 px-6 rounded-xl"
          >
            Cadastrar Minha Loja Agora
          </Button>
        </div>
      </section>

      {/* The 3 Loyalty Models in Detail */}
      <section className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black">Os 3 Modelos de Recompensa</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Você escolhe como fidelizar sua clientela
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <Award className="w-8 h-8 text-amber-400" />
            <h4 className="font-extrabold text-base">Selos Digitais</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ideal para cafés, lanchonetes e barbearias. A cada compra ou valor mínimo, o cliente
              ganha 1 selo. Ao completar a cartela, ganha uma recompensa definida.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <Coins className="w-8 h-8 text-indigo-400" />
            <h4 className="font-extrabold text-base">Pontos Acumulativos</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Gera pontos com base no valor gasto (ex: R$ 1 = 1 ponto). O cliente acumula e resgata
              quando atinge a meta do prêmio.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <Percent className="w-8 h-8 text-emerald-400" />
            <h4 className="font-extrabold text-base">Cashback Direto</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Retorna uma porcentagem em reais direto na carteira do cliente na loja (ex: 5% a 10%),
              incentivando retornos frequentes para gastar o saldo.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

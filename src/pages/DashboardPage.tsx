import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useFinance } from '@/context/FinanceContext';
import { TrendingUp, TrendingDown, DollarSign, Target, Calendar, Activity, PieChart as PieChartIcon, CheckCircle2, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'motion/react';
import { format, subMonths, isSameMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function DashboardPage() {
  useDocumentTitle('Dashboard');
  const { transactions, goals, invoices, investments, marketPrices } = useFinance();

  const last6Months = Array.from({ length: 6 }).map((_, i) => subMonths(new Date(), 5 - i));
  const chartData = last6Months.map(m => {
    const monthName = format(m, 'MMM', { locale: ptBR });
    const txs = transactions.filter(t => t.date && isSameMonth(parseISO(t.date), m));
    const monthInvoices = invoices.filter(inv => inv.dueDate && isSameMonth(parseISO(inv.dueDate + 'T00:00:00'), m));

    return {
      name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      receita: txs.filter(t => t.type === 'income' && t.status === 'recebido').reduce((sum, t) => sum + t.amount, 0),
      despesa: txs.filter(t => t.type === 'expense' && t.paymentMethod !== 'Cartão de Crédito').reduce((sum, t) => sum + t.amount, 0) + monthInvoices.reduce((sum, inv) => sum + inv.amount, 0)
    };
  });

  const txsBeforeWindow = transactions.filter(t => t.date && parseISO(t.date) < last6Months[0]);
  const invoicesBeforeWindow = invoices.filter(inv => inv.dueDate && parseISO(inv.dueDate + 'T00:00:00') < last6Months[0]);

  let accumulatedCash =
    txsBeforeWindow.filter(t => t.type === 'income' && t.status === 'recebido').reduce((sum, t) => sum + t.amount, 0) -
    txsBeforeWindow.filter(t => t.type === 'expense' && t.paymentMethod !== 'Cartão de Crédito').reduce((sum, t) => sum + t.amount, 0) -
    invoicesBeforeWindow.reduce((sum, inv) => sum + inv.amount, 0);

  const totalInvestmentsCurrentValue = investments.reduce((sum, inv) => {
    if ((inv.assetType === 'Ação' || inv.assetType === 'Criptomoeda') && inv.assetName) {
      const price = marketPrices[inv.assetName.toUpperCase()];
      if (price !== undefined && price !== null) {
        return sum + (price * inv.quantity);
      }
    } else if (inv.assetType === 'Renda Fixa' || inv.assetType === 'Outros') {
      if (inv.annualYield && inv.annualYield > 0 && inv.startDate) {
        const start = new Date(inv.startDate);
        const now = new Date();
        const daysElapsed = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        if (daysElapsed > 0) {
          const dailyRate = Math.pow(1 + inv.annualYield / 100, 1 / 252) - 1;
          return sum + (inv.investedAmount * Math.pow(1 + dailyRate, daysElapsed));
        }
      }
      return sum + (Number(inv.quantity) > 0 ? Number(inv.quantity) : inv.investedAmount);
    }
    return sum + inv.investedAmount;
  }, 0);

  const patrimonioData = chartData.map(c => {
    accumulatedCash += (c.receita - c.despesa);
    // Adding the current value to all past points as a baseline since we lack historical price APIs
    return { name: c.name, caixa: accumulatedCash, patrimonio: accumulatedCash + totalInvestmentsCurrentValue };
  });

  const totalCash = transactions.filter(t => t.type === 'income' && t.status === 'recebido').reduce((sum, t) => sum + t.amount, 0) -
    transactions.filter(t => t.type === 'expense' && t.paymentMethod !== 'Cartão de Crédito').reduce((sum, t) => sum + t.amount, 0) -
    invoices.reduce((sum, inv) => sum + inv.amount, 0);

  const patrimonioTotal = totalCash + totalInvestmentsCurrentValue;

  const allocationDataMap = new Map<string, number>();
  investments.forEach(inv => {
    let val = inv.investedAmount;
    if ((inv.assetType === 'Ação' || inv.assetType === 'Criptomoeda') && inv.assetName) {
      const price = marketPrices[inv.assetName.toUpperCase()];
      if (price !== undefined && price !== null) {
        val = price * inv.quantity;
      }
    } else if (inv.assetType === 'Renda Fixa' || inv.assetType === 'Outros') {
      if (inv.annualYield && inv.annualYield > 0 && inv.startDate) {
        const start = new Date(inv.startDate);
        const now = new Date();
        const daysElapsed = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        if (daysElapsed > 0) {
          const dailyRate = Math.pow(1 + inv.annualYield / 100, 1 / 252) - 1;
          val = inv.investedAmount * Math.pow(1 + dailyRate, daysElapsed);
        }
      } else {
        val = Number(inv.quantity) > 0 ? Number(inv.quantity) : inv.investedAmount;
      }
    }
    if (val > 0) {
      allocationDataMap.set(inv.assetType, (allocationDataMap.get(inv.assetType) || 0) + val);
    }
  });
  const allocationData = Array.from(allocationDataMap.entries()).map(([name, value]) => ({ name, value }));
  const PIE_COLORS = ['#FF4D00', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'];

  const currentMonthTx = transactions.filter(t => t.date && isSameMonth(parseISO(t.date), new Date()));
  const currentIncomeTx = currentMonthTx.filter(t => t.type === 'income');
  const totalReceita = currentIncomeTx.reduce((acc, curr) => acc + curr.amount, 0);
  const receitaRecebida = currentIncomeTx.filter(t => t.status === 'recebido').reduce((acc, curr) => acc + curr.amount, 0);
  const receitaPendente = currentIncomeTx.filter(t => !t.status || t.status === 'pendente').reduce((acc, curr) => acc + curr.amount, 0);
  const currentMonthInvoices = invoices.filter(inv => inv.dueDate && isSameMonth(parseISO(inv.dueDate + 'T00:00:00'), new Date()));

  // Despesas Reais e Saúde Financeira
  const despesaRealDinheiro = currentMonthTx.filter(t => t.type === 'expense' && t.paymentMethod !== 'Cartão de Crédito' && t.status !== 'pendente').reduce((acc, curr) => acc + curr.amount, 0);
  const totalDespesa = despesaRealDinheiro + currentMonthInvoices.reduce((acc, inv) => acc + inv.amount, 0);

  const lucroReal = receitaRecebida - totalDespesa;

  const investedThisMonth = investments.filter(inv => inv.startDate && isSameMonth(parseISO(inv.startDate), new Date())).reduce((acc, curr) => acc + curr.investedAmount, 0);
  const savingRate = receitaRecebida > 0 ? (investedThisMonth / receitaRecebida) * 100 : 0;

  const rendaComprometida = receitaRecebida > 0 ? (totalDespesa / receitaRecebida) * 100 : 0;

  const lastMonthDate = subMonths(new Date(), 1);
  const lastMonthTx = transactions.filter(t => t.date && isSameMonth(parseISO(t.date), lastMonthDate));
  const prevTotalReceita = lastMonthTx.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const prevReceitaRecebida = lastMonthTx.filter(t => t.type === 'income' && t.status === 'recebido').reduce((acc, curr) => acc + curr.amount, 0);
  const lastMonthInvoices = invoices.filter(inv => inv.dueDate && isSameMonth(parseISO(inv.dueDate + 'T00:00:00'), lastMonthDate));
  const prevTotalDespesa = lastMonthTx.filter(t => t.type === 'expense' && t.paymentMethod !== 'Cartão de Crédito').reduce((acc, curr) => acc + curr.amount, 0) + lastMonthInvoices.reduce((acc, inv) => acc + inv.amount, 0);
  const prevLucroReal = prevReceitaRecebida - prevTotalDespesa;

  const calcPerc = (curr: number, prev: number) => {
    if (prev === 0) return curr === 0 ? 0 : (curr > 0 ? 100 : -100);
    return ((curr - prev) / Math.abs(prev)) * 100;
  };

  const formatPerc = (val: number) => {
    const sign = val > 0 ? '+' : '';
    return `${sign}${val.toFixed(1)}% vs mês anterior`;
  };

  let saudeLabel = 'Excelente';
  let saudeColor = 'bg-emerald-500';
  let saudeText = 'text-emerald-700';
  let limiteText = 'Dentro do limite ideal';

  if (receitaRecebida === 0) {
    saudeLabel = 'Sem dados';
    saudeColor = 'bg-gray-400';
    saudeText = 'text-gray-600';
    limiteText = 'Sem receita real neste mês';
  } else if (rendaComprometida > 80 || lucroReal < 0) {
    saudeLabel = 'Crítico';
    saudeColor = 'bg-red-500';
    saudeText = 'text-red-700';
    limiteText = 'Orçamento comprometido (Risco)';
  } else if (rendaComprometida > 60 || savingRate === 0) {
    saudeLabel = 'Atenção';
    saudeColor = 'bg-orange-500';
    saudeText = 'text-orange-700';
    limiteText = savingRate === 0 ? 'Bom, mas sem aportes' : 'Próximo ao limite';
  } else if (savingRate >= 10 && rendaComprometida <= 60) {
    saudeLabel = 'Excelente';
    saudeColor = 'bg-emerald-500';
    saudeText = 'text-emerald-700';
    limiteText = 'Gastos controlados, poupando bem';
  } else {
    saudeLabel = 'Bom';
    saudeColor = 'bg-blue-500';
    saudeText = 'text-blue-700';
    limiteText = 'Gastos equilibrados';
  }

  const totalMetas = goals.reduce((acc, curr) => acc + curr.currentAmount, 0);
  const proximasContas = invoices.filter(inv => inv.status === 'Pendente').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Visão geral das suas finanças neste mês.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
          <div className={`w-2 h-2 rounded-full ${saudeColor} animate-pulse`} />
          <span className={`text-sm font-medium ${saudeText}`}>Saúde Financeira: {saudeLabel}</span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white shadow-xl mb-8 relative overflow-hidden border border-gray-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF4D00] rounded-full filter blur-[120px] opacity-30 translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="relative z-10">
          <p className="text-gray-400 font-medium mb-1 uppercase tracking-wider text-sm">Patrimônio Líquido Total</p>
          <h2 className="text-5xl font-bold tracking-tight mb-8 text-white">R$ {patrimonioTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
          <div className="flex gap-8 border-t border-gray-700/50 pt-6">
            <div>
              <p className="text-sm text-gray-400 mb-1">Caixa (Saldo Disponível)</p>
              <p className="text-xl font-semibold text-gray-200">R$ {totalCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Ativos & Investimentos</p>
              <p className="text-xl font-semibold text-[#FF4D00]">R$ {totalInvestmentsCurrentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Receita Recebida"
          value={`R$ ${receitaRecebida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          trend={formatPerc(calcPerc(receitaRecebida, prevReceitaRecebida))}
          trendUp={calcPerc(receitaRecebida, prevReceitaRecebida) >= 0}
          subtitle={receitaPendente > 0 ? `R$ ${receitaPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} pendente` : undefined}
          subtitleColor="text-amber-600"
        />
        <MetricCard
          title="Despesas Totais"
          value={`R$ ${totalDespesa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<TrendingDown className="w-5 h-5 text-red-500" />}
          trend={formatPerc(calcPerc(totalDespesa, prevTotalDespesa))}
          trendUp={calcPerc(totalDespesa, prevTotalDespesa) <= 0}
        />
        <MetricCard
          title="💰 Saldo Real"
          value={`R$ ${lucroReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<DollarSign className="w-5 h-5 text-blue-500" />}
          trend={formatPerc(calcPerc(lucroReal, prevLucroReal))}
          trendUp={calcPerc(lucroReal, prevLucroReal) >= 0}
          subtitle="Baseado no recebido"
          subtitleColor="text-gray-400"
        />
        <MetricCard
          title="Renda Comprometida"
          value={`${rendaComprometida.toFixed(1)}%`}
          icon={<Activity className="w-5 h-5 text-orange-500" />}
          trend={limiteText}
          trendUp={rendaComprometida <= 60}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Receita vs Despesa (6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEAEA" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#555555', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#555555', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="receita" name="Receita" fill="#10B981" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="despesa" name="Despesa" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-[#FF4D00] to-[#FF7A00] text-white border-none shadow-lg shadow-[#FF4D00]/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Target className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-white/80 text-sm font-medium mb-1">Total em Metas</p>
              <h3 className="text-3xl font-bold tracking-tight">R$ {totalMetas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
              </div>
              <p className="text-gray-500 text-sm font-medium mb-1">Próximas Contas a Vencer</p>
              <h3 className="text-3xl font-bold tracking-tight text-gray-900">R$ {proximasContas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Evolução Patrimonial Simulada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={patrimonioData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPatrimonio" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF4D00" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FF4D00" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCaixa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEAEA" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#555555', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#555555', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Area type="monotone" dataKey="patrimonio" name="Patrimônio Total" stroke="#FF4D00" strokeWidth={3} fillOpacity={1} fill="url(#colorPatrimonio)" />
                  <Area type="monotone" dataKey="caixa" name="Caixa" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorCaixa)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {allocationData.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-[#FF4D00]" />
                Composição da Carteira
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                    />
                    <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-gray-400" />
                Composição da Carteira
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-[300px] text-gray-400 text-sm">
              <PieChartIcon className="w-12 h-12 mb-4 opacity-20" />
              Nenhum ativo avaliado
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
}

function MetricCard({ title, value, icon, trend, trendUp, subtitle, subtitleColor }: { title: string, value: string, icon: React.ReactNode, trend: string, trendUp: boolean, subtitle?: string, subtitleColor?: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
            {icon}
          </div>
        </div>
        <h3 className="text-2xl font-bold tracking-tight text-gray-900 mb-1">{value}</h3>
        {subtitle && (
          <p className={`text-xs font-medium mb-1 flex items-center gap-1 ${subtitleColor || 'text-gray-400'}`}>
            <Clock className="w-3 h-3" />
            {subtitle}
          </p>
        )}
        <p className={`text-xs font-medium ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
          {trend}
        </p>
      </CardContent>
    </Card>
  );
}

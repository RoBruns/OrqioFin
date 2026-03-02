import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useFinance } from '@/context/FinanceContext';
import { TrendingUp, TrendingDown, DollarSign, Target, Calendar, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { motion } from 'motion/react';

const chartData = [
  { name: 'Mai', receita: 4000, despesa: 2400 },
  { name: 'Jun', receita: 3000, despesa: 1398 },
  { name: 'Jul', receita: 2000, despesa: 9800 },
  { name: 'Ago', receita: 2780, despesa: 3908 },
  { name: 'Set', receita: 1890, despesa: 4800 },
  { name: 'Out', receita: 2390, despesa: 3800 },
  { name: 'Nov', receita: 3490, despesa: 4300 },
];

const patrimonioData = [
  { name: 'Jan', valor: 10000 },
  { name: 'Fev', valor: 12000 },
  { name: 'Mar', valor: 15000 },
  { name: 'Abr', valor: 14000 },
  { name: 'Mai', valor: 18000 },
  { name: 'Jun', valor: 22000 },
];

export function DashboardPage() {
  const { transactions, goals, creditCards } = useFinance();

  const totalReceita = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalDespesa = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const lucro = totalReceita - totalDespesa;
  const rendaComprometida = totalReceita > 0 ? (totalDespesa / totalReceita) * 100 : 0;

  const totalMetas = goals.reduce((acc, curr) => acc + curr.currentAmount, 0);
  const proximasContas = creditCards.reduce((acc, curr) => acc + curr.currentInvoice, 0);

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
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium text-gray-600">Saúde Financeira: Excelente</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Receita Total" 
          value={`R$ ${totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
          trend="+12% vs mês anterior"
          trendUp={true}
        />
        <MetricCard 
          title="Despesas Totais" 
          value={`R$ ${totalDespesa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<TrendingDown className="w-5 h-5 text-red-500" />}
          trend="-5% vs mês anterior"
          trendUp={false}
        />
        <MetricCard 
          title="Lucro do Mês" 
          value={`R$ ${lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={<DollarSign className="w-5 h-5 text-blue-500" />}
          trend="+18% vs mês anterior"
          trendUp={true}
        />
        <MetricCard 
          title="Renda Comprometida" 
          value={`${rendaComprometida.toFixed(1)}%`}
          icon={<Activity className="w-5 h-5 text-orange-500" />}
          trend="Dentro do limite ideal"
          trendUp={true}
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

      <Card>
        <CardHeader>
          <CardTitle>Evolução Patrimonial Simulada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={patrimonioData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF4D00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF4D00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEAEA" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#555555', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#555555', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                />
                <Area type="monotone" dataKey="valor" stroke="#FF4D00" strokeWidth={3} fillOpacity={1} fill="url(#colorValor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MetricCard({ title, value, icon, trend, trendUp }: { title: string, value: string, icon: React.ReactNode, trend: string, trendUp: boolean }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
            {icon}
          </div>
        </div>
        <h3 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">{value}</h3>
        <p className={`text-xs font-medium ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
          {trend}
        </p>
      </CardContent>
    </Card>
  );
}

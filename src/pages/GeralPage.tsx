import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useFinance } from '@/context/FinanceContext';
import { Plus, Edit2, Trash2, PieChart } from 'lucide-react';
import { motion } from 'motion/react';

export function GeralPage() {
  const { recurringIncomes, fixedExpenses, profitRules } = useFinance();

  const totalIncome = recurringIncomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalFixedExpenses = fixedExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const estimatedProfit = totalIncome - totalFixedExpenses;
  
  const totalPercentage = profitRules.reduce((acc, curr) => acc + curr.percentage, 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Geral</h1>
        <p className="text-gray-500 mt-1">Configure sua base financeira permanente.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Rendas Recorrentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Rendas Recorrentes</CardTitle>
            <button className="p-2 bg-[#FF4D00]/10 text-[#FF4D00] rounded-lg hover:bg-[#FF4D00]/20 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 font-medium">Descrição</th>
                    <th className="px-6 py-3 font-medium">Valor</th>
                    <th className="px-6 py-3 font-medium">Dia</th>
                    <th className="px-6 py-3 font-medium">Fonte</th>
                    <th className="px-6 py-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {recurringIncomes.map((income) => (
                    <tr key={income.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{income.description}</td>
                      <td className="px-6 py-4 text-emerald-600 font-medium">R$ {income.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-gray-500">{income.day}</td>
                      <td className="px-6 py-4 text-gray-500">
                        <span className="bg-gray-100 px-2 py-1 rounded-md text-xs">{income.source}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="text-gray-400 hover:text-[#FF4D00] transition-colors"><Edit2 className="w-4 h-4" /></button>
                          <button className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Total Rendas</span>
              <span className="text-lg font-bold text-emerald-600">R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </CardContent>
        </Card>

        {/* Despesas Fixas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Despesas Fixas</CardTitle>
            <button className="p-2 bg-[#FF4D00]/10 text-[#FF4D00] rounded-lg hover:bg-[#FF4D00]/20 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 font-medium">Descrição</th>
                    <th className="px-6 py-3 font-medium">Categoria</th>
                    <th className="px-6 py-3 font-medium">Valor</th>
                    <th className="px-6 py-3 font-medium">Dia</th>
                    <th className="px-6 py-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {fixedExpenses.map((expense) => (
                    <tr key={expense.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{expense.description}</td>
                      <td className="px-6 py-4 text-gray-500">
                        <span className="bg-gray-100 px-2 py-1 rounded-md text-xs">{expense.category}</span>
                      </td>
                      <td className="px-6 py-4 text-red-600 font-medium">R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-gray-500">{expense.day}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="text-gray-400 hover:text-[#FF4D00] transition-colors"><Edit2 className="w-4 h-4" /></button>
                          <button className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Total Despesas Fixas</span>
              <span className="text-lg font-bold text-red-600">R$ {totalFixedExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Regras de Distribuição */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Regras de Distribuição</CardTitle>
            <button className="p-2 text-gray-400 hover:text-[#FF4D00] transition-colors">
              <Edit2 className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profitRules.map(rule => (
                <div key={rule.id} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{rule.name}</span>
                  <span className="text-sm font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-md">{rule.percentage}%</span>
                </div>
              ))}
              
              <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Total Alocado</span>
                <span className={`text-sm font-bold px-2 py-1 rounded-md ${totalPercentage === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {totalPercentage}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cálculo Automático Visual */}
        <Card className="lg:col-span-2 bg-[#1A1A1A] text-white border-none">
          <CardHeader className="border-white/10">
            <CardTitle className="text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-[#FF4D00]" />
              Distribuição do Lucro Estimado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-8">
              <p className="text-white/60 text-sm mb-1">Lucro Estimado (Receita - Despesas Fixas)</p>
              <h3 className="text-4xl font-bold tracking-tight text-white">
                R$ {estimatedProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {profitRules.map(rule => {
                const value = (estimatedProfit * rule.percentage) / 100;
                return (
                  <div key={rule.id} className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-white/80">{rule.name}</span>
                      <span className="text-xs font-bold text-[#FF4D00] bg-[#FF4D00]/10 px-2 py-1 rounded-md">{rule.percentage}%</span>
                    </div>
                    <p className="text-xl font-bold text-white">R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

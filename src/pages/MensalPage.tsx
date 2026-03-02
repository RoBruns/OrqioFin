import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useFinance } from '@/context/FinanceContext';
import { ChevronLeft, ChevronRight, Plus, Filter, CreditCard as CreditCardIcon, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'motion/react';

export function MensalPage() {
  const { transactions, creditCards, pockets } = useFinance();
  const [currentMonth, setCurrentMonth] = useState('Outubro 2023');

  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const expenseTransactions = transactions.filter(t => t.type === 'expense');

  const realIncome = incomeTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const realExpense = expenseTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const realProfit = realIncome - realExpense;

  // Mock predicted values
  const predictedIncome = 6500;
  const predictedExpense = 4000;
  const predictedProfit = predictedIncome - predictedExpense;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Controle Mensal</h1>
          <p className="text-gray-500 mt-1">Acompanhe suas receitas, despesas e orçamentos.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
          <button className="p-1 hover:bg-gray-100 rounded-md transition-colors"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
          <span className="font-semibold text-gray-900 min-w-[120px] text-center">{currentMonth}</span>
          <button className="p-1 hover:bg-gray-100 rounded-md transition-colors"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
        </div>
      </div>

      {/* Resumo do Mês */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard 
          title="Receita" 
          real={realIncome} 
          predicted={predictedIncome} 
          icon={<ArrowUpRight className="w-5 h-5 text-emerald-500" />} 
          colorClass="text-emerald-600"
        />
        <SummaryCard 
          title="Despesa" 
          real={realExpense} 
          predicted={predictedExpense} 
          icon={<ArrowDownRight className="w-5 h-5 text-red-500" />} 
          colorClass="text-red-600"
        />
        <SummaryCard 
          title="Lucro" 
          real={realProfit} 
          predicted={predictedProfit} 
          icon={<Wallet className="w-5 h-5 text-blue-500" />} 
          colorClass="text-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transações */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Transações do Mês</CardTitle>
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                <Filter className="w-4 h-4" />
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-[#FF4D00] text-white rounded-lg hover:bg-[#E64500] transition-colors text-sm font-medium shadow-md shadow-[#FF4D00]/20">
                <Plus className="w-4 h-4" />
                Nova
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 font-medium">Data</th>
                    <th className="px-6 py-3 font-medium">Descrição</th>
                    <th className="px-6 py-3 font-medium">Categoria</th>
                    <th className="px-6 py-3 font-medium">Forma</th>
                    <th className="px-6 py-3 font-medium text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-gray-500">{new Date(tx.date).toLocaleDateString('pt-BR')}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{tx.description}</td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-100 px-2 py-1 rounded-md text-xs text-gray-600">{tx.category}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{tx.paymentMethod}</td>
                      <td className={`px-6 py-4 text-right font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {/* Cartões de Crédito */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCardIcon className="w-5 h-5 text-[#FF4D00]" />
                Cartões de Crédito
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {creditCards.map(card => (
                <div key={card.id} className="p-4 border border-gray-100 rounded-xl hover:shadow-md transition-shadow bg-white">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-gray-900">{card.name}</h4>
                      <p className="text-xs text-gray-500">Vence dia {card.dueDay} • Fecha dia {card.closingDay}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${card.status === 'Paga' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                      {card.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-sm text-gray-500">Fatura atual</span>
                    <span className="text-lg font-bold text-gray-900">R$ {card.currentInvoice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Bolsos (Orçamento) */}
          <Card>
            <CardHeader>
              <CardTitle>Orçamento por Categoria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {pockets.map(pocket => {
                const percentage = Math.min((pocket.usedAmount / pocket.allocatedAmount) * 100, 100);
                const isOverBudget = pocket.usedAmount > pocket.allocatedAmount;
                
                return (
                  <div key={pocket.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">{pocket.name}</span>
                      <span className="text-sm font-bold text-gray-900">
                        R$ {pocket.usedAmount.toLocaleString('pt-BR')} <span className="text-gray-400 font-normal">/ R$ {pocket.allocatedAmount.toLocaleString('pt-BR')}</span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-red-500' : 'bg-[#FF4D00]'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">{percentage.toFixed(0)}% utilizado</span>
                      <span className={isOverBudget ? 'text-red-500 font-medium' : 'text-emerald-500 font-medium'}>
                        {isOverBudget ? 'Estourou R$ ' : 'Resta R$ '}
                        {Math.abs(pocket.allocatedAmount - pocket.usedAmount).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

function SummaryCard({ title, real, predicted, icon, colorClass }: { title: string, real: number, predicted: number, icon: React.ReactNode, colorClass: string }) {
  const diff = real - predicted;
  const diffPercentage = predicted > 0 ? (diff / predicted) * 100 : 0;
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
            {icon}
          </div>
        </div>
        <div className="flex items-end gap-3 mb-2">
          <h3 className={`text-3xl font-bold tracking-tight ${colorClass}`}>
            R$ {real.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Previsto: R$ {predicted.toLocaleString('pt-BR')}</span>
          <span className={`font-medium ${diff > 0 ? (title === 'Despesa' ? 'text-red-500' : 'text-emerald-500') : (title === 'Despesa' ? 'text-emerald-500' : 'text-red-500')}`}>
            {diff > 0 ? '+' : ''}{diffPercentage.toFixed(1)}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

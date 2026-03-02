import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useFinance } from '@/context/FinanceContext';
import { Target, Plus, TrendingUp, Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export function MetasPage() {
  const { goals } = useFinance();

  const totalTarget = goals.reduce((acc, curr) => acc + curr.targetAmount, 0);
  const totalCurrent = goals.reduce((acc, curr) => acc + curr.currentAmount, 0);
  const totalPercentage = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Metas Financeiras</h1>
          <p className="text-gray-500 mt-1">Acompanhe seus objetivos e sonhos.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#FF4D00] text-white rounded-xl hover:bg-[#E64500] transition-colors text-sm font-medium shadow-lg shadow-[#FF4D00]/20">
          <Plus className="w-4 h-4" />
          Nova Meta
        </button>
      </div>

      {/* Resumo Geral Metas */}
      <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white border-none shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF4D00] rounded-full filter blur-[100px] opacity-20 translate-x-1/2 -translate-y-1/2" />
        <CardContent className="p-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="space-y-2">
              <p className="text-gray-400 font-medium text-sm uppercase tracking-wider">Progresso Geral</p>
              <h2 className="text-5xl font-bold tracking-tight">{totalPercentage.toFixed(1)}%</h2>
            </div>
            <div className="md:col-span-2 space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Acumulado</p>
                  <p className="text-2xl font-bold">R$ {totalCurrent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm mb-1">Objetivo Total</p>
                  <p className="text-2xl font-bold text-gray-300">R$ {totalTarget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
              <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${totalPercentage}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-[#FF4D00] to-orange-400 rounded-full"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Metas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {goals.map((goal, index) => {
          const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          const remaining = goal.targetAmount - goal.currentAmount;
          const monthsLeft = Math.ceil(remaining / goal.plannedMonthlyContribution);
          
          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow duration-300 border border-gray-100 group">
                <CardContent className="p-6 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#FF4D00]/10 flex items-center justify-center group-hover:bg-[#FF4D00] transition-colors duration-300">
                        <Target className="w-6 h-6 text-[#FF4D00] group-hover:text-white transition-colors duration-300" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{goal.name}</h3>
                        <p className="text-sm text-gray-500 font-medium mt-1">
                          Aporte mensal: R$ {goal.plannedMonthlyContribution.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100">
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-3xl font-bold tracking-tight text-gray-900">
                        R$ {goal.currentAmount.toLocaleString('pt-BR')}
                      </span>
                      <span className="text-sm font-medium text-gray-500 mb-1">
                        de R$ {goal.targetAmount.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: 0.4 + (index * 0.1) }}
                        className="h-full bg-[#FF4D00] rounded-full"
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-[#FF4D00]">{percentage.toFixed(1)}% concluído</span>
                      <span className="text-gray-500 font-medium">Faltam R$ {remaining.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>Previsão: <strong className="text-gray-900">{new Date(goal.estimatedCompletionDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                      <span>Faltam <strong className="text-gray-900">{monthsLeft} meses</strong></span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

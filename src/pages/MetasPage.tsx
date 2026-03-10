import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useFinance } from '@/context/FinanceContext';
import { Target, Plus, TrendingUp, Calendar, Edit2, Trash2, PieChart, TrendingDown, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import type { Goal, Investment } from '@/types/finance';
import { InvestmentForm } from '@/components/InvestmentForm';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function MetasPage() {
  useDocumentTitle('Metas');
  const { goals, addGoal, updateGoal, deleteGoal, investments, addInvestment, updateInvestment, deleteInvestment, marketPrices, refreshMarketPrices } = useFinance();
  const [activeTab, setActiveTab] = useState<'metas' | 'investimentos'>('metas');

  useEffect(() => {
    refreshMarketPrices();
  }, [refreshMarketPrices]);

  const totalTarget = goals.reduce((acc, curr) => acc + curr.targetAmount, 0);
  const totalCurrent = goals.reduce((acc, curr) => acc + curr.currentAmount, 0);
  const totalPercentage = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

  // Goals Modal State
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const handleSaveGoal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get('name') as string,
      targetAmount: Number(fd.get('targetAmount')),
      currentAmount: Number(fd.get('currentAmount')),
      plannedMonthlyContribution: Number(fd.get('plannedMonthlyContribution')),
      estimatedCompletionDate: '' // Will be derived or unused currently
    };

    if (editingGoal) {
      await updateGoal(editingGoal.id, data);
    } else {
      await addGoal(data);
    }
    setGoalModalOpen(false);
  };

  // Investments Logic
  const getCurrentValue = (inv: Investment) => {
    if ((inv.assetType === 'Ação' || inv.assetType === 'Criptomoeda') && inv.assetName) {
      const price = marketPrices[inv.assetName.toUpperCase()];
      if (price !== undefined && price !== null) {
        return price * inv.quantity;
      }
    } else if (inv.assetType === 'Renda Fixa' || inv.assetType === 'Outros') {
      // If annual yield is set, calculate compound interest
      if (inv.annualYield && inv.annualYield > 0 && inv.startDate) {
        const start = new Date(inv.startDate);
        const now = new Date();
        const daysElapsed = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        if (daysElapsed > 0) {
          const dailyRate = Math.pow(1 + inv.annualYield / 100, 1 / 252) - 1;
          return inv.investedAmount * Math.pow(1 + dailyRate, daysElapsed);
        }
      }
      return Number(inv.quantity) > 0 ? Number(inv.quantity) : inv.investedAmount;
    }
    return inv.investedAmount;
  };

  const totalInvested = investments.reduce((acc, curr) => acc + curr.investedAmount, 0);
  const totalCurrentValue = investments.reduce((acc, curr) => acc + getCurrentValue(curr), 0);
  const totalProfit = totalCurrentValue - totalInvested;
  const totalProfitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  // Investment Modal State
  const [invModalOpen, setInvModalOpen] = useState(false);
  const [editingInv, setEditingInv] = useState<Investment | null>(null);
  // New components handles Investment saving, so removed local handleSaveInvestment

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-10"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Metas & Carteira</h1>
          <p className="text-gray-500 mt-1">Acompanhe seus objetivos e portfólio de investimentos.</p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'investimentos' && (
            <button
              onClick={() => refreshMarketPrices()}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
              title="Atualizar cotações do mercado"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
          )}
          <button
            onClick={() => {
              if (activeTab === 'metas') {
                setEditingGoal(null);
                setGoalModalOpen(true);
              } else {
                setEditingInv(null);
                setInvModalOpen(true);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF4D00] text-white rounded-xl hover:bg-[#E64500] transition-colors text-sm font-medium shadow-lg shadow-[#FF4D00]/20"
          >
            <Plus className="w-4 h-4" />
            {activeTab === 'metas' ? 'Nova Meta' : 'Novo Ativo'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('metas')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'metas' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
        >
          Metas Financeiras
        </button>
        <button
          onClick={() => setActiveTab('investimentos')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'investimentos' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
        >
          Carteira / Investimentos
        </button>
      </div>

      {activeTab === 'metas' ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
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
              const percentage = Math.min(goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0, 100);
              const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
              const monthsLeft = goal.plannedMonthlyContribution > 0 ? Math.ceil(remaining / goal.plannedMonthlyContribution) : 0;

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow duration-300 border border-gray-100 group relative">

                    {/* Ações Visíveis no Hover */}
                    <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button onClick={() => { setEditingGoal(goal); setGoalModalOpen(true); }} className="p-2 bg-white text-gray-400 hover:text-[#FF4D00] rounded-full shadow-sm hover:shadow transition-all"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => { if (confirm('Excluir meta?')) deleteGoal(goal.id); }} className="p-2 bg-white text-gray-400 hover:text-red-500 rounded-full shadow-sm hover:shadow transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>

                    <CardContent className="p-6 space-y-6">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-[#FF4D00]/10 flex items-center justify-center group-hover:bg-[#FF4D00] transition-colors duration-300">
                            <Target className="w-6 h-6 text-[#FF4D00] group-hover:text-white transition-colors duration-300" />
                          </div>
                          <div className="pr-16">
                            <h3 className="text-xl font-bold text-gray-900 truncate">{goal.name}</h3>
                            <p className="text-sm text-gray-500 font-medium mt-1">
                              Aporte mensal: R$ {goal.plannedMonthlyContribution.toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
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
                          <span>Previsão: <strong className="text-gray-900">{typeof goal.estimatedCompletionDate === 'string' && goal.estimatedCompletionDate.length > 5 ? new Date(goal.estimatedCompletionDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : 'N/A'}</strong></span>
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
            {goals.length === 0 && (
              <div className="col-span-1 lg:col-span-2 text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm border-dashed">
                <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma meta definida</h3>
                <p className="text-sm text-gray-500 mb-4">Que tal criar sua primeira meta financeira?</p>
                <button onClick={() => { setEditingGoal(null); setGoalModalOpen(true); }} className="px-4 py-2 bg-[#FF4D00]/10 text-[#FF4D00] hover:bg-[#FF4D00]/20 rounded-lg text-sm font-medium transition-colors">
                  Criar Primeira Meta
                </button>
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          {/* Resumo Carteira */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-gray-500 mb-1">Total Investido</p>
                <h3 className="text-2xl font-bold text-gray-900">R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-[#FF4D00]">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-gray-500 mb-1">Saldo Atual (Patrimônio)</p>
                <h3 className="text-2xl font-bold text-[#FF4D00]">R$ {totalCurrentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-gray-500 mb-1">Rentabilidade</p>
                <div className="flex items-baseline gap-2">
                  <h3 className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {totalProfit > 0 ? '+' : ''}R$ {totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h3>
                  <span className={`text-sm font-medium ${totalProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    ({totalProfit > 0 ? '+' : ''}{totalProfitPercentage.toFixed(2)}%)
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Investimentos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-[#FF4D00]" />
                Meus Ativos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 font-medium">Ativo / Tipo</th>
                      <th className="px-6 py-3 font-medium">Qtd & Preço Atual</th>
                      <th className="px-6 py-3 font-medium">Investido</th>
                      <th className="px-6 py-3 font-medium text-right">Saldo Atual</th>
                      <th className="px-6 py-3 font-medium text-right">Lucro/Prejuízo</th>
                      <th className="px-6 py-3 font-medium text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investments.map((inv) => {
                      const currentVal = getCurrentValue(inv);
                      let profit = currentVal - inv.investedAmount;
                      let profitPerc = inv.investedAmount > 0 ? (profit / inv.investedAmount) * 100 : 0;

                      const isVolatile = inv.assetType === 'Ação' || inv.assetType === 'Criptomoeda';
                      const currentPrice = isVolatile && inv.assetName ? marketPrices[inv.assetName.toUpperCase()] : null;

                      if (isVolatile && inv.purchasePrice && currentPrice) {
                        profit = (currentPrice - inv.purchasePrice) * inv.quantity;
                        profitPerc = ((currentPrice - inv.purchasePrice) / inv.purchasePrice) * 100;
                      }

                      const isFixed = inv.assetType === 'Renda Fixa' || inv.assetType === 'Outros';
                      const monthlyYield = isFixed && inv.annualYield ? (Math.pow(1 + inv.annualYield / 100, 1 / 12) - 1) * 100 : 0;

                      return (
                        <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-900">{inv.assetName}</p>
                            <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] text-gray-600 font-medium uppercase tracking-wider">{inv.assetType}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {isVolatile ? inv.quantity : '1'}
                            {isVolatile && currentPrice ? (
                              <div className="mt-1 space-y-1">
                                <span className="block text-xs text-gray-500">
                                  Atual: <strong className="text-gray-900">R$ {currentPrice.toFixed(2)}</strong>
                                </span>
                                {inv.purchasePrice && (
                                  <span className="block text-xs text-gray-500">
                                    Compra: <strong className="text-gray-900">R$ {inv.purchasePrice.toFixed(2)}</strong>
                                  </span>
                                )}
                                {inv.purchasePrice && currentPrice && (
                                  <span className={`block text-[10px] font-medium ${currentPrice >= inv.purchasePrice ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {((currentPrice - inv.purchasePrice) / inv.purchasePrice * 100).toFixed(2)}% (R$ {Math.abs(currentPrice - inv.purchasePrice).toFixed(2)})
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="mt-1 space-y-1">
                                <span className="block text-xs text-gray-800 font-medium">
                                  {inv.annualYield}% a.a.
                                </span>
                                <span className="block text-xs text-gray-500">
                                  ≈ {monthlyYield.toFixed(2)}% ao mês
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-700">
                            R$ {inv.investedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-gray-900">
                            R$ {currentVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className={`flex items-center justify-end gap-1 ${profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                              {profit > 0 ? <ArrowUpRight className="w-4 h-4" /> : (profit < 0 ? <ArrowDownRight className="w-4 h-4" /> : null)}
                              <span className="font-medium">
                                R$ {profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <p className={`text-xs ${profit >= 0 ? 'text-emerald-500/70' : 'text-red-500/70'}`}>
                              {profit > 0 ? '+' : ''}{profitPerc.toFixed(2)}%
                            </p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditingInv(inv); setInvModalOpen(true); }} className="text-gray-400 hover:text-[#FF4D00] transition-colors"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => { if (confirm('Excluir investimento?')) deleteInvestment(inv.id); }} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {investments.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-8 text-gray-400">Nenhum investimento registrado.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
      {/* Goal Modal */}
      <Modal isOpen={goalModalOpen} onClose={() => setGoalModalOpen(false)} title={editingGoal ? "Editar Meta" : "Nova Meta"}>
        <form onSubmit={handleSaveGoal} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Meta</label>
            <input required name="name" defaultValue={editingGoal?.name} placeholder="Ex: Viagem Europa, Carro Novo..." className="w-full p-2 border border-gray-200 rounded-lg focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor Objetivo (R$)</label>
              <input required type="number" step="0.01" min="0" name="targetAmount" defaultValue={editingGoal?.targetAmount} className="w-full p-2 border border-gray-200 rounded-lg focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor Atual Salvo (R$)</label>
              <input required type="number" step="0.01" min="0" name="currentAmount" defaultValue={editingGoal?.currentAmount || 0} className="w-full p-2 border border-gray-200 rounded-lg focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aporte Mensal Planejado (R$)</label>
            <input required type="number" step="0.01" min="0" name="plannedMonthlyContribution" defaultValue={editingGoal?.plannedMonthlyContribution} className="w-full p-2 border border-gray-200 rounded-lg focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] outline-none" />
          </div>
          <button type="submit" className="w-full bg-[#FF4D00] text-white font-medium py-2 rounded-lg hover:bg-[#FF4D00]/90 transition-colors mt-2 text-sm shadow-md">
            Salvar Meta
          </button>
        </form>
      </Modal>

      {/* Investment Modal */}
      <Modal isOpen={invModalOpen} onClose={() => setInvModalOpen(false)} title={editingInv ? "Editar Investimento" : "Novo Ativo"}>
        <InvestmentForm onClose={() => setInvModalOpen(false)} editingInv={editingInv} goals={goals} />
      </Modal>

    </motion.div>
  );
}

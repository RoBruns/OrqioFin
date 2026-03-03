import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useFinance } from '@/context/FinanceContext';
import { Plus, Edit2, Trash2, PieChart, Wallet, CreditCard as CreditCardIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { MonthPicker } from '@/components/ui/MonthPicker';
import type { RecurringIncome, FixedExpense, ProfitRule, CreditCard, Invoice, ManualInvoice } from '@/types/finance';

export function GeralPage() {
  const {
    recurringIncomes, fixedExpenses, profitRules, creditCards,
    addRecurringIncome, updateRecurringIncome, deleteRecurringIncome,
    addFixedExpense, updateFixedExpense, deleteFixedExpense,
    addProfitRule, updateProfitRule, deleteProfitRule,
    addCreditCard, updateCreditCard, deleteCreditCard,
    invoices, addManualInvoice, updateManualInvoice, deleteManualInvoice
  } = useFinance();

  const totalIncome = recurringIncomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalFixedExpenses = fixedExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const estimatedProfit = totalIncome - totalFixedExpenses;
  const totalPercentage = profitRules.reduce((acc, curr) => acc + curr.percentage, 0);

  // States for Incomes
  const [incModalOpen, setIncModalOpen] = useState(false);
  const [editingInc, setEditingInc] = useState<RecurringIncome | null>(null);

  // States for Expenses
  const [expModalOpen, setExpModalOpen] = useState(false);
  const [editingExp, setEditingExp] = useState<FixedExpense | null>(null);

  // States for Rules
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ProfitRule | null>(null);

  // States for Cards
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

  // States for Invoices
  const [manualInvoiceModalOpen, setManualInvoiceModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [selectedMonthFatura, setSelectedMonthFatura] = useState<string>(new Date().toISOString().substring(0, 7)); // YYYY-MM


  // Tab State
  const [activeTab, setActiveTab] = useState<'contas' | 'lucro' | 'cartoes' | 'faturas'>('contas');

  const handleSaveIncome = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      description: fd.get('description') as string,
      amount: Number(fd.get('amount')),
      day: Number(fd.get('day')),
      source: fd.get('source') as string || ''
    };

    if (editingInc) {
      await updateRecurringIncome(editingInc.id, data);
    } else {
      await addRecurringIncome(data);
    }
    setIncModalOpen(false);
  };

  const handleSaveExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      description: fd.get('description') as string,
      category: fd.get('category') as string,
      amount: Number(fd.get('amount')),
      day: Number(fd.get('day'))
    };

    if (editingExp) {
      await updateFixedExpense(editingExp.id, data);
    } else {
      await addFixedExpense(data);
    }
    setExpModalOpen(false);
  };

  const handleSaveRule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get('name') as string,
      percentage: Number(fd.get('percentage'))
    };

    if (editingRule) {
      await updateProfitRule(editingRule.id, data);
    } else {
      await addProfitRule(data);
    }
    setRuleModalOpen(false);
  };

  const handleSaveCard = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get('name') as string,
      closingDay: Number(fd.get('closingDay')),
      dueDay: Number(fd.get('dueDay'))
    };

    if (editingCard) {
      await updateCreditCard(editingCard.id, data);
    } else {
      await addCreditCard(data);
    }
    setCardModalOpen(false);
  };

  const handleSaveManualInvoice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    let creditCardId = fd.get('creditCardId') as string;
    let referenceMonth = fd.get('referenceMonth') as string;
    let dueDate = fd.get('dueDate') as string;

    const data = {
      creditCardId,
      referenceMonth, // Ex: "2026-02"
      amount: Number(fd.get('amount')),
      dueDate, // Ex: "2026-03-05"
      status: fd.get('status') as 'Paga' | 'Pendente'
    };

    if (editingInvoice) {
      if (editingInvoice.id.startsWith('manual-')) {
        await updateManualInvoice(editingInvoice.id.replace('manual-', ''), data);
      } else {
        await addManualInvoice(data);
      }
    } else {
      await addManualInvoice(data);
    }
    setEditingInvoice(null);
    setManualInvoiceModalOpen(false);
  };

  // Recharts Data for "Faturas" evolution
  const invoicesByMonth = invoices.reduce((acc, inv) => {
    const month = inv.dueDate.substring(0, 7); // YYYY-MM
    acc[month] = (acc[month] || 0) + inv.amount;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.keys(invoicesByMonth)
    .sort()
    .slice(-6)
    .map(month => ({
      name: `${month.substring(5, 7)}/${month.substring(0, 4)}`, // MM/YYYY
      total: invoicesByMonth[month]
    }));

  const filteredInvoices = invoices.filter(inv => inv.dueDate.substring(0, 7) === selectedMonthFatura);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-10"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Geral</h1>
        <p className="text-gray-500 mt-1">Configure sua base financeira permanente.</p>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('contas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'contas' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Wallet className="w-4 h-4" />
          Rendas e Despesas
        </button>
        <button
          onClick={() => setActiveTab('lucro')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'lucro' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <PieChart className="w-4 h-4" />
          Distribuição de Lucro
        </button>
        <button
          onClick={() => setActiveTab('cartoes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'cartoes' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <CreditCardIcon className="w-4 h-4" />
          Cartões
        </button>
        <button
          onClick={() => setActiveTab('faturas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'faturas' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <PieChart className="w-4 h-4" />
          Faturas
        </button>
      </div>

      {activeTab === 'contas' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Rendas Recorrentes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Rendas Recorrentes</CardTitle>
              <button
                onClick={() => { setEditingInc(null); setIncModalOpen(true); }}
                className="p-2 bg-[#FF4D00]/10 text-[#FF4D00] rounded-lg hover:bg-[#FF4D00]/20 transition-colors"
              >
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
                      <th className="px-6 py-3 font-medium text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recurringIncomes.map((income) => (
                      <tr key={income.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{income.description}</td>
                        <td className="px-6 py-4 text-emerald-600 font-medium">R$ {income.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 text-gray-500">{income.day}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => { setEditingInc(income); setIncModalOpen(true); }} className="text-gray-400 hover:text-[#FF4D00] transition-colors"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => { if (confirm('Excluir renda?')) deleteRecurringIncome(income.id); }} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {recurringIncomes.length === 0 && (
                      <tr><td colSpan={4} className="text-center py-6 text-gray-400">Nenhuma renda cadastrada.</td></tr>
                    )}
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
              <button
                onClick={() => { setEditingExp(null); setExpModalOpen(true); }}
                className="p-2 bg-[#FF4D00]/10 text-[#FF4D00] rounded-lg hover:bg-[#FF4D00]/20 transition-colors"
              >
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
                      <th className="px-6 py-3 font-medium text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fixedExpenses.map((expense) => (
                      <tr key={expense.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{expense.description}</td>
                        <td className="px-6 py-4 text-red-600 font-medium">R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 text-gray-500">{expense.day}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => { setEditingExp(expense); setExpModalOpen(true); }} className="text-gray-400 hover:text-[#FF4D00] transition-colors"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => { if (confirm('Excluir despesa?')) deleteFixedExpense(expense.id); }} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {fixedExpenses.length === 0 && (
                      <tr><td colSpan={4} className="text-center py-6 text-gray-400">Nenhuma despesa fixa cadastrada.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Total Despesas Fixas</span>
                <span className="text-lg font-bold text-red-600">R$ {totalFixedExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {activeTab === 'lucro' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Regras de Distribuição */}
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Regras de Distribuição</CardTitle>
              <button
                onClick={() => { setEditingRule(null); setRuleModalOpen(true); }}
                className="p-2 text-gray-400 hover:text-[#FF4D00] transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profitRules.map(rule => (
                  <div key={rule.id} className="flex items-center justify-between group">
                    <span className="text-sm font-medium text-gray-700">{rule.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-md">{rule.percentage}%</span>
                      <button onClick={() => { setEditingRule(rule); setRuleModalOpen(true); }} className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-[#FF4D00] transition-all"><Edit2 className="w-3 h-3" /></button>
                      <button onClick={() => { if (confirm('Excluir esta regra?')) deleteProfitRule(rule.id); }} className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
                {profitRules.length === 0 && (
                  <div className="text-center py-4 text-gray-400 text-sm">Nenhuma regra definida.</div>
                )}

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
                  const value = (estimatedProfit > 0 ? estimatedProfit : 0) * (rule.percentage / 100);
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
        </motion.div>
      )}

      {activeTab === 'cartoes' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Cartões de Crédito */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Cartões de Crédito</CardTitle>
              <button
                onClick={() => { setEditingCard(null); setCardModalOpen(true); }}
                className="p-2 bg-[#FF4D00]/10 text-[#FF4D00] rounded-lg hover:bg-[#FF4D00]/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 font-medium">Nome do Cartão</th>
                      <th className="px-6 py-3 font-medium">Fechamento</th>
                      <th className="px-6 py-3 font-medium">Vencimento</th>
                      <th className="px-6 py-3 font-medium text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creditCards.map((card) => (
                      <tr key={card.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{card.name}</td>
                        <td className="px-6 py-4 text-gray-500">Dia {card.closingDay}</td>
                        <td className="px-6 py-4 text-gray-500">Dia {card.dueDay}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => { setEditingCard(card); setCardModalOpen(true); }} className="text-gray-400 hover:text-[#FF4D00] transition-colors"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => { if (confirm('Excluir este cartão?')) deleteCreditCard(card.id); }} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {creditCards.length === 0 && (
                      <tr><td colSpan={4} className="text-center py-6 text-gray-400">Nenhum cartão de crédito cadastrado.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {activeTab === 'faturas' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Gráfico das faturas */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Histórico Recente de Faturas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF4D00" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#FF4D00" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(value) => `R$${value}`} />
                    <Tooltip
                      formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Total da Fatura']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="total" stroke="#FF4D00" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Faturas */}
          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <CardTitle>Controle de Faturas</CardTitle>
                <div className="w-[200px]">
                  <MonthPicker
                    value={selectedMonthFatura}
                    onChange={(val) => setSelectedMonthFatura(val)}
                  />
                </div>
              </div>
              <button
                onClick={() => { setEditingInvoice(null); setManualInvoiceModalOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-[#FF4D00] text-white rounded-lg hover:bg-[#FF4D00]/90 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Inserir Fatura Manual
              </button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 font-medium">Cartão</th>
                      <th className="px-6 py-3 font-medium">Vencimento</th>
                      <th className="px-6 py-3 font-medium">Situação</th>
                      <th className="px-6 py-3 font-medium">Valor Total</th>
                      <th className="px-6 py-3 font-medium text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((inv) => (
                      <tr
                        key={inv.id}
                        className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedInvoice(inv)}
                      >
                        <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                          <CreditCardIcon className="w-4 h-4 text-gray-400" />
                          {inv.cardName}
                          {inv.isManual && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full ml-2">Editada/Manual</span>}
                        </td>
                        <td className="px-6 py-4 text-gray-500">{inv.dueDate.split('-').reverse().join('/')}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${inv.status === 'Paga' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">
                          R$ {inv.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingInvoice(inv);
                                setManualInvoiceModalOpen(true);
                              }}
                              className="text-gray-400 hover:text-[#FF4D00] transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {inv.isManual && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Restaurar para Fatural Original/Excluir?')) deleteManualInvoice(inv.id.replace('manual-', ''));
                                }}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {invoices.length === 0 && (
                      <tr><td colSpan={5} className="text-center py-6 text-gray-400">Nenhuma fatura encontrada.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Modals */}
      <Modal isOpen={incModalOpen} onClose={() => setIncModalOpen(false)} title={editingInc ? "Editar Renda" : "Nova Renda Recorrente"}>
        <form onSubmit={handleSaveIncome} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input required name="description" defaultValue={editingInc?.description} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
            <input required type="number" step="0.01" name="amount" defaultValue={editingInc?.amount} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dia do Recebimento</label>
            <input required type="number" min="1" max="31" name="day" defaultValue={editingInc?.day} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00]" />
          </div>
          <button type="submit" className="w-full bg-[#FF4D00] text-white font-medium py-2 rounded-lg hover:bg-[#FF4D00]/90 transition-colors">
            Salvar
          </button>
        </form>
      </Modal>

      <Modal isOpen={expModalOpen} onClose={() => setExpModalOpen(false)} title={editingExp ? "Editar Despesa Fixa" : "Nova Despesa Fixa"}>
        <form onSubmit={handleSaveExpense} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input required name="description" defaultValue={editingExp?.description} className="w-full p-2 border border-gray-200 rounded-lg hover:border-gray-300 focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
              <input required type="number" step="0.01" name="amount" defaultValue={editingExp?.amount} className="w-full p-2 border border-gray-200 rounded-lg focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dia (Venc)</label>
              <input required type="number" min="1" max="31" name="day" defaultValue={editingExp?.day} className="w-full p-2 border border-gray-200 rounded-lg focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <input required name="category" defaultValue={editingExp?.category} className="w-full p-2 border border-gray-200 rounded-lg focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] outline-none" />
          </div>
          <button type="submit" className="w-full bg-[#FF4D00] text-white font-medium py-2 rounded-lg hover:bg-[#FF4D00]/90 transition-colors mt-2">
            Salvar
          </button>
        </form>
      </Modal>

      <Modal isOpen={ruleModalOpen} onClose={() => setRuleModalOpen(false)} title={editingRule ? "Editar Regra" : "Nova Regra"}>
        <form onSubmit={handleSaveRule} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Regra</label>
            <input required name="name" defaultValue={editingRule?.name} className="w-full p-2 border border-gray-200 rounded-lg focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Porcentagem (%)</label>
            <input required type="number" step="0.1" name="percentage" defaultValue={editingRule?.percentage} className="w-full p-2 border border-gray-200 rounded-lg focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] outline-none" />
          </div>
          <button type="submit" className="w-full bg-[#FF4D00] text-white font-medium py-2 rounded-lg hover:bg-[#FF4D00]/90 transition-colors">
            Salvar
          </button>
        </form>
      </Modal>

      <Modal isOpen={cardModalOpen} onClose={() => setCardModalOpen(false)} title={editingCard ? "Editar Cartão de Crédito" : "Novo Cartão de Crédito"}>
        <form onSubmit={handleSaveCard} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cartão</label>
            <input required name="name" defaultValue={editingCard?.name} placeholder="Ex: Cartão Rodrigo" className="w-full p-2 border border-gray-200 rounded-lg hover:border-gray-300 focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dia de Fechamento</label>
              <input required type="number" min="1" max="31" name="closingDay" defaultValue={editingCard?.closingDay} placeholder="Ex: 1" className="w-full p-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#FF4D00] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dia de Vencimento</label>
              <input required type="number" min="1" max="31" name="dueDay" defaultValue={editingCard?.dueDay} placeholder="Ex: 7" className="w-full p-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#FF4D00] outline-none" />
            </div>
          </div>
          <button type="submit" className="w-full bg-[#FF4D00] text-white font-medium py-2 rounded-lg hover:bg-[#FF4D00]/90 transition-colors mt-2">
            Salvar
          </button>
        </form>
      </Modal>

      {/* Manual Invoice / Override Modal */}
      <Modal isOpen={manualInvoiceModalOpen} onClose={() => { setManualInvoiceModalOpen(false); setEditingInvoice(null); }} title={editingInvoice ? "Editar Fatura" : "Inserir Fatura Manual"}>
        <form onSubmit={handleSaveManualInvoice} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cartão de Crédito</label>
            <Select
              required
              name="creditCardId"
              defaultValue={editingInvoice?.creditCardId}
              options={creditCards.map(c => ({ value: c.id, label: c.name }))}
              placeholder="Selecione um cartão..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mês de Ref. (YYYY-MM)</label>
              <MonthPicker required name="referenceMonth" defaultValue={editingInvoice ? editingInvoice.dueDate.substring(0, 7) : selectedMonthFatura} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor Total (R$)</label>
              <input required type="number" step="0.01" name="amount" defaultValue={editingInvoice?.amount} placeholder="0.00" className="w-full p-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#FF4D00] outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de Vencimento</label>
              <DatePicker required name="dueDate" defaultValue={editingInvoice?.dueDate} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <Select
                required
                name="status"
                defaultValue={editingInvoice?.status || 'Pendente'}
                options={[{ value: 'Pendente', label: 'Pendente' }, { value: 'Paga', label: 'Paga' }]}
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-[#FF4D00] text-white font-medium py-2 rounded-lg hover:bg-[#FF4D00]/90 transition-colors mt-2">
            Salvar Fatura
          </button>
        </form>
      </Modal>

      {/* Invoice View Modal */}
      <Modal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} title={selectedInvoice ? `Fatura - ${selectedInvoice.cardName}` : ''}>
        {selectedInvoice && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <p className="text-sm text-gray-500 font-medium">Vencimento</p>
                <p className="text-lg font-bold text-gray-900">{selectedInvoice.dueDate.split('-').reverse().join('/')}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 font-medium">Status</p>
                <span className={`inline-flex px-2.5 py-1 mt-1 text-xs font-bold rounded-full ${selectedInvoice.status === 'Paga' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                  {selectedInvoice.status}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-3">Total da Fatura: R$ {selectedInvoice.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
              {selectedInvoice.isManual ? (
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500">Esta é uma fatura inserida manualmente. Não há transações avulsas vinculadas a ela.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-500">Transações do período:</p>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {selectedInvoice.transactions.map((t, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{t.description}</p>
                          <p className="text-xs text-gray-500">{t.date?.split('-').reverse().join('/')}</p>
                        </div>
                        <p className={`text-sm font-bold ${t.type === 'expense' ? 'text-gray-900' : 'text-emerald-600'}`}>
                          {t.type === 'expense' ? '' : '+'}R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))}
                    {selectedInvoice.transactions.length === 0 && (
                      <p className="text-sm text-gray-400 italic">Nenhuma transação encontrada no período.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

    </motion.div>
  );
}

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useFinance } from '@/context/FinanceContext';
import { ChevronLeft, ChevronRight, Plus, Filter, CreditCard as CreditCardIcon, Wallet, ArrowUpRight, ArrowDownRight, Edit2, Trash2, Copy, CheckCircle2, Clock, Landmark } from 'lucide-react';
import { motion } from 'motion/react';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { OFXImportModal } from '@/components/OFXImportModal';
import { CSVImportModal } from '@/components/CSVImportModal';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { Transaction, TransactionType } from '@/types/finance';

export function MensalPage() {
  useDocumentTitle('Controle Mensal');
  const { transactions, creditCards, pockets, invoices, addTransaction, updateTransaction, deleteTransaction, recurringIncomes, fixedExpenses } = useFinance();
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const nextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  // Convert current date to YYYY-MM format correctly, accounting for local time zone 
  // to avoid off-by-one month issues when using toISOString()
  const offset = currentDate.getTimezoneOffset();
  const rawDate = new Date(currentDate.getTime() - (offset * 60 * 1000));
  const currentMonthStr = rawDate.toISOString().substring(0, 7);

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const currentMonthLabel = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  const monthTransactions = transactions.filter(t => t.date.substring(0, 7) === currentMonthStr);
  const incomeTransactions = monthTransactions.filter(t => t.type === 'income');
  const immediateExpenseTransactions = monthTransactions.filter(t => t.type === 'expense' && t.paymentMethod !== 'Cartão de Crédito');

  // Income breakdowns by status
  const receitaPrevista = incomeTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const receitaRecebida = incomeTransactions.filter(t => t.status === 'recebido').reduce((acc, curr) => acc + curr.amount, 0);
  const receitaPendente = incomeTransactions.filter(t => !t.status || t.status === 'pendente').reduce((acc, curr) => acc + curr.amount, 0);

  const monthInvoices = invoices.filter(inv => inv.dueDate.substring(0, 7) === currentMonthStr);
  const creditCardExpenses = monthInvoices.reduce((acc, inv) => acc + inv.amount, 0);
  const totalDespesa = immediateExpenseTransactions.reduce((acc, curr) => acc + curr.amount, 0) + creditCardExpenses;

  // Real = based on received income only
  const lucroReal = receitaRecebida - totalDespesa;
  // Projected = based on all income (prevista)
  const lucroProjetado = receitaPrevista - totalDespesa;

  // Predicted values from global configurations
  const predictedIncome = recurringIncomes.reduce((acc, curr) => acc + curr.amount, 0);
  const predictedExpense = fixedExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const predictedProfit = predictedIncome - predictedExpense;

  // Toggle income status
  const handleToggleStatus = async (tx: Transaction) => {
    const newStatus = tx.status === 'recebido' ? 'pendente' : 'recebido';
    await updateTransaction(tx.id, { ...tx, status: newStatus });
  };

  const [txModalOpen, setTxModalOpen] = useState(false);
  const [ofxModalOpen, setOfxModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [modalData, setModalData] = useState<Transaction | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

  useEffect(() => {
    if (modalData) {
      setSelectedPaymentMethod(modalData.paymentMethod);
    } else {
      setSelectedPaymentMethod('PIX');
    }
  }, [modalData]);

  const handleSaveTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const pm = fd.get('paymentMethod') as string;
    const txType = fd.get('type') as TransactionType;
    const txDate = fd.get('date') as string;

    // Auto-set status for income transactions
    let status: 'recebido' | 'pendente' | undefined = undefined;
    if (txType === 'income') {
      const today = new Date().toISOString().split('T')[0];
      status = txDate > today ? 'pendente' : 'recebido';
    }

    const data = {
      description: fd.get('description') as string,
      category: fd.get('category') as string,
      amount: Number(fd.get('amount')),
      date: txDate,
      type: txType,
      paymentMethod: pm,
      creditCardId: pm === 'Cartão de Crédito' ? (fd.get('creditCardId') as string) : undefined,
      status
    };

    if (isEditing && modalData) {
      // Keep existing status if editing, unless type changed
      if (modalData.type === 'income' && txType === 'income') {
        data.status = modalData.status;
      }
      await updateTransaction(modalData.id, data);
    } else {
      await addTransaction(data);
    }
    setTxModalOpen(false);
  };

  let filteredTransactions = monthTransactions;
  if (filterType !== 'all') {
    if (filterType === 'income-recebido') {
      filteredTransactions = filteredTransactions.filter(t => t.type === 'income' && t.status === 'recebido');
    } else if (filterType === 'income-pendente') {
      filteredTransactions = filteredTransactions.filter(t => t.type === 'income' && (!t.status || t.status === 'pendente'));
    } else {
      filteredTransactions = filteredTransactions.filter(t => t.type === filterType);
    }
  }
  if (filterSearch) {
    const searchLower = filterSearch.toLowerCase();
    filteredTransactions = filteredTransactions.filter(t =>
      t.description.toLowerCase().includes(searchLower) ||
      t.category.toLowerCase().includes(searchLower)
    );
  }

  if (filterPaymentMethod !== 'all') {
    filteredTransactions = filteredTransactions.filter(t => t.paymentMethod === filterPaymentMethod && t.type === 'expense');
  }

  // Ordenar transações por data (mais recentes primeiro)
  filteredTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalFilteredExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-10"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Controle Mensal</h1>
          <p className="text-gray-500 mt-1">Acompanhe suas receitas, despesas e orçamentos.</p>
        </div>

        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
          <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
          <span className="font-semibold text-gray-900 min-w-[120px] text-center capitalize">{currentMonthLabel}</span>
          <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-md transition-colors"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
        </div>
      </div>

      {/* Resumo do Mês */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Receita Recebida */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">Receita Recebida</p>
              <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-emerald-600 mb-1">
              R$ {receitaRecebida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Prevista: R$ {receitaPrevista.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            {receitaPendente > 0 && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                R$ {receitaPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} pendente
              </p>
            )}
          </CardContent>
        </Card>

        {/* Despesa */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">Despesas</p>
              <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              </div>
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-red-600 mb-1">
              R$ {totalDespesa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <div className="text-xs text-gray-400">
              Previsto: R$ {predictedExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        {/* Lucro Real */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">Saldo Real</p>
              <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <h3 className={`text-2xl font-bold tracking-tight mb-1 ${lucroReal >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              R$ {lucroReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-gray-400">Baseado apenas no recebido</p>
          </CardContent>
        </Card>

        {/* Lucro Projetado */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">Saldo Projetado</p>
              <div className="w-9 h-9 rounded-full bg-violet-50 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-violet-500" />
              </div>
            </div>
            <h3 className={`text-2xl font-bold tracking-tight mb-1 ${lucroProjetado >= 0 ? 'text-violet-600' : 'text-red-600'}`}>
              R$ {lucroProjetado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-gray-400">Incluindo receita pendente</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transações */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Transações do Mês</CardTitle>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-gray-100 text-[#FF4D00]' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <Filter className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCsvModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium border border-gray-200"
                title="Importar Fatura de Cartão de Crédito"
              >
                <CreditCardIcon className="w-4 h-4 text-emerald-600" />
                Fatura Cartão (CSV)
              </button>
              <button
                onClick={() => setOfxModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium border border-gray-200"
                title="Importar Extrato Bancário Geral"
              >
                <Landmark className="w-4 h-4 text-blue-600" />
                Extrato Conta (OFX)
              </button>
              <button
                onClick={() => { setModalData(null); setIsEditing(false); setTxModalOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-[#FF4D00] text-white rounded-lg hover:bg-[#E64500] transition-colors text-sm font-medium shadow-md shadow-[#FF4D00]/20"
              >
                <Plus className="w-4 h-4" />
                Nova
              </button>
            </div>
          </CardHeader>

          {showFilters && (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Buscar por descrição ou categoria..."
                value={filterSearch}
                onChange={e => setFilterSearch(e.target.value)}
                className="flex-1 p-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00]"
              />
              <Select
                value={filterType}
                onChange={val => setFilterType(val)}
                className="w-full sm:w-[200px]"
                options={[
                  { value: 'all', label: 'Todas' },
                  { value: 'income', label: 'Receitas (+)' },
                  { value: 'income-recebido', label: 'Receitas Recebidas' },
                  { value: 'income-pendente', label: 'Receitas Pendentes' },
                  { value: 'expense', label: 'Despesas (-)' }
                ]}
              />
              <Select
                value={filterPaymentMethod}
                onChange={val => setFilterPaymentMethod(val)}
                className="w-full sm:w-[200px]"
                options={[
                  { value: 'all', label: 'Todas Formas' },
                  { value: 'Pix/Transferência', label: 'Pix / Transf.' },
                  { value: 'Boleto', label: 'Boleto' },
                  { value: 'Cartão de Crédito', label: 'Cartão de Crédito' },
                  { value: 'Cartão de Débito', label: 'Cartão de Débito' },
                  { value: 'Dinheiro', label: 'Dinheiro' }
                ]}
              />
            </div>
          )}

          {showFilters && (filterType === 'expense' || filterPaymentMethod !== 'all' || filterSearch) && totalFilteredExpenses > 0 && (
            <div className="px-6 py-3 bg-red-50/50 border-b border-gray-100 flex justify-end items-center">
              <span className="text-sm font-medium text-gray-600 mr-2">Total Despesas Filtradas:</span>
              <span className="text-base font-bold text-red-600">
                R$ {totalFilteredExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 font-medium">Data</th>
                    <th className="px-6 py-3 font-medium">Descrição</th>
                    <th className="px-6 py-3 font-medium">Categoria</th>
                    <th className="px-6 py-3 font-medium">Forma</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium text-right">Valor</th>
                    <th className="px-6 py-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => {
                    const isIncome = tx.type === 'income';
                    const isPending = isIncome && (!tx.status || tx.status === 'pendente');
                    const isReceived = isIncome && tx.status === 'recebido';
                    return (
                      <tr key={tx.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors group ${isPending ? 'opacity-70' : ''}`} style={{ minHeight: '64px' }}>
                        <td className="px-6 py-4 text-gray-500">{new Date(tx.date).toLocaleDateString('pt-BR')}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{tx.description}</td>
                        <td className="px-6 py-4">
                          <span className="bg-gray-100 px-2 py-1 rounded-md text-xs text-gray-600">{tx.category}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs">{tx.paymentMethod}</td>
                        <td className="px-6 py-4">
                          {isIncome ? (
                            <button
                              onClick={() => handleToggleStatus(tx)}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${isReceived
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                }`}
                            >
                              {isReceived ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              {isReceived ? 'Recebido' : 'Pendente'}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className={`px-6 py-4 text-right font-bold ${isIncome ? (isReceived ? 'text-emerald-600' : 'text-amber-500') : 'text-red-600'}`}>
                          {isIncome ? '+' : '-'} R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              title="Duplicar"
                              onClick={() => { setModalData(tx); setIsEditing(false); setTxModalOpen(true); }}
                              className="text-gray-400 hover:text-blue-500 transition-colors"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              title="Editar"
                              onClick={() => { setModalData(tx); setIsEditing(true); setTxModalOpen(true); }}
                              className="text-gray-400 hover:text-[#FF4D00] transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              title="Excluir"
                              onClick={() => { if (confirm('Excluir transação?')) deleteTransaction(tx.id); }}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTransactions.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-6 text-gray-400">Nenhuma transação encontrada.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {/* Faturas de Cartão */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCardIcon className="w-5 h-5 text-[#FF4D00]" />
                Faturas (Cartões de Crédito)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {monthInvoices.map(invoice => (
                <div key={invoice.id} className="p-4 border border-gray-100 rounded-xl hover:shadow-md transition-shadow bg-white">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-gray-900">{invoice.cardName}</h4>
                      <p className="text-xs text-gray-500">
                        Vencimento: {new Date(invoice.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${invoice.status === 'Paga' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                      {invoice.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-sm text-gray-500">Valor Total</span>
                    <span className="text-lg font-bold text-gray-900">R$ {invoice.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              ))}
              {monthInvoices.length === 0 && (
                <p className="text-sm text-gray-400">Nenhuma fatura encontrada neste mês.</p>
              )}
            </CardContent>
          </Card>

          {/* Bolsos (Orçamento) - Still mock-like based on early schema, kept for UI continuity */}
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
              {pockets.length === 0 && (
                <p className="text-sm text-gray-400">Bolsos serão calculados no futuro.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transaction Modal */}
      <Modal isOpen={txModalOpen} onClose={() => setTxModalOpen(false)} title={isEditing ? "Editar Transação" : "Nova Transação"}>
        <form onSubmit={handleSaveTransaction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <Select
                name="type"
                defaultValue={modalData?.type || 'expense'}
                required
                options={[
                  { value: 'income', label: 'Receita (+)' },
                  { value: 'expense', label: 'Despesa (-)' }
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
              <DatePicker required name="date" defaultValue={modalData?.date ? new Date(modalData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input required name="description" defaultValue={modalData?.description} placeholder="Ex: Conta de Luz" className="w-full p-2 border border-gray-200 rounded-lg focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
              <input required type="number" step="0.01" min="0.01" name="amount" defaultValue={modalData?.amount} className="w-full p-2 border border-gray-200 rounded-lg focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meio de Pgto</label>
              <Select
                required
                name="paymentMethod"
                value={selectedPaymentMethod}
                onChange={val => setSelectedPaymentMethod(val)}
                options={[
                  { value: 'PIX', label: 'PIX' },
                  { value: 'Cartão de Crédito', label: 'Cartão de Crédito' },
                  { value: 'Cartão de Débito', label: 'Cartão de Débito' },
                  { value: 'Dinheiro', label: 'Dinheiro' },
                  { value: 'Boleto', label: 'Boleto' }
                ]}
              />
            </div>
          </div>
          {selectedPaymentMethod === 'Cartão de Crédito' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qual Cartão?</label>
              <Select
                name="creditCardId"
                required
                defaultValue={modalData?.creditCardId || ''}
                options={creditCards.map(c => ({ value: c.id, label: c.name }))}
                placeholder="Selecione um cartão"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <input required name="category" defaultValue={modalData?.category} placeholder="Ex: Moradia" className="w-full p-2 border border-gray-200 rounded-lg focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] outline-none" />
          </div>
          <button type="submit" className="w-full bg-[#FF4D00] text-white font-medium py-2 rounded-lg hover:bg-[#FF4D00]/90 transition-colors mt-2">
            Salvar
          </button>
        </form>
      </Modal>

      {/* OFX Import Modal */}
      {ofxModalOpen && (
        <OFXImportModal onClose={() => setOfxModalOpen(false)} />
      )}

      {/* CSV Import Modal */}
      {csvModalOpen && (
        <CSVImportModal onClose={() => setCsvModalOpen(false)} />
      )}

    </motion.div>
  );
}



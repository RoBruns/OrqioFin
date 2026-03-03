import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { FinanceState, Transaction, RecurringIncome, FixedExpense, ProfitRule, CreditCard, Goal, Pocket, Invoice, ManualInvoice, Investment } from '../types/finance';
import { financeService } from '../services/financeService';
import { marketDataService } from '../services/marketDataService';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface FinanceContextType extends FinanceState {
  isLoading: boolean;
  error: string | null;
  // Transactions
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, tx: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Recurring Incomes
  addRecurringIncome: (inc: Omit<RecurringIncome, 'id'>) => Promise<void>;
  updateRecurringIncome: (id: string, inc: Omit<RecurringIncome, 'id'>) => Promise<void>;
  deleteRecurringIncome: (id: string) => Promise<void>;

  // Fixed Expenses
  addFixedExpense: (exp: Omit<FixedExpense, 'id'>) => Promise<void>;
  updateFixedExpense: (id: string, exp: Omit<FixedExpense, 'id'>) => Promise<void>;
  deleteFixedExpense: (id: string) => Promise<void>;

  // Goals
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>;
  updateGoal: (id: string, goal: Omit<Goal, 'id'>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // Profit Rules
  addProfitRule: (rule: Omit<ProfitRule, 'id'>) => Promise<void>;
  updateProfitRule: (id: string, rule: Omit<ProfitRule, 'id'>) => Promise<void>;
  deleteProfitRule: (id: string) => Promise<void>;

  // Credit Cards
  addCreditCard: (card: Omit<CreditCard, 'id' | 'currentInvoice' | 'status'>) => Promise<void>;
  updateCreditCard: (id: string, card: Omit<CreditCard, 'id' | 'currentInvoice' | 'status'>) => Promise<void>;
  deleteCreditCard: (id: string) => Promise<void>;

  // Manual Invoices
  addManualInvoice: (invoice: Omit<ManualInvoice, 'id'>) => Promise<void>;
  updateManualInvoice: (id: string, invoice: Omit<ManualInvoice, 'id'>) => Promise<void>;
  deleteManualInvoice: (id: string) => Promise<void>;

  // Investments
  addInvestment: (inv: Omit<Investment, 'id'>) => Promise<void>;
  updateInvestment: (id: string, inv: Omit<Investment, 'id'>) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  marketPrices: Record<string, number>;
  refreshMarketPrices: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const generateInvoices = (cards: CreditCard[], txs: Transaction[], manualInvs: ManualInvoice[]): { invoices: Invoice[], updatedCards: CreditCard[] } => {
  const invoicesMap = new Map<string, Invoice>();

  const ccTxs = txs.filter(t => t.paymentMethod === 'Cartão de Crédito' && t.creditCardId);

  ccTxs.forEach(t => {
    const card = cards.find(c => c.id === t.creditCardId);
    if (!card) return;

    if (!t.date) return;
    const [yr, mo, da] = t.date.substring(0, 10).split('-').map(Number);

    let invoiceMonth = mo;
    let invoiceYear = yr;

    if (da > card.closingDay) {
      invoiceMonth += 1;
      if (invoiceMonth > 12) {
        invoiceMonth = 1;
        invoiceYear += 1;
      }
    }

    let dueMonth = invoiceMonth;
    let dueYear = invoiceYear;

    if (card.dueDay < card.closingDay) {
      dueMonth += 1;
      if (dueMonth > 12) {
        dueMonth = 1;
        dueYear += 1;
      }
    }

    const dueDateStr = `${dueYear}-${String(dueMonth).padStart(2, '0')}-${String(card.dueDay).padStart(2, '0')}`;
    const invoiceId = `${card.id}-${dueDateStr}`;

    if (!invoicesMap.has(invoiceId)) {
      invoicesMap.set(invoiceId, {
        id: invoiceId,
        creditCardId: card.id,
        cardName: card.name,
        amount: 0,
        dueDate: dueDateStr,
        status: 'Pendente',
        transactions: []
      });
    }

    const invoice = invoicesMap.get(invoiceId)!;
    const amountVal = t.type === 'expense' ? t.amount : -t.amount;
    invoice.amount += amountVal;
    invoice.transactions.push(t);
  });

  // Inject manual invoices / Overrides
  manualInvs.forEach(minv => {
    const card = cards.find(c => c.id === minv.creditCardId);
    if (!card) return;

    // Determine if this manual invoice overrides an existing one
    // We match by creditCardId and referenceMonth (which we map to the YYYY-MM of the due date)
    const matchingAutoInvoiceEntry = Array.from(invoicesMap.entries()).find(
      ([_, inv]) => inv.creditCardId === minv.creditCardId && inv.dueDate.substring(0, 7) === minv.referenceMonth
    );

    if (matchingAutoInvoiceEntry) {
      // OVERRIDE the auto-generated invoice
      const [id, inv] = matchingAutoInvoiceEntry;
      inv.amount = minv.amount;
      inv.status = minv.status;
      // We keep the transactions! But we add a flag to know it's overridden
      inv.isManual = true;
      // Replace the ID so the UI can use the manualInvoice ID to update it later
      inv.id = `manual-${minv.id}`;
      // Note: we just update it in place in the map using its new or old id. 
      // Actually better to keep its original map key, but set inv.id
    } else {
      // It's a completely freestanding manual invoice
      const invoiceId = `manual-${minv.id}`;
      invoicesMap.set(invoiceId, {
        id: invoiceId,
        creditCardId: card.id,
        cardName: card.name,
        amount: minv.amount,
        dueDate: minv.dueDate,
        status: minv.status,
        transactions: [],
        isManual: true
      });
    }
  });

  const invoices = Array.from(invoicesMap.values()).sort((a, b) => b.dueDate.localeCompare(a.dueDate));

  const now = new Date();
  const updatedCards = cards.map(card => {
    const cardInvoices = invoices.filter(inv => inv.creditCardId === card.id && inv.amount > 0);
    const upcoming = cardInvoices.filter(inv => inv.dueDate >= now.toISOString().substring(0, 10));
    const currentInvAmt = upcoming.length > 0 ? upcoming[0].amount : 0;
    return {
      ...card,
      currentInvoice: currentInvAmt
    };
  });

  return { invoices, updatedCards };
};

export const FinanceProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<FinanceState>({
    transactions: [],
    recurringIncomes: [],
    fixedExpenses: [],
    profitRules: [],
    creditCards: [],
    invoices: [],
    manualInvoices: [],
    goals: [],
    pockets: [],
    investments: []
  });
  const [marketPrices, setMarketPrices] = useState<Record<string, number>>({});
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stateRef = useRef(state);
  stateRef.current = state;

  const refreshMarketPrices = useCallback(async (currentInvestments?: Investment[]) => {
    const invs = currentInvestments || stateRef.current.investments;

    const fetchedPrices: Record<string, number> = {};
    for (const inv of invs) {
      if ((inv.assetType === 'Ação' || inv.assetType === 'Criptomoeda') && inv.assetName) {
        const nameUpper = inv.assetName.toUpperCase();
        if (fetchedPrices[nameUpper] === undefined) {
          const price = await marketDataService.getAssetPrice(inv.assetName, inv.assetType);
          if (price !== null) {
            fetchedPrices[nameUpper] = price;
          }
        }
      }
    }

    setMarketPrices(prev => {
      let updated = false;
      const newPrices = { ...prev };
      for (const tck in fetchedPrices) {
        if (newPrices[tck] !== fetchedPrices[tck]) {
          newPrices[tck] = fetchedPrices[tck];
          updated = true;
        }
      }
      return updated ? newPrices : prev;
    });
  }, []);

  const fetchAllData = useCallback(async (uid: string) => {
    const [transactions, recurringIncomes, fixedExpenses, profitRules, creditCards, goals, manualInvoices, investments] = await Promise.all([
      financeService.getTransactions(uid),
      financeService.getRecurringIncomes(uid),
      financeService.getFixedExpenses(uid),
      financeService.getProfitRules(uid),
      financeService.getCreditCards(uid),
      financeService.getGoals(uid),
      financeService.getManualInvoices(uid),
      financeService.getInvestments(uid)
    ]);

    const { invoices, updatedCards } = generateInvoices(creditCards, transactions, manualInvoices);

    setState(prev => ({
      ...prev,
      transactions,
      recurringIncomes,
      fixedExpenses,
      profitRules,
      creditCards: updatedCards,
      invoices,
      manualInvoices,
      goals,
      investments
    }));

    // Trigger price fetch asynchronously without blocking
    refreshMarketPrices(investments);
  }, [refreshMarketPrices]);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      setState({
        transactions: [],
        recurringIncomes: [],
        fixedExpenses: [],
        profitRules: [],
        creditCards: [],
        invoices: [],
        manualInvoices: [],
        goals: [],
        pockets: [],
        investments: []
      });
      return;
    }
    async function initData() {
      try {
        setIsLoading(true);
        await fetchAllData(userId!);
      } catch (err: any) {
        console.error('Error fetching data from Supabase:', err);
        setError(err.message || 'Error fetching data');
      } finally {
        setIsLoading(false);
      }
    }
    initData();
  }, [userId, fetchAllData]);

  useEffect(() => {
    if (!userId) return;

    // 4. Implementar Realtime (Opcional, mas recomendado)
    // Inscreve-se nas mudanças do banco para atualizar a UI via refetch
    const channel = supabase.channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          console.log('Realtime change received via Supabase:', payload);
          fetchAllData(userId).catch(console.error);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // ---------------------------------------------
  // MUTATION HELPERS
  // ---------------------------------------------

  // Factory function to handle all inserts/updates/deletes with 
  // Error handling, Logging, Optimistic Update (B) and Refetch (A)
  const handleMutation = async <T,>(
    mutationFn: () => Promise<T>,
    optimisticUpdate: (result: T) => void
  ) => {
    if (!userId) {
      alert('Sessão não encontrada. Recarregue a página.');
      return;
    }
    try {
      const result = await mutationFn();

      // Opção B: Atualização Otimista
      optimisticUpdate(result);

      // Opção A: Refetch após a mutation para garantir 100% de sincronia
      fetchAllData(userId).catch(e => console.error('Silent refetch error:', e));
    } catch (error: any) {
      console.error('[Supabase CRUD Error]:', error);
      alert(`Erro ao salvar no banco de dados: ${error.message || JSON.stringify(error)}`);
      throw error;
    }
  };

  // Transactions
  const addTransaction = (tx: Omit<Transaction, 'id'>) =>
    handleMutation(
      () => financeService.addTransaction(userId!, tx),
      (newTx) => setState(prev => ({ ...prev, transactions: [newTx, ...prev.transactions] }))
    );

  const updateTransaction = (id: string, tx: Omit<Transaction, 'id'>) =>
    handleMutation(
      () => financeService.updateTransaction(id, tx),
      (updated) => setState(prev => ({ ...prev, transactions: prev.transactions.map(t => t.id === id ? updated : t) }))
    );

  const deleteTransaction = (id: string) =>
    handleMutation(
      async () => { await financeService.deleteTransaction(id); return id; },
      (deletedId) => setState(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== deletedId) }))
    );

  // Recurring Incomes
  const addRecurringIncome = (inc: Omit<RecurringIncome, 'id'>) =>
    handleMutation(
      () => financeService.addRecurringIncome(userId!, inc),
      (created) => setState(prev => ({ ...prev, recurringIncomes: [...prev.recurringIncomes, created] }))
    );

  const updateRecurringIncome = (id: string, inc: Omit<RecurringIncome, 'id'>) =>
    handleMutation(
      () => financeService.updateRecurringIncome(id, inc),
      (updated) => setState(prev => ({ ...prev, recurringIncomes: prev.recurringIncomes.map(i => i.id === id ? updated : i) }))
    );

  const deleteRecurringIncome = (id: string) =>
    handleMutation(
      async () => { await financeService.deleteRecurringIncome(id); return id; },
      (deletedId) => setState(prev => ({ ...prev, recurringIncomes: prev.recurringIncomes.filter(i => i.id !== deletedId) }))
    );

  // Fixed Expenses
  const addFixedExpense = (exp: Omit<FixedExpense, 'id'>) =>
    handleMutation(
      () => financeService.addFixedExpense(userId!, exp),
      (created) => setState(prev => ({ ...prev, fixedExpenses: [...prev.fixedExpenses, created] }))
    );

  const updateFixedExpense = (id: string, exp: Omit<FixedExpense, 'id'>) =>
    handleMutation(
      () => financeService.updateFixedExpense(id, exp),
      (updated) => setState(prev => ({ ...prev, fixedExpenses: prev.fixedExpenses.map(e => e.id === id ? updated : e) }))
    );

  const deleteFixedExpense = (id: string) =>
    handleMutation(
      async () => { await financeService.deleteFixedExpense(id); return id; },
      (deletedId) => setState(prev => ({ ...prev, fixedExpenses: prev.fixedExpenses.filter(e => e.id !== deletedId) }))
    );

  // Goals
  const addGoal = (goal: Omit<Goal, 'id'>) =>
    handleMutation(
      () => financeService.addGoal(userId!, goal),
      (created) => setState(prev => ({ ...prev, goals: [...prev.goals, created] }))
    );

  const updateGoal = (id: string, goal: Omit<Goal, 'id'>) =>
    handleMutation(
      () => financeService.updateGoal(id, goal),
      (updated) => setState(prev => ({ ...prev, goals: prev.goals.map(g => g.id === id ? updated : g) }))
    );

  const deleteGoal = (id: string) =>
    handleMutation(
      async () => { await financeService.deleteGoal(id); return id; },
      (deletedId) => setState(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== deletedId) }))
    );

  // Profit Rules
  const addProfitRule = (rule: Omit<ProfitRule, 'id'>) =>
    handleMutation(
      () => financeService.addProfitRule(userId!, rule),
      (created) => setState(prev => ({ ...prev, profitRules: [...prev.profitRules, created] }))
    );

  const updateProfitRule = (id: string, rule: Omit<ProfitRule, 'id'>) =>
    handleMutation(
      () => financeService.updateProfitRule(id, rule),
      (updated) => setState(prev => ({ ...prev, profitRules: prev.profitRules.map(r => r.id === id ? updated : r) }))
    );

  const deleteProfitRule = (id: string) =>
    handleMutation(
      async () => { await financeService.deleteProfitRule(id); return id; },
      (deletedId) => setState(prev => ({ ...prev, profitRules: prev.profitRules.filter(r => r.id !== deletedId) }))
    );

  // Credit Cards
  const addCreditCard = (card: Omit<CreditCard, 'id' | 'currentInvoice' | 'status'>) =>
    handleMutation(
      () => financeService.addCreditCard(userId!, card),
      (created) => setState(prev => ({ ...prev, creditCards: [...prev.creditCards, created as CreditCard] }))
    );

  const updateCreditCard = (id: string, card: Omit<CreditCard, 'id' | 'currentInvoice' | 'status'>) =>
    handleMutation(
      () => financeService.updateCreditCard(id, card),
      (updated) => setState(prev => ({ ...prev, creditCards: prev.creditCards.map(c => c.id === id ? (updated as CreditCard) : c) }))
    );

  const deleteCreditCard = (id: string) =>
    handleMutation(
      async () => { await financeService.deleteCreditCard(id); return id; },
      (deletedId) => setState(prev => ({ ...prev, creditCards: prev.creditCards.filter(c => c.id !== deletedId) }))
    );


  // Manual Invoices
  const addManualInvoice = (invoice: Omit<ManualInvoice, 'id'>) =>
    handleMutation(
      () => financeService.addManualInvoice(userId!, invoice),
      (created) => setState(prev => ({ ...prev, manualInvoices: [...prev.manualInvoices, created] }))
    );

  const updateManualInvoice = (id: string, invoice: Omit<ManualInvoice, 'id'>) =>
    handleMutation(
      () => financeService.updateManualInvoice(id, invoice),
      (updated) => setState(prev => ({ ...prev, manualInvoices: prev.manualInvoices.map(m => m.id === id ? updated : m) }))
    );

  const deleteManualInvoice = (id: string) =>
    handleMutation(
      async () => { await financeService.deleteManualInvoice(id); return id; },
      (deletedId) => setState(prev => ({ ...prev, manualInvoices: prev.manualInvoices.filter(m => m.id !== deletedId) }))
    );

  // Investments
  const addInvestment = (inv: Omit<Investment, 'id'>) =>
    handleMutation(
      () => financeService.addInvestment(userId!, inv),
      (created) => {
        setState(prev => ({ ...prev, investments: [...prev.investments, created] }));
        refreshMarketPrices([...state.investments, created]); // Fetch price if needed
      }
    );

  const updateInvestment = (id: string, inv: Omit<Investment, 'id'>) =>
    handleMutation(
      () => financeService.updateInvestment(id, inv),
      (updated) => {
        setState(prev => ({ ...prev, investments: prev.investments.map(i => i.id === id ? updated : i) }));
        refreshMarketPrices(state.investments.map(i => i.id === id ? updated : i)); // Fetch price if needed
      }
    );

  const deleteInvestment = (id: string) =>
    handleMutation(
      async () => { await financeService.deleteInvestment(id); return id; },
      (deletedId) => setState(prev => ({ ...prev, investments: prev.investments.filter(i => i.id !== deletedId) }))
    );


  const value: FinanceContextType = {
    ...state,
    isLoading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addRecurringIncome,
    updateRecurringIncome,
    deleteRecurringIncome,
    addFixedExpense,
    updateFixedExpense,
    deleteFixedExpense,
    addGoal,
    updateGoal,
    deleteGoal,
    addProfitRule,
    updateProfitRule,
    deleteProfitRule,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
    addManualInvoice,
    updateManualInvoice,
    deleteManualInvoice,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    marketPrices,
    refreshMarketPrices
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

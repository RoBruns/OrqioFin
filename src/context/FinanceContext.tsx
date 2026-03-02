import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FinanceState, Transaction, RecurringIncome, FixedExpense, ProfitRule, CreditCard, Goal, Pocket } from '../types/finance';

const mockState: FinanceState = {
  transactions: [
    { id: '1', type: 'income', description: 'Salário', category: 'Renda', amount: 5000, date: '2023-10-05', paymentMethod: 'Pix' },
    { id: '2', type: 'expense', description: 'Aluguel', category: 'Moradia', amount: 1500, date: '2023-10-10', paymentMethod: 'Pix' },
    { id: '3', type: 'expense', description: 'Mercado', category: 'Alimentação', amount: 600, date: '2023-10-15', paymentMethod: 'Crédito' },
    { id: '4', type: 'expense', description: 'Internet', category: 'Contas', amount: 120, date: '2023-10-20', paymentMethod: 'Débito' },
  ],
  recurringIncomes: [
    { id: '1', description: 'Salário Principal', amount: 5000, day: 5, source: 'Rodrigo' },
    { id: '2', description: 'Freelance', amount: 1500, day: 15, source: 'Sarah' },
  ],
  fixedExpenses: [
    { id: '1', description: 'Aluguel', category: 'Moradia', amount: 1500, day: 10 },
    { id: '2', description: 'Condomínio', category: 'Moradia', amount: 400, day: 10 },
    { id: '3', description: 'Internet', category: 'Contas', amount: 120, day: 20 },
  ],
  profitRules: [
    { id: '1', name: 'Reserva de Emergência', percentage: 30 },
    { id: '2', name: 'Lazer', percentage: 20 },
    { id: '3', name: 'Investimentos', percentage: 50 },
  ],
  creditCards: [
    { id: '1', name: 'Nubank', closingDay: 25, dueDay: 5, currentInvoice: 1250.50, status: 'Pendente' },
    { id: '2', name: 'Itaú', closingDay: 15, dueDay: 25, currentInvoice: 450.00, status: 'Paga' },
  ],
  goals: [
    { id: '1', name: 'Viagem Europa', targetAmount: 20000, currentAmount: 5000, plannedMonthlyContribution: 500, estimatedCompletionDate: '2025-12-01' },
    { id: '2', name: 'Trocar de Carro', targetAmount: 50000, currentAmount: 15000, plannedMonthlyContribution: 1000, estimatedCompletionDate: '2026-06-01' },
  ],
  pockets: [
    { id: '1', name: 'Alimentação', allocatedAmount: 1000, usedAmount: 650 },
    { id: '2', name: 'Lazer', allocatedAmount: 500, usedAmount: 480 },
    { id: '3', name: 'Transporte', allocatedAmount: 400, usedAmount: 150 },
  ]
};

interface FinanceContextType extends FinanceState {
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  // Add other mutators as needed for the MVP
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<FinanceState>(mockState);

  const addTransaction = (tx: Omit<Transaction, 'id'>) => {
    setState(prev => ({
      ...prev,
      transactions: [...prev.transactions, { ...tx, id: Math.random().toString(36).substr(2, 9) }]
    }));
  };

  return (
    <FinanceContext.Provider value={{ ...state, addTransaction }}>
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

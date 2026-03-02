export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod: string;
}

export interface RecurringIncome {
  id: string;
  description: string;
  amount: number;
  day: number;
  source: string;
}

export interface FixedExpense {
  id: string;
  description: string;
  category: string;
  amount: number;
  day: number;
}

export interface ProfitRule {
  id: string;
  name: string;
  percentage: number;
}

export interface CreditCard {
  id: string;
  name: string;
  closingDay: number;
  dueDay: number;
  currentInvoice: number;
  status: 'Paga' | 'Pendente';
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  plannedMonthlyContribution: number;
  estimatedCompletionDate: string;
}

export interface Pocket {
  id: string;
  name: string;
  allocatedAmount: number;
  usedAmount: number;
}

export interface FinanceState {
  transactions: Transaction[];
  recurringIncomes: RecurringIncome[];
  fixedExpenses: FixedExpense[];
  profitRules: ProfitRule[];
  creditCards: CreditCard[];
  goals: Goal[];
  pockets: Pocket[];
}

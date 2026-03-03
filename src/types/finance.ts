export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod: string;
  creditCardId?: string;
  status?: 'recebido' | 'pendente';
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

export interface Investment {
  id: string;
  assetName: string;
  assetType: string;
  investedAmount: number;
  quantity: number;
  startDate: string;
  goalId?: string;
  annualYield?: number;
  purchasePrice?: number;
}

export interface Invoice {
  id: string;
  creditCardId: string;
  cardName: string;
  amount: number;
  dueDate: string;
  status: 'Paga' | 'Pendente';
  transactions: Transaction[];
  isManual?: boolean;
}

export interface ManualInvoice {
  id: string;
  creditCardId: string;
  referenceMonth: string; // YYYY-MM
  amount: number;
  dueDate: string;
  status: 'Paga' | 'Pendente';
}

export interface FinanceState {
  transactions: Transaction[];
  recurringIncomes: RecurringIncome[];
  fixedExpenses: FixedExpense[];
  profitRules: ProfitRule[];
  creditCards: CreditCard[];
  invoices: Invoice[];
  manualInvoices: ManualInvoice[];
  goals: Goal[];
  pockets: Pocket[];
  investments: Investment[];
}

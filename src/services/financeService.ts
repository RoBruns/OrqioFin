import { supabase } from '../lib/supabase';
import type {
    Transaction, RecurringIncome, FixedExpense,
    ProfitRule, CreditCard, Goal, TransactionType, ManualInvoice, Investment
} from '../types/finance';

export const financeService = {
    // ----------------------------------------------------
    // TRANSACTIONS
    // ----------------------------------------------------
    async getTransactions(userId: string): Promise<Transaction[]> {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('data', { ascending: false });

        if (error) throw error;
        return data.map(d => ({
            id: d.id,
            type: d.tipo as TransactionType,
            description: d.descricao,
            category: d.categoria,
            amount: Number(d.valor),
            date: d.data,
            paymentMethod: d.forma_pagamento,
            creditCardId: d.cartao_id,
            status: d.status
        }));
    },

    async addTransaction(userId: string, tx: Omit<Transaction, 'id'>) {
        const { data, error } = await supabase
            .from('transactions')
            .insert({
                user_id: userId,
                tipo: tx.type,
                descricao: tx.description,
                categoria: tx.category,
                valor: tx.amount,
                data: tx.date,
                forma_pagamento: tx.paymentMethod,
                cartao_id: tx.creditCardId,
                status: tx.status
            })
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            type: data.tipo as TransactionType,
            description: data.descricao,
            category: data.categoria,
            amount: Number(data.valor),
            date: data.data,
            paymentMethod: data.forma_pagamento,
            creditCardId: data.cartao_id,
            status: data.status
        };
    },

    async updateTransaction(id: string, tx: Omit<Transaction, 'id'>) {
        const { data, error } = await supabase
            .from('transactions')
            .update({
                tipo: tx.type,
                descricao: tx.description,
                categoria: tx.category,
                valor: tx.amount,
                data: tx.date,
                forma_pagamento: tx.paymentMethod,
                cartao_id: tx.creditCardId,
                status: tx.status
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            type: data.tipo as TransactionType,
            description: data.descricao,
            category: data.categoria,
            amount: Number(data.valor),
            date: data.data,
            paymentMethod: data.forma_pagamento,
            creditCardId: data.cartao_id,
            status: data.status
        };
    },

    async deleteTransaction(id: string) {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) throw error;
    },

    // ----------------------------------------------------
    // INCOMES (Recurring)
    // ----------------------------------------------------
    async getRecurringIncomes(userId: string): Promise<RecurringIncome[]> {
        const { data, error } = await supabase
            .from('incomes')
            .select('*')
            .eq('user_id', userId)
            .eq('recorrente', true);

        if (error) throw error;
        return data.map(d => ({
            id: d.id,
            description: d.descricao,
            amount: Number(d.valor),
            day: d.dia_recebimento,
            source: d.fonte || ''
        }));
    },

    async addRecurringIncome(userId: string, inc: Omit<RecurringIncome, 'id'>) {
        const { data, error } = await supabase
            .from('incomes')
            .insert({
                user_id: userId,
                descricao: inc.description,
                valor: inc.amount,
                dia_recebimento: inc.day,
                fonte: inc.source,
                recorrente: true
            })
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            description: data.descricao,
            amount: Number(data.valor),
            day: data.dia_recebimento,
            source: data.fonte || ''
        };
    },

    async updateRecurringIncome(id: string, inc: Omit<RecurringIncome, 'id'>) {
        const { data, error } = await supabase
            .from('incomes')
            .update({
                descricao: inc.description,
                valor: inc.amount,
                dia_recebimento: inc.day,
                fonte: inc.source
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            description: data.descricao,
            amount: Number(data.valor),
            day: data.dia_recebimento,
            source: data.fonte || ''
        };
    },

    async deleteRecurringIncome(id: string) {
        const { error } = await supabase.from('incomes').delete().eq('id', id);
        if (error) throw error;
    },

    // ----------------------------------------------------
    // FIXED EXPENSES
    // ----------------------------------------------------
    async getFixedExpenses(userId: string): Promise<FixedExpense[]> {
        const { data, error } = await supabase
            .from('fixed_expenses')
            .select('*')
            .eq('user_id', userId)
            .eq('recorrente', true);

        if (error) throw error;
        return data.map(d => ({
            id: d.id,
            description: d.descricao,
            category: d.categoria,
            amount: Number(d.valor),
            day: d.dia_vencimento
        }));
    },

    async addFixedExpense(userId: string, exp: Omit<FixedExpense, 'id'>) {
        const { data, error } = await supabase
            .from('fixed_expenses')
            .insert({
                user_id: userId,
                descricao: exp.description,
                categoria: exp.category,
                valor: exp.amount,
                dia_vencimento: exp.day,
                recorrente: true
            })
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            description: data.descricao,
            category: data.categoria,
            amount: Number(data.valor),
            day: data.dia_vencimento
        };
    },

    async updateFixedExpense(id: string, exp: Omit<FixedExpense, 'id'>) {
        const { data, error } = await supabase
            .from('fixed_expenses')
            .update({
                descricao: exp.description,
                categoria: exp.category,
                valor: exp.amount,
                dia_vencimento: exp.day
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            description: data.descricao,
            category: data.categoria,
            amount: Number(data.valor),
            day: data.dia_vencimento
        };
    },

    async deleteFixedExpense(id: string) {
        const { error } = await supabase.from('fixed_expenses').delete().eq('id', id);
        if (error) throw error;
    },

    // ----------------------------------------------------
    // PROFIT RULES (Allocation Rules)
    // ----------------------------------------------------
    async getProfitRules(userId: string): Promise<ProfitRule[]> {
        const { data, error } = await supabase
            .from('allocation_rules')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;
        return data.map(d => ({
            id: d.id,
            name: d.nome_categoria,
            percentage: Number(d.percentual)
        }));
    },

    async addProfitRule(userId: string, rule: Omit<ProfitRule, 'id'>) {
        const { data, error } = await supabase
            .from('allocation_rules')
            .insert({
                user_id: userId,
                nome_categoria: rule.name,
                percentual: rule.percentage
            })
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            name: data.nome_categoria,
            percentage: Number(data.percentual)
        };
    },

    async updateProfitRule(id: string, rule: Omit<ProfitRule, 'id'>) {
        const { data, error } = await supabase
            .from('allocation_rules')
            .update({
                nome_categoria: rule.name,
                percentual: rule.percentage
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            name: data.nome_categoria,
            percentage: Number(data.percentual)
        };
    },

    async deleteProfitRule(id: string) {
        const { error } = await supabase.from('allocation_rules').delete().eq('id', id);
        if (error) throw error;
    },

    // ----------------------------------------------------
    // CREDIT CARDS
    // ----------------------------------------------------
    async getCreditCards(userId: string): Promise<CreditCard[]> {
        const { data, error } = await supabase
            .from('credit_cards')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;
        return data.map(d => ({
            id: d.id,
            name: d.nome_cartao,
            closingDay: d.dia_fechamento,
            dueDay: d.dia_vencimento,
            currentInvoice: 0,
            status: 'Pendente'
        }));
    },

    async addCreditCard(userId: string, card: Omit<CreditCard, 'id' | 'currentInvoice' | 'status'>) {
        const { data, error } = await supabase
            .from('credit_cards')
            .insert({
                user_id: userId,
                nome_cartao: card.name,
                dia_fechamento: card.closingDay,
                dia_vencimento: card.dueDay
            })
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            name: data.nome_cartao,
            closingDay: data.dia_fechamento,
            dueDay: data.dia_vencimento,
            currentInvoice: 0,
            status: 'Pendente' as const
        };
    },

    async updateCreditCard(id: string, card: Omit<CreditCard, 'id' | 'currentInvoice' | 'status'>) {
        const { data, error } = await supabase
            .from('credit_cards')
            .update({
                nome_cartao: card.name,
                dia_fechamento: card.closingDay,
                dia_vencimento: card.dueDay
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            name: data.nome_cartao,
            closingDay: data.dia_fechamento,
            dueDay: data.dia_vencimento,
            currentInvoice: 0,
            status: 'Pendente' as const
        };
    },

    async deleteCreditCard(id: string) {
        const { error } = await supabase.from('credit_cards').delete().eq('id', id);
        if (error) throw error;
    },

    // ----------------------------------------------------
    // GOALS
    // ----------------------------------------------------
    async getGoals(userId: string): Promise<Goal[]> {
        const { data, error } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;
        return data.map(d => ({
            id: d.id,
            name: d.nome,
            targetAmount: Number(d.valor_alvo),
            currentAmount: Number(d.valor_atual),
            plannedMonthlyContribution: Number(d.aporte_mensal_planejado),
            estimatedCompletionDate: ''
        }));
    },

    async addGoal(userId: string, goal: Omit<Goal, 'id'>) {
        const { data, error } = await supabase
            .from('goals')
            .insert({
                user_id: userId,
                nome: goal.name,
                valor_alvo: goal.targetAmount,
                valor_atual: goal.currentAmount,
                aporte_mensal_planejado: goal.plannedMonthlyContribution
            })
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            name: data.nome,
            targetAmount: Number(data.valor_alvo),
            currentAmount: Number(data.valor_atual),
            plannedMonthlyContribution: Number(data.aporte_mensal_planejado),
            estimatedCompletionDate: ''
        };
    },

    async updateGoal(id: string, goal: Omit<Goal, 'id'>) {
        const { data, error } = await supabase
            .from('goals')
            .update({
                nome: goal.name,
                valor_alvo: goal.targetAmount,
                valor_atual: goal.currentAmount,
                aporte_mensal_planejado: goal.plannedMonthlyContribution
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            name: data.nome,
            targetAmount: Number(data.valor_alvo),
            currentAmount: Number(data.valor_atual),
            plannedMonthlyContribution: Number(data.aporte_mensal_planejado),
            estimatedCompletionDate: ''
        };
    },

    async deleteGoal(id: string) {
        const { error } = await supabase.from('goals').delete().eq('id', id);
        if (error) throw error;
    },

    // ----------------------------------------------------
    // MANUAL INVOICES
    // ----------------------------------------------------
    async getManualInvoices(userId: string): Promise<ManualInvoice[]> {
        const { data, error } = await supabase
            .from('manual_invoices')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;
        return data.map(d => ({
            id: d.id,
            creditCardId: d.credit_card_id,
            referenceMonth: d.reference_month,
            amount: Number(d.amount),
            dueDate: d.due_date,
            status: d.status as 'Paga' | 'Pendente'
        }));
    },

    async addManualInvoice(userId: string, invoice: Omit<ManualInvoice, 'id'>) {
        const { data, error } = await supabase
            .from('manual_invoices')
            .insert({
                user_id: userId,
                credit_card_id: invoice.creditCardId,
                reference_month: invoice.referenceMonth,
                amount: invoice.amount,
                due_date: invoice.dueDate,
                status: invoice.status
            })
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            creditCardId: data.credit_card_id,
            referenceMonth: data.reference_month,
            amount: Number(data.amount),
            dueDate: data.due_date,
            status: data.status as 'Paga' | 'Pendente'
        };
    },

    async updateManualInvoice(id: string, invoice: Omit<ManualInvoice, 'id'>) {
        const { data, error } = await supabase
            .from('manual_invoices')
            .update({
                credit_card_id: invoice.creditCardId,
                reference_month: invoice.referenceMonth,
                amount: invoice.amount,
                due_date: invoice.dueDate,
                status: invoice.status
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            creditCardId: data.credit_card_id,
            referenceMonth: data.reference_month,
            amount: Number(data.amount),
            dueDate: data.due_date,
            status: data.status as 'Paga' | 'Pendente'
        };
    },

    async deleteManualInvoice(id: string) {
        const { error } = await supabase.from('manual_invoices').delete().eq('id', id);
        if (error) throw error;
    },

    // ----------------------------------------------------
    // INVESTMENTS
    // ----------------------------------------------------
    async getInvestments(userId: string): Promise<Investment[]> {
        const { data, error } = await supabase
            .from('investments')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;
        return data.map(d => ({
            id: d.id,
            assetName: d.asset_name,
            assetType: d.asset_type,
            investedAmount: Number(d.invested_amount),
            quantity: Number(d.quantity),
            startDate: d.start_date,
            goalId: d.goal_id,
            annualYield: d.annual_yield ? Number(d.annual_yield) : undefined,
            purchasePrice: d.purchase_price ? Number(d.purchase_price) : undefined
        }));
    },

    async addInvestment(userId: string, inv: Omit<Investment, 'id'>) {
        const { data, error } = await supabase
            .from('investments')
            .insert({
                user_id: userId,
                asset_name: inv.assetName,
                asset_type: inv.assetType,
                invested_amount: inv.investedAmount,
                quantity: inv.quantity,
                start_date: inv.startDate,
                goal_id: inv.goalId || null,
                annual_yield: inv.annualYield || 0,
                purchase_price: inv.purchasePrice || 0
            })
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            assetName: data.asset_name,
            assetType: data.asset_type,
            investedAmount: Number(data.invested_amount),
            quantity: Number(data.quantity),
            startDate: data.start_date,
            goalId: data.goal_id,
            annualYield: data.annual_yield ? Number(data.annual_yield) : undefined,
            purchasePrice: data.purchase_price ? Number(data.purchase_price) : undefined
        };
    },

    async updateInvestment(id: string, inv: Omit<Investment, 'id'>) {
        const { data, error } = await supabase
            .from('investments')
            .update({
                asset_name: inv.assetName,
                asset_type: inv.assetType,
                invested_amount: inv.investedAmount,
                quantity: inv.quantity,
                start_date: inv.startDate,
                goal_id: inv.goalId || null,
                annual_yield: inv.annualYield || 0,
                purchase_price: inv.purchasePrice || 0
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            assetName: data.asset_name,
            assetType: data.asset_type,
            investedAmount: Number(data.invested_amount),
            quantity: Number(data.quantity),
            startDate: data.start_date,
            goalId: data.goal_id,
            annualYield: data.annual_yield ? Number(data.annual_yield) : undefined,
            purchasePrice: data.purchase_price ? Number(data.purchase_price) : undefined
        };
    },

    async deleteInvestment(id: string) {
        const { error } = await supabase.from('investments').delete().eq('id', id);
        if (error) throw error;
    }
};

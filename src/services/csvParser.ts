import { Transaction, TransactionType } from '../types/finance';

export const CSV_TEMPLATE_HEADERS = ["Data", "Descrição", "Categoria", "Valor"];

export const CSV_TEMPLATE_CONTENT = `${CSV_TEMPLATE_HEADERS.join(",")}\n15/03/2026,Uber,Transporte,25.50\n16/03/2026,Netflix,Anotações Fixos,55.90\n`;

export function downloadCSVTemplate() {
    const blob = new Blob([CSV_TEMPLATE_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "modelo_fatura.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Function to convert DD/MM/YYYY into YYYY-MM-DD
function parseDateBR(dateStr: string): string {
    const parts = dateStr.trim().split('/');
    if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    // fallback if it's already YYYY-MM-DD
    if (dateStr.includes('-')) {
        return dateStr.trim();
    }
    return new Date().toISOString().split('T')[0];
}

export function parseCreditCardCSV(csvString: string, creditCardId: string): Partial<Transaction>[] {
    const transactions: Partial<Transaction>[] = [];
    const lines = csvString.split('\n').filter(line => line.trim().length > 0);

    if (lines.length < 2) return transactions; // Need at least header + 1 data line

    // Assuming headers are the first row, we start iterating from 1
    for (let i = 1; i < lines.length; i++) {
        // split by comma, handling potential quotes if needed
        // Simple split for now since template doesn't strict format quotes, but let's be safe
        // Splitting by comma outside of quotes (regex approach)
        const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);

        // Fallback if match fails, just split by comma
        const cols = row ? row.map(col => col.replace(/^"|"$/g, '').trim()) : lines[i].split(',').map(c => c.trim());

        if (cols.length >= 4) {
            const dataStr = cols[0];
            const descStr = cols[1];
            const catStr = cols[2];
            const valStr = cols[3];

            // Clean value string (allow strings like "R$ 50,00", "50.00", etc)
            let numericStr = valStr.replace(/[^\d.,-]/g, '');
            // If it uses comma for decimals, change to dot
            if (numericStr.includes(',') && numericStr.indexOf(',') > numericStr.lastIndexOf('.')) {
                numericStr = numericStr.replace(/\./g, '').replace(',', '.');
            } else if (numericStr.includes('.') && numericStr.indexOf(',') !== -1) {
                // Has commas as thousand separators, dots as decimals
                numericStr = numericStr.replace(/,/g, '');
            } else {
                numericStr = numericStr.replace(',', '.'); // fallback
            }

            const amountValue = Math.abs(parseFloat(numericStr) || 0);

            if (amountValue > 0) {
                transactions.push({
                    id: `csv-${Date.now()}-${i}`,
                    amount: amountValue,
                    type: 'expense', // Credit card transactions are expenses
                    date: parseDateBR(dataStr),
                    description: descStr || 'Compra Cartão',
                    category: catStr || 'Outros',
                    paymentMethod: 'Cartão de Crédito',
                    creditCardId: creditCardId,
                    status: 'recebido' // For credit card purchases, the individual transactions are "cleared/paid" on the card, the invoice itself gets paid later. "recebido" acts fairly as "efetivado" here on Orqio.
                });
            }
        }
    }

    return transactions;
}

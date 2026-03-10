import { Transaction, TransactionType } from '../types/finance';

// Helper function to extract content from an OFX tag
function extractTagContent(content: string, tag: string): string | null {
    const openTag = `<${tag}>`;
    const startIndex = content.indexOf(openTag);
    if (startIndex === -1) return null;

    const contentStart = startIndex + openTag.length;
    // OFX tags usually end with either the closing tag, a newline, or the start of the next tag
    const closeTag = `</${tag}>`;
    let endIndex = content.indexOf(closeTag, contentStart);

    if (endIndex === -1) {
        endIndex = content.indexOf('<', contentStart);
        if (endIndex === -1) {
            endIndex = content.indexOf('\n', contentStart);
        }
    }

    if (endIndex === -1) return null;

    return content.slice(contentStart, endIndex).trim();
}

// Function to format OFX date (YYYYMMDD) to YYYY-MM-DD
function formatOfxDate(ofxDate: string): string {
    if (!ofxDate || ofxDate.length < 8) return new Date().toISOString().split('T')[0];
    const year = ofxDate.substring(0, 4);
    const month = ofxDate.substring(4, 6);
    const day = ofxDate.substring(6, 8);
    return `${year}-${month}-${day}`;
}

export function parseOFX(ofxString: string): Partial<Transaction>[] {
    const transactions: Partial<Transaction>[] = [];

    // Split by STMTTRN to get individual transactions
    const trnBlocks = ofxString.split('<STMTTRN>');

    // Skip the first block as it's the header/preceding info
    for (let i = 1; i < trnBlocks.length; i++) {
        const block = trnBlocks[i];

        const amountStr = extractTagContent(block, 'TRNAMT');
        const dateStr = extractTagContent(block, 'DTPOSTED');
        const memo = extractTagContent(block, 'MEMO');
        const name = extractTagContent(block, 'NAME');

        if (amountStr && dateStr) {
            const amountValue = parseFloat(amountStr.replace(',', '.'));
            const type: TransactionType = amountValue >= 0 ? 'income' : 'expense';

            // Use NAME if available, fallback to MEMO if not. 
            // OFX usually puts the real description in MEMO if NAME is generic. We'll combine or pick the most descriptive.
            let description = name || memo || 'Transação Importada';
            if (memo && name && memo !== name) {
                // Cleaning up typical OFX memo prefixes like "Compra no debito:" 
                const cleanMemo = memo.replace(/^[^:]+:\s*"?/, '').replace(/"?$/, '');
                description = cleanMemo;
            }

            transactions.push({
                id: `import-${Date.now()}-${i}`, // Temporary ID for the UI
                amount: Math.abs(amountValue),
                type,
                date: formatOfxDate(dateStr),
                description: description,
                category: 'Outros', // Default category
                paymentMethod: 'Pix/Transferência', // Default payment method
                status: 'recebido' // Assuming bank statement items are already cleared
            });
        }
    }

    return transactions;
}

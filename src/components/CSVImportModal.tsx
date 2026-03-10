import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, X, Check, Trash2, Download } from 'lucide-react';
import { Transaction } from '@/types/finance';
import { useFinance } from '@/context/FinanceContext';
import { parseCreditCardCSV, downloadCSVTemplate } from '@/services/csvParser';

interface CSVImportModalProps {
    onClose: () => void;
}

export function CSVImportModal({ onClose }: CSVImportModalProps) {
    const { addTransaction, categories, creditCards } = useFinance();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [parsedTransactions, setParsedTransactions] = useState<(Partial<Transaction> & { selected: boolean })[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedCardId, setSelectedCardId] = useState<string>('');

    // Default categories
    const availableCategories = categories?.length > 0
        ? categories.map(c => c.name)
        : ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Salário', 'Investimentos', 'Outros'];

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const processFile = (selectedFile: File) => {
        if (!selectedCardId) {
            setError('Por favor, selecione um cartão de crédito primeiro.');
            return;
        }

        if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
            setError('Por favor, selecione um arquivo no formato .csv válido.');
            return;
        }

        setError(null);
        setFile(selectedFile);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const txs = parseCreditCardCSV(content, selectedCardId);

                if (txs.length === 0) {
                    setError('Nenhuma transação válida encontrada no CSV. Verifique o formato no template.');
                    return;
                }

                setParsedTransactions(txs.map(tx => ({ ...tx, selected: true })));
            } catch (err) {
                console.error('Error parsing CSV:', err);
                setError('Erro ao ler o arquivo CSV. Verifique se o formato está correto.');
            }
        };
        reader.onerror = () => setError('Erro na leitura do arquivo.');
        reader.readAsText(selectedFile);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
        }
    };

    const toggleSelection = (index: number) => {
        const newTxs = [...parsedTransactions];
        newTxs[index].selected = !newTxs[index].selected;
        setParsedTransactions(newTxs);
    };

    const updateTransactionField = (index: number, field: keyof Transaction, value: any) => {
        const newTxs = [...parsedTransactions];
        newTxs[index] = { ...newTxs[index], [field]: value };
        setParsedTransactions(newTxs);
    };

    const importData = async () => {
        const toImport = parsedTransactions.filter(tx => tx.selected);
        if (toImport.length === 0) {
            setError('Selecione ao menos uma transação para importar.');
            return;
        }

        setIsImporting(true);

        try {
            for (const tx of toImport) {
                const { id, selected, ...cleanTx } = tx;

                await addTransaction({
                    amount: cleanTx.amount || 0,
                    type: cleanTx.type || 'expense',
                    description: cleanTx.description || 'Transação Importada',
                    category: cleanTx.category || 'Outros',
                    date: cleanTx.date || new Date().toISOString().split('T')[0],
                    paymentMethod: cleanTx.paymentMethod || 'Cartão de Crédito',
                    status: cleanTx.status || 'recebido',
                    creditCardId: cleanTx.creditCardId
                });
            }
            onClose();
        } catch (err) {
            console.error('Error importing:', err);
            setError('Erro ao salvar as transações.');
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Importar Fatura via CSV</h2>
                        <p className="text-sm text-gray-500 mt-1">Carregue um arquivo .csv para lançar várias compras de uma vez.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="font-medium text-sm">{error}</p>
                        </div>
                    )}

                    {parsedTransactions.length === 0 ? (
                        <div className="flex flex-col gap-6">
                            {/* Card Selection & Template Box */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 flex flex-col justify-center">
                                    <h3 className="text-sm font-semibold text-gray-800 mb-2">1. Selecione o Cartão</h3>
                                    <select
                                        value={selectedCardId}
                                        onChange={(e) => {
                                            setSelectedCardId(e.target.value);
                                            setError(null);
                                        }}
                                        className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#FF4D00] focus:border-[#FF4D00] transition-all bg-white text-gray-900"
                                    >
                                        <option value="">-- Escolha um Cartão --</option>
                                        {creditCards.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="bg-[#FF4D00]/5 p-5 rounded-xl border border-[#FF4D00]/20 flex flex-col items-center justify-center text-center">
                                    <h3 className="text-sm font-semibold text-[#FF4D00] mb-2">Precisa do formato padrão?</h3>
                                    <p className="text-xs text-gray-600 mb-3">Baixe nosso arquivo de exemplo para preencher com seus dados e enviar sem erros.</p>
                                    <button
                                        onClick={downloadCSVTemplate}
                                        className="flex items-center gap-2 px-4 py-2 bg-white text-[#FF4D00] border border-[#FF4D00] rounded-lg hover:bg-[#FF4D00] hover:text-white transition-colors text-sm font-medium"
                                    >
                                        <Download className="w-4 h-4" />
                                        Baixar Modelo CSV
                                    </button>
                                </div>
                            </div>

                            {/* Upload Area */}
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => {
                                    if (!selectedCardId) {
                                        setError('Por favor, selecione um cartão acima primeiro.');
                                        return;
                                    }
                                    fileInputRef.current?.click();
                                }}
                                className={`
                                    border-2 border-dashed rounded-2xl p-10 text-center transition-all flex flex-col items-center justify-center
                                    ${!selectedCardId ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                                    ${isDragging && selectedCardId ? 'border-[#FF4D00] bg-[#FF4D00]/5' : (selectedCardId ? 'border-gray-300 hover:border-[#FF4D00]/50 hover:bg-gray-50' : '')}
                                `}
                            >
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${selectedCardId ? 'bg-[#FF4D00]/10 text-[#FF4D00]' : 'bg-gray-200 text-gray-400'}`}>
                                    <UploadCloud className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">2. Enviar Arquivo</h3>
                                <p className="text-gray-500 mb-6 max-w-sm">
                                    Arraste seu arquivo .csv aqui ou clique para selecionar.
                                </p>

                                <button
                                    type="button"
                                    disabled={!selectedCardId}
                                    className="px-6 py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-black transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    Selecionar Arquivo
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    accept=".csv"
                                    className="hidden"
                                />
                            </div>
                        </div>
                    ) : (
                        // Review Area
                        <div className="space-y-4">
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Revisar Fatura</h3>
                                    <p className="text-sm text-gray-500">
                                        Lidas {parsedTransactions.length} compras no arquivo {file?.name}.
                                    </p>
                                </div>
                                <div className="bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg text-sm font-semibold border border-orange-100 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    {parsedTransactions.filter(t => t.selected).length} Selecionadas
                                </div>
                            </div>

                            <div className="bg-white border md:border-gray-200 md:rounded-xl overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                                            <tr>
                                                <th className="p-4 font-medium w-12 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={parsedTransactions.every(t => t.selected)}
                                                        onChange={(e) => {
                                                            const checked = e.target.checked;
                                                            setParsedTransactions(prev => prev.map(t => ({ ...t, selected: checked })));
                                                        }}
                                                        className="w-4 h-4 text-[#FF4D00] border-gray-300 rounded focus:ring-[#FF4D00]"
                                                    />
                                                </th>
                                                <th className="p-4 font-medium">Data</th>
                                                <th className="p-4 font-medium min-w-[200px]">Descrição</th>
                                                <th className="p-4 font-medium">Categoria</th>
                                                <th className="p-4 font-medium text-right">Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {parsedTransactions.map((tx, index) => (
                                                <tr key={index} className={`hover:bg-gray-50 transition-colors ${!tx.selected ? 'opacity-50 bg-gray-50/50' : ''}`}>
                                                    <td className="p-4 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={tx.selected}
                                                            onChange={() => toggleSelection(index)}
                                                            className="w-4 h-4 text-[#FF4D00] border-gray-300 rounded focus:ring-[#FF4D00]"
                                                        />
                                                    </td>
                                                    <td className="p-4 text-gray-600">
                                                        {tx.date ? new Date(tx.date + 'T12:00:00Z').toLocaleDateString('pt-BR') : '-'}
                                                    </td>
                                                    <td className="p-4">
                                                        <input
                                                            type="text"
                                                            value={tx.description || ''}
                                                            onChange={(e) => updateTransactionField(index, 'description', e.target.value)}
                                                            className="w-full p-1.5 border border-transparent hover:border-gray-200 focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] rounded outline-none transition-all bg-transparent focus:bg-white"
                                                        />
                                                    </td>
                                                    <td className="p-4">
                                                        <select
                                                            value={tx.category || 'Outros'}
                                                            onChange={(e) => updateTransactionField(index, 'category', e.target.value)}
                                                            className="w-full p-1.5 border border-gray-200 rounded text-gray-700 outline-none focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] bg-white cursor-pointer"
                                                        >
                                                            {availableCategories.map(cat => (
                                                                <option key={cat} value={cat}>{cat}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <span className="font-bold text-gray-900">
                                                            R$ {(tx.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {parsedTransactions.length > 0 && (
                    <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
                        <button
                            onClick={() => {
                                setParsedTransactions([]);
                                setFile(null);
                                setError(null);
                            }}
                            className="px-6 py-2.5 text-gray-600 font-medium hover:text-gray-900 transition-colors flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Descartar Arquivo
                        </button>

                        <button
                            onClick={importData}
                            disabled={isImporting || parsedTransactions.filter(t => t.selected).length === 0}
                            className="px-8 py-3 bg-[#FF4D00] text-white font-medium rounded-xl hover:bg-[#E64500] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#FF4D00]/20 flex items-center gap-2"
                        >
                            {isImporting ? (
                                <>Importando...</>
                            ) : (
                                <>
                                    <Check className="w-5 h-5" />
                                    Confirmar Importação
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

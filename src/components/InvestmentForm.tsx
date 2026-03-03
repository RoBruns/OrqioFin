import React, { useState, useEffect, useRef } from 'react';
import { Investment, Goal } from '@/types/finance';
import { useFinance } from '@/context/FinanceContext';
import { marketDataService, AssetSearchResult } from '@/services/marketDataService';
import { Search, Loader2 } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';

interface InvestmentFormProps {
    onClose: () => void;
    editingInv: Investment | null;
    goals: Goal[];
}

export function InvestmentForm({ onClose, editingInv, goals }: InvestmentFormProps) {
    const { addInvestment, updateInvestment } = useFinance();

    // Form State
    const [assetType, setAssetType] = useState<string>(editingInv?.assetType || 'Ação');
    const [assetName, setAssetName] = useState<string>(editingInv?.assetName || '');
    const [investedAmount, setInvestedAmount] = useState<string>(editingInv?.investedAmount.toString() || '');
    const [quantity, setQuantity] = useState<string>(editingInv?.quantity.toString() || '1');
    const [startDate, setStartDate] = useState<string>(
        editingInv?.startDate ? new Date(editingInv.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    );
    const [goalId, setGoalId] = useState<string>(editingInv?.goalId || '');
    const [annualYield, setAnnualYield] = useState<string>(editingInv?.annualYield?.toString() || '');
    const [purchasePrice, setPurchasePrice] = useState<string>(editingInv?.purchasePrice?.toString() || '');

    // Search State
    const [searchQuery, setSearchQuery] = useState(editingInv?.assetName || '');
    const [searchResults, setSearchResults] = useState<AssetSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    // Current Price context
    const [currentPrice, setCurrentPrice] = useState<number | null>(null);

    // Debounce search
    useEffect(() => {
        if (assetType !== 'Ação' && assetType !== 'Criptomoeda') return;

        // If user deleted search query
        if (!searchQuery) {
            setSearchResults([]);
            return;
        }

        // Don't search if we just selected an item
        if (searchQuery === assetName && currentPrice !== null) {
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            const results = await marketDataService.searchAssets(searchQuery);
            // Filter by the selected type
            const filtered = results.filter(r => r.type === assetType);
            setSearchResults(filtered);
            setIsSearching(false);
            setShowDropdown(true);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, assetType, assetName, currentPrice]);

    // Load initial price if editing
    useEffect(() => {
        if (editingInv && (editingInv.assetType === 'Ação' || editingInv.assetType === 'Criptomoeda')) {
            marketDataService.getAssetPrice(editingInv.assetName, editingInv.assetType).then(price => {
                if (price !== null) setCurrentPrice(price);
            });
        }
    }, [editingInv]);

    const handleSelectAsset = async (asset: AssetSearchResult) => {
        setAssetName(asset.symbol);
        setSearchQuery(asset.symbol);
        setShowDropdown(false);

        // Fetch exact price
        const price = await marketDataService.getAssetPrice(asset.symbol, asset.type);
        setCurrentPrice(price);

        // If Crypto, recalculate quantity based on current investedAmount (if any)
        if (asset.type === 'Criptomoeda' && investedAmount && price) {
            setQuantity((Number(investedAmount) / price).toString());
        }
        // If Ação and user had typed quantity, calculate invested amount
        if (asset.type === 'Ação' && quantity && price && !investedAmount) {
            setInvestedAmount((Number(quantity) * price).toFixed(2));
        }

        // Auto-fill purchase price if it's a new asset and no price was set
        if (!editingInv && !purchasePrice && price) {
            setPurchasePrice(price.toFixed(2));
        }
    };

    const handleTypeChange = (newType: string) => {
        setAssetType(newType);
        setSearchQuery('');
        setAssetName('');
        setCurrentPrice(null);
        setSearchResults([]);
        setShowDropdown(false);
        if (newType !== 'Ação' && newType !== 'Criptomoeda') {
            setQuantity('1'); // Fixed income default
        }
    };

    const handleInvestedAmountChange = (val: string) => {
        setInvestedAmount(val);
        const numVal = Number(val);
        if (!isNaN(numVal) && currentPrice) {
            if (assetType === 'Criptomoeda') {
                setQuantity((numVal / currentPrice).toString());
            } else if (assetType === 'Ação') {
                const estQtd = numVal / currentPrice;
                setQuantity(estQtd.toFixed(0)); // Stocks usually whole numbers, though fractional exists
            }
        }
    };

    const handleQuantityChange = (val: string) => {
        setQuantity(val);
        const numVal = Number(val);
        if (!isNaN(numVal) && currentPrice) {
            if (assetType === 'Ação') {
                setInvestedAmount((numVal * currentPrice).toFixed(2));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            assetName: assetType === 'Ação' || assetType === 'Criptomoeda' ? assetName : searchQuery,
            assetType,
            investedAmount: Number(investedAmount),
            quantity: Number(quantity),
            startDate,
            goalId: goalId || undefined,
            annualYield: (assetType === 'Renda Fixa' || assetType === 'Outros') && annualYield ? Number(annualYield) : undefined,
            purchasePrice: (assetType === 'Ação' || assetType === 'Criptomoeda') && purchasePrice ? Number(purchasePrice) : undefined
        };

        if (editingInv) {
            await updateInvestment(editingInv.id, data);
        } else {
            await addInvestment(data);
        }
        onClose();
    };

    // Compound interest preview for Renda Fixa / Outros
    const calcCompoundValue = () => {
        const principal = Number(investedAmount);
        const rate = Number(annualYield) / 100; // 14% -> 0.14
        if (!principal || !rate || !startDate) return principal;
        const start = new Date(startDate);
        const now = new Date();
        const daysElapsed = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        if (daysElapsed <= 0) return principal;
        const dailyRate = Math.pow(1 + rate, 1 / 252) - 1;
        return principal * Math.pow(1 + dailyRate, daysElapsed);
    };

    const previewCurrentValue = currentPrice
        ? Number(quantity) * currentPrice
        : (assetType === 'Renda Fixa' || assetType === 'Outros')
            ? (annualYield ? calcCompoundValue() : (Number(quantity) > 0 ? Number(quantity) : Number(investedAmount)))
            : Number(investedAmount);
    const previewProfit = previewCurrentValue - Number(investedAmount);
    const previewProfitPerc = Number(investedAmount) > 0 ? (previewProfit / Number(investedAmount)) * 100 : 0;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Ativo</label>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {['Ação', 'Criptomoeda', 'Renda Fixa', 'Outros'].map(type => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => handleTypeChange(type)}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${assetType === type ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {assetType === 'Ação' || assetType === 'Criptomoeda' ? 'Buscar Ativo' : 'Nome do Ativo'}
                </label>
                <div className="relative">
                    <input
                        required
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (assetType !== 'Ação' && assetType !== 'Criptomoeda') {
                                setAssetName(e.target.value);
                            }
                        }}
                        onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                        placeholder={assetType === 'Ação' ? 'Ex: PETR4' : assetType === 'Criptomoeda' ? 'Ex: Bitcoin ou BTC' : 'Ex: CDB Nubank'}
                        className="w-full p-2 pl-9 border border-gray-200 rounded-lg focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] outline-none"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    {isSearching && <Loader2 className="w-4 h-4 text-[#FF4D00] animate-spin absolute right-3 top-3" />}
                </div>

                {showDropdown && searchResults.length > 0 && assetType !== 'Renda Fixa' && assetType !== 'Outros' && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl overflow-hidden">
                        {searchResults.map((res, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => handleSelectAsset(res)}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 flex items-center justify-between"
                            >
                                <div>
                                    <p className="font-bold text-gray-900">{res.symbol}</p>
                                    <p className="text-xs text-gray-500">{res.name}</p>
                                </div>
                                <span className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-600 font-medium">{res.type}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {(assetType === 'Ação' || assetType === 'Criptomoeda') && currentPrice && (
                <div className="bg-[#FF4D00]/5 border border-[#FF4D00]/20 rounded-lg p-3 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Preço Atual ({assetName})</span>
                    <span className="font-bold text-[#FF4D00]">R$ {currentPrice.toFixed(2)}</span>
                </div>
            )}

            {assetType === 'Criptomoeda' && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Valor Investido (R$)</label>
                        <input
                            required
                            type="number" step="0.01" min="0"
                            value={investedAmount}
                            onChange={(e) => handleInvestedAmountChange(e.target.value)}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] outline-none"
                        />
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Quantidade de Cripto (Calculada)</label>
                        <p className="font-medium text-gray-900">{Number(quantity) > 0 ? Number(quantity).toFixed(8) : '0.00000000'}</p>
                    </div>
                </div>
            )}

            {assetType === 'Ação' && (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                        <input
                            required
                            type="number" step="1" min="0"
                            value={quantity}
                            onChange={(e) => handleQuantityChange(e.target.value)}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Valor Investido (R$)</label>
                        <input
                            required
                            type="number" step="0.01" min="0"
                            value={investedAmount}
                            onChange={(e) => handleInvestedAmountChange(e.target.value)}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] outline-none"
                        />
                    </div>
                </div>
            )}

            {(assetType === 'Ação' || assetType === 'Criptomoeda') && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Compra Unitário (Opcional)</label>
                    <input
                        type="number" step="0.01" min="0"
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(e.target.value)}
                        placeholder="Ex: 28.50"
                        className="w-full p-2 border border-gray-200 rounded-lg focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] outline-none"
                    />
                </div>
            )}

            {(assetType === 'Renda Fixa' || assetType === 'Outros') && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Valor Investido (R$)</label>
                        <input
                            required
                            type="number" step="0.01" min="0"
                            value={investedAmount}
                            onChange={(e) => {
                                setInvestedAmount(e.target.value);
                                setQuantity(e.target.value);
                            }}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rendimento Anual (% a.a.)</label>
                        <input
                            type="number" step="0.01" min="0"
                            value={annualYield}
                            onChange={(e) => setAnnualYield(e.target.value)}
                            placeholder="Ex: 12.5 para 12,5% ao ano"
                            className="w-full p-2 border border-gray-200 rounded-lg focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] outline-none"
                        />
                        <p className="text-xs text-gray-400 mt-1">Informe a taxa anual. O sistema calcula os juros compostos automaticamente.</p>
                    </div>
                </div>
            )}

            {/* Preview Section */}
            <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data da Compra</label>
                    <DatePicker required value={startDate} onChange={(val) => setStartDate(val)} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vincular a Meta?</label>
                    <Select
                        value={goalId}
                        onChange={(val) => setGoalId(val)}
                        options={[
                            { value: '', label: 'Não vincular' },
                            ...goals.map(g => ({ value: g.id, label: g.name }))
                        ]}
                    />
                </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-4 mt-4 text-white">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Pré-Visualização</p>
                <div className="flex justify-between items-baseline">
                    <span className="text-gray-300 text-sm">Valor Atual Estimado</span>
                    <span className="font-bold text-lg">R$ {previewCurrentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-baseline mt-1">
                    <span className="text-gray-300 text-sm">Lucro/Prejuízo Simul.</span>
                    <div className="flex items-center gap-2">
                        <span className={`font-bold ${previewProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            R$ {previewProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className={`text-xs ${previewProfit >= 0 ? 'text-emerald-400/80' : 'text-red-400/80'}`}>
                            ({previewProfitPerc > 0 ? '+' : ''}{previewProfitPerc.toFixed(2)}%)
                        </span>
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={!investedAmount || Number(investedAmount) <= 0 || ((assetType === 'Ação' || assetType === 'Criptomoeda') && !assetName)}
                className="w-full bg-[#FF4D00] text-white font-medium py-3 rounded-xl hover:bg-[#E64500] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors mt-4 shadow-lg shadow-[#FF4D00]/20"
            >
                Salvar Registro de Investimento
            </button>
        </form>
    );
}

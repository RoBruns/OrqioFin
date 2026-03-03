import React, { useEffect, useState } from 'react';
import { marketDataService } from '@/services/marketDataService';

interface TickerData {
    symbol: string;
    price: number;
}

const DEFAULT_ASSETS = [
    { symbol: 'BTC', type: 'Criptomoeda' },
    { symbol: 'ETH', type: 'Criptomoeda' },
    { symbol: 'PETR4', type: 'Ação' },
    { symbol: 'VALE3', type: 'Ação' },
    { symbol: 'ITUB4', type: 'Ação' },
    { symbol: 'BBDC4', type: 'Ação' },
    { symbol: 'WEGE3', type: 'Ação' }
];

export function MarketTicker() {
    const [tickers, setTickers] = useState<TickerData[]>([]);

    useEffect(() => {
        let active = true;
        const fetchTickers = async () => {
            const results: TickerData[] = [];
            for (const asset of DEFAULT_ASSETS) {
                const price = await marketDataService.getAssetPrice(asset.symbol, asset.type);
                if (price !== null && active) {
                    results.push({ symbol: asset.symbol, price });
                }
            }
            if (active && results.length > 0) {
                setTickers(results);
                sessionStorage.setItem('market_ticker_cache', JSON.stringify(results));
            }
        };

        // Check if we have cached tickers first to avoid layout jump
        const cached = sessionStorage.getItem('market_ticker_cache');
        if (cached) {
            setTickers(JSON.parse(cached));
        } else {
            fetchTickers();
        }

        return () => { active = false; };
    }, []);

    if (tickers.length === 0) return null;

    // We multiply the array to make sure the CSS ticker has enough content to scroll seamlessly
    const tickerItems = [...tickers, ...tickers, ...tickers, ...tickers];

    return (
        <div className="w-full bg-gray-900 border-b border-gray-800 text-white overflow-hidden py-2 flex items-center shadow-inner relative z-40">
            <div className="flex items-center px-4 shrink-0 bg-gray-900 z-10 font-bold border-r border-[#FF4D00]/30 h-full text-[#FF4D00] text-xs tracking-wider">
                MERCADO
            </div>

            <div className="flex-1 overflow-hidden relative flex items-center w-full">
                <style dangerouslySetInnerHTML={{
                    __html: `
          @keyframes scrollTicker {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-ticker-scroll {
            animation: scrollTicker 30s linear infinite;
            display: flex;
            width: max-content;
          }
          .animate-ticker-scroll:hover {
            animation-play-state: paused;
          }
        `}} />
                <div className="animate-ticker-scroll gap-8 pl-4">
                    {tickerItems.map((t, i) => (
                        <div key={`${t.symbol}-${i}`} className="flex items-center gap-2 text-sm font-medium">
                            <span className="text-gray-400">{t.symbol}</span>
                            <span className="text-emerald-400">R$ {t.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-gray-900 to-transparent z-10 pointer-events-none"></div>
        </div>
    );
}

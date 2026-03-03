export interface MarketPrice {
    ticker: string;
    price: number;
    updatedAt: string;
}

export interface AssetSearchResult {
    symbol: string;
    name: string;
    type: 'Ação' | 'Criptomoeda';
    currentPrice?: number | null;
}

const CACHE_KEY = 'market_data_cache';

// Helper to get from session storage
function getCache(): Record<string, MarketPrice> {
    const cached = sessionStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
}

// Helper to save to session storage
function setCache(cache: Record<string, MarketPrice>) {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

// Map common symbols to CoinGecko IDs
const cryptoMap: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
    'USDT': 'tether',
    'USDC': 'usd-coin'
};

export const marketDataService = {
    /**
     * Fetches the current market price for a given asset.
     * Caches the result in sessionStorage to avoid rate limits during the session.
     */
    async getAssetPrice(ticker: string, type: 'Ação' | 'Criptomoeda' | string): Promise<number | null> {
        if (!ticker || (!['Ação', 'Criptomoeda'].includes(type))) {
            return null; // Don't fetch for Renda Fixa or empty tickers
        }

        const normalizedTicker = ticker.trim().toUpperCase();
        const cache = getCache();

        // Check cache (valid for the whole session, but could add expiry if needed)
        if (cache[normalizedTicker]) {
            return cache[normalizedTicker].price;
        }

        try {
            let price: number | null = null;

            if (type === 'Criptomoeda') {
                const coinId = cryptoMap[normalizedTicker] || normalizedTicker.toLowerCase();
                const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=brl`);
                if (!response.ok) throw new Error('CoinGecko API Error');
                const data = await response.json();

                if (data[coinId] && data[coinId].brl) {
                    price = data[coinId].brl;
                }
            } else if (type === 'Ação') {
                // Remove .SA if user typed it, brapi doesn't strictly need it but handles it
                const cleanTicker = normalizedTicker.replace('.SA', '');
                // Brapi free endpoint
                const response = await fetch(`https://brapi.dev/api/quote/${cleanTicker}`);
                if (!response.ok) throw new Error('Brapi Error');
                const data = await response.json();

                if (data.results && data.results.length > 0) {
                    price = data.results[0].regularMarketPrice;
                }
            }

            if (price !== null) {
                cache[normalizedTicker] = {
                    ticker: normalizedTicker,
                    price,
                    updatedAt: new Date().toISOString()
                };
                setCache(cache);
                return price;
            }

        } catch (error) {
            console.error(`Failed to fetch price for ${normalizedTicker}:`, error);
        }

        return null;
    },

    /**
     * Searches for assets (Crypto or Stocks) based on a query.
     */
    async searchAssets(query: string): Promise<AssetSearchResult[]> {
        if (!query || query.length < 2) return [];

        const results: AssetSearchResult[] = [];

        try {
            // Search Crypto via CoinGecko
            const cgRes = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`);
            if (cgRes.ok) {
                const cgData = await cgRes.json();
                if (cgData.coins) {
                    cgData.coins.slice(0, 5).forEach((c: any) => {
                        results.push({
                            symbol: c.symbol.toUpperCase(),
                            name: c.name,
                            type: 'Criptomoeda'
                        });
                    });
                }
            }
        } catch (e) {
            console.error("CoinGecko search error", e);
        }

        try {
            // Search Stocks via Brapi Quote List
            // Note: Brapi quote/list works with ?search= or ?sortBy=name
            const brapiRes = await fetch(`https://brapi.dev/api/quote/list?search=${encodeURIComponent(query)}`);
            if (brapiRes.ok) {
                const brapiData = await brapiRes.json();
                if (brapiData.stocks) {
                    brapiData.stocks.slice(0, 5).forEach((s: any) => {
                        results.push({
                            symbol: s.stock,
                            name: s.name || s.stock,
                            type: 'Ação'
                        });
                    });
                }
            }
        } catch (e) {
            console.error("Brapi search error", e);
        }

        return results;
    }
};

export interface TickerData {
  symbol: string;
  name: string;
  exchange?: string;
  sector?: string;
  subsector?: string;
}

const API_BASE = 'http://localhost:8000/api';

export async function lookupTicker(symbol: string): Promise<TickerData | null> {
  try {
    const res = await fetch(
      `${API_BASE}/tickers/${encodeURIComponent(symbol)}`
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function searchTickers(query: string): Promise<TickerData[]> {
  if (!query) return [];
  try {
    const res = await fetch(
      `${API_BASE}/tickers/search?q=${encodeURIComponent(query)}`
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

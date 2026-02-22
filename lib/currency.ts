"use client"

// Multi-currency support with exchange rates

export const SUPPORTED_CURRENCIES = {
  AUD: { symbol: "$", name: "Australian Dollar" },
  USD: { symbol: "$", name: "US Dollar" },
  EUR: { symbol: "€", name: "Euro" },
  GBP: { symbol: "£", name: "British Pound" },
  NZD: { symbol: "$", name: "New Zealand Dollar" },
  CAD: { symbol: "$", name: "Canadian Dollar" },
  JPY: { symbol: "¥", name: "Japanese Yen" },
  CNY: { symbol: "¥", name: "Chinese Yuan" },
} as const

export type CurrencyCode = keyof typeof SUPPORTED_CURRENCIES

let exchangeRatesCache: { rates: Record<string, number>; timestamp: number } | null = null
const CACHE_DURATION = 3600000 // 1 hour

export async function fetchExchangeRates(baseCurrency: CurrencyCode = "AUD"): Promise<Record<string, number>> {
  // Check cache
  if (exchangeRatesCache && Date.now() - exchangeRatesCache.timestamp < CACHE_DURATION) {
    return exchangeRatesCache.rates
  }

  try {
    // Using exchangerate-api.com (free tier: 1500 requests/month)
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`)
    if (!response.ok) throw new Error("Failed to fetch rates")
    
    const data = await response.json()
    const rates = data.rates as Record<string, number>
    
    exchangeRatesCache = {
      rates,
      timestamp: Date.now(),
    }
    
    return rates
  } catch (error) {
    console.error("Failed to fetch exchange rates:", error)
    
    // Fallback: approximate rates (as of Feb 2026)
    return {
      AUD: 1.0,
      USD: 0.65,
      EUR: 0.60,
      GBP: 0.52,
      NZD: 1.09,
      CAD: 0.89,
      JPY: 96.5,
      CNY: 4.68,
    }
  }
}

export function convertCurrency(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  rates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount
  
  // Convert to base currency (AUD) first, then to target
  const baseAmount = fromCurrency === "AUD" ? amount : amount / rates[fromCurrency]
  const convertedAmount = toCurrency === "AUD" ? baseAmount : baseAmount * rates[toCurrency]
  
  return Math.round(convertedAmount * 100) / 100
}

export function formatCurrencyWithCode(
  amount: number,
  currency: CurrencyCode,
  showCode: boolean = false
): string {
  const currencyInfo = SUPPORTED_CURRENCIES[currency]
  const formatted = `${currencyInfo.symbol}${amount.toFixed(2)}`
  return showCode ? `${formatted} ${currency}` : formatted
}

export function getExchangeRatesFromStorage(): Record<string, number> | null {
  if (typeof window === "undefined") return null
  
  try {
    const cached = localStorage.getItem("exchangeRates")
    if (!cached) return null
    
    const { rates, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp > CACHE_DURATION) return null
    
    return rates
  } catch {
    return null
  }
}

export function saveExchangeRatesToStorage(rates: Record<string, number>): void {
  if (typeof window === "undefined") return
  
  try {
    localStorage.setItem("exchangeRates", JSON.stringify({
      rates,
      timestamp: Date.now(),
    }))
  } catch (error) {
    console.error("Failed to save exchange rates:", error)
  }
}

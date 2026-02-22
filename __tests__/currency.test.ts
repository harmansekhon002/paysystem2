import { describe, expect, it } from "vitest"
import { convertCurrency, formatCurrencyWithCode, SUPPORTED_CURRENCIES } from "@/lib/currency"

describe("currency utilities", () => {
  const mockRates = {
    AUD: 1.0,
    USD: 0.65,
    EUR: 0.60,
    GBP: 0.52,
    NZD: 1.09,
    CAD: 0.89,
    JPY: 96.5,
    CNY: 4.68,
  }

  describe("convertCurrency", () => {
    it("returns same amount for same currency", () => {
      expect(convertCurrency(100, "AUD", "AUD", mockRates)).toBe(100)
      expect(convertCurrency(50, "USD", "USD", mockRates)).toBe(50)
    })

    it("converts AUD to other currencies", () => {
      expect(convertCurrency(100, "AUD", "USD", mockRates)).toBe(65)
      expect(convertCurrency(100, "AUD", "EUR", mockRates)).toBe(60)
      expect(convertCurrency(100, "AUD", "GBP", mockRates)).toBe(52)
    })

    it("converts between non-AUD currencies", () => {
      // 100 USD to EUR: 100 / 0.65 * 0.60 = 92.31
      const result = convertCurrency(100, "USD", "EUR", mockRates)
      expect(result).toBeCloseTo(92.31, 2)
    })

    it("rounds to 2 decimal places", () => {
      const result = convertCurrency(33.33, "AUD", "USD", mockRates)
      expect(result.toString()).toMatch(/^\d+\.\d{1,2}$/)
    })
  })

  describe("formatCurrencyWithCode", () => {
    it("formats with correct currency symbol", () => {
      expect(formatCurrencyWithCode(100, "AUD")).toBe("$100.00")
      expect(formatCurrencyWithCode(50.5, "EUR")).toBe("€50.50")
      expect(formatCurrencyWithCode(25, "GBP")).toBe("£25.00")
    })

    it("optionally shows currency code", () => {
      expect(formatCurrencyWithCode(100, "AUD", true)).toBe("$100.00 AUD")
      expect(formatCurrencyWithCode(50, "EUR", true)).toBe("€50.00 EUR")
    })

    it("always shows 2 decimal places", () => {
      expect(formatCurrencyWithCode(10, "USD")).toBe("$10.00")
      expect(formatCurrencyWithCode(10.1, "USD")).toBe("$10.10")
    })
  })

  describe("SUPPORTED_CURRENCIES", () => {
    it("contains all major currencies", () => {
      expect(SUPPORTED_CURRENCIES).toHaveProperty("AUD")
      expect(SUPPORTED_CURRENCIES).toHaveProperty("USD")
      expect(SUPPORTED_CURRENCIES).toHaveProperty("EUR")
      expect(SUPPORTED_CURRENCIES).toHaveProperty("GBP")
    })

    it("has correct currency info", () => {
      expect(SUPPORTED_CURRENCIES.AUD).toEqual({ symbol: "$", name: "Australian Dollar" })
      expect(SUPPORTED_CURRENCIES.EUR).toEqual({ symbol: "€", name: "Euro" })
      expect(SUPPORTED_CURRENCIES.GBP).toEqual({ symbol: "£", name: "British Pound" })
    })
  })
})

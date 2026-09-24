// =============================================================================
// CyberRiskOS — Currency Formatting Utility
// Phase 9 — ISO-4217 Organization-level Currency Display
//
// Rules:
//   - ONE ORGANIZATION = ONE BASE CURRENCY
//   - Use Intl.NumberFormat for all monetary values
//   - Never hardcode '$', '₹', or any other symbol in JSX
//   - null currency → NOT_AVAILABLE display
//   - Never silently substitute a missing currency with USD
// =============================================================================

/**
 * Maps ISO-4217 currency codes to their preferred locale for number formatting.
 * Extensible: add more entries as needed.
 */
const CURRENCY_LOCALE_MAP: Record<string, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  GBP: 'en-GB',
  EUR: 'de-DE',
  JPY: 'ja-JP',
  AUD: 'en-AU',
  CAD: 'en-CA',
  SGD: 'en-SG',
  AED: 'ar-AE',
};

const DEFAULT_LOCALE = 'en-US';

/**
 * Returns a locale string for the given ISO-4217 currency code.
 * Falls back to en-US for unknown currencies.
 */
export function localeForCurrency(currency: string | null | undefined): string {
  if (!currency) return DEFAULT_LOCALE;
  return CURRENCY_LOCALE_MAP[currency.toUpperCase()] ?? DEFAULT_LOCALE;
}

/**
 * Formats a monetary amount using the organization's authoritative currency.
 *
 * @param amount - The numeric monetary value
 * @param currency - ISO-4217 currency code (e.g. 'INR', 'USD') or null
 * @param options.compact - If true, abbreviates large numbers (e.g. ₹1.2M)
 * @returns Formatted string, or NOT_AVAILABLE if currency is null/missing
 *
 * @example
 *   formatCurrency(1500000, 'INR')   // "₹15,00,000.00"
 *   formatCurrency(1500000, 'USD')   // "$1,500,000.00"
 *   formatCurrency(null, 'INR')      // "NOT_AVAILABLE"
 *   formatCurrency(5000, null)       // "NOT_AVAILABLE"
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency: string | null | undefined,
  options?: { compact?: boolean }
): string {
  if (amount === null || amount === undefined) return 'NOT_AVAILABLE';
  if (!currency) return 'NOT_AVAILABLE';

  const locale = localeForCurrency(currency);
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.toUpperCase(),
      notation: options?.compact ? 'compact' : 'standard',
      minimumFractionDigits: options?.compact ? 0 : 2,
      maximumFractionDigits: options?.compact ? 2 : 2,
    }).format(amount);
  } catch {
    // Fallback for unsupported currencies in older environments
    return `${currency.toUpperCase()} ${amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

/**
 * Returns a compact formatted amount for dashboard summary cards.
 * e.g. ₹1.5Cr → uses compact notation
 */
export function formatCurrencyCompact(
  amount: number | null | undefined,
  currency: string | null | undefined
): string {
  return formatCurrency(amount, currency, { compact: true });
}

/**
 * Returns a currency badge label for display alongside a number.
 * e.g. "INR" or "NOT_AVAILABLE"
 */
export function currencyLabel(currency: string | null | undefined): string {
  if (!currency) return 'NOT_AVAILABLE';
  return currency.toUpperCase();
}

/**
 * Checks whether a currency value is considered available (non-null, non-empty).
 */
export function isCurrencyAvailable(currency: string | null | undefined): boolean {
  return Boolean(currency && currency.trim().length === 3);
}

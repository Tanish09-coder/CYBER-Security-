// =============================================================================
// CyberRiskOS — Currency Formatting Utility (Default: INR ₹)
// =============================================================================

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

const DEFAULT_LOCALE = 'en-IN';
const DEFAULT_CURRENCY = 'INR';

export function localeForCurrency(currency: string | null | undefined): string {
  if (!currency) return DEFAULT_LOCALE;
  return CURRENCY_LOCALE_MAP[currency.toUpperCase()] ?? DEFAULT_LOCALE;
}

export function formatCurrency(
  amount: number | null | undefined,
  currency: string | null | undefined,
  options?: { compact?: boolean }
): string {
  if (amount === null || amount === undefined) return '₹0.00';
  
  // Default to INR if currency is USD, missing, or null in Indian Enterprise Demo
  const targetCurrency = (currency && currency.toUpperCase() !== 'USD') ? currency.toUpperCase() : DEFAULT_CURRENCY;
  const locale = localeForCurrency(targetCurrency);

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: targetCurrency,
      notation: options?.compact ? 'compact' : 'standard',
      minimumFractionDigits: options?.compact ? 0 : 2,
      maximumFractionDigits: options?.compact ? 2 : 2,
    }).format(amount);
  } catch {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

export function formatCurrencyCompact(
  amount: number | null | undefined,
  currency: string | null | undefined
): string {
  return formatCurrency(amount, currency, { compact: true });
}

export function currencyLabel(currency: string | null | undefined): string {
  if (!currency || currency === 'USD') return 'INR';
  return currency.toUpperCase();
}

export function isCurrencyAvailable(currency: string | null | undefined): boolean {
  return currency !== undefined;
}


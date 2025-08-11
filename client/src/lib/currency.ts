import { useQuery } from '@tanstack/react-query';

// Currency symbols mapping
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  PKR: 'Rs.',
};

// Fetch system settings to get currency preference
// Define the expected shape of the settings object
type SystemSettings = {
  currency?: {
    value?: string;
  };
};

export function useCurrency() {
  const { data: settings } = useQuery<SystemSettings>({
    queryKey: ['/api/system-settings/public'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const currency = settings?.currency?.value || 'USD';
  const symbol = CURRENCY_SYMBOLS[currency] || '$';

  return { currency, symbol };
}

// Format price with the selected currency
export function formatPrice(price: number | string, currency?: string, symbol?: string): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice)) return '';
  
  // Use provided currency/symbol or defaults
  const currencyCode = currency || 'USD';
  const currencySymbol = symbol || CURRENCY_SYMBOLS[currencyCode] || '$';
  
  // Format differently based on currency
  if (currencyCode === 'PKR') {
    // Pakistani Rupee formatting
    return `${currencySymbol} ${numPrice.toLocaleString('en-PK', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  } else {
    // USD and other currencies
    return `${currencySymbol}${numPrice.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}

// Hook that combines currency data with formatting
export function usePriceFormatter() {
  const { currency, symbol } = useCurrency();
  
  return {
    currency,
    symbol,
    formatPrice: (price: number | string) => formatPrice(price, currency, symbol),
  };
}
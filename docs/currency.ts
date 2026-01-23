import currencies from './sorted-currencies.json';

type CurrencyT = {
  code: string;
  name_en: string;
  symbol: string;
  intl_locale: string;
  region: string;
}

const formatCurrency = (amount: number, currencyCode: string): string => {
  const currency = currencies[currencyCode] as CurrencyT;

  if (!currency) {
    throw new Error(`Currency ${currencyCode} not found`);
  }

  const cryptoCurrencies = new Set(['BTC', 'ETH', 'BCH', 'DASH', 'EOS', 'LTC', 'XLM', 'XRP']);
  
  if (cryptoCurrencies.has(currency.code)) {
    const formatted = new Intl.NumberFormat(currency.intl_locale, {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(amount);
    
    return `${currency.symbol} ${formatted}`;
  }

  return new Intl.NumberFormat(currency.intl_locale, {
    style: 'currency',
    currency: currency.code,
    currencyDisplay: 'narrowSymbol',
  }).format(amount);
};

export default formatCurrency;
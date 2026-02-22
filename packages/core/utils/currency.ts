/**
 * Currency formatting utility for EGP
 */
export const formatCurrency = (
  amount: number,
  locale: string = 'en',
  currency: string = 'EGP'
) => {
  if (locale === 'ar') {
    // Standard Arabic formatting for Egypt
    return `${amount.toLocaleString('ar-EG')} ج.م`;
  }

  // English formatting (e.g., EGP 100.00)
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    currencyDisplay: 'code',
  }).format(amount);
};

export const isRTL = (locale: string) => locale === 'ar';

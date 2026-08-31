const formatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
})

/**
 * The ONLY place money becomes a string. Whole units, grouped separators,
 * currency symbol — never rounded, never abbreviated (no "k", no lakh
 * shorthand). Never parse this back into a calculation.
 */
export function formatCurrency(amount: number): string {
  return formatter.format(amount)
}

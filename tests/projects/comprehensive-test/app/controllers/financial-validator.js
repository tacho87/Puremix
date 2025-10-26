/**
 * Financial Data Validation Controller
 * Provides validation for loan parameters and financial data
 */

export function validateFinancialData(data) {
  const errors = [];

  // Principal validation
  if (!data.principal || data.principal <= 0) {
    errors.push('Principal amount must be greater than 0');
  }
  if (data.principal > 50000000) {
    errors.push('Principal amount exceeds maximum limit ($50M)');
  }

  // Interest rate validation
  if (!data.rate || data.rate < 0) {
    errors.push('Interest rate must be non-negative');
  }
  if (data.rate > 50) {
    errors.push('Interest rate seems unusually high (>50%)');
  }

  // Years validation
  if (!data.years || data.years <= 0) {
    errors.push('Loan term must be greater than 0 years');
  }
  if (data.years > 50) {
    errors.push('Loan term exceeds reasonable limit (50 years)');
  }

  // Extra payment validation (optional)
  if (data.extraPayment && data.extraPayment < 0) {
    errors.push('Extra payment cannot be negative');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
}

export function calculateBasicPayment(principal, rate, years) {
  const monthlyRate = rate / 100 / 12;
  const numPayments = years * 12;

  if (monthlyRate === 0) {
    return principal / numPayments;
  }

  return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
         (Math.pow(1 + monthlyRate, numPayments) - 1);
}
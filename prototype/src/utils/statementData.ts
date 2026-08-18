// Helper to generate realistic statement data mimicking the PDF example
export function generateDemoStatement(
  baseAmount: number,
  isCustomer: boolean
) {
  const transactions = [];
  let currentBalance = 0;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // We want to generate ~20 transactions over the last 2 months
  const dates = [];
  for (let i = 60; i >= 0; i -= Math.floor(Math.random() * 5) + 1) {
    const d = new Date(year, month, now.getDate() - i);
    dates.push(d);
  }

  dates.forEach((date, i) => {
    const dateStr = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    // Randomize whether it's a purchase or a payment
    // For customers: Purchase increases balance (Debit), Payment decreases balance (Credit)
    // For suppliers: Purchase increases balance (Credit), Payment decreases balance (Debit)
    const isPurchase = Math.random() > 0.4 || i === 0;
    
    if (isPurchase) {
      const amount = Math.floor(Math.random() * baseAmount * 2) + baseAmount / 2;
      currentBalance += amount;
      
      transactions.push({
        date: dateStr,
        invoiceNo: `${Math.floor(Math.random() * 9000) + 1000}`,
        description: isCustomer ? 'Sales Invoice' : 'Purchase',
        debit: isCustomer ? amount : 0,
        credit: isCustomer ? 0 : amount,
        balance: currentBalance,
      });
    } else {
      const paymentMethods = ['Bank Payment', 'Cash Payment', 'M-Pesa Payment'];
      const method = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      
      // Pay off some random amount
      const amount = Math.floor(Math.random() * currentBalance * 0.8) + 100;
      currentBalance -= amount;

      transactions.push({
        date: dateStr,
        invoiceNo: '-',
        description: method,
        debit: isCustomer ? 0 : amount,
        credit: isCustomer ? amount : 0,
        balance: currentBalance,
      });
    }
  });

  return {
    transactions,
    currentBalance,
    startDate: dates[0].toISOString(),
    endDate: dates[dates.length - 1].toISOString(),
  };
}

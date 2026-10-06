/** Indian currency words, including paise, derived from the numeric amount. */
export function numberToIndianWords(value) {
  const amount = Number(value);
  const totalPaise = Math.round((amount + Number.EPSILON) * 100);
  if (!Number.isFinite(amount) || amount < 0 || !Number.isSafeInteger(totalPaise)) return '';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function words(n) {
    if (n === 0) return 'Zero';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    const scales = [[10000000, 'Crore'], [100000, 'Lakh'], [1000, 'Thousand'], [100, 'Hundred']];
    for (const [scale, label] of scales) {
      if (n >= scale) return words(Math.floor(n / scale)) + ' ' + label + (n % scale ? ' ' + words(n % scale) : '');
    }
    return '';
  }
  const rupees = Math.floor(totalPaise / 100), paise = totalPaise % 100;
  return 'Rupees ' + words(rupees) + (paise ? ' and ' + words(paise) + ' Paise' : '') + ' Only';
}

export function formatIndianCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

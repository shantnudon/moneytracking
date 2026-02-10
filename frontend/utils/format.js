export const formatCurrency = (amount, currencyCode = "INR") => {
  const locale = currencyCode === "INR" ? "en-IN" : "en-US";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (error) {
    return `${currencyCode} ${amount.toLocaleString()}`;
  }
};

export const getCurrencySymbol = (currencyCode = "INR") => {
  try {
    const formatter = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currencyCode,
    });
    return formatter.formatToParts(0).find((part) => part.type === "currency")
      .value;
  } catch (error) {
    return currencyCode;
  }
};

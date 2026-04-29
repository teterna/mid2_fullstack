export function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(Number(value || 0));
}

export function sortStocks(stocks) {
  return [...stocks].sort((a, b) => a.ticker.localeCompare(b.ticker));
}

export function getOwnerId(stock) {
  return stock.owner?._id || stock.owner?.id || stock.owner;
}


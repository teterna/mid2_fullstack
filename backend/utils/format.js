function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100;
}

function formatUser(user) {
  return {
    _id: user._id.toString(),
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    walletBalance: roundMoney(user.walletBalance),
    holdings: user.holdings.map((holding) => ({
      ticker: holding.ticker,
      shares: holding.shares
    }))
  };
}

function formatStock(stock) {
  const owner = stock.owner && stock.owner._id ? stock.owner : null;

  return {
    _id: stock._id.toString(),
    ticker: stock.ticker,
    name: stock.name,
    price: roundMoney(stock.price),
    owner: owner
      ? {
          _id: owner._id.toString(),
          id: owner._id.toString(),
          name: owner.name
        }
      : stock.owner.toString()
  };
}

module.exports = {
  formatStock,
  formatUser,
  roundMoney
};


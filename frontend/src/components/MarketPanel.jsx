import { getOwnerId, money } from "../utils";

function MarketPanel({
  holdingMap,
  loading,
  onDeleteStock,
  onPriceInputChange,
  onTrade,
  onTradeInputChange,
  onUpdatePrice,
  priceInputs,
  prices,
  stocks,
  tradeInputs,
  user
}) {
  return (
    <section className="market-panel">
      <div className="panel-heading">
        <h2>Live Market</h2>
        <span>{stocks.length} tickers</span>
      </div>

      <div className="market-table">
        <div className="table-head">
          <span>Company</span>
          <span>Price</span>
          <span>Owned</span>
          <span>Trade</span>
        </div>

        {stocks.length === 0 ? (
          <p className="empty-text">No stocks have been listed yet.</p>
        ) : (
          stocks.map((stock) => {
            const currentPrice = prices[stock.ticker] || stock.price;
            const isOwner = getOwnerId(stock) === user._id;

            return (
              <article className="stock-row" key={stock.ticker}>
                <div>
                  <span className="ticker-badge">${stock.ticker}</span>
                  <h3>{stock.name}</h3>
                  <small>by {stock.owner?.name || "Unknown"}</small>
                </div>

                <div className="price-cell">
                  <strong>{money(currentPrice)}</strong>
                  {isOwner && (
                    <div className="price-editor">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={priceInputs[stock.ticker] || ""}
                        onChange={(event) => onPriceInputChange(stock.ticker, event.target.value)}
                        placeholder="Price"
                      />
                      <button
                        className="small-button"
                        disabled={loading}
                        onClick={() => onUpdatePrice(stock.ticker)}
                      >
                        Update
                      </button>
                      <button
                        className="small-button danger"
                        disabled={loading}
                        onClick={() => onDeleteStock(stock.ticker)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                <div className="owned-cell">
                  <strong>{holdingMap[stock.ticker] || 0}</strong>
                  <span>shares</span>
                </div>

                <div className="trade-cell">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={tradeInputs[stock.ticker] || ""}
                    onChange={(event) => onTradeInputChange(stock.ticker, event.target.value)}
                    placeholder="1"
                  />
                  <button
                    className="small-button buy"
                    disabled={loading}
                    onClick={() => onTrade(stock.ticker, "buy")}
                  >
                    Buy
                  </button>
                  <button
                    className="small-button sell"
                    disabled={loading}
                    onClick={() => onTrade(stock.ticker, "sell")}
                  >
                    Sell
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

export default MarketPanel;


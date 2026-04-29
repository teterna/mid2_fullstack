import { money } from "../utils";

function CompanyPanel({
  loading,
  myStock,
  onCreateStock,
  onDeleteStock,
  onStockFormChange,
  prices,
  stockForm
}) {
  return (
    <>
      <div className="panel-heading">
        <h2>Issue Your Stock</h2>
        <span>1 per user</span>
      </div>

      {myStock ? (
        <div className="company-summary">
          <span className="ticker-badge">${myStock.ticker}</span>
          <h3>{myStock.name}</h3>
          <p>{money(prices[myStock.ticker] || myStock.price)} per share</p>
          <button
            className="danger-button"
            disabled={loading}
            onClick={() => onDeleteStock(myStock.ticker)}
          >
            Delete Ticker
          </button>
        </div>
      ) : (
        <form className="stacked-form" onSubmit={onCreateStock}>
          <label>
            Ticker
            <input
              value={stockForm.ticker}
              onChange={(event) => onStockFormChange({ ...stockForm, ticker: event.target.value })}
              placeholder="DEV"
              maxLength="8"
            />
          </label>
          <label>
            Company Name
            <input
              value={stockForm.name}
              onChange={(event) => onStockFormChange({ ...stockForm, name: event.target.value })}
              placeholder="Dev Labs"
            />
          </label>
          <label>
            Opening Price
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={stockForm.price}
              onChange={(event) => onStockFormChange({ ...stockForm, price: event.target.value })}
              placeholder="25.00"
            />
          </label>
          <button className="primary-button" disabled={loading}>
            List Stock
          </button>
        </form>
      )}
    </>
  );
}

export default CompanyPanel;


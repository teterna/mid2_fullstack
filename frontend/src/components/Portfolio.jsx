import { money } from "../utils";

function Portfolio({ prices, user }) {
  return (
    <div className="portfolio">
      <div className="panel-heading">
        <h2>Portfolio</h2>
        <span>{user.holdings.length} positions</span>
      </div>

      {user.holdings.length === 0 ? (
        <p className="empty-text">No shares yet.</p>
      ) : (
        user.holdings.map((holding) => (
          <div className="holding-row" key={holding.ticker}>
            <span>${holding.ticker}</span>
            <strong>{holding.shares} shares</strong>
            <small>{money(holding.shares * (prices[holding.ticker] || 0))}</small>
          </div>
        ))
      )}
    </div>
  );
}

export default Portfolio;


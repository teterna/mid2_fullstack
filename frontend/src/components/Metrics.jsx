import { money } from "../utils";

function Metrics({ myStock, totalValuation, user }) {
  return (
    <section className="metrics-grid">
      <article className="metric-card">
        <span>Wallet</span>
        <strong>{money(user.walletBalance)}</strong>
      </article>
      <article className="metric-card">
        <span>Total Valuation</span>
        <strong>{money(totalValuation)}</strong>
      </article>
      <article className="metric-card">
        <span>Your Company</span>
        <strong>{myStock ? `$${myStock.ticker}` : "Not listed"}</strong>
      </article>
    </section>
  );
}

export default Metrics;


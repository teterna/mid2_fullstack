import MarketPanel from "./MarketPanel";
import Metrics from "./Metrics";
import SidePanel from "./SidePanel";
import Topbar from "./Topbar";

function Dashboard(props) {
  return (
    <main className="dashboard">
      <Topbar onLogout={props.onLogout} socketStatus={props.socketStatus} />

      <Metrics myStock={props.myStock} totalValuation={props.totalValuation} user={props.user} />

      {props.message && <p className="notice wide">{props.message}</p>}

      <section className="workspace">
        <SidePanel
          loading={props.loading}
          myStock={props.myStock}
          onCreateStock={props.onCreateStock}
          onDeleteStock={props.onDeleteStock}
          onStockFormChange={props.onStockFormChange}
          prices={props.prices}
          stockForm={props.stockForm}
          user={props.user}
        />

        <MarketPanel
          holdingMap={props.holdingMap}
          loading={props.loading}
          onDeleteStock={props.onDeleteStock}
          onPriceInputChange={props.onPriceInputChange}
          onTrade={props.onTrade}
          onTradeInputChange={props.onTradeInputChange}
          onUpdatePrice={props.onUpdatePrice}
          priceInputs={props.priceInputs}
          prices={props.prices}
          stocks={props.stocks}
          tradeInputs={props.tradeInputs}
          user={props.user}
        />
      </section>
    </main>
  );
}

export default Dashboard;

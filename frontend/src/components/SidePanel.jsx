import CompanyPanel from "./CompanyPanel";
import Portfolio from "./Portfolio";

function SidePanel(props) {
  return (
    <aside className="side-panel">
      <CompanyPanel
        loading={props.loading}
        myStock={props.myStock}
        onCreateStock={props.onCreateStock}
        onDeleteStock={props.onDeleteStock}
        onStockFormChange={props.onStockFormChange}
        prices={props.prices}
        stockForm={props.stockForm}
      />
      <Portfolio prices={props.prices} user={props.user} />
    </aside>
  );
}

export default SidePanel;


function Topbar({ onLogout, socketStatus }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">The Personal Exchange</p>
        <h1>PEX Market</h1>
      </div>
      <div className="topbar-actions">
        <span className={`socket-pill ${socketStatus}`}>{socketStatus}</span>
        <button className="ghost-button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}

export default Topbar;


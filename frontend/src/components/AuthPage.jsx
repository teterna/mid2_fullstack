function AuthPage({
  authForm,
  authMode,
  loading,
  message,
  onAuthFormChange,
  onAuthModeChange,
  onSubmit
}) {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div>
          <p className="eyebrow">The Personal Exchange</p>
          <h1>PEX</h1>
          <p className="auth-copy">
            Trade public shares of other users, issue one ticker of your own, and watch the market
            reprice live.
          </p>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="mode-switch">
            <button
              type="button"
              className={authMode === "login" ? "active" : ""}
              onClick={() => onAuthModeChange("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={authMode === "register" ? "active" : ""}
              onClick={() => onAuthModeChange("register")}
            >
              Register
            </button>
          </div>

          {authMode === "register" && (
            <label>
              Name
              <input
                value={authForm.name}
                onChange={(event) => onAuthFormChange({ ...authForm, name: event.target.value })}
                placeholder="Ada Lovelace"
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              value={authForm.email}
              onChange={(event) => onAuthFormChange({ ...authForm, email: event.target.value })}
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={authForm.password}
              onChange={(event) => onAuthFormChange({ ...authForm, password: event.target.value })}
              placeholder="6+ characters"
            />
          </label>

          <button className="primary-button" disabled={loading}>
            {loading ? "Please wait" : authMode === "login" ? "Enter PEX" : "Create Account"}
          </button>

          {message && <p className="notice">{message}</p>}
        </form>
      </section>
    </main>
  );
}

export default AuthPage;


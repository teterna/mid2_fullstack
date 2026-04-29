import AuthPage from "./components/AuthPage";
import Dashboard from "./components/Dashboard";
import usePexApp from "./hooks/usePexApp";
import "./styles.css";

function App() {
  const { authPageProps, dashboardProps, user } = usePexApp();

  if (!user) {
    return <AuthPage {...authPageProps} />;
  }

  return <Dashboard {...dashboardProps} />;
}

export default App;


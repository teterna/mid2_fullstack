import { useEffect, useMemo, useState } from "react";
import { apiRequest, WS_URL } from "../api";
import { getOwnerId, money, sortStocks } from "../utils";

function usePexApp() {
  const [token, setToken] = useState(() => localStorage.getItem("pexToken") || "");
  const [user, setUser] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [prices, setPrices] = useState({});
  const [socketStatus, setSocketStatus] = useState("offline");
  const [authMode, setAuthMode] = useState("login");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [stockForm, setStockForm] = useState({
    ticker: "",
    name: "",
    price: ""
  });

  const [priceInputs, setPriceInputs] = useState({});
  const [tradeInputs, setTradeInputs] = useState({});

  function request(path, options = {}) {
    const requestToken = options.authToken === undefined ? token : options.authToken;

    return apiRequest(path, {
      method: options.method,
      body: options.body,
      token: requestToken
    });
  }

  function saveSession(nextToken, nextUser) {
    localStorage.setItem("pexToken", nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }

  function logout() {
    localStorage.removeItem("pexToken");
    setToken("");
    setUser(null);
    setStocks([]);
    setPrices({});
    setSocketStatus("offline");
  }

  async function loadMarket(authToken = token) {
    const data = await request("/stocks", { authToken });
    setStocks(sortStocks(data.stocks));

    const nextPrices = {};
    data.stocks.forEach((stock) => {
      nextPrices[stock.ticker] = stock.price;
    });
    setPrices(nextPrices);
  }

  async function loadSession() {
    if (!token) {
      return;
    }

    try {
      const meData = await request("/auth/me");
      setUser(meData.user);
      await loadMarket(token);
    } catch (error) {
      setMessage(error.message);
      logout();
    }
  }

  useEffect(() => {
    loadSession();
  }, [token]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    setSocketStatus("connecting");
    const socket = new WebSocket(WS_URL, token);

    socket.addEventListener("open", () => {
      setSocketStatus("live");
    });

    socket.addEventListener("close", () => {
      setSocketStatus("offline");
    });

    socket.addEventListener("error", () => {
      setSocketStatus("error");
    });

    socket.addEventListener("message", (event) => {
      const messageData = JSON.parse(event.data);

      if (messageData.type === "STOCK_CREATED") {
        addStockLocally(messageData.payload.stock);
        return;
      }

      if (messageData.type === "STOCK_DELETED") {
        removeStockLocally(messageData.payload.ticker);
        return;
      }

      if (messageData.type === "TICKER_UPDATE") {
        const { ticker, price } = messageData.payload;

        setPrices((currentPrices) => ({
          ...currentPrices,
          [ticker]: price
        }));

        setStocks((currentStocks) =>
          currentStocks.map((stock) => (stock.ticker === ticker ? { ...stock, price } : stock))
        );
      }
    });

    return () => {
      socket.close();
    };
  }, [token]);

  const holdingMap = useMemo(() => {
    const map = {};

    if (!user) {
      return map;
    }

    user.holdings.forEach((holding) => {
      map[holding.ticker] = holding.shares;
    });

    return map;
  }, [user]);

  const totalValuation = useMemo(() => {
    if (!user) {
      return 0;
    }

    const stockValue = user.holdings.reduce((sum, holding) => {
      const currentPrice = prices[holding.ticker] || 0;
      return sum + holding.shares * currentPrice;
    }, 0);

    return user.walletBalance + stockValue;
  }, [user, prices]);

  const myStock = useMemo(() => {
    if (!user) {
      return null;
    }

    return stocks.find((stock) => getOwnerId(stock) === user._id);
  }, [stocks, user]);

  function addStockLocally(stock) {
    setPrices((currentPrices) => ({
      ...currentPrices,
      [stock.ticker]: stock.price
    }));

    setStocks((currentStocks) => {
      const alreadyExists = currentStocks.some(
        (currentStock) => currentStock.ticker === stock.ticker
      );

      if (alreadyExists) {
        return currentStocks.map((currentStock) =>
          currentStock.ticker === stock.ticker ? stock : currentStock
        );
      }

      return sortStocks([...currentStocks, stock]);
    });
  }

  function removeStockLocally(ticker) {
    setStocks((currentStocks) => currentStocks.filter((stock) => stock.ticker !== ticker));

    setPrices((currentPrices) => {
      const nextPrices = { ...currentPrices };
      delete nextPrices[ticker];
      return nextPrices;
    });

    setPriceInputs((currentInputs) => {
      const nextInputs = { ...currentInputs };
      delete nextInputs[ticker];
      return nextInputs;
    });

    setTradeInputs((currentInputs) => {
      const nextInputs = { ...currentInputs };
      delete nextInputs[ticker];
      return nextInputs;
    });

    setUser((currentUser) => {
      if (!currentUser) {
        return currentUser;
      }

      return {
        ...currentUser,
        holdings: currentUser.holdings.filter((holding) => holding.ticker !== ticker)
      };
    });
  }

  function handlePriceInputChange(ticker, value) {
    setPriceInputs((currentInputs) => ({
      ...currentInputs,
      [ticker]: value
    }));
  }

  function handleTradeInputChange(ticker, value) {
    setTradeInputs((currentInputs) => ({
      ...currentInputs,
      [ticker]: value
    }));
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const path = authMode === "login" ? "/auth/login" : "/auth/register";
      const body =
        authMode === "login"
          ? { email: authForm.email, password: authForm.password }
          : authForm;
      const data = await request(path, {
        method: "POST",
        body,
        authToken: ""
      });

      saveSession(data.token, data.user);
      await loadMarket(data.token);
      setMessage(authMode === "login" ? "Welcome back." : "Account created.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateStock(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const data = await request("/stocks", {
        method: "POST",
        body: stockForm
      });

      addStockLocally(data.stock);
      setStockForm({ ticker: "", name: "", price: "" });
      setMessage(`${data.stock.ticker} is now listed.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdatePrice(ticker) {
    setLoading(true);
    setMessage("");

    try {
      const data = await request(`/stocks/${ticker}/price`, {
        method: "PUT",
        body: {
          price: priceInputs[ticker]
        }
      });

      setPrices((currentPrices) => ({
        ...currentPrices,
        [ticker]: data.stock.price
      }));
      setStocks((currentStocks) =>
        currentStocks.map((stock) => (stock.ticker === ticker ? data.stock : stock))
      );
      setPriceInputs((currentInputs) => ({ ...currentInputs, [ticker]: "" }));
      setMessage(`${ticker} moved to ${money(data.stock.price)}.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteStock(ticker) {
    const shouldDelete = window.confirm(`Delete $${ticker}? This removes it from the market.`);

    if (!shouldDelete) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const data = await request(`/stocks/${ticker}`, {
        method: "DELETE"
      });

      removeStockLocally(ticker);
      setMessage(data.message);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleTrade(ticker, action) {
    const shares = tradeInputs[ticker] || 1;
    setLoading(true);
    setMessage("");

    try {
      const data = await request(`/trades/${action}`, {
        method: "POST",
        body: {
          ticker,
          shares
        }
      });

      setUser(data.user);
      setStocks((currentStocks) =>
        currentStocks.map((stock) => (stock.ticker === ticker ? data.stock : stock))
      );
      setTradeInputs((currentInputs) => ({ ...currentInputs, [ticker]: "" }));
      setMessage(data.message);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return {
    authPageProps: {
      authForm,
      authMode,
      loading,
      message,
      onAuthFormChange: setAuthForm,
      onAuthModeChange: setAuthMode,
      onSubmit: handleAuthSubmit
    },
    dashboardProps: {
      holdingMap,
      loading,
      message,
      myStock,
      onCreateStock: handleCreateStock,
      onDeleteStock: handleDeleteStock,
      onLogout: logout,
      onPriceInputChange: handlePriceInputChange,
      onStockFormChange: setStockForm,
      onTrade: handleTrade,
      onTradeInputChange: handleTradeInputChange,
      onUpdatePrice: handleUpdatePrice,
      priceInputs,
      prices,
      socketStatus,
      stockForm,
      stocks,
      totalValuation,
      tradeInputs,
      user
    },
    user
  };
}

export default usePexApp;


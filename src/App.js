import Routes from "./routes/Routes";
import "./styles/scss/main.scss";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { asyncCompanyFetch } from "./redux/company/action/companyAction";
import { SeoHelmet, OfflineNotification } from "./components";
import { Toaster } from "react-hot-toast";
import { publicIpv4 } from "public-ip";
import { ThemeContext, StrategyStateProvider } from "./context";
import PerformanceMonitor from "./components/global/PerformanceMonitor";
import { TradingBoxProvider } from "./context/TradingBoxContext";
import { ChartPopupProvider } from "./context/ChartPopupContext";
import ErrorBoundary from "./components/global/ErrorBoundary";
import serviceWorkerManager from "./utils/serviceWorker";
import toast from "react-hot-toast";
import { warningMsgStyle } from "./data/jsonData";

function App() {
  
  const dispatch = useDispatch();
  const [themeMode, setThemeMode] = useState("light");

  useEffect(() => {
    dispatch(asyncCompanyFetch());
    setIp();

    // Register service worker using the manager
    serviceWorkerManager.register();

    // Theme: light mode only - always remove dark-theme
    document.body.classList.remove("dark-theme");
    localStorage.setItem("theme", "light");

    // Listen for inactivity warning
    const handleInactivityWarning = (event) => {
      const { timeRemaining } = event.detail || {};
      const message = timeRemaining 
        ? `Your session will expire in ${timeRemaining} seconds due to inactivity. Please interact with the page to stay logged in.`
        : "Your session will expire in 1 minute due to inactivity. Please interact with the page to stay logged in.";
      
      toast.error(message, {
        ...warningMsgStyle,
        duration: 60000, // Show for 60 seconds
        id: "inactivity-warning", // Use same ID to replace previous toast
      });
    };

    // Listen for inactivity logout
    const handleInactivityLogout = () => {
      toast.error("Your session has expired due to inactivity. Please login again.", {
        ...warningMsgStyle,
        duration: 5000,
      });
    };

    // Listen for warning hide
    const handleWarningHide = () => {
      toast.dismiss("inactivity-warning");
    };

    window.addEventListener("inactivityWarning", handleInactivityWarning);
    window.addEventListener("inactivityLogout", handleInactivityLogout);
    window.addEventListener("inactivityWarningHide", handleWarningHide);

    // Cleanup
    return () => {
      window.removeEventListener("inactivityWarning", handleInactivityWarning);
      window.removeEventListener("inactivityLogout", handleInactivityLogout);
      window.removeEventListener("inactivityWarningHide", handleWarningHide);
    };
  }, [dispatch]);

  const setIp = async () => {
    try {
      const ip = await publicIpv4();
      localStorage.setItem("ipv4", ip);
    } catch (error) {
    }
  };

  return (
    <ErrorBoundary>
      <ThemeContext.Provider value={{ themeMode, setThemeMode }}>
        <StrategyStateProvider>
          <TradingBoxProvider>
            <ChartPopupProvider>
              <div className="App hold-transition theme-primary bg-img">
                <OfflineNotification />
                <Toaster position="top-right" reverseOrder={true} />
                <SeoHelmet />
                  <PerformanceMonitor />
                <Routes />
              </div>
            </ChartPopupProvider>
          </TradingBoxProvider>
        </StrategyStateProvider>
      </ThemeContext.Provider>
    </ErrorBoundary>
  );
}

export default App;

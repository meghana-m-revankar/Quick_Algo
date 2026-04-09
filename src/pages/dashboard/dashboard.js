import { useState, useEffect } from "react";
import dayjs from "dayjs";
import Storage from "../../services/storage";
import { asyncGetDashboardData } from "#redux/dashboard/action.js";
import { asyncGetMCXSymbols } from "#redux/symbol/symbolAction.js";
import { useSelector } from "react-redux";
import useSymbolDetails from "#hooks/useSymbol";
import { useGlobalServices } from "#services/global";

// Custom hook for dashboard business logic
const useDashboard = () => {
  const userDetail = useSelector((state) => state.userDetails?.userDetail);
  const { activeSubscription, activeSubscriptionFeatures } = useGlobalServices();
  
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [activeBrokerTab, setActiveBrokerTab] = useState("registered");
  const [dashboardData, setDashboardData] = useState({
    news: [],
    videos: [],
  });
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [mcxSymbols, setMcxSymbols] = useState([]);
  const [isMcxLoading, setIsMcxLoading] = useState(false);
  const mcxSymbolValue = useSymbolDetails(mcxSymbols, "mcx");
  const [marketProgress, setMarketProgress] = useState(0);
  const [activeMarket, setActiveMarket] = useState("fno");
  const [marketStatus, setMarketStatus] = useState({
    fno: { status: "closed", openTime: "09:15", closeTime: "15:30" },
    mcx: { status: "closed", openTime: "09:00", closeTime: "23:30" },
  });
  const [activeMarketTab, setActiveMarketTab] = useState("nse");
  const [isLoading, setIsLoading] = useState(true);
  const [showNewsPopup, setShowNewsPopup] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);

  const isWithinMarketHours = (openTime, closeTime) => {
    const now = dayjs();
    const today = now.format("YYYY-MM-DD");
    const marketOpen = dayjs(`${today} ${openTime}`);
    const marketClose = dayjs(`${today} ${closeTime}`);

    return now.isAfter(marketOpen) && now.isBefore(marketClose);
  };


  const getLoginTime = () => {
    try {
      const encryptedLoginTime = localStorage.getItem("loginTime");
      if (encryptedLoginTime) {
        const decryptedTime = Storage.decryptData(encryptedLoginTime);
        if (decryptedTime) {
          return dayjs(decryptedTime);
        }
      }

      const storedLoginTime = localStorage.getItem("userLoginTime");
      if (storedLoginTime) {
        return dayjs(storedLoginTime);
      } else {
        const now = dayjs();
        localStorage.setItem("userLoginTime", now.toISOString());
        return now;
      }
    } catch (error) {
      const now = dayjs();
      localStorage.setItem("userLoginTime", now.toISOString());
      return now;
    }
  };

  const updateLoginTime = () => {
    const now = dayjs();
    localStorage.setItem("userLoginTime", now.toISOString());
    localStorage.setItem("loginTime", Storage.encryptData(now.toISOString()));
    return now;
  };

  const loginTime = getLoginTime();

  const handleRightMarketTab = (tabName) => {
    setActiveMarketTab(tabName);
  };

  const openNewsPopup = (news) => {
    // Use the actual news object if provided
    const newsData = {
      id: news?.id || null,
      type: news?.type || "general",
      headline: news?.headline || news?.heading || "News headline",
      source: news?.source || "FLIPITMONEY",
      time: news?.time || news?.created_at || "Just now",
      url: news?.id ? `/news/article/${news.id}` : `/news`,
      ...news, // Include all other news properties
    };
    setSelectedNews(newsData);
    setShowNewsPopup(true);
  };

  const closeNewsPopup = () => {
    setShowNewsPopup(false);
    setSelectedNews(null);
  };

  const fetchDashboardData = async () => {
    try {
      setIsDashboardLoading(true);
      const response = await asyncGetDashboardData();

      if (response?.data?.status) {
        setDashboardData({
          news: response.data.data.news || [],
          videos: response.data.data.videos || [],
        });
      }
    } catch (error) {
      // Set fallback data if API fails
      setDashboardData({
        news: [],
        videos: [],
      });
    } finally {
      setIsDashboardLoading(false);
    }
  };

  const fetchMCXSymbols = async () => {
    try {
      setIsMcxLoading(true);
      const response = await asyncGetMCXSymbols();

      if (response?.data?.status) {
        const symbols = response.data.result?.slice(0, 4) || [];
        setMcxSymbols(symbols);
      } else {
        const defaultMCXSymbols = [
           {
             identifier: "NATURALGAS25SEPFUT",
             identifierid: 741241,
             symbolCategoryID: 3,
             symbolCategoryName: "MCX",
             status: true,
             lastTradePrice: "0.00",
             priceChange: "0.00",
             high: "0.00",
             low: "0.00",
             openPrice: "0.00",
             closePrice: "0.00"
           },
           {
             identifier: "CRUDEOIL25SEPFUT",
             identifierid: 786465,
             symbolCategoryID: 3,
             symbolCategoryName: "MCX",
             status: true,
             lastTradePrice: "0.00",
             priceChange: "0.00",
             high: "0.00",
             low: "0.00",
             openPrice: "0.00",
             closePrice: "0.00"
           },
           {
             identifier: "GOLD25SEPFUT",
             identifierid: 741242,
             symbolCategoryID: 3,
             symbolCategoryName: "MCX",
             status: true,
             lastTradePrice: "0.00",
             priceChange: "0.00",
             high: "0.00",
             low: "0.00",
             openPrice: "0.00",
             closePrice: "0.00"
           },
           {
             identifier: "SILVER25SEPFUT",
             identifierid: 741243,
             symbolCategoryID: 3,
             symbolCategoryName: "MCX",
             status: true,
             lastTradePrice: "0.00",
             priceChange: "0.00",
             high: "0.00",
             low: "0.00",
             openPrice: "0.00",
             closePrice: "0.00"
           }
         ];
        setMcxSymbols(defaultMCXSymbols);
      }
    } catch (error) {
      const defaultMCXSymbols = [
        {
          identifier: "NATURALGAS25SEPFUT",
          symbolIdentifierId: "MCX_NG_25SEP",
          lastTradePrice: "0.00",
          priceChange: "0.00",
          high: "0.00",
          low: "0.00",
          openPrice: "0.00",
          closePrice: "0.00"
        },
        {
          identifier: "CRUDEOIL25SEPFUT",
          symbolIdentifierId: "MCX_CO_25SEP",
          lastTradePrice: "0.00",
          priceChange: "0.00",
          high: "0.00",
          low: "0.00",
          openPrice: "0.00",
          closePrice: "0.00"
        },
        {
          identifier: "GOLD25SEPFUT",
          symbolIdentifierId: "MCX_GOLD_25SEP",
          lastTradePrice: "0.00",
          priceChange: "0.00",
          high: "0.00",
          low: "0.00",
          openPrice: "0.00",
          closePrice: "0.00"
        },
        {
          identifier: "SILVER25SEPFUT",
          symbolIdentifierId: "MCX_SILVER_25SEP",
          lastTradePrice: "0.00",
          priceChange: "0.00",
          high: "0.00",
          low: "0.00",
          openPrice: "0.00",
          closePrice: "0.00"
        }
      ];
      setMcxSymbols(defaultMCXSymbols);
    } finally {
      setIsMcxLoading(false);
    }
  };




  // Show page immediately - don't wait for API calls
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Fetch data in parallel - non-blocking
  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchMCXSymbols();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = dayjs();
      setCurrentTime(now);

      const isWeekday = now.day() >= 1 && now.day() <= 5;

      if (isWeekday) {
        const fnoOpen = dayjs().hour(9).minute(15).second(0);
        const fnoClose = dayjs().hour(15).minute(30).second(0);
        const mcxOpen = dayjs().hour(9).minute(0).second(0);
        const mcxClose = dayjs().hour(23).minute(30).second(0);
        
        if (isWithinMarketHours("09:15", "15:30")) {
          setMarketStatus((prev) => ({
            ...prev,
            fno: { ...prev.fno, status: "open" },
          }));
        } else {
          setMarketStatus((prev) => ({
            ...prev,
            fno: { ...prev.fno, status: "closed" },
          }));
        }

        if (isWithinMarketHours("09:00", "23:30")) {
          setMarketStatus((prev) => ({
            ...prev,
            mcx: { ...prev.mcx, status: "open" },
          }));
        } else {
          setMarketStatus((prev) => ({
            ...prev,
            mcx: { ...prev.mcx, status: "closed" },
          }));
        }
        
        const updatedMarketStatus = {
          fno: isWithinMarketHours("09:15", "15:30") ? "open" : "closed",
          mcx: isWithinMarketHours("09:00", "23:30") ? "open" : "closed",
        };

        if (updatedMarketStatus[activeMarket] === "closed") {
          if (updatedMarketStatus.mcx === "open") {
            setActiveMarket("mcx");
          } else if (updatedMarketStatus.fno === "open") {
            setActiveMarket("fno");
          }
        }
        
        let marketOpen, marketClose;
        if (activeMarket === "fno") {
          marketOpen = fnoOpen;
          marketClose = fnoClose;
        } else if (activeMarket === "bse") {
          marketOpen = fnoOpen;
          marketClose = fnoClose;
        } else {
          marketOpen = mcxOpen;
          marketClose = mcxClose;
        }

        if (now.isAfter(marketOpen) && now.isBefore(marketClose)) {
          const totalDuration = marketClose.diff(marketOpen);
          const elapsed = now.diff(marketOpen);
          const progress = (elapsed / totalDuration) * 100;

          setMarketProgress(Math.min(progress, 100));
        } else if (now.isBefore(marketOpen)) {
          setMarketProgress(0);
        } else {
          setMarketProgress(100);
        }
      } else {
        setMarketStatus((prev) => ({
          fno: { ...prev.fno, status: "closed" },
          bse: { ...prev.bse, status: "closed" },
          mcx: { ...prev.mcx, status: "closed" },
        }));
        setMarketProgress(0);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeMarket]);

  return {
    userDetail,
    activeSubscription,
    activeSubscriptionFeatures,
    currentTime,
    activeBrokerTab,
    dashboardData,
    isDashboardLoading,
    marketProgress,
    activeMarket,
    marketStatus,
    activeMarketTab,
    isLoading,
    showNewsPopup,
    selectedNews,
    mcxSymbols,
    isMcxLoading,
    mcxSymbolValue,
    handleRightMarketTab,
    openNewsPopup,
    closeNewsPopup,
    fetchDashboardData,
    fetchMCXSymbols,
    loginTime,
    setActiveBrokerTab,
    setActiveMarket,
    setActiveMarketTab,
  };
};

export default useDashboard;

import { asyncGetHeaderSymbols } from "#redux/symbol/symbolAction.js";
import { handleCatchErrors } from "#utils/validation";
import React, { useContext, useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GlobalContext } from "../context";
import { asyncGetBrokerMaster } from "#redux/broker/action.js";
import { asyncGetStrategyList } from "#redux/strategy/action.js";
import { useSelector } from "react-redux";
import { checkLogin } from "#helpers";
import AuthService from "./authService";
import { useSignalR } from "./signalR";
import paymentService from "./paymentService";
import chartAxios from "./chartAxios";
import { getKycLatest } from "./kycService";

export const GlobalServices = ({ children }) => {
  const [headerSymbol, setHeaderSymbol] = useState([]);
  const [brokerMasterList, setBrokerMasterList] = useState([]);
  const [strategyList, setStrategyList] = useState([]);
  const [kycStatus, setKycStatus] = useState(null);
  const [kycData, setKycData] = useState(null);
  const [kycWorkflowUrl, setKycWorkflowUrl] = useState(null);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycValid, setKycValid] = useState(true);
  const [kycExpiringSoon, setKycExpiringSoon] = useState(false);
  const [kycDaysUntilExpiry, setKycDaysUntilExpiry] = useState(null);
  const [kycExpired, setKycExpired] = useState(false);
  const [kycAlertDismissed, setKycAlertDismissed] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [activeSubscriptionFeatures, setActiveSubscriptionFeatures] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const signalRContext = useSignalR();
  const addedSymbolsRef = useRef(new Set()); // Track already added symbols to avoid duplicates

  // Get authentication state from Redux
  const { isUserLoggedIn } = useSelector((state) => state.userDetails);
  const { userDetail } = useSelector((state) => state.userDetails);
  const { companyDetails } = useSelector((state) => state.companyDetails);

  // Helper function to check if user is authenticated
  const isAuthenticated = () => {
    return isUserLoggedIn && checkLogin();
  };

  useEffect(() => {
    // Only run automatic API calls if user is authenticated
    if (!isAuthenticated()) {
      return;
    }

    // Initialize Node.js auth service
    AuthService.init();

    asyncGetHeaderSymbols()
      .then((result) => {
        setIsLoading(false);
        setHeaderSymbol(result?.data?.result);
      })
      .catch((err) => {
        handleCatchErrors(err, navigate);
      });

    asyncGetBrokerMaster()
      .then((result) => {
        setIsLoading(false);
        setBrokerMasterList(result?.data?.result);
      })
      .catch((err) => {
        handleCatchErrors(err, navigate);
      });

    asyncGetStrategyList()
      .then((result) => {
        setIsLoading(false);
        
        if (result?.data?.success === true || result?.data?.success === 'true' || result?.status === 200) {
          const strategies = result.data.result || result.data.data || result.data || [];
          
          const mappedStrategies = strategies.map((strategy, index) => ({
            id: strategy.id || strategy.stratergyID || strategy.strategyID || index + 1,
            stratergyID: strategy.stratergyID || strategy.id || strategy.strategyID || index + 1,
            stratergyName: strategy.stratergyName || strategy.name || strategy.strategyName || `Strategy ${index + 1}`,
            name: strategy.name || strategy.stratergyName || strategy.strategyName || `Strategy ${index + 1}`,
            type: strategy.type || strategy.category || 'Strategy',
            description: strategy.description || strategy.desc || '',
            ...strategy
          }));
          
          setStrategyList(mappedStrategies);
        } else {
          setStrategyList([]);
        }
      })
      .catch((err) => {
        handleCatchErrors(err, navigate);
        setStrategyList([]);
      });

    // asyncGetCustomerSubscription()
    //   .then((result) => {
    //     setIsLoading(false);
    //     const resultData = result?.data?.result;
    //     setSubscriptionDetails(resultData != null && typeof resultData === "object" ? resultData : null);
    //   })
    //   .catch((err) => {
    //     handleCatchErrors(err, navigate);
    //     setSubscriptionDetails(null);
    //   });

    // Fetch latest KYC status for logged-in user (used globally, e.g. for subscription purchase guard)
    const clientCompanyId = companyDetails?.companyID ?? "";
    const username = userDetail?.userName ?? "";

    if (clientCompanyId && username) {
      setKycLoading(true);
      getKycLatest(clientCompanyId, username)
        .then((res) => {
          if (res?.success && res?.status) {
            const status = String(res.status || "").toLowerCase();
            setKycStatus(status);
            setKycData(res.data || null);
            setKycWorkflowUrl(res.workflowUrl || null);
            setKycValid(res.isKycValid !== false);
            setKycExpiringSoon(!!res.expiringWithinDays);
            setKycDaysUntilExpiry(res.daysUntilExpiry ?? null);
            setKycExpired(!!res.isExpired);
          } else {
            setKycStatus(null);
            setKycData(null);
            setKycWorkflowUrl(null);
            setKycValid(true);
            setKycExpiringSoon(false);
            setKycDaysUntilExpiry(null);
            setKycExpired(false);
          }
        })
        .catch(() => {
          setKycStatus(null);
          setKycData(null);
          setKycWorkflowUrl(null);
          setKycValid(true);
          setKycExpiringSoon(false);
          setKycDaysUntilExpiry(null);
          setKycExpired(false);
        })
        .finally(() => {
          setKycLoading(false);
        });
    } else {
      setKycStatus(null);
      setKycData(null);
      setKycWorkflowUrl(null);
      setKycValid(true);
      setKycExpiringSoon(false);
      setKycDaysUntilExpiry(null);
      setKycExpired(false);
      setKycLoading(false);
    }

    // Fetch active subscription with features
    const fetchActiveSubscription = async () => {
      try {
        let activeSubResponse;
        if (typeof paymentService.getActiveSubscription === 'function') {
          activeSubResponse = await paymentService.getActiveSubscription();
        } else {
          // Fallback: Direct API call
          const response = await chartAxios.get("/api/payment/active-subscription");
          activeSubResponse = response.data;
        }

        if (activeSubResponse && activeSubResponse.success && activeSubResponse.data) {
          setActiveSubscription(activeSubResponse.data);
          // Extract and set subscription features for global use
          if (activeSubResponse.data.subscriptionFeatures) {
            setActiveSubscriptionFeatures(activeSubResponse.data.subscriptionFeatures);
          }
        } else {
          setActiveSubscription(null);
          setActiveSubscriptionFeatures(null);
        }
      } catch (error) {
        console.error("Error fetching active subscription in global:", error);
        setActiveSubscription(null);
        setActiveSubscriptionFeatures(null);
      }
    };

    fetchActiveSubscription();

    // Cleanup function
    return () => {
      AuthService.destroy();
    };
  }, [isUserLoggedIn, companyDetails?.companyID, userDetail?.userName]);

  // Monitor socket data for INDIA VIX or codes 868910/868911
  useEffect(() => {
    if (!signalRContext || !signalRContext.emitter || !signalRContext.isConnectionActive) {
      return;
    }

    const { emitter, ordersignalr } = signalRContext;
    
    // Target identifiers to look for
    const targetIdentifiers = ['868910', '868911', 'INDIA VIX', 'INDIAN VIX'];
    
    // Also listen to ALL socket messages to catch these codes if they come on different channels
    const allMessagesListener = (channelName, message) => {
      try {
        const data = typeof message === 'string' ? JSON.parse(message) : message;
        
        // Check if message contains our target identifiers
        const messageStr = JSON.stringify(data || message || '');
        const channelStr = String(channelName || '');
        
        const hasTargetCode = 
          messageStr.includes('868910') || 
          messageStr.includes('868911') ||
          messageStr.toUpperCase().includes('INDIA VIX') ||
          messageStr.toUpperCase().includes('INDIAN VIX') ||
          channelStr.includes('868910') ||
          channelStr.includes('868911') ||
          channelStr.toUpperCase().includes('INDIA VIX') ||
          channelStr.toUpperCase().includes('INDIAN VIX');
        
        if (hasTargetCode) {
        }
      } catch (error) {
        // Error parsing
      }
    };
    
    // Listen for socket messages on these identifiers
    const listeners = [];
    
    targetIdentifiers.forEach((identifier) => {
      // Subscribe to socket for this identifier
      if (ordersignalr) {
        ordersignalr(identifier);
      }
      
      // Listen for messages
      const listener = (message) => {
        try {
          const data = JSON.parse(message);
          
          // Check if this is data for INDIA VIX or the target codes
          // The identifier might be in the channel name or in the data itself
          const channelIdentifier = identifier;
          
          // Also check if data contains identifier information
          const dataIdentifier = data?.identifier || data?.g2 || data?.instrumentIdentifier || data?.instrumentCode || data?.s1 || data?.s2 || data?.s3;
          
          // Check if we should add this to headerSymbol
          // Match by channel identifier or data identifier
          const isTargetSymbol = 
            channelIdentifier === '868910' || channelIdentifier === '868911' || 
            channelIdentifier === 'INDIA VIX' || channelIdentifier === 'INDIAN VIX' ||
            dataIdentifier === '868910' || dataIdentifier === '868911' ||
            dataIdentifier === 'INDIA VIX' || dataIdentifier === 'INDIAN VIX' ||
            (typeof dataIdentifier === 'string' && (
              dataIdentifier.includes('868910') || 
              dataIdentifier.includes('868911') ||
              dataIdentifier.toUpperCase().includes('INDIA VIX') ||
              dataIdentifier.toUpperCase().includes('INDIAN VIX')
            ));
          
          if (isTargetSymbol) {
            // Determine the final identifier to use
            const finalIdentifier = 
              channelIdentifier === '868910' || channelIdentifier === '868911' || 
              dataIdentifier === '868910' || dataIdentifier === '868911'
                ? 'INDIA VIX'
                : (channelIdentifier === 'INDIA VIX' || channelIdentifier === 'INDIAN VIX' 
                    ? 'INDIA VIX' 
                    : (dataIdentifier || channelIdentifier));
            
            // Check if already added
            if (addedSymbolsRef.current.has(finalIdentifier) || 
                addedSymbolsRef.current.has(channelIdentifier) ||
                addedSymbolsRef.current.has(dataIdentifier)) {
              return;
            }
            
            // Add to headerSymbol
            setHeaderSymbol((prevSymbols) => {
              // Check if already exists in the array
              const exists = prevSymbols.some(sym => 
                sym?.identifier === finalIdentifier || 
                sym?.identifier === 'INDIA VIX' ||
                sym?.identifier === 'INDIAN VIX' ||
                sym?.instrumentCode === channelIdentifier ||
                sym?.instrumentCode === dataIdentifier ||
                sym?.instrumentCode === '868910' ||
                sym?.instrumentCode === '868911'
              );
              
              if (exists) {
                addedSymbolsRef.current.add(finalIdentifier);
                addedSymbolsRef.current.add(channelIdentifier);
                if (dataIdentifier) addedSymbolsRef.current.add(dataIdentifier);
                return prevSymbols;
              }
              
              // Add new symbol to headerSymbol
              const newSymbol = {
                identifier: finalIdentifier,
                instrumentCode: channelIdentifier === '868910' || channelIdentifier === '868911' 
                  ? channelIdentifier 
                  : (dataIdentifier || channelIdentifier),
                ...data
              };
              
              addedSymbolsRef.current.add(finalIdentifier);
              addedSymbolsRef.current.add(channelIdentifier);
              if (dataIdentifier) addedSymbolsRef.current.add(dataIdentifier);
              
              return [...prevSymbols, newSymbol];
            });
          }
        } catch (error) {
          // Error parsing socket data
        }
      };
      
      emitter.on(identifier, listener);
      listeners.push({ identifier, listener });
    });
    
    // Cleanup listeners
    return () => {
      listeners.forEach(({ identifier, listener }) => {
        if (emitter.off) {
          emitter.off(identifier, listener);
        }
      });
    };
  }, [signalRContext?.isConnectionActive, signalRContext?.emitter, signalRContext?.ordersignalr]);

  const showKycExpiryAlert =
    (kycExpiringSoon || kycExpired) &&
    !kycLoading &&
    !kycAlertDismissed &&
    location.pathname !== "/kyc";

  const showKycBlockOverlay =
    activeSubscription &&
    !kycValid &&
    !kycLoading &&
    location.pathname !== "/kyc" &&
    location.pathname !== "/plans";

  return (
    <GlobalContext.Provider
      value={{
        headerSymbol,
        isLoading,
        brokerMasterList,
        strategyList,
        kycStatus,
        kycData,
        kycWorkflowUrl,
        kycLoading,
        kycValid,
        kycExpiringSoon,
        kycDaysUntilExpiry,
        kycExpired,
        activeSubscription,
        activeSubscriptionFeatures,
      }}
    >
      {showKycExpiryAlert && (
        <div className="kyc-expiry-alert-fixed" role="alert">
          <button
            type="button"
            className="kyc-expiry-alert-close"
            onClick={() => setKycAlertDismissed(true)}
            aria-label="Close"
          >
            ×
          </button>
          <p className="kyc-expiry-alert-text">
            {kycExpired
              ? "Your KYC has expired. Please renew to continue using all features."
              : `Your KYC is expiring in ${kycDaysUntilExpiry ?? 0} day(s). Please renew to avoid interruption.`}
          </p>
          <button
            type="button"
            className="kyc-expiry-alert-btn"
            onClick={() => navigate("/kyc")}
          >
            Renew KYC
          </button>
        </div>
      )}
      {showKycBlockOverlay && (
        <div className="kyc-block-overlay" role="alert">
          <div className="kyc-block-overlay-card">
            <h2 className="kyc-block-overlay-title">KYC has expired</h2>
            <p className="kyc-block-overlay-message">
              Please complete your KYC renewal to continue using features.
            </p>
            <button
              type="button"
              className="kyc-block-overlay-btn"
              onClick={() => navigate("/kyc")}
            >
              Renew KYC
            </button>
          </div>
        </div>
      )}
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalServices = () => useContext(GlobalContext);

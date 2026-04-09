import React, {
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useState,
  useContext,
} from "react";
import "./createStrategy.scss";
import { IconRegistry } from "#components";
import AdvancedPayoffChart from "../../components/payoffChart/AdvancedPayoffChart";
import useSymbolDetails from "#hooks/useSymbol";
import {
  asyncGetOptionListCE,
  asyncGetOptionListPE,
} from "#redux/optionChain/optionChainAction.js";
import { fetchSymbolExpiryList, fetchSymbolLotSize } from "#utils/watchList";
import {
  asyncGetSymbolCategoryList,
  asyncGetWatchListByUserId,
  asyncGetCustBrokerConfig,
} from "#redux/symbol/symbolAction.js";
import { handleCatchErrors } from "#utils/validation";
import { useNavigate } from "react-router-dom";
import useCreateStrategy from "./createStrategy";
import {
  validateStrategy,
  validateSymbolSelection,
} from "#utils/strategyValidation";
import { errorMsg, successMsg } from "#utils/helpers";
import { GlobalContext } from "../../context";
import Storage from "#services/storage";
import { useGlobalServices } from "#services/global";
import { SubscriptionDialog } from "#components";

const CreateStrategy = () => {
  const navigate = useNavigate();
  const { activeSubscriptionFeatures } = useGlobalServices();

  const [subscriptionUpgradeOpen, setSubscriptionUpgradeOpen] = useState(false);
  const [subscriptionUpgradeMessage, setSubscriptionUpgradeMessage] =
    useState("");

  useEffect(() => {
    const checkCreateStrategyAccess = () => {
      if (!activeSubscriptionFeatures) {
        setSubscriptionUpgradeMessage(
          "Your current subscription does not include Create Strategy feature. Please upgrade your subscription to access this page.",
        );
        setSubscriptionUpgradeOpen(true);
        return false;
      }
      if (activeSubscriptionFeatures.createStrategy !== true) {
        setSubscriptionUpgradeMessage(
          "Your current subscription does not include Create Strategy feature. Please upgrade your subscription to access this page.",
        );
        setSubscriptionUpgradeOpen(true);
        return false;
      }
      return true;
    };
    if (!checkCreateStrategyAccess()) {
      setTimeout(() => {
        navigate("/plans");
      }, 2000);
    }
  }, [activeSubscriptionFeatures, navigate]);

  const {
    strategyState,
    setStrategyState,
    handleChange,
    marketBias,
    handleMarketBias,
  } = useCreateStrategy();

  const [validationErrors, setValidationErrors] = useState([]);
  const [backendErrors, setBackendErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const toastTimeoutRef = useRef(null);
  const scriptLineNumbersRef = useRef(null);
  const scriptTextRef = useRef(null);

  const maxLimitToastRef = useRef({ lastMessage: "", lastTime: 0 });
  const showMaxLimitToast = useCallback((message, duration = 4000) => {
    const now = Date.now();
    const { lastMessage, lastTime } = maxLimitToastRef.current || {};
    if (message === lastMessage && now - lastTime < 1500) return;
    maxLimitToastRef.current = { lastMessage: message, lastTime: now };
    errorMsg(message);
  }, []);

  const [indicatorModal, setIndicatorModal] = useState({
    isOpen: false,
    type: null,
    groupId: null,
    conditionId: null,
    field: null,
    currentValue: null,
  });

  const [comparatorModal, setComparatorModal] = useState({
    isOpen: false,
    type: null,
    groupId: null,
    conditionId: null,
    field: null,
    currentValue: null,
  });

  const [selectedIndicator, setSelectedIndicator] = useState("rsi");
  const [selectedPeriod, setSelectedPeriod] = useState(14);
  const [selectedMultiplier, setSelectedMultiplier] = useState(3);
  const [selectedOverbought, setSelectedOverbought] = useState("70");
  const [selectedComparator, setSelectedComparator] = useState("");
  const [selectedMacdFast, setSelectedMacdFast] = useState(12);
  const [selectedMacdSlow, setSelectedMacdSlow] = useState(26);
  const [selectedMacdSignal, setSelectedMacdSignal] = useState(9);

  // ← EMA_4 states
  const [selectedEma4Period1, setSelectedEma4Period1] = useState(20);
  const [selectedEma4Period2, setSelectedEma4Period2] = useState(50);
  const [selectedEma4Period3, setSelectedEma4Period3] = useState(100);
  const [selectedEma4Period4, setSelectedEma4Period4] = useState(200);
  const [selectedEma4Line, setSelectedEma4Line] = useState(1);
  // Pivot HL state
  const [selectedPivotLeftBars, setSelectedPivotLeftBars] = useState(5);
  const [selectedPivotRightBars, setSelectedPivotRightBars] = useState(5);
  const [selectedPivotType, setSelectedPivotType] = useState("high");

  const getDefaultPeriod = useCallback((indicator) => {
    if (indicator === "supertrend") return 7;
    if (indicator === "ema" || indicator === "sma") return 20;
    if (indicator === "adx") return 14;
    if (indicator === "ema_4") return 20; // ← EMA_4 default
    return 14;
  }, []);

  const getDefaultMultiplier = useCallback(() => 3, []);
  const getDefaultMacd = useCallback(
    () => ({ fast: 12, slow: 26, signal: 9 }),
    [],
  );

  const [scriptModal, setScriptModal] = useState({
    isOpen: false,
    script: "",
    conditionName: "",
  });
  const [instrumentSearchQuery, setInstrumentSearchQuery] = useState("");
  const [optionChainData, setOptionChainData] = useState({
    expiryList: [],
    strikePriceCEList: [],
    strikePricePEList: [],
  });

  const strategyType = strategyState.strategyType;
  const StrategyName = strategyState.StrategyName;
  const IdentifierName = strategyState.IdentifierName;
  const ProductName = strategyState.ProductName;
  const IdentifierID = strategyState.IdentifierID;
  const LotSize = strategyState.LotSize;
  const freezeQty = strategyState.freezeQty;
  const symbolProduct = strategyState.symbolProduct;
  const defaultExpiry = strategyState.defaultExpiry;
  const defaultStrike = strategyState.defaultStrike;
  const defaultLtp = strategyState.defaultLtp;
  const defaultIdentifier = strategyState.defaultIdentifier;

  const expiryList = optionChainData.expiryList;
  const strikePriceCEList = optionChainData.strikePriceCEList;
  const strikePricePEList = optionChainData.strikePricePEList;
  const isInstrumentModalOpen = strategyState.isInstrumentModalOpen;
  const instrumentCategory = strategyState.instrumentCategory;
  const isLoadingSymbols = strategyState.isLoadingSymbols;

  const [symbolCategories, setSymbolCategories] = useState([]);
  const [symbolsByCategory, setSymbolsByCategory] = useState({});
  const [brokerConfigList, setBrokerConfigList] = useState([]);

  useEffect(() => {
    if (
      isInstrumentModalOpen &&
      symbolCategories.length > 0 &&
      !instrumentCategory
    ) {
      const firstCategory = symbolCategories[0].categoryName;
      setStrategyState((prev) => ({
        ...prev,
        instrumentCategory: firstCategory,
      }));
    }
  }, [
    isInstrumentModalOpen,
    symbolCategories,
    instrumentCategory,
    setStrategyState,
  ]);

  useEffect(() => {
    asyncGetCustBrokerConfig({ sendData: "" })
      .then((result) => {
        const activeBroker = result?.data?.result?.filter(
          (broker) => broker.status === true,
        );
        if (activeBroker?.length > 0) setBrokerConfigList(activeBroker);
      })
      .catch((err) => {
        handleCatchErrors(err, navigate);
      });
  }, [navigate, setStrategyState]);

  const entryConditions = strategyState?.entryConditions;
  const exitConditions = strategyState?.exitConditions;
  const selectedStrategy = strategyState?.selectedStrategy;

  const hasFetchedCategories = useRef(false);
  const hasFetchedSymbols = useRef(false);

  const watchListSymbol = useSymbolDetails(
    IdentifierName ? [{ identifier: IdentifierName }] : [],
    "optionChain",
    0,
    1,
  );

  const allCEIdentifiers = useMemo(() => {
    const orderLegs = strategyState?.qaCustomCustomerOptionsAlgoChild;
    if (!orderLegs || orderLegs.length === 0) return [];
    return orderLegs
      .filter(
        (leg) =>
          leg.identifier &&
          (leg.optionType === "CE" || leg.instrument === "CE"),
      )
      .map((leg) => ({ identifier: leg.identifier }));
  }, [strategyState?.qaCustomCustomerOptionsAlgoChild]);

  const allPEIdentifiers = useMemo(() => {
    const orderLegs = strategyState?.qaCustomCustomerOptionsAlgoChild;
    if (!orderLegs || orderLegs.length === 0) return [];
    return orderLegs
      .filter(
        (leg) =>
          leg.identifier &&
          (leg.optionType === "PE" || leg.instrument === "PE"),
      )
      .map((leg) => ({ identifier: leg.identifier }));
  }, [strategyState?.qaCustomCustomerOptionsAlgoChild]);

  const combinedCEList = useMemo(() => {
    const strikeList = strategyState.strikePriceCEList || [];
    const legList = allCEIdentifiers || [];
    const strikeObjects = strikeList.map((item) =>
      typeof item === "string" ? { identifier: item } : item,
    );
    const identifierSet = new Set();
    const combined = [];
    [...strikeObjects, ...legList].forEach((item) => {
      const id = item?.identifier || item;
      if (id && !identifierSet.has(id)) {
        identifierSet.add(id);
        combined.push(
          typeof item === "object" && item.identifier
            ? item
            : { identifier: id },
        );
      }
    });
    return combined;
  }, [strategyState.strikePriceCEList, allCEIdentifiers]);

  const combinedPEList = useMemo(() => {
    const strikeList = strategyState.strikePricePEList || [];
    const legList = allPEIdentifiers || [];
    const strikeObjects = strikeList.map((item) =>
      typeof item === "string" ? { identifier: item } : item,
    );
    const identifierSet = new Set();
    const combined = [];
    [...strikeObjects, ...legList].forEach((item) => {
      const id = item?.identifier || item;
      if (id && !identifierSet.has(id)) {
        identifierSet.add(id);
        combined.push(
          typeof item === "object" && item.identifier
            ? item
            : { identifier: id },
        );
      }
    });
    return combined;
  }, [strategyState.strikePricePEList, allPEIdentifiers]);

  const symbolValuePE = useSymbolDetails(combinedPEList, "optionChain", 0, 1);
  const symbolValueCE = useSymbolDetails(combinedCEList, "optionChain", 0, 1);
  const symbolValueCEGreeks = useSymbolDetails(
    combinedCEList,
    "optionChain",
    0,
    0,
    1,
  );
  const symbolValuePEGreeks = useSymbolDetails(
    combinedPEList,
    "optionChain",
    0,
    0,
    1,
  );

  const calculateStrategyGreeks = useCallback(() => {
    const orderLegs = strategyState?.qaCustomCustomerOptionsAlgoChild;
    if (!orderLegs || orderLegs.length === 0) {
      return {
        delta: 0,
        gamma: 0,
        theta: 0,
        vega: 0,
        rho: 0,
        totalIV: 0,
        weightedIV: 0,
        volatility: 0,
        timeToExpiry: 0,
        isLoading: false,
      };
    }
    let totalDelta = 0,
      totalGamma = 0,
      totalTheta = 0,
      totalVega = 0,
      totalRho = 0,
      totalIV = 0,
      totalWeight = 0;
    strategyState?.qaCustomCustomerOptionsAlgoChild.forEach((leg) => {
      if (!leg.identifier) return;
      const instrument = leg.optionType || leg.instrument;
      const quantity = parseFloat(leg.qty) || 1;
      const position = leg.action || "BUY";
      const multiplier = (position === "BUY" ? 1 : -1) * quantity;
      let greeks = null,
        price = null;
      if (instrument === "CE") {
        greeks = symbolValueCEGreeks[leg.identifier];
        price = symbolValueCE[leg.identifier];
      } else if (instrument === "PE") {
        greeks = symbolValuePEGreeks[leg.identifier];
        price = symbolValuePE[leg.identifier];
      }
      if (greeks && price) {
        const delta = parseFloat(greeks.delta) || 0,
          gamma = parseFloat(greeks.gamma) || 0,
          theta = parseFloat(greeks.theta) || 0,
          vega = parseFloat(greeks.vega) || 0,
          rho = parseFloat(greeks.rho) || 0,
          iv = parseFloat(greeks.iv) || 0,
          ltp = parseFloat(price.lastTradePrice) || parseFloat(price.ltp) || 0;
        totalDelta += delta * multiplier;
        totalGamma += gamma * multiplier;
        totalTheta += theta * multiplier;
        totalVega += vega * multiplier;
        totalRho += rho * multiplier;
        if (iv > 0 && ltp > 0) {
          totalIV += iv * ltp * quantity;
          totalWeight += ltp * quantity;
        }
      }
    });
    const weightedIV = totalWeight > 0 ? totalIV / totalWeight : 0;
    return {
      delta: parseFloat(totalDelta.toFixed(4)),
      gamma: parseFloat(totalGamma.toFixed(4)),
      theta: parseFloat(totalTheta.toFixed(4)),
      vega: parseFloat(totalVega.toFixed(4)),
      rho: parseFloat(totalRho.toFixed(4)),
      totalIV: parseFloat(totalIV.toFixed(4)),
      weightedIV: parseFloat(weightedIV.toFixed(4)),
      volatility: weightedIV / 100,
      timeToExpiry: 2,
      isLoading: false,
    };
  }, [
    strategyState?.qaCustomCustomerOptionsAlgoChild,
    symbolValueCEGreeks,
    symbolValuePEGreeks,
    symbolValueCE,
    symbolValuePE,
  ]);

  const greeksData = useMemo(
    () => calculateStrategyGreeks(),
    [calculateStrategyGreeks],
  );

  const strategyMetrics = useMemo(() => {
    if (
      !strategyState?.qaCustomCustomerOptionsAlgoChild ||
      strategyState?.qaCustomCustomerOptionsAlgoChild.length === 0
    ) {
      return {
        mtm: 0,
        mtmPercentage: 0,
        maxProfit: 0,
        maxLoss: 0,
        riskReward: "NA",
        breakeven: 0,
        breakevenPercentage: 0,
        pop: 0,
      };
    }
    let totalMTM = 0,
      totalInvestment = 0;
    strategyState?.qaCustomCustomerOptionsAlgoChild.forEach((leg) => {
      let currentPrice = parseFloat(leg.ltp) || 0;
      if (leg.identifier) {
        const isCE = leg.optionType === "CE" || leg.instrument === "CE";
        const liveData = isCE
          ? symbolValueCE[leg.identifier]
          : symbolValuePE[leg.identifier];
        if (
          liveData?.lastTradePrice !== undefined &&
          liveData?.lastTradePrice !== null
        ) {
          const livePrice =
            typeof liveData.lastTradePrice === "number"
              ? liveData.lastTradePrice
              : parseFloat(liveData.lastTradePrice) || 0;
          if (livePrice > 0) currentPrice = livePrice;
        }
      }
      const entryPrice = parseFloat(leg.entryPrice) || parseFloat(leg.ltp) || 0;
      const quantity = parseInt(leg.qty) || 1;
      totalMTM +=
        leg.action === "BUY"
          ? (currentPrice - entryPrice) * quantity
          : (entryPrice - currentPrice) * quantity;
      totalInvestment += Math.abs(entryPrice * quantity);
    });
    const mtmPercentage =
      totalInvestment > 0 ? (totalMTM / totalInvestment) * 100 : 0;
    let maxProfit = 0,
      maxLoss = 0;
    if (strategyState?.qaCustomCustomerOptionsAlgoChild.length === 1) {
      const leg = strategyState?.qaCustomCustomerOptionsAlgoChild[0];
      const entryPrice = parseFloat(leg.entryPrice) || parseFloat(leg.ltp) || 0;
      const quantity = parseInt(leg.qty) || 1;
      if (leg.action === "BUY") {
        maxLoss = entryPrice * quantity;
        maxProfit = 999999;
      } else {
        maxProfit = entryPrice * quantity;
        maxLoss = 999999;
      }
    } else if (strategyState?.qaCustomCustomerOptionsAlgoChild.length === 2) {
      const leg1 = strategyState?.qaCustomCustomerOptionsAlgoChild[0];
      const leg2 = strategyState?.qaCustomCustomerOptionsAlgoChild[1];
      const entryPrice1 =
        parseFloat(leg1.entryPrice) || parseFloat(leg1.ltp) || 0;
      const entryPrice2 =
        parseFloat(leg2.entryPrice) || parseFloat(leg2.ltp) || 0;
      const qty1 = parseInt(leg1.qty) || 1,
        qty2 = parseInt(leg2.qty) || 1;
      const strike1 = parseFloat(leg1.strikePrice) || 0,
        strike2 = parseFloat(leg2.strikePrice) || 0;
      const instrument1 = leg1.instrument || leg1.optionType || "",
        instrument2 = leg2.instrument || leg2.optionType || "";
      const netPremium =
        (leg1.action === "BUY" ? entryPrice1 : -entryPrice1) * qty1 +
        (leg2.action === "BUY" ? entryPrice2 : -entryPrice2) * qty2;
      if (instrument1 === instrument2 && instrument1 !== "") {
        const spreadWidth = Math.abs(strike1 - strike2);
        const isBullCallSpread =
          instrument1 === "CE" &&
          leg1.action === "BUY" &&
          leg2.action === "SELL" &&
          strike1 < strike2;
        if (isBullCallSpread && qty1 === qty2 && qty1 > 0) {
          maxLoss = Math.abs(netPremium);
          maxProfit = Math.max(
            0,
            (strike2 - strike1 - (entryPrice1 - entryPrice2)) * qty1,
          );
        } else if (netPremium < 0) {
          maxProfit = Math.abs(netPremium);
          maxLoss = Math.max(0, spreadWidth - Math.abs(netPremium));
        } else {
          maxLoss = netPremium;
          maxProfit = Math.max(0, spreadWidth - netPremium);
        }
      } else if (
        instrument1 !== instrument2 &&
        instrument1 !== "" &&
        instrument2 !== ""
      ) {
        if (netPremium < 0) {
          maxProfit = Math.abs(netPremium);
          maxLoss = 999999;
        } else {
          maxLoss = netPremium;
          maxProfit = 999999;
        }
      } else {
        maxProfit = totalMTM > 0 ? totalMTM : 0;
        maxLoss = totalMTM < 0 ? Math.abs(totalMTM) : 0;
      }
    } else {
      const totalPremium =
        strategyState?.qaCustomCustomerOptionsAlgoChild.reduce((sum, leg) => {
          const premium =
            parseFloat(leg.entryPrice) || parseFloat(leg.ltp) || 0;
          const qty = parseInt(leg.qty) || 1;
          return sum + (leg.action === "BUY" ? premium : -premium) * qty;
        }, 0);
      if (totalPremium < 0) {
        maxProfit = Math.abs(totalPremium);
        maxLoss = 999999;
      } else {
        maxLoss = totalPremium;
        maxProfit = 999999;
      }
    }
    maxProfit = parseFloat(maxProfit) || 0;
    maxLoss = parseFloat(maxLoss) || 0;
    if (isNaN(maxProfit) || !isFinite(maxProfit)) maxProfit = 0;
    if (isNaN(maxLoss) || !isFinite(maxLoss)) maxLoss = 0;
    const riskReward =
      maxLoss > 0
        ? (maxProfit / maxLoss).toFixed(2)
        : maxProfit > 0
          ? "NA"
          : "0.00";
    const spotPrice =
      parseFloat(watchListSymbol[IdentifierName]?.lastTradePrice || 0) || 0;
    let breakeven = spotPrice,
      breakevenPercentage = 0;
    if (strategyState?.qaCustomCustomerOptionsAlgoChild.length === 1) {
      const leg = strategyState?.qaCustomCustomerOptionsAlgoChild[0];
      const premium = parseFloat(leg.entryPrice) || 0;
      const strike = parseFloat(leg.strikePrice) || spotPrice;
      const instrument = leg.instrument || leg.optionType || "";
      if (instrument === "CE") breakeven = strike + premium;
      else if (instrument === "PE") breakeven = strike - premium;
      else breakeven = spotPrice;
    } else if (strategyState?.qaCustomCustomerOptionsAlgoChild.length === 2) {
      const leg1 = strategyState?.qaCustomCustomerOptionsAlgoChild[0];
      const leg2 = strategyState?.qaCustomCustomerOptionsAlgoChild[1];
      const premium1 = parseFloat(leg1.entryPrice) || 0,
        premium2 = parseFloat(leg2.entryPrice) || 0;
      const qty1 = parseInt(leg1.qty) || 1,
        qty2 = parseInt(leg2.qty) || 1;
      const strike1 = parseFloat(leg1.strikePrice) || spotPrice,
        strike2 = parseFloat(leg2.strikePrice) || spotPrice;
      const netPremium =
        (leg1.action === "BUY" ? premium1 : -premium1) * qty1 +
        (leg2.action === "BUY" ? premium2 : -premium2) * qty2;
      const instrument1 = leg1.instrument || leg1.optionType || "",
        instrument2 = leg2.instrument || leg2.optionType || "";
      if (instrument1 === instrument2 && instrument1 !== "") {
        const isBullCallSpread =
          instrument1 === "CE" &&
          leg1.action === "BUY" &&
          leg2.action === "SELL" &&
          strike1 < strike2;
        const isBearCallSpread =
          instrument1 === "CE" &&
          leg1.action === "SELL" &&
          leg2.action === "BUY" &&
          strike1 < strike2;
        const isBullPutSpread =
          instrument1 === "PE" &&
          leg1.action === "SELL" &&
          leg2.action === "BUY" &&
          strike1 > strike2;
        const isBearPutSpread =
          instrument1 === "PE" &&
          leg1.action === "BUY" &&
          leg2.action === "SELL" &&
          strike1 > strike2;
        if (isBullCallSpread && qty1 === qty2 && qty1 > 0)
          breakeven = strike1 + (premium1 - premium2);
        else if (isBearCallSpread && qty1 === qty2 && qty1 > 0)
          breakeven = strike1 + (premium1 - premium2);
        else if (isBullPutSpread && qty1 === qty2 && qty1 > 0)
          breakeven = strike1 - (premium1 - premium2);
        else if (isBearPutSpread && qty1 === qty2 && qty1 > 0)
          breakeven = strike1 - (premium1 - premium2);
        else if (instrument1 === "CE") {
          const npc = netPremium / qty1;
          breakeven = leg1.action === "BUY" ? strike1 + npc : strike1 - npc;
        } else if (instrument1 === "PE") {
          const npc = netPremium / qty1;
          breakeven = leg1.action === "BUY" ? strike1 - npc : strike1 + npc;
        }
      } else if (
        instrument1 !== instrument2 &&
        instrument1 !== "" &&
        instrument2 !== ""
      ) {
        const npc = netPremium / Math.max(qty1, qty2);
        breakeven =
          leg1.action === "BUY" && leg2.action === "BUY"
            ? strike1 + Math.abs(npc)
            : strike1 + Math.abs(npc);
      } else breakeven = spotPrice;
    } else if (strategyState?.qaCustomCustomerOptionsAlgoChild.length > 2) {
      const totalPremium =
        strategyState?.qaCustomCustomerOptionsAlgoChild.reduce((sum, leg) => {
          const premium = parseFloat(leg.entryPrice) || 0,
            qty = parseInt(leg.qty) || 1;
          return sum + (leg.action === "BUY" ? premium : -premium) * qty;
        }, 0);
      const firstStrike =
        parseFloat(
          strategyState?.qaCustomCustomerOptionsAlgoChild[0]?.strikePrice,
        ) || spotPrice;
      breakeven = firstStrike + totalPremium;
    }
    breakeven = parseFloat(breakeven) || 0;
    if (isNaN(breakeven) || !isFinite(breakeven)) breakeven = spotPrice;
    if (spotPrice > 0)
      breakevenPercentage = ((breakeven - spotPrice) / spotPrice) * 100;
    breakevenPercentage = parseFloat(breakevenPercentage) || 0;
    if (isNaN(breakevenPercentage) || !isFinite(breakevenPercentage))
      breakevenPercentage = 0;
    return {
      mtm: parseFloat(totalMTM.toFixed(2)),
      mtmPercentage: parseFloat(mtmPercentage.toFixed(2)),
      maxProfit: parseFloat(maxProfit.toFixed(0)),
      maxLoss: parseFloat(maxLoss.toFixed(0)),
      riskReward,
      breakeven: parseFloat(breakeven.toFixed(2)),
      breakevenPercentage: parseFloat(breakevenPercentage.toFixed(2)),
      pop: 50,
    };
  }, [
    strategyState?.qaCustomCustomerOptionsAlgoChild,
    watchListSymbol,
    IdentifierName,
    symbolValueCE,
    symbolValuePE,
  ]);

  const chartLegs = useMemo(() => {
    if (
      !strategyState?.qaCustomCustomerOptionsAlgoChild ||
      strategyState?.qaCustomCustomerOptionsAlgoChild.length === 0
    )
      return [];
    return strategyState?.qaCustomCustomerOptionsAlgoChild.map((leg) => ({
      action: leg.action,
      instrument: leg.optionType,
      strikePrice: leg.strikePrice,
      quantity: parseInt(leg.qty) || 1,
      lastTradedPrice: parseFloat(leg.entryPrice) || parseFloat(leg.ltp) || 0,
      identifier: leg.identifier,
      ExpiryDate: leg.expiry,
    }));
  }, [strategyState?.qaCustomCustomerOptionsAlgoChild]);

  const lastSpotPriceRef = useRef(0);
  const chartSpotPrice = useMemo(() => {
    const currentPrice = watchListSymbol[IdentifierName]?.lastTradePrice || 0;
    const price = parseFloat(currentPrice) || 0;
    if (price > 0) {
      lastSpotPriceRef.current = price;
      return price;
    }
    return lastSpotPriceRef.current > 0 ? lastSpotPriceRef.current : price;
  }, [IdentifierName, watchListSymbol[IdentifierName]?.lastTradePrice]);

  const handleAddInstruments = () => {
    openInstrumentModal();
  };

  const handleDays = (day) => {
    setStrategyState((prev) => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter((d) => d !== day)
        : [...prev.selectedDays, day],
    }));
  };

  const getMaxLot = useCallback(() => {
    if (!activeSubscriptionFeatures) return null;
    const maxLot =
      activeSubscriptionFeatures?.maxLots ||
      activeSubscriptionFeatures?.maxLot ||
      null;
    if (typeof maxLot === "object" && maxLot !== null) {
      const symbolKey =
        ProductName?.toUpperCase() || IdentifierName?.toUpperCase() || "";
      return (
        maxLot[symbolKey] ||
        maxLot[ProductName] ||
        maxLot[IdentifierName] ||
        maxLot.default ||
        null
      );
    }
    if (typeof maxLot === "number") return maxLot;
    if (typeof maxLot === "string") {
      const parsed = parseInt(maxLot);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }, [activeSubscriptionFeatures, IdentifierName, ProductName]);

  const getMaxQuantity = useCallback(() => {
    const lotSizeValue = parseInt(LotSize) || 1;
    const maxLot = getMaxLot();
    let maxQuantityFromSubscription = null;
    if (maxLot !== null && !Number.isNaN(maxLot))
      maxQuantityFromSubscription = maxLot * lotSizeValue;
    let freezeQuantityLimit = null;
    if (freezeQty !== undefined && freezeQty !== null) {
      const parsedFreeze = parseInt(freezeQty);
      if (!Number.isNaN(parsedFreeze) && parsedFreeze > 0)
        freezeQuantityLimit = parsedFreeze;
    }
    let effectiveMax = maxQuantityFromSubscription;
    if (freezeQuantityLimit !== null)
      effectiveMax =
        effectiveMax === null
          ? freezeQuantityLimit
          : Math.min(effectiveMax, freezeQuantityLimit);
    return effectiveMax;
  }, [getMaxLot, LotSize, freezeQty]);

  const validateAndConvertQty = (
    inputValue,
    lotSizeValue,
    isBlur = false,
    symbolName = null,
  ) => {
    const LotSize = parseInt(lotSizeValue) || 1;
    const maxQuantity = getMaxQuantity();
    if (inputValue === "" || inputValue === null || inputValue === undefined)
      return isBlur ? LotSize.toString() : "";
    const numValue = parseFloat(inputValue);
    if (numValue <= 0) return LotSize.toString();
    if (numValue > 0 && numValue < LotSize && numValue <= 100) {
      const lotNumber = Math.floor(numValue),
        convertedQty = lotNumber * LotSize;
      if (maxQuantity !== null && convertedQty > maxQuantity) {
        const rawMaxLot = getMaxLot();
        const effectiveLots =
          maxQuantity !== null && LotSize > 0
            ? Math.floor(maxQuantity / LotSize)
            : null;
        const displayLots =
          effectiveLots !== null &&
          !Number.isNaN(effectiveLots) &&
          effectiveLots > 0
            ? effectiveLots
            : rawMaxLot;
        const symbolDisplay = ProductName || IdentifierName || "this symbol";
        showMaxLimitToast(
          `⚠️ Maximum limit hit! Maximum lot limit is ${displayLots} lots (${maxQuantity} qty) for ${symbolDisplay}. You cannot exceed this limit.`,
          4000,
        );
        return maxQuantity.toString();
      }
      return convertedQty.toString();
    }
    const remainder = numValue % LotSize;
    let validQty = numValue;
    if (remainder !== 0) {
      const nearestLot = Math.round(numValue / LotSize);
      validQty = Math.max(1, nearestLot) * LotSize;
    }
    if (maxQuantity !== null && validQty > maxQuantity) {
      const rawMaxLot = getMaxLot();
      const effectiveLots =
        maxQuantity !== null && LotSize > 0
          ? Math.floor(maxQuantity / LotSize)
          : null;
      const displayLots =
        effectiveLots !== null &&
        !Number.isNaN(effectiveLots) &&
        effectiveLots > 0
          ? effectiveLots
          : rawMaxLot;
      const symbolDisplay = ProductName || IdentifierName || "this symbol";
      showMaxLimitToast(
        `⚠️ Maximum limit hit! Maximum lot limit is ${displayLots} lots (${maxQuantity} qty) for ${symbolDisplay}. You cannot exceed this limit.`,
        4000,
      );
      return maxQuantity.toString();
    }
    return validQty.toString();
  };

  const processedStrikePrices = (strikePriceList) => {
    if (!strikePriceList || strikePriceList.length === 0) return [];
    const totalItm = strikePriceList.filter(
      (opt) => opt.product === "ITM",
    ).length;
    let itmCounter = 0,
      otmCounter = 0;
    return strikePriceList.map((option) => {
      let baseLabel = "",
        code = 0;
      if (option.product === "ITM") {
        itmCounter += 1;
        baseLabel = `ITM-${itmCounter}`;
        code = 1 + itmCounter;
      } else if (option.product === "OTM") {
        otmCounter += 1;
        baseLabel = `OTM-${otmCounter}`;
        code = 1 + totalItm + otmCounter;
      } else {
        baseLabel = "ATM";
        code = 1;
      }
      return { ...option, label: baseLabel, code };
    });
  };

  const getOptionsType = (strikePrice, optionType) => {
    if (!strikePrice || !optionType || optionType === "FUT") return "";
    const strikeList =
      optionType === "CE" ? strikePriceCEList : strikePricePEList;
    if (!strikeList || strikeList.length === 0) return "";
    const optionsWithCode = processedStrikePrices(strikeList);
    const match = optionsWithCode.find(
      (item) =>
        item.strikePrice === strikePrice ||
        item.strikePrice?.toString() === strikePrice?.toString(),
    );
    return match ? match.code : "";
  };

  const getOptionsTypeLabel = (strikePrice, optionType) => {
    if (!strikePrice || !optionType || optionType === "FUT") return "";
    const strikeList =
      optionType === "CE" ? strikePriceCEList : strikePricePEList;
    if (!strikeList || strikeList.length === 0) return "";
    const optionsWithCode = processedStrikePrices(strikeList);
    const match = optionsWithCode.find(
      (item) =>
        item.strikePrice === strikePrice ||
        item.strikePrice?.toString() === strikePrice?.toString(),
    );
    return match ? match.label : "";
  };

  const handleOrderLegChange = (legId, field, value, isBlur = false) => {
    if (field === "action" && strategyType === "indicator-based") {
      const transactionType = strategyState.transactionType;
      if (transactionType === "only-long" && value === "SELL") {
        errorMsg("Only Long mode: Only BUY transactions are allowed.");
        return;
      }
      if (transactionType === "only-short" && value === "BUY") {
        errorMsg("Only Short mode: Only SELL transactions are allowed.");
        return;
      }
    }
    let finalValue = value;
    if (field === "qty") {
      finalValue = validateAndConvertQty(
        value,
        LotSize || 1,
        isBlur,
        ProductName || IdentifierName || null,
      );
      if (finalValue === "" && value !== "" && !isBlur) return;
    }
    setStrategyState((prev) => {
      const legs = prev?.qaCustomCustomerOptionsAlgoChild || [];
      const updatedLegs = legs.map((leg) => {
        if (leg.id !== legId) return leg;
        const updatedLeg = { ...leg, [field]: finalValue };
        if (field === "strikePrice" || field === "OptionsType") {
          const strikePrice =
            field === "strikePrice" ? finalValue : leg.strikePrice;
          const optionType =
            field === "optionType" ? finalValue : leg.optionType;
          updatedLeg.optionsType = getOptionsType(strikePrice, optionType);
        }
        return updatedLeg;
      });
      return { ...prev, qaCustomCustomerOptionsAlgoChild: updatedLegs };
    });
  };

  const addOrderLeg = () => {
    const symbolValidation = validateSymbolSelection(strategyState);
    if (!symbolValidation.isValid) {
      errorMsg(symbolValidation.message);
      return;
    }
    let defaultAction = "BUY";
    if (strategyType === "indicator-based") {
      const transactionType = strategyState.transactionType;
      if (transactionType === "only-short") defaultAction = "SELL";
      else if (transactionType === "only-long") defaultAction = "BUY";
      else defaultAction = "BUY";
    }
    const currentDate = new Date().toISOString();
    const newLeg = {
      id: Date.now(),
      COACID: 0,
      COAID: 0,
      AlgoType: strategyState?.AlgoType,
      TradeType: 0,
      StratergyID: strategyState?.StratergyID,
      BrokerConfigID: strategyState?.CustomerBrokerID || 0,
      ProductType: strategyState?.ProductType,
      IdentifierID: strategyState?.IdentifierID,
      CustomerId: Storage.decryptData(localStorage.getItem("customerID")),
      CallType: defaultAction,
      OptionsType: "",
      orderLegType: "",
      ExpiryDate: "",
      OrderQuantity: LotSize || "1",
      CustomerAlgoTradeID: 0,
      status: true,
      Createddate: currentDate,
      Modifieddate: currentDate,
      action: defaultAction,
      qty: LotSize || "1",
      optionType: "",
      expiry: "",
      strikePrice: "",
      ltp: "0.00",
      Identifier: defaultIdentifier,
      Stoploss: 0,
      Takeprofit: 0,
      Status: true,
      SpecificLimitofDay: 0,
      OverallCapital: strategyState?.rmLossExitAmount || 0,
      TrailingStopLoss: 0,
      OverallCapitalProfit: strategyState?.rmProfitExitAmount || 0,
      TrailingProfit: 0,
    };
    setStrategyState((prev) => ({
      ...prev,
      qaCustomCustomerOptionsAlgoChild: [
        ...prev.qaCustomCustomerOptionsAlgoChild,
        newLeg,
      ],
    }));
  };

  const deleteOrderLeg = (legId) => {
    setStrategyState((prev) => ({
      ...prev,
      qaCustomCustomerOptionsAlgoChild:
        prev.qaCustomCustomerOptionsAlgoChild.filter((leg) => leg.id !== legId),
    }));
  };

  const duplicateOrderLeg = (legId) => {
    const legToDuplicate = strategyState?.qaCustomCustomerOptionsAlgoChild.find(
      (leg) => leg.id === legId,
    );
    if (legToDuplicate) {
      setStrategyState((prev) => ({
        ...prev,
        qaCustomCustomerOptionsAlgoChild: [
          ...prev.qaCustomCustomerOptionsAlgoChild,
          { ...legToDuplicate, id: Date.now() },
        ],
      }));
    }
  };

  const setLegsFn = async (type) => {
    if (type === selectedStrategy) return;
    const symbolValidation = validateSymbolSelection(strategyState);
    if (!symbolValidation.isValid) {
      errorMsg(symbolValidation.message);
      return;
    }
    setStrategyState((prev) => ({
      ...prev,
      selectedStrategy: type,
      qaCustomCustomerOptionsAlgoChild: [],
    }));
    let times = 1;
    if (
      [
        "bC_spread",
        "long_straddle",
        "short_straddle",
        "bear_put",
        "short_strangle",
      ].includes(type)
    )
      times = 2;
    if (["iron_butter", "short_iron"].includes(type)) times = 4;
    const CEStrikeList = strikePriceCEList?.length ? strikePriceCEList : [];
    const PEStrikeList = strikePricePEList?.length ? strikePricePEList : [];
    if (strategyType === "indicator-based") {
      const transactionType = strategyState.transactionType;
      const strategyActions = [];
      for (let i = 0; i < times; i++) {
        let action = "BUY";
        if (i === 1 && type === "bC_spread") action = "SELL";
        if (type === "iron_butter" && (i === 0 || i === 1)) action = "SELL";
        if (type === "short_iron" && (i === 0 || i === 1)) action = "SELL";
        if (type === "short_straddle" && (i === 0 || i === 1)) action = "SELL";
        if (type === "bear_put" && i === 1) action = "SELL";
        if (type === "short_strangle") action = "SELL";
        strategyActions.push(action);
      }
      if (transactionType === "only-long" && strategyActions.includes("SELL")) {
        errorMsg(
          "Only Long mode: This strategy contains SELL transactions which are not allowed.",
        );
        setStrategyState((prev) => ({
          ...prev,
          indicatorBased: { ...prev.indicatorBased, selectedStrategy: "" },
        }));
        return;
      }
      if (transactionType === "only-short" && strategyActions.includes("BUY")) {
        errorMsg(
          "Only Short mode: This strategy contains BUY transactions which are not allowed.",
        );
        setStrategyState((prev) => ({
          ...prev,
          indicatorBased: { ...prev.indicatorBased, selectedStrategy: "" },
        }));
        return;
      }
    }
    const shouldCreateSequentially = [
      "naked_ce",
      "bC_spread",
      "long_straddle",
      "short_straddle",
      "iron_butter",
      "short_iron",
    ].includes(type);
    for (let i = 0; i < times; i++) {
      if (shouldCreateSequentially && i > 0)
        await new Promise((resolve) => setTimeout(resolve, 300));
      let index = 3,
        action = "BUY",
        optionType = "CE",
        qty = LotSize || 1,
        strikePriceList = CEStrikeList;
      if (i === 1 && type === "bC_spread") {
        index = 5;
        action = "SELL";
      }
      if (type === "long_straddle") {
        if (i === 1) {
          optionType = "PE";
          strikePriceList = PEStrikeList;
        }
        index = 1;
      }
      if (type === "iron_butter") {
        if (i === 0) {
          action = "SELL";
          index = 1;
        }
        if (i === 1) {
          action = "SELL";
          index = 1;
          optionType = "PE";
          strikePriceList = PEStrikeList;
        }
        if (i === 2) index = 4;
        if (i === 3) {
          index = 4;
          optionType = "PE";
          strikePriceList = PEStrikeList;
        }
      }
      if (type === "short_iron") {
        if (i === 0) {
          action = "SELL";
          optionType = "CE";
          strikePriceList = CEStrikeList;
        }
        if (i === 1) {
          action = "SELL";
          optionType = "PE";
          strikePriceList = PEStrikeList;
        }
        if (i === 2) {
          action = "BUY";
          optionType = "CE";
          strikePriceList = CEStrikeList;
        }
        if (i === 3) {
          action = "BUY";
          optionType = "PE";
          strikePriceList = PEStrikeList;
        }
      }
      if (type === "short_straddle") {
        if (i === 0) {
          action = "SELL";
          index = 1;
        }
        if (i === 1) {
          action = "SELL";
          index = 1;
          optionType = "PE";
          strikePriceList = PEStrikeList;
        }
      }
      if (type === "naked_pe") {
        action = "BUY";
        index = 1;
        optionType = "PE";
        strikePriceList = PEStrikeList;
      }
      if (type === "bear_put") {
        optionType = "PE";
        strikePriceList = PEStrikeList;
        if (i === 0) index = 1;
        if (i === 1) {
          action = "SELL";
          index = 6;
        }
      }
      if (type === "short_strangle") {
        action = "SELL";
        index = 6;
        if (i === 1) {
          optionType = "PE";
          strikePriceList = PEStrikeList;
        }
      }
      let lastObjData = null;
      const getAtm = (list) => list.find((item) => item.product === "ATM");
      const getAtmStrikeNum = (list) =>
        parseFloat(getAtm(list)?.strikePrice) || parseFloat(defaultStrike) || 0;
      const findClosest = (list, target) =>
        list.find(
          (item) => Math.abs(parseFloat(item.strikePrice) - target) < 50,
        ) || { strikePrice: target, lastTradePrice: 0, identifier: "" };
      if (
        ["naked_ce", "naked_pe"].includes(type) ||
        (type === "bC_spread" && i === 0)
      ) {
        lastObjData = getAtm(strikePriceList) || {
          strikePrice: defaultStrike || 0,
          lastTradePrice: defaultLtp || 0,
          identifier: defaultIdentifier || "",
        };
      } else if (type === "bC_spread" && i === 1) {
        lastObjData =
          findClosest(
            strikePriceList,
            getAtmStrikeNum(strikePriceList) + 200,
          ) || strikePriceList[strikePriceList.length - 1];
      } else if (["long_straddle", "short_straddle"].includes(type)) {
        lastObjData = getAtm(strikePriceList) || {
          strikePrice: defaultStrike || 0,
          lastTradePrice: defaultLtp || 0,
          identifier: defaultIdentifier || "",
        };
      } else if (type === "iron_butter") {
        const atm = getAtmStrikeNum(strikePriceList);
        const targets = [atm, atm, atm + 200, atm - 200];
        lastObjData = findClosest(strikePriceList, targets[i]);
      } else if (type === "short_iron") {
        const atm = getAtmStrikeNum(CEStrikeList);
        const targets = [atm + 200, atm - 200, atm + 400, atm - 400];
        lastObjData = findClosest(strikePriceList, targets[i]);
      } else if (type === "bear_put") {
        const atm = getAtmStrikeNum(strikePriceList);
        lastObjData = findClosest(strikePriceList, i === 0 ? atm : atm - 200);
      } else if (type === "short_strangle") {
        const atm = getAtmStrikeNum(strikePriceList);
        lastObjData = findClosest(
          strikePriceList,
          i === 0 ? atm + 200 : atm - 200,
        );
      } else {
        const atmIndex = strikePriceList.findIndex(
          (item) => item.product === "ATM",
        );
        lastObjData =
          atmIndex !== -1
            ? strikePriceList.slice(atmIndex, atmIndex + index).slice(-1)[0]
            : null;
      }
      await new Promise((resolve) => {
        const strikePrice = lastObjData
          ? lastObjData?.strikePrice
          : defaultStrike || 0;
        const currentDate = new Date().toISOString();
        const optionsTypeValue = getOptionsType(strikePrice, optionType);
        const optionsTypeLabel = getOptionsTypeLabel(strikePrice, optionType);
        const legObj = {
          id: Date.now() + i,
          COACID: 0,
          COAID: 0,
          AlgoType: strategyState?.AlgoType,
          StratergyID: strategyState?.StratergyID,
          BrokerConfigID: strategyState?.CustomerBrokerID || 0,
          ProductType: strategyState?.ProductType,
          IdentifierID: strategyState?.IdentifierID,
          CustomerId: Storage.decryptData(localStorage.getItem("customerID")),
          TradeType: 0,
          CallType: action,
          OptionsType: optionsTypeValue,
          orderLegType: optionType,
          ExpiryDate: defaultExpiry || expiryList[0] || "Monthly",
          OrderQuantity: qty,
          CustomerAlgoTradeID: 0,
          status: true,
          Createddate: currentDate,
          Modifieddate: currentDate,
          action,
          optionType,
          expiry: defaultExpiry || expiryList[0] || "Monthly",
          qty,
          strikePrice,
          ltp: lastObjData
            ? typeof lastObjData.lastTradePrice === "number"
              ? lastObjData.lastTradePrice.toFixed(2)
              : "0.00"
            : typeof defaultLtp === "number"
              ? defaultLtp.toFixed(2)
              : "0.00",
          identifier: lastObjData
            ? lastObjData?.identifier
            : defaultIdentifier || "",
          Stoploss: 0,
          Takeprofit: 0,
          Status: true,
          SpecificLimitofDay: 0,
          OverallCapital: 0,
          TrailingStopLoss: 0,
          OverallCapitalProfit: 0,
          TrailingProfit: 0,
          OptionsTypeLabel: optionsTypeLabel,
        };
        setStrategyState((prev) => ({
          ...prev,
          qaCustomCustomerOptionsAlgoChild: [
            ...prev.qaCustomCustomerOptionsAlgoChild,
            legObj,
          ],
        }));
        if (shouldCreateSequentially) setTimeout(() => resolve(), 100);
        else resolve();
      });
    }
  };

  const openInstrumentModal = () =>
    setStrategyState((prev) => ({ ...prev, isInstrumentModalOpen: true }));
  const closeInstrumentModal = () =>
    setStrategyState((prev) => ({ ...prev, isInstrumentModalOpen: false }));
  const handleInstrumentTabChange = (tab) =>
    setStrategyState((prev) => ({ ...prev, instrumentCategory: tab }));

  useEffect(() => {
    if (!isInstrumentModalOpen) setInstrumentSearchQuery("");
  }, [isInstrumentModalOpen]);

  const filteredSymbols = useMemo(() => {
    if (!instrumentCategory || !symbolCategories.length) return [];
    const selectedCategory = symbolCategories.find(
      (cat) => cat.categoryName === instrumentCategory,
    );
    if (!selectedCategory) return [];
    const symbols = symbolsByCategory[selectedCategory.categoryID] || [];
    if (!instrumentSearchQuery.trim()) return symbols;
    const query = instrumentSearchQuery.toLowerCase().trim();
    return symbols.filter((symbol) => {
      const identifier = (symbol.identifier || "").toLowerCase();
      const symbolName = (symbol.symbolName || "").toLowerCase();
      return identifier.includes(query) || symbolName.includes(query);
    });
  }, [
    instrumentCategory,
    symbolCategories,
    symbolsByCategory,
    instrumentSearchQuery,
  ]);

  const handleInstrumentSelect = (instrument) => {
    setStrategyState((prev) => ({
      ...prev,
      ProductName: instrument.product,
      IdentifierName: instrument.identifier,
      IdentifierID: instrument.symbolIdentifierId,
      freezeQty: instrument.freezeQty ?? prev.freezeQty ?? null,
      isInstrumentModalOpen: false,
      LotSize: "",
      defaultExpiry: "",
      defaultStrike: "",
      defaultLtp: 0.0,
      defaultIdentifier: "",
    }));
    setOptionChainData({
      expiryList: [],
      strikePriceCEList: [],
      strikePricePEList: [],
    });
    fetchOptionChainData(instrument);
  };

  const getLotSize = useCallback(
    async (symbolIdentifierId) => {
      try {
        const lotSizeData = await fetchSymbolLotSize(
          { identifierid: symbolIdentifierId },
          navigate,
        );
        setStrategyState((prev) => ({
          ...prev,
          LotSize: lotSizeData?.quotationLot,
        }));
        return lotSizeData;
      } catch (error) {
        return null;
      }
    },
    [navigate],
  );

  const getSymbolExpiryList = useCallback(
    async (strProduct) => {
      try {
        const expiryData = await fetchSymbolExpiryList(
          { strProduct },
          navigate,
        );
        if (expiryData) {
          expiryData.reverse();
          setOptionChainData((prev) => ({ ...prev, expiryList: expiryData }));
          return expiryData;
        }
        return [];
      } catch (error) {
        return [];
      }
    },
    [navigate],
  );

  const getStrikePrice = useCallback(
    async (expiry = "", product = "", instrumentType = "") => {
      const reqData = {
        strExpiry: expiry || expiryList[0],
        strProduct: product || symbolProduct,
      };
      let strikeList = [];
      if (reqData?.strProduct && reqData?.strExpiry) {
        if (instrumentType === "CE") {
          const result = await asyncGetOptionListCE({ formData: reqData });
          strikeList = result?.data?.result || [];
          setOptionChainData((prev) => ({
            ...prev,
            strikePriceCEList: strikeList,
          }));
        }
        if (instrumentType === "PE") {
          const result = await asyncGetOptionListPE({ formData: reqData });
          strikeList = result?.data?.result || [];
          setOptionChainData((prev) => ({
            ...prev,
            strikePricePEList: strikeList,
          }));
        }
      }
      return strikeList;
    },
    [expiryList, symbolProduct],
  );

  const fetchOptionChainData = useCallback(
    async (symbol) => {
      if (!symbol) return;
      try {
        setStrategyState((prev) => ({
          ...prev,
          symbolProduct: symbol.product || symbol.symbolName,
        }));
        await getLotSize(symbol.symbolIdentifierId);
        const expiryData = await getSymbolExpiryList(
          symbol.product || symbol.symbolName,
        );
        if (expiryData && expiryData.length > 0) {
          const ceStrikeList = await getStrikePrice(
            expiryData[0],
            symbol.product || symbol.symbolName,
            "CE",
          );
          await getStrikePrice(
            expiryData[0],
            symbol.product || symbol.symbolName,
            "PE",
          );
          const CEStrikeList = ceStrikeList?.length ? ceStrikeList : [];
          const strikeData = CEStrikeList.find(
            (item) => item.product === "ATM",
          );
          setStrategyState((prev) => ({
            ...prev,
            defaultExpiry: expiryData[0],
            defaultStrike: strikeData?.strikePrice || 0,
            defaultLtp: strikeData?.lastTradePrice || 0,
            defaultIdentifier: strikeData?.identifier || "",
          }));
        }
      } catch (error) {}
    },
    [
      getLotSize,
      getSymbolExpiryList,
      getStrikePrice,
      LotSize?.quotationLot,
      strikePriceCEList,
    ],
  );

  const getLegRealTimeData = useCallback(
    (leg) => {
      if (!leg.identifier) return null;
      const isCE = leg.optionType === "CE" || leg.instrument === "CE";
      const realTimeData = isCE
        ? symbolValueCE[leg.identifier]
        : symbolValuePE[leg.identifier];
      const greeksData = isCE
        ? symbolValueCEGreeks[leg.identifier]
        : symbolValuePEGreeks[leg.identifier];
      const processedLastTradePrice = realTimeData?.lastTradePrice
        ? typeof realTimeData.lastTradePrice === "number"
          ? realTimeData.lastTradePrice
          : parseFloat(realTimeData.lastTradePrice) || 0
        : 0;
      return {
        lastTradePrice: processedLastTradePrice,
        greeks: greeksData || {},
      };
    },
    [symbolValueCE, symbolValuePE, symbolValueCEGreeks, symbolValuePEGreeks],
  );

  useEffect(() => {
    const loadBothOptionTypes = async () => {
      if (expiryList.length > 0 && symbolProduct) {
        try {
          await getStrikePrice(expiryList[0], symbolProduct, "CE");
          await getStrikePrice(expiryList[0], symbolProduct, "PE");
        } catch (error) {}
      }
    };
    loadBothOptionTypes();
  }, [expiryList, symbolProduct, getStrikePrice]);

  useEffect(() => {
    if (strikePriceCEList.length > 0) {
      const strikeData = strikePriceCEList.find(
        (item) => item.product === "ATM",
      );
      if (strikeData)
        setStrategyState((prev) => ({
          ...prev,
          defaultStrike: strikeData.strikePrice,
          defaultLtp: strikeData.lastTradePrice,
          defaultIdentifier: strikeData.identifier,
        }));
    }
  }, [strikePriceCEList]);

  useEffect(() => {
    if (!defaultIdentifier) return;
    const strikeLiveData = symbolValueCE[defaultIdentifier];
    if (strikeLiveData && strikeLiveData.lastTradePrice !== undefined) {
      setStrategyState((prev) => {
        if (prev.defaultLtp === strikeLiveData.lastTradePrice) return prev;
        return { ...prev, defaultLtp: strikeLiveData.lastTradePrice };
      });
    }
  }, [defaultIdentifier, symbolValueCE[defaultIdentifier]?.lastTradePrice]);

  useEffect(() => {
    if (
      !strategyState?.qaCustomCustomerOptionsAlgoChild ||
      strategyState?.qaCustomCustomerOptionsAlgoChild.length === 0
    )
      return;
    setStrategyState((prev) => {
      const currentLegs = prev?.qaCustomCustomerOptionsAlgoChild;
      let hasChanges = false;
      const updatedLegs = currentLegs.map((leg) => {
        if (!leg.identifier) return leg;
        const isCE = leg.optionType === "CE" || leg.instrument === "CE";
        const directLiveData = isCE
          ? symbolValueCE[leg.identifier]
          : symbolValuePE[leg.identifier];
        let livePrice = null;
        if (
          directLiveData &&
          directLiveData.lastTradePrice !== undefined &&
          directLiveData.lastTradePrice !== null &&
          directLiveData.lastTradePrice > 0
        ) {
          livePrice = directLiveData.lastTradePrice;
        } else {
          const realTimeData = getLegRealTimeData(leg);
          if (
            realTimeData &&
            realTimeData.lastTradePrice !== undefined &&
            realTimeData.lastTradePrice !== null &&
            realTimeData.lastTradePrice > 0
          )
            livePrice = realTimeData.lastTradePrice;
        }
        if (livePrice !== null && livePrice !== undefined && livePrice > 0) {
          const newLtp =
            typeof livePrice === "number"
              ? livePrice.toFixed(2)
              : parseFloat(livePrice).toFixed(2);
          const newLtpNum = parseFloat(newLtp);
          if (isNaN(newLtpNum) || newLtpNum <= 0) return leg;
          const currentLtpNum = parseFloat(leg.ltp?.toString() || "0.00") || 0;
          if (Math.abs(currentLtpNum - newLtpNum) > 0.01) {
            hasChanges = true;
            return { ...leg, ltp: newLtp };
          }
        }
        return leg;
      });
      if (!hasChanges) return prev;
      return { ...prev, qaCustomCustomerOptionsAlgoChild: updatedLegs };
    });
  }, [
    strategyState?.qaCustomCustomerOptionsAlgoChild
      ?.map((leg) => {
        if (!leg.identifier) return null;
        const isCE = leg.optionType === "CE" || leg.instrument === "CE";
        const liveData = isCE
          ? symbolValueCE[leg.identifier]
          : symbolValuePE[leg.identifier];
        const price = liveData?.lastTradePrice;
        return price && price > 0 ? `${leg.identifier}-${price}` : null;
      })
      .filter(Boolean)
      .join(","),
    strategyState?.qaCustomCustomerOptionsAlgoChild
      ?.map((leg) => `${leg.id}-${leg.identifier || ""}`)
      .join(","),
    getLegRealTimeData,
    strategyType,
    Object.keys(symbolValueCE || {}).length,
    Object.keys(symbolValuePE || {}).length,
  ]);

  const fetchSymbolCategories = useCallback(async () => {
    try {
      const response = await asyncGetSymbolCategoryList();
      if (response?.data?.result) {
        const mappedCategories = response.data.result.map((category) => ({
          categoryName: category.symbolCategoryName,
          categoryID: category.symbolCategoryID,
          status: category.status,
          CompanyId: category.compnayID,
        }));
        const optionsCategory = mappedCategories.find((cat) =>
          cat.categoryName.toLowerCase().includes("options"),
        );
        const defaultTab = optionsCategory
          ? optionsCategory.categoryName
          : mappedCategories.length > 0
            ? mappedCategories[0].categoryName
            : "";
        setSymbolCategories(mappedCategories);
        setStrategyState((prev) => ({
          ...prev,
          instrumentCategory: defaultTab || prev.instrumentCategory,
        }));
      }
    } catch (error) {
      handleCatchErrors(error, navigate);
    }
  }, [navigate]);

  const fetchSymbolsByCategory = useCallback(
    async (categoryId) => {
      if (symbolsByCategory[categoryId]) return;
      try {
        setStrategyState((prev) => ({ ...prev, isLoadingSymbols: true }));
        const response = await asyncGetWatchListByUserId({
          sendData: { categoryID: categoryId, identifier: "" },
        });
        if (response?.data?.result) {
          setSymbolsByCategory((prev) => ({
            ...prev,
            [categoryId]: response.data.result,
          }));
          setStrategyState((prev) => ({ ...prev, isLoadingSymbols: false }));
        } else
          setStrategyState((prev) => ({ ...prev, isLoadingSymbols: false }));
      } catch (error) {
        handleCatchErrors(error, navigate);
        setStrategyState((prev) => ({ ...prev, isLoadingSymbols: false }));
      }
    },
    [navigate, symbolsByCategory],
  );

  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      if (hasFetchedCategories.current) return;
      try {
        hasFetchedCategories.current = true;
        await fetchSymbolCategories();
      } catch (error) {
        hasFetchedCategories.current = false;
      }
    };
    if (isMounted) loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [fetchSymbolCategories]);

  useEffect(() => {
    if (symbolCategories.length > 0 && !hasFetchedSymbols.current) {
      hasFetchedSymbols.current = true;
      symbolCategories.forEach((category) => {
        if (!symbolsByCategory[category.categoryID])
          fetchSymbolsByCategory(category.categoryID);
      });
    }
  }, [symbolCategories, symbolsByCategory, fetchSymbolsByCategory]);

  const handleRiskManagementChange = (field, value) => {
    setStrategyState((prev) => ({
      ...prev,
      riskManagement: { ...prev.riskManagement, [field]: value },
    }));
  };

  const handleSaveAndContinue = async () => {
    try {
      setValidationErrors([]);
      setBackendErrors([]);
      setIsSubmitting(true);
      const maxQuantity = getMaxQuantity();
      if (maxQuantity !== null) {
        for (const leg of strategyState?.qaCustomCustomerOptionsAlgoChild ||
          []) {
          const legQty = parseInt(leg.qty) || 0;
          if (legQty > maxQuantity) {
            const rawMaxLot = getMaxLot();
            const effectiveLots =
              maxQuantity !== null && LotSize > 0
                ? Math.floor(maxQuantity / (parseInt(LotSize) || 1))
                : null;
            const displayLots =
              effectiveLots !== null &&
              !Number.isNaN(effectiveLots) &&
              effectiveLots > 0
                ? effectiveLots
                : rawMaxLot;
            const symbolDisplay =
              ProductName || IdentifierName || "this symbol";
            const message = `⚠️ Maximum limit hit! Maximum lot limit is ${displayLots} lots (${maxQuantity} qty) for ${symbolDisplay}. Leg quantity ${legQty} exceeds this limit.`;
            showMaxLimitToast(message, 5000);
            setValidationErrors([
              `⚠️ Maximum limit hit! Leg quantity ${legQty} exceeds maximum limit of ${maxQuantity} qty (${displayLots} lots)`,
            ]);
            setIsSubmitting(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
          }
        }
      }
      const validation = validateStrategy(strategyState);
      if (!validation.isValid) {
        setIsSubmitting(false);
        const firstMessage = validation.errors?.[0]?.message;
        if (firstMessage) errorMsg(firstMessage);
        return;
      }
      const validatedData = validation.value || strategyState;
      const apiUrl = process.env.REACT_APP_CHART_PRODUCTION_API_ENDPOINT;
      const { REACT_APP_CHART_SECRET_TOKEN } = process.env;
      const cusToken = Storage.decryptData(localStorage.getItem("cusToken"));
      const authToken = cusToken || REACT_APP_CHART_SECRET_TOKEN;
      const response = await fetch(`${apiUrl}/api/strategy/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(validatedData),
      });
      const result = await response.json();
      if (result.success) {
        setValidationErrors([]);
        setBackendErrors([]);
        await successMsg(`Strategy "${StrategyName}" created successfully!`);
        navigate("/strategy-list");
      } else {
        if (result.errors && Array.isArray(result.errors)) {
          setBackendErrors(result.errors);
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          setBackendErrors([
            {
              field: "general",
              message: result.message || "Unknown error occurred",
            },
          ]);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    } catch (error) {
      setBackendErrors([
        {
          field: "general",
          message: "An error occurred while saving the strategy",
        },
      ]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (fieldPath) => {
    const validationError = validationErrors.find(
      (err) => err.field === fieldPath,
    );
    if (validationError) return validationError.message;
    const backendError = backendErrors.find((err) => err.field === fieldPath);
    if (backendError) return backendError.message;
    return null;
  };

  const clearErrors = () => {
    setValidationErrors([]);
    setBackendErrors([]);
    setShowToast(false);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    if (validationErrors.length > 0 || backendErrors.length > 0) {
      setShowToast(true);
      toastTimeoutRef.current = setTimeout(() => {
        setShowToast(false);
        toastTimeoutRef.current = null;
      }, 5000);
    } else setShowToast(false);
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = null;
      }
    };
  }, [validationErrors, backendErrors]);

  // ─── Indicator Modal ───────────────────────────────────────────────────────
  const openIndicatorModal = (
    type,
    groupId,
    conditionId,
    field,
    currentValue,
  ) => {
    const indicatorValue = currentValue || "rsi";
    const defaultPeriod = getDefaultPeriod(indicatorValue);
    const defaultMultiplier = getDefaultMultiplier();
    let periodValue = defaultPeriod,
      multiplierValue = defaultMultiplier,
      overboughtValue = "70";
    const defMacdForModal = getDefaultMacd();
    let macdFastVal = defMacdForModal.fast,
      macdSlowVal = defMacdForModal.slow,
      macdSignalVal = defMacdForModal.signal;

    const setValuesFromCondition = (condition) => {
      if (!condition) return;
      periodValue =
        condition.period !== undefined && condition.period !== null
          ? condition.period
          : defaultPeriod;
      multiplierValue =
        condition.multiplier !== undefined && condition.multiplier !== null
          ? condition.multiplier
          : defaultMultiplier;
      if (indicatorValue === "rsi") {
        const ob = condition.overboughtThreshold ?? condition.threshold;
        if (ob !== undefined && ob !== null && ob !== "")
          overboughtValue = String(ob);
        else overboughtValue = "70";
      }
      if (indicatorValue === "macd") {
        if (condition.fastPeriod != null) macdFastVal = condition.fastPeriod;
        if (condition.slowPeriod != null) macdSlowVal = condition.slowPeriod;
        if (condition.signalPeriod != null)
          macdSignalVal = condition.signalPeriod;
      }
      // ← EMA_4: existing values load karo
      if (indicatorValue === "ema_4") {
        if (condition.period1 != null)
          setSelectedEma4Period1(condition.period1);
        if (condition.period2 != null)
          setSelectedEma4Period2(condition.period2);
        if (condition.period3 != null)
          setSelectedEma4Period3(condition.period3);
        if (condition.period4 != null)
          setSelectedEma4Period4(condition.period4);
        if (condition.ema4Line != null) setSelectedEma4Line(condition.ema4Line);
      }
      // ← Pivot HL: existing values load karo
      if (indicatorValue === "pivot_hl") {
        if (condition.pivotLeftBars != null)
          setSelectedPivotLeftBars(condition.pivotLeftBars);
        if (condition.pivotRightBars != null)
          setSelectedPivotRightBars(condition.pivotRightBars);
        if (condition.pivotType != null)
          setSelectedPivotType(condition.pivotType);
      }
    };

    setIndicatorModal({
      isOpen: true,
      type,
      groupId,
      conditionId,
      field,
      currentValue: currentValue || "",
    });
    setSelectedIndicator(indicatorValue);
    if (type === "longEntry" || type === "shortEntry") {
      const group = entryConditions.conditionGroups.find(
        (g) => g.id === groupId,
      );
      if (group && group[type]) setValuesFromCondition(group[type]);
    } else if (type === "longExit" || type === "shortExit") {
      const group = exitConditions.conditionGroups.find(
        (g) => g.id === groupId,
      );
      if (group && group[type]) setValuesFromCondition(group[type]);
    }
    setSelectedPeriod(periodValue);
    setSelectedMultiplier(multiplierValue);
    if (indicatorValue === "rsi") setSelectedOverbought(overboughtValue);
    if (indicatorValue === "macd") {
      setSelectedMacdFast(macdFastVal);
      setSelectedMacdSlow(macdSlowVal);
      setSelectedMacdSignal(macdSignalVal);
    }
  };

  const closeIndicatorModal = () => {
    setIndicatorModal({
      isOpen: false,
      type: null,
      groupId: null,
      conditionId: null,
      field: null,
      currentValue: null,
    });
  };

  // ─── Confirm Indicator Selection ──────────────────────────────────────────
  const confirmIndicatorSelection = () => {
    const { type, groupId, conditionId, field } = indicatorModal;
    const needsPeriod = ["rsi", "supertrend", "ema", "sma", "adx"].includes(
      selectedIndicator,
    );
    const needsMultiplier = selectedIndicator === "supertrend";
    const needsOverbought = selectedIndicator === "rsi";
    const needsMacdParams = selectedIndicator === "macd";
    const needsEma4Params = selectedIndicator === "ema_4"; // ← EMA_4
    const needsPivotParams = selectedIndicator === "pivot_hl"; // ← Pivot HL

    const defMacd = getDefaultMacd();
    const macdFast = needsMacdParams
      ? selectedMacdFast || defMacd.fast
      : undefined;
    const macdSlow = needsMacdParams
      ? selectedMacdSlow || defMacd.slow
      : undefined;
    const macdSignal = needsMacdParams
      ? selectedMacdSignal || defMacd.signal
      : undefined;
    const periodValue = needsPeriod
      ? selectedPeriod || getDefaultPeriod(selectedIndicator)
      : undefined;
    const multiplierValue = needsMultiplier
      ? selectedMultiplier || getDefaultMultiplier()
      : undefined;
    const overboughtValue = needsOverbought
      ? selectedOverbought || "70"
      : undefined;

    if (type === "longEntry" || type === "shortEntry") {
      handleEntryConditionChange(groupId, type, field, selectedIndicator);
      if (needsPeriod)
        handleEntryConditionChange(groupId, type, "period", periodValue);
      if (needsMultiplier)
        handleEntryConditionChange(
          groupId,
          type,
          "multiplier",
          multiplierValue,
        );
      if (needsMacdParams) {
        handleEntryConditionChange(groupId, type, "fastPeriod", macdFast);
        handleEntryConditionChange(groupId, type, "slowPeriod", macdSlow);
        handleEntryConditionChange(groupId, type, "signalPeriod", macdSignal);
      }
      if (needsOverbought && overboughtValue !== undefined) {
        handleEntryConditionChange(
          groupId,
          type,
          "overboughtThreshold",
          overboughtValue,
        );
        const comp = entryConditions.conditionGroups.find(
          (g) => g.id === groupId,
        )?.[type]?.comparator;
        const ob = Number(overboughtValue);
        handleEntryConditionChange(
          groupId,
          type,
          "threshold",
          comp && ["less", "crosses-below"].includes(comp)
            ? String(100 - ob)
            : String(ob),
        );
      }
      // ← EMA_4: entry conditions save
      if (needsEma4Params) {
        handleEntryConditionChange(
          groupId,
          type,
          "period1",
          selectedEma4Period1,
        );
        handleEntryConditionChange(
          groupId,
          type,
          "period2",
          selectedEma4Period2,
        );
        handleEntryConditionChange(
          groupId,
          type,
          "period3",
          selectedEma4Period3,
        );
        handleEntryConditionChange(
          groupId,
          type,
          "period4",
          selectedEma4Period4,
        );
        handleEntryConditionChange(groupId, type, "ema4Line", selectedEma4Line);
      }
      // ← Pivot HL: entry conditions save
      if (needsPivotParams) {
        handleEntryConditionChange(
          groupId,
          type,
          "pivotLeftBars",
          selectedPivotLeftBars,
        );
        handleEntryConditionChange(
          groupId,
          type,
          "pivotRightBars",
          selectedPivotRightBars,
        );
        handleEntryConditionChange(
          groupId,
          type,
          "pivotType",
          selectedPivotType,
        );
      }
    } else if (type === "longExit" || type === "shortExit") {
      handleExitConditionChange(groupId, type, field, selectedIndicator);
      if (needsPeriod)
        handleExitConditionChange(groupId, type, "period", periodValue);
      if (needsMultiplier)
        handleExitConditionChange(groupId, type, "multiplier", multiplierValue);
      if (needsMacdParams) {
        handleExitConditionChange(groupId, type, "fastPeriod", macdFast);
        handleExitConditionChange(groupId, type, "slowPeriod", macdSlow);
        handleExitConditionChange(groupId, type, "signalPeriod", macdSignal);
      }
      if (needsOverbought && overboughtValue !== undefined) {
        handleExitConditionChange(
          groupId,
          type,
          "overboughtThreshold",
          overboughtValue,
        );
        const comp = exitConditions.conditionGroups.find(
          (g) => g.id === groupId,
        )?.[type]?.comparator;
        const ob = Number(overboughtValue);
        handleExitConditionChange(
          groupId,
          type,
          "threshold",
          comp && ["less", "crosses-below"].includes(comp)
            ? String(100 - ob)
            : String(ob),
        );
      }
      // ← EMA_4: exit conditions save
      if (needsEma4Params) {
        handleExitConditionChange(
          groupId,
          type,
          "period1",
          selectedEma4Period1,
        );
        handleExitConditionChange(
          groupId,
          type,
          "period2",
          selectedEma4Period2,
        );
        handleExitConditionChange(
          groupId,
          type,
          "period3",
          selectedEma4Period3,
        );
        handleExitConditionChange(
          groupId,
          type,
          "period4",
          selectedEma4Period4,
        );
        handleExitConditionChange(groupId, type, "ema4Line", selectedEma4Line);
      }
      // ← Pivot HL: exit conditions save
      if (needsPivotParams) {
        handleExitConditionChange(
          groupId,
          type,
          "pivotLeftBars",
          selectedPivotLeftBars,
        );
        handleExitConditionChange(
          groupId,
          type,
          "pivotRightBars",
          selectedPivotRightBars,
        );
        handleExitConditionChange(
          groupId,
          type,
          "pivotType",
          selectedPivotType,
        );
      }
    }
    closeIndicatorModal();
  };

  // ─── Handle Indicator Selection Change ────────────────────────────────────
  const handleIndicatorSelectionChange = (indicator) => {
    const normalizedIndicator = indicator || "rsi";
    setSelectedIndicator(normalizedIndicator);
    setSelectedPeriod(getDefaultPeriod(normalizedIndicator));
    setSelectedMultiplier(getDefaultMultiplier());
    if (normalizedIndicator === "rsi") setSelectedOverbought("70");
    if (normalizedIndicator === "macd") {
      const def = getDefaultMacd();
      setSelectedMacdFast(def.fast);
      setSelectedMacdSlow(def.slow);
      setSelectedMacdSignal(def.signal);
    }
    // ← EMA_4: defaults reset
    if (normalizedIndicator === "ema_4") {
      setSelectedEma4Period1(20);
      setSelectedEma4Period2(50);
      setSelectedEma4Period3(100);
      setSelectedEma4Period4(200);
      setSelectedEma4Line(1);
    }
    // ← Pivot HL: defaults reset
    if (normalizedIndicator === "pivot_hl") {
      setSelectedPivotLeftBars(5);
      setSelectedPivotRightBars(5);
      setSelectedPivotType("high");
    }
  };

  const openComparatorModal = (
    type,
    groupId,
    conditionId,
    field,
    currentValue,
  ) => {
    setComparatorModal({
      isOpen: true,
      type,
      groupId,
      conditionId,
      field,
      currentValue: currentValue || "",
    });
    setSelectedComparator(currentValue || "");
  };

  const closeComparatorModal = () => {
    setComparatorModal({
      isOpen: false,
      type: null,
      groupId: null,
      conditionId: null,
      field: null,
      currentValue: null,
    });
  };

  const confirmComparatorSelection = () => {
    const { type, groupId, conditionId, field } = comparatorModal;
    const conditionGroups =
      type === "longEntry" || type === "shortEntry"
        ? entryConditions.conditionGroups
        : exitConditions.conditionGroups;
    const condition = conditionGroups.find((g) => g.id === groupId)?.[type];
    const overbought =
      condition?.indicator1 === "rsi" &&
      condition?.overboughtThreshold != null &&
      condition?.overboughtThreshold !== ""
        ? Number(condition.overboughtThreshold)
        : null;
    if (type === "longEntry" || type === "shortEntry") {
      handleEntryConditionChange(groupId, type, field, selectedComparator);
      if (overbought !== null) {
        const threshold = ["less", "crosses-below"].includes(selectedComparator)
          ? String(100 - overbought)
          : String(overbought);
        handleEntryConditionChange(groupId, type, "threshold", threshold);
      }
    } else if (type === "longExit" || type === "shortExit") {
      handleExitConditionChange(groupId, type, field, selectedComparator);
      if (overbought !== null) {
        const threshold = ["less", "crosses-below"].includes(selectedComparator)
          ? String(100 - overbought)
          : String(overbought);
        handleExitConditionChange(groupId, type, "threshold", threshold);
      }
    }
    closeComparatorModal();
  };

  // ─── Format Condition ─────────────────────────────────────────────────────
  const formatCondition = (condition) => {
    if (!condition || !condition.indicator1)
      return { error: "Incomplete condition" };
    const conditionObj = {};
    const indicator1Name = condition.indicator1.toUpperCase();
    if (condition.indicator1 === "rsi") {
      const period = condition.period || getDefaultPeriod(condition.indicator1);
      conditionObj["indicator"] = `${indicator1Name} Period(${period})`;
    } else if (condition.indicator1 === "supertrend") {
      const period = condition.period || getDefaultPeriod(condition.indicator1);
      const multiplier = condition.multiplier || getDefaultMultiplier();
      conditionObj["indicator"] =
        `${indicator1Name} Period(${period}) Multiplier(${multiplier})`;
    } else if (condition.indicator1 === "ema") {
      const period = condition.period || getDefaultPeriod(condition.indicator1);
      conditionObj["indicator"] = `${indicator1Name} Period(${period})`;
    } else if (condition.indicator1 === "sma") {
      const period = condition.period || getDefaultPeriod(condition.indicator1);
      conditionObj["indicator"] = `${indicator1Name} Period(${period})`;
    } else if (condition.indicator1 === "macd") {
      const def = getDefaultMacd();
      const fast = condition.fastPeriod ?? def.fast,
        slow = condition.slowPeriod ?? def.slow,
        signal = condition.signalPeriod ?? def.signal;
      conditionObj["indicator"] =
        `${indicator1Name} Fast(${fast}) Slow(${slow}) Signal(${signal})`;
    } else if (condition.indicator1 === "adx") {
      const period = condition.period || getDefaultPeriod(condition.indicator1);
      conditionObj["indicator"] = `${indicator1Name} Period(${period})`;
    } else if (condition.indicator1 === "ema_4") {
      // ← EMA_4 display
      const p1 = condition.period1 || 20,
        p2 = condition.period2 || 50,
        p3 = condition.period3 || 100,
        p4 = condition.period4 || 200;
      const line = condition.ema4Line || 1;
      const lineMap = { 1: p1, 2: p2, 3: p3, 4: p4 };
      conditionObj["indicator"] =
        `EMA 4-Lines (${p1}/${p2}/${p3}/${p4}) — Line ${line} (EMA${lineMap[line]})`;
    } else if (condition.indicator1 === "pivot_hl") {
      // ← Pivot HL display
      const left = condition.pivotLeftBars || 5;
      const right = condition.pivotRightBars || 5;
      const pType = condition.pivotType || "high";
      conditionObj["indicator"] =
        `Pivot ${pType === "low" ? "Low" : "High"} (Left:${left} Right:${right})`;
    } else if (condition.indicator1 === "cpr_pivot") {
      conditionObj["indicator"] = "CPR - Central Pivot";
    } else if (condition.indicator1 === "cpr_tc") {
      conditionObj["indicator"] = "CPR - TC (Top Central)";
    } else if (condition.indicator1 === "cpr_bc") {
      conditionObj["indicator"] = "CPR - BC (Bottom Central)";
    } else {
      conditionObj["indicator"] = indicator1Name;
    }
    if (condition.comparator && condition.comparator !== "") {
      const comparatorMap = {
        greater: "Greater than",
        less: "Less than",
        equal: "Equal to",
        crosses: "Crosses above",
        "crosses-below": "Crosses below",
      };
      conditionObj["comparator"] =
        comparatorMap[condition.comparator] || condition.comparator;
    }
    if (
      condition.threshold !== null &&
      condition.threshold !== "" &&
      condition.threshold !== undefined
    )
      conditionObj["value"] = condition.threshold;
    return conditionObj;
  };

  const generateConditionScript = (condition, conditionName = "") => {
    if (!condition) return '{\n  "error": "No condition selected"\n}';
    if (!condition.indicator1 || condition.indicator1 === "")
      return '{\n  "error": "Please select an indicator first"\n}';
    const conditionObj = formatCondition(condition);
    const conditionNameKey = conditionName || "Condition";
    return JSON.stringify({ [conditionNameKey]: conditionObj }, null, 2);
  };

  const openScriptModal = (condition, conditionName = "") => {
    if (!condition) {
      alert("Condition data not available!");
      return;
    }
    const script = generateConditionScript(condition, conditionName);
    setScriptModal({
      isOpen: true,
      script: script || "No script generated",
      conditionName: conditionName || "Condition Script",
    });
  };

  const closeScriptModal = () =>
    setScriptModal({ isOpen: false, script: "", conditionName: "" });

  const formatJSONWithColors = (jsonString) => {
    if (!jsonString || typeof jsonString !== "string") return jsonString;
    const escapeHtml = (text) => {
      const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      };
      return text.replace(/[&<>"']/g, (m) => map[m]);
    };
    try {
      const parsed = JSON.parse(jsonString);
      const formatted = JSON.stringify(parsed, null, 2);
      const lines = formatted.split("\n");
      const highlightedLines = lines.map((line) => {
        let highlighted = escapeHtml(line);
        highlighted = highlighted.replace(
          /([{}[\]])/g,
          '<span class="json-punctuation">$1</span>',
        );
        highlighted = highlighted.replace(
          /"([^"]+)":/g,
          (match, key) =>
            `<span class="json-quote-key">"</span><span class="json-key">${key}</span><span class="json-quote-key">"</span><span class="json-colon">:</span>`,
        );
        highlighted = highlighted.replace(
          /(:\s*)"([^"]+)"/g,
          (match, prefix, value) => {
            if (!match.includes("json-key")) {
              if (/^\d{2}:\d{2}$/.test(value))
                return `${prefix}<span class="json-quote-time">"</span><span class="json-time">${value}</span><span class="json-quote-time">"</span>`;
              if (
                [
                  "BUY",
                  "SELL",
                  "CE",
                  "PE",
                  "FUT",
                  "MIS",
                  "NRML",
                  "CNC",
                ].includes(value)
              )
                return `${prefix}<span class="json-quote-action">"</span><span class="json-action">${value}</span><span class="json-quote-action">"</span>`;
              return `${prefix}<span class="json-quote-string">"</span><span class="json-string">${value}</span><span class="json-quote-string">"</span>`;
            }
            return match;
          },
        );
        highlighted = highlighted.replace(
          /(:\s*)(\d+\.?\d*)(\s*[,}\]]?)/g,
          (match, prefix, num, suffix) => {
            if (
              !match.includes("json-string") &&
              !match.includes("json-key") &&
              !match.includes("json-time")
            )
              return `${prefix}<span class="json-number">${num}</span>${suffix}`;
            return match;
          },
        );
        highlighted = highlighted.replace(
          /(:\s*)(true|false|null)(\s*[,}\]]?)/g,
          (match, prefix, bool, suffix) => {
            if (!match.includes("json-string") && !match.includes("json-key"))
              return `${prefix}<span class="json-boolean">${bool}</span>${suffix}`;
            return match;
          },
        );
        if (!highlighted.includes('<span class="json-punctuation">,</span>'))
          highlighted = highlighted.replace(
            /,/g,
            '<span class="json-punctuation">,</span>',
          );
        return highlighted;
      });
      return highlightedLines.join("\n");
    } catch (e) {
      let result = escapeHtml(jsonString);
      result = result.replace(
        /([{}[\]])/g,
        '<span class="json-punctuation">$1</span>',
      );
      result = result.replace(
        /"([^"]+)":/g,
        (match, key) =>
          `<span class="json-quote-key">"</span><span class="json-key">${key}</span><span class="json-quote-key">"</span><span class="json-colon">:</span>`,
      );
      result = result.replace(
        /(:\s*)(\d+\.?\d*)/g,
        (match, prefix, num) =>
          `${prefix}<span class="json-number">${num}</span>`,
      );
      result = result.replace(
        /(:\s*)(true|false|null)/g,
        (match, prefix, bool) =>
          `${prefix}<span class="json-boolean">${bool}</span>`,
      );
      result = result.replace(/,/g, '<span class="json-punctuation">,</span>');
      return result;
    }
  };

  useEffect(() => {
    const lineNumbersEl = scriptLineNumbersRef.current,
      textEl = scriptTextRef.current;
    if (!lineNumbersEl || !textEl || !scriptModal.isOpen) return;
    let isScrolling = false;
    const syncScroll = (source, target) => {
      if (isScrolling) return;
      isScrolling = true;
      target.scrollTop = source.scrollTop;
      requestAnimationFrame(() => {
        isScrolling = false;
      });
    };
    const handleTextScroll = () => syncScroll(textEl, lineNumbersEl);
    const handleLineNumbersScroll = () => syncScroll(lineNumbersEl, textEl);
    textEl.addEventListener("scroll", handleTextScroll, { passive: true });
    lineNumbersEl.addEventListener("scroll", handleLineNumbersScroll, {
      passive: true,
    });
    syncScroll(textEl, lineNumbersEl);
    return () => {
      textEl.removeEventListener("scroll", handleTextScroll);
      lineNumbersEl.removeEventListener("scroll", handleLineNumbersScroll);
    };
  }, [scriptModal.isOpen, scriptModal.script]);

  const copyScriptToClipboard = () => {
    if (!scriptModal.script || scriptModal.script === "") {
      alert("No script to copy!");
      return;
    }
    navigator.clipboard
      .writeText(scriptModal.script)
      .then(() => alert("Script copied to clipboard!"))
      .catch(() => {
        const textArea = document.createElement("textarea");
        textArea.value = scriptModal.script;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand("copy");
          alert("Script copied to clipboard!");
        } catch (err) {
          alert("Failed to copy script.");
        }
        document.body.removeChild(textArea);
      });
  };

  const handleEntryConditionChange = (groupId, conditionType, field, value) => {
    setStrategyState((prev) => ({
      ...prev,
      entryConditions: {
        ...prev.entryConditions,
        conditionGroups: prev.entryConditions.conditionGroups.map((group) =>
          group.id === groupId
            ? {
                ...group,
                [conditionType]: { ...group[conditionType], [field]: value },
              }
            : group,
        ),
      },
    }));
  };

  // ← EMA_4 + Pivot HL fields included in new group defaults
  const addConditionGroup = () => {
    const newGroup = {
      id: Date.now(),
      longEntry: {
        indicator1: "",
        comparator: "",
        period: 14,
        multiplier: 3,
        threshold: "",
        overboughtThreshold: "",
        period1: 20,
        period2: 50,
        period3: 100,
        period4: 200,
        ema4Line: 1,
        // Pivot HL fields
        pivotLeftBars: 5,
        pivotRightBars: 5,
        pivotType: "high",
      },
      shortEntry: {
        indicator1: "",
        comparator: "",
        period: 14,
        multiplier: 3,
        threshold: "",
        overboughtThreshold: "",
        period1: 20,
        period2: 50,
        period3: 100,
        period4: 200,
        ema4Line: 1,
        // Pivot HL fields
        pivotLeftBars: 5,
        pivotRightBars: 5,
        pivotType: "high",
      },
    };
    setStrategyState((prev) => ({
      ...prev,
      entryConditions: {
        ...prev.entryConditions,
        conditionGroups: [...prev.entryConditions.conditionGroups, newGroup],
        groupOperators: [...prev.entryConditions.groupOperators, "AND"],
      },
    }));
  };

  const removeConditionGroup = (groupId) => {
    setStrategyState((prev) => {
      const entryConditions = prev.entryConditions;
      const groupIndex = entryConditions.conditionGroups.findIndex(
        (g) => g.id === groupId,
      );
      const newGroups = entryConditions.conditionGroups.filter(
        (g) => g.id !== groupId,
      );
      const operatorIndexToRemove = groupIndex === 0 ? 0 : groupIndex - 1;
      const newOperators = (entryConditions.groupOperators || []).filter(
        (_, index) => index !== operatorIndexToRemove,
      );
      return {
        ...prev,
        entryConditions: {
          ...entryConditions,
          conditionGroups: newGroups,
          groupOperators: newOperators,
        },
      };
    });
  };

  const handleGroupOperatorChange = (operatorIndex, value) => {
    setStrategyState((prev) => ({
      ...prev,
      entryConditions: {
        ...prev.entryConditions,
        groupOperators: prev.entryConditions.groupOperators.map((op, index) =>
          index === operatorIndex ? value : op,
        ),
      },
    }));
  };

  const handleExitConditionToggle = (checked) => {
    setStrategyState((prev) => ({
      ...prev,
      exitConditions: { ...prev.exitConditions, enabled: checked },
    }));
  };

  const handleExitConditionChange = (groupId, conditionType, field, value) => {
    setStrategyState((prev) => ({
      ...prev,
      exitConditions: {
        ...prev.exitConditions,
        conditionGroups: prev.exitConditions.conditionGroups.map((group) =>
          group.id === groupId
            ? {
                ...group,
                [conditionType]: { ...group[conditionType], [field]: value },
              }
            : group,
        ),
      },
    }));
  };

  // ← EMA_4 + Pivot HL fields included in new exit group defaults
  const addExitConditionGroup = () => {
    const newGroup = {
      id: Date.now(),
      longExit: {
        indicator1: "",
        comparator: "",
        period: 14,
        multiplier: 3,
        threshold: "",
        overboughtThreshold: "",
        period1: 20,
        period2: 50,
        period3: 100,
        period4: 200,
        ema4Line: 1,
        // Pivot HL fields
        pivotLeftBars: 5,
        pivotRightBars: 5,
        pivotType: "high",
      },
      shortExit: {
        indicator1: "",
        comparator: "",
        period: 14,
        multiplier: 3,
        threshold: "",
        overboughtThreshold: "",
        period1: 20,
        period2: 50,
        period3: 100,
        period4: 200,
        ema4Line: 1,
        // Pivot HL fields
        pivotLeftBars: 5,
        pivotRightBars: 5,
        pivotType: "high",
      },
    };
    setStrategyState((prev) => ({
      ...prev,
      exitConditions: {
        ...prev.exitConditions,
        conditionGroups: [...prev.exitConditions.conditionGroups, newGroup],
        groupOperators: [...prev.exitConditions.groupOperators, "AND"],
      },
    }));
  };

  const removeExitConditionGroup = (groupId) => {
    setStrategyState((prev) => {
      const exitConditions = prev.exitConditions;
      const groupIndex = exitConditions.conditionGroups.findIndex(
        (g) => g.id === groupId,
      );
      const newGroups = exitConditions.conditionGroups.filter(
        (g) => g.id !== groupId,
      );
      const newOperators = exitConditions.groupOperators.filter(
        (_, index) => index !== groupIndex - 1,
      );
      return {
        ...prev,
        exitConditions: {
          ...exitConditions,
          conditionGroups: newGroups,
          groupOperators: newOperators,
        },
      };
    });
  };

  const handleExitGroupOperatorChange = (operatorIndex, value) => {
    setStrategyState((prev) => ({
      ...prev,
      exitConditions: {
        ...prev.exitConditions,
        groupOperators: prev.exitConditions.groupOperators.map((op, index) =>
          index === operatorIndex ? value : op,
        ),
      },
    }));
  };

  const handleOrderLegStrikeSelect = (legId, optionType) => {
    setStrategyState((prev) => ({
      ...prev,
      qaCustomCustomerOptionsAlgoChild:
        prev?.qaCustomCustomerOptionsAlgoChild?.map((leg) => {
          if (leg.id === legId) {
            if (optionType === "FUT")
              return {
                ...leg,
                optionType,
                orderLegType: optionType,
                OptionsType: optionType,
                identifier: "",
                strikePrice: 0,
                ltp: "0.00",
              };
            const strikeList =
              optionType === "CE" ? strikePriceCEList : strikePricePEList;
            const atmStrike = strikeList.find((s) => s.product === "ATM");
            if (atmStrike) {
              return {
                ...leg,
                optionType,
                orderLegType: optionType,
                OptionsType: getOptionsType(atmStrike.strikePrice, optionType),
                identifier: atmStrike.identifier,
                strikePrice: atmStrike.strikePrice,
                ltp:
                  atmStrike.lastTradePrice &&
                  typeof atmStrike.lastTradePrice === "number"
                    ? atmStrike.lastTradePrice.toFixed(2)
                    : "0.00",
              };
            }
          }
          return leg;
        }),
    }));
  };

  if (
    !activeSubscriptionFeatures ||
    activeSubscriptionFeatures.createStrategy !== true
  ) {
    return (
      <section className="content create_strategy_page">
        {subscriptionUpgradeOpen && (
          <SubscriptionDialog
            open={subscriptionUpgradeOpen}
            handleClose={() => {
              setSubscriptionUpgradeOpen(false);
              navigate("/plans");
            }}
            message={subscriptionUpgradeMessage}
          />
        )}
      </section>
    );
  }

  // ─── Helper for indicator display ────────────────────────────────────────
  const getIndicatorLabel = (indicator) => {
    const map = {
      rsi: "RSI",
      ema: "EMA",
      sma: "SMA",
      macd: "MACD",
      adx: "ADX",
      supertrend: "Supertrend",
      ema_4: "EMA 4-Lines",
      pivot_hl: "Pivot HL",
      cpr_pivot: "CPR Pivot",
      cpr_tc: "CPR - TC",
      cpr_bc: "CPR - BC",
    };
    return map[indicator] || (indicator ? indicator.toUpperCase() : "Select Indicator");
  };

  // ─── Helper for comparator display ───────────────────────────────────────
  const getComparatorLabel = (comp) => {
    if (!comp) return "Select Comparator";
    const map = {
      greater: "Greater than",
      less: "Less than",
      equal: "Equal to",
      crosses: "Crosses above",
      "crosses-below": "Crosses below",
    };
    return map[comp] || comp;
  };

  return (
    <section className="content create_strategy_page">
      <div className="card-box card-height">
        <div className="page-header">
          <div className="header-left">
            <div className="header-icon">
              <div className="icon">📊</div>
            </div>
            <div className="header-text">
              <h1 className="page-title">Create Strategy</h1>
            </div>
          </div>
        </div>

        {showToast &&
          (validationErrors.length > 0 || backendErrors.length > 0) && (
            <div className="validation-toast-popup">
              <div className="toast-content">
                <div className="toast-header">
                  <span className="toast-icon">⚠️</span>
                  <h3 className="toast-title">
                    {validationErrors.length > 0
                      ? "Validation Errors"
                      : "Backend Errors"}
                  </h3>
                  <button
                    className="toast-close-btn"
                    onClick={clearErrors}
                    title="Close"
                  >
                    ×
                  </button>
                </div>
                <div className="toast-body">
                  {validationErrors.map((error, index) => (
                    <div
                      key={`validation-${index}`}
                      className="toast-error-item"
                    >
                      <span className="toast-error-message">
                        {error.message}
                      </span>
                    </div>
                  ))}
                  {backendErrors.map((error, index) => (
                    <div
                      key={`backend-${index}`}
                      className="toast-error-item toast-backend-error"
                    >
                      <span className="toast-error-message">
                        {error.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        <div className="main-content-layout">
          <div className="strategy-config">
            {/* Strategy Type */}
            <div className="strategy-type-section">
              <h2 className="section-heading">Strategy Type</h2>
              <div className="strategy-type-toggle">
                <button
                  className={`toggle-option ${strategyState.strategyType === "time-based" ? "active" : ""}`}
                  onClick={() =>
                    handleChange({ name: "strategyType", value: "time-based" })
                  }
                >
                  Time Based
                </button>
                <button
                  className={`toggle-option ${strategyState.strategyType === "indicator-based" ? "active" : ""}`}
                  onClick={() =>
                    handleChange({
                      name: "strategyType",
                      value: "indicator-based",
                    })
                  }
                >
                  Indicator Based
                </button>
              </div>
            </div>

            {/* Select Instruments */}
            <div
              className={`select-instruments-section ${getFieldError("identifierName") ? "error" : ""}`}
            >
              <div className="section-header-row">
                <h2 className="section-heading">
                  Add instruments from NSE, BSE or MCX.
                </h2>
                {!IdentifierName && (
                  <div
                    className="add-instruments-card"
                    onClick={() => {
                      handleAddInstruments();
                      clearErrors();
                    }}
                    title="Add Instruments"
                  >
                    <div className="add-content">
                      <div className="add-icon">📊</div>
                    </div>
                  </div>
                )}
              </div>
              {getFieldError("identifierName") && (
                <span className="section-error-message">
                  {getFieldError("identifierName")}
                </span>
              )}
              {IdentifierName ? (
                <div className="selected-instrument-card">
                  <div className="instrument-info">
                    <div className="symbol-header">
                      <div className="symbol-name">{IdentifierName}</div>
                      <div className="symbol-category">
                        {strategyState.instrumentCategory}
                      </div>
                    </div>
                    {!(
                      strategyState.instrumentCategory
                        ?.toLowerCase()
                        .includes("nse") &&
                      strategyState.instrumentCategory
                        ?.toLowerCase()
                        .includes("options")
                    ) && (
                      <>
                        <div className="symbol-lot">Lot: {LotSize || "75"}</div>
                        {expiryList && expiryList.length > 0 && (
                          <div className="symbol-expiry">
                            <span>Expiry:</span>
                            <div className="expiry-dates-list">
                              {expiryList.slice(0, 3).map((expiry, index) => (
                                <span key={index} className="expiry-date-item">
                                  {expiry}
                                </span>
                              ))}
                              {expiryList.length > 3 && (
                                <span className="expiry-more">
                                  +{expiryList.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="action-buttons">
                    <button
                      className="change-symbol-btn"
                      onClick={handleAddInstruments}
                      title="Change Symbol"
                    >
                      ✏
                    </button>
                    <button
                      className="remove-symbol-btn"
                      onClick={() => {
                        setStrategyState((prev) => ({
                          ...prev,
                          ProductName: "",
                          IdentifierName: "",
                          IdentifierID: 0,
                          qaCustomCustomerOptionsAlgoChild: [],
                        }));
                        clearErrors();
                      }}
                      title="Remove Symbol"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="order-config-section">
              {/* Order Type */}
              <div className="order-type-section">
                <label className="field-label">Order Type</label>
                <div className="order-type-options">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="ProductType"
                      value="MIS"
                      checked={strategyState.ProductType === "MIS"}
                      onChange={handleChange}
                    />
                    <span className="radio-label">MIS</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="ProductType"
                      value="CNC"
                      checked={strategyState.ProductType === "CNC"}
                      onChange={handleChange}
                    />
                    <span className="radio-label">CNC</span>
                  </label>
                </div>
              </div>

              {/* Broker */}
              <div className="broker-selection-section">
                <label className="field-label">Select Broker</label>
                <select
                  className="form-control text-input"
                  name="CustomerBrokerID"
                  value={strategyState?.CustomerBrokerID || ""}
                  onChange={handleChange}
                >
                  <option value="">Select Broker</option>
                  {brokerConfigList.map((broker) => (
                    <option
                      key={broker.brokerconfigID}
                      value={broker.brokerconfigID}
                    >
                      {broker.brokerName || `Broker ${broker.brokerconfigID}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Candle Type */}
              <div className="candle-type-section">
                <label className="field-label">Candle Type (Optional)</label>
                <div className="candle-type-options">
                  <button
                    type="button"
                    className={`radio-option ${strategyState.candleType === "green" ? "active" : ""}`}
                    onClick={() =>
                      handleChange({
                        name: "candleType",
                        value:
                          strategyState.candleType === "green" ? null : "green",
                      })
                    }
                  >
                    <span className="radio-label">Green Candle</span>
                  </button>
                  <button
                    type="button"
                    className={`radio-option ${strategyState.candleType === "red" ? "active" : ""}`}
                    onClick={() =>
                      handleChange({
                        name: "candleType",
                        value:
                          strategyState.candleType === "red" ? null : "red",
                      })
                    }
                  >
                    <span className="radio-label">Red Candle</span>
                  </button>
                </div>
              </div>

              {/* Time Inputs */}
              <div className="time-inputs-section">
                <div className="time-input-group">
                  <label className="field-label">Start time</label>
                  <div className="time-input-wrapper">
                    <input
                      type="time"
                      name="StartTime"
                      value={strategyState?.StartTime}
                      onChange={handleChange}
                      className="time-input"
                    />
                  </div>
                </div>
                <div className="time-input-group">
                  <label className="field-label">Square off</label>
                  <div className="time-input-wrapper">
                    <input
                      type="time"
                      name="SquareoffTime"
                      value={strategyState?.SquareoffTime}
                      onChange={handleChange}
                      className="time-input"
                    />
                  </div>
                </div>
                <div className="time-input-group">
                  <label className="field-label">No Trade After</label>
                  <div className="time-input-wrapper">
                    <input
                      type="time"
                      name="EndTime"
                      value={strategyState?.EndTime}
                      onChange={(e) =>
                        handleRiskManagementChange("EndTime", e.target.value)
                      }
                      className="time-input"
                    />
                  </div>
                </div>
              </div>

              {/* Days */}
              <div className="day-selection-section">
                <label className="field-label">Select Days</label>
                <div className="day-buttons">
                  {["MON", "TUE", "WED", "THU", "FRI"].map((day) => (
                    <button
                      key={day}
                      className={`day-button ${strategyState?.selectedDays?.includes(day) ? "selected" : ""}`}
                      onClick={() => handleDays(day)}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Legs Section */}
              <div className="order-legs-section combined-strategy-section">
                <h2 className="section-heading">Order Legs</h2>
                <div className="chart-config-content">
                  <div className="config-row">
                    <div className="config-group chart-type-group">
                      <label className="config-label">Chart type</label>
                      <div className="segmented-control">
                        <label className="segment-option">
                          <input
                            type="radio"
                            name="chartType"
                            value="candle"
                            checked={strategyState.chartType === "candle"}
                            onChange={handleChange}
                          />
                          <span className="segment-label">
                            <span className="chart-icon">📊</span>Candle
                          </span>
                        </label>
                      </div>
                    </div>
                    <div className="config-group interval-group">
                      <label className="config-label">Interval</label>
                      <select
                        className="interval-select"
                        value={strategyState.interval || "1-min"}
                        onChange={handleChange}
                        name="interval"
                      >
                        <option value="1-min">1 Min</option>
                        <option value="3-min">3 Min</option>
                        <option value="5-min">5 Min</option>
                        <option value="10-min">10 Min</option>
                        <option value="15-min">15 Min</option>
                        <option value="30-min">30 Min</option>
                        <option value="1-hour">1 H</option>
                      </select>
                    </div>
                  </div>
                  <div className="config-row">
                    <div className="config-group transaction-type-group">
                      <label className="config-label">Transaction type</label>
                      <div className="segmented-control">
                        <label className="segment-option">
                          <input
                            type="radio"
                            name="transactionType"
                            value="both-side"
                            checked={
                              strategyState.transactionType === "both-side"
                            }
                            onChange={handleChange}
                          />
                          <span className="segment-label">Both Side</span>
                        </label>
                        <label className="segment-option">
                          <input
                            type="radio"
                            name="transactionType"
                            value="only-long"
                            checked={
                              strategyState.transactionType === "only-long"
                            }
                            onChange={handleChange}
                          />
                          <span className="segment-label">Only Long</span>
                        </label>
                        <label className="segment-option">
                          <input
                            type="radio"
                            name="transactionType"
                            value="only-short"
                            checked={
                              strategyState.transactionType === "only-short"
                            }
                            onChange={handleChange}
                          />
                          <span className="segment-label">Only Short</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="section-separator"></div>

                {/* Strategy Presets */}
                <div className="strategy-selection-inline">
                  <div className="box-card-sec-replacement">
                    <div className="flex-data-div">
                      <div className="btn-tab-data">
                        <button
                          type="button"
                          className={`btn-bullish ${marketBias === "bullish" ? "active" : ""}`}
                          onClick={() => handleMarketBias("bullish")}
                        >
                          Bullish
                        </button>
                        {strategyType !== "indicator-based" && (
                          <button
                            type="button"
                            className={`btn-neutral ${marketBias === "neutral" ? "active" : ""}`}
                            onClick={() => handleMarketBias("neutral")}
                          >
                            Neutral
                          </button>
                        )}
                        <button
                          type="button"
                          className={`btn-bearish ${marketBias === "bearish" ? "active" : ""}`}
                          onClick={() => handleMarketBias("bearish")}
                        >
                          Bearish
                        </button>
                      </div>
                      <div className="btn-data-list">
                        {marketBias === "bullish" && (
                          <div className="all-bullish-btn fade-in">
                            <div className="btn-bullish-main">
                              <button
                                type="button"
                                onClick={() => setLegsFn("naked_ce")}
                                className={
                                  selectedStrategy == "naked_ce" ? "active" : ""
                                }
                              >
                                <IconRegistry name="trending-up" size={16} />
                                <p>Naked CE</p>
                              </button>
                            </div>
                            <div className="btn-bullish-main">
                              <button
                                type="button"
                                onClick={() => setLegsFn("bC_spread")}
                                className={
                                  selectedStrategy == "bC_spread"
                                    ? "active"
                                    : ""
                                }
                              >
                                <IconRegistry name="bar-chart" size={16} />
                                <p>Bull Call Spread</p>
                              </button>
                            </div>
                            <div className="btn-bullish-main">
                              <button
                                type="button"
                                onClick={() => setLegsFn("long_straddle")}
                                className={
                                  selectedStrategy == "long_straddle"
                                    ? "active"
                                    : ""
                                }
                              >
                                <IconRegistry name="swap-horiz" size={16} />
                                <p>Long Straddle</p>
                              </button>
                            </div>
                          </div>
                        )}
                        {marketBias === "neutral" &&
                          strategyType !== "indicator-based" && (
                            <div className="all-bullish-btn all-neutral-btn fade-in">
                              <div className="btn-bullish-main">
                                <button
                                  type="button"
                                  onClick={() => setLegsFn("iron_butter")}
                                  className={
                                    selectedStrategy == "iron_butter"
                                      ? "active"
                                      : ""
                                  }
                                >
                                  <IconRegistry name="timeline" size={16} />
                                  <p>Iron Butterfly</p>
                                </button>
                              </div>
                              <div className="btn-bullish-main">
                                <button
                                  type="button"
                                  onClick={() => setLegsFn("short_iron")}
                                  className={
                                    selectedStrategy == "short_iron"
                                      ? "active"
                                      : ""
                                  }
                                >
                                  <IconRegistry
                                    name="trending-down"
                                    size={16}
                                  />
                                  <p>Short Iron Condor</p>
                                </button>
                              </div>
                              <div className="btn-bullish-main">
                                <button
                                  type="button"
                                  onClick={() => setLegsFn("short_straddle")}
                                  className={
                                    selectedStrategy == "short_straddle"
                                      ? "active"
                                      : ""
                                  }
                                >
                                  <IconRegistry
                                    name="trending-down"
                                    size={16}
                                  />
                                  <p>Short Straddle</p>
                                </button>
                              </div>
                            </div>
                          )}
                        {marketBias === "bearish" && (
                          <div className="all-bullish-btn all-bearish-btn fade-in">
                            <div className="btn-bullish-main">
                              <button
                                type="button"
                                onClick={() => setLegsFn("naked_pe")}
                                className={
                                  selectedStrategy == "naked_pe" ? "active" : ""
                                }
                              >
                                <IconRegistry name="trending-down" size={16} />
                                <p>Naked PE</p>
                              </button>
                            </div>
                            <div className="btn-bullish-main">
                              <button
                                type="button"
                                onClick={() => setLegsFn("bear_put")}
                                className={
                                  selectedStrategy == "bear_put" ? "active" : ""
                                }
                              >
                                <IconRegistry name="bar-chart" size={16} />
                                <p>Bear Put Spread</p>
                              </button>
                            </div>
                            <div className="btn-bullish-main">
                              <button
                                type="button"
                                onClick={() => setLegsFn("short_strangle")}
                                className={
                                  selectedStrategy == "short_strangle"
                                    ? "active"
                                    : ""
                                }
                              >
                                <IconRegistry name="swap-horiz" size={16} />
                                <p>Short Strangle</p>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Legs Cards */}
                {strategyState?.qaCustomCustomerOptionsAlgoChild?.map((leg) => (
                  <div key={leg.id} className="order-leg-card">
                    <div className="leg-content">
                      <div className="action-section">
                        <button
                          className={`action-button ${leg.action === "SELL" ? "sell active" : "buy"}`}
                          onClick={() =>
                            handleOrderLegChange(
                              leg.id,
                              "action",
                              leg.action === "SELL" ? "BUY" : "SELL",
                            )
                          }
                          title={leg.action}
                        >
                          {leg.action === "BUY" ? "B" : "S"}
                        </button>
                      </div>
                      <div className="fields-grid">
                        <div className="input-group number-input-wrapper large-input">
                          <label className="input-label">QTY</label>
                          <input
                            type="number"
                            value={leg.qty}
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              const maxQuantity = getMaxQuantity();
                              if (inputValue === "") {
                                handleOrderLegChange(
                                  leg.id,
                                  "qty",
                                  inputValue,
                                  false,
                                );
                                return;
                              }
                              if (
                                maxQuantity !== null &&
                                inputValue !== "" &&
                                !isNaN(inputValue)
                              ) {
                                const numValue = parseFloat(inputValue);
                                if (numValue > maxQuantity) {
                                  const rawMaxLot = getMaxLot(),
                                    lotSizeValue = parseInt(LotSize) || 1;
                                  const effectiveLots =
                                    lotSizeValue > 0
                                      ? Math.floor(maxQuantity / lotSizeValue)
                                      : null;
                                  const displayLots =
                                    effectiveLots !== null &&
                                    !Number.isNaN(effectiveLots) &&
                                    effectiveLots > 0
                                      ? effectiveLots
                                      : rawMaxLot;
                                  showMaxLimitToast(
                                    `⚠️ Maximum limit hit! Maximum lot limit is ${displayLots} lots (${maxQuantity} qty) for ${ProductName || IdentifierName || "this symbol"}. You cannot exceed this limit.`,
                                    4000,
                                  );
                                  handleOrderLegChange(
                                    leg.id,
                                    "qty",
                                    maxQuantity.toString(),
                                    false,
                                  );
                                  return;
                                }
                              }
                              handleOrderLegChange(
                                leg.id,
                                "qty",
                                inputValue,
                                false,
                              );
                            }}
                            onBlur={(e) =>
                              handleOrderLegChange(
                                leg.id,
                                "qty",
                                e.target.value,
                                true,
                              )
                            }
                            className="leg-input"
                            placeholder="-"
                            min={LotSize || 1}
                            max={getMaxQuantity() || undefined}
                          />
                          <div className="number-controls">
                            <button
                              type="button"
                              className="number-btn increment"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const lotSizeValue = parseInt(LotSize) || 1,
                                  currentQty = parseInt(leg.qty) || 0,
                                  newQty = currentQty + lotSizeValue;
                                const maxQuantity = getMaxQuantity();
                                if (maxQuantity !== null) {
                                  if (currentQty >= maxQuantity) {
                                    showMaxLimitToast(
                                      `⚠️ Maximum limit reached for ${ProductName || IdentifierName || "this symbol"}.`,
                                      4000,
                                    );
                                    return;
                                  }
                                  if (newQty > maxQuantity) {
                                    handleOrderLegChange(
                                      leg.id,
                                      "qty",
                                      maxQuantity.toString(),
                                    );
                                    return;
                                  }
                                }
                                handleOrderLegChange(
                                  leg.id,
                                  "qty",
                                  newQty.toString(),
                                );
                              }}
                              disabled={(() => {
                                const maxQuantity = getMaxQuantity();
                                if (maxQuantity === null) return false;
                                return (parseInt(leg.qty) || 0) >= maxQuantity;
                              })()}
                            />
                            <button
                              type="button"
                              className="number-btn decrement"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const lotSizeValue = parseInt(LotSize) || 1,
                                  currentQty =
                                    parseInt(leg.qty) || lotSizeValue;
                                handleOrderLegChange(
                                  leg.id,
                                  "qty",
                                  Math.max(
                                    lotSizeValue,
                                    currentQty - lotSizeValue,
                                  ).toString(),
                                );
                              }}
                              disabled={
                                !leg.qty ||
                                parseInt(leg.qty) <= (parseInt(LotSize) || 1)
                              }
                            />
                          </div>
                        </div>
                        <div className="input-group">
                          <label className="input-label">TYPE</label>
                          <select
                            className="form-control text-input"
                            value={leg.optionType}
                            onChange={(e) =>
                              handleOrderLegStrikeSelect(leg.id, e.target.value)
                            }
                          >
                            <option value="">Select Type</option>
                            <option value="CE">CE</option>
                            <option value="PE">PE</option>
                          </select>
                        </div>
                        <div className="input-group">
                          <label className="input-label">EXPIRY</label>
                          <select
                            className="form-control text-input"
                            value={leg.expiry}
                            onChange={(e) =>
                              handleOrderLegChange(
                                leg.id,
                                "expiry",
                                e.target.value,
                              )
                            }
                          >
                            <option value="">Select Expiry</option>
                            {expiryList.map((expiry, key) => (
                              <option key={key} value={expiry}>
                                {expiry}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="input-group">
                          <label className="input-label">STRIKE PRICE</label>
                          <select
                            className="form-control text-input"
                            value={(() => {
                              const strikeList =
                                leg.optionType === "CE"
                                  ? strikePriceCEList
                                  : leg.optionType === "PE"
                                    ? strikePricePEList
                                    : [];
                              const optionsWithCode =
                                processedStrikePrices(strikeList);
                              const match = optionsWithCode.find(
                                (opt) =>
                                  opt.strikePrice === leg.strikePrice ||
                                  opt.strikePrice?.toString() ===
                                    (leg.strikePrice || "").toString(),
                              );
                              return match?.code?.toString() || "";
                            })()}
                            onChange={(e) => {
                              const selectedCode = e.target.value;
                              if (!selectedCode) {
                                setStrategyState((prev) => ({
                                  ...prev,
                                  qaCustomCustomerOptionsAlgoChild:
                                    prev.qaCustomCustomerOptionsAlgoChild.map(
                                      (l) =>
                                        l.id === leg.id
                                          ? {
                                              ...l,
                                              strikePrice: "",
                                              Identifier: "",
                                              ltp: "0.00",
                                              OptionsType: "",
                                              OptionsTypeLabel: "",
                                            }
                                          : l,
                                    ),
                                }));
                                return;
                              }
                              const strikeList =
                                leg.optionType === "CE"
                                  ? strikePriceCEList
                                  : leg.optionType === "PE"
                                    ? strikePricePEList
                                    : [];
                              const optionsWithCode =
                                processedStrikePrices(strikeList);
                              const selectedOption = optionsWithCode.find(
                                (opt) =>
                                  String(opt.code) ===
                                  String(selectedCode || ""),
                              );
                              const selectedStrike =
                                selectedOption?.strikePrice?.toString() || "";
                              if (!selectedOption) {
                                setStrategyState((prev) => ({
                                  ...prev,
                                  qaCustomCustomerOptionsAlgoChild:
                                    prev.qaCustomCustomerOptionsAlgoChild.map(
                                      (l) =>
                                        l.id === leg.id
                                          ? {
                                              ...l,
                                              strikePrice: selectedStrike,
                                              identifier: "",
                                              ltp: l.ltp || "0.00",
                                              OptionsType: getOptionsType(
                                                selectedStrike,
                                                l.optionType,
                                              ),
                                              OptionsTypeLabel: "",
                                            }
                                          : l,
                                    ),
                                }));
                                return;
                              }
                              const isCE = leg.optionType === "CE";
                              const liveSocketData = isCE
                                ? symbolValueCE[selectedOption.identifier]
                                : symbolValuePE[selectedOption.identifier];
                              let initialLtp = "0.00";
                              if (
                                liveSocketData?.lastTradePrice !== undefined &&
                                liveSocketData?.lastTradePrice !== null
                              ) {
                                const livePrice =
                                  typeof liveSocketData.lastTradePrice ===
                                  "number"
                                    ? liveSocketData.lastTradePrice
                                    : parseFloat(liveSocketData.lastTradePrice);
                                if (livePrice > 0)
                                  initialLtp = livePrice.toFixed(2);
                              }
                              if (
                                initialLtp === "0.00" &&
                                selectedOption.lastTradePrice
                              ) {
                                const apiPrice =
                                  typeof selectedOption.lastTradePrice ===
                                  "number"
                                    ? selectedOption.lastTradePrice
                                    : parseFloat(selectedOption.lastTradePrice);
                                if (apiPrice > 0)
                                  initialLtp = apiPrice.toFixed(2);
                              }
                              setStrategyState((prev) => ({
                                ...prev,
                                qaCustomCustomerOptionsAlgoChild:
                                  prev.qaCustomCustomerOptionsAlgoChild.map(
                                    (l) =>
                                      l.id === leg.id
                                        ? {
                                            ...l,
                                            strikePrice: selectedStrike,
                                            Identifier: selectedOption.label,
                                            ltp: initialLtp,
                                            entryPrice:
                                              l.entryPrice || initialLtp,
                                            OptionsType: selectedOption.code,
                                            OptionsTypeLabel:
                                              selectedOption.label,
                                          }
                                        : l,
                                  ),
                              }));
                            }}
                            disabled={leg.optionType === "FUT"}
                          >
                            <option value="">Select Strike</option>
                            {processedStrikePrices(
                              leg.optionType === "CE"
                                ? strikePriceCEList
                                : leg.optionType === "PE"
                                  ? strikePricePEList
                                  : [],
                            )?.map((option, key) => (
                              <option key={key} value={option.code}>
                                {option.strikePrice} ({option.label})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="input-group">
                          <label className="input-label">LTP</label>
                          <div className="realtime-ltp-display">
                            ₹{leg.ltp || "0.00"}
                          </div>
                        </div>
                      </div>
                      <div className="action-icons">
                        <button
                          className="action-icon delete"
                          onClick={() => deleteOrderLeg(leg.id)}
                          title="Delete Leg"
                        >
                          🗑️
                        </button>
                        <button
                          className="action-icon duplicate"
                          onClick={() => duplicateOrderLeg(leg.id)}
                          title="Duplicate Leg"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="add-leg-container">
                  <button className="add-leg-button" onClick={addOrderLeg}>
                    <span className="plus-icon">+</span>ADD LEG
                  </button>
                </div>
              </div>

              {/* Entry Conditions */}
              {strategyType === "indicator-based" && (
                <div className="entry-conditions-section">
                  <div className="entry-conditions-header">
                    <h2 className="section-heading">Entry conditions</h2>
                  </div>
                  <div className="entry-conditions-content">
                    {strategyState.transactionType === "both-side" && (
                      <>
                        {entryConditions.conditionGroups.map(
                          (group, groupIndex) => (
                            <div
                              key={group.id}
                              className="condition-group-container"
                            >
                              {groupIndex > 0 && (
                                <div className="group-operator-selector">
                                  <div className="operator-toggle">
                                    <button
                                      className={`operator-btn ${entryConditions.groupOperators[groupIndex - 1] === "AND" ? "active" : ""}`}
                                      onClick={() =>
                                        handleGroupOperatorChange(
                                          groupIndex - 1,
                                          "AND",
                                        )
                                      }
                                    >
                                      AND
                                    </button>
                                    <button
                                      className={`operator-btn ${entryConditions.groupOperators[groupIndex - 1] === "OR" ? "active" : ""}`}
                                      onClick={() =>
                                        handleGroupOperatorChange(
                                          groupIndex - 1,
                                          "OR",
                                        )
                                      }
                                    >
                                      OR
                                    </button>
                                  </div>
                                </div>
                              )}
                              <div className="condition-group-box">
                                <div className="condition-group-header">
                                  <span className="condition-group-label">
                                    Group {groupIndex + 1}
                                  </span>
                                  {entryConditions.conditionGroups.length > 1 &&
                                    groupIndex > 0 && (
                                      <button
                                        type="button"
                                        className="delete-condition-btn delete-condition-btn-top"
                                        onClick={() =>
                                          removeConditionGroup(group.id)
                                        }
                                        title="Delete Condition Group"
                                      >
                                        🗑️
                                      </button>
                                    )}
                                </div>
                                <div className="condition-group">
                                  <div className="entry-condition-group">
                                    <h3 className="condition-title long">
                                      Long Entry condition
                                    </h3>
                                    <div className="condition-controls">
                                      <div className="dropdown-group">
                                        <button
                                          type="button"
                                          className="select-button"
                                          onClick={() =>
                                            openIndicatorModal(
                                              "longEntry",
                                              group.id,
                                              null,
                                              "indicator1",
                                              group.longEntry.indicator1 ||
                                                "rsi",
                                            )
                                          }
                                          title="Select Indicator"
                                        >
                                          {group.longEntry.indicator1
                                            ? getIndicatorLabel(group.longEntry.indicator1)
                                            : "Select Indicator"}
                                        </button>
                                      </div>
                                      <div className="dropdown-group">
                                        <button
                                          type="button"
                                          className="select-button"
                                          onClick={() =>
                                            openComparatorModal(
                                              "longEntry",
                                              group.id,
                                              null,
                                              "comparator",
                                              group.longEntry.comparator,
                                            )
                                          }
                                          title="Select Comparator"
                                        >
                                          {getComparatorLabel(
                                            group.longEntry.comparator,
                                          )}
                                        </button>
                                      </div>
                                      <button
                                        className="copy-script-btn"
                                        onClick={() =>
                                          openScriptModal(
                                            group.longEntry,
                                            "Long Entry condition",
                                          )
                                        }
                                        title="Copy Script"
                                      >
                                        📋
                                      </button>
                                    </div>
                                  </div>
                                  <div className="entry-condition-group">
                                    <h3 className="condition-title short">
                                      Short Entry condition
                                    </h3>
                                    <div className="condition-controls">
                                      <div className="dropdown-group">
                                        <button
                                          type="button"
                                          className="select-button"
                                          onClick={() =>
                                            openIndicatorModal(
                                              "shortEntry",
                                              group.id,
                                              null,
                                              "indicator1",
                                              group.shortEntry.indicator1 ||
                                                "rsi",
                                            )
                                          }
                                          title="Select Indicator"
                                        >
                                          {group.shortEntry.indicator1
                                            ? getIndicatorLabel(group.shortEntry.indicator1)
                                            : "Select Indicator"}
                                        </button>
                                      </div>
                                      <div className="dropdown-group">
                                        <button
                                          type="button"
                                          className="select-button"
                                          onClick={() =>
                                            openComparatorModal(
                                              "shortEntry",
                                              group.id,
                                              null,
                                              "comparator",
                                              group.shortEntry.comparator,
                                            )
                                          }
                                        >
                                          {getComparatorLabel(
                                            group.shortEntry.comparator,
                                          )}
                                        </button>
                                      </div>
                                      <button
                                        className="copy-script-btn"
                                        onClick={() =>
                                          openScriptModal(
                                            group.shortEntry,
                                            "Short Entry condition",
                                          )
                                        }
                                        title="Copy Script"
                                      >
                                        📋
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                        <button
                          className="add-condition-group-btn"
                          onClick={addConditionGroup}
                        >
                          + Add Condition Group
                        </button>
                      </>
                    )}
                    {strategyState.transactionType === "only-long" && (
                      <>
                        {entryConditions.conditionGroups.map(
                          (group, groupIndex) => (
                            <div
                              key={group.id}
                              className="condition-row condition-group-box-wrap"
                            >
                              {groupIndex > 0 && (
                                <div className="condition-operator-selector">
                                  <div className="operator-toggle">
                                    <button
                                      className={`operator-btn ${entryConditions.groupOperators[groupIndex - 1] === "AND" ? "active" : ""}`}
                                      onClick={() =>
                                        handleGroupOperatorChange(
                                          groupIndex - 1,
                                          "AND",
                                        )
                                      }
                                    >
                                      AND
                                    </button>
                                    <button
                                      className={`operator-btn ${entryConditions.groupOperators[groupIndex - 1] === "OR" ? "active" : ""}`}
                                      onClick={() =>
                                        handleGroupOperatorChange(
                                          groupIndex - 1,
                                          "OR",
                                        )
                                      }
                                    >
                                      OR
                                    </button>
                                  </div>
                                </div>
                              )}
                              <div className="condition-group-box">
                                <div className="condition-group-header">
                                  <span className="condition-group-label">
                                    Group {groupIndex + 1}
                                  </span>
                                  {entryConditions.conditionGroups.length > 1 &&
                                    groupIndex > 0 && (
                                      <button
                                        type="button"
                                        className="delete-condition-btn delete-condition-btn-top"
                                        onClick={() =>
                                          removeConditionGroup(group.id)
                                        }
                                        title="Delete Condition Group"
                                      >
                                        🗑️
                                      </button>
                                    )}
                                </div>
                                <div className="entry-condition-group">
                                  <h3 className="condition-title long">
                                    Long Entry condition
                                  </h3>
                                  <div className="condition-controls">
                                    <div className="dropdown-group">
                                      <button
                                        type="button"
                                        className="select-button"
                                        onClick={() =>
                                          openIndicatorModal(
                                            "longEntry",
                                            group.id,
                                            null,
                                            "indicator1",
                                            group.longEntry?.indicator1 ||
                                              "rsi",
                                          )
                                        }
                                      >
                                        {group.longEntry?.indicator1
                                          ? getIndicatorLabel(group.longEntry.indicator1)
                                          : "Select Indicator"}
                                      </button>
                                    </div>
                                    <div className="dropdown-group">
                                      <button
                                        type="button"
                                        className="select-button"
                                        onClick={() =>
                                          openComparatorModal(
                                            "longEntry",
                                            group.id,
                                            null,
                                            "comparator",
                                            group.longEntry?.comparator,
                                          )
                                        }
                                      >
                                        {getComparatorLabel(
                                          group.longEntry?.comparator,
                                        )}
                                      </button>
                                    </div>
                                    <button
                                      className="copy-script-btn"
                                      onClick={() =>
                                        openScriptModal(
                                          group.longEntry,
                                          "Long Entry condition",
                                        )
                                      }
                                      title="Copy Script"
                                    >
                                      📋
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                        <button
                          className="add-condition-group-btn"
                          onClick={addConditionGroup}
                        >
                          + Add Condition Group
                        </button>
                      </>
                    )}
                    {strategyState.transactionType === "only-short" && (
                      <>
                        {entryConditions.conditionGroups.map(
                          (group, groupIndex) => (
                            <div
                              key={group.id}
                              className="condition-row condition-group-box-wrap"
                            >
                              {groupIndex > 0 && (
                                <div className="condition-operator-selector">
                                  <div className="operator-toggle">
                                    <button
                                      className={`operator-btn ${entryConditions.groupOperators[groupIndex - 1] === "AND" ? "active" : ""}`}
                                      onClick={() =>
                                        handleGroupOperatorChange(
                                          groupIndex - 1,
                                          "AND",
                                        )
                                      }
                                    >
                                      AND
                                    </button>
                                    <button
                                      className={`operator-btn ${entryConditions.groupOperators[groupIndex - 1] === "OR" ? "active" : ""}`}
                                      onClick={() =>
                                        handleGroupOperatorChange(
                                          groupIndex - 1,
                                          "OR",
                                        )
                                      }
                                    >
                                      OR
                                    </button>
                                  </div>
                                </div>
                              )}
                              <div className="condition-group-box">
                                <div className="condition-group-header">
                                  <span className="condition-group-label">
                                    Group {groupIndex + 1}
                                  </span>
                                  {entryConditions.conditionGroups.length > 1 &&
                                    groupIndex > 0 && (
                                      <button
                                        type="button"
                                        className="delete-condition-btn delete-condition-btn-top"
                                        onClick={() =>
                                          removeConditionGroup(group.id)
                                        }
                                        title="Delete Condition Group"
                                      >
                                        🗑️
                                      </button>
                                    )}
                                </div>
                                <div className="entry-condition-group">
                                  <h3 className="condition-title short">
                                    Short Entry condition
                                  </h3>
                                  <div className="condition-controls">
                                    <div className="dropdown-group">
                                      <button
                                        type="button"
                                        className="select-button"
                                        onClick={() =>
                                          openIndicatorModal(
                                            "shortEntry",
                                            group.id,
                                            null,
                                            "indicator1",
                                            group.shortEntry?.indicator1 ||
                                              "rsi",
                                          )
                                        }
                                        title="Select Indicator"
                                      >
                                        {group.shortEntry?.indicator1
                                          ? getIndicatorLabel(group.shortEntry.indicator1)
                                          : "Select Indicator"}
                                      </button>
                                    </div>
                                    <div className="dropdown-group">
                                      <button
                                        type="button"
                                        className="select-button"
                                        onClick={() =>
                                          openComparatorModal(
                                            "shortEntry",
                                            group.id,
                                            null,
                                            "comparator",
                                            group.shortEntry?.comparator,
                                          )
                                        }
                                        title="Select Comparator"
                                      >
                                        {getComparatorLabel(
                                          group.shortEntry?.comparator,
                                        )}
                                      </button>
                                    </div>
                                    <button
                                      className="copy-script-btn"
                                      onClick={() =>
                                        openScriptModal(
                                          group.shortEntry,
                                          "Short Entry condition",
                                        )
                                      }
                                      title="Copy Script"
                                    >
                                      📋
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                        <button
                          className="add-condition-group-btn"
                          onClick={addConditionGroup}
                        >
                          + Add Condition Group
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Exit Conditions */}
              {strategyType === "indicator-based" && (
                <div className="exit-conditions-section">
                  <div className="exit-conditions-header">
                    <label className="exit-conditions-checkbox">
                      <input
                        type="checkbox"
                        checked={exitConditions.enabled}
                        onChange={(e) =>
                          handleExitConditionToggle(e.target.checked)
                        }
                      />
                      <span className="checkmark"></span>
                      Exit conditions (Optional)
                    </label>
                  </div>
                  {exitConditions.enabled && (
                    <div className="exit-conditions-content">
                      {strategyState.transactionType === "both-side" && (
                        <>
                          {exitConditions.conditionGroups.map(
                            (group, groupIndex) => (
                              <div
                                key={group.id}
                                className="condition-group-container"
                              >
                                {groupIndex > 0 && (
                                  <div className="group-operator-selector">
                                    <div className="operator-toggle">
                                      <button
                                        className={`operator-btn ${exitConditions.groupOperators[groupIndex - 1] === "AND" ? "active" : ""}`}
                                        onClick={() =>
                                          handleExitGroupOperatorChange(
                                            groupIndex - 1,
                                            "AND",
                                          )
                                        }
                                      >
                                        AND
                                      </button>
                                      <button
                                        className={`operator-btn ${exitConditions.groupOperators[groupIndex - 1] === "OR" ? "active" : ""}`}
                                        onClick={() =>
                                          handleExitGroupOperatorChange(
                                            groupIndex - 1,
                                            "OR",
                                          )
                                        }
                                      >
                                        OR
                                      </button>
                                    </div>
                                  </div>
                                )}
                                <div className="condition-group">
                                  <div className="entry-condition-group">
                                    <h3 className="condition-title long">
                                      Long Exit condition
                                    </h3>
                                    <div className="condition-controls">
                                      <div className="dropdown-group">
                                        <button
                                          type="button"
                                          className="select-button"
                                          onClick={() =>
                                            openIndicatorModal(
                                              "longExit",
                                              group.id,
                                              null,
                                              "indicator1",
                                              group.longExit.indicator1 || "",
                                            )
                                          }
                                        >
                                          {group.longExit.indicator1
                                            ? getIndicatorLabel(group.longExit.indicator1)
                                            : "Select Indicator"}
                                        </button>
                                      </div>
                                      <div className="dropdown-group">
                                        <button
                                          type="button"
                                          className="select-button"
                                          onClick={() =>
                                            openComparatorModal(
                                              "longExit",
                                              group.id,
                                              null,
                                              "comparator",
                                              group.longExit.comparator,
                                            )
                                          }
                                        >
                                          {getComparatorLabel(
                                            group.longExit.comparator,
                                          )}
                                        </button>
                                      </div>
                                      <button
                                        className="copy-script-btn"
                                        onClick={() =>
                                          openScriptModal(
                                            group.longExit,
                                            "Long Exit condition",
                                          )
                                        }
                                        title="Copy Script"
                                      >
                                        📋
                                      </button>
                                      {exitConditions.conditionGroups.length >
                                        1 &&
                                        groupIndex > 0 && (
                                          <button
                                            className="delete-condition-btn"
                                            onClick={() =>
                                              removeExitConditionGroup(group.id)
                                            }
                                            title="Delete Exit Condition Group"
                                          >
                                            🗑️
                                          </button>
                                        )}
                                    </div>
                                  </div>
                                  <div className="entry-condition-group">
                                    <h3 className="condition-title short">
                                      Short Exit condition
                                    </h3>
                                    <div className="condition-controls">
                                      <div className="dropdown-group">
                                        <button
                                          type="button"
                                          className="select-button"
                                          onClick={() =>
                                            openIndicatorModal(
                                              "shortExit",
                                              group.id,
                                              null,
                                              "indicator1",
                                              group.shortExit.indicator1 || "",
                                            )
                                          }
                                          title="Select Indicator"
                                        >
                                          {group.shortExit.indicator1
                                            ? getIndicatorLabel(group.shortExit.indicator1)
                                            : "Select Indicator"}
                                        </button>
                                      </div>
                                      <div className="dropdown-group">
                                        <button
                                          type="button"
                                          className="select-button"
                                          onClick={() =>
                                            openComparatorModal(
                                              "shortExit",
                                              group.id,
                                              null,
                                              "comparator",
                                              group.shortExit.comparator,
                                            )
                                          }
                                          title="Select Comparator"
                                        >
                                          {getComparatorLabel(
                                            group.shortExit.comparator,
                                          )}
                                        </button>
                                      </div>
                                      <button
                                        className="copy-script-btn"
                                        onClick={() =>
                                          openScriptModal(
                                            group.shortExit,
                                            "Short Exit condition",
                                          )
                                        }
                                        title="Copy Script"
                                      >
                                        📋
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ),
                          )}
                          <button
                            className="add-condition-group-btn"
                            onClick={addExitConditionGroup}
                          >
                            + Add Exit Condition Group
                          </button>
                        </>
                      )}
                      {strategyState.transactionType === "only-long" && (
                        <>
                          {exitConditions.conditionGroups.map(
                            (group, groupIndex) => (
                              <div key={group.id} className="condition-row">
                                {groupIndex > 0 && (
                                  <div className="condition-operator-selector">
                                    <div className="operator-toggle">
                                      <button
                                        className={`operator-btn ${exitConditions.groupOperators[groupIndex - 1] === "AND" ? "active" : ""}`}
                                        onClick={() =>
                                          handleExitGroupOperatorChange(
                                            groupIndex - 1,
                                            "AND",
                                          )
                                        }
                                      >
                                        AND
                                      </button>
                                      <button
                                        className={`operator-btn ${exitConditions.groupOperators[groupIndex - 1] === "OR" ? "active" : ""}`}
                                        onClick={() =>
                                          handleExitGroupOperatorChange(
                                            groupIndex - 1,
                                            "OR",
                                          )
                                        }
                                      >
                                        OR
                                      </button>
                                    </div>
                                  </div>
                                )}
                                <div className="entry-condition-group">
                                  <h3 className="condition-title long">
                                    Long Exit condition
                                  </h3>
                                  <div className="condition-controls">
                                    <div className="dropdown-group">
                                      <button
                                        type="button"
                                        className="select-button"
                                        onClick={() =>
                                          openIndicatorModal(
                                            "longExit",
                                            group.id,
                                            null,
                                            "indicator1",
                                            group.longExit?.indicator1 || "",
                                          )
                                        }
                                      >
                                        {group.longExit?.indicator1
                                          ? getIndicatorLabel(group.longExit.indicator1)
                                          : "Select Indicator"}
                                      </button>
                                    </div>
                                    <div className="dropdown-group">
                                      <button
                                        type="button"
                                        className="select-button"
                                        onClick={() =>
                                          openComparatorModal(
                                            "longExit",
                                            group.id,
                                            null,
                                            "comparator",
                                            group.longExit?.comparator,
                                          )
                                        }
                                      >
                                        {getComparatorLabel(
                                          group.longExit?.comparator,
                                        )}
                                      </button>
                                    </div>
                                    <button
                                      className="copy-script-btn"
                                      onClick={() =>
                                        openScriptModal(
                                          group.longExit,
                                          "Long Exit condition",
                                        )
                                      }
                                      title="Copy Script"
                                    >
                                      📋
                                    </button>
                                    {exitConditions.conditionGroups.length >
                                      1 &&
                                      groupIndex > 0 && (
                                        <button
                                          className="delete-condition-btn"
                                          onClick={() =>
                                            removeExitConditionGroup(group.id)
                                          }
                                          title="Delete Long Exit Condition"
                                        >
                                          🗑️
                                        </button>
                                      )}
                                  </div>
                                </div>
                              </div>
                            ),
                          )}
                          <button
                            className="add-condition-group-btn"
                            onClick={addExitConditionGroup}
                          >
                            + Add Exit Condition Group
                          </button>
                        </>
                      )}
                      {strategyState.transactionType === "only-short" && (
                        <>
                          {exitConditions.conditionGroups.map(
                            (group, groupIndex) => (
                              <div key={group.id} className="condition-row">
                                {groupIndex > 0 && (
                                  <div className="condition-operator-selector">
                                    <div className="operator-toggle">
                                      <button
                                        className={`operator-btn ${exitConditions.groupOperators[groupIndex - 1] === "AND" ? "active" : ""}`}
                                        onClick={() =>
                                          handleExitGroupOperatorChange(
                                            groupIndex - 1,
                                            "AND",
                                          )
                                        }
                                      >
                                        AND
                                      </button>
                                      <button
                                        className={`operator-btn ${exitConditions.groupOperators[groupIndex - 1] === "OR" ? "active" : ""}`}
                                        onClick={() =>
                                          handleExitGroupOperatorChange(
                                            groupIndex - 1,
                                            "OR",
                                          )
                                        }
                                      >
                                        OR
                                      </button>
                                    </div>
                                  </div>
                                )}
                                <div className="entry-condition-group">
                                  <h3 className="condition-title short">
                                    Short Exit condition
                                  </h3>
                                  <div className="condition-controls">
                                    <div className="dropdown-group">
                                      <button
                                        type="button"
                                        className="select-button"
                                        onClick={() =>
                                          openIndicatorModal(
                                            "shortExit",
                                            group.id,
                                            null,
                                            "indicator1",
                                            group.shortExit?.indicator1 || "",
                                          )
                                        }
                                        title="Select Indicator"
                                      >
                                        {group.shortExit?.indicator1
                                          ? getIndicatorLabel(group.shortExit.indicator1)
                                          : "Select Indicator"}
                                      </button>
                                    </div>
                                    <div className="dropdown-group">
                                      <button
                                        type="button"
                                        className="select-button"
                                        onClick={() =>
                                          openComparatorModal(
                                            "shortExit",
                                            group.id,
                                            null,
                                            "comparator",
                                            group.shortExit?.comparator,
                                          )
                                        }
                                        title="Select Comparator"
                                      >
                                        {getComparatorLabel(
                                          group.shortExit?.comparator,
                                        )}
                                      </button>
                                    </div>
                                    <button
                                      className="copy-script-btn"
                                      onClick={() =>
                                        openScriptModal(
                                          group.shortExit,
                                          "Short Exit condition",
                                        )
                                      }
                                      title="Copy Script"
                                    >
                                      📋
                                    </button>
                                    {exitConditions.conditionGroups.length >
                                      1 &&
                                      groupIndex > 0 && (
                                        <button
                                          className="delete-condition-btn"
                                          onClick={() =>
                                            removeExitConditionGroup(group.id)
                                          }
                                          title="Delete Short Exit Condition"
                                        >
                                          🗑️
                                        </button>
                                      )}
                                  </div>
                                </div>
                              </div>
                            ),
                          )}
                          <button
                            className="add-condition-group-btn"
                            onClick={addExitConditionGroup}
                          >
                            + Add Exit Condition Group
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Risk Management & Profit Trailing */}
              <div className="combined-risk-profit-section">
                <div className="risk-management-subsection">
                  <h3 className="subsection-heading">Risk management</h3>
                  <div className="risk-management-content">
                    <div className="profit-loss-inputs">
                      <div className="input-group number-input-wrapper">
                        <input
                          type="number"
                          placeholder="Exit When Over All Profit In Amount (INR)"
                          value={strategyState?.rmProfitExitAmount}
                          onChange={handleChange}
                          className={`risk-input ${getFieldError("rmProfitExitAmount") ? "error" : ""}`}
                          min="0"
                          name="rmProfitExitAmount"
                        />
                        <div className="number-controls">
                          <button
                            type="button"
                            className="number-btn increment"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleChange({
                                name: "rmProfitExitAmount",
                                value:
                                  (parseFloat(
                                    strategyState?.rmProfitExitAmount,
                                  ) || 0) + 100,
                              });
                            }}
                          />
                          <button
                            type="button"
                            className="number-btn decrement"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const v =
                                parseFloat(strategyState?.rmProfitExitAmount) ||
                                0;
                              if (v > 0)
                                handleChange({
                                  name: "rmProfitExitAmount",
                                  value: Math.max(0, v - 100),
                                });
                            }}
                            disabled={
                              !strategyState?.rmProfitExitAmount ||
                              parseFloat(strategyState?.rmProfitExitAmount) <= 0
                            }
                          />
                        </div>
                      </div>
                      <div className="input-group number-input-wrapper">
                        <input
                          type="number"
                          placeholder="Exit When Over All Loss In Amount (INR)"
                          value={strategyState?.rmLossExitAmount}
                          onChange={handleChange}
                          className={`risk-input ${getFieldError("rmLossExitAmount") ? "error" : ""}`}
                          min="0"
                          name="rmLossExitAmount"
                        />
                        <div className="number-controls">
                          <button
                            type="button"
                            className="number-btn increment"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRiskManagementChange(
                                "lossExitAmount",
                                (parseFloat(strategyState?.rmLossExitAmount) ||
                                  0) + 100,
                              );
                            }}
                          />
                          <button
                            type="button"
                            className="number-btn decrement"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const v =
                                parseFloat(strategyState?.rmLossExitAmount) ||
                                0;
                              if (v > 0)
                                handleChange({
                                  name: "rmLossExitAmount",
                                  value: Math.max(0, v - 100),
                                });
                            }}
                            disabled={
                              !strategyState?.rmLossExitAmount ||
                              parseFloat(strategyState?.rmLossExitAmount) <= 0
                            }
                          />
                        </div>
                      </div>
                      <div className="input-group number-input-wrapper">
                        <input
                          type="number"
                          placeholder="Trade Limit (Maximum number of trades)"
                          value={strategyState?.tradeLimit || ""}
                          onChange={handleChange}
                          className="risk-input"
                          min="0"
                          name="tradeLimit"
                        />
                        <div className="number-controls">
                          <button
                            type="button"
                            className="number-btn increment"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleChange({
                                name: "tradeLimit",
                                value:
                                  (parseFloat(strategyState?.tradeLimit) || 0) +
                                  1,
                              });
                            }}
                          />
                          <button
                            type="button"
                            className="number-btn decrement"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const v =
                                parseFloat(strategyState?.tradeLimit) || 0;
                              if (v > 0)
                                handleChange({
                                  name: "tradeLimit",
                                  value: Math.max(0, v - 1),
                                });
                            }}
                            disabled={
                              !strategyState?.tradeLimit ||
                              parseFloat(strategyState?.tradeLimit) <= 0
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="profit-trailing-subsection">
                  <h3 className="subsection-heading">Profit Trailing</h3>
                  <div className="profit-trailing-conditional">
                    <div className="input-group number-input-wrapper">
                      <input
                        type="number"
                        placeholder="If Profit Reaches"
                        value={strategyState?.PTLockIfProfitReaches}
                        onChange={handleChange}
                        className="risk-input"
                        name="PTLockIfProfitReaches"
                        min="0"
                      />
                      <div className="number-controls">
                        <button
                          type="button"
                          className="number-btn increment"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleChange({
                              name: "PTLockIfProfitReaches",
                              value:
                                (parseFloat(
                                  strategyState?.PTLockIfProfitReaches,
                                ) || 0) + 100,
                            });
                          }}
                        />
                        <button
                          type="button"
                          className="number-btn decrement"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const v =
                              parseFloat(
                                strategyState?.PTLockIfProfitReaches,
                              ) || 0;
                            if (v > 0)
                              handleChange({
                                name: "PTLockIfProfitReaches",
                                value: Math.max(0, v - 100),
                              });
                          }}
                          disabled={
                            !strategyState?.PTLockIfProfitReaches ||
                            parseFloat(strategyState?.PTLockIfProfitReaches) <=
                              0
                          }
                        />
                      </div>
                    </div>
                    <div className="input-group number-input-wrapper">
                      <input
                        type="number"
                        placeholder="Lock Profit at"
                        value={strategyState?.PTLockProfitAt}
                        onChange={handleChange}
                        className="risk-input"
                        name="PTLockProfitAt"
                        min="0"
                      />
                      <div className="number-controls">
                        <button
                          type="button"
                          className="number-btn increment"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleChange({
                              name: "PTLockProfitAt",
                              value:
                                (parseFloat(strategyState?.PTLockProfitAt) ||
                                  0) + 100,
                            });
                          }}
                        />
                        <button
                          type="button"
                          className="number-btn decrement"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const v =
                              parseFloat(strategyState?.PTLockProfitAt) || 0;
                            if (v > 0)
                              handleChange({
                                name: "PTLockProfitAt",
                                value: Math.max(0, v - 100),
                              });
                          }}
                          disabled={
                            !strategyState?.PTLockProfitAt ||
                            parseFloat(strategyState?.PTLockProfitAt) <= 0
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="strategy-footer">
                <div className="footer-content">
                  <div className="strategy-name-input">
                    <input
                      type="text"
                      name="StrategyName"
                      placeholder="Strategy name"
                      value={StrategyName}
                      onChange={(e) => {
                        handleChange(e);
                        clearErrors();
                      }}
                      className={`strategy-name-field ${getFieldError("StrategyName") ? "error" : ""}`}
                    />
                    {getFieldError("StrategyName") && (
                      <span className="field-error-message">
                        {getFieldError("StrategyName")}
                      </span>
                    )}
                  </div>
                  <div className="footer-actions">
                    <button
                      className="save-continue-button"
                      onClick={handleSaveAndContinue}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving..." : "Save & Continue"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Payoff Chart */}
          <div className="payoff-chart-section">
            <div className="payoff-chart-header">
              <h2 className="section-heading">Strategy Analysis</h2>
            </div>
            {strategyState?.qaCustomCustomerOptionsAlgoChild?.length > 0 && (
              <div className="strategy-metrics-section">
                <div className="scenario-analysis-single-line">
                  <div className="scenario-metrics-inline">
                    <div className="metric-item">
                      <span className="metric-label">Total Qty:</span>
                      <span
                        className="metric-value"
                        style={{ whiteSpace: "nowrap" }}
                      >
                        {(() => {
                          const legs =
                            strategyState?.qaCustomCustomerOptionsAlgoChild ||
                            [];
                          const buyQty = Math.abs(
                            legs.reduce(
                              (sum, leg) =>
                                leg.action === "BUY"
                                  ? sum + Math.abs(parseInt(leg.qty || 0))
                                  : sum,
                              0,
                            ),
                          );
                          const sellQty = Math.abs(
                            legs.reduce(
                              (sum, leg) =>
                                leg.action === "SELL"
                                  ? sum + Math.abs(parseInt(leg.qty || 0))
                                  : sum,
                              0,
                            ),
                          );
                          return `B: ${buyQty} S: ${sellQty} Net: ${buyQty - sellQty}`;
                        })()}
                      </span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Delta:</span>
                      <span className="metric-value delta">
                        {greeksData?.isLoading ? (
                          <span className="loading-indicator">Loading...</span>
                        ) : (
                          greeksData?.delta?.toFixed(4) || "0.0000"
                        )}
                      </span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Gamma:</span>
                      <span className="metric-value gamma">
                        {greeksData?.isLoading ? (
                          <span className="loading-indicator">Loading...</span>
                        ) : (
                          greeksData?.gamma?.toFixed(6) || "0.000000"
                        )}
                      </span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Theta:</span>
                      <span className="metric-value theta">
                        {greeksData?.isLoading ? (
                          <span className="loading-indicator">Loading...</span>
                        ) : (
                          greeksData?.theta?.toFixed(2) || "0.00"
                        )}
                      </span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Vega:</span>
                      <span className="metric-value vega">
                        {greeksData?.isLoading ? (
                          <span className="loading-indicator">Loading...</span>
                        ) : (
                          greeksData?.vega?.toFixed(2) || "0.00"
                        )}
                      </span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">IV:</span>
                      <span className="metric-value iv">
                        {greeksData?.isLoading ? (
                          <span className="loading-indicator">Loading...</span>
                        ) : (
                          (greeksData?.weightedIV?.toFixed(2) || "0.00") + "%"
                        )}
                      </span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Total MTM:</span>
                      <span
                        className={`metric-value ${strategyMetrics.mtm >= 0 ? "positive" : "negative"}`}
                      >
                        ₹ {strategyMetrics.mtm.toFixed(2)}
                      </span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Maximum Profit:</span>
                      <span className="metric-value positive">
                        {strategyMetrics.maxProfit === 999999
                          ? "Unlimited"
                          : `₹ ${strategyMetrics.maxProfit.toFixed(0)}`}
                      </span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Risk/Reward:</span>
                      <span className="metric-value">
                        {strategyMetrics.riskReward}
                      </span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Maximum Loss:</span>
                      <span className="metric-value negative">
                        {strategyMetrics.maxLoss === 999999
                          ? "Unlimited"
                          : `₹ ${strategyMetrics.maxLoss.toFixed(0)}`}
                      </span>
                      <button className="limit-btn">Limit</button>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Breakeven:</span>
                      <span className="metric-value breakeven">
                        {typeof strategyMetrics.breakeven === "string"
                          ? strategyMetrics.breakeven
                          : strategyMetrics.breakeven.toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="payoff-chart-container">
              {strategyState?.qaCustomCustomerOptionsAlgoChild?.length > 0 ? (
                <AdvancedPayoffChart
                  legs={chartLegs}
                  spotPrice={chartSpotPrice}
                  volatility={0.25}
                  timeToExpiry={30}
                  riskFreeRate={0.05}
                  showGreeks={true}
                  showMetrics={true}
                />
              ) : (
                <div className="no-chart-message">
                  <h3>Add Legs to View Chart</h3>
                  <p>
                    Configure your trading strategy legs to see the payoff chart
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Indicator Selection Modal ─────────────────────────────────────── */}
      {indicatorModal.isOpen && (
        <div className="indicator-modal-overlay" onClick={closeIndicatorModal}>
          <div className="indicator-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Select Indicator</h3>
              <button className="close-btn" onClick={closeIndicatorModal}>
                ✕
              </button>
            </div>
            <div className="modal-content">
              <div className="indicator-options">
                <div className="label-scroll-data">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="indicator"
                      value="rsi"
                      checked={selectedIndicator === "rsi"}
                      onChange={(e) =>
                        handleIndicatorSelectionChange(e.target.value)
                      }
                    />
                    <span className="radio-label">RSI</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="indicator"
                      value="ema"
                      checked={selectedIndicator === "ema"}
                      onChange={(e) =>
                        handleIndicatorSelectionChange(e.target.value)
                      }
                    />
                    <span className="radio-label">EMA</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="indicator"
                      value="supertrend"
                      checked={selectedIndicator === "supertrend"}
                      onChange={(e) =>
                        handleIndicatorSelectionChange(e.target.value)
                      }
                    />
                    <span className="radio-label">Supertrend</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="indicator"
                      value="sma"
                      checked={selectedIndicator === "sma"}
                      onChange={(e) =>
                        handleIndicatorSelectionChange(e.target.value)
                      }
                    />
                    <span className="radio-label">SMA</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="indicator"
                      value="macd"
                      checked={selectedIndicator === "macd"}
                      onChange={(e) =>
                        handleIndicatorSelectionChange(e.target.value)
                      }
                    />
                    <span className="radio-label">MACD</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="indicator"
                      value="adx"
                      checked={selectedIndicator === "adx"}
                      onChange={(e) =>
                        handleIndicatorSelectionChange(e.target.value)
                      }
                    />
                    <span className="radio-label">ADX</span>
                  </label>
                  {/* ← EMA_4 radio button */}
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="indicator"
                      value="ema_4"
                      checked={selectedIndicator === "ema_4"}
                      onChange={(e) =>
                        handleIndicatorSelectionChange(e.target.value)
                      }
                    />
                    <span className="radio-label">EMA 4-Lines</span>
                  </label>
                  {/* ← Pivot HL radio button */}
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="indicator"
                      value="pivot_hl"
                      checked={selectedIndicator === "pivot_hl"}
                      onChange={(e) =>
                        handleIndicatorSelectionChange(e.target.value)
                      }
                    />
                    <span className="radio-label">Pivot Points HL</span>
                  </label>
                  {/* ← CPR options */}
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="indicator"
                      value="cpr_pivot"
                      checked={selectedIndicator === "cpr_pivot"}
                      onChange={(e) =>
                        handleIndicatorSelectionChange(e.target.value)
                      }
                    />
                    <span className="radio-label">CPR - Pivot</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="indicator"
                      value="cpr_tc"
                      checked={selectedIndicator === "cpr_tc"}
                      onChange={(e) =>
                        handleIndicatorSelectionChange(e.target.value)
                      }
                    />
                    <span className="radio-label">CPR - TC (Top Central)</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="indicator"
                      value="cpr_bc"
                      checked={selectedIndicator === "cpr_bc"}
                      onChange={(e) =>
                        handleIndicatorSelectionChange(e.target.value)
                      }
                    />
                    <span className="radio-label">CPR - BC (Bottom Central)</span>
                  </label>
                </div>

                {/* Single period input */}
                {["rsi", "supertrend", "ema", "sma", "adx"].includes(
                  selectedIndicator,
                ) && (
                  <div className="period-input-group">
                    <label className="period-label">Period</label>
                    <div className="number-input-wrapper">
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={selectedPeriod}
                        onChange={(e) =>
                          setSelectedPeriod(
                            parseInt(e.target.value) ||
                              getDefaultPeriod(selectedIndicator),
                          )
                        }
                        className="period-input-modal"
                        placeholder={String(
                          getDefaultPeriod(selectedIndicator),
                        )}
                      />
                      <div className="number-controls">
                        <button
                          type="button"
                          className="number-btn increment"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedPeriod((prev) =>
                              Math.min(
                                200,
                                (prev || getDefaultPeriod(selectedIndicator)) +
                                  1,
                              ),
                            );
                          }}
                          disabled={selectedPeriod >= 200}
                        />
                        <button
                          type="button"
                          className="number-btn decrement"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedPeriod((prev) =>
                              Math.max(
                                1,
                                (prev || getDefaultPeriod(selectedIndicator)) -
                                  1,
                              ),
                            );
                          }}
                          disabled={selectedPeriod <= 1}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* MACD params */}
                {selectedIndicator === "macd" && (
                  <>
                    <div className="period-input-group">
                      <label className="period-label">Fast period</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={selectedMacdFast}
                        onChange={(e) =>
                          setSelectedMacdFast(
                            parseInt(e.target.value, 10) ||
                              getDefaultMacd().fast,
                          )
                        }
                        className="period-input-modal"
                        placeholder="12"
                      />
                    </div>
                    <div className="period-input-group">
                      <label className="period-label">Slow period</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={selectedMacdSlow}
                        onChange={(e) =>
                          setSelectedMacdSlow(
                            parseInt(e.target.value, 10) ||
                              getDefaultMacd().slow,
                          )
                        }
                        className="period-input-modal"
                        placeholder="26"
                      />
                    </div>
                    <div className="period-input-group">
                      <label className="period-label">Signal period</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={selectedMacdSignal}
                        onChange={(e) =>
                          setSelectedMacdSignal(
                            parseInt(e.target.value, 10) ||
                              getDefaultMacd().signal,
                          )
                        }
                        className="period-input-modal"
                        placeholder="9"
                      />
                    </div>
                  </>
                )}

                {/* RSI overbought */}
                {selectedIndicator === "rsi" && (
                  <div className="period-input-group">
                    <label className="period-label">Overbought threshold</label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={selectedOverbought}
                      onChange={(e) =>
                        setSelectedOverbought(e.target.value || "70")
                      }
                      className="period-input-modal"
                      placeholder="70"
                    />
                    <span className="rsi-threshold-hint">
                      Oversold = 100 − Overbought (e.g. 70 → 30)
                    </span>
                  </div>
                )}

                {/* Supertrend multiplier */}
                {selectedIndicator === "supertrend" && (
                  <div className="period-input-group">
                    <label className="period-label">Multiplier</label>
                    <div className="number-input-wrapper">
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={selectedMultiplier}
                        onChange={(e) =>
                          setSelectedMultiplier(
                            parseFloat(e.target.value) ||
                              getDefaultMultiplier(),
                          )
                        }
                        className="period-input-modal"
                        placeholder="3"
                      />
                      <div className="number-controls">
                        <button
                          type="button"
                          className="number-btn increment"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedMultiplier((prev) =>
                              Math.min(
                                20,
                                Number(
                                  (
                                    (prev || getDefaultMultiplier()) + 0.1
                                  ).toFixed(1),
                                ),
                              ),
                            );
                          }}
                          disabled={selectedMultiplier >= 20}
                        />
                        <button
                          type="button"
                          className="number-btn decrement"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedMultiplier((prev) =>
                              Math.max(
                                0.1,
                                Number(
                                  (
                                    (prev || getDefaultMultiplier()) - 0.1
                                  ).toFixed(1),
                                ),
                              ),
                            );
                          }}
                          disabled={selectedMultiplier <= 0.1}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ← EMA_4: 4 period inputs + line selector */}
                {selectedIndicator === "ema_4" && (
                  <>
                    <div className="period-input-group">
                      <label className="period-label">EMA Period 1 (Red)</label>
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={selectedEma4Period1}
                        onChange={(e) =>
                          setSelectedEma4Period1(
                            parseInt(e.target.value, 10) || 20,
                          )
                        }
                        className="period-input-modal"
                        placeholder="20"
                      />
                    </div>
                    <div className="period-input-group">
                      <label className="period-label">
                        EMA Period 2 (Orange)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={selectedEma4Period2}
                        onChange={(e) =>
                          setSelectedEma4Period2(
                            parseInt(e.target.value, 10) || 50,
                          )
                        }
                        className="period-input-modal"
                        placeholder="50"
                      />
                    </div>
                    <div className="period-input-group">
                      <label className="period-label">
                        EMA Period 3 (Aqua)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={selectedEma4Period3}
                        onChange={(e) =>
                          setSelectedEma4Period3(
                            parseInt(e.target.value, 10) || 100,
                          )
                        }
                        className="period-input-modal"
                        placeholder="100"
                      />
                    </div>
                    <div className="period-input-group">
                      <label className="period-label">
                        EMA Period 4 (Blue)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={selectedEma4Period4}
                        onChange={(e) =>
                          setSelectedEma4Period4(
                            parseInt(e.target.value, 10) || 200,
                          )
                        }
                        className="period-input-modal"
                        placeholder="200"
                      />
                    </div>
                    <div className="period-input-group">
                      <label className="period-label">
                        Compare Which Line?
                      </label>
                      <select
                        className="period-input-modal"
                        value={selectedEma4Line}
                        onChange={(e) =>
                          setSelectedEma4Line(parseInt(e.target.value, 10))
                        }
                      >
                        <option value={1}>
                          Line 1 — EMA {selectedEma4Period1} (Red)
                        </option>
                        <option value={2}>
                          Line 2 — EMA {selectedEma4Period2} (Orange)
                        </option>
                        <option value={3}>
                          Line 3 — EMA {selectedEma4Period3} (Aqua)
                        </option>
                        <option value={4}>
                          Line 4 — EMA {selectedEma4Period4} (Blue)
                        </option>
                      </select>
                      <span className="rsi-threshold-hint">
                        Selected line price se compare hogi
                      </span>
                    </div>
                  </>
                )}

                {/* ← Pivot HL: leftBars + rightBars + pivotType */}
                {selectedIndicator === "pivot_hl" && (
                  <>
                    <div className="period-input-group">
                      <label className="period-label">Left Bars</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={selectedPivotLeftBars}
                        onChange={(e) =>
                          setSelectedPivotLeftBars(
                            parseInt(e.target.value, 10) || 5,
                          )
                        }
                        className="period-input-modal"
                        placeholder="5"
                      />
                    </div>
                    <div className="period-input-group">
                      <label className="period-label">Right Bars</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={selectedPivotRightBars}
                        onChange={(e) =>
                          setSelectedPivotRightBars(
                            parseInt(e.target.value, 10) || 5,
                          )
                        }
                        className="period-input-modal"
                        placeholder="5"
                      />
                    </div>
                    <div className="period-input-group">
                      <label className="period-label">Pivot Type</label>
                      <select
                        className="period-input-modal"
                        value={selectedPivotType}
                        onChange={(e) => setSelectedPivotType(e.target.value)}
                      >
                        <option value="high">Pivot High (resistance)</option>
                        <option value="low">Pivot Low (support)</option>
                      </select>
                      <span className="rsi-threshold-hint">
                        Price se compare hoga
                      </span>
                    </div>
                  </>
                )}
                {/* ← CPR: koi extra input nahi, sirf info */}
                {["cpr_pivot", "cpr_tc", "cpr_bc"].includes(selectedIndicator) && (
                  <div className="period-input-group">
                    <div className="rsi-threshold-hint" style={{ padding: "8px 0" }}>
                      ✅ <strong>No settings needed.</strong><br />
                      Automatically calculated from previous day's High, Low &amp; Close.
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={closeIndicatorModal}>
                Cancel
              </button>
              <button className="ok-btn" onClick={confirmIndicatorSelection}>
                Ok
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comparator Modal */}
      {comparatorModal.isOpen && (
        <div
          className="comparator-modal-overlay"
          onClick={closeComparatorModal}
        >
          <div
            className="comparator-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Select Comparator</h3>
              <button className="close-btn" onClick={closeComparatorModal}>
                ✕
              </button>
            </div>
            <div className="modal-content">
              <div className="comparator-options">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="comparator"
                    value="greater"
                    checked={selectedComparator === "greater"}
                    onChange={(e) => setSelectedComparator(e.target.value)}
                  />
                  <span className="radio-label">Greater than</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="comparator"
                    value="less"
                    checked={selectedComparator === "less"}
                    onChange={(e) => setSelectedComparator(e.target.value)}
                  />
                  <span className="radio-label">Less than</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="comparator"
                    value="equal"
                    checked={selectedComparator === "equal"}
                    onChange={(e) => setSelectedComparator(e.target.value)}
                  />
                  <span className="radio-label">Equal to</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="comparator"
                    value="crosses"
                    checked={selectedComparator === "crosses"}
                    onChange={(e) => setSelectedComparator(e.target.value)}
                  />
                  <span className="radio-label">Crosses above</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="comparator"
                    value="crosses-below"
                    checked={selectedComparator === "crosses-below"}
                    onChange={(e) => setSelectedComparator(e.target.value)}
                  />
                  <span className="radio-label">Crosses below</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={closeComparatorModal}>
                Cancel
              </button>
              <button className="ok-btn" onClick={confirmComparatorSelection}>
                Ok
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Script Panel */}
      {scriptModal && scriptModal.isOpen && (
        <>
          <div className="script-panel-backdrop" onClick={closeScriptModal} />
          <div
            className="script-panel-side"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="script-panel-header">
              <div className="script-panel-title">
                <span className="script-icon">📝</span>
                <h3>{scriptModal.conditionName || "Condition Script"}</h3>
              </div>
              <div className="script-panel-actions">
                <button
                  className="script-action-btn"
                  onClick={copyScriptToClipboard}
                  title="Copy Script"
                >
                  📋 Copy
                </button>
                <button
                  className="script-close-btn"
                  onClick={closeScriptModal}
                  title="Close Panel"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="script-panel-content">
              <div className="script-display">
                <div className="script-line-numbers" ref={scriptLineNumbersRef}>
                  {scriptModal.script ? (
                    scriptModal.script.split("\n").map((_, index) => (
                      <div key={index} className="line-number">
                        {index + 1}
                      </div>
                    ))
                  ) : (
                    <div className="line-number">1</div>
                  )}
                </div>
                <pre
                  ref={scriptTextRef}
                  className="script-text json-highlight"
                  dangerouslySetInnerHTML={{
                    __html: formatJSONWithColors(
                      scriptModal.script || "No script available",
                    ),
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Instrument Modal */}
      {isInstrumentModalOpen && (
        <>
          <div
            className="instrument-modal-backdrop"
            onClick={closeInstrumentModal}
          />
          <div
            className="instrument-modal-side"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">Add symbol</h3>
              <button className="close-btn" onClick={closeInstrumentModal}>
                ✕
              </button>
            </div>
            <div className="modal-search-section">
              <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Symbol"
                  value={instrumentSearchQuery}
                  onChange={(e) => setInstrumentSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="category-filters-section">
              <div className="category-label-row">
                <span className="category-label-text">Category:</span>
              </div>
              <div className="category-chips-container">
                {symbolCategories.map((category, index) => (
                  <div
                    key={index}
                    className={`category-chip ${instrumentCategory === category.categoryName ? "active" : ""}`}
                  >
                    <span
                      className="category-chip-name"
                      onClick={() =>
                        handleInstrumentTabChange(category.categoryName)
                      }
                    >
                      {category.categoryName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="symbols-list-container">
              {isLoadingSymbols ? (
                <div className="loading-symbols">
                  <div className="loading-spinner"></div>
                  <p>Loading symbols...</p>
                </div>
              ) : instrumentCategory && symbolCategories.length > 0 ? (
                filteredSymbols.length > 0 ? (
                  <div className="symbols-list">
                    {filteredSymbols.map((symbol, index) => {
                      const isSelected =
                        IdentifierID &&
                        IdentifierID === symbol.symbolIdentifierId;
                      return (
                        <div
                          key={index}
                          className={`symbol-item ${isSelected ? "selected" : ""}`}
                        >
                          <div className="symbol-name-text">
                            {symbol.identifier || symbol.symbolName || "N/A"}
                          </div>
                          {symbol.symbolName &&
                            symbol.symbolName !== symbol.identifier && (
                              <div className="symbol-description">
                                {symbol.symbolName}
                              </div>
                            )}
                          <div className="symbol-action-btn-wrapper">
                            {isSelected ? (
                              <>
                                <button
                                  className="symbol-action-btn delete-btn"
                                  title="Remove"
                                  onClick={() => handleInstrumentSelect(null)}
                                >
                                  🗑️
                                </button>
                                <button
                                  className="symbol-action-btn view-btn"
                                  title="View Chart"
                                >
                                  🎯
                                </button>
                              </>
                            ) : (
                              <button
                                className="symbol-action-btn add-btn"
                                title="Add symbol"
                                onClick={() => handleInstrumentSelect(symbol)}
                              >
                                +
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="no-symbols">
                    <p>
                      {instrumentSearchQuery
                        ? `No symbols found matching "${instrumentSearchQuery}"`
                        : `No symbols available in ${instrumentCategory}`}
                    </p>
                  </div>
                )
              ) : (
                <div className="no-symbols">
                  <p>Please select a category to view symbols</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {subscriptionUpgradeOpen && (
        <SubscriptionDialog
          open={subscriptionUpgradeOpen}
          handleClose={() => {
            setSubscriptionUpgradeOpen(false);
            navigate("/plans");
          }}
          message={subscriptionUpgradeMessage}
        />
      )}
    </section>
  );
};

export default CreateStrategy;

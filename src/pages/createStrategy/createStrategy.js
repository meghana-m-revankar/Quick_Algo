import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Storage from "#services/storage";

// Helper function to update nested state by path
const updateNestedState = (state, path, value) => {
  const keys = path.split(".");
  const newState = { ...state };

  const processKeys = (obj, keyList, val) => {
    if (keyList.length === 0) return val;

    const [currentKey, ...rest] = keyList;
    const arrayMatch = currentKey.match(/^(\w+)\[(\d+)\]$/);

    if (arrayMatch) {
      const [, arrayKey, indexStr] = arrayMatch;
      const index = parseInt(indexStr, 10);
      const newArray = [...(obj[arrayKey] || [])];
      newArray[index] = processKeys(newArray[index] || {}, rest, val);
      return { ...obj, [arrayKey]: newArray };
    } else {
      return {
        ...obj,
        [currentKey]: processKeys(obj[currentKey] || {}, rest, val),
      };
    }
  };

  return processKeys(newState, keys, value);
};

const useCreateStrategy = () => {
  const navigate = useNavigate();

  const [marketBias, setMarketBias] = useState("bullish");
  const { companyDetails } = useSelector((state) => state.companyDetails);

  const handleMarketBias = (bias) => {
    setMarketBias(bias);
  };

  const [strategyState, setStrategyState] = useState({
    COAID: 0,
    IdentifierID: 0,
    CustomerBrokerID: 0,
    ProductName: "",
    IdentifierName: "",
    StrategyName: "",
    StratergyID: "",
    LotSize: 0,
    freezeQty: null,
    CustomerId: Storage.decryptData(localStorage.getItem("customerID")),
    CompanyId: companyDetails?.companyID,
    AlgoType: "NSE",
    customerBrokerToken: Storage.decryptData(localStorage.getItem("customerID")),
    customerToken: Storage.decryptData(localStorage.getItem("tokenID")) || "",
    strategyType: "indicator-based",
    ProductType: "MIS",
    candleType: null,
    StartTime: "09:16",
    SquareoffTime: "15:30",
    selectedDays: ["MON"],
    EndTime: "15:30",
    transactionType: "both-side",
    chartType: "candle",
    interval: "1-min",
    activeButton: "bullish",
    qaCustomCustomerOptionsAlgoChild: [],
    LotQTy: 0,
    ExpiryDate: "",
    IsActive: true,
    Createddate: "",

    // Entry Conditions
    entryConditions: {
      useCombinedChart: false,
      conditionGroups: [
        {
          id: 1,
          longEntry: {
            indicator1: "",
            comparator: "",
            period: 14,
            multiplier: 3,
            threshold: "",
            overboughtThreshold: "",
            // EMA_4 fields
            period1: 20,
            period2: 50,
            period3: 100,
            period4: 200,
            ema4Line: 1,
            // Pivot HL fields
            pivotLeftBars: 5,
            pivotRightBars: 5,
            pivotType: 'high',
          },
          shortEntry: {
            indicator1: "",
            comparator: "",
            period: 14,
            multiplier: 3,
            threshold: "",
            overboughtThreshold: "",
            // EMA_4 fields
            period1: 20,
            period2: 50,
            period3: 100,
            period4: 200,
            ema4Line: 1,
            // Pivot HL fields
            pivotLeftBars: 5,
            pivotRightBars: 5,
            pivotType: 'high',
          },
        },
      ],
      groupOperators: [],
    },

    // Exit Conditions
    exitConditions: {
      enabled: false,
      conditionGroups: [
        {
          id: 1,
          longExit: {
            indicator1: "",
            comparator: "",
            period: 14,
            multiplier: 3,
            threshold: "",
            overboughtThreshold: "",
            // EMA_4 fields
            period1: 20,
            period2: 50,
            period3: 100,
            period4: 200,
            ema4Line: 1,
            // Pivot HL fields
            pivotLeftBars: 5,
            pivotRightBars: 5,
            pivotType: 'high',
          },
          shortExit: {
            indicator1: "",
            comparator: "",
            period: 14,
            multiplier: 3,
            threshold: "",
            overboughtThreshold: "",
            // EMA_4 fields
            period1: 20,
            period2: 50,
            period3: 100,
            period4: 200,
            ema4Line: 1,
            // Pivot HL fields
            pivotLeftBars: 5,
            pivotRightBars: 5,
            pivotType: 'high',
          },
        },
      ],
      groupOperators: [],
    },

    rmProfitExitAmount: "",
    rmLossExitAmount: "",
    MoveSlToCost: false,
    MoveSlToCostIncreaseOf: "",
    MoveSlToCostTrailBy: "",
    ProfitTrailing: true,
    PTLockIfProfitReaches: "",
    PTLockProfitAt: "",
    isInstrumentModalOpen: false,
    instrumentCategory: "",
    isLoadingSymbols: false,
    symbolProduct: "",
    defaultExpiry: "",
    defaultStrike: "",
    defaultLtp: 0.0,
    defaultIdentifier: "",
    addByAdmin: false,
    tradeLimit: null,
  });

  const handleChange = useCallback(
    (e) => {
      let name, value, type, checked;

      if (e && e.target) {
        ({ name, value, type, checked } = e.target);
      } else if (e && e.name) {
        name = e.name;
        value = e.value;
        type = e.type || "text";
        checked = e.checked;
      } else {
        return;
      }

      const finalValue = type === "checkbox" ? checked : value;

      if (name.includes(".") || name.includes("[")) {
        setStrategyState((prevState) => {
          return updateNestedState(prevState, name, finalValue);
        });
      } else {
        setStrategyState((prevState) => ({
          ...prevState,
          [name]: finalValue,
        }));
      }
    },
    []
  );

  return {
    strategyState,
    setStrategyState,
    handleChange,
    marketBias,
    handleMarketBias,
  };
};

export default useCreateStrategy;
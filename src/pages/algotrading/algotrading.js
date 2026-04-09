import {
  fetchSymbolExpiryList,
  fetchSymbolLotSize,
  fetchWatchList,
} from "#utils/watchList";
import React, { useCallback, useEffect, useState, useMemo } from "react";
import { algoTradingObj } from "./contant"; 
import { useNavigate } from "react-router-dom";
import {
  asyncGetOptionListCE,
  asyncGetOptionListPE,
} from "#redux/optionChain/optionChainAction.js";
import { handleCatchErrors } from "#utils/validation";
import { asyncPostStrategyBuilder } from "#redux/treading/action.js";
import { successMsg, errorMsg } from "#utils/helpers";
import { asyncGetCustBrokerConfig } from "#redux/symbol/symbolAction.js";

const useAlgoTrading = () => {
  const [watchList, setWatchList] = useState([]);
  const [algoTrading, setAlgoTrading] = useState(algoTradingObj);
  const navigate = useNavigate();
  const [lotSize, setLotSize] = useState("");
  const [symbolProduct, setSymbolProduct] = useState("");
  const [expiryList, setExpiryList] = useState([]);
  const [strikePriceListArr, setStrikePriceListArr] = useState([]);
  const [futStrikePriceListArr, setFutStrikePriceListArr] = useState([]);
  const [strikePriceCEList, setStrikePriceCEList] = useState([]);
  const [strikePricePEList, setStrikePricePEList] = useState([]);
  const [isActive, setIsActive] = useState(false);
  const [isBoxReplacementVisible, setIsBoxReplacementVisible] = useState(true);
  const [formErrors, setFormErrors] = useState({});
  const [qty, setQty] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState("");
  const [priceType, setPriceType] = useState("price");
  const [spotFutPrice, setSpotFutPrice] = useState({
    spot: 0.0,
    future: 0.0,
  });
  const [brokerList, setBrokerList] = useState([]);
  const [fixedStrategyPayoffs, setFixedStrategyPayoffs] = useState({
    maxProfit: 0,
    maxLoss: 0,
    breakeven: 0,
    breakevenPercentage: 0
  });
  const [fixedLegPrices, setFixedLegPrices] = useState([]);

  const [defaultLegs, setDefaultLegs] = useState({
    b_s: "BUY",
    instrument: "CE",
    expiry: "",
    strikePriceList: [],
    lot: "",
    ltp: 0.0,
    strike: "",
  });

  const getWatchlist = useCallback(async () => {
    const data = await fetchWatchList(
      { categoryID: 5, identifier: "" },
      navigate
    );
    if (data?.length > 0) {
      setWatchList(data);
      const symbolIdentifierId = data[0]?.symbolIdentifierId;
      const product = data[0]?.product;
      const identifier = data[0]?.identifier;
      setAlgoTrading((prevState) => ({
        ...prevState,
        strategyReq: {
          ...prevState["strategyReq"],
          symbolIdentifierID: data[0]?.symbolIdentifierId,
        },
      }));

      const lotSize = await getLotSize(symbolIdentifierId);

      let expiryList = [];

      setSymbolProduct(product);
      expiryList = await getSymbolExpiryList(product);

      if (expiryList.length && lotSize) {
        const strikePriceList = await getStrikePrice(expiryList[0], product);

        // Find ATM strike
        let strikeData = null;
        if (strikePriceList && Array.isArray(strikePriceList) && strikePriceList.length > 0) {
          // First try to find item with product == "ATM"
          strikeData = strikePriceList.find((item) => item.product == "ATM");
          
          // If not found, use the middle strike price as ATM
          if (!strikeData) {
            const middleIndex = Math.floor(strikePriceList.length / 2);
            strikeData = strikePriceList[middleIndex];
          }
        }
        setDefaultLegs({
          ...defaultLegs,
          expiry: expiryList[0],
          lot: lotSize?.quotationLot,
          strikePriceList: strikePriceList,
          strike: strikeData?.strikePrice,
          ltp: strikeData?.lastTradePrice,
          identifier: strikeData?.identifier,
        });
        setQty(lotSize?.quotationLot);

        setSpotFutPrice({
          ...spotFutPrice,
          spot: identifier,
          future: `${identifier}-1`,
        });
      }
    }
  }, [navigate]);

  const getBrokersList = useCallback(async () => {
    try {
      const result = await asyncGetCustBrokerConfig({ sendData: "" });
      const activeBroker = result?.data?.result?.filter(
        (b) => b.status === true
      );
      setBrokerList((prev) => {
        const isSame = JSON.stringify(prev) === JSON.stringify(activeBroker);
        return isSame ? prev : activeBroker;
      });
    } catch (err) {
      handleCatchErrors(err, navigate);
    }
  }, [navigate]);

  useEffect(() => {
    getWatchlist();
    getBrokersList();
  }, [navigate]);

  const getLotSize = useCallback(
    async (symbolIdentifierId) => {
      const lotSize = await fetchSymbolLotSize(
        { identifierid: symbolIdentifierId },
        navigate
      );
      setLotSize(lotSize);
      return lotSize;
    },
    [navigate]
  );

  const getSymbolExpiryList = useCallback(
    async (strProduct) => {
      const expiryData = await fetchSymbolExpiryList({ strProduct }, navigate);
      expiryData?.reverse();
      setExpiryList(expiryData);
      return expiryData;
    },
    [navigate]
  );

  const handleDefaultLegsChange = async (e) => {
    const { name, value } = e.target;
    if (name == "strike") {
      if (value) {
        const strikeData = defaultLegs?.strikePriceList && Array.isArray(defaultLegs.strikePriceList) ? defaultLegs.strikePriceList.find(
          (item) => item.strikePrice == value
        ) : null;
        setDefaultLegs({
          ...defaultLegs,
          [name]: value,
          ltp: strikeData?.lastTradePrice,
          identifier: strikeData?.identifier,
        });
      }
    } else if (name == "instrument") {
      if (value) {
        let strikeData = "";
        if (value == "CE") {
          strikeData = strikePriceCEList.find(
            (item) => item.strikePrice == defaultLegs?.strike
          );
        }
        if (value == "PE") {  
          let strikeList = strikePricePEList?.length
            ? strikePricePEList
            : await getStrikePrice("", "", value);
          strikeData = strikeList.find(
            (item) => item.strikePrice == defaultLegs?.strike
          );
        }

      

        setDefaultLegs({
          ...defaultLegs,
          [name]: value,
          ltp: strikeData?.lastTradePrice,
          identifier: strikeData?.identifier,
        });
      }
    } else {
      setDefaultLegs({ ...defaultLegs, [name]: value });
    }
  };

  const handleChange = useCallback(
    async (e) => {
      e.preventDefault();
      const { name, value, type, checked } = e.target;

      const matches = name.match(/^(\w+)\[(\w+)\]$/);

      if (!matches) return;

      const [_, objectKey, fieldKey] = matches;

      setAlgoTrading((prevState) => ({
        ...prevState,
        [objectKey]: {
          ...prevState[objectKey],
          [fieldKey]: type == "checkbox" ? checked : value,
        },
      }));

      if (fieldKey == "symbolIdentifierID") {
        // Clear all strategy data when symbol changes
        setSelectedStrategy("");
        setFixedStrategyPayoffs({
          maxProfit: 0,
          maxLoss: 0,
          breakeven: 0,
          breakevenPercentage: 0
        });
        setFixedLegPrices([]);
        setAlgoTrading((prevState) => ({
          ...prevState,
          trendLegMasterRequests: [],
          totalMargin: 0,
          totalSpread: 0
        }));
        
        if (value) {
          const lotSize = await getLotSize(value);
          const findData = watchList && Array.isArray(watchList) ? watchList.find(
            (item) => item.symbolIdentifierId == value
          ) : null;
          let expiryList = [];
          if (findData) {
            setSymbolProduct(findData?.product);
            expiryList = await getSymbolExpiryList(findData?.product);
          }
          if (expiryList.length && lotSize) {
            const strikePriceList = await getStrikePrice(
              expiryList[0],
              findData?.product
            );

            // Find ATM strike
            let strikeData = null;
            if (strikePriceList && Array.isArray(strikePriceList) && strikePriceList.length > 0) {
              // First try to find item with product == "ATM"
              strikeData = strikePriceList.find((item) => item.product == "ATM");
              
              // If not found, use the middle strike price as ATM
              if (!strikeData) {
                const middleIndex = Math.floor(strikePriceList.length / 2);
                strikeData = strikePriceList[middleIndex];
              }
            }
            setDefaultLegs({
              ...defaultLegs,
              expiry: expiryList[0],
              lot: lotSize?.quotationLot,
              strikePriceList: strikePriceList,
              strike: strikeData?.strikePrice,
              ltp: strikeData?.lastTradePrice,
              identifier: strikeData?.identifier,
            });
            setQty(lotSize?.quotationLot);
            const watchData = watchList && Array.isArray(watchList) ? watchList.find(
              (item) => item.symbolIdentifierId == value
            ) : null;

            if (watchData) {
              setSpotFutPrice({
                ...spotFutPrice,
                spot: watchData?.identifier,
                future: `${watchData?.product}-1`,
              });
            }

            // Strategy will be created manually when user clicks on strategy buttons
          }
        } else {
          setLotSize("");
          setSymbolProduct("");
          setExpiryList([]);
          // Clear strategy when symbol is deselected
          setSelectedStrategy("");
          setAlgoTrading((prev) => ({
            ...prev,
            trendLegMasterRequests: [],
          }));
        }
      }

      setFormErrors({ ...formErrors, [name]: "" });
    },
    [
      formErrors,
      getLotSize,
      watchList,
      getSymbolExpiryList,
      defaultLegs,
      spotFutPrice,
    ]
  );

  const handleRemedyStrategy = () => {
          if (algoTrading?.strategyReq?.symbolIdentifierID > 0) {
      setIsActive(true);
      setIsBoxReplacementVisible(true);
    } else {
      setFormErrors({
        ...formErrors,
        "strategyReq[symbolIdentifierID]": "Please Choose Symbol",
      });
    }
  };

  const handleCloseRemedyStrategy = () => {
    setIsActive(false);
    setIsBoxReplacementVisible(false);
  };

  const getStrikePrice = async (
    expiry = "",
    product = "",
    instrumentType = ""
  ) => {
    const reqData = {
      strExpiry: expiry ? expiry : defaultLegs?.expiry,
      strProduct: product ? product : symbolProduct,
    };

    const instrument = instrumentType
      ? instrumentType
      : defaultLegs?.instrument;

    let strikeList = [];
    if (reqData?.strProduct && reqData?.strExpiry) {
      if (instrument == "CE") {
        const result = await asyncGetOptionListCE({ formData: reqData });
        strikeList = result?.data?.result;
        setStrikePriceCEList(strikeList);
      }

      if (instrument == "PE") {
        const result = await asyncGetOptionListPE({ formData: reqData });
        strikeList = result?.data?.result;
        setStrikePricePEList(strikeList);
      }
    }
    return strikeList;
  };

  const handleQtyChange = (type, index = -1, future = "") => {
    if (index < 0) { 
      const lotSize = parseInt(defaultLegs?.lot);
      if (type === "increment") setQty(parseInt(qty) + lotSize);
      else if (type === "decrement" && qty > lotSize)
        setQty(parseInt(qty) - lotSize);
    } else {
      if (future != "") {
        let lotSize =
          algoTrading?.trendLegMasterRequests[index]?.adjustment[future];

        if (type === "increment") {
          lotSize = parseInt(lotSize) + parseInt(defaultLegs?.lot);
        } else if (
          type === "decrement" &&
          lotSize > parseInt(defaultLegs?.lot)
        ) {
          lotSize = parseInt(lotSize) - parseInt(defaultLegs?.lot);
        }

        setAlgoTrading((prevState) => {
          const updatedArray = [...prevState["trendLegMasterRequests"]];

          // Get existing item and its adjustment
          const currentItem = updatedArray[index];
          const updatedAdjustment = {
            ...currentItem.adjustment,
            [future]: lotSize,
          };

          // Replace the item with updated adjustment
          updatedArray[index] = {
            ...currentItem,
            adjustment: updatedAdjustment,
          };

          return {
            ...prevState,
            trendLegMasterRequests: updatedArray,
          };
        });
      } else {
        let lotSize = algoTrading?.trendLegMasterRequests[index]["quantity"];

        if (type === "increment") {
          lotSize = parseInt(lotSize) + parseInt(defaultLegs?.lot);
        } else if (
          type === "decrement" &&
          lotSize > parseInt(defaultLegs?.lot)
        ) {
          lotSize = parseInt(lotSize) - parseInt(defaultLegs?.lot);
        }

        setAlgoTrading((prevState) => {
          const updatedArray = [...prevState["trendLegMasterRequests"]];
          updatedArray[index] = {
            ...updatedArray[index],
            ["quantity"]: lotSize,
          };

          return {
            ...prevState,
            ["trendLegMasterRequests"]: updatedArray,
          };
        });
      }
    }
  };

  const addLeg = () => {
    // Check if a default strategy is already created
    if (selectedStrategy && selectedStrategy !== "") {
      errorMsg("You cannot add custom legs to a default strategy. Please clear the strategy first.");
      return;
    }

    // Check maximum leg limit (9 legs)
    const currentLegCount = algoTrading?.trendLegMasterRequests?.length || 0;
    if (currentLegCount >= 9) {
      errorMsg("You cannot add more than 9 legs. Maximum limit reached.");
      return;
    }

    try {
      const legObj = {
        trendLegId: 0,
        action: defaultLegs?.b_s,
        instrument: defaultLegs?.instrument,
        expiryDate: defaultLegs?.expiry,
        strikePrice: defaultLegs?.strike,
        identifier: defaultLegs?.identifier,
        quantity: qty,
        lastTradedPrice: defaultLegs?.ltp,
        entryPrice: defaultLegs?.ltp, // Store entry price for MTM calculation
        adjustmentName: null,
        isPremiumEntry: false,
        premiumRange: "",
        premiumRangeFrom: 0,
        premiumRangeTo: 0,
        adjustment: {
          sqTarget: 0,
          sqStopLoss: 0,
          sqTrailingProfit: 0,
          sqTrailingLoss: 0,
          sqUnitOfChange: "Point",
          fsNoOfTimes: 0,
          fsUnitOfChange: "",
          fsFuturePointsUp: 0,
          fsfpuAction: "",
          fsfpuInstrument: "",
          fsfpuStrikePrice: defaultLegs?.strike,
          fsfpuExpiryDate: "",
          fsfpuQuantity: qty,
          fsFuturePointsDown: 0,
          fsfpdAction: "",
          fsfpdInstrument: "",
          fsfpdStrikePrice: defaultLegs?.strike,
          fsfpdExpiryDate: "",
          fsfpdQuantity: qty,
          reNoOfTimes: 0,
          reUnitOfChange: "",
          reTarget: 0,
          reTargetType: "",
          reStopLoss: 0,
          reStopLossType: "",
        },
      };

      setStrikePriceListArr([
        ...strikePriceListArr,
        defaultLegs?.strikePriceList,
      ]);

      setFutStrikePriceListArr([
        ...futStrikePriceListArr,
        {
          up: defaultLegs?.strikePriceList,
          down: defaultLegs?.strikePriceList,
        },
      ]);
      setAlgoTrading((prevState) => ({
        ...prevState,
        trendLegMasterRequests: [...prevState.trendLegMasterRequests, legObj],
      }));
      
      successMsg("New leg added successfully!");
    } catch (error) {
      errorMsg("Failed to add leg. Please try again.");
    }
  };

  const handleChildLegChange = async (e) => {
    const { name, value, type, checked } = e.target;

    // Parse "trendLegMasterRequests[0].action"
    const matches = name.match(/^(\w+)\[(\d+)\]\.(\w+)$/);

    if (!matches) return;

    const [_, arrayKey, indexStr, fieldKey] = matches;
    const index = parseInt(indexStr, 10);

    if (fieldKey == "strikePrice") {
      const strikeData = strikePriceListArr[index].find(
        (item) => item.strikePrice == value
      );

      setAlgoTrading((prevState) => {
        const updatedArray = [...prevState[arrayKey]];
        updatedArray[index] = {
          ...updatedArray[index],
          [fieldKey]: value,
          lastTradedPrice: strikeData?.lastTradePrice,
        };

        return {
          ...prevState,
          [arrayKey]: updatedArray,
        };
      });
    } else {
      if (fieldKey == "instrument") {
        let strikePriceList = [];

        const list = value == "CE" ? strikePriceCEList : strikePricePEList;
        strikePriceList = list?.length
          ? list
          : await getStrikePrice("", "", value);

        const strikeData = strikePriceList.find(
          (item) => item.product === "ATM"
        );
        const updatedArray = [...strikePriceListArr];

        // Update the element at the specific index
        updatedArray[index] = strikePriceList; // or whatever data you want to set

        // Set the updated array back to state
        setStrikePriceListArr(updatedArray);

        setAlgoTrading((prevState) => {
          const updatedArray = [...prevState[arrayKey]];
          updatedArray[index] = {
            ...updatedArray[index],
            [fieldKey]: type == "checkbox" ? checked : value,
            strikePrice: strikeData?.strikePrice,
            lastTradedPrice: strikeData?.lastTradePrice,
            identifier: strikeData?.identifier,
          };

          return {
            ...prevState,
            [arrayKey]: updatedArray,
          };
        });
      } else {
        setAlgoTrading((prevState) => {
          const updatedArray = [...prevState[arrayKey]];
          updatedArray[index] = {
            ...updatedArray[index],
            [fieldKey]: type == "checkbox" ? checked : value,
          };

          return {
            ...prevState,
            [arrayKey]: updatedArray,
          };
        });
      }
    }
  };

  const handleAdjustmentChange = async (e, index) => {
    const { name, value, type, checked } = e.target;
    const field = name; // example: "adjustmentName", "someOtherKey"

    const inputValue = type === "checkbox" ? checked : value;

    let strikeData = {};
    if (name == "fsfpdInstrument") {
      let strikePriceList = [];

      const list = value == "CE" ? strikePriceCEList : strikePricePEList;
      strikePriceList = list?.length
        ? list
        : await getStrikePrice("", "", value);

      strikeData = strikePriceList.find((item) => item.product === "ATM");

      const updatedArray = [...futStrikePriceListArr];

      // Update the element at the specific index
      updatedArray[index]["down"] = strikePriceList; // or whatever data you want to set
      setFutStrikePriceListArr(updatedArray);
    }

    if (name == "fsfpuInstrument") {
      let strikePriceList = [];

      const list = value == "CE" ? strikePriceCEList : strikePricePEList;
      strikePriceList = list?.length
        ? list
        : await getStrikePrice("", "", value);
      strikeData = strikePriceList.find((item) => item.product === "ATM");

      const updatedArray = [...futStrikePriceListArr];

      // Update the element at the specific index
      updatedArray[index]["up"] = strikePriceList; // or whatever data you want to set
      setFutStrikePriceListArr(updatedArray);
    }

    setAlgoTrading((prevState) => {
      const updatedArray = [...prevState.trendLegMasterRequests];
      const currentLeg = { ...updatedArray[index] };

      // Ensure adjustment object exists
      const adjustment = { ...(currentLeg.adjustment || {}) };

      adjustment[field] = inputValue;
      if (field == "fsfpdInstrument") {
        adjustment["fsfpdStrikePrice"] = strikeData?.strikePrice;
      }
      if (field == "fsfpuStrikePrice") {
        adjustment["fsfpuStrikePrice"] = strikeData?.strikePrice;
      }
      currentLeg.adjustment = adjustment;
      updatedArray[index] = currentLeg;

      return {
        ...prevState,
        trendLegMasterRequests: updatedArray,
      };
    });
  };

  const handelSubmit = async () => {
    try {
      setIsLoading(true);
      await asyncPostStrategyBuilder({ formData: algoTrading })
        .then(async (result) => {
          successMsg("Strategy saved successfully!");
        })
        .catch((err) => {
          handleCatchErrors(err, navigate);
        });
    } catch (error) {
      errorMsg("Failed to save strategy. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  const handlePriceType = (type) => {
    setPriceType(type);
  };

  // get default legs strike price
  useEffect(() => {
    const fetchStrikePrices = async () => {
      try {
        let strikePriceList = [];

        strikePriceList = strikePriceCEList?.length
          ? strikePriceCEList
          : await getStrikePrice("", "", "CE");
        const strikeData = strikePriceList.find(
          (item) => item.product === "ATM"
        );

        setDefaultLegs((prev) => ({
          ...prev,
          strikePriceList: strikePriceList,
          strike: strikeData?.strikePrice,
          ltp: strikeData?.lastTradePrice,
          identifier: strikeData?.identifier,
        }));
      } catch (error) {
        // Failed to fetch strike prices
      }
    };

    fetchStrikePrices();
  }, [defaultLegs?.instrument]);

  const setLegsFn = async (type) => {
    
    if (type == selectedStrategy) {
      return;
    }
    setStrikePriceListArr([]); // clears the strike price list
    setFutStrikePriceListArr([]); // clears the future strike price list
    setFixedStrategyPayoffs({
      maxProfit: 0,
      maxLoss: 0,
      breakeven: 0,
      breakevenPercentage: 0
    });
    setFixedLegPrices([]);
    setAlgoTrading((prev) => ({
      ...prev,
      trendLegMasterRequests: [], // clears the array in algo state
      totalMargin: 0,
      totalSpread: 0
    }));
    
    
    setSelectedStrategy(type);

    let times = 1;
    let strategyName = "";
    
    if (
      type == "bC_spread" ||
      type == "long_straddle" ||
      type == "short_straddle" ||
      type == "bear_put" ||
      type == "short_strangle"
    ) {
      times = 2;
    }

    if (type == "iron_butter" || type == "short_iron") {
      times = 4;
    }

    // Set strategy name for notification
    switch(type) {
      case "naked_ce":
        strategyName = "Naked CE";
        break;
      case "bC_spread":
        strategyName = "Bull Call Spread";
        break;
      case "long_straddle":
        strategyName = "Long Straddle";
        break;
      case "iron_butter":
        strategyName = "Iron Butterfly";
        break;
      case "short_iron":
        strategyName = "Short Iron Condor";
        break;
      case "short_straddle":
        strategyName = "Short Straddle";
        break;
      case "short_strangle":
        strategyName = "Short Strangle";
        break;
      case "bear_put":
        strategyName = "Bear Put Spread";
        break;
      default:
        strategyName = "Strategy";
    }


    const CEStrikeList = strikePriceCEList?.length
      ? strikePriceCEList
      : await getStrikePrice("", "", "CE");
    const PEStrikeList = strikePricePEList?.length
      ? strikePricePEList
      : await getStrikePrice("", "", "PE");
    for (let i = 0; i < times; i++) {
      const atmIndex = defaultLegs?.strikePriceList && Array.isArray(defaultLegs.strikePriceList) ? defaultLegs.strikePriceList.findIndex(
        (item) => item.product === "ATM"
      ) : -1;

      let index = 3;
      let b_s = "BUY";
      let instrument = "CE";
      let strikePriceList = CEStrikeList;
      if (i == 1 && type == "bC_spread") {
        index = 5;
        b_s = "SELL";
      }
      if (type == "long_straddle") {
        if (i == 1) {
          instrument = "PE";
          strikePriceList = PEStrikeList;
        }
        index = 1;
      }

      if (type == "iron_butter") {
        if (i == 0) {
          b_s = "SELL";
          index = 1;
        }
        if (i == 1) {
          b_s = "SELL";
          index = 1;
          instrument = "PE";
          strikePriceList = PEStrikeList;
        }
        if (i == 2) {
          index = 4;
        }
        if (i == 3) {
          index = 4;
          instrument = "PE";
          strikePriceList = PEStrikeList;
        }
      }

      if (type == "short_iron") {
        if (i == 0) {
          b_s = "SELL";
          index = 2;
        }
        if (i == 1) {
          b_s = "SELL";
          index = 2;
          instrument = "PE";
          strikePriceList = PEStrikeList;
        }
        if (i == 2) {
          index = 6;
        }
        if (i == 3) {
          index = 6;
          instrument = "PE";
          strikePriceList = PEStrikeList;
        }
      }

      if (type == "short_straddle") {
        if (i == 0) {
          b_s = "SELL";
          index = 1;
        }
        if (i == 1) {
          b_s = "SELL";
          index = 1;
          instrument = "PE";
          strikePriceList = PEStrikeList;
        }
      }

      if (type == "naked_pe") {
        b_s = "BUY";
        index = 1;
        instrument = "PE";
        strikePriceList = PEStrikeList;
      }

      if (type == "bear_put") {
        instrument = "PE";
        strikePriceList = PEStrikeList;
        if (i == 0) {
          index = 1;
        }
        if (i == 1) {
          b_s = "SELL";
          index = 6;
        }
      }

      if (type == "short_strangle") {
        b_s = "SELL";
        index = 6;

        if (i == 1) {
          instrument = "PE";
          strikePriceList = PEStrikeList;
        }
      }

      let lastObjData = null;
      
      // For naked_ce, naked_pe and first leg of bull_call, use the exact ATM strike from defaultLegs
      if (type === "naked_ce" || type === "naked_pe" || (type === "bC_spread" && i === 0)) {
        lastObjData = {
          strikePrice: defaultLegs?.strike,
          lastTradePrice: defaultLegs?.ltp,
          identifier: defaultLegs?.identifier
        };
      } else if (type === "bC_spread" && i === 1) {
        // For second leg of bull_call, find higher strike (+200 points away)
        const atmStrike = parseFloat(defaultLegs?.strike) || 0;
        const higherStrike = atmStrike + 200; // +200 points away
        
        // Find the closest available strike to the calculated higher strike
        lastObjData = strikePriceList.find(item => 
          Math.abs(parseFloat(item.strikePrice) - higherStrike) < 50
        ) || strikePriceList[strikePriceList.length - 1]; // fallback to last strike
      } else if (type === "long_straddle") {
        // For long_straddle, both legs use exact ATM from defaultLegs
        const atmStrike = defaultLegs?.strike;
        
        // Find the ATM strike in the current strike list (CE or PE)
        lastObjData = strikePriceList.find(item => 
          item.strikePrice == atmStrike
        ) || {
          strikePrice: atmStrike,
          lastTradePrice: defaultLegs?.ltp,
          identifier: defaultLegs?.identifier
        };
      } else if (type === "iron_butter") {
        // For iron_butter, use specific strike logic based on leg index
        const atmStrike = parseFloat(defaultLegs?.strike) || 0;
        let targetStrike = atmStrike;
        
        if (i === 0) {
          // Leg 1: SELL ATM CE (25300 CE)
          targetStrike = atmStrike;
        } else if (i === 1) {
          // Leg 2: SELL ATM PE (25300 PE)
          targetStrike = atmStrike;
        } else if (i === 2) {
          // Leg 3: BUY OTM CE (+200 points = 25500 CE)
          targetStrike = atmStrike + 200;
        } else if (i === 3) {
          // Leg 4: BUY OTM PE (-200 points = 25100 PE)
          targetStrike = atmStrike - 200;
        }
        
        // Find the closest available strike to the target strike
        lastObjData = strikePriceList.find(item => 
          Math.abs(parseFloat(item.strikePrice) - targetStrike) < 50
        ) || {
          strikePrice: targetStrike,
          lastTradePrice: defaultLegs?.ltp,
          identifier: defaultLegs?.identifier
        };
      } else if (type === "short_iron") {
        // For short_iron, use specific strike logic based on leg index
        const atmStrike = parseFloat(defaultLegs?.strike) || 0;
        let targetStrike = atmStrike;
        
        if (i === 0) {
          // Leg 1: SELL OTM CE (+200 points = 25500 CE)
          targetStrike = atmStrike + 200;
        } else if (i === 1) {
          // Leg 2: SELL OTM PE (-200 points = 25100 PE)
          targetStrike = atmStrike - 200;
        } else if (i === 2) {
          // Leg 3: BUY Far OTM CE (+400 points = 25700 CE)
          targetStrike = atmStrike + 400;
        } else if (i === 3) {
          // Leg 4: BUY Far OTM PE (-400 points = 24900 PE)
          targetStrike = atmStrike - 400;
        }
        
        // Find the closest available strike to the target strike
        lastObjData = strikePriceList.find(item => 
          Math.abs(parseFloat(item.strikePrice) - targetStrike) < 50
        ) || {
          strikePrice: targetStrike,
          lastTradePrice: defaultLegs?.ltp,
          identifier: defaultLegs?.identifier
        };
      } else if (type === "short_straddle") {
        // For short_straddle, both legs use exact ATM from defaultLegs
        const atmStrike = defaultLegs?.strike;
        
        // Find the ATM strike in the current strike list (CE or PE)
        lastObjData = strikePriceList.find(item => 
          item.strikePrice == atmStrike
        ) || {
          strikePrice: atmStrike,
          lastTradePrice: defaultLegs?.ltp,
          identifier: defaultLegs?.identifier
        };
      } else if (type === "bear_put") {
        // For bear_put, use specific strike logic based on leg index
        const atmStrike = parseFloat(defaultLegs?.strike) || 0;
        let targetStrike = atmStrike;
        
        if (i === 0) {
          // Leg 1: BUY ATM PE (25300 PE)
          targetStrike = atmStrike;
        } else if (i === 1) {
          // Leg 2: SELL Lower strike PE (-200 points = 25100 PE)
          targetStrike = atmStrike - 200;
        }
        
        // Find the closest available strike to the target strike
        lastObjData = strikePriceList.find(item => 
          Math.abs(parseFloat(item.strikePrice) - targetStrike) < 50
        ) || {
          strikePrice: targetStrike,
          lastTradePrice: defaultLegs?.ltp,
          identifier: defaultLegs?.identifier
        };
      } else if (type === "short_strangle") {
        // For short_strangle, use specific strike logic based on leg index
        const atmStrike = parseFloat(defaultLegs?.strike) || 0;
        let targetStrike = atmStrike;
        
        if (i === 0) {
          // Leg 1: SELL OTM CE (+200 points = 25500 CE)
          targetStrike = atmStrike + 200;
        } else if (i === 1) {
          // Leg 2: SELL OTM PE (-200 points = 25100 PE)
          targetStrike = atmStrike - 200;
        }
        
        // Find the closest available strike to the target strike
        lastObjData = strikePriceList.find(item => 
          Math.abs(parseFloat(item.strikePrice) - targetStrike) < 50
        ) || {
          strikePrice: targetStrike,
          lastTradePrice: defaultLegs?.ltp,
          identifier: defaultLegs?.identifier
        };
      } else {
        // For other strategies, use the index-based selection
        lastObjData = atmIndex !== -1
          ? strikePriceList.slice(atmIndex, atmIndex + index).slice(-1)[0] // last item of slice
          : null;
      }


      await new Promise((resolve) => {
        const legObj = {
          trendLegId: 0,
          action: b_s,
          instrument: instrument,
          expiryDate: defaultLegs?.expiry,
          strikePrice: lastObjData
            ? lastObjData?.strikePrice
            : defaultLegs?.strike,
          quantity: qty,
          lastTradedPrice: lastObjData
            ? lastObjData?.lastTradePrice
            : defaultLegs?.ltp,
          identifier: lastObjData
            ? lastObjData?.identifier
            : defaultLegs?.identifier,
          adjustmentName: null,
          isPremiumEntry: false,
          premiumRange: "",
          premiumRangeFrom: 0,
          premiumRangeTo: 0,
          adjustment: {
            sqTarget: 0,
            sqStopLoss: 0,
            sqTrailingProfit: 0,
            sqTrailingLoss: 0,
            sqUnitOfChange: "Point",
            fsNoOfTimes: 0,
            fsUnitOfChange: "",
            fsFuturePointsUp: 0,
            fsfpuAction: "",
            fsfpuInstrument: "",
            fsfpuStrikePrice: defaultLegs?.strike,
            fsfpuExpiryDate: "",
            fsfpuQuantity: qty,
            fsFuturePointsDown: 0,
            fsfpdAction: "",
            fsfpdInstrument: "",
            fsfpdStrikePrice: defaultLegs?.strike,
            fsfpdExpiryDate: "",
            fsfpdQuantity: qty,
            reNoOfTimes: 0,
            reUnitOfChange: "",
            reTarget: 0,
            reTargetType: "",
            reStopLoss: 0,
            reStopLossType: "",
          },
        };

        setStrikePriceListArr((prev) => [...prev, strikePriceList]);

        setFutStrikePriceListArr((prev) => [
          ...prev,
          {
            up: strikePriceList,
            down: strikePriceList,
          },
        ]);

        setAlgoTrading((prevState) => ({
          ...prevState,
          trendLegMasterRequests: [...prevState.trendLegMasterRequests, legObj],
        }));
        resolve();
      });
    }

    // Calculate and store fixed payoffs for this strategy
    setTimeout(() => {
      // Get the updated legs after they are added
      setAlgoTrading((prevState) => {
        const updatedLegs = prevState.trendLegMasterRequests;
        
        
        if (updatedLegs.length > 0) {
          // Store the leg prices at the time of strategy creation
          const currentLegPrices = updatedLegs.map(leg => {
            const price = leg.lastTradedPrice || 0;
            const numPrice = parseFloat(price);
            return isNaN(numPrice) ? 0 : numPrice;
          });
          
          setFixedLegPrices(currentLegPrices);
          
          // Calculate payoffs using the fixed leg prices (entry prices at strategy creation)
          const payoffs = calculateFixedPayoffs(type, updatedLegs, currentLegPrices);
          setFixedStrategyPayoffs(payoffs);
          
          
          successMsg(`${strategyName} strategy configured successfully with ${times} leg${times > 1 ? 's' : ''}!`);
        } else {
          // Retry after a longer delay
          setTimeout(() => {
            setAlgoTrading((retryState) => {
              const retryLegs = retryState.trendLegMasterRequests;
              if (retryLegs.length > 0) {
                const currentLegPrices = retryLegs.map(leg => {
                  const price = leg.lastTradedPrice || 0;
                  const numPrice = parseFloat(price);
                  return isNaN(numPrice) ? 0 : numPrice;
                });
                
                setFixedLegPrices(currentLegPrices);
                const payoffs = calculateFixedPayoffs(type, retryLegs, currentLegPrices);
                setFixedStrategyPayoffs(payoffs);
                successMsg(`${strategyName} strategy configured successfully with ${times} leg${times > 1 ? 's' : ''}!`);
              }
              return retryState;
            });
          }, 1000);
        }
        
        return prevState;
      });
    }, 1000); // Increased timeout to ensure state is updated
  };

  const [totalMargin, setTotalMargin] = useState(0);
  const [totalSpread, setTotalSpread] = useState(0);



  const calculateFixedPayoffs = (strategyType, legs, fixedPrices = null) => {
    if (!legs || legs.length === 0) {
      return { maxProfit: 0, maxLoss: 0, breakeven: 0, breakevenPercentage: 0 };
    }

    const atmStrike = parseFloat(defaultLegs?.strike) || 0;
    let maxProfit = 0;
    let maxLoss = 0;
    let breakeven = 0;
    let breakevenPercentage = 0;

    // Use provided fixed prices, or fallback to fixedLegPrices, or current leg prices
    const legPrices = fixedPrices || (fixedLegPrices.length > 0 ? fixedLegPrices : legs.map(leg => leg.lastTradedPrice || 0));
    
    
    // Ensure all leg prices are valid numbers
    const validLegPrices = legPrices.map(price => {
      const numPrice = parseFloat(price);
      return isNaN(numPrice) ? 0 : numPrice;
    });

    switch (strategyType) {
      case "naked_ce":
        // Long Call: Unlimited profit, Limited loss (premium paid)
        const cePremium = validLegPrices[0] || 0;
        const ceQty = parseInt(legs[0]?.quantity) || 0;
        // Max Profit = Unlimited (theoretically)
        maxProfit = Infinity; // Unlimited profit
        // Max Loss = Premium Paid × Lot Size
        maxLoss = cePremium * ceQty; // Net Premium Paid (fix)
        breakeven = atmStrike + cePremium; // Strike + Premium Paid
        breakevenPercentage = atmStrike > 0 ? (cePremium / atmStrike) * 100 : 0;
        
        break;

      case "naked_pe":
        // Long Put: Unlimited profit, Limited loss (premium paid)
        const pePremium = validLegPrices[0] || 0;
        const peQty = parseInt(legs[0]?.quantity) || 0;
        
        
        // Max Profit = Unlimited (theoretically)
        maxProfit = Infinity; // Unlimited profit
        // Max Loss = Premium Paid × Lot Size
        maxLoss = pePremium * peQty; // Net Premium Paid (fix)
        breakeven = atmStrike - pePremium; // Strike - Premium Paid
        breakevenPercentage = atmStrike > 0 ? (pePremium / atmStrike) * 100 : 0;
        
        break;

      case "bC_spread":
        // Bull Call Spread: Net Debit Strategy (2 legs)
        // Leg 1: BUY Long Strike CE (25300 CE) - Premium Paid
        // Leg 2: SELL Short Strike CE (25500 CE) - Premium Received
        
        const longStrike = atmStrike; // 25300 (Long Strike)
        const shortStrike = atmStrike + 200; // 25500 (Short Strike)
        const premiumPaid = validLegPrices[0] || 0; // 113.75 (Long Premium)
        const premiumReceived = validLegPrices[1] || 0; // 22.95 (Short Premium)
        const bCQty = parseInt(legs[0]?.quantity) || 0;
        
        // Net Premium Paid per lot = LP - SP
        const netPremiumPaidPerLot = premiumPaid - premiumReceived; // 113.75 - 22.95 = 90.8
        const totalNetPremiumPaid = netPremiumPaidPerLot * bCQty; // 90.8 × 75 = ₹6,810
        
        // Strike Difference = SS - LS
        const strikeDiffBC = shortStrike - longStrike; // 25500 - 25300 = 200
        
        // Maximum Profit per lot = (SS - LS) - Net Premium Paid
        const maxProfitPerLot = strikeDiffBC - netPremiumPaidPerLot; // 200 - 90.8 = 109.2
        maxProfit = maxProfitPerLot * bCQty; // 109.2 × 75 = ₹8,190
        
        // Maximum Loss = Total Net Premium Paid
        maxLoss = totalNetPremiumPaid; // ₹6,810
        
        // Breakeven = LS + Net Premium Paid
        breakeven = longStrike + netPremiumPaidPerLot; // 25300 + 90.8 = 25390.8
        breakevenPercentage = longStrike > 0 ? (netPremiumPaidPerLot / longStrike) * 100 : 0;
        
        break;

      case "long_straddle":
        // Long Straddle: Net Debit Strategy (2 legs)
        // Leg 1: BUY ATM CE (25300 CE) - Premium Paid
        // Leg 2: BUY ATM PE (25300 PE) - Premium Paid
        
        const ceBuyPremium = validLegPrices[0] || 0; // 113.75 (CE Buy Premium)
        const peBuyPremium = validLegPrices[1] || 0; // 34.8 (PE Buy Premium)
        const strikePrice = atmStrike; // 25300 (Strike Price)
        const straddleQty = parseInt(legs[0]?.quantity) || 0; // 75 (Quantity)
        
        // Total Premium Paid per lot = CE Premium + PE Premium
        const totalPremiumPaidPerLot = ceBuyPremium + peBuyPremium; // 113.75 + 34.8 = 148.55
        const totalCost = totalPremiumPaidPerLot * straddleQty; // 148.55 × 75 = ₹11,141.25
        
        // Maximum Loss = Total Premium Paid × Quantity (when spot = strike at expiry)
        maxLoss = totalCost; // ₹11,141.25
        
        // Maximum Profit = Unlimited (theoretically)
        maxProfit = Infinity; // Unlimited both ways
        
        // Two breakeven points:
        // Upper Breakeven = Strike Price + Total Premium Paid per unit
        const upperBreakevenLS = strikePrice + totalPremiumPaidPerLot; // 25300 + 148.55 = 25448.55
        // Lower Breakeven = Strike Price - Total Premium Paid per unit  
        const lowerBreakevenLS = strikePrice - totalPremiumPaidPerLot; // 25300 - 148.55 = 25151.45
        
        // Show both breakeven points - ensure values are numbers before calling toFixed
        const upperBE = typeof upperBreakevenLS === 'number' && isFinite(upperBreakevenLS) ? upperBreakevenLS : 0;
        const lowerBE = typeof lowerBreakevenLS === 'number' && isFinite(lowerBreakevenLS) ? lowerBreakevenLS : 0;
        breakeven = `${upperBE.toFixed(0)} / ${lowerBE.toFixed(0)}`;
        breakevenPercentage = strikePrice > 0 ? (totalPremiumPaidPerLot / strikePrice) * 100 : 0;
        
        break;

      case "short_straddle":
        // Short Straddle: Net Credit Strategy (2 legs) - Unlimited loss risk
        // Leg 1: SELL ATM CE (25300 CE) - Premium Received
        // Leg 2: SELL ATM PE (25300 PE) - Premium Received
        
        const ceShort = validLegPrices[0] || 0;
        const peShort = validLegPrices[1] || 0;
        const shortQty = parseInt(legs[0]?.quantity) || 0;
        const totalCreditPerLot = ceShort + peShort;
        const totalCredit = totalCreditPerLot * shortQty; // Net Premium Received
        
        maxProfit = totalCredit; // Net Premium Received
        maxLoss = Infinity; // Unlimited loss risk (naked positions)
        
        // Two breakevens: Upper = Strike + Total Credit, Lower = Strike - Total Credit
        const upperBreakevenShort = atmStrike + totalCreditPerLot;
        const lowerBreakevenShort = atmStrike - totalCreditPerLot;
        
        // Show both breakeven points - ensure values are numbers before calling toFixed
        const upperBEShort = typeof upperBreakevenShort === 'number' && isFinite(upperBreakevenShort) ? upperBreakevenShort : 0;
        const lowerBEShort = typeof lowerBreakevenShort === 'number' && isFinite(lowerBreakevenShort) ? lowerBreakevenShort : 0;
        breakeven = `${upperBEShort.toFixed(0)} / ${lowerBEShort.toFixed(0)}`;
        breakevenPercentage = atmStrike > 0 ? (totalCreditPerLot / atmStrike) * 100 : 0;
        
        break;

      case "bear_put":
        // Bear Put Spread: Net Debit Strategy (2 legs)
        // Leg 1: BUY ATM PE (25300 PE) - Premium Paid
        // Leg 2: SELL OTM PE (25100 PE) - Premium Received
        
        const buyPE = validLegPrices[0] || 0;
        const sellPE = validLegPrices[1] || 0;
        const bearQty = parseInt(legs[0]?.quantity) || 0;
        const netDebitPEPerLot = buyPE - sellPE; // Net Premium Paid per lot
        const netDebitPE = netDebitPEPerLot * bearQty; // Total Net Premium Paid
        const strikeDiffPE = 200; // -200 points difference (25300 - 25100)
        
        maxProfit = (strikeDiffPE - netDebitPEPerLot) * bearQty; // Strike diff - Net Debit
        maxLoss = netDebitPE; // Net Premium Paid (fix)
        breakeven = atmStrike - netDebitPEPerLot; // Higher Strike - Net Debit
        breakevenPercentage = atmStrike > 0 ? (netDebitPEPerLot / atmStrike) * 100 : 0;
        
        break;

      case "short_strangle":
        // Short Strangle: Net Credit Strategy (2 legs) - Unlimited loss risk
        // Leg 1: SELL OTM CE (25500 CE) - Premium Received
        // Leg 2: SELL OTM PE (25100 PE) - Premium Received
        
        const ceStrangle = validLegPrices[0] || 0;
        const peStrangle = validLegPrices[1] || 0;
        const strangleQty = parseInt(legs[0]?.quantity) || 0;
        const totalCreditStranglePerLot = ceStrangle + peStrangle;
        const totalCreditStrangle = totalCreditStranglePerLot * strangleQty; // Net Premium Received
        
        maxProfit = totalCreditStrangle; // Net Premium Received
        maxLoss = Infinity; // Unlimited loss risk (naked positions)
        
        // Two breakevens: Upper = Higher Strike + Total Credit, Lower = Lower Strike - Total Credit
        const upperStrikeStrangle = atmStrike + 200; // 25500
        const lowerStrikeStrangle = atmStrike - 200; // 25100
        const upperBreakevenStrangle = upperStrikeStrangle + totalCreditStranglePerLot;
        const lowerBreakevenStrangle = lowerStrikeStrangle - totalCreditStranglePerLot;
        
        // Show both breakeven points - ensure values are numbers before calling toFixed
        const upperBEStrangle = typeof upperBreakevenStrangle === 'number' && isFinite(upperBreakevenStrangle) ? upperBreakevenStrangle : 0;
        const lowerBEStrangle = typeof lowerBreakevenStrangle === 'number' && isFinite(lowerBreakevenStrangle) ? lowerBreakevenStrangle : 0;
        breakeven = `${upperBEStrangle.toFixed(0)} / ${lowerBEStrangle.toFixed(0)}`;
        breakevenPercentage = atmStrike > 0 ? (totalCreditStranglePerLot / atmStrike) * 100 : 0;
        
        break;

      case "iron_butter":
        // Iron Butterfly: Net Credit Strategy (4 legs)
        // Leg 1: SELL ATM CE (25300 CE) - Premium Received
        // Leg 2: SELL ATM PE (25300 PE) - Premium Received  
        // Leg 3: BUY OTM CE (25500 CE) - Premium Paid
        // Leg 4: BUY OTM PE (25100 PE) - Premium Paid
        
        const sellATMCE = validLegPrices[0] || 0;  // 113.75
        const sellATMPE = validLegPrices[1] || 0;  // 34.8
        const buyOTMCE = validLegPrices[2] || 0;   // 22.95
        const buyOTMPE = validLegPrices[3] || 0;   // 8.95
        const butterflyQty = parseInt(legs[0]?.quantity) || 0;
        
        // Net Premium = (Short CE + Short PE) - (Long CE + Long PE)
        const netPremiumPerLot = (sellATMCE + sellATMPE) - (buyOTMCE + buyOTMPE);
        const totalNetPremium = netPremiumPerLot * butterflyQty;
        
        // Maximum Profit = Net Premium Received (when price stays at ATM at expiry)
        maxProfit = totalNetPremium;
        
        // Maximum Loss = Strike Difference - Net Premium (when price moves beyond outer strikes)
        const strikeDifference = 200; // 25500 - 25300 = 200 points
        const maxLossPerLot = strikeDifference - netPremiumPerLot;
        maxLoss = maxLossPerLot * butterflyQty;
        
        // Breakeven Points: ATM Strike ± Net Premium
        const upperBreakeven = atmStrike + netPremiumPerLot;
        const lowerBreakeven = atmStrike - netPremiumPerLot;
        
        // For Iron Butterfly, show both breakeven points - ensure values are numbers before calling toFixed
        const upperBEIB = typeof upperBreakeven === 'number' && isFinite(upperBreakeven) ? upperBreakeven : 0;
        const lowerBEIB = typeof lowerBreakeven === 'number' && isFinite(lowerBreakeven) ? lowerBreakeven : 0;
        breakeven = `${upperBEIB.toFixed(0)} / ${lowerBEIB.toFixed(0)}`;
        breakevenPercentage = atmStrike > 0 ? (netPremiumPerLot / atmStrike) * 100 : 0;
        
        break;

      case "short_iron":
        // Short Iron Condor: Net Credit Strategy (4 legs)
        // Leg 1: SELL OTM CE (25500 CE) - Premium Received
        // Leg 2: SELL OTM PE (25100 PE) - Premium Received
        // Leg 3: BUY Far OTM CE (25700 CE) - Premium Paid
        // Leg 4: BUY Far OTM PE (24900 PE) - Premium Paid
        
        const sellOTMCE = validLegPrices[0] || 0;
        const sellOTMPE = validLegPrices[1] || 0;
        const buyFarOTMCE = validLegPrices[2] || 0;
        const buyFarOTMPE = validLegPrices[3] || 0;
        const condorQty = parseInt(legs[0]?.quantity) || 0;
        
        // Net Premium = (Short CE + Short PE) - (Long CE + Long PE)
        const netCreditSICPerLot = (sellOTMCE + sellOTMPE) - (buyFarOTMCE + buyFarOTMPE);
        const netCreditSIC = netCreditSICPerLot * condorQty; // Net Premium Received
        
        // Maximum Profit = Net Premium Received (when price stays between inner strikes)
        maxProfit = netCreditSIC;
        
        // Maximum Loss = Strike Difference - Net Premium (when price moves beyond outer strikes)
        const strikeDiffSIC = 200; // 25700 - 25500 = 200 points
        const maxLossSICPerLot = strikeDiffSIC - netCreditSICPerLot;
        maxLoss = maxLossSICPerLot * condorQty;
        
        // Two breakevens: Upper = Higher Strike + Net Credit, Lower = Lower Strike - Net Credit
        const upperStrikeSIC = atmStrike + 200; // 25500
        const lowerStrikeSIC = atmStrike - 200; // 25100
        const upperBreakevenSIC = upperStrikeSIC + netCreditSICPerLot;
        const lowerBreakevenSIC = lowerStrikeSIC - netCreditSICPerLot;
        
        // Show both breakeven points - ensure values are numbers before calling toFixed
        const upperBESIC = typeof upperBreakevenSIC === 'number' && isFinite(upperBreakevenSIC) ? upperBreakevenSIC : 0;
        const lowerBESIC = typeof lowerBreakevenSIC === 'number' && isFinite(lowerBreakevenSIC) ? lowerBreakevenSIC : 0;
        breakeven = `${upperBESIC.toFixed(0)} / ${lowerBESIC.toFixed(0)}`;
        breakevenPercentage = atmStrike > 0 ? (netCreditSICPerLot / atmStrike) * 100 : 0;
        
        break;

      default:
        maxProfit = 0;
        maxLoss = 0;
        breakeven = atmStrike;
        breakevenPercentage = 0;
    }

    // Ensure all values are valid numbers
    const result = {
      maxProfit: maxProfit === Infinity ? 999999 : (isNaN(maxProfit) ? 0 : maxProfit),
      maxLoss: maxLoss === Infinity ? 999999 : (isNaN(maxLoss) ? 0 : maxLoss),
      breakeven: typeof breakeven === 'string' ? breakeven : (isNaN(breakeven) ? 0 : breakeven),
      breakevenPercentage: isNaN(breakevenPercentage) ? 0 : breakevenPercentage
    };
    
    return result;
  };


  return {
    watchList,
    handleChange,
    lotSize,
    expiryList,
    defaultLegs,
    algoTrading,
    handleRemedyStrategy,
    isActive,
    isBoxReplacementVisible,
    handleCloseRemedyStrategy,
    formErrors,
    handleDefaultLegsChange,
    qty,
    handleQtyChange,
    addLeg,
    handleChildLegChange,
    strikePriceListArr,
    handleAdjustmentChange,
    futStrikePriceListArr,
    handelSubmit,
    priceType,
    handlePriceType,
    spotFutPrice,
    setLegsFn,
    selectedStrategy,
    totalMargin,
    setTotalMargin,
    totalSpread,
    setTotalSpread,
    strikePriceCEList,
    setAlgoTrading,
    strikePricePEList,
    setDefaultLegs,
    brokerList,
    isLoading,
    fixedStrategyPayoffs,
    fixedLegPrices,
    setSelectedStrategy,
    setFixedStrategyPayoffs,
    setFixedLegPrices,
  };
};

export default useAlgoTrading;

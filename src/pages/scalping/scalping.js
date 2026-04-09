import { useCallback, useEffect, useState } from "react";
import { scalpingObj } from "./constant";
import { useNavigate } from "react-router-dom";
import {
  fetchSymbolExpiryList,
  fetchSymbolLotSize,
  fetchWatchList,
} from "#utils/watchList";
import {
  asyncGetOptionListCE,
  asyncGetOptionListPE,
} from "#redux/optionChain/optionChainAction.js";
import { errorMsg } from "#helpers";
import { handleCatchErrors } from "#utils/validation";
import { asyncPostScalping } from "#redux/scalping/action.js";
import { asyncGetCustBrokerConfig } from "#redux/symbol/symbolAction.js";

const useScalping = () => {
  const [scalpingData, setScalpingData] = useState(scalpingObj);
  const navigate = useNavigate();
  const [lotSize, setLotSize] = useState("");
  const [symbolProduct, setSymbolProduct] = useState("");
  const [expiryList, setExpiryList] = useState([]);
  const [watchList, setWatchList] = useState([]);
  const [qty, setQty] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [strikePriceCEList, setStrikePriceCEList] = useState([]);
  const [strikePricePEList, setStrikePricePEList] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [priceType, setPriceType] = useState("price");
  const [brokerList, setBrokerList] = useState([]);

  const [strikePriceList, setStrikePriceList] = useState([]);

  const [spotFutPrice, setSpotFutPrice] = useState({
    spot: 0.0,
    future: 0.0,
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

      const lotSize = await getLotSize(symbolIdentifierId);

      let expiryList = [];

      setSymbolProduct(product);
      expiryList = await getSymbolExpiryList(product);

      if (expiryList.length && lotSize) {
        const strikePriceList = await getStrikePrice(expiryList[0], product);

        const strikeData = strikePriceList.find(
          (item) => item.product == "ATM"
        );

        setStrikePriceList(strikePriceList);

        setQty(lotSize?.quotationLot);

        setSpotFutPrice({
          ...spotFutPrice,
          spot: identifier,
          future: `${identifier}-1`,
        });

        setScalpingData((prevState) => ({
          ...prevState,
          SymbolIdentifierID: symbolIdentifierId,
          DSSLastTradedPrice: strikeData.lastTradePrice || 0,
          DSSExpiryDate: expiryList[0],
          UPExpiryDate: expiryList[0],
          DNExpiryDate: expiryList[0],
          DSSStrikePrice: strikeData.strikePrice,
          UPStrikePrice: strikeData.strikePrice,
          DNStrikePrice: strikeData.strikePrice,
          DSSQuantity: lotSize?.quotationLot,
          UPQuantity: lotSize?.quotationLot,
          DNQuantity: lotSize?.quotationLot,
          SLStepQuantity: lotSize?.quotationLot,
          CustomScalpingArr: [
            {
              ...prevState.CustomScalpingArr[0],
              StrikePrice: strikeData.strikePrice ,
              ExpiryDate: expiryList[0] ,
              Quantity:lotSize?.quotationLot ,
            },
            ...prevState.CustomScalpingArr.slice(1)
          ]
        
        }));
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
    getBrokersList()
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

  const getStrikePrice = useCallback(
    async (expiry = "", product = "", instrumentType = "CE") => {
      const reqData = {
        strExpiry: expiry ? expiry : scalpingData?.DSSExpiryDate,
        strProduct: product ? product : symbolProduct,
      };

      const instrument = instrumentType;

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
    }
  );

  const handleDayChange = (type, value) => {
    setScalpingData((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  const handleChange = useCallback(
    async (e) => {
      const { name, value, type, checked } = e.target;
      const matches = name.match(/^([\w]+)\[([\w]+)\]$/);

      // Start with the current state
      let newScalpingData = { ...scalpingData };

      if (matches) {
        const [_, objectKey, fieldKey] = matches;
        newScalpingData[objectKey] = {
          ...newScalpingData[objectKey],
          [fieldKey]: type == "checkbox" ? checked : value,
        };
      } else {
        newScalpingData[name] = type == "checkbox" ? checked : value;
      }

      let fieldKeyToCheck = matches ? matches[2] : name;

      if (fieldKeyToCheck == "SymbolIdentifierID") {
        if (value) {
          const lotSize = await getLotSize(value);
          const findData = watchList.find(
            (item) => item.symbolIdentifierId == value
          );
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
            const strikeData = strikePriceList.find(
              (item) => item.product == "ATM"
            );
            setStrikePriceList(strikePriceList);
            newScalpingData.DSSLastTradedPrice = strikeData.lastTradePrice;
          }
          setQty(lotSize?.quotationLot);
          const watchData = watchList.find(
            (item) => item.symbolIdentifierId == value
          );
          if (watchData) {
            setSpotFutPrice({
              ...spotFutPrice,
              spot: watchData?.identifier,
              future: `${watchData?.product}-1`,
            });
          }
        } else {
          setLotSize("");
          setSymbolProduct("");
          setExpiryList([]);
        }
      }

      if (fieldKeyToCheck == "DSSInstrument") {
        if (value) {
          let strikeData = "";
          if (value == "CE") {
            strikeData = strikePriceCEList.find(
              (item) => item.strikePrice == scalpingData?.DSSStrikePrice
            );
          }
          if (value == "PE") {
            let strikeList = strikePricePEList?.length
              ? strikePricePEList
              : await getStrikePrice("", "", value);
            strikeData = strikeList.find(
              (item) => item.strikePrice == scalpingData?.DSSStrikePrice
            );
          }
          newScalpingData[name] = value;
          newScalpingData.DSSLastTradedPrice = strikeData?.lastTradePrice;
        }
      }
      if (fieldKeyToCheck == "DSSStrikePrice") {
        let strikeData = "";
        if (scalpingData?.DSSInstrument == "CE") {
          strikeData = strikePriceCEList.find(
            (item) => item.strikePrice == value
          );
        }
        if (scalpingData?.DSSInstrument == "PE") {
          let strikeList = strikePricePEList?.length
            ? strikePricePEList
            : await getStrikePrice("", "", "PE");
          strikeData = strikeList.find((item) => item.strikePrice == value);
        }

        newScalpingData[name] = value;

        newScalpingData.DSSLastTradedPrice = strikeData?.lastTradePrice;
      }

      setScalpingData(newScalpingData);
      setFormErrors({ ...formErrors, [name]: "" });
    },
    [
      scalpingData,
      formErrors,
      getLotSize,
      watchList,
      getSymbolExpiryList,
      getStrikePrice,
      spotFutPrice,
      strikePriceCEList,
      strikePricePEList,
    ]
  );

  const handleChildChange = useCallback(
    async (e) => {
      const { name, value, type, checked } = e.target;

      // Parse "trendLegMasterRequests[0].action"
      const matches = name.match(/^(\w+)\[(\d+)\]\.(\w+)$/);

      if (!matches) return;

      const [_, arrayKey, indexStr, fieldKey] = matches;
      const index = parseInt(indexStr, 10);

      setScalpingData((prevState) => {
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
    },
    []
  );

  const handleCustomScalpingBtn = (key,index,value)=>{
    setScalpingData((prevState) => {
      const updatedArray = [...prevState['CustomScalpingArr']];
      updatedArray[index] = {
        ...updatedArray[index],
        [key]:  value,
      };

      return {
        ...prevState,
        CustomScalpingArr: updatedArray,
      };
    });
  }

  const handleQtyChange = (type, key = "", index = null) => {
    if (index !== null && key == "Quantity") {
      setScalpingData((prev) => {
        const updatedArray = [...prev.CustomScalpingArr];
        const currentQty = parseInt(updatedArray[index].Quantity) || 0;
        const lotQty = parseInt(qty) || 1;
        if (type === "increment") {
          updatedArray[index].Quantity = currentQty + lotQty;
        } else if (type === "decrement" && currentQty > lotQty) {
          updatedArray[index].Quantity = currentQty - lotQty;
        }
        return {
          ...prev,
          CustomScalpingArr: updatedArray,
        };
      });
    } else if (key) {
      const lotSize = parseInt(scalpingData[key]);
      if (type === "increment") {
        if (key == "SLStepQuantity") {
          if (scalpingData?.DSSQuantity > scalpingData?.SLStepQuantity) {
            setScalpingData((prev) => ({
              ...prev,
              [key]: parseInt(scalpingData[key]) + parseInt(qty),
              SLNoOfOrders:
                (parseInt(scalpingData?.DSSQuantity) -
                  (parseInt(scalpingData[key]) + parseInt(qty))) /
                  parseInt(qty) +
                1,
            }));
          }
        } else {
          setScalpingData((prev) => ({
            ...prev,
            [key]: parseInt(scalpingData[key]) + parseInt(qty),
            SLNoOfOrders:
              (parseInt(scalpingData[key]) +
                parseInt(qty) -
                parseInt(scalpingData?.SLStepQuantity)) /
                parseInt(qty) +
              1,
          }));
        }
      } else if (type === "decrement" && lotSize > qty) {
        if (key == "SLStepQuantity") {
          setScalpingData((prev) => ({
            ...prev,
            [key]: parseInt(scalpingData[key]) - parseInt(qty),
            SLNoOfOrders:
              (parseInt(scalpingData?.DSSQuantity) -
                (parseInt(scalpingData[key]) - parseInt(qty))) /
                parseInt(qty) +
              1,
          }));
        } else {
          setScalpingData((prev) => ({
            ...prev,
            [key]: scalpingData[key] - qty,
            SLNoOfOrders:
              (parseInt(scalpingData[key]) -
                parseInt(qty) -
                parseInt(scalpingData?.SLStepQuantity)) /
                parseInt(qty) +
              1,
          }));
        }
      }
    }
  };

  const handlePriceType = (type) => {
    setPriceType(type);
    setScalpingData((prev) => ({
      ...prev,
      ParameterName: type,
    }));
  };

  const handleDay = (type) => {
    setScalpingData((prev) => ({
      ...prev,
      DTExpiry: type,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    setIsLoading(true);
    asyncPostScalping({ formData: scalpingData })
      .then((result) => {
        if (result?.data == "Success") {
          navigate("/");
          setIsLoading(false);
        } else {
          errorMsg(result?.data);
          setIsLoading(false);
        }
      })
      .catch((loginError) => {
        handleCatchErrors(loginError, navigate, setFormErrors, "/");
        setIsLoading(false);
      });
  };

  const addCustomScalping = () => {
    // Use the default structure from scalpingObj

    const strikeData = strikePriceList.find(
      (item) => item.product == "ATM"
    );

    const defaultObj = {
      ScalingId: "",
      Condition: "SpotPrice",
      GreaterOrSmall: "Greater",
      Value: "",
      Action: "Buy",
      Instrument: "CE",
      StrikePrice: strikeData.strikePrice || scalpingData?.DSSStrikePrice,
      ExpiryDate: expiryList[0] || scalpingData?.DSSExpiryDate,
      Quantity: qty || scalpingData?.DSSQuantity ,
      TargetPrice: "",
      StopLossPrice: "",
    };
    setScalpingData((prevState) => ({
      ...prevState,
      CustomScalpingArr: [
        ...prevState.CustomScalpingArr,
        defaultObj
      ]
    }));
  }
 
  const handleDeleteCustomScalpingRow = (index) => {
    setScalpingData((prevState) => {
      const updatedArray = prevState.CustomScalpingArr.filter((_, i) => i !== index);
      return {
        ...prevState,
        CustomScalpingArr: updatedArray,
      };
    });
  };



  return {
    watchList,
    handleChange,
    lotSize,
    expiryList,
    qty,
    spotFutPrice,
    strikePriceCEList,
    strikePricePEList,
    formErrors,
    scalpingData,
    setScalpingData,
    strikePriceList,
    handleQtyChange,
    priceType,
    setPriceType,
    handlePriceType,
    handleDay,
    handleSubmit,
    isLoading,
    handleChildChange,
    handleCustomScalpingBtn,
    addCustomScalping,
    handleDeleteCustomScalpingRow,
    brokerList,
    handleDayChange
  };
};

export default useScalping;

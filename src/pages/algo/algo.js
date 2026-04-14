import {
  asyncGetCustomerAlgoTradeByID,
  asyncGetCustomerOptionsAlgo,
  asyncPostCustomerAlgoTrade,
  asyncPostCustomerAlgoTradeStatus,
  asyncPostCustomerOptionsAlgoStatus,
  asyncPostCustomerOptionsLegAlgo,
} from "#redux/algo/action .js";
import {
  asyncGetCustBrokerConfig,
  asyncGetSymbolCategoryList,
  asyncGetSymbolIdentifierByCustomerID,
} from "#redux/symbol/symbolAction.js";
import { handleCatchErrors, validateFormData } from "#utils/validation";
import {
  fetchSymbolExpiryList,
  fetchSymbolLotSize,
  fetchWatchList,
} from "#utils/watchList";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GlobalContext } from "../../context";
import { useGlobalServices } from "#services/global";
import { useSelector } from "react-redux";
import Storage from "#services/storage";
import Joi from "joi";
import dayjs from "dayjs";
import { successMsg } from "#helpers";
import { asyncAddWatchList } from "#redux/watchList/action.js";
import {
  asyncAddAlgoData,
  asyncGetAlgoData,
} from "#redux/nodeApi/algo/action.js";

const SETUP_ALGO_UPGRADE_MSG =
  "Deploy Strategy (Setup Algo) is not included in your current plan. Please upgrade your subscription to use this feature.";

const useAlgo = () => {
  const navigate = useNavigate();
  const { strategyList } = useContext(GlobalContext);
  const { activeSubscriptionFeatures } = useGlobalServices();
  const { companyDetails } = useSelector((state) => state.companyDetails);
  const [symbolCategoryList, setSymbolCategoryList] = useState([]);

  const [maxLossToggle, setMaxLossToggle] = useState(false);
  const [maxProfitToggle, setMaxProfitToggle] = useState(false);
  const [traillingSLToggle, setTraillingSLToggle] = useState(false);
  const [traillingProfitToggle, setTraillingProfitToggle] = useState(false);
  const [algoType, setAlgoType] = useState("");
  const [formErrors, setFormErrors] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);
  const [listButtonLoading, setListButtonLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [subscriptionDialogMessage, setSubscriptionDialogMessage] = useState("");

  const handleClickDialogOpen = (data, tab) => {
    setSubscriptionDialogMessage(SETUP_ALGO_UPGRADE_MSG);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const checkSetupAlgoSubscription = () => {
    if (!activeSubscriptionFeatures) return false;
    return activeSubscriptionFeatures.setupAlgo === true;
  };

  const [optionTypeList, setOptionTypeList] = useState([
    { value: "1", label: "ATM/ANY" },
    { value: "2", label: "ITM1" },
    { value: "3", label: "ITM2" },
    { value: "4", label: "ITM3" },
    { value: "5", label: "ITM4" },
    { value: "6", label: "ITM5" },
    { value: "7", label: "OTM1" },
    { value: "8", label: "OTM2" },
    { value: "9", label: "OTM3" },
    { value: "10", label: "OTM4" },
    { value: "11", label: "OTM5" },
  ]);

  const [bsOption, setBSOption] = useState([
    { value: "1", label: "Buy" },
    { value: "2", label: "Sell" },
    { value: "3", label: "Long Debit Spread" },
    { value: "4", label: "Short Credit Spread" },
  ]);

  const algoOptionDataObj = {
    customerBrokerID: 0,
    expiryDate: "",
    productName: null,
    IdentifierID: 0,
    Identifier: "",
    CustomerAlgoTradeID: 0,
    CustomerID:localStorage.getItem("customerID"),
    TradeType0: 0,
    BrokerConfigID: "",
    StratergyID: "",
    OrderQuantity0: 1,
    OptionsType0: 1,
    OptionsType1: 1,
    ProductType: 2,
    lotSize: null,
    lotQTy: null,
    statergyID: 0,
    StratergyID0: null,
    StratergyID1: null,
    startTime: null,
    endTime: null,
    squareoffTime: null,
    customerId:localStorage.getItem("customerID"),
    isActive: null,
    createddate: null,
    companyId: null,
    CallType0: null,
    AlgoType0: null,
    Stoploss0: "",
    Takeprofit0: "",
    SpecificLimitofDay0: "",
    OverallCapital0: null,
    TrailingStopLoss0: null,
    OverallCapitalProfit0: null,
    CallType1: null,
    OrderQuantity1: null,
    AlgoType1: null,
    Stoploss1: null,
    Takeprofit1: null,
    SpecificLimitofDay1: null,
    OverallCapital1: null,
    TrailingStopLoss1: null,
    OverallCapitalProfit1: null,
    TrailingProfit0: null,
    TrailingProfit1: null,
    PECE1: null,
    PECE0: null,
    IdentifierName: "",
    CustomerID: localStorage.getItem("customerID"),
    ProductName: "",
    COAID: 0,
    CustomerBrokerID: 0,
    StatergyID: 0,
    ExpiryDate: "",
    LotSize: null,
    LotQTy: null,
    StartTime: null,
    EndTime: null,
    SquareoffTime: null,
    IsActive: true,
    Createddate: "",
    CompanyId: companyDetails?.companyID,
    customerOptionsAlgochild: [
      {
        CallType: 0,
        CustomerAlgoTradeID: 0,
        CustomerID: localStorage.getItem("customerID"),
        IdentifierID: 0,
        Identifier: "",
        ProductType: 2,
        OrderQuantity: 1,
        AlgoType: 2,
        Stoploss: "",
        Takeprofit: "",
        Status: true,
        Createddate: "",
        Modifieddate: "",
        SpecificLimitofDay: "",
        OverallCapital: "",
        TrailingStopLoss: "",
        TrailingProfit: "",
        OverallCapitalProfit: "",
        brokerConfigID: "",
        cOACID: 0,
        cOAIDs: 0,
        OptionsType: 0,
      },
    ],
  };

  const [algoOptionData, setAlgoOptionData] = useState(algoOptionDataObj);

  const algoNFObj = {
    teamId: 0,
    IdentifierID: 0,
    Identifier: "",
    CustomerAlgoTradeID: 0,
    CustomerID: localStorage.getItem("customerID"),
    TradeType: 1,
    ProductType: 2,
    BrokerConfigID: 0,
    StratergyID: 0,
    OrderQuantity: 0,
    AlgoType: 2,
    Stoploss: 0,
    Takeprofit: 0,
    SpecificLimitofDay: 0,
    OverallCapital: 0,
    OverallCapitalProfit: 0,
    TrailingStopLoss: 0,
    TrailingProfit: 0,
    Status: true,
    Createddate: 0,
    Modifieddate: 0,
  };
  const [algoNFData, setAlgoNFData] = useState(algoNFObj);


  const [symbolData, setSymbolData] = useState("");
  const [changeAlgoState, setChangeAlgoState] = useState("");
  const [expiryList, setExpiryList] = useState([]);
  const [brokerList, setBrokerList] = useState([]);
  const [lotSize, setLotSize] = useState("");
  const [freezeQty, setFreezeQty] = useState(null);
   

  const getSymbolIdentifierList = useCallback(
    async (symbolCategory) => {
      try {
  
        const result = await asyncGetSymbolIdentifierByCustomerID({
          searchtxt: "",
        });
        const allData = result?.data?.result;

        
        const updatedList = await Promise.all(
          symbolCategory.map(async (val) => {
            // val
            if (val?.symbolCategoryName === "NSE") {
              const symbolCategoryData = allData?.filter(
                (v) => v?.symbolCategoryName === "NSE"
              );
              const watchListNSEData = await fetchWatchList(
                { categoryID: 1, identifier: "" },
                navigate
              );

          
              if(watchListNSEData && watchListNSEData.length > 0){
                  const finalSymbolCategoryData = symbolCategoryData.map(
                    (mainItem) => {
                      const match = watchListNSEData.find(
                        (item) => item.symbolIdentifierId == mainItem.identifierID
                      );
                    
                      return {
                        ...mainItem,
                        watchListID: match ? match.watchListID : 0,
                        symbolIdentifierId: match
                          ? match.symbolIdentifierId
                          : mainItem.identifierID,
                        addedinAlgoTrade: match ? match.addedinAlgoTrade : false,
                        customerAlgoTradeID: match ? match.customerAlgoTradeID : 0,
                      };
                    }
                  );
                  return { ...val, symbol: finalSymbolCategoryData  
                } 
              }
            }

            if (val?.symbolCategoryName === "FUTURES") {
              const symbolCategoryData = allData?.filter(
                (v) => v?.symbolCategoryName === "FUTURES"
              );

        
              let watchListFUTData = await fetchWatchList(
                { categoryID: 2, identifier: "" },
                navigate
              );
              if(!watchListFUTData){
                watchListFUTData = []
              }
           

              const finalSymbolCategoryData = symbolCategoryData.map(
                (mainItem) => {
                  const match = watchListFUTData.find(
                    (item) => item.symbolIdentifierId == mainItem.identifierID
                  );

                 

                  return {
                    ...mainItem,
                    watchListID: match ? match.watchListID : 0,
                    symbolIdentifierId: match
                      ? match.symbolIdentifierId
                      : mainItem.identifierID,
                    addedinAlgoTrade: match ? match.addedinAlgoTrade : false,
                    customerAlgoTradeID: match ? match.customerAlgoTradeID : 0,
                  };
                }
              );
          
              return { ...val, symbol: finalSymbolCategoryData };
            }

            if (val?.symbolCategoryName === "OPTIONS") {
              let data = await fetchWatchList(
                { categoryID: 5, identifier: "" },
                navigate
              );
              if(!data){
                data = []
              }

              return { ...val, symbol: data };
            }
            if (val?.symbolCategoryName === "MCX") {
              const symbolCategoryData = allData?.filter(
                (v) => v?.symbolCategoryName === "MCX"
              );
              let watchListFUTData = await fetchWatchList(
                { categoryID: 3, identifier: "" },
                navigate
              );

              if(!watchListFUTData){
                watchListFUTData = []
              }

              const finalSymbolCategoryData = symbolCategoryData?.map(
                (mainItem) => {
                  if (!mainItem) return null;
                  
                  const match = watchListFUTData?.find(
                    (item) => item?.symbolIdentifierId == mainItem?.identifierID
                  );

                  return {
                    ...mainItem,
                    watchListID: match?.watchListID || 0,
                    symbolIdentifierId: match?.symbolIdentifierId || mainItem?.identifierID,
                    addedinAlgoTrade: match?.addedinAlgoTrade || false,
                    customerAlgoTradeID: match?.customerAlgoTradeID || 0,
                  };
                }
              )?.filter(Boolean) || [];
              return { ...val, symbol: finalSymbolCategoryData };
            }

            if (val?.symbolCategoryName === "BSE") {
              const symbolCategoryData = allData?.filter(
                (v) => v?.symbolCategoryName === "BSE"
              );
              let watchListFUTData = await fetchWatchList(
                { categoryID: 12, identifier: "" },
                navigate
              );
              if(!watchListFUTData){
                watchListFUTData = []
              }
              const finalSymbolCategoryData = symbolCategoryData?.map(
                (mainItem) => {
                  if (!mainItem) return null;
                  
                  const match = watchListFUTData?.find(
                    (item) => item?.symbolIdentifierId == mainItem?.identifierID
                  );

                  return {
                    ...mainItem,
                    watchListID: match?.watchListID || 0,
                    symbolIdentifierId: match?.symbolIdentifierId || mainItem?.identifierID,
                    addedinAlgoTrade: match?.addedinAlgoTrade || false,
                    customerAlgoTradeID: match?.customerAlgoTradeID || 0,
                  };
                }
              )?.filter(Boolean) || [];
              return { ...val, symbol: finalSymbolCategoryData };
            }

            return val;
          })
        );
        // symbolCategory
        setCategoryLoading(false);
        setSymbolCategoryList((prev) => {
          const isSame = JSON.stringify(prev) === JSON.stringify(updatedList);
          return isSame ? prev : updatedList;
        });
      } catch (err) {
        handleCatchErrors(err, navigate);
      } finally {
        setListButtonLoading(false);
      }
    },
    [navigate]
  );

  const getSymbolCategoryList = useCallback(async () => {
    try {
      const result = await asyncGetSymbolCategoryList();
      const allCategory = result?.data?.result;
 
      if (allCategory?.length) {
        getSymbolIdentifierList(allCategory);
      }
    } catch (err) {
      handleCatchErrors(err, navigate);
    }
  }, [getSymbolIdentifierList, navigate]);

  useEffect(() => {
    getSymbolCategoryList();
  }, [getSymbolCategoryList]);

  const getCustomerOptionsAlgo = async (algoTradeId, lotSize) => {
    await asyncGetCustomerOptionsAlgo({ COAID: algoTradeId })
      .then(async (result) => {
        const data = result?.data?.result;
        setAlgoOptionData({
          ...algoOptionData,
          customerBrokerID: data?.customerOptionsAlgo?.customerBrokerID,
          CustomerBrokerID: data?.customerOptionsAlgo?.customerBrokerID,
          expiryDate: data?.customerOptionsAlgo?.expiryDate,
          ExpiryDate: data?.customerOptionsAlgo?.expiryDate,
          productName: data?.customerOptionsAlgo?.productName,
          ProductName: data?.customerOptionsAlgo?.productName,
          IdentifierID: data?.customerOptionsAlgo?.identifierID,
          Identifier: data?.customerOptionsAlgo?.identifierName,
          IdentifierName: data?.customerOptionsAlgo?.identifierName,
         // customerId:localStorage.getItem("customerID"),
          //CustomerId:localStorage.getItem("customerID"),
          //CustomerID:localStorage.getItem("customerID"),
          customerId: localStorage.getItem("customerID"),
CustomerId: localStorage.getItem("customerID"),
CustomerID: localStorage.getItem("customerID"),
          BrokerConfigID: data?.customerOptionsAlgoChild[0]?.brokerConfigID,
          StratergyID: data?.customerOptionsAlgo?.statergyID,
          statergyID: data?.customerOptionsAlgo?.statergyID,
          ProductType: data?.customerOptionsAlgo?.productType,
          isActive: data?.customerOptionsAlgo?.isActive,
          COAID: data?.customerOptionsAlgoChild[0]?.cOAID,
          customerOptionsAlgochild: [
            {
              ...algoOptionData.customerOptionsAlgochild[0],
              IdentifierID: data?.customerOptionsAlgo?.identifierID,
              Identifier: data?.customerOptionsAlgo?.identifierName,
              //CustomerID:localStorage.getItem("customerID"),
              CustomerID: localStorage.getItem("customerID"),
              brokerConfigID: data?.customerOptionsAlgoChild[0]?.brokerConfigID,
              ProductType: data?.customerOptionsAlgoChild[0]?.productType,
              CallType: data?.customerOptionsAlgoChild[0]?.callType,
              OrderQuantity:
                data?.customerOptionsAlgoChild[0]?.orderQuantity /
                lotSize?.quotationLot,
              AlgoType: data?.customerOptionsAlgoChild[0]?.algoType,
              Stoploss: data?.customerOptionsAlgoChild[0]?.stoploss,
              Takeprofit: data?.customerOptionsAlgoChild[0]?.takeprofit,
              Status: data?.customerOptionsAlgoChild[0]?.status,
              SpecificLimitofDay:
                data?.customerOptionsAlgoChild[0]?.specificLimitofDay,
              OverallCapital: data?.customerOptionsAlgoChild[0]?.overallCapital,
              TrailingStopLoss:
                data?.customerOptionsAlgoChild[0]?.trailingStopLoss,
              TrailingProfit: data?.customerOptionsAlgoChild[0]?.trailingProfit,
              OverallCapitalProfit:
                data?.customerOptionsAlgoChild[0]?.overallCapitalProfit,
              OptionsType: data?.customerOptionsAlgoChild[0]?.optionsType,
            },
          ],
        });

        if (data?.customerOptionsAlgoChild[0]?.overallCapital > 0) {
          setMaxLossToggle(true);
        } else {
          setMaxLossToggle(false);
        }

        if (data?.customerOptionsAlgoChild[0]?.overallCapitalProfit > 0) {
          setMaxProfitToggle(true);
        } else {
          setMaxProfitToggle(false);
        }

        if (data?.customerOptionsAlgoChild[0]?.trailingStopLoss > 0) {
          setTraillingSLToggle(true);
        } else {
          setTraillingSLToggle(false);
        }

        if (data?.customerOptionsAlgoChild[0]?.trailingProfit > 0) {
          setTraillingProfitToggle(true);
        } else {
          setTraillingProfitToggle(false);
        }
      })
      .catch((err) => {
        handleCatchErrors(err, navigate);
      });
  };

  const editAlgo = async (algoTradeId, symData, algoType) => {
    setDataLoading(true);
    setFormErrors("");
    setAlgoType(algoType);
    setChangeAlgoState(symData?.symbolIdentifierId);
    const lotSizeData = await getLotSize(symData?.symbolIdentifierId);
    getSymbolExpiryList(symData?.product);
    getBrokersList();

    setSymbolData(symData);
    if (algoType == "options") {
      await getCustomerOptionsAlgo(algoTradeId, lotSizeData);
    } else {
      await getNFAlgo(algoTradeId, lotSizeData, algoType);
    }
    setDataLoading(false);
  };

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
    },
    [navigate]
  );

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

  const enableAlgo = useCallback(
    (e, symData, algoType, currentStatus) => {
      setFormErrors("");
      setDataLoading(true);
      setListButtonLoading(true);

      if (!currentStatus) {
        if (symData?.addedinAlgoTrade) {
          addAlgoIntoSystem(symData, algoType);
        } else {
          setAlgoType(algoType);
          setChangeAlgoState(symData?.symbolIdentifierId);
          setSymbolData(symData);
          getLotSize(symData?.symbolIdentifierId);
          getSymbolExpiryList(symData?.product);
          getBrokersList();

          getAlgoIntoSystem(symData, algoType);
        }
      } else {
        setChangeAlgoState("");
        setAlgoType("");
        setListButtonLoading(false);
      }
    },
    [getLotSize, getSymbolExpiryList, getBrokersList]
  );

  const addAlgoIntoSystem = useCallback(
    async (symData, algoType) => {
      let formData = {};

      if (algoType == "options") {
        await asyncGetCustomerOptionsAlgo({
          COAID: symData?.customerAlgoTradeID,
        }).then(async (result) => {
          const data = result?.data?.result;
                  
         
          formData.custAlgoTradeID = symData?.customerAlgoTradeID;
          formData.customerBrokerID =
            data?.customerOptionsAlgo?.customerBrokerID;
          formData.expiryDate = data?.customerOptionsAlgo?.expiryDate;
          formData.companyId = companyDetails?.companyID;
          formData.customerId =localStorage.getItem("customerID");
          formData.productName = symData?.product;
          formData.identifierID = data?.customerOptionsAlgo?.identifierID;
          formData.identifierName = data?.customerOptionsAlgo?.identifierName;
          formData.brokerConfigID =
            data?.customerOptionsAlgoChild[0]?.brokerConfigId;
          formData.statergyID = data?.customerOptionsAlgo?.statergyID;
          formData.productType = data?.customerOptionsAlgo?.productType;
          formData.callType = data?.customerOptionsAlgoChild[0]?.callType;
          formData.orderQuantity =
            data?.customerOptionsAlgoChild[0]?.orderQuantity;
          formData.algoType = data?.customerOptionsAlgoChild[0]?.algoType;
          formData.stoploss = data?.customerOptionsAlgoChild[0]?.stoploss;
          formData.takeprofit = data?.customerOptionsAlgoChild[0]?.takeprofit;
          formData.specificLimitofDay =
            data?.customerOptionsAlgoChild[0]?.specificLimitofDay;
          formData.overallCapital =
            data?.customerOptionsAlgoChild[0]?.overallCapital;
          formData.trailingProfit =
            data?.customerOptionsAlgoChild[0]?.trailingProfit;
          formData.overallCapitalProfit =
            data?.customerOptionsAlgoChild[0]?.overallCapitalProfit;
          formData.optionsType = data?.customerOptionsAlgoChild[0]?.optionsType;
          formData.algoCategory = algoType;

          await asyncAddAlgoData({ formData });
        });
      } else {
        await asyncGetCustomerAlgoTradeByID({
          CustAlgoTradeID: symData?.customerAlgoTradeID,
        }).then(async (result) => {
          const data = result?.data?.result;
         
          formData.custAlgoTradeID = data?.customerAlgoTradeId;
          formData.customerBrokerID = data?.customerAlgoTradeId;
          formData.expiryDate = symData?.expiry;
          formData.companyId = companyDetails?.companyID;
          formData.customerId =localStorage.getItem("customerID") ;
          formData.productName = symData?.product;
          formData.identifierID = data?.identifierID;
          formData.identifierName = data?.identifier;
          formData.brokerConfigID = data?.brokerConfigId;
          formData.statergyID = data?.stratergyId;
          formData.productType = String(data?.productType);
          formData.callType = null;
          formData.orderQuantity = data?.orderQuantity;
          formData.algoType = data?.algoType;
          formData.stoploss = data?.stoploss;
          formData.takeprofit = data?.takeprofit;
          formData.specificLimitofDay = data?.specificLimitofDay;
          formData.overallCapital = data?.overallCapital;
          formData.trailingProfit = data?.trailingProfit;
          formData.overallCapitalProfit = data?.overallCapitalProfit;
          formData.optionsType = null;
          formData.algoCategory = algoType;

          await asyncAddAlgoData({ formData });
        });
      }

      let data = {};
      if (algoType == "options") {
        data = {
          COAID: symData?.customerAlgoTradeID,
          IsActive: false,
        };
        await asyncPostCustomerOptionsAlgoStatus({
          data,
        }).then(async (result) => {
          setAlgoType("");
          setChangeAlgoState("");
          getSymbolCategoryList();
        });
      } else {
        data = {
          CustomerAlgoTradeID: symData?.customerAlgoTradeID,
          status: false,
        };

        await asyncPostCustomerAlgoTradeStatus({
          data,
        }).then(async (result) => {
          setAlgoType("");
          setChangeAlgoState("");
          getSymbolCategoryList();
        });
      }
    },
    [navigate]
  );

  const getAlgoIntoSystem = useCallback(  

    async (symData, algoType) => {
      const lotSize = await getLotSize(symData?.symbolIdentifierId);
      setFreezeQty(symData?.freezeQty ?? null);
      const sendData = {
        identifier: symData?.symbolIdentifierId,
      };
      await asyncGetAlgoData({
        sendData,
      })
        .then(async (result) => {
          if (algoType == "options") {
            const baseData = {
              ...algoOptionDataObj,
              IdentifierID: symData?.symbolIdentifierId,
              IdentifierName: symData?.identifier,
              Identifier: symData?.identifier,
              identifier: symData?.identifier,
              ProductName: symData?.product,
              customerOptionsAlgochild: [
                {
                  ...algoOptionDataObj.customerOptionsAlgochild?.[0],
                  IdentifierID: symData?.symbolIdentifierId,
                  Identifier: symData?.identifier,
                },
              ],
            };
            if (result?.data?.data) {
              const data = result?.data?.data;
              setAlgoOptionData((prev) => ({
                ...algoOptionData,
                customerBrokerID: data?.customerBrokerID,
                CustomerBrokerID: data?.customerBrokerID,
                expiryDate: data?.expiryDate,
                ExpiryDate: data?.expiryDate,
                productName: data?.productName,
                ProductName: data?.productName,
                IdentifierID: data?.identifierID,
                Identifier: data?.identifierName,
                IdentifierName: data?.identifierName,
                customerId:localStorage.getItem("customerID"),
                CustomerId:localStorage.getItem("customerID"),
                CustomerID:  localStorage.getItem("customerID"),
                BrokerConfigID: data?.brokerConfigID,
                StratergyID: data?.statergyID,
                statergyID: data?.statergyID,
                ProductType: data?.productType,
                isActive: true,
                COAID: 0,
                customerOptionsAlgochild: [
                  {
                    ...algoOptionData.customerOptionsAlgochild[0],
                    IdentifierID: data?.identifierID,
                    Identifier: data?.identifierName,
                    CustomerID:localStorage.getItem("customerID"),
                    brokerConfigID: data?.brokerConfigID,
                    ProductType: data?.productType,
                    CallType: data?.callType,
                    OrderQuantity: data?.orderQuantity / lotSize?.quotationLot,
                    AlgoType: data?.algoType,
                    Stoploss: data?.stoploss,
                    Takeprofit: data?.takeprofit,
                    Status: data?.status,
                    SpecificLimitofDay: data?.specificLimitofDay,
                    OverallCapital: data?.overallCapital,
                    TrailingStopLoss: data?.trailingStopLoss,
                    TrailingProfit: data?.trailingProfit,
                    OverallCapitalProfit: data?.overallCapitalProfit,
                    OptionsType: data?.optionsType,
                  },
                ],
              }));
            } else {
              setAlgoOptionData(baseData);
            }
          } else {
            const baseData = {
              ...algoNFObj,
              IdentifierID: symData?.symbolIdentifierId,
              Identifier: symData?.identifier,
              CustomerAlgoTradeID: symData?.customerAlgoTradeID,
            };

            if (result?.data?.data) {
              const data = result?.data?.data;
          

              setAlgoNFData((prev) => ({
                ...algoNFData,
                CustomerAlgoTradeID: symData?.customerAlgoTradeID,
                CustomerID:localStorage.getItem("customerID"),
                IdentifierID: data?.identifierID,
                Identifier: data?.identifierName,
                ProductType: data?.productType,
                BrokerConfigID: data?.brokerConfigID,
                StratergyID: data?.statergyID,
                OrderQuantity:
                  algoType == "nse"
                    ? data?.orderQuantity
                    : data?.orderQuantity / lotSize?.quotationLot,
                AlgoType: data?.algoType,
                Stoploss: data?.stoploss,
                Takeprofit: data?.takeprofit,
                Status: true,
                SpecificLimitofDay: data?.specificLimitofDay,
                OverallCapital: data?.overallCapital,
                TrailingStopLoss: data?.trailingStopLoss,
                OverallCapitalProfit: data?.overallCapitalProfit,
                TrailingProfit: data?.trailingProfit,
              }));
            } else {
              setAlgoNFData(baseData);
            }
          }

          if (result?.data?.data) {
            if (result?.data?.data.overallCapital > 0) {
              setMaxLossToggle(true);
            } else {
              setMaxLossToggle(false);
            }

            if (result?.data?.data.overallCapitalProfit > 0) {
              setMaxProfitToggle(true);
            } else {
              setMaxProfitToggle(false);
            }

            if (result?.data?.data.trailingStopLoss > 0) {
              setTraillingSLToggle(true);
            } else {
              setTraillingSLToggle(false);
            }

            if (result?.data?.data.trailingProfit > 0) {
              setTraillingProfitToggle(true);
            } else {
              setTraillingProfitToggle(false);
            }
          }
        })
        .finally(() => {
          setListButtonLoading(false);
          setDataLoading(false);
        });
    },
    [navigate]
  );

  const handleOptionChange = useCallback((e) => {
    const { name, value } = e.target;

    const childKeys = [
      "CallType",
      "AlgoType",
      "Stoploss",
      "Takeprofit",
      "SpecificLimitofDay",
      "ProductType",
      "OptionsType",
      "OrderQuantity",
      "OverallCapital",
      "TrailingStopLoss",
      "OverallCapitalProfit",
      "TrailingProfit",
    ];

    if (name == "expiryDate" || name == "ExpiryDate") {
      setAlgoOptionData((prev) => ({
        ...prev,
        expiryDate: value,
        ExpiryDate: value, // Ensures both keys are set
      }));
      return;
    }
    if (name == "ProductType") {
      setAlgoOptionData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (name == "customerBrokerID") {
      setAlgoOptionData((prev) => ({
        ...prev,
        [name]: value,
        ["CustomerBrokerID"]: value,
        customerOptionsAlgochild: [
          {
            ...prev.customerOptionsAlgochild[0],
            ["brokerConfigID"]: value,
          },
        ],
      }));
    }

    if (name == "statergyID") {
      setAlgoOptionData((prev) => ({
        ...prev,
        [name]: value,
        ["StatergyID"]: value,
      }));
    }

    if (childKeys.includes(name)) {
      if (
        name == "Stoploss" ||
        name == "OrderQuantity" ||
        name == "Takeprofit" ||
        name == "OverallCapital" ||
        name == "OverallCapitalProfit" ||
        name == "TrailingStopLoss" ||
        name == "TrailingProfit" ||
        name == "SpecificLimitofDay"
      ) {
        if (!/^\d*$/.test(value)) return;
      }
      setAlgoOptionData((prev) => ({
        ...prev,
        customerOptionsAlgochild: [
          {
            ...prev.customerOptionsAlgochild[0],
            [name]: value,
          },
        ],
      }));
    } else {
      setAlgoOptionData((prev) => {
        if (prev[name] == value) return prev;
        return { ...prev, [name]: value };
      });
    }

    setFormErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  }, []);

  const handleNFChange = useCallback((e) => {
    const { name, value } = e.target;
    if (
      name == "Stoploss" ||
      name == "OrderQuantity" ||
      name == "Takeprofit" ||
      name == "OverallCapital" ||
      name == "OverallCapitalProfit" ||
      name == "TrailingStopLoss" ||
      name == "TrailingProfit" ||
      name == "SpecificLimitofDay"
    ) {
      if (!/^\d*$/.test(value)) return;
    }
    setAlgoNFData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  }, []);

  const memoizedSymbolCategoryList = useMemo(
    () => symbolCategoryList,
    [symbolCategoryList]
  );

  const handleOptionSubmit = async (e) => {
    e.preventDefault();

    if (!checkSetupAlgoSubscription()) {
      setSubscriptionDialogMessage(SETUP_ALGO_UPGRADE_MSG);
      setDialogOpen(true);
      return;
    }

    // Base subscription max lots (in lots)
    const subscriptionMaxLots =
      typeof activeSubscriptionFeatures?.maxLots === "number"
        ? activeSubscriptionFeatures.maxLots
        : null;

    // Exchange freeze quantity converted to lots, if we have both freezeQty and lot size
    let maxLotsFromFreeze = null;
    const lotQty = lotSize?.quotationLot
      ? parseInt(lotSize.quotationLot)
      : null;
    if (
      freezeQty !== null &&
      freezeQty !== undefined &&
      !Number.isNaN(parseInt(freezeQty)) &&
      lotQty &&
      !Number.isNaN(lotQty) &&
      lotQty > 0
    ) {
      maxLotsFromFreeze = Math.floor(parseInt(freezeQty) / lotQty);
    }

    let maxLotSet = subscriptionMaxLots ?? 99999;
    if (maxLotsFromFreeze !== null && maxLotsFromFreeze > 0) {
      maxLotSet = Math.min(maxLotSet, maxLotsFromFreeze);
    }
    // Define the validation schema for the form
    const validationSchema = Joi.object({
      expiryDate: Joi.string().required().messages({
        "any.required": "Expiry is required.",
        "string.empty": "Expiry is required.",
        "string.base": "Expiry is required.",
      }),
      statergyID: Joi.number().min(1).required().messages({
        "any.required": "Strategy is required.",
        "number.empty": "Strategy is required.",
        "number.min": "Strategy is required.",
      }),
      customerBrokerID: Joi.number().min(1).required().messages({
        "any.required": "Broker is required.",
        "number.empty": "Broker is required.",
        "number.min": "Broker is required.",
      }),
      customerBrokerID: Joi.number().min(1).required().messages({
        "any.required": "Broker is required.",
        "number.empty": "Broker is required.",
        "number.min": "Broker is required.",
      }),
      customerOptionsAlgochild: Joi.array().items(
        Joi.object({
          CallType: Joi.number().min(1).required().messages({
            "any.required": "B/S is required.",
            "number.empty": "B/S is required.",
            "number.min": "B/S is required.",
          }),
          OptionsType: Joi.number().min(1).required().messages({
            "any.required": "Option type is required.",
            "number.empty": "Option type is required.",
            "number.min": "Option type is required.",
          }),
          OrderQuantity: Joi.number()
            .min(1)
            .max(maxLotSet)
            .required()
            .messages({
              "any.required": "Quantity  is required.",
              "number.empty": "Quantity is required.",
              "number.min": "Quantity must be greater then 0",
              "number.max": `Quantity must be less than or equal to ${maxLotSet} lots (capped by plan and exchange freeze quantity).`,
              "number.base": "Quantity is required",
            }),
          Stoploss: Joi.number().min(1).required().messages({
            "any.required": "S/L  is required.",
            "number.empty": "S/L is required.",
            "number.min": "S/L must be greater then 0",
            "number.base": "S/L is required",
          }),
          Takeprofit: Joi.number().min(1).required().messages({
            "any.required": "TGT  is required.",
            "number.empty": "TGT is required.",
            "number.min": "TGT must be greater then 0",
            "number.base": "TGT is required",
          }),
          SpecificLimitofDay: Joi.number().min(1).required().messages({
            "any.required": "Trade limit  is required.",
            "number.empty": "Trade limit is required.",
            "number.min": "Trade limit must be greater then 0",
            "number.base": "Trade limit is required",
          }),
        }).unknown(true)
      ),
    }).unknown(true);
    // Use validateFormData from validation.js to validate the form data
    const validationResponse = await validateFormData(
      algoOptionData,
      validationSchema
    );

    // If validation fails, set the errors
    if (!validationResponse.status) {
      setFormErrors(validationResponse.errors);
      return;
    }
    setIsLoading(true);

    let formData = algoOptionData;
    formData.customerOptionsAlgochild[0].OrderQuantity =
      formData?.customerOptionsAlgochild[0].OrderQuantity *
      lotSize?.quotationLot;
    formData.Createddate = dayjs().toISOString();
    formData.customerOptionsAlgochild[0].CallType = parseInt(
      formData.customerOptionsAlgochild[0]?.CallType
    );
    formData.customerOptionsAlgochild[0].Createddate = dayjs().toISOString();
    formData.customerOptionsAlgochild[0].Modifieddate = dayjs().toISOString();

    await asyncPostCustomerOptionsLegAlgo({ formData })
      .then(async (result) => {
        setAlgoType("");
        successMsg("Algo Run Successfully...");
        getSymbolCategoryList();
      })
      .catch((err) => {
        handleCatchErrors(err, navigate);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleNFSubmit = async (e) => {
    e.preventDefault();

    if (!checkSetupAlgoSubscription()) {
      setSubscriptionDialogMessage(SETUP_ALGO_UPGRADE_MSG);
      setDialogOpen(true);
      return;
    }

    // For futures, respect both subscription lot cap and exchange freeze quantity
    const subscriptionMaxLots =
      algoType === "futures" &&
      typeof activeSubscriptionFeatures?.maxLots === "number"
        ? activeSubscriptionFeatures.maxLots
        : null;

    let maxLotsFromFreeze = null;
    const lotQty = lotSize?.quotationLot
      ? parseInt(lotSize.quotationLot)
      : null;
    if (
      algoType === "futures" &&
      freezeQty !== null &&
      freezeQty !== undefined &&
      !Number.isNaN(parseInt(freezeQty)) &&
      lotQty &&
      !Number.isNaN(lotQty) &&
      lotQty > 0
    ) {
      maxLotsFromFreeze = Math.floor(parseInt(freezeQty) / lotQty);
    }

    let maxLotSet =
      algoType === "futures" ? subscriptionMaxLots ?? 99999 : 99999;
    if (algoType === "futures" && maxLotsFromFreeze !== null && maxLotsFromFreeze > 0) {
      maxLotSet = Math.min(maxLotSet, maxLotsFromFreeze);
    }

    // Define the validation schema for the form
    const validationSchema = Joi.object({
      StratergyID: Joi.number().min(1).required().messages({
        "any.required": "Strategy is required.",
        "number.empty": "Strategy is required.",
        "number.min": "Strategy is required.",
      }),
      BrokerConfigID: Joi.number().min(1).required().messages({
        "any.required": "Broker is required.",
        "number.empty": "Broker is required.",
        "number.min": "Broker is required.",
      }),
      OrderQuantity: Joi.number()
        .min(1)
        .max(maxLotSet)
        .required()
        .messages({
          "any.required": "Quantity  is required.",
          "number.empty": "Quantity is required.",
          "number.min": "Quantity must be greater then 0",
          "number.max": `Quantity must be less than or equal to ${maxLotSet} lots (capped by plan and exchange freeze quantity).`,
          "number.base": "Quantity is required",
        }),
      Stoploss: Joi.number().min(1).required().messages({
        "any.required": "S/L  is required.",
        "number.empty": "S/L is required.",
        "number.min": "S/L must be greater then 0",
        "number.base": "S/L is required",
      }),
      Takeprofit: Joi.number().min(1).required().messages({
        "any.required": "TGT  is required.",
        "number.empty": "TGT is required.",
        "number.min": "TGT must be greater then 0",
        "number.base": "TGT is required",
      }),
      SpecificLimitofDay: Joi.number().min(1).required().messages({
        "any.required": "Trade limit  is required.",
        "number.empty": "Trade limit is required.",
        "number.min": "Trade limit must be greater then 0",
        "number.base": "Trade limit is required",
      }),
    }).unknown(true);
    // Use validateFormData from validation.js to validate the form data
    const validationResponse = await validateFormData(
      algoNFData,
      validationSchema
    );

    // If validation fails, set the errors
    if (!validationResponse.status) {
      setFormErrors(validationResponse.errors);
      return;
    }
    setIsLoading(true);

    let formData = algoNFData;
    formData.OrderQuantity =
      algoType == "nse"
        ? formData?.OrderQuantity
        : formData?.OrderQuantity * lotSize?.quotationLot;
    formData.Createddate = dayjs().toISOString();
    formData.Modifieddate = dayjs().toISOString();

    await asyncPostCustomerAlgoTrade({ formData })
      .then(async (result) => {
        setAlgoType("");
        successMsg("Algo Run Successfully...");
        getSymbolCategoryList();
      }) 
      .catch((err) => {
        handleCatchErrors(err, navigate);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const getNFAlgo = async (algoTradeId, lotSize, algoType) => {
    await asyncGetCustomerAlgoTradeByID({ CustAlgoTradeID: algoTradeId }).then(
      async (result) => {
        const data = result?.data?.result;

        setAlgoNFData({
          ...algoNFData,
          customerAlgoTradeID: data?.customerAlgoTradeID,
          CustomerID:localStorage.getItem("customerID"),
          IdentifierID: data?.identifierID,
          Identifier: data?.identifier,
          TradeType: data?.tradeType,
          ProductType: data?.productType,
          BrokerConfigID: data?.brokerConfigID,
          StratergyID: data?.stratergyID,
          OrderQuantity:
            algoType == "nse"
              ? data?.orderQuantity
              : data?.orderQuantity / lotSize?.quotationLot,
          AlgoType: data?.algoType,
          Stoploss: data?.stoploss,
          Takeprofit: data?.takeprofit,
          Status: data?.status,
          SpecificLimitofDay: data?.specificLimitofDay,
          OverallCapital: data?.overallCapital,
          TrailingStopLoss: data?.trailingStopLoss,
          OverallCapitalProfit: data?.overallCapitalProfit,
          TrailingProfit: data?.trailingProfit,
        });
        if (data?.overallCapital > 0) {
          setMaxLossToggle(true);
        } else {
          setMaxLossToggle(false);
        }

        if (data?.overallCapitalProfit > 0) {
          setMaxProfitToggle(true);
        } else {
          setMaxProfitToggle(false);
        }

        if (data?.trailingStopLoss > 0) {
          setTraillingSLToggle(true);
        } else {
          setTraillingSLToggle(false);
        }

        if (data?.trailingProfit > 0) {
          setTraillingProfitToggle(true);
        } else {
          setTraillingProfitToggle(false);
        }
      }
    );
  };

  const addToWatch = useCallback(async (symbolIdentifierId) => {
    setWatchLoading(true);
    const formData = {
      SymbolIdentifierId: symbolIdentifierId,
    };
    await asyncAddWatchList({ formData })
      .then(async (result) => {
        successMsg("Add to watch successfully...");
        getSymbolCategoryList();
      })
      .catch((err) => {
        handleCatchErrors(err, navigate);
      })
      .finally(() => {
        setTimeout(() => {
          setWatchLoading(false);
        }, 500);
      });
  }, []);



  return {
    symbolCategoryList: memoizedSymbolCategoryList,
    editAlgo,
    algoOptionData,
    symbolData,
    setSymbolData,
    changeAlgoState,
    enableAlgo,
    expiryList,
    strategyList,
    handleOptionChange,
    brokerList,
    optionTypeList,
    lotSize,
    maxLossToggle,
    setMaxLossToggle,
    maxProfitToggle,
    setMaxProfitToggle,
    traillingSLToggle,
    setTraillingSLToggle,
    traillingProfitToggle,
    setTraillingProfitToggle,
    bsOption,
    handleOptionSubmit,
    algoType,
    setAlgoType,
    formErrors,
    algoNFData,
    handleNFChange,
    handleNFSubmit,
    categoryLoading,
    dataLoading,
    addToWatch,
    isLoading,
    watchLoading,
    listButtonLoading,
    setSymbolCategoryList,
    dialogOpen,
    handleClickDialogOpen,
    handleDialogClose,
    subscriptionDialogMessage,
    activeSubscriptionFeatures,
    navigate
  };
};

export default useAlgo;

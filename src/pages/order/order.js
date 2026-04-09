import { convertNumeric } from "#helpers";
import {
  asyncGetDayOrderProfitLoss,
  asyncGetOrderListActive,
  asyncGetOrderListClosed,
  asyncOrderExit,
} from "#redux/order/action.js";
import { asyncGetSymbolCategory } from "#redux/symbol/symbolAction.js";
import { handleCatchErrors } from "#utils/validation";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const useOrder = () => {
  // Show page immediately - don't block on API calls
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isFilter, setIsFilter] = useState(false);
  const [totalBuy, setTotalBuy] = useState(0);
  const [totalSell, setTotalSell] = useState(0);
  const [todayPL, setTodayPL] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const filterObj = {
    AutoOrder: 0,
    indentifier: "",
    Pl: 0,
    CategoryId: 0,
  };
  const [filterData, setFilterData] = useState(filterObj);
  const [activeOrderList, setActiveOrderList] = useState([]);
  const [symbolCategory, setSymbolCategory] = useState([]);
  const [closedOrderList, setClosedOrderList] = useState([]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterData({ ...filterData, [name]: value });
  };

  const getActiveOrderList = async () => {
    setIsDataLoading(true);
    await asyncGetOrderListActive(filterData)
      .then((result) => {
        if (Array.isArray(result?.data?.result)) {
          setActiveOrderList(result?.data?.result);

          let totalBuy = 0;
          result?.data?.result?.map((val, key) => {
            totalBuy += val.entryPrice * val?.quantity;
          });
          setTotalBuy(convertNumeric(totalBuy));
        }else{
          setActiveOrderList([]);
          setTotalBuy(0);
        }
      })
      .catch((err) => {
        handleCatchErrors(err, navigate);
      })
      .finally(() => {
        setIsDataLoading(false);
      });
  };

  useEffect(() => {
    asyncGetDayOrderProfitLoss()
      .then((result) => {
        setTodayPL(convertNumeric(result?.data?.result));
      })
      .catch((err) => {
        handleCatchErrors(err, navigate);
      });
  }, [location?.pathname]);

  useEffect(() => {
    getActiveOrderList();
  }, [filterData, location?.pathname]);

  const handleOrderExit = (orderId) => {
    asyncOrderExit({ orderID: orderId })
      .then((result) => {
        getActiveOrderList();
      })
      .catch((err) => {
        handleCatchErrors(err, navigate);
      });
  };

  useEffect(() => {
    // Fetch symbol category in parallel - non-blocking
    asyncGetSymbolCategory()
      .then((result) => {
        setSymbolCategory(result?.data?.result);
      })
      .catch((err) => {
        handleCatchErrors(err, navigate);
      });
  }, []);

  const resetFilter = () => {
    setFilterData(filterObj);
  };

  const closedData = async (filterData = "") => {
    setIsDataLoading(true);
    await asyncGetOrderListClosed(filterData)
      .then((result) => {
        if (Array.isArray(result?.data?.result)) {
          setClosedOrderList(result?.data?.result);
          let totalSell = 0;
          result?.data?.result?.map((val, key) => {
            totalSell += val.entryPrice * val?.quantity;
          });
          setTotalSell(totalSell);
        }
      })
      .catch((err) => {
        handleCatchErrors(err, navigate);
      })
      .finally(() => {
        setIsDataLoading(false);
      });
  };

  useEffect(() => {
    closedData(filterData);
  }, [location?.pathname]);

  return {
    isLoading: isDataLoading, // Use isDataLoading for showing skeleton while data loads
    activeOrderList,
    symbolCategory,
    filterData,
    handleFilterChange,
    isFilter,
    setIsFilter,
    resetFilter,
    handleOrderExit,
    totalBuy,
    todayPL,
    closedOrderList,
    setClosedOrderList,
    closedData,
    totalSell,
  };
};

export default useOrder;

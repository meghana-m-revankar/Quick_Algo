import { dayName, daysRemaining } from "#hooks/useExpiryTime";
import { useGlobalServices } from "#services/global";
import { fetchSymbolExpiryList } from "#utils/watchList";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const useTradeOption = () => {
  const { headerSymbol } = useGlobalServices();
  const navigate = useNavigate();

  const [symbolExpiryTime, setSymbolExpiryTime] = useState([]);

  useEffect(() => {
    if (headerSymbol?.length > 0) {
      headerSymbol?.map(async (val, key) => {
        const expiryData = await fetchSymbolExpiryList(
          { strProduct: val?.name },
          navigate
        );
        setSymbolExpiryTime((prev) => ({
          ...prev,
          [val?.name]: {
            dayName: dayName(expiryData),
            remainingDay: daysRemaining(expiryData),
          },
        }));
      });
    }
  }, [headerSymbol]);

  return {
    headerSymbol,
    symbolExpiryTime
  };
};

export default useTradeOption;

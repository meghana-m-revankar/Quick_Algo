import {
  asyncGetTopGainers,
  asyncGetTopLosers,
} from "#redux/symbol/symbolAction.js";
import { handleCatchErrors } from "#utils/validation";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const useGainerLooser = () => {
  const [topGainer, setTopGainer] = useState([]);
  const [topLosers, setTopLosers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  useEffect(() => {
    asyncGetTopGainers()
      .then((result) => {
        setTopGainer(result?.data?.result);
      })
      .catch((err) => {
        handleCatchErrors(err, navigate);
      });

    asyncGetTopLosers()
      .then((result) => {
        setTopLosers(result?.data?.result);
      })
      .catch((err) => {
        handleCatchErrors(err, navigate);
      }).finally(() => {
        setIsLoading(false);
      });
  }, []);

  return {
    topGainer,
    topLosers,
    isLoading
  };
};

export default useGainerLooser;

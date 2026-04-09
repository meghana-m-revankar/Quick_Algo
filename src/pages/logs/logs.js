import { asyncGetSymbolCategoryAll } from "#redux/symbol/symbolAction.js";
import { handleCatchErrors } from "#utils/validation";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const useLogs = () => {
  const navigate = useNavigate();
  const [symbolAllCategory, setSymbolAllCategory] = useState([]);
  useEffect(() => {
    asyncGetSymbolCategoryAll()
      .then((result) => {
        setSymbolAllCategory(result?.data?.result);
      })
      .catch((err) => {
        handleCatchErrors(err, navigate);
      });
  }, []);
  return {
    symbolAllCategory,
  };
};

export default useLogs;

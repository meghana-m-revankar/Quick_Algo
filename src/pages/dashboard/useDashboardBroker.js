import { asyncGetCustBrokerConfig } from "#redux/symbol/symbolAction.js";
import { handleCatchErrors } from "#utils/validation";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobalServices } from "#services/global";

const useDashboardBroker = () => {
  const { brokerMasterList } = useGlobalServices();
  const [customerBrokerList, setCustomerBrokerList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getBrokersConfig();
  }, []);

  const getBrokersConfig = () => {
    asyncGetCustBrokerConfig({ sendData: "" })
      .then((result) => {
        const activeBrokers = result?.data?.result?.filter(
          (broker) => broker.status === true
        );
        setCustomerBrokerList(activeBrokers || []);
      })
      .catch((err) => {
        // Error fetching broker config
        handleCatchErrors(err, navigate);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return {
    brokerMasterList,
    isLoading,
    customerBrokerList,
    getBrokersConfig,
  };
};

export default useDashboardBroker;

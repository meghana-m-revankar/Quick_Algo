import { asyncGetCustBrokerConfig } from "#redux/symbol/symbolAction.js";
import { handleCatchErrors } from "#utils/validation";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobalServices } from "#services/global";
import Swal from "sweetalert2";
import { asyncPostCustBrokerStatus } from "#redux/broker/action.js";
import { errorMsg, successMsg } from "#helpers";

const useBroker = () => {
  const { brokerMasterList } = useGlobalServices();
  const [customerBrokerList, setCustomerBrokerList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    GetBokerMaster();
  }, []);

  const GetBokerMaster = () => {
    asyncGetCustBrokerConfig({})
      .then((result) => {
        const activeBroker = result?.data?.result.filter(
          (broker) => broker.status == true
        );
        setCustomerBrokerList(activeBroker);
      })
      .catch((err) => {
        handleCatchErrors(err, navigate);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const deactivateBroker = async ({ brokerId, brokerconfigID }) => {
    try {
      const confirmResult = await Swal.fire({
        title: "Are you sure?",
        text: "You Deactivate this broker!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, deactivate it!",
        confirmButtonColor: "#F3C619",
        cancelButtonText: "No, cancel!",
        customClass: {
          icon: "custom-warning-icon",
        },
      });

      const data = {
        BrokerID: brokerId,
        brokerconfigID: brokerconfigID,
        status: false,
      };

      if (confirmResult.isConfirmed) {
        asyncPostCustBrokerStatus({ formData: data })
          .then((result) => {
            if (result?.data?.status == "200") {
              successMsg("Broker Deactivated Successfully...");
              GetBokerMaster();
            } else {
              errorMsg(result?.data?.message);
            }
          })
          .catch((err) => {
            handleCatchErrors(err, navigate);
          });
      }
    } catch (error) {
      handleCatchErrors(error, navigate);
    }
  };

  return {
    brokerMasterList,
    isLoading,
    customerBrokerList,
    deactivateBroker,
  };
};

export default useBroker;

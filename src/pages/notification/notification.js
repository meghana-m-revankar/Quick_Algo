import {
  GetNotificationByCustomerID,
  UpdateNotificationStatus,
} from "#redux/global/action.js";
import { handleCatchErrors } from "#utils/validation";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const useNotification = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getNotification = async () => {
    await GetNotificationByCustomerID()
      .then((result) => {
        setNotifications(result?.data?.result);
        updateNotificationStatus(result?.data?.result);
      })

      .catch((err) => {
        handleCatchErrors(err, navigate);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const updateNotificationStatus = async (data) => {
    for (const item of data) {
      if (!item?.readStatus) {
        const formData = {
          NotificationID: item.notificationId,
          ReadStatus: 1,
        };

        await UpdateNotificationStatus(formData)
          .then((result) => {})
          .catch((err) => {
            handleCatchErrors(err, navigate);
          });
      }
    }
  };

  useEffect(() => {
    getNotification();
  }, []);
  return {
    notifications,
    isLoading,
  };
};

export default useNotification;

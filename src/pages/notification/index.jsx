import React from "react";
import useNotification from "./notification";
import "./notification.scss";

const Notification = () => {
  const { notifications } = useNotification();
  return (
    <section className="content notification_page">
      {notifications?.length > 0
        ? notifications.map((v, k) => {
            return (
              <div className="notification_list">
                <div className="notification_inner">
                  <h4>{v?.notificationSubject}</h4>
                  <p>{v?.activityDescription}</p>
                </div>
              </div>
            );
          })
        : ""}
    </section>
  );
};

export default Notification;

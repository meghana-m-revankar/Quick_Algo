import React, { useMemo } from "react";
import "./header.scss";
import { NavLink, useLocation } from "react-router-dom";

const OrderHeader = () => {
  const location = useLocation();

  const isPage = useMemo(() => {
    const pathSegments = location.pathname.split("/");

    return pathSegments[2];
  }, [location.pathname]);

  return (
    <div className="order_header_page ">
      <div className="order_item_list">
        <NavLink to={"/order/pending"}>
          <p className={`${isPage == "pending" ? "active" : "not-active"}`}>
            Pending
          </p>
        </NavLink>
        <NavLink to={"/order/active"}>
          <p className={`${isPage == "active" ? "active" : "not-active"}`}>
            Active
          </p>
        </NavLink>
        <NavLink to={"/order/closed"}>
          <p className={`${isPage == "closed" ? "active" : "not-active"}`}>
            Closed
          </p>
        </NavLink>
        <NavLink to={"/order/rejected"}>
          <p className={`${isPage == "rejected" ? "active" : "not-active"}`}>
            Rejected
          </p>
        </NavLink>
      </div>
    </div>
  );
};

export default OrderHeader;

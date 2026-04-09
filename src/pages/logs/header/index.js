import React, { useMemo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const LogsHeader = () => {
    const location = useLocation();

  const isPage = useMemo(() => {
    const pathSegments = location.pathname.split("/");

    return pathSegments[2];
  }, [location.pathname]);
  return (
    <div className="order_header_page padding">
      <div className="order_item_list">
       
        <NavLink to={"/logs/active"}>
          <p className={`${isPage == "active" ? "active" : "not-active"}`}>
            Active
          </p>
        </NavLink>
        <NavLink to={"/logs/close"}>
          <p className={`${isPage == "close" ? "active" : "not-active"}`}>
            Closed
          </p>
        </NavLink>
        <NavLink to={"/logs/reject"}>
          <p className={`${isPage == "reject" ? "active" : "not-active"}`}>
            Rejected
          </p>
        </NavLink>
      </div>
    </div>
  )
}

export default LogsHeader

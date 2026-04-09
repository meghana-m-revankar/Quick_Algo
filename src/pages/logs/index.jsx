import React, { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ActiveLogs, ClosedLogs, LogsHeader, RejectedLogs } from "..";
import "./logs.scss";
import { LogsContext } from "../../context";
import useLogs from "./logs";

const Logs = () => {
  const location = useLocation();
  const { symbolAllCategory } = useLogs();

  const navigate = useNavigate();

  const logsArr = ["active", "close", "reject"];
  const isLogHas = useMemo(() => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    const secondSegment = pathSegments[1]; // exact second part of the path
    return logsArr.includes(secondSegment); // exact match only
  }, [location.pathname]);

  useEffect(() => {
    if (!isLogHas) {
      navigate("/dashboard");
    }
  }, [isLogHas]);

  return (
    <div className="content logs_page">
      <div className="card-box">
        <LogsContext.Provider value={{ symbolAllCategory }}>
          {location.pathname == "/logs/active" ? <ActiveLogs /> : ""}
          {location.pathname == "/logs/close" ? <ClosedLogs /> : ""}
          {location.pathname == "/logs/reject" ? <RejectedLogs /> : ""}
        </LogsContext.Provider>
      </div>
    </div>
  );
};

export default Logs;

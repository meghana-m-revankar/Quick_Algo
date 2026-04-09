import React from "react";

const TooltipContent = ({ activeSubscriptionFeatures }) => {
  return (
    <div style={{ padding: "8px" }}>
      <strong>
        The following features are not available in your current package:
      </strong>
      <br />
      {!activeSubscriptionFeatures?.liveCharts?.enabled == false && (
        <>
          <span>
            <strong>Charting –</strong> Enables viewing live charts and doing
            your own analysis. This is for informational use only.
          </span>
          <br />
        </>
      )}
      {!activeSubscriptionFeatures?.strategyViewPage == false && (
        <>
          <span>
            <strong>Strategy View –</strong> Provides demo screenshots and
            videos of past strategies purely for educational reference.
          </span>
          <br />
        </>
      )}
      {!activeSubscriptionFeatures?.apiPage == false && (
        <>
          <span>
            <strong>API Access –</strong> Allows you to build and run your own
            strategies.
          </span>
          <br />
        </>
      )}
      {!activeSubscriptionFeatures?.manualTradeExitButton == false && (
        <>
          <span>
            <strong>Exit Button –</strong> Lets you manually close trades.
          </span>
          <br />
        </>
      )}
      {!activeSubscriptionFeatures?.manualTradeAllow == false && (
        <>
          <span>
            <strong>Manual Trade Button –</strong> Allows you to place manual
            orders.
          </span>
          <br />
        </>
      )}
      <span>
        <strong>
          Trade More Than {activeSubscriptionFeatures?.maxLots} Lots –
        </strong>{" "}
        Limited to {activeSubscriptionFeatures?.maxLots} lots in F&O.
      </span>
      <br />
      <br />
      <span>
        <strong>
          👉 To unlock these features, please contact your profile manager and
          upgrade your plan.
        </strong>
      </span>
      <br />
    </div>
  );
};

export default TooltipContent;

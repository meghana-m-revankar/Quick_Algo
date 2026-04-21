import React, { useState } from "react";
import useBroker from "./broker";
import "./broker.scss";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import { images } from "#helpers";
import { ShimmerThumbnail } from "react-shimmer-effects";
import { useNavigate } from "react-router-dom";
import Storage from "#services/storage";
import { useGlobalServices } from "#services/global";
import { SubscriptionDialog } from "#components";
// Modern icons
import {
  FiShield,
  FiCheckCircle,
  FiXCircle,
  FiSettings,
  FiDatabase,
  FiActivity,
  FiStar,
  FiAward,
  FiZap,
  FiTrendingUp,
} from "react-icons/fi";

const Broker = () => {
  const { brokerMasterList, isLoading, customerBrokerList, deactivateBroker } =
    useBroker();
  const { activeSubscriptionFeatures } = useGlobalServices();
  const navigate = useNavigate();
  const [subscriptionUpgradeOpen, setSubscriptionUpgradeOpen] = useState(false);
  const [subscriptionUpgradeMessage, setSubscriptionUpgradeMessage] = useState("");

  const handleSetupBroker1 = (brokerId) => {
    const maxBrokerLimit = activeSubscriptionFeatures?.maxBrokerAddLimitCount ?? 0;
    const currentBrokerCount = customerBrokerList?.length || 0;

    // No subscription or plan doesn't allow adding brokers – show modal, don't go to setup
    if (!(maxBrokerLimit > 0)) {
      setSubscriptionUpgradeMessage(
        "Please subscribe to a plan to add and connect brokers."
      );
      setSubscriptionUpgradeOpen(true);
      return;
    }

    // Subscription allows brokers but limit reached – show modal
    if (currentBrokerCount >= maxBrokerLimit) {
      setSubscriptionUpgradeMessage(
        `You have reached the maximum broker limit (${maxBrokerLimit}). Please upgrade your subscription to add more brokers.`
      );
      setSubscriptionUpgradeOpen(true);
      return;
    }

    // Allowed: save broker and go to setup
    Storage.saveBrokerSetupData(brokerId);
    navigate("/setup");
  };
const handleSetupBroker = (brokerId) => {
  // ✅ Save data to storage
  Storage.saveBrokerSetupData(brokerId);
  
  // ✅ Update this line to include the ID in the URL
  // This matches the "/setup/:id" route in your RouteArr
  navigate(`/setup/${brokerId}`);
};
const mergedBrokers = brokerMasterList?.map((broker) => {
  const active = customerBrokerList?.find(
    (cb) => cb.brokerID === broker.brokerID
  );

  return {
    ...broker,
    isActive: !!active,
    status: active?.status,
    brokerconfigID: active?.brokerconfigID,
  };
});
  return (
   <section className="content broker_page">
  <div className="card-box bg-white">
    {/* Compact Header Section (Commented out as requested) */}
    {/* <div className="page-header">...</div> */}

    <div className="box-body">
      <div className="alert alert-info small mb-1" role="alert">
  All trademarks, logos, and brand names featured on this platform belong
  to their respective owners and are used solely for informational reference.
</div>
     <div className="table-responsive mt-3">
  <table className="table table-hover align-middle">
    <thead className="table-light">
      <tr>
        <th>Broker</th>
        <th>Status</th>
        <th>Action</th>
      </tr>
    </thead>

    <tbody>
      {isLoading ? (
        <tr>
          <td colSpan="3" className="text-center">
            Loading brokers...
          </td>
        </tr>
      ) : (
        mergedBrokers?.map((val, key) => (
          <tr key={key}>
            {/* Broker */}
            <td>
              <div className="d-flex align-items-center gap-3">
                <img
                  src={images[`broker/${val?.brokerName}.png`]}
                  alt={val?.brokerName}
                  style={{ width: 35, height: 35, objectFit: "contain" }}
                />
                <span className="fw-semibold">{val?.brokerName}</span>
              </div>
            </td>

            {/* Status */}
            <td>
              {val.isActive ? (
                <div
                  className={`d-flex align-items-center gap-2 ${
                    val?.status ? "text-success" : "text-danger"
                  }`}
                >
                  <FiActivity size={14} />
                  <span className="fw-medium">
                    {val?.status ? "Active" : "Disconnected"}
                  </span>
                </div>
              ) : (
                <span className="badge bg-soft-secondary text-muted border px-3">
                  Not Connected
                </span>
              )}
            </td>

            {/* Action */}
            <td>
              {val.isActive ? (
                <button
                  type="button"
                  onClick={() =>
                    deactivateBroker({
                      brokerId: val?.brokerID,
                      brokerconfigID: val?.brokerconfigID,
                    })
                  }
                  className="btn btn-outline-danger btn-sm d-flex align-items-center gap-2"
                >
                  <FiXCircle size={14} />
                  Deactivate
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-success btn-sm d-flex align-items-center gap-2"
                  onClick={() => handleSetupBroker(val?.brokerID)}
                >
                  <FiSettings size={14} />
                  Setup Broker
                </button>
              )}
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>
    </div>
  
  </div>

  {subscriptionUpgradeOpen && (
    <SubscriptionDialog
      open={subscriptionUpgradeOpen}
      handleClose={() => setSubscriptionUpgradeOpen(false)}
      message={subscriptionUpgradeMessage}
    />
  )}
</section>
  );
};

export default Broker;

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

  const handleSetupBroker = (brokerId) => {
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

  return (
    <section className="content broker_page">
      <div className="card-box">
        {/* Compact Header Section */}
        {/* <div className="page-header">
          <div className="header-left">
            <div className="header-icon">
              <FiShield className="icon" />
            </div>
            <div className="header-text">
              <h1 className="page-title">Broker Management</h1>
              <p className="page-subtitle">
                Connect and manage your trading brokers
              </p>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <FiDatabase className="stat-icon" />
              <span className="stat-number">
                {brokerMasterList?.length || 0}
              </span>
              <span className="stat-label">Available</span>
            </div>
            <div className="stat-item">
              <FiActivity className="stat-icon" />
              <span className="stat-number">
                {customerBrokerList?.length || 0}
              </span>
              <span className="stat-label">Active</span>
            </div>
          </div>
        </div> */}

        <div className="box-body">
          <Tabs
            defaultActiveKey={window.location.hash.slice(1) || "all-broker"}
            id="broker-tabs"
            className="broker-tabs"
            onSelect={(key) => {
              // Update URL hash when tab changes
              window.location.hash = key;
            }}
          >
            <Tab
              eventKey="all-broker"
              title={
                <div className="tab-title">
                  <FiStar className="tab-icon" />
                  <span>Top SEBI Registered Brokers</span>
                  <span className="tab-count">
                    ({brokerMasterList?.length})
                  </span>
                </div>
              }
            >
              <div className="broker-grid">
                {isLoading
                  ? Array.from({ length: 6 }, (_, index) => (
                      <div key={index} className="broker-card-skeleton">
                        <ShimmerThumbnail width={280} height={200} rounded />
                      </div>
                    ))
                  : brokerMasterList?.map((val, key) => (
                      <div key={key} className="broker-card">
                        <div className="card-header">
                          <div className="broker-logo">
                            <img
                              src={images[`broker/${val?.brokerName}.png`]}
                              alt={val?.brokerName}
                              className="logo-image"
                            />
                          </div>
                          <div className="broker-info">
                            <h3 className="broker-name">{val?.brokerName}</h3>
                            <div className="broker-badge">
                              <FiAward className="badge-icon" />
                              <span>SEBI Registered</span>
                            </div>
                          </div>
                        </div>

                        <div className="card-body">
                          <div className="broker-details">
                            <div className="detail-item">
                              <FiZap className="detail-icon" />
                              <span className="detail-label">Status</span>
                              <span className="detail-value status-available">
                                Available
                              </span>
                            </div>
                          </div>

                          <div className="market-support">
                            <div className="market-support-label">
                              <FiTrendingUp className="label-icon" />
                              <span className="label-text">Market Support</span>
                            </div>
                            <div className="exchange-buttons">
                              <span className="exchange-btn nse">NSE</span>
                              <span className="exchange-btn bse">BSE</span>
                              <span className="exchange-btn mcx">MCX</span>
                            </div>
                          </div>
                        </div>

                        <div className="card-footer">
                          <button
                            type="button"
                            className="btn btn-primary btn-setup"
                            onClick={() => handleSetupBroker(val?.brokerID)}
                          >
                            <FiSettings className="btn-icon" />
                            Setup Broker
                          </button>
                        </div>
                      </div>
                    ))}
              </div>
            </Tab>

            <Tab
              eventKey="active-broker"
              title={
                <div className="tab-title">
                  <FiCheckCircle className="tab-icon" />
                  <span>My Active Brokers</span>
                  <span className="tab-count">
                    ({customerBrokerList?.length})
                  </span>
                </div>
              }
            >
              <div className="broker-grid">
                {isLoading ? (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading your brokers...</p>
                  </div>
                ) : customerBrokerList?.length > 0 ? (
                  customerBrokerList?.map((val, key) => (
                    <div key={key} className="broker-card active-broker">
                      <div className="card-header">
                        <div className="broker-logo">
                          <img
                            src={images[`broker/${val?.brokerName}.png`]}
                            alt={val?.brokerName}
                            className="logo-image"
                          />
                        </div>
                        <div className="broker-info">
                          <h3 className="broker-name">{val?.brokerName}</h3>
                          <div
                            className={`status-indicator ${
                              val?.status ? "active" : "inactive"
                            }`}
                          >
                            <FiCheckCircle className="status-icon" />
                            <span>{val?.status ? "Active" : "Inactive"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="card-body">
                        <div className="broker-details">
                          <div className="detail-item">
                            <FiActivity className="detail-icon" />
                            <span className="detail-label">Status</span>
                            <span
                              className={`detail-value status-${
                                val?.status ? "active" : "inactive"
                              }`}
                            >
                              {val?.status ? "Connected" : "Disconnected"}
                            </span>
                          </div>
                        </div>

                        <div className="market-support">
                          <div className="market-support-label">
                            <FiTrendingUp className="label-icon" />
                            <span className="label-text">Market Support</span>
                          </div>
                          <div className="exchange-buttons">
                            <span className="exchange-btn nse">NSE</span>
                            <span className="exchange-btn bse">BSE</span>
                            <span className="exchange-btn mcx">MCX</span>
                          </div>
                        </div>
                      </div>

                      <div className="card-footer">
                        <button
                          type="button"
                          onClick={() =>
                            deactivateBroker({
                              brokerId: val?.brokerID,
                              brokerconfigID: val?.brokerconfigID,
                            })
                          }
                          className="btn btn-danger btn-deactivate"
                        >
                          <FiXCircle className="btn-icon" />
                          Deactivate
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <FiShield className="icon" />
                    </div>
                    <h3>No Active Brokers</h3>
                    <p>
                      You haven't connected any brokers yet. Start by setting up
                      your first broker from the available list above.
                    </p>
                  </div>
                )}
              </div>
            </Tab>
          </Tabs>
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

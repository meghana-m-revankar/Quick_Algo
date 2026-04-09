import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import paymentService from "../../services/paymentService";
import chartAxios from "../../services/chartAxios";
import { useGlobalServices } from "#services/global";
import "./serviceCost.scss";

const Plans = () => {
  const { userDetail } = useSelector((state) => state.userDetails);
  const { kycStatus, kycLoading } = useGlobalServices();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [highlightDifferences, setHighlightDifferences] = useState(false);
  const [hideCommonFeatures, setHideCommonFeatures] = useState(false);

  // Single API: GET /api/subscription/public/active (with auth header when logged in for disabled/hidden)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingSubscriptions(true);
        const plansRes = await chartAxios.get(
          "/api/subscription/public/active",
        );
        if (plansRes.data.success && Array.isArray(plansRes.data.data)) {
          setSubscriptions(plansRes.data.data);
        } else {
          setSubscriptions([]);
        }

        if (userDetail) {
          try {
            let activeSubResponse;
            if (typeof paymentService.getActiveSubscription === "function") {
              activeSubResponse = await paymentService.getActiveSubscription();
            } else {
              const response = await chartAxios.get(
                "/api/payment/active-subscription",
              );
              activeSubResponse = response.data;
            }
            if (activeSubResponse?.success) {
              setActiveSubscription(activeSubResponse.data || null);
            } else {
              setActiveSubscription(null);
            }
          } catch (error) {
            console.error("Error fetching active subscription:", error);
            setActiveSubscription(null);
          }
        } else {
          setActiveSubscription(null);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setSubscriptions([]);
      } finally {
        setLoadingSubscriptions(false);
      }
    };

    fetchData();
  }, [userDetail]);

  const handlePayment = async (subscriptionId, planType, planMeta = {}) => {
    // Skip payment for free plan

    // Check if user is logged in
    if (!userDetail) {
      alert("Please login to proceed with payment");
      navigate("/login");
      return;
    }

    // Require completed KYC before starting paid subscription purchase
    if (kycStatus !== "completed") {
      const result = await Swal.fire({
        title: "KYC Required",
        html: "You need to complete your KYC (Know Your Customer) verification before purchasing a subscription. Please complete KYC to proceed.",
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "Complete KYC",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#3B82F6",
        cancelButtonColor: "#6B7280",
      });
      if (result.isConfirmed) {
        navigate("/kyc");
      }
      return;
    }

    // Validate user details
    if (!userDetail.fullName || !userDetail.emailid || !userDetail.mobileNo) {
      alert(
        "Please complete your profile (Name, Email, Phone) before making payment",
      );
      navigate("/profile");
      return;
    }

    try {
      setLoading(planType);

      // Open checkout page (address/details + summary), then payment will be initiated there.
      navigate("/checkout", {
        state: {
          subscriptionId,
          planType,
          planName: planMeta?.name || "",
          priceValue: planMeta?.priceValue ?? null,
          priceLabel: planMeta?.price || "",
          duration: planMeta?.duration ?? null,
          isTrial: planMeta?.isTrial ?? false,
        },
      });
    } catch (error) {
      console.error("Payment Error:", error);
      alert(
        error.response?.data?.message ||
          error.message ||
          "Failed to initiate payment. Please try again.",
      );
      setLoading(null);
    }
  };

  // Format price with Indian currency
  const formatPrice = (price) => {
    if (price === 0) return "₹0";
    return `₹${price.toLocaleString("en-IN")}`;
  };

  // Map subscriptions to plans format for display
  const getPlanBadge = (planType) => {
    return null;
  };

  // Theme-aligned button variant: primary (default), success (yearly/popular), free/disabled handled in SCSS

  const plans =
    subscriptions.length > 0
      ? subscriptions
          .filter((sub) => !sub.hidden)
          .map((sub) => ({
            id: sub._id,
            name: sub.title,
            price: formatPrice(sub.price || 0),
            priceValue: sub.price || 0,
            planType: sub.planType || "monthly",
            badge: getPlanBadge(sub.planType || "monthly"),
            isTrial: sub.isTrial,
            duration: sub.duration,
            description: sub.description,
            subscription: sub,
            disabled: !!sub.disabled,
          }))
      : [];

  // Generate features based on subscription data from database
  const generateFeatures = (subscription) => {
    const features = [];

    // Backtest
    if (subscription.backtest?.enabled !== undefined) {
      features.push({
        feature: "Backtest",
        value: subscription.backtest.enabled
          ? `Enabled (${subscription.backtest.creditsCount || 0} credits)`
          : "Disabled",
        available: subscription.backtest.enabled,
      });
    }

    // API Access
    if (subscription.apiAccess !== undefined) {
      features.push({
        feature: "API Access",
        value: subscription.apiAccess ? "Enabled" : "Disabled",
        available: subscription.apiAccess,
      });
    }

    // Manual Trade
    if (subscription.manualTrade !== undefined) {
      features.push({
        feature: "Manual Trade",
        value: subscription.manualTrade ? "Enabled" : "Disabled",
        available: subscription.manualTrade,
      });
    }

    // Manual Trade Allow
    if (subscription.manualTradeAllow !== undefined) {
      features.push({
        feature: "Manual Trade Allowed",
        value: subscription.manualTradeAllow ? "Yes" : "No",
        available: subscription.manualTradeAllow,
      });
    }

    // Manual Trade Exit Button
    if (subscription.manualTradeExitButton !== undefined) {
      features.push({
        feature: "Manual Trade Exit Button",
        value: subscription.manualTradeExitButton ? "Enabled" : "Disabled",
        available: subscription.manualTradeExitButton,
      });
    }

    // Max Lots
    if (subscription.maxLots !== undefined) {
      features.push({
        feature: "Max Lots",
        value: subscription.maxLots > 0 ? subscription.maxLots : "Unlimited",
        available: subscription.maxLots > 0,
      });
    }

    // Live Charts
    if (subscription.liveCharts?.enabled !== undefined) {
      features.push({
        feature: "Live Charts",
        value: subscription.liveCharts.enabled
          ? `Enabled (${subscription.liveCharts.chartsCount || 0} charts)`
          : "Disabled",
        available: subscription.liveCharts.enabled,
      });
    }

    // Create Strategy
    if (subscription.createStrategy !== undefined) {
      features.push({
        feature: "Create Strategy",
        value: subscription.createStrategy ? "Enabled" : "Disabled",
        available: subscription.createStrategy,
      });
    }

    // Max Broker Add Limit Count
    if (subscription.maxBrokerAddLimitCount !== undefined) {
      features.push({
        feature: "Max Broker Add Limit",
        value:
          subscription.maxBrokerAddLimitCount > 0
            ? subscription.maxBrokerAddLimitCount
            : "Unlimited",
        available: subscription.maxBrokerAddLimitCount > 0,
      });
    }

    // Option Chain Buy
    if (subscription.optionChain?.buy !== undefined) {
      features.push({
        feature: "Option Chain Buy",
        value: subscription.optionChain.buy ? "Enabled" : "Disabled",
        available: subscription.optionChain.buy,
      });
    }

    // Option Chain Sell
    if (subscription.optionChain?.sell !== undefined) {
      features.push({
        feature: "Option Chain Sell",
        value: subscription.optionChain.sell ? "Enabled" : "Disabled",
        available: subscription.optionChain.sell,
      });
    }

    // Top Gainer Loser
    if (subscription.topGainerLoser !== undefined) {
      features.push({
        feature: "Top Gainer & Loser",
        value: subscription.topGainerLoser ? "Enabled" : "Disabled",
        available: subscription.topGainerLoser,
      });
    }

    // Setup Algo
    if (subscription.setupAlgo !== undefined) {
      features.push({
        feature: "Setup Algo",
        value: subscription.setupAlgo ? "Enabled" : "Disabled",
        available: subscription.setupAlgo,
      });
    }

    return features;
  };

  // Build comparison table: all feature names (union), values per plan, common/diff flags
  const comparisonTable = React.useMemo(() => {
    if (!plans.length) return { featureRows: [], planCount: 0 };
    const featuresByPlan = plans.map((plan) => ({
      plan,
      features: plan.subscription ? generateFeatures(plan.subscription) : [],
    }));
    const featureNameSet = new Set();
    featuresByPlan.forEach(({ features }) =>
      features.forEach((f) => featureNameSet.add(f.feature)),
    );
    const firstPlanFeatures = featuresByPlan[0]?.features || [];
    const orderedNames = [
      ...firstPlanFeatures.map((f) => f.feature),
      ...[...featureNameSet].filter(
        (n) => !firstPlanFeatures.some((f) => f.feature === n),
      ),
    ];
    const getValueForPlan = (featureName, planFeatures) => {
      const f = planFeatures.find((x) => x.feature === featureName);
      if (!f) return { value: "—", available: undefined };
      return { value: f.value, available: f.available };
    };
    const featureRows = orderedNames.map((featureName) => {
      const cells = featuresByPlan.map(({ features }) =>
        getValueForPlan(featureName, features),
      );
      const valuesStr = cells.map((c) => String(c.value));
      const isCommon =
        valuesStr.length > 0 &&
        valuesStr.every((v) => v === valuesStr[0]);
      const cellsWithDiff = cells.map((c, colIndex) => {
        const isDiff =
          !isCommon && valuesStr.some((v, i) => i !== colIndex && v !== valuesStr[colIndex]);
        return { ...c, isDiff };
      });
      return {
        featureName,
        cells: cellsWithDiff,
        isCommon,
      };
    });
    return {
      featureRows,
      planCount: plans.length,
      featuresByPlan,
    };
  }, [plans]);

  const visibleRows = React.useMemo(() => {
    if (hideCommonFeatures) {
      return comparisonTable.featureRows.filter((row) => !row.isCommon);
    }
    return comparisonTable.featureRows;
  }, [comparisonTable.featureRows, hideCommonFeatures]);

  const showKycBanner = userDetail && !kycLoading && kycStatus !== "completed";

  return (
    <section className="content plans-page">
      <div className="plans-container">
        <div className="plans-header">
          <p className="plans-title-desc">
            <span className="plans-title-dark">Pricing</span>
            {" — "}
            Simple and transparent plans with powerful tools to automate your trading using QuickAlgoPlus. 🚀
          </p>
        </div>
        {showKycBanner && (
          <div className="plans-kyc-alert" role="alert">
            <span className="kyc-alert-icon" aria-hidden="true">
              ℹ️
            </span>
            <span className="kyc-alert-text">
              Please complete your KYC to purchase a paid subscription.
            </span>
            <button
              type="button"
              className="kyc-alert-btn"
              onClick={() => navigate("/kyc")}
            >
              Complete KYC
            </button>
          </div>
        )}

        {loadingSubscriptions ? (
          <div className="plans-loading">
            <div className="plans-loading-spinner" />
            <p>Loading plans...</p>
          </div>
        ) : (
          <div className="plans-comparison-section">
            <div className="plans-comparison-controls">
              <label className="plans-checkbox-label">
                <input
                  type="checkbox"
                  checked={highlightDifferences}
                  onChange={(e) => setHighlightDifferences(e.target.checked)}
                />
                <span>Highlight differences</span>
              </label>
              <label className="plans-checkbox-label">
                <input
                  type="checkbox"
                  checked={hideCommonFeatures}
                  onChange={(e) => setHideCommonFeatures(e.target.checked)}
                />
                <span>Hide common features</span>
              </label>
            </div>

            <div className="plans-comparison-table-wrap">
              <table className="plans-comparison-table">
                <thead>
                  <tr>
                    <th className="plans-table-feature-col">Feature</th>
                    {plans.map((plan, planIndex) => {
                      const isActivePlan =
                        activeSubscription?.subscriptionId &&
                        plan.id &&
                        activeSubscription.subscriptionId.toString() ===
                          plan.id.toString();
                      const isDisabled =
                        plan.disabled ||
                        loading === plan?.planType ||
                        isActivePlan;
                      return (
                        <th key={planIndex} className="plans-table-plan-col">
                          <div className="plans-table-plan-header">
                            <span className="plans-table-plan-name">
                              {plan.name}
                            </span>
                            <span className="plans-table-plan-price">
                              {plan.isTrial ? "Trial" : plan.price}
                            </span>
                            <button
                              type="button"
                              className={`payment-button plans-table-cta ${isDisabled ? "plans-table-cta--outline-subscribed" : "btn-primary-plan"}`}
                              onClick={() =>
                                handlePayment(plan.id, plan?.planType, {
                                  name: plan.name,
                                  price: plan.price,
                                  priceValue: plan.priceValue,
                                  duration: plan.duration,
                                  isTrial: plan.isTrial,
                                })
                              }
                              disabled={isDisabled}
                              title={
                                plan.disabled
                                  ? "You can only upgrade or renew with same or higher tier."
                                  : ""
                              }
                            >
                              {loading === plan?.planType
                                ? "Processing..."
                                : isActivePlan
                                  ? "Already Subscribed"
                                  : plan?.planType === "free"
                                    ? "Current Plan"
                                    : plan.disabled
                                      ? "Lower tier (disabled)"
                                      : "Subscribe"}
                            </button>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={(comparisonTable.planCount || 1) + 1}
                        className="plans-table-empty"
                      >
                        {hideCommonFeatures
                          ? "No differing features — all plans have the same values for displayed features."
                          : "No features available."}
                      </td>
                    </tr>
                  ) : (
                    visibleRows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        <td className="plans-table-feature-col">
                          {row.featureName}
                        </td>
                        {row.cells.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className={
                              highlightDifferences && cell.isDiff
                                ? "feature-cell--diff"
                                : ""
                            }
                          >
                            <div className="feature-item">
                              {cell.available !== undefined && (
                                <span
                                  className={`feature-icon ${cell.available ? "available" : "unavailable"}`}
                                >
                                  {cell.available ? "✓" : "✗"}
                                </span>
                              )}
                              <span className="feature-text">{cell.value}</span>
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Plans;

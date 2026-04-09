import React from "react";
import { useNavigate } from "react-router-dom";
import { IconRegistry, ButtonLoader } from "#components";
import "./kycRegister.scss";
import useKycRegister from "./kycRegister";
import { SebiLink } from "#constant/index";

const KycRegister = () => {
  const navigate = useNavigate();
  const {
    formData,
    formErrors,
    readonlyFields,
    handleChange,
    handleSubmit,
    submitting,
    loadingCountries,
    loadingStates,
    loadingCities,
    countries,
    states,
    cities,
    kycCheckLoading,
    kycStatus,
    kycData,
    workflowUrl,
    kycDaysUntilExpiry,
    kycExpired,
    kycExpiringSoon,
    showRenewForm,
    setShowRenewForm,
  } = useKycRegister();

  const showStateOnly =
    !kycCheckLoading &&
    (kycStatus === "completed" || kycStatus === "pending") &&
    !showRenewForm;

  if (kycCheckLoading) {
    return (
      <div className="modern-kyc-page kyc-page-loading">
        <div className="kyc-fullpage-loading">
          <div className="kyc-state-spinner" />
          <p>Checking KYC status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-kyc-page">
      <div className={`kyc-container ${showStateOnly ? "kyc-state-only" : ""}`}>
        {!showStateOnly && (
          <div className="welcome-section">
            <div className="welcome-content">
              <div className="kyc-badge">Client KYC</div>
              <h1 className="welcome-title">Guidelines</h1>

              <div className="welcome-note">
                <strong>*SEBI</strong> has issued Circular No.{" "}
                <a
                  href={SebiLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="welcome-link"
                >
                  SEBI Circulars
                </a>{" "}
                regarding KYC requirements and maintenance of record.
              </div>

              <div className="welcome-list">
                <div className="welcome-list-title">KYC Requirements</div>
                <ul>
                  <li>
                    Consent can be obtained via e-signature or physical
                    signature.
                  </li>
                  <li>KYC records are verified from KRA as per regulations.</li>
                  <li>
                    Maintain record of all interactions with clients, including:
                  </li>
                  <li className="sub">
                    Physical record written & signed by client
                  </li>
                  <li className="sub">Telephone recordings</li>
                  <li className="sub">Email from registered email id</li>
                  <li className="sub">Record of SMS messages</li>
                  <li className="sub">Any other legally verifiable record</li>
                </ul>
              </div>

              <div className="copyright-section-left">
                <p className="copyright-text">
                  Copyright © 2021-{new Date().getFullYear()} QUICK ALGO+. All
                  rights reserved.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="form-section">
          <div className="form-container wide">
            {kycStatus === "completed" &&
              !kycExpired &&
              (kycDaysUntilExpiry === null || kycDaysUntilExpiry > 0) &&
              !showRenewForm && (
                <div className="kyc-state-card kyc-complete-card">
                  <span className="kyc-complete-badge">Verified</span>
                  <div className="kyc-state-icon success">
                    <IconRegistry name="check-circle" />
                  </div>
                  <h2 className="signin-title">KYC is complete</h2>
                  {kycExpiringSoon && (
                    <p className="kyc-state-message kyc-expiring-notice">
                      Your KYC is expiring in {kycDaysUntilExpiry ?? 0} day(s).
                      Please renew to continue without interruption.
                    </p>
                  )}
                  {!kycExpiringSoon && (
                    <p className="kyc-state-message">
                      Your KYC has been verified. Choose a subscription plan,
                      add broker, or go to dashboard.
                    </p>
                  )}
                  {kycData?.name && (
                    <div className="kyc-state-details">
                      <p>
                        <strong>Name:</strong> {kycData.name}
                      </p>
                      {kycData.email && (
                        <p>
                          <strong>Email:</strong> {kycData.email}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="kyc-state-actions">
                    {kycExpiringSoon && (
                      <button
                        type="button"
                        className="signin-button signin-button--renew"
                        onClick={() => setShowRenewForm(true)}
                      >
                        Renew KYC
                      </button>
                    )}
                    <button
                      type="button"
                      className="signin-button signin-button--subscription"
                      onClick={() => navigate("/plans")}
                    >
                      View Subscription Plans
                    </button>
                    <button
                      type="button"
                      className="signin-button"
                      onClick={() => navigate("/setup")}
                    >
                      Add Broker
                    </button>
                    <button
                      type="button"
                      className="signin-button secondary"
                      onClick={() => navigate("/dashboard")}
                    >
                      Go to Dashboard
                    </button>
                  </div>
                </div>
              )}

            {kycStatus === "completed" &&
              (kycExpired || kycDaysUntilExpiry === 0) &&
              !showRenewForm && (
                <div className="kyc-state-card kyc-expired-card">
                  <span className="kyc-expired-badge">Expired</span>
                  <div className="kyc-state-icon expired">
                    <IconRegistry name="clock" />
                  </div>
                  <h2 className="signin-title">KYC has expired</h2>
                  <p className="kyc-state-message">
                    Your KYC has expired. Please renew to continue using all
                    features.
                  </p>
                  {kycData?.name && (
                    <div className="kyc-state-details">
                      <p>
                        <strong>Name:</strong> {kycData.name}
                      </p>
                      {kycData.email && (
                        <p>
                          <strong>Email:</strong> {kycData.email}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="kyc-state-actions">
                    <button
                      type="button"
                      className="signin-button signin-button--renew"
                      onClick={() => setShowRenewForm(true)}
                    >
                      Renew KYC
                    </button>
                  </div>
                </div>
              )}

            {kycStatus === "pending" && (
              <div className="kyc-state-card kyc-pending-card">
                <div className="kyc-state-icon pending">
                  <IconRegistry name="clock" />
                </div>
                <h2 className="signin-title">Pending KYC</h2>
                <p className="kyc-state-message">
                  Your e-sign is pending. Complete the process using the link
                  below.
                </p>
                {kycData && (
                  <div className="kyc-state-details">
                    {kycData.name && (
                      <p>
                        <strong>Name:</strong> {kycData.name}
                      </p>
                    )}
                    {kycData.email && (
                      <p>
                        <strong>Email:</strong> {kycData.email}
                      </p>
                    )}
                    {kycData.phone_no && (
                      <p>
                        <strong>Phone:</strong> {kycData.phone_no}
                      </p>
                    )}
                  </div>
                )}
                {workflowUrl ? (
                  <div className="kyc-state-actions">
                    <button
                      type="button"
                      className="signin-button"
                      onClick={() => (window.location.href = workflowUrl)}
                    >
                      Complete E-sign
                    </button>
                  </div>
                ) : (
                  <p className="kyc-state-note">
                    E-sign link will be available after registration. Submit the
                    form below to get a new link.
                  </p>
                )}
              </div>
            )}

            {(showRenewForm ||
              (kycStatus !== "completed" &&
                (kycStatus !== "pending" || !workflowUrl))) && (
              <>
                <h2 className="signin-title">
                  {showRenewForm ? "Renew KYC" : "KYC Registration"}
                </h2>

                <form onSubmit={handleSubmit} className="kyc-form">
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="Name" className="form-label">
                        Name <span className="req">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-icon">
                          <IconRegistry name="user" />
                        </span>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Enter Name"
                          name="Name"
                          id="Name"
                          value={formData?.Name}
                          onChange={handleChange}
                          disabled={readonlyFields?.Name}
                        />
                      </div>
                      {formErrors?.Name && (
                        <div className="error-message">{formErrors?.Name}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="EmailId" className="form-label">
                        Email address <span className="req">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-icon">
                          <IconRegistry name="mail" />
                        </span>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Enter Email"
                          name="EmailId"
                          id="EmailId"
                          value={formData?.EmailId}
                          onChange={handleChange}
                          disabled={readonlyFields?.EmailId}
                        />
                      </div>
                      {formErrors?.EmailId && (
                        <div className="error-message">
                          {formErrors?.EmailId}
                        </div>
                      )}
                    </div>

                    <div className="form-group full">
                      <label htmlFor="DateOfBirth" className="form-label">
                        Date of birth <span className="req">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-icon">
                          <IconRegistry name="clock" />
                        </span>
                        <input
                          type="date"
                          className="form-input"
                          name="DateOfBirth"
                          id="DateOfBirth"
                          value={formData?.DateOfBirth}
                          onChange={handleChange}
                        />
                      </div>
                      {formErrors?.DateOfBirth && (
                        <div className="error-message">
                          {formErrors?.DateOfBirth}
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="PanNo" className="form-label">
                        Pan card no <span className="req">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-icon">
                          <IconRegistry name="file-text" />
                        </span>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="ABCDE1234F"
                          name="PanNo"
                          id="PanNo"
                          value={formData?.PanNo}
                          onChange={handleChange}
                          maxLength={10}
                        />
                      </div>
                      {formErrors?.PanNo && (
                        <div className="error-message">{formErrors?.PanNo}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="FatherName" className="form-label">
                        Father name <span className="req">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-icon">
                          <IconRegistry name="user" />
                        </span>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Enter Father Name"
                          name="FatherName"
                          id="FatherName"
                          value={formData?.FatherName}
                          onChange={handleChange}
                        />
                      </div>
                      {formErrors?.FatherName && (
                        <div className="error-message">
                          {formErrors?.FatherName}
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="Phone" className="form-label">
                        Phone No <span className="req">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-icon">
                          <IconRegistry name="phone" />
                        </span>
                        <input
                          type="tel"
                          className="form-input"
                          placeholder="Enter Phone No"
                          name="Phone"
                          id="Phone"
                          value={formData?.Phone}
                          onChange={handleChange}
                          maxLength={10}
                          disabled={readonlyFields?.Phone}
                        />
                      </div>
                      {formErrors?.Phone && (
                        <div className="error-message">{formErrors?.Phone}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="Address" className="form-label">
                        Address <span className="req">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-icon">
                          <IconRegistry name="book" />
                        </span>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Enter Address"
                          name="Address"
                          id="Address"
                          value={formData?.Address}
                          onChange={handleChange}
                        />
                      </div>
                      {formErrors?.Address && (
                        <div className="error-message">
                          {formErrors?.Address}
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="Country" className="form-label">
                        Country <span className="req">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-icon">
                          <IconRegistry name="target" />
                        </span>
                        <select
                          className="form-input select-input"
                          name="Country"
                          id="Country"
                          value={formData?.Country}
                          onChange={handleChange}
                          disabled={loadingCountries}
                        >
                          <option value="">
                            {loadingCountries ? "Loading..." : "Select"}
                          </option>
                          {countries?.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      {formErrors?.Country && (
                        <div className="error-message">
                          {formErrors?.Country}
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="State" className="form-label">
                        State <span className="req">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-icon">
                          <IconRegistry name="chevron-down" />
                        </span>
                        <select
                          className="form-input select-input"
                          name="State"
                          id="State"
                          value={formData?.State}
                          onChange={handleChange}
                          disabled={loadingStates || !formData?.Country}
                        >
                          <option value="">
                            {loadingStates ? "Loading..." : "Select"}
                          </option>
                          {states?.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      {formErrors?.State && (
                        <div className="error-message">{formErrors?.State}</div>
                      )}
                    </div>

                    <div className="form-group full">
                      <label htmlFor="City" className="form-label">
                        City <span className="req">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-icon">
                          <IconRegistry name="chevron-down" />
                        </span>
                        <select
                          className="form-input select-input"
                          name="City"
                          id="City"
                          value={formData?.City}
                          onChange={handleChange}
                          disabled={loadingCities || !formData?.State}
                        >
                          <option value="">
                            {loadingCities ? "Loading..." : "Select"}
                          </option>
                          {cities?.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      {formErrors?.City && (
                        <div className="error-message">{formErrors?.City}</div>
                      )}
                    </div>
                  </div>

                  <div className="kyc-form-submit-wrap">
                    <button
                      type="submit"
                      className="signin-button"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <ButtonLoader isloading={true} />
                      ) : (
                        "Submit"
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KycRegister;

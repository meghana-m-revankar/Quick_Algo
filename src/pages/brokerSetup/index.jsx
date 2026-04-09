import { Icon } from "#components";
import React from "react";
import useBrokerSetup from "./brokerSetup";
import "./brokerSetup.scss";
import { NavLink } from "react-router-dom";
import { FaCopy } from "react-icons/fa6";
import { copyToClipboard, images } from "#helpers";
import { ButtonLoader, SubscriptionDialog } from "#components";
import { ShimmerFeaturedGallery } from "react-shimmer-effects";
import { FaArrowLeftLong } from "react-icons/fa6";
import { brokerSetup as data } from "#jsonData";
import { LuVideo } from "react-icons/lu";

const BrokerSetup = () => {
  const {
    brokerDetail,
    brokerConfigDetails,
    keyVisible,
    setKeyVisible,
    secretVisible,
    setSecretVisible,
    responseVisible,
    setResponseVisible,
    handleChange,
    formData,
    formErrors,
    handleSubmit,
    isLoading,
    screenLoading,
    codeVisible,
    setCodeVisible,
    mpinVisible,
    setMpinVisible,
    totpVisible,
    setTotpVisible,
    tokenVisible,
    setTokenVisible,
    saveTOTP,
    otpLoading,
    sourceVisible,
    setSourceVisible,
    passwordVisible,
    setPasswordVisible,
    otpData,
    handleOtpSubmit,
    handleOtpChange,
    saveFormDataToStorage,
    handleDhanTestConnection,
    handleDhanConsumeConsent,
    subscriptionUpgradeOpen,
    setSubscriptionUpgradeOpen,
    subscriptionUpgradeMessage,
  } = useBrokerSetup();

  return (
    <div className="content broker_setup_page">
      <div className="card-box card-height broker-card">
        <div className="header_section">
          <NavLink to={"/broker"}>
            <FaArrowLeftLong size={20} className="" />
          </NavLink>
          <div className="demo-btn">
            <LuVideo size={25} /> <span className="fw-500 fs-15"> Demo</span>
          </div>
        </div>

        {screenLoading ? (
          <ShimmerFeaturedGallery col={1} frameHeight={400} />
        ) : (
          <div className="setup_section">
            <div className="details_section">
              <div className="heading">
                <img
                  src={images[`broker/${brokerDetail?.brokerName}.png`]}
                  alt={brokerDetail?.brokerName}
                />
                <h4>Setup {brokerDetail?.brokerName}</h4>
              </div>
              <ul>
                <li>
                  Please to go to{" "}
                  <NavLink
                    target="_blank"
                    to={data[brokerDetail?.brokerID]?.login}
                  >
                    {data[brokerDetail?.brokerID]?.login}
                  </NavLink>{" "}
                  and login to your account
                </li>

                {/* Redirce URl  */}
                {data[brokerDetail?.brokerID]?.redirect && (
                  <>
                    <li>{data[brokerDetail?.brokerID]?.redirect_text}</li>
                    <div className="form-group">
                      <input
                        type="text"
                        className="form-control mt-2 text-input"
                        placeholder="Enter Redirect URl"
                        disabled
                        value={data[brokerDetail?.brokerID]?.redirect_url}
                      />
                      <div className="btn-icon">
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              data[brokerDetail?.brokerID]?.redirect_url
                            )
                          }
                        >
                          <FaCopy size={20} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </ul>
              {data[brokerDetail?.brokerID]?.customer_support && (
                <>
                  <h6>{brokerDetail?.brokerName} Customer Support </h6>
                  <NavLink
                    className="inner_text text-new"
                    target="_blank"
                    to={data[brokerDetail?.brokerID]?.customer_support}
                  >
                    {data[brokerDetail?.brokerID]?.customer_support}
                  </NavLink>
                </>
              )}
              {data[brokerDetail?.brokerID]?.customer_care && (
                <p className="inner_text text-new mt-2">
                  {data[brokerDetail?.brokerID]?.customer_care}
                </p>
              )}
              {data[brokerDetail?.brokerID]?.api_charges && (
                <>
                  <h6>{brokerDetail?.brokerName} API Charges </h6>
                  <p className="inner_text mt-2">
                    {data[brokerDetail?.brokerID]?.api_charges}
                  </p>
                </>
              )}{" "}
              {data[brokerDetail?.brokerID]?.note && (
                <p className="inner_text mt-2">
                  {data[brokerDetail?.brokerID]?.note}
                </p>
              )}
              {data[brokerDetail?.brokerID]?.other_note && (
                <p className="inner_text mt-2">
                  {data[brokerDetail?.brokerID]?.other_note}
                </p>
              )}
              <div className="terms_condition">
                <p>
                  By entering TOTP/API REQUEST TOKEN, I agree company Terms and
                  Conditions with company Privacy Policy. I understand that
                  without my Entre D-emat details API/TOTP and Access Token the
                  Company cannot access my account and not do any trade on my
                  account. I authorize company to access my D-emat with API
                  access Token and do algo trade from on my behalf. terms and
                  conditions.
                </p>
              </div>
              {brokerDetail?.brokerID == 11 && (
                <div className="terms_condition">
                  <p>
                    Note : On this broker we get API token from 8 hours to 30
                    days. Whatever token you withdraw, you have to keep track of
                    it and before the day of token expiry, you have to upload a
                    new token on our system.
                  </p>
                </div>
              )}
            </div>
            <div className="key_section">
              <form onSubmit={handleSubmit}>
                {/* API KEY */}
                <div className="form-flex">
                  {data[brokerDetail?.brokerID]?.api_key && (
                    <div className="form-group text-show">
                      <label htmlFor="api_key">
                        {brokerDetail?.brokerID == 6
                          ? "Vendor Id"
                          : brokerDetail?.brokerID == 7
                          ? "User Key"
                          : brokerDetail?.brokerID == 10
                          ? "API / Consumer Key"
                          : "API Key"}

                        <small className="text-danger">*</small>
                      </label>
                      <input
                        type={keyVisible ? "text" : "password"}
                        className="form-control mt-2 text-input"
                        name="ApiKey"
                        value={formData?.ApiKey}
                        onChange={handleChange}
                      />
                      <div className="btn-icon">
                        <button
                          type="button"
                          onClick={() => setKeyVisible(!keyVisible)}
                        >
                          {!keyVisible ? (
                            <Icon name="eye-low-vision" size={20} />
                          ) : (
                            <Icon name="eye" size={20} />
                          )}
                        </button>
                      </div>
                      {formErrors?.ApiKey && (
                        <div className="error-message">
                          {formErrors?.ApiKey}
                        </div>
                      )}
                    </div>
                  )}
                  {/* APP SOURCE */}
                  {data[brokerDetail?.brokerID]?.app_source && (
                    <div className="form-group text-show">
                      <label htmlFor="app_source">
                        App Source
                        <small className="text-danger">*</small>
                      </label>
                      <input
                        type={sourceVisible ? "text" : "password"}
                        className="form-control mt-2 text-input"
                        name="AppSource"
                        value={formData?.AppSource}
                        onChange={handleChange}
                      />
                      <div className="btn-icon">
                        <button
                          type="button"
                          onClick={() => setSourceVisible(!sourceVisible)}
                        >
                          {!sourceVisible ? (
                            <Icon name="eye-low-vision" size={20} />
                          ) : (
                            <Icon name="eye" size={20} />
                          )}
                        </button>
                      </div>
                      {formErrors?.AppSource && (
                        <div className="error-message">
                          {formErrors?.AppSource}
                        </div>
                      )}
                    </div>
                  )}
                  {/* SECRET KEY */}
                  {data[brokerDetail?.brokerID]?.secret_key && (
                    <div className="form-group text-show">
                      <label htmlFor="secret_key">
                        {brokerDetail?.brokerID == 6 ||
                        brokerDetail?.brokerID == 7
                          ? "Encryption key"
                          : brokerDetail?.brokerID == 10
                          ? "Consumer Secret"
                          : "My Secret Key"}{" "}
                        <small className="text-danger">*</small>
                      </label>
                      <input
                        type={secretVisible ? "text" : "password"}
                        className="form-control mt-2 text-input"
                        name="SecratKey"
                        value={formData?.SecratKey}
                        onChange={handleChange}
                      />
                      <div className="btn-icon">
                        <button
                          type="button"
                          onClick={() => setSecretVisible(!secretVisible)}
                        >
                          {!secretVisible ? (
                            <Icon name="eye-low-vision" size={20} />
                          ) : (
                            <Icon name="eye" size={20} />
                          )}
                        </button>
                      </div>
                      {formErrors?.SecratKey && (
                        <div className="error-message">
                          {formErrors?.SecratKey}
                        </div>
                      )}
                    </div>
                  )}
                  {/* REQUEST TOKEN */}
                  {data[brokerDetail?.brokerID]?.request_token && (
                    <div className="form-group text-show">
                      <label htmlFor="request_token">
                        {brokerDetail?.brokerID == 6
                          ? "Encryption IV"
                          : "Request Token"}{" "}
                        <small className="text-danger">*</small>
                      </label>
                      <input
                        type={responseVisible ? "text" : "password"}
                        className="form-control mt-2 text-input"
                        name="RequestToken"
                        value={formData?.RequestToken}
                        onChange={handleChange}
                      />
                      <div className="btn-icon">
                        <button
                          type="button"
                          onClick={() => setResponseVisible(!responseVisible)}
                        >
                          {!responseVisible ? (
                            <Icon name="eye-low-vision" size={20} />
                          ) : (
                            <Icon name="eye" size={20} />
                          )}
                        </button>
                      </div>
                      {formErrors?.RequestToken && (
                        <div className="error-message">
                          {formErrors?.RequestToken}
                        </div>
                      )}
                    </div>
                  )}
                  {/* DMEAT CODE */}
                  {data[brokerDetail?.brokerID]?.demat_code && (
                    <div className="form-group text-show">
                      <label htmlFor="demat_code">
                        {brokerDetail?.brokerID == 9
                          ? "Request Client Code"
                          : brokerDetail?.brokerID == 10
                          ? "Client Code receive by Mail"
                          : brokerDetail?.brokerID == 11
                          ? "Dhan Client ID"
                          : "D-emat Client Code"}{" "}
                        <small className="text-danger">*</small>
                      </label>
                      <input
                        type={codeVisible ? "text" : "password"}
                        className="form-control mt-2 text-input"
                        name="ClientCode"
                        value={formData?.ClientCode}
                        onChange={handleChange}
                        placeholder={
                          brokerDetail?.brokerID == 11
                            ? "Enter your Dhan Client ID"
                            : ""
                        }
                      />
                      <div className="btn-icon">
                        <button
                          type="button"
                          onClick={() => setCodeVisible(!codeVisible)}
                        >
                          {!codeVisible ? (
                            <Icon name="eye-low-vision" size={20} />
                          ) : (
                            <Icon name="eye" size={20} />
                          )}
                        </button>
                      </div>
                      {formErrors?.ClientCode && (
                        <div className="error-message">
                          {formErrors?.ClientCode}
                        </div>
                      )}
                    </div>
                  )}
                  {/* DMEAT MPIN */}
                  {data[brokerDetail?.brokerID]?.demat_mpin && (
                    <div className="form-group text-show">
                      <label htmlFor="demat_mpin">
                        {brokerDetail?.brokerID == 2
                          ? "D-emat MPIN"
                          : brokerDetail?.brokerID == 10
                          ? "receive by Mail Password"
                          : "D-emat Password"}
                        <small className="text-danger">*</small>
                      </label>
                      <input
                        type={mpinVisible ? "text" : "password"}
                        className="form-control mt-2 text-input"
                        name="Password"
                        value={formData?.Password}
                        onChange={handleChange}
                      />
                      <div className="btn-icon">
                        <button
                          type="button"
                          onClick={() => setMpinVisible(!mpinVisible)}
                        >
                          {!mpinVisible ? (
                            <Icon name="eye-low-vision" size={20} />
                          ) : (
                            <Icon name="eye" size={20} />
                          )}
                        </button>
                      </div>
                      {formErrors?.Password && (
                        <div className="error-message">
                          {formErrors?.Password}
                        </div>
                      )}
                    </div>
                  )}
                  {/* API TOKEN */}
                  {data[brokerDetail?.brokerID]?.api_token && (
                    <div className="form-group text-show">
                      <label htmlFor="api_token">
                        {brokerDetail?.brokerID == 6
                          ? "Vendor Key"
                          : brokerDetail?.brokerID == 8
                          ? "Secret Key"
                          : "User Id"}
                        <small className="text-danger">*</small>
                      </label>
                      <input
                        type={tokenVisible ? "text" : "password"}
                        className="form-control mt-2 text-input"
                        name="ApiToken"
                        value={formData?.ApiToken}
                        onChange={handleChange}
                      />
                      <div className="btn-icon">
                        <button
                          type="button"
                          onClick={() => setTokenVisible(!tokenVisible)}
                        >
                          {!tokenVisible ? (
                            <Icon name="eye-low-vision" size={20} />
                          ) : (
                            <Icon name="eye" size={20} />
                          )}
                        </button>
                      </div>
                      {formErrors?.ApiToken && (
                        <div className="error-message">
                          {formErrors?.ApiToken}
                        </div>
                      )}
                    </div>
                  )}
                  {/* TOTP SECTION */}
                  {data[brokerDetail?.brokerID]?.totp && (
                    <div className="form-group text-show">
                      <label htmlFor="totp">
                        TOTP <small className="text-danger">*</small>
                      </label>
                      <input
                        type={
                          brokerDetail?.brokerID == 6
                            ? "text"
                            : totpVisible
                            ? "text"
                            : "password"
                        }
                        className="form-control mt-2 text-input"
                        name="TOTP"
                        value={formData?.TOTP}
                        onChange={handleChange}
                      />
                      <div className="btn-icon">
                        {brokerDetail?.brokerID == 6 ? (
                          <button
                            type="button"
                            className="gen_button"
                            onClick={() => saveTOTP()}
                            disabled={otpLoading}
                          >
                            {otpLoading ? (
                              <ButtonLoader
                                isloading={true}
                                height={9}
                                color={"#686868"}
                              />
                            ) : (
                              "Generate"
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setTotpVisible(!totpVisible)}
                          >
                            {!totpVisible ? (
                              <Icon name="eye-low-vision" size={20} />
                            ) : (
                              <Icon name="eye" size={20} />
                            )}
                          </button>
                        )}
                      </div>

                      {formErrors?.TOTP && (
                        <div className="error-message">{formErrors?.TOTP}</div>
                      )}
                    </div>
                  )}
                  {/* CLIENT MOBILE */}
                  {data[brokerDetail?.brokerID]?.c_mobile && (
                    <div className="form-group text-show">
                      <label htmlFor="c_mobile">
                        D-emat Register Mobile No (Do not remove +91){" "}
                        <small className="text-danger">*</small>
                      </label>
                      <input
                        type={"text"}
                        className="form-control mt-2 text-input"
                        value={formData?.C_Mobileno}
                        onChange={handleChange}
                        name="C_Mobileno"
                      />

                      {formErrors?.C_Mobileno && (
                        <div className="error-message">
                          {formErrors?.C_Mobileno}
                        </div>
                      )}
                    </div>
                  )}
                  {/* CLIENT PASSWORD */}
                  {data[brokerDetail?.brokerID]?.c_password && (
                    <div className="form-group text-show">
                      <label htmlFor="c_password">
                        D-emat Password
                        <small className="text-danger">*</small>
                      </label>
                      <input
                        type={passwordVisible ? "text" : "password"}
                        className="form-control mt-2 text-input"
                        name="C_Password"
                        value={formData?.C_Password}
                        onChange={handleChange}
                      />
                      <div className="btn-icon">
                        <button
                          type="button"
                          onClick={() => setPasswordVisible(!passwordVisible)}
                        >
                          {!passwordVisible ? (
                            <Icon name="eye-low-vision" size={20} />
                          ) : (
                            <Icon name="eye" size={20} />
                          )}
                        </button>
                      </div>
                      {formErrors?.C_Password && (
                        <div className="error-message">
                          {formErrors?.C_Password}
                        </div>
                      )}
                    </div>
                  )}
                  {/* CLIENT NEOFINKEY */}
                  {data[brokerDetail?.brokerID]?.c_nofi && (
                    <div className="form-group text-show">
                      <label htmlFor="c_nofi">
                        Neo Fin Key
                        <small className="text-danger">*</small>
                      </label>
                      <input
                        type={"text"}
                        className="form-control mt-2 text-input"
                        name="c_neofinkey"
                        value={formData?.c_neofinkey}
                        onChange={handleChange}
                      />

                      {formErrors?.c_neofinkey && (
                        <div className="error-message">
                          {formErrors?.c_neofinkey}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="button_div">
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ButtonLoader isloading={true} />
                    ) : (
                      <span>
                        {brokerDetail?.brokerID == 10
                          ? "Send OTP"
                          : "Save Request"}
                      </span>
                    )}
                  </button>
                  {data[brokerDetail?.brokerID]?.developer && (
                    <NavLink
                      to={brokerDetail?.developerUrl}
                      target="_blank"
                      className="btn btn-warning"
                    >
                      Developer
                    </NavLink>
                  )}
                  {data[brokerDetail?.brokerID]?.test && (
                    <button
                      type="button"
                      onClick={() => {
                        saveFormDataToStorage();
                        if (brokerDetail?.brokerID == 11) {
                          // Dhan broker - use OAuth flow
                          handleDhanTestConnection();
                        } else {
                          // Other brokers - use existing flow
                          window.open(
                            `${brokerDetail?.apiURL}${formData?.ApiKey}`,
                            "_blank"
                          );
                        }
                      }}
                      disabled={isLoading}
                      className="btn btn-info"
                    >
                      {isLoading ? (
                        <ButtonLoader isloading={true} />
                      ) : (
                        "Test Connection"
                      )}
                    </button>
                  )}
                </div>
              </form>

              {otpData?.userId && (
                <div className="otp_div">
                  <form onSubmit={handleOtpSubmit}>
                    <div className="form-group text-show">
                      <label htmlFor="c_nofi">
                        OTP
                        <small className="text-danger">*</small>
                      </label>
                      <input
                        type={"text"}
                        className="form-control mt-2 text-input"
                        name="OTP"
                        value={otpData?.OTP}
                        onChange={handleOtpChange}
                      />

                      {formErrors?.OTP && (
                        <div className="error-message">{formErrors?.OTP}</div>
                      )}
                    </div>

                    <button className="btn btn-info" disabled={isLoading}>
                      {isLoading ? <ButtonLoader isloading={true} /> : "Submit"}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {subscriptionUpgradeOpen && (
        <SubscriptionDialog
          open={subscriptionUpgradeOpen}
          handleClose={() => setSubscriptionUpgradeOpen(false)}
          message={subscriptionUpgradeMessage}
        />
      )}
    </div>
  );
};

export default BrokerSetup;

import { IconRegistry } from "#components";
import React, { useContext } from "react";
import "./apiDocs.scss";
import useApiDocs from "./apiDocs";
import { RiRepeat2Fill } from "react-icons/ri";
import { tooltipDesign } from "#constant/index";
import Tooltip from "@mui/material/Tooltip";
import { ShimmerPostDetails } from "react-shimmer-effects";
import { ButtonLoader, SubscriptionDialog } from "#components";
import { images } from "#helpers";
import JsonView from "@uiw/react-json-view";
import { ThemeContext } from "../../context";
import { CgRowFirst } from "react-icons/cg";

const ApiDocs = () => {
  const {
    activeSubscriptionFeatures,
    strategyList,
    symbolCategoryList,
    identifierList,
    platformList,
    apiDoc,
    selectedCategory,
    setSelectedCategory,
    handleChange,
    formErrors,
    handleSubmit,
    dataLoading,
    setSignal,
    signal,
    isLoading,
    scriptData,
    generateApiKey,
    dialogOpen,
    handleClickDialogOpen,
    handleDialogClose,
    subscriptionUpgradeOpen,
    setSubscriptionUpgradeOpen,
    subscriptionUpgradeMessage,
    setSubscriptionUpgradeMessage,
    checkApiAccess,
  } = useApiDocs();

  const { themeMode } = useContext(ThemeContext);

  return (
    <section className="content api_docs_page">
      <div className="card-box">
        {dataLoading ? (
          <ShimmerPostDetails cta variant="SIMPLE" />
        ) : (
          <React.Fragment>
            <div className="content-flex">
              <div className="card-box-left">
                <h4>API Key Management</h4>
                <p className="content_inner_data">
                  Manage your API keys and configurations to ensure secure
                  access and optimal performance.
                </p>

                <form
                  onSubmit={checkApiAccess() ? handleSubmit : undefined}
                  className="form-content"
                >
                  <div className="form-group text-show position-relative">
                    <label htmlFor="api_key">
                      API Key <small className="text-danger">*</small>
                    </label>
                    <input
                      className="form-control mt-2 text-input"
                      type="text"
                      value={apiDoc?.authHeader}
                      disabled
                    />
                    <div className="btn-icon">
                      <button type="button" onClick={generateApiKey}>
                        {apiDoc?.authHeader ? (
                          <Tooltip
                            title="Re-Generate"
                            arrow
                            componentsProps={tooltipDesign}
                            enterTouchDelay={0}
                            leaveTouchDelay={10000}
                          >
                            <RiRepeat2Fill size={20} />
                          </Tooltip>
                        ) : (
                          <Tooltip
                            title="Generate"
                            arrow
                            componentsProps={tooltipDesign}
                            enterTouchDelay={0}
                            leaveTouchDelay={10000}
                          >
                            <CgRowFirst size={20} />
                          </Tooltip>
                        )}
                      </button>
                    </div>
                    {formErrors?.authHeader && (
                      <div className="error-message">
                        {formErrors?.authHeader}
                      </div>
                    )}
                  </div>
                  <div className="second_inner_div">
                    <div className="form-group text-show">
                      <label htmlFor="api_key">
                        Strategy <small className="text-danger">*</small>
                      </label>
                      <select
                        name="stratergyid"
                        value={apiDoc?.stratergyid}
                        onChange={handleChange}
                        className="form-control text-input mt-2"
                      >
                        <option value="0">Select Strategy</option>
                        {strategyList?.map((val, key) => {
                          return (
                            <option key={key} value={val?.stratergyID}>
                              {val?.stratergyName}
                            </option>
                          );
                        })}
                      </select>
                      {formErrors?.stratergyid && (
                        <div className="error-message">
                          {formErrors?.stratergyid}
                        </div>
                      )}
                    </div>
                    <div className="form-group text-show">
                      <label htmlFor="api_key">
                        Category <small className="text-danger">*</small>
                      </label>
                      <select
                        name="category"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="form-control text-input mt-2"
                      >
                        <option value="0">Select Category</option>
                        {symbolCategoryList?.map((val, key) => {
                          return (
                            <option key={key} value={val?.symbolCategoryID}>
                              {val?.symbolCategoryName}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                  <div className="form-group text-show">
                    <label htmlFor="api_key">
                      Identifier Name <small className="text-danger">*</small>
                    </label>
                    <select
                      name="text"
                      value={apiDoc?.text}
                      onChange={handleChange}
                      className="form-control text-input mt-2"
                      disabled={identifierList?.length === 0 ?? false}
                    >
                      <option value="0">Select Identifier</option>
                      {identifierList?.map((val, key) => {
                        return (
                          <option key={key} value={val?.identifier}>
                            {val?.identifier}
                          </option>
                        );
                      })}
                    </select>
                    {formErrors?.text && (
                      <div className="error-message">{formErrors?.text}</div>
                    )}
                  </div>
                  <div className="second_inner_div">
                    <div className="form-group text-show">
                      <label htmlFor="api_key">
                        Platform <small className="text-danger">*</small>
                      </label>
                      <select
                        name="PlatformName"
                        value={apiDoc?.PlatformName}
                        onChange={handleChange}
                        className="form-control text-input mt-2"
                      >
                        <option value="0">Select Platform</option>
                        {platformList?.map((val, key) => {
                          return (
                            <option key={key} value={val?.platformID}>
                              {val?.platformName}
                            </option>
                          );
                        })}
                      </select>
                      {formErrors?.PlatformName && (
                        <div className="error-message">
                          {formErrors?.PlatformName}
                        </div>
                      )}
                    </div>
                    <div className="form-group text-show">
                      <label htmlFor="api_key">Signal</label>
                      <select
                        name="statergyID"
                        value={signal}
                        onChange={(e) => setSignal(e.target.value)}
                        className="form-control text-input mt-2"
                      >
                        <option value="strike">Strike Signal</option>
                        <option value="direct">Direct Signal</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type={checkApiAccess() ? "submit" : "button"}
                    onClick={
                      !checkApiAccess()
                        ? () => {
                            setSubscriptionUpgradeMessage(
                              "Your current subscription does not include API Access feature. Please upgrade your subscription to use this feature.",
                            );
                            setSubscriptionUpgradeOpen(true);
                          }
                        : null
                    }
                    className="btn btn-success"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ButtonLoader isloading={true} />
                    ) : (
                      "Preview Script"
                    )}
                  </button>
                </form>
              </div>
              <div className="card-box-right">
                <div className="preview_script_div">
                  {scriptData ? (
                    <div className="script-iner-data">
                      <h5>{scriptData?.heading}</h5>
                      <p>{scriptData?.url}</p>
                      <JsonView
                        value={JSON.parse(scriptData?.format)}
                        style={{
                          wordBreak: "break-word",
                          whiteSpace: "pre-wrap",
                          borderRadius: "5px",
                          padding: "10px",
                          marginTop: "15px",
                        }}
                        collapsed={false}
                        displayDataTypes={false}
                        enableClipboard={false}
                        name={false}
                      />
                    </div>
                  ) : (
                    <div className="script-img">
                      <img src={images["other/script.svg"]} alt="script" />
                      <h5>Streamline your strategy configuration with ease.</h5>
                      <p>
                        Securely input your API key, select a category, define a
                        strategy name, choose your platform, and configure
                        signal parameters—all in one unified interface.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="content-flex mt-3">
              <div className="order_type_table">
                <h5>Order Types</h5>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <tbody>
                      <tr>
                        <td className="text-success">BUY-O</td>
                        <td className="text-end">
                          Will Open a new{" "}
                          <span className="text-success">BUY</span> order
                        </td>
                      </tr>
                      <tr>
                        <td className="text-success">BUY-C</td>
                        <td className="text-end">
                          Will Close the existing order
                        </td>
                      </tr>
                      <tr>
                        <td className="text-success">BUY-C_O</td>
                        <td className="text-end">
                          {" "}
                          Will Close the existing order and Open a new{" "}
                          <span className="text-success">BUY</span> order
                        </td>
                      </tr>
                      <tr>
                        <td className="text-danger">SELL-O</td>
                        <td className="text-end">
                          {" "}
                          Will Open a new{" "}
                          <span className="text-danger">SELL</span> order
                        </td>
                      </tr>
                      <tr>
                        <td className="text-danger">SELL-C</td>
                        <td className="text-end">
                          Will Close the existing order
                        </td>
                      </tr>
                      <tr>
                        <td className="text-danger">SELL-C_O</td>
                        <td className="text-end">
                          {" "}
                          Will Close the existing order and Open a new{" "}
                          <span className="text-danger">SELL</span>
                          order
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="note_content">
                <h5>Note</h5>
                <p className="text-danger">
                  strategy.order.action = BUY / SELL
                </p>
                <p className="text-danger">
                  strategy.order.alert_message = O / C / C_O
                </p>
                <div className="buy_sell">
                  <div className="buy">
                    <JsonView
                      value={{
                        "Example AUTO": {
                          text: "ADANIENT",
                          ordertype: "BUY-C_O",
                          stratergyid: "8t0V3z5IBAkpqzamYs0i9g==",
                          IdentifierID: "KV0pKRFyQwH6gzrnP5E1DQ==",
                          signalprice: "1010",
                          "Platform Name": "Python",
                          authHeader: "************",
                        },
                      }}
                      name={false}
                      collapsed={false}
                      displayDataTypes={false}
                      style={{
                        wordBreak: "break-word",
                        whiteSpace: "pre-wrap",
                        borderRadius: "5px",
                        padding: "10px",
                        marginTop: "15px",
                      }}
                    />
                  </div>
                  <div className="sell">
                    <JsonView
                      value={{
                        "Example Direct": {
                          text: "ADANIENT",
                          ordertype: "BUY-O",
                          stratergyid: "8t0V3z5IBAkpqzamYs0i9g==",
                          IdentifierID: "KV0pKRFyQwH6gzrnP5E1DQ==",
                          signalprice: "1010",
                          "Platform Name": "Python",
                          Instrument: "PE200",
                          authHeader: "************",
                        },
                      }}
                      name={false}
                      collapsed={false}
                      displayDataTypes={false}
                      style={{
                        wordBreak: "break-word",
                        whiteSpace: "pre-wrap",
                        borderRadius: "5px",
                        padding: "10px",
                        marginTop: "15px",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </React.Fragment>
        )}
      </div>
      {dialogOpen && (
        <SubscriptionDialog open={dialogOpen} handleClose={handleDialogClose} />
      )}
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

export default ApiDocs;

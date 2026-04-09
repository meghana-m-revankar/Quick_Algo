import { IconRegistry } from "#components";
import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Paper from "@mui/material/Paper";
import Draggable from "react-draggable";
import { Tab, Tabs } from "react-bootstrap";
import "./dialog.scss";
import { useEffect, useContext } from "react";
import { useState } from "react";
import { handleCatchErrors } from "#utils/validation";
import { useNavigate } from "react-router-dom";
import { errorMsg, successMsg } from "#helpers";
import { asyncPostUpdateOrder, asyncOrderExit } from "#redux/order/action.js";
import { FiEdit, FiCopy } from "react-icons/fi";
import { HiOutlineLogout } from "react-icons/hi";
import { ThemeContext } from "../../../context";

function PaperComponent(props) {
  const nodeRef = React.useRef(null);
  return (
    <Draggable
      nodeRef={nodeRef}
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper {...props} ref={nodeRef} />
    </Draggable>
  );
}

const EditOrder = (props) => {
  const {
    open,
    handleClose,
    orderData,
    defaultTab,
    isEditable,
    resetFilter,
    symbolActiveOrder,
    onNavigateToChart,
    onOrderExit,
    hideExitButton = false,
    hideGainLoss = false,
  } = props;

  const [editData, setEditData] = useState("");
  const [socketData, setSocketData] = useState("");
  const [isOrderLoading, setIsOrderLoading] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showExitForm, setShowExitForm] = useState(false);
  const [exitFormData, setExitFormData] = useState({
    StopLossEstPrice: 0,
    TakeProfitEstPrice: 0,
    isStopLoss: true,
    isTakeProfit: false,
  });
  const [formErrors, setFormErrors] = useState({});
  const [activeTab, setActiveTab] = useState(defaultTab || "details");

  // Get theme from context
  const { themeMode } = useContext(ThemeContext);
  const isDarkMode =
    themeMode === "dark" || document.body.classList.contains("dark-theme");

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const [orderUpdateData, setOrderUpdateData] = useState({
    SymbolID: 0,
    Type: 1,
    OrderType: 1,
    Quantity: 1,
    EntryPrice: 0,
    VolumePrice: "",
    Commission: "",
    TotalPurchaseAmt: 0,
    isLimitOrder: "",
    isMarketOrder: "",
    isStopLoss: true,
    StopLossPer: "",
    StopLossEstPrice: 0,
    isTakeProfit: false,
    TakeProfitPer: "",
    TakeProfitEstPrice: 0,
    OrderStatus: 1,
    BrokerConfigID: "",
    SellPrice: 0,
    BuyPrice: 0,
    ClosedPrice: "",
    ProductType: 1,
    ProfitLost: "",
    IdentifierId: "",
    IsSettled: "",
    iSAutoTrade: false,
    BrokerStatus: "",
    OrderID: 0,
  });
  const navigate = useNavigate();

  // Calculate P&L
  const calculatePL = () => {
    // For closed/rejected orders, use profitLost directly
    if (
      hideExitButton &&
      orderData?.profitLost !== undefined &&
      orderData?.profitLost !== null
    ) {
      return parseFloat(orderData.profitLost) || 0;
    }

    const realTimeData = symbolActiveOrder?.[orderData?.identifier];
    let pl = 0;
    if (realTimeData) {
      const currentPrice =
        realTimeData?.lastBuyPrice || realTimeData?.lastTradedPrice || 0;
      const entryPrice = realTimeData?.entryPrice || orderData?.entryPrice || 0;
      const quantity = realTimeData?.quantity || orderData?.quantity || 0;
      if (orderData?.orderType === 1) {
        pl = (currentPrice - entryPrice) * quantity;
      } else if (orderData?.orderType === 2) {
        pl = (entryPrice - currentPrice) * quantity;
      }
    } else {
      const currentPrice =
        orderData?.lastBuyPrice ||
        orderData?.lastTradedPrice ||
        orderData?.currentPrice ||
        orderData?.entryPrice ||
        0;
      const entryPrice = orderData?.entryPrice || 0;
      const quantity = orderData?.quantity || 0;
      if (orderData?.orderType === 1) {
        pl = (currentPrice - entryPrice) * quantity;
      } else if (orderData?.orderType === 2) {
        pl = (entryPrice - currentPrice) * quantity;
      }
    }
    return pl;
  };

  // Get Order Type Name
  const getOrderTypeName = () => {
    const orderType = orderData?.orderType || socketData?.orderType;
    if (orderType === 1) return "Buy";
    if (orderType === 2) return "Sell";
    return "-";
  };

  // Get Product Type Name
  const getProductTypeName = () => {
    const productType = orderData?.productType || socketData?.productType;
    if (productType === 1) return "MIS";
    if (productType === 2) return "CNC";
    return "-";
  };

  // Format JSON string with pretty printing
  const formatJSON = (jsonString) => {
    if (!jsonString || jsonString === "-") return jsonString;
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      // If not valid JSON, return as is
      return jsonString;
    }
  };

  // Highlight specific keywords with colors in the response text
  const highlightKeywords = (text) => {
    if (!text || text === "-") return text;

    // Define keywords and their colors (order matters - more specific first)
    const highlightRules = [
      // Success keywords - Green
      {
        pattern: /"status"\s*:\s*true/gi,
        color: isDarkMode ? "#2dd4bf" : "#1bc5bd",
        bgColor: isDarkMode
          ? "rgba(27, 197, 189, 0.2)"
          : "rgba(27, 197, 189, 0.15)",
      },
      {
        pattern: /"message"\s*:\s*"SUCCESS"/gi,
        color: isDarkMode ? "#2dd4bf" : "#1bc5bd",
        bgColor: isDarkMode
          ? "rgba(27, 197, 189, 0.2)"
          : "rgba(27, 197, 189, 0.15)",
      },
      {
        pattern: /\bSUCCESS\b/gi,
        color: isDarkMode ? "#2dd4bf" : "#1bc5bd",
        bgColor: isDarkMode
          ? "rgba(27, 197, 189, 0.2)"
          : "rgba(27, 197, 189, 0.15)",
      },
      // Error keywords - Red (more specific patterns first)
      {
        pattern: /Rs\.\s*0\.00[^"]*You require Rs\.\s*[\d,]+\.?\d*/gi,
        color: isDarkMode ? "#ff6b7a" : "#f64e60",
        bgColor: isDarkMode
          ? "rgba(246, 78, 96, 0.2)"
          : "rgba(246, 78, 96, 0.15)",
      },
      {
        pattern: /You require Rs\./gi,
        color: isDarkMode ? "#ff6b7a" : "#f64e60",
        bgColor: isDarkMode
          ? "rgba(246, 78, 96, 0.2)"
          : "rgba(246, 78, 96, 0.15)",
      },
      {
        pattern: /\bInsufficient Funds\b/gi,
        color: isDarkMode ? "#ff6b7a" : "#f64e60",
        bgColor: isDarkMode
          ? "rgba(246, 78, 96, 0.2)"
          : "rgba(246, 78, 96, 0.15)",
      },
      {
        pattern: /\brejected\b/gi,
        color: isDarkMode ? "#ff6b7a" : "#f64e60",
        bgColor: isDarkMode
          ? "rgba(246, 78, 96, 0.2)"
          : "rgba(246, 78, 96, 0.15)",
      },
      {
        pattern: /\bquantity exceeds\b/gi,
        color: isDarkMode ? "#ff6b7a" : "#f64e60",
        bgColor: isDarkMode
          ? "rgba(246, 78, 96, 0.2)"
          : "rgba(246, 78, 96, 0.15)",
      },
      // Warning keywords - Orange
      {
        pattern: /\bpending\b/gi,
        color: isDarkMode ? "#ffb84d" : "#ff9800",
        bgColor: isDarkMode
          ? "rgba(255, 184, 77, 0.2)"
          : "rgba(255, 184, 77, 0.15)",
      },
    ];

    // Create an array to store parts with their positions
    const parts = [];
    let lastIndex = 0;
    const textLength = text.length;

    // Find all matches and their positions
    const matches = [];
    highlightRules.forEach((rule) => {
      let match;
      const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
      // Reset regex lastIndex to avoid issues
      regex.lastIndex = 0;
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          color: rule.color,
          bgColor: rule.bgColor,
        });
        // Prevent infinite loop on zero-length matches
        if (match[0].length === 0) {
          regex.lastIndex++;
        }
      }
    });

    // Sort matches by start position
    matches.sort((a, b) => a.start - b.start);

    // Remove overlapping matches (keep the first one)
    const nonOverlappingMatches = [];
    let lastEnd = 0;
    matches.forEach((match) => {
      if (match.start >= lastEnd) {
        nonOverlappingMatches.push(match);
        lastEnd = match.end;
      }
    });

    // Build the parts array
    nonOverlappingMatches.forEach((match) => {
      // Add text before match
      if (match.start > lastIndex) {
        parts.push({
          text: text.substring(lastIndex, match.start),
          color: null,
          bgColor: null,
        });
      }
      // Add highlighted match
      parts.push({
        text: match.text,
        color: match.color,
        bgColor: match.bgColor,
      });
      lastIndex = match.end;
    });

    // Add remaining text
    if (lastIndex < textLength) {
      parts.push({
        text: text.substring(lastIndex),
        color: null,
        bgColor: null,
      });
    }

    // If no matches, return original text as string
    if (parts.length === 0 || (parts.length === 1 && !parts[0].color)) {
      return text;
    }

    // Return JSX with highlighted parts
    return (
      <>
        {parts.map((part, index) => {
          if (part.color) {
            return (
              <span
                key={index}
                style={{
                  color: part.color,
                  backgroundColor: part.bgColor,
                  padding: "1px 2px",
                  borderRadius: "2px",
                  fontWeight: "600",
                }}
              >
                {part.text}
              </span>
            );
          }
          return <span key={index}>{part.text}</span>;
        })}
      </>
    );
  };

  // Detect response status and return color scheme
  const getResponseStatus = (responseString) => {
    if (!responseString || responseString === "-") {
      return {
        type: "neutral",
        bgColor: isDarkMode
          ? "rgba(255, 255, 255, 0.05)"
          : "rgba(248, 249, 250, 0.9)",
        borderColor: isDarkMode
          ? "rgba(255, 255, 255, 0.1)"
          : "rgba(0, 0, 0, 0.1)",
        textColor: isDarkMode ? "#b0b0b0" : "#999",
        badgeColor: isDarkMode ? "#666" : "#999",
        badgeBg: isDarkMode
          ? "rgba(255, 255, 255, 0.1)"
          : "rgba(0, 0, 0, 0.05)",
      };
    }

    const responseLower = responseString.toLowerCase();
    let parsedData = null;

    // Try to parse JSON
    try {
      parsedData = JSON.parse(responseString);
    } catch (e) {
      // Not JSON, check as plain text
    }

    // Check for SUCCESS status
    if (
      (parsedData &&
        parsedData.status === true &&
        parsedData.message?.toLowerCase() === "success") ||
      responseLower.includes("success") ||
      (parsedData && parsedData.message?.toLowerCase() === "success")
    ) {
      return {
        type: "success",
        bgColor: isDarkMode
          ? "rgba(27, 197, 189, 0.15)"
          : "rgba(27, 197, 189, 0.1)",
        borderColor: isDarkMode
          ? "rgba(27, 197, 189, 0.4)"
          : "rgba(27, 197, 189, 0.3)",
        textColor: isDarkMode ? "#2dd4bf" : "#1bc5bd",
        badgeColor: "#ffffff",
        badgeBg: isDarkMode ? "#2dd4bf" : "#1bc5bd",
        badgeText: "SUCCESS",
      };
    }

    // Check for error conditions
    const errorKeywords = [
      "insufficient funds",
      "rejected",
      "quantity exceeds",
      "error",
      "failed",
      "failure",
      "declined",
      "invalid",
      "insufficient",
      "exceed",
      "limit exceeded",
    ];

    const hasError = errorKeywords.some((keyword) =>
      responseLower.includes(keyword)
    );

    if (hasError || (parsedData && parsedData.status === false)) {
      return {
        type: "error",
        bgColor: isDarkMode
          ? "rgba(246, 78, 96, 0.15)"
          : "rgba(246, 78, 96, 0.1)",
        borderColor: isDarkMode
          ? "rgba(246, 78, 96, 0.4)"
          : "rgba(246, 78, 96, 0.3)",
        textColor: isDarkMode ? "#ff6b7a" : "#f64e60",
        badgeColor: "#ffffff",
        badgeBg: isDarkMode ? "#ff6b7a" : "#f64e60",
        badgeText: "ERROR",
      };
    }

    // Check for warning conditions
    const warningKeywords = ["warning", "pending", "processing", "waiting"];

    const hasWarning = warningKeywords.some((keyword) =>
      responseLower.includes(keyword)
    );

    if (hasWarning) {
      return {
        type: "warning",
        bgColor: isDarkMode
          ? "rgba(255, 184, 77, 0.15)"
          : "rgba(255, 184, 77, 0.1)",
        borderColor: isDarkMode
          ? "rgba(255, 184, 77, 0.4)"
          : "rgba(255, 184, 77, 0.3)",
        textColor: isDarkMode ? "#ffb84d" : "#ff9800",
        badgeColor: "#ffffff",
        badgeBg: isDarkMode ? "#ffb84d" : "#ff9800",
        badgeText: "WARNING",
      };
    }

    // Default neutral
    return {
      type: "neutral",
      bgColor: isDarkMode
        ? "rgba(255, 255, 255, 0.05)"
        : "rgba(248, 249, 250, 0.9)",
      borderColor: isDarkMode
        ? "rgba(255, 255, 255, 0.1)"
        : "rgba(0, 0, 0, 0.1)",
      textColor: isDarkMode ? "#e0e0e0" : "#333",
      badgeColor: isDarkMode ? "#b0b0b0" : "#666",
      badgeBg: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
      badgeText: "INFO",
    };
  };

  // Copy to clipboard function
  const copyToClipboard = async (text) => {
    if (!text || text === "-") return;
    try {
      await navigator.clipboard.writeText(text);
      successMsg("Copied to clipboard!");
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        successMsg("Copied to clipboard!");
      } catch (err) {
        errorMsg("Failed to copy. Please select and copy manually.");
      }
      document.body.removeChild(textArea);
    }
  };

  // Initialize exit form data when order data is available
  useEffect(() => {
    if (orderData && !showExitForm) {
      setExitFormData({
        StopLossEstPrice:
          orderData?.stopLossEstPrice || orderUpdateData?.StopLossEstPrice || 0,
        TakeProfitEstPrice:
          orderData?.takeProfitEstPrice ||
          orderUpdateData?.TakeProfitEstPrice ||
          0,
        isStopLoss:
          orderData?.isStopLoss !== undefined
            ? orderData.isStopLoss
            : orderUpdateData?.isStopLoss !== undefined
            ? orderUpdateData.isStopLoss
            : true,
        isTakeProfit:
          orderData?.isTakeProfit !== undefined
            ? orderData.isTakeProfit
            : orderUpdateData?.isTakeProfit !== undefined
            ? orderUpdateData.isTakeProfit
            : false,
      });
    }
  }, [orderData, orderUpdateData, showExitForm]);

  // If hideExitButton is true and activeTab is "actions", switch to "details"
  useEffect(() => {
    if (hideExitButton && activeTab === "actions") {
      setActiveTab("details");
    }
  }, [hideExitButton, activeTab]);

  // Handle exit form change
  const handleExitFormChange = (e) => {
    const { name, value, checked, type } = e.target;
    if (type === "checkbox") {
      setExitFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setExitFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle order exit
  const handleOrderExit = async () => {
    if (!orderData?.orderID) return;

    setIsExiting(true);
    try {
      // First update SL/TG if changed
      if (showExitForm) {
        const updateData = {
          ...orderUpdateData,
          StopLossEstPrice: exitFormData.StopLossEstPrice,
          TakeProfitEstPrice: exitFormData.TakeProfitEstPrice,
          isStopLoss: exitFormData.isStopLoss,
          isTakeProfit: exitFormData.isTakeProfit,
        };

        // Update order first if SL/TG changed
        if (
          updateData.StopLossEstPrice !== (orderData?.stopLossEstPrice || 0) ||
          updateData.TakeProfitEstPrice !== (orderData?.takeProfitEstPrice || 0)
        ) {
          try {
            await asyncPostUpdateOrder({ formData: updateData });
          } catch (updateErr) {}
        }
      }

      // Then exit the order
      const result = await asyncOrderExit({ orderID: orderData.orderID });
      if (
        result?.data?.message === "success" ||
        result?.data?.message === "Success"
      ) {
        successMsg("Order exited successfully...");
        if (onOrderExit) {
          onOrderExit();
        }
        handleClose();
        if (resetFilter) {
          resetFilter();
        }
      } else {
        errorMsg(result?.data?.message || "Failed to exit order");
      }
    } catch (err) {
      handleCatchErrors(err, navigate);
    } finally {
      setIsExiting(false);
      setShowExitForm(false);
    }
  };

  useEffect(() => {
    if (isEditable === 1) {
      setSocketData(symbolActiveOrder[orderData?.identifier]);
    }
  }, [symbolActiveOrder, isEditable, orderData?.identifier]);

  useEffect(() => {
    if (editData === "") {
      setEditData(socketData);
    }
  }, [socketData, editData]);

  useEffect(() => {
    if (editData !== "") {
      setOrderUpdateData((prev) => ({
        ...prev,
        BrokerConfigID: editData?.brokerID,
        ClosedPrice: editData?.closedPrice,
        Commission: editData?.commission,
        EntryPrice: editData?.entryPrice,
        IdentifierId: editData?.identifierId,
        OrderID: editData?.orderID,
        OrderStatus: editData?.orderStatus,
        OrderType: editData?.orderType,
        ProductType: editData?.productType,
        ProfitLost: editData?.profitLost,
        Quantity: editData?.quantity,
        StopLossEstPrice: editData?.stopLossEstPrice,
        StopLossPer: editData?.stopLossPer,
        SymbolID: editData?.symbolID,
        TakeProfitEstPrice: editData?.takeProfitEstPrice,
        TakeProfitPer: editData?.takeProfitPer,
        TotalPurchaseAmt: editData?.totalPurchaseAmt,
        Type: editData?.type,
        VolumePrice: editData?.volumePrice,
        iSAutoTrade: editData?.iSAutoTrade,
        isLimitOrder: editData?.isLimitOrder,
        isMarketOrder: editData?.isMarketOrder,
        isTakeProfit: editData?.isTakeProfit,
      }));
    }
  }, [editData]);

  const handleOrderChange = (e) => {
    const { name, value, checked } = e.target;

    if (name === "isTakeProfit" || name === "isStopLoss") {
      setOrderUpdateData({ ...orderUpdateData, [name]: checked });
    } else {
      if (
        name === "StopLossEstPrice" ||
        name === "TakeProfitEstPrice" ||
        name === "Quantity"
      ) {
        if (/^\d*$/.test(value)) {
          if (name === "Quantity") {
            if (value.length <= 6 && value >= 1)
              setOrderUpdateData({ ...orderUpdateData, [name]: value });
          } else {
            setOrderUpdateData({ ...orderUpdateData, [name]: value });
          }
        }
      } else {
        setOrderUpdateData({ ...orderUpdateData, [name]: value });
      }
    }
    setFormErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();

    setIsOrderLoading(true);
    asyncPostUpdateOrder({ formData: orderUpdateData })
      .then((result) => {
        if (result?.data?.message === "success") {
          successMsg("Order update successfully...");
          handleClose();
          resetFilter();
        } else {
          errorMsg(result?.data?.message);
        }
      })
      .catch((loginError) => {
        handleCatchErrors(loginError, navigate, setFormErrors, "/");
      })
      .finally(() => {
        setIsOrderLoading(false);
      });
  };

  return (
    <React.Fragment>
      <Dialog
        fullWidth={true}
        maxWidth={"xs"}
        open={open}
        onClose={handleClose}
        PaperComponent={PaperComponent}
        aria-labelledby="draggable-dialog-title"
        className="tab_content single_order_dialog dialog_data"
        PaperProps={{
          style: {
            maxWidth: "450px",
            width: "100%",
            margin: isMobile ? "20px auto 0 auto" : "auto",
            maxHeight: "60vh",
            overflowY: "auto",
            ...(isMobile && {
              alignSelf: "flex-start",
              marginTop: "20px",
            }),
          },
        }}
        sx={{
          ...(isMobile && {
            "& .MuiDialog-container": {
              alignItems: "flex-start",
              paddingTop: "20px",
            },
          }),
        }}
      >
        <DialogTitle
          style={{
            cursor: "move",
            padding: "6px 8px",
            fontSize: "14px",
            fontWeight: "600",
          }}
          id="draggable-dialog-title"
        >
          Order Details
        </DialogTitle>
        <DialogContent style={{ padding: "6px 8px" }}>
          {/* P&L - Only Field */}
          {!hideGainLoss && (
            <div
              className="details_data"
              style={{
                background: calculatePL() >= 0 ? "#d4edda" : "#f8d7da",
                padding: "7px",
                borderRadius: "4px",
                marginTop: "0px",
                marginBottom: "6px",
                border: `1.5px solid ${
                  calculatePL() >= 0 ? "#28a745" : "#dc3545"
                }`,
                textAlign: "center",
              }}
            >
              <span
                style={{
                  fontWeight: "600",
                  fontSize: "12px",
                  display: "block",
                  marginBottom: "3px",
                  color: "#495057",
                }}
              >
                Gain & Loss
              </span>
              <span
                className={calculatePL() >= 0 ? "text-success" : "text-danger"}
                style={{
                  fontWeight: "700",
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "3px",
                }}
              >
                {calculatePL() >= 0 ? (
                  <IconRegistry name="caret-up" size={16} />
                ) : (
                  <IconRegistry name="caret-down" size={16} />
                )}
                ₹{calculatePL().toFixed(2)}
              </span>
            </div>
          )}

          {/* Tabs - Details and Edit/Exit */}
          {hideExitButton === true ? (
            // When hideExitButton is true, render Details content directly without tabs
            <div className="mb-2">
              <div
                style={{
                  marginTop: "4px",
                  padding: "6px",
                  background: isDarkMode
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(248, 249, 250, 0.8)",
                  borderRadius: "4px",
                  border: isDarkMode
                    ? "1px solid rgba(255, 255, 255, 0.1)"
                    : "1px solid rgba(0, 0, 0, 0.1)",
                }}
              >
                {/* Product */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "4px",
                    paddingBottom: "4px",
                    borderBottom: isDarkMode
                      ? "1px solid rgba(255, 255, 255, 0.05)"
                      : "1px solid rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: isDarkMode ? "#b0b0b0" : "#666",
                    }}
                  >
                    Product
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "500",
                      color: isDarkMode ? "#e0e0e0" : "#333",
                    }}
                  >
                    {socketData?.identifier || orderData?.identifier || "-"}
                  </span>
                </div>

                {/* Entry Price */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "4px",
                    paddingBottom: "4px",
                    borderBottom: isDarkMode
                      ? "1px solid rgba(255, 255, 255, 0.05)"
                      : "1px solid rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: isDarkMode ? "#b0b0b0" : "#666",
                    }}
                  >
                    Entry Price
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "500",
                      color: isDarkMode ? "#e0e0e0" : "#333",
                    }}
                  >
                    {socketData?.entryPrice || orderData?.entryPrice || "-"}
                  </span>
                </div>

                {/* Order Type */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "4px",
                    paddingBottom: "4px",
                    borderBottom: isDarkMode
                      ? "1px solid rgba(255, 255, 255, 0.05)"
                      : "1px solid rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: isDarkMode ? "#b0b0b0" : "#666",
                    }}
                  >
                    Order Type
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "500",
                      color: isDarkMode ? "#e0e0e0" : "#333",
                    }}
                  >
                    {getOrderTypeName()}
                  </span>
                </div>

                {/* Product Type */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "4px",
                    paddingBottom: "4px",
                    borderBottom: isDarkMode
                      ? "1px solid rgba(255, 255, 255, 0.05)"
                      : "1px solid rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: isDarkMode ? "#b0b0b0" : "#666",
                    }}
                  >
                    Product Type
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "500",
                      color: isDarkMode ? "#e0e0e0" : "#333",
                    }}
                  >
                    {getProductTypeName()}
                  </span>
                </div>

                {/* Quantity */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "4px",
                    paddingBottom: "4px",
                    borderBottom: isDarkMode
                      ? "1px solid rgba(255, 255, 255, 0.05)"
                      : "1px solid rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: isDarkMode ? "#b0b0b0" : "#666",
                    }}
                  >
                    Quantity
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "500",
                      color: isDarkMode ? "#e0e0e0" : "#333",
                    }}
                  >
                    {socketData?.quantity || orderData?.quantity || "-"}
                  </span>
                </div>

                {/* Broker Order No. */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "4px",
                    paddingBottom: "4px",
                    borderBottom: isDarkMode
                      ? "1px solid rgba(255, 255, 255, 0.05)"
                      : "1px solid rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: isDarkMode ? "#b0b0b0" : "#666",
                    }}
                  >
                    Broker Order No.
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "500",
                      color: isDarkMode ? "#e0e0e0" : "#333",
                    }}
                  >
                    {orderData?.brokerOrderNo || "-"}
                  </span>
                </div>

                {/* Broker Name */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "4px",
                    paddingBottom: "4px",
                    borderBottom: isDarkMode
                      ? "1px solid rgba(255, 255, 255, 0.05)"
                      : "1px solid rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: isDarkMode ? "#b0b0b0" : "#666",
                    }}
                  >
                    Broker Name
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "500",
                      color: isDarkMode ? "#e0e0e0" : "#333",
                    }}
                  >
                    {orderData?.brokerName || "-"}
                  </span>
                </div>

                {/* Broker Order Date */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "4px",
                    paddingBottom: "4px",
                    borderBottom: isDarkMode
                      ? "1px solid rgba(255, 255, 255, 0.05)"
                      : "1px solid rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: isDarkMode ? "#b0b0b0" : "#666",
                    }}
                  >
                    Broker Order Date
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "500",
                      color: isDarkMode ? "#e0e0e0" : "#333",
                    }}
                  >
                    {orderData?.brokerOrderDate
                      ? new Date(orderData.brokerOrderDate).toLocaleString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: true,
                          }
                        )
                      : "-"}
                  </span>
                </div>

                {/* Broker Order Response - New Design with Colors */}
                {(() => {
                  const responseStatus = getResponseStatus(
                    orderData?.brokerOrderResponse
                  );
                  return (
                    <div
                      style={{
                        marginTop: "8px",
                        marginBottom: "0px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "6px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: "600",
                              color: isDarkMode ? "#b0b0b0" : "#666",
                            }}
                          >
                            Broker Order Response
                          </span>
                          {orderData?.brokerOrderResponse &&
                            orderData.brokerOrderResponse !== "-" && (
                              <span
                                style={{
                                  fontSize: "9px",
                                  fontWeight: "700",
                                  padding: "2px 6px",
                                  borderRadius: "3px",
                                  background: responseStatus.badgeBg,
                                  color: responseStatus.badgeColor,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                }}
                              >
                                {responseStatus.badgeText}
                              </span>
                            )}
                        </div>
                        {orderData?.brokerOrderResponse &&
                          orderData.brokerOrderResponse !== "-" && (
                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(orderData.brokerOrderResponse)
                              }
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "2px 6px",
                                fontSize: "10px",
                                background: isDarkMode
                                  ? "rgba(255, 255, 255, 0.1)"
                                  : "rgba(0, 0, 0, 0.05)",
                                border: isDarkMode
                                  ? "1px solid rgba(255, 255, 255, 0.2)"
                                  : "1px solid rgba(0, 0, 0, 0.1)",
                                borderRadius: "3px",
                                color: isDarkMode ? "#e0e0e0" : "#333",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = isDarkMode
                                  ? "rgba(255, 255, 255, 0.15)"
                                  : "rgba(0, 0, 0, 0.1)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = isDarkMode
                                  ? "rgba(255, 255, 255, 0.1)"
                                  : "rgba(0, 0, 0, 0.05)";
                              }}
                              title="Copy to clipboard"
                            >
                              <FiCopy size={10} />
                              Copy
                            </button>
                          )}
                      </div>
                      {orderData?.brokerOrderResponse &&
                      orderData.brokerOrderResponse !== "-" ? (
                        <div
                          style={{
                            background: isDarkMode
                              ? "rgba(0, 0, 0, 0.3)"
                              : "rgba(248, 249, 250, 0.9)",
                            border: isDarkMode
                              ? "1px solid rgba(255, 255, 255, 0.1)"
                              : "1px solid rgba(0, 0, 0, 0.1)",
                            borderRadius: "4px",
                            padding: "8px",
                            maxHeight: "200px",
                            overflowY: "auto",
                            overflowX: "auto",
                            wordBreak: "break-word",
                            fontSize: "11px",
                            fontFamily: "monospace",
                            lineHeight: "1.5",
                            color: isDarkMode ? "#e0e0e0" : "#333",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {highlightKeywords(
                            formatJSON(orderData.brokerOrderResponse)
                          )}
                        </div>
                      ) : (
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: "500",
                            color: isDarkMode ? "#b0b0b0" : "#999",
                            fontStyle: "italic",
                          }}
                        >
                          No response available
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="mb-2"
              style={{ fontSize: "12px", minHeight: "auto" }}
            >
              <Tab
                eventKey="details"
                title="Details"
                style={{ fontSize: "12px", padding: "4px 8px" }}
              >
                <div
                  style={{
                    marginTop: "4px",
                    padding: "6px",
                    background: isDarkMode
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(248, 249, 250, 0.8)",
                    borderRadius: "4px",
                    border: isDarkMode
                      ? "1px solid rgba(255, 255, 255, 0.1)"
                      : "1px solid rgba(0, 0, 0, 0.1)",
                  }}
                >
                  {/* Product */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "4px",
                      paddingBottom: "4px",
                      borderBottom: isDarkMode
                        ? "1px solid rgba(255, 255, 255, 0.05)"
                        : "1px solid rgba(0, 0, 0, 0.05)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: isDarkMode ? "#b0b0b0" : "#666",
                      }}
                    >
                      Product
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "500",
                        color: isDarkMode ? "#e0e0e0" : "#333",
                      }}
                    >
                      {socketData?.identifier || orderData?.identifier || "-"}
                    </span>
                  </div>

                  {/* Entry Price */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "4px",
                      paddingBottom: "4px",
                      borderBottom: isDarkMode
                        ? "1px solid rgba(255, 255, 255, 0.05)"
                        : "1px solid rgba(0, 0, 0, 0.05)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: isDarkMode ? "#b0b0b0" : "#666",
                      }}
                    >
                      Entry Price
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "500",
                        color: isDarkMode ? "#e0e0e0" : "#333",
                      }}
                    >
                      {socketData?.entryPrice || orderData?.entryPrice || "-"}
                    </span>
                  </div>

                  {/* Order Type */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "4px",
                      paddingBottom: "4px",
                      borderBottom: isDarkMode
                        ? "1px solid rgba(255, 255, 255, 0.05)"
                        : "1px solid rgba(0, 0, 0, 0.05)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: isDarkMode ? "#b0b0b0" : "#666",
                      }}
                    >
                      Order Type
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "500",
                        color: isDarkMode ? "#e0e0e0" : "#333",
                      }}
                    >
                      {getOrderTypeName()}
                    </span>
                  </div>

                  {/* Product Type */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "4px",
                      paddingBottom: "4px",
                      borderBottom: isDarkMode
                        ? "1px solid rgba(255, 255, 255, 0.05)"
                        : "1px solid rgba(0, 0, 0, 0.05)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: isDarkMode ? "#b0b0b0" : "#666",
                      }}
                    >
                      Product Type
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "500",
                        color: isDarkMode ? "#e0e0e0" : "#333",
                      }}
                    >
                      {getProductTypeName()}
                    </span>
                  </div>

                  {/* Quantity */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "4px",
                      paddingBottom: "4px",
                      borderBottom: isDarkMode
                        ? "1px solid rgba(255, 255, 255, 0.05)"
                        : "1px solid rgba(0, 0, 0, 0.05)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: isDarkMode ? "#b0b0b0" : "#666",
                      }}
                    >
                      Quantity
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "500",
                        color: isDarkMode ? "#e0e0e0" : "#333",
                      }}
                    >
                      {socketData?.quantity || orderData?.quantity || "-"}
                    </span>
                  </div>

                  {/* Broker Order No. */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "4px",
                      paddingBottom: "4px",
                      borderBottom: isDarkMode
                        ? "1px solid rgba(255, 255, 255, 0.05)"
                        : "1px solid rgba(0, 0, 0, 0.05)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: isDarkMode ? "#b0b0b0" : "#666",
                      }}
                    >
                      Broker Order No.
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "500",
                        color: isDarkMode ? "#e0e0e0" : "#333",
                      }}
                    >
                      {orderData?.brokerOrderNo || "-"}
                    </span>
                  </div>

                  {/* Broker Name */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "4px",
                      paddingBottom: "4px",
                      borderBottom: isDarkMode
                        ? "1px solid rgba(255, 255, 255, 0.05)"
                        : "1px solid rgba(0, 0, 0, 0.05)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: isDarkMode ? "#b0b0b0" : "#666",
                      }}
                    >
                      Broker Name
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "500",
                        color: isDarkMode ? "#e0e0e0" : "#333",
                      }}
                    >
                      {orderData?.brokerName || "-"}
                    </span>
                  </div>

                  {/* Broker Order Date */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "4px",
                      paddingBottom: "4px",
                      borderBottom: isDarkMode
                        ? "1px solid rgba(255, 255, 255, 0.05)"
                        : "1px solid rgba(0, 0, 0, 0.05)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: isDarkMode ? "#b0b0b0" : "#666",
                      }}
                    >
                      Broker Order Date
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "500",
                        color: isDarkMode ? "#e0e0e0" : "#333",
                      }}
                    >
                      {orderData?.brokerOrderDate
                        ? new Date(orderData.brokerOrderDate).toLocaleString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                              hour12: true,
                            }
                          )
                        : "-"}
                    </span>
                  </div>

                  {/* Broker Order Response - New Design with Colors */}
                  {(() => {
                    const responseStatus = getResponseStatus(
                      orderData?.brokerOrderResponse
                    );
                    return (
                      <div
                        style={{
                          marginTop: "8px",
                          marginBottom: "0px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "6px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: "600",
                                color: isDarkMode ? "#b0b0b0" : "#666",
                              }}
                            >
                              Broker Order Response
                            </span>
                            {orderData?.brokerOrderResponse &&
                              orderData.brokerOrderResponse !== "-" && (
                                <span
                                  style={{
                                    fontSize: "9px",
                                    fontWeight: "700",
                                    padding: "2px 6px",
                                    borderRadius: "3px",
                                    background: responseStatus.badgeBg,
                                    color: responseStatus.badgeColor,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                  }}
                                >
                                  {responseStatus.badgeText}
                                </span>
                              )}
                          </div>
                          {orderData?.brokerOrderResponse &&
                            orderData.brokerOrderResponse !== "-" && (
                              <button
                                type="button"
                                onClick={() =>
                                  copyToClipboard(orderData.brokerOrderResponse)
                                }
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "2px 6px",
                                  fontSize: "10px",
                                  background: isDarkMode
                                    ? "rgba(255, 255, 255, 0.1)"
                                    : "rgba(0, 0, 0, 0.05)",
                                  border: isDarkMode
                                    ? "1px solid rgba(255, 255, 255, 0.2)"
                                    : "1px solid rgba(0, 0, 0, 0.1)",
                                  borderRadius: "3px",
                                  color: isDarkMode ? "#e0e0e0" : "#333",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = isDarkMode
                                    ? "rgba(255, 255, 255, 0.15)"
                                    : "rgba(0, 0, 0, 0.1)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = isDarkMode
                                    ? "rgba(255, 255, 255, 0.1)"
                                    : "rgba(0, 0, 0, 0.05)";
                                }}
                                title="Copy to clipboard"
                              >
                                <FiCopy size={10} />
                                Copy
                              </button>
                            )}
                        </div>
                        {orderData?.brokerOrderResponse &&
                        orderData.brokerOrderResponse !== "-" ? (
                          <div
                            style={{
                              background: isDarkMode
                                ? "rgba(0, 0, 0, 0.3)"
                                : "rgba(248, 249, 250, 0.9)",
                              border: isDarkMode
                                ? "1px solid rgba(255, 255, 255, 0.1)"
                                : "1px solid rgba(0, 0, 0, 0.1)",
                              borderRadius: "4px",
                              padding: "8px",
                              maxHeight: "200px",
                              overflowY: "auto",
                              overflowX: "auto",
                              wordBreak: "break-word",
                              fontSize: "11px",
                              fontFamily: "monospace",
                              lineHeight: "1.5",
                              color: isDarkMode ? "#e0e0e0" : "#333",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {highlightKeywords(
                              formatJSON(orderData.brokerOrderResponse)
                            )}
                          </div>
                        ) : (
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: "500",
                              color: isDarkMode ? "#b0b0b0" : "#999",
                              fontStyle: "italic",
                            }}
                          >
                            No response available
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </Tab>

              {/* Actions Tab - Edit and Exit */}
              {!hideExitButton && (
                <Tab
                  eventKey="actions"
                  title="Actions"
                  style={{ fontSize: "12px", padding: "4px 8px" }}
                >
                  <div
                    style={{
                      marginTop: "4px",
                      padding: "6px",
                      background: isDarkMode
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(248, 249, 250, 0.8)",
                      borderRadius: "4px",
                      border: isDarkMode
                        ? "1px solid rgba(255, 255, 255, 0.1)"
                        : "1px solid rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    {/* Action Buttons - Edit and Exit */}
                    <div
                      style={{
                        display: "flex",
                        gap: "4px",
                        marginBottom: "6px",
                        flexWrap: "wrap",
                        justifyContent: "center",
                      }}
                    >
                      {isEditable === 1 && !hideExitButton && (
                        <button
                          type="button"
                          className={`btn ${
                            showEditForm ? "btn-warning" : "btn-info"
                          }`}
                          onClick={() => {
                            setShowEditForm(!showEditForm);
                            setShowExitForm(false); // Close exit form if open
                            if (!showEditForm && (socketData || orderData)) {
                              const dataToEdit = socketData || orderData;
                              if (dataToEdit) {
                                setOrderUpdateData({
                                  ...orderUpdateData,
                                  BrokerConfigID:
                                    dataToEdit?.brokerID ||
                                    orderData?.brokerConfigID,
                                  EntryPrice:
                                    dataToEdit?.entryPrice ||
                                    orderData?.entryPrice,
                                  IdentifierId:
                                    dataToEdit?.identifierId ||
                                    orderData?.identifierId,
                                  OrderID:
                                    dataToEdit?.orderID || orderData?.orderID,
                                  OrderType:
                                    dataToEdit?.orderType ||
                                    orderData?.orderType,
                                  ProductType:
                                    dataToEdit?.productType ||
                                    orderData?.productType,
                                  Quantity:
                                    dataToEdit?.quantity || orderData?.quantity,
                                  StopLossEstPrice:
                                    dataToEdit?.stopLossEstPrice ||
                                    orderData?.stopLossEstPrice,
                                  TakeProfitEstPrice:
                                    dataToEdit?.takeProfitEstPrice ||
                                    orderData?.takeProfitEstPrice,
                                  isStopLoss:
                                    dataToEdit?.isStopLoss !== undefined
                                      ? dataToEdit.isStopLoss
                                      : orderData?.isStopLoss !== undefined
                                      ? orderData.isStopLoss
                                      : true,
                                  isTakeProfit:
                                    dataToEdit?.isTakeProfit !== undefined
                                      ? dataToEdit.isTakeProfit
                                      : orderData?.isTakeProfit !== undefined
                                      ? orderData.isTakeProfit
                                      : false,
                                });
                              }
                            }
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                            minWidth: "70px",
                            justifyContent: "center",
                            padding: "4px 8px",
                            fontSize: "12px",
                          }}
                          title={
                            showEditForm
                              ? "Hide edit form"
                              : "Edit order details"
                          }
                        >
                          <FiEdit size={12} />
                          {showEditForm ? "Cancel" : "Edit"}
                        </button>
                      )}
                      {orderData?.orderID && !hideExitButton && (
                        <button
                          type="button"
                          className={`btn ${
                            showExitForm ? "btn-warning" : "btn-danger"
                          }`}
                          onClick={() => {
                            if (showExitForm) {
                              // If form is open, execute exit
                              handleOrderExit();
                            } else {
                              // Show exit form
                              setShowExitForm(true);
                              setShowEditForm(false); // Close edit form if open
                            }
                          }}
                          disabled={isExiting}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                            minWidth: "70px",
                            justifyContent: "center",
                            padding: "4px 8px",
                            fontSize: "12px",
                          }}
                        >
                          <HiOutlineLogout size={12} />
                          {isExiting
                            ? "Exiting..."
                            : showExitForm
                            ? "Confirm"
                            : "Exit"}
                        </button>
                      )}
                    </div>

                    {/* Exit Form - Show when Exit button is clicked */}
                    {showExitForm && orderData?.orderID && (
                      <div
                        style={{
                          marginTop: "11px",
                          padding: "11px",
                          background: "#f8d7da",
                          borderRadius: "4px",
                          border: "1px solid #dc3545",
                        }}
                      >
                        <h5
                          style={{
                            marginBottom: "11px",
                            color: "#721c24",
                            fontSize: "14px",
                          }}
                        >
                          Exit Order - Update SL/TG
                        </h5>

                        {/* Stop Loss */}
                        <div style={{ marginBottom: "11px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: "6px",
                            }}
                          >
                            <label
                              style={{
                                fontWeight: "600",
                                color: "#495057",
                                fontSize: "12px",
                              }}
                            >
                              Stop Loss (SL)
                            </label>
                            <label
                              className="toggle-switch blue"
                              style={{ margin: 0, transform: "scale(0.7)" }}
                            >
                              <input
                                type="checkbox"
                                name="isStopLoss"
                                checked={exitFormData.isStopLoss}
                                onChange={handleExitFormChange}
                              />
                              <span className="slider"></span>
                            </label>
                          </div>
                          {exitFormData.isStopLoss && (
                            <input
                              type="text"
                              name="StopLossEstPrice"
                              className="form-control text-input"
                              value={exitFormData.StopLossEstPrice || ""}
                              onChange={handleExitFormChange}
                              placeholder="Enter Stop Loss Price"
                              style={{
                                width: "100%",
                                padding: "2px 4px",
                                fontSize: "12px",
                                height: "20px",
                              }}
                            />
                          )}
                        </div>

                        {/* TGT */}
                        <div style={{ marginBottom: "11px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: "6px",
                            }}
                          >
                            <label
                              style={{
                                fontWeight: "600",
                                color: "#495057",
                                fontSize: "12px",
                              }}
                            >
                              TGT
                            </label>
                            <label
                              className="toggle-switch blue"
                              style={{ margin: 0, transform: "scale(0.7)" }}
                            >
                              <input
                                type="checkbox"
                                name="isTakeProfit"
                                checked={exitFormData.isTakeProfit}
                                onChange={handleExitFormChange}
                              />
                              <span className="slider"></span>
                            </label>
                          </div>
                          {exitFormData.isTakeProfit && (
                            <input
                              type="text"
                              name="TakeProfitEstPrice"
                              className="form-control text-input"
                              value={exitFormData.TakeProfitEstPrice || ""}
                              onChange={handleExitFormChange}
                              placeholder="Enter TGT Price"
                              style={{
                                width: "100%",
                                padding: "2px 4px",
                                fontSize: "12px",
                                height: "20px",
                              }}
                            />
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={handleOrderExit}
                            disabled={isExiting}
                            style={{ flex: 1 }}
                          >
                            {isExiting ? "Exiting..." : "Exit Order"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => {
                              setShowExitForm(false);
                            }}
                            style={{ flex: 1 }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Edit Form - Show when Edit button is clicked - Clean Compact Design */}
                    {showEditForm && isEditable === 1 && (
                      <div
                        style={{
                          marginTop: "4px",
                          padding: "6px",
                          background: isDarkMode
                            ? "rgba(255, 255, 255, 0.08)"
                            : "rgba(248, 249, 250, 0.9)",
                          backdropFilter: "blur(8px)",
                          WebkitBackdropFilter: "blur(8px)",
                          borderRadius: "4px",
                          border: isDarkMode
                            ? "1px solid rgba(255, 255, 255, 0.15)"
                            : "1px solid rgba(0, 0, 0, 0.12)",
                          boxShadow: isDarkMode
                            ? "0 2px 4px rgba(0, 0, 0, 0.2)"
                            : "0 2px 4px rgba(0, 0, 0, 0.08)",
                        }}
                      >
                        {/* Symbol and Price - Compact */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "4px",
                            paddingBottom: "4px",
                            borderBottom: isDarkMode
                              ? "1px solid rgba(255, 255, 255, 0.1)"
                              : "1px solid rgba(0, 0, 0, 0.1)",
                            fontSize: "12px",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: "600",
                              color: isDarkMode ? "#e0e0e0" : "#333",
                              fontSize: "12px",
                            }}
                          >
                            {socketData?.identifier || orderData?.identifier}
                          </span>
                          <span
                            className={
                              socketData?.priceChangePercentage > 0
                                ? "text-success"
                                : "text-danger"
                            }
                            style={{ fontWeight: "600", fontSize: "12px" }}
                          >
                            {socketData?.priceChangePercentage > 0 ? (
                              <IconRegistry name="caret-up" size={12} />
                            ) : (
                              <IconRegistry name="caret-down" size={12} />
                            )}
                            {socketData?.lastBuyPrice ||
                              orderData?.lastBuyPrice ||
                              "-"}
                          </span>
                        </div>

                        <form onSubmit={handleOrderSubmit}>
                          {/* Quantity, Stop Loss, TGT - Side by Side with Small Boxes */}
                          <div
                            style={{
                              display: "flex",
                              gap: "3px",
                              alignItems: "flex-start",
                              marginBottom: "4px",
                              flexWrap: "wrap",
                            }}
                          >
                            {/* Quantity */}
                            <div
                              style={{
                                flex: "1",
                                minWidth: "55px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "2px",
                              }}
                            >
                              <label
                                style={{
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  margin: 0,
                                  color: isDarkMode ? "#b0b0b0" : "#666",
                                }}
                              >
                                Quantity
                              </label>
                              <input
                                type="text"
                                name="Quantity"
                                className="form-control text-input"
                                value={orderUpdateData?.Quantity || ""}
                                onChange={handleOrderChange}
                                style={{
                                  width: "100%",
                                  padding: "2px 4px",
                                  fontSize: "12px",
                                  height: "20px",
                                  background: isDarkMode
                                    ? "rgba(255, 255, 255, 0.12)"
                                    : "#ffffff",
                                  border: isDarkMode
                                    ? "1px solid rgba(255, 255, 255, 0.25)"
                                    : "1px solid #dee2e6",
                                  color: isDarkMode ? "#e0e0e0" : "#333",
                                  borderRadius: "3px",
                                }}
                              />
                            </div>

                            {/* Stop Loss */}
                            {orderUpdateData?.iSAutoTrade === "true" ? (
                              <div
                                style={{
                                  flex: "1",
                                  minWidth: "55px",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "2px",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <label
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: "500",
                                      margin: 0,
                                      color: isDarkMode ? "#b0b0b0" : "#666",
                                    }}
                                  >
                                    Stop Loss
                                  </label>
                                  <label
                                    className="toggle-switch blue"
                                    style={{
                                      margin: 0,
                                      transform: "scale(0.7)",
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      name="isStopLoss"
                                      onChange={handleOrderChange}
                                      checked={
                                        orderUpdateData?.isStopLoss === true
                                      }
                                    />
                                    <span className="slider"></span>
                                  </label>
                                </div>
                                {orderUpdateData?.isStopLoss && (
                                  <input
                                    type="text"
                                    id="StopLossEstPrice"
                                    name="StopLossEstPrice"
                                    className="form-control text-input"
                                    value={
                                      orderUpdateData?.StopLossEstPrice || ""
                                    }
                                    onChange={handleOrderChange}
                                    placeholder="Est. Stock Price"
                                    style={{
                                      width: "100%",
                                      padding: "2px 4px",
                                      fontSize: "12px",
                                      height: "20px",
                                      background: isDarkMode
                                        ? "rgba(255, 255, 255, 0.12)"
                                        : "#ffffff",
                                      border: isDarkMode
                                        ? "1px solid rgba(255, 255, 255, 0.25)"
                                        : "1px solid #dee2e6",
                                      color: isDarkMode ? "#e0e0e0" : "#333",
                                      borderRadius: "3px",
                                    }}
                                  />
                                )}
                              </div>
                            ) : (
                              <div
                                style={{
                                  flex: "1",
                                  minWidth: "55px",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "2px",
                                }}
                              >
                                <label
                                  style={{
                                    fontSize: "12px",
                                    fontWeight: "500",
                                    margin: 0,
                                    color: isDarkMode ? "#b0b0b0" : "#666",
                                  }}
                                >
                                  Stop Loss
                                </label>
                                <input
                                  type="text"
                                  name="StopLossEstPrice"
                                  className="form-control text-input"
                                  value={
                                    orderUpdateData?.StopLossEstPrice || ""
                                  }
                                  onChange={handleOrderChange}
                                  style={{
                                    width: "100%",
                                    padding: "2px 4px",
                                    fontSize: "12px",
                                    height: "20px",
                                    background: isDarkMode
                                      ? "rgba(255, 255, 255, 0.12)"
                                      : "#ffffff",
                                    border: isDarkMode
                                      ? "1px solid rgba(255, 255, 255, 0.25)"
                                      : "1px solid #dee2e6",
                                    color: isDarkMode ? "#e0e0e0" : "#333",
                                    borderRadius: "3px",
                                  }}
                                />
                              </div>
                            )}

                            {/* TGT */}
                            <div
                              style={{
                                flex: "1",
                                minWidth: "55px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "2px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <label
                                  style={{
                                    fontSize: "12px",
                                    fontWeight: "500",
                                    margin: 0,
                                    color: isDarkMode ? "#b0b0b0" : "#666",
                                  }}
                                >
                                  TGT
                                </label>
                                <label
                                  className="toggle-switch blue"
                                  style={{ margin: 0, transform: "scale(0.7)" }}
                                >
                                  <input
                                    type="checkbox"
                                    name="isTakeProfit"
                                    onChange={handleOrderChange}
                                    checked={
                                      orderUpdateData?.isTakeProfit === true
                                    }
                                  />
                                  <span className="slider"></span>
                                </label>
                              </div>
                              {orderUpdateData?.isTakeProfit && (
                                <input
                                  type="text"
                                  id="TakeProfitEstPrice"
                                  name="TakeProfitEstPrice"
                                  className="form-control text-input"
                                  value={
                                    orderUpdateData?.TakeProfitEstPrice || ""
                                  }
                                  onChange={handleOrderChange}
                                  placeholder="Est. Stock Price"
                                  style={{
                                    width: "100%",
                                    padding: "2px 4px",
                                    fontSize: "12px",
                                    height: "20px",
                                    background: isDarkMode
                                      ? "rgba(255, 255, 255, 0.12)"
                                      : "#ffffff",
                                    border: isDarkMode
                                      ? "1px solid rgba(255, 255, 255, 0.25)"
                                      : "1px solid #dee2e6",
                                    color: isDarkMode ? "#e0e0e0" : "#333",
                                    borderRadius: "3px",
                                  }}
                                />
                              )}
                            </div>
                          </div>

                          {/* Update Button - Clean Design */}
                          <button
                            type="submit"
                            className="btn btn-success"
                            disabled={isOrderLoading}
                            style={{
                              width: "100%",
                              padding: "4px 8px",
                              fontSize: "12px",
                              marginTop: "2px",
                              height: "24px",
                              lineHeight: "1.2",
                              fontWeight: "500",
                            }}
                          >
                            {isOrderLoading ? "Updating..." : "Update Order"}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </Tab>
              )}
            </Tabs>
          )}
        </DialogContent>
        <DialogActions style={{ padding: "6px 10px" }}>
          <Button
            autoFocus
            onClick={handleClose}
            style={{
              fontSize: "12px",
              padding: "5px 12px",
              minWidth: "60px",
              fontWeight: "600",
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
};

export default EditOrder;
